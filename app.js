const categories=["All","Movies","Web Series","Anime","Bangla Natok","Live TV","Short Films"];
let activeCategory="All", allVideos=[], token=localStorage.getItem("streamora_token"), user=JSON.parse(localStorage.getItem("streamora_user")||"null"), authMode="login";
const $=s=>document.querySelector(s);
const escapeHTML=s=>String(s??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
async function api(url,opts={}){const headers=opts.headers||{};if(token)headers.Authorization="Bearer "+token;if(!(opts.body instanceof FormData)&&opts.body)headers["Content-Type"]="application/json";const r=await fetch(url,{...opts,headers});const d=await r.json().catch(()=>({}));if(!r.ok)throw Error(d.error||"Something went wrong");return d}
function renderChips(){$("#chips").innerHTML=categories.map(c=>`<button class="chip ${c===activeCategory?"active":""}" data-cat="${c}">${c}</button>`).join("");document.querySelectorAll("[data-cat]").forEach(b=>b.onclick=()=>{activeCategory=b.dataset.cat;renderChips();renderVideos()})}
function card(v){return `<article class="movie-card" data-id="${escapeHTML(v.id)}"><div class="poster"><img loading="lazy" src="${escapeHTML(v.poster||"https://images.unsplash.com/photo-1485846234645-a62644f84728?w=600")}" alt="${escapeHTML(v.title)}" onerror="this.src='https://images.unsplash.com/photo-1485846234645-a62644f84728?w=600'"><span class="tag">${escapeHTML(v.category)}</span><span class="play-bubble">▶</span></div><h4>${escapeHTML(v.title)}</h4><small>${escapeHTML(v.year||"")} &nbsp;·&nbsp; ${v.type==="live"?"Live":"HD"}</small></article>`}
function renderVideos(){
 const q=$("#searchInput").value.trim().toLowerCase();let list=allVideos.filter(v=>(activeCategory==="All"||v.category===activeCategory)&&(!q||(v.title+" "+v.description).toLowerCase().includes(q)));
 const groups=activeCategory==="All"?categories.slice(1):[activeCategory];let html="";
 groups.forEach(cat=>{let items=list.filter(v=>v.category===cat);if(items.length)html+=`<div class="row-head"><h3>${cat}</h3><span>${items.length} titles</span></div><div class="movie-grid">${items.map(card).join("")}</div>`});
 $("#contentRows").innerHTML=html||'<div class="empty">No titles found. Add videos from the admin dashboard.</div>';
 document.querySelectorAll(".movie-card").forEach(el=>el.onclick=()=>openPlayer(el.dataset.id));
}
async function load(){try{allVideos=await api("/api/videos");renderChips();renderVideos()}catch(e){$("#contentRows").innerHTML='<div class="empty">Could not load the library. Please refresh.</div>'}}
function modal(id,show=true){$(id).classList.toggle("hidden",!show)}
function openAuth(mode="login"){authMode=mode;$("#authTitle").textContent=mode==="login"?"Sign in":"Create your account";$("#authSubmit").textContent=mode==="login"?"Sign in":"Create account";$("#authSwitch").innerHTML=mode==="login"?'New here? <a>Create an account</a>':'Already a member? <a>Sign in</a>';$("#authError").textContent="";modal("#authModal")}
$("#authSwitch").onclick=()=>openAuth(authMode==="login"?"register":"login");
$("#authForm").onsubmit=async e=>{e.preventDefault();const f=new FormData(e.target);try{const d=await api("/api/auth/"+authMode,{method:"POST",body:JSON.stringify({email:f.get("email"),password:f.get("password")})});token=d.token;user=d.user;localStorage.setItem("streamora_token",token);localStorage.setItem("streamora_user",JSON.stringify(user));modal("#authModal",false);updateUser()}catch(err){$("#authError").textContent=err.message}};
function updateUser(){$("#loginOpen").textContent=user?"Account":"Sign in";$("#avatar").textContent="S"}
function openPlayer(id){const v=allVideos.find(x=>x.id===id);if(!v)return;$("#playerTitle").textContent=v.title;$("#playerDesc").textContent=v.description||"";const url=v.videoUrl||"";$("#playerArea").innerHTML=url?`<video controls autoplay playsinline src="${escapeHTML(url)}"></video>`:`<div class="player-placeholder"><div><div style="font-size:42px">▶</div><b>Video is not available yet</b><p>Admin can add an MP4 or HLS stream URL for this title.</p></div></div>`;modal("#playerModal")}
$("#heroPlay").onclick=()=>document.querySelector("#browse").scrollIntoView({behavior:"smooth"});
$("#loginOpen").onclick=()=>openAuth("login");$("#joinBtn").onclick=()=>openAuth("register");
$("#searchToggle").onclick=()=>{$("#searchWrap").scrollIntoView({behavior:"smooth",block:"center"});$("#searchInput").focus()};
$("#searchInput").oninput=renderVideos;
$("#adminOpen").onclick=()=>{modal("#adminModal");$("#adminLogin").classList.toggle("hidden",!!(user&&user.role==="admin"));$("#uploadForm").classList.toggle("hidden",!(user&&user.role==="admin"));loadAdminList()};
$("#adminLoginBtn").onclick=()=>openAuth("login");
$("#uploadForm").onsubmit=async e=>{e.preventDefault();const fd=new FormData(e.target);fd.set("featured",e.target.featured.checked?"true":"false");try{await api("/api/admin/videos",{method:"POST",body:fd});e.target.reset();$("#uploadError").textContent="Added successfully.";await load();loadAdminList()}catch(err){$("#uploadError").textContent=err.message}};
async function loadAdminList(){if(!user||user.role!=="admin")return;$("#adminList").innerHTML=allVideos.map(v=>`<div><span>${escapeHTML(v.title)} <small>· ${escapeHTML(v.category)}</small></span><button data-delete="${escapeHTML(v.id)}">Delete</button></div>`).join("");document.querySelectorAll("[data-delete]").forEach(b=>b.onclick=async()=>{if(confirm("Delete this title?")){try{await api("/api/admin/videos/"+b.dataset.delete,{method:"DELETE"});await load();loadAdminList()}catch(e){alert(e.message)}}})}
document.querySelectorAll("[data-close]").forEach(b=>b.onclick=()=>{b.closest(".modal").classList.add("hidden");const video=$("#playerArea video");if(video)video.pause()});
document.querySelectorAll(".modal").forEach(m=>m.onclick=e=>{if(e.target===m)m.classList.add("hidden")});
document.querySelectorAll("nav [data-filter]").forEach(a=>a.onclick=()=>{activeCategory=a.dataset.filter;renderChips();renderVideos()});
load();if(user)updateUser();
