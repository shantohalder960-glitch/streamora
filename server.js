require("dotenv").config();
const express = require("express");
const cors = require("cors");
const path = require("path");
const fs = require("fs");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const multer = require("multer");

const app = express();
const PORT = process.env.PORT || 3000;
const ROOT = __dirname;
const DATA_DIR = path.join(ROOT, "data");
const UPLOAD_DIR = path.join(ROOT, "uploads");
const DB_FILE = path.join(DATA_DIR, "db.json");
fs.mkdirSync(DATA_DIR, { recursive: true });
fs.mkdirSync(UPLOAD_DIR, { recursive: true });

const starter = [
  {id:"m1",title:"The Last Horizon",category:"Movies",type:"movie",year:2025,description:"A cinematic adventure beyond the edge of the known world.",poster:"https://images.unsplash.com/photo-1440404653325-ab127d49abc1?w=700",videoUrl:"",featured:true},
  {id:"s1",title:"City of Secrets",category:"Web Series",type:"series",year:2025,description:"Every street hides a story. Every secret has a price.",poster:"https://images.unsplash.com/photo-1489599849927-2ee91」と?w=700",videoUrl:"",featured:true},
  {id:"a1",title:"Neon Warriors",category:"Anime",type:"anime",year:2025,description:"A new generation rises in a world of neon and mystery.",poster:"https://images.unsplash.com/photo-1578632767115-351521b1e1b1?w=700",videoUrl:"",featured:false},
  {id:"n1",title:"শেষ বিকেলের গল্প",category:"Bangla Natok",type:"movie",year:2025,description:"একটি হৃদয়ছোঁয়া বাংলা নাটকের গল্প।",poster:"https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=700",videoUrl:"",featured:false},
  {id:"f1",title:"Small Wonders",category:"Short Films",type:"movie",year:2024,description:"A short film about the moments that change everything.",poster:"https://images.unsplash.com/photo-1485846234645-a62644f84728?w=700",videoUrl:"",featured:false},
  {id:"l1",title:"Streamora Live",category:"Live TV",type:"live",year:2025,description:"Add your authorized live HLS or stream URL in Admin.",poster:"https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=700",videoUrl:"",featured:false}
];
if (!fs.existsSync(DB_FILE)) fs.writeFileSync(DB_FILE, JSON.stringify({users:[],videos:starter}, null, 2));
const readDB=()=>JSON.parse(fs.readFileSync(DB_FILE,"utf8"));
const writeDB=db=>fs.writeFileSync(DB_FILE,JSON.stringify(db,null,2));
const secret=process.env.JWT_SECRET || "development-only-change-me";
function auth(req,res,next){
  const token=(req.headers.authorization||"").replace(/^Bearer\s+/,"");
  try { req.user=jwt.verify(token,secret); next(); } catch { res.status(401).json({error:"Please sign in"}); }
}
function admin(req,res,next){ if(req.user?.role!=="admin") return res.status(403).json({error:"Admin access required"}); next(); }
const storage=multer.diskStorage({destination:UPLOAD_DIR,filename:(req,file,cb)=>cb(null,Date.now()+"-"+file.originalname.replace(/[^a-zA-Z0-9._-]/g,"_"))});
const upload=multer({storage,limits:{fileSize:1024*1024*1024},fileFilter:(req,file,cb)=>{
  const ok=/^(video\/|image\/)/.test(file.mimetype);
  cb(ok?null:new Error("Only video or image files are allowed"),ok);
}});
app.use(cors());
app.use(express.json({limit:"2mb"}));
app.use("/uploads",express.static(UPLOAD_DIR));
app.use(express.static(ROOT));

app.get("/api/health",(req,res)=>res.json({ok:true,app:"Streamora"}));
app.get("/api/videos",(req,res)=>{
  const {category,search}=req.query; let items=readDB().videos;
  if(category && category!=="All") items=items.filter(v=>v.category===category);
  if(search) items=items.filter(v=>(v.title+" "+v.description).toLowerCase().includes(search.toLowerCase()));
  res.json(items);
});
app.get("/api/videos/:id",(req,res)=>{
  const v=readDB().videos.find(x=>x.id===req.params.id);
  if(!v) return res.status(404).json({error:"Not found"}); res.json(v);
});
app.post("/api/auth/login",async(req,res)=>{
  const {email,password}=req.body||{};
  const db=readDB(); const user=db.users.find(u=>u.email===email);
  if(!user || !(await bcrypt.compare(password||"",user.password))) return res.status(401).json({error:"Invalid email or password"});
  const token=jwt.sign({id:user.id,email:user.email,role:user.role},secret,{expiresIn:"7d"});
  res.json({token,user:{email:user.email,role:user.role}});
});
app.post("/api/auth/register",async(req,res)=>{
  const {email,password}=req.body||{};
  if(!email || !password || password.length<8) return res.status(400).json({error:"Email and password (8+ characters) required"});
  const db=readDB(); if(db.users.some(u=>u.email===email)) return res.status(409).json({error:"Account already exists"});
  const user={id:Date.now().toString(),email,password:await bcrypt.hash(password,10),role:"user"};
  db.users.push(user); writeDB(db);
  const token=jwt.sign({id:user.id,email:user.email,role:user.role},secret,{expiresIn:"7d"});
  res.status(201).json({token,user:{email:user.email,role:user.role}});
});
app.post("/api/admin/videos",auth,admin,upload.fields([{name:"video",maxCount:1},{name:"posterFile",maxCount:1}]),(req,res)=>{
  const db=readDB(), body=req.body;
  const item={id:Date.now().toString(),title:body.title||"Untitled",category:body.category||"Movies",type:body.type||"movie",
    year:Number(body.year)||new Date().getFullYear(),description:body.description||"",
    poster:req.files.posterFile?.[0]?"/uploads/"+req.files.posterFile[0].filename:(body.poster||""),
    videoUrl:req.files.video?.[0]?"/uploads/"+req.files.video[0].filename:(body.videoUrl||""),
    featured:body.featured==="true"};
  db.videos.unshift(item); writeDB(db); res.status(201).json(item);
});
app.put("/api/admin/videos/:id",auth,admin,(req,res)=>{
  const db=readDB(), v=db.videos.find(x=>x.id===req.params.id);
  if(!v) return res.status(404).json({error:"Not found"});
  Object.assign(v,req.body); writeDB(db); res.json(v);
});
app.delete("/api/admin/videos/:id",auth,admin,(req,res)=>{
  const db=readDB(), before=db.videos.length; db.videos=db.videos.filter(x=>x.id!==req.params.id);
  if(db.videos.length===before) return res.status(404).json({error:"Not found"});
  writeDB(db); res.json({ok:true});
});
app.use((err,req,res,next)=>res.status(400).json({error:err.message||"Upload failed"}));

async function boot(){
  const db=readDB(), email=process.env.ADMIN_EMAIL||"admin@streamora.local";
  if(!db.users.some(u=>u.email===email)){
    db.users.push({id:"admin-1",email,password:await bcrypt.hash(process.env.ADMIN_PASSWORD||"ChangeMe123!",10),role:"admin"});
    writeDB(db);
  }
  app.listen(PORT,()=>console.log(`Streamora running at http://localhost:${PORT}`));
}
boot();
