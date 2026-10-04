# Streamora

A responsive video-streaming platform starter with a public catalogue, search/category browsing, playback, user registration/login, and an admin upload dashboard.

## Requirements
- Node.js 18 or newer
- npm

## Run locally
1. Extract the ZIP and open a terminal in the project folder.
2. Install dependencies:
   ```bash
   npm install
   ```
3. Copy `.env.example` to `.env`.
4. Change `JWT_SECRET` and `ADMIN_PASSWORD` in `.env`.
5. Start:
   ```bash
   npm start
   ```
6. Visit http://localhost:3000

## Admin
Default local admin values (change these in `.env` before deployment):
- Email: `admin@streamora.local`
- Password: `ChangeMe123!`

Click the round `S` button in the header, then sign in as admin. Add a title, category, poster and either upload a video or provide a direct MP4/HLS URL.

## Features
- Responsive dark OTT-style interface
- Movies, Web Series, Anime, Bangla Natok, Live TV, Short Films categories
- Search, catalogue cards and video player
- User sign-up and sign-in (JWT)
- Admin-only content upload, edit API and delete
- Local video/image uploads served from `/uploads`
- JSON file persistence in `data/db.json`

## Important production notes
This is a working starter project, not a production-scale OTT infrastructure. Before public launch:
- Replace the JSON file database with PostgreSQL/MySQL and add backups.
- Store media in object storage/CDN; do not rely on a single server disk for large audiences.
- Use a transcoding pipeline (HLS/DASH, multiple bitrates) for adaptive streaming. The built-in player supports direct browser-compatible MP4 and HLS URLs; native HLS support varies by browser.
- Add HTTPS, rate limiting, stronger password policy, email verification, password reset, audit logs, and secure secret management.
- Configure upload limits and malware scanning for your deployment.
- Only upload or stream content you own or are licensed to distribute. Live TV requires an authorized stream URL.
- The sample poster URLs are remote demo imagery and may be changed in Admin.

## API overview
- `GET /api/health`
- `GET /api/videos?category=Movies&search=term`
- `GET /api/videos/:id`
- `POST /api/auth/register`
- `POST /api/auth/login`
- `POST /api/admin/videos` (admin token; multipart form)
- `PUT /api/admin/videos/:id` (admin token; JSON)
- `DELETE /api/admin/videos/:id` (admin token)

The included JSON store is suitable for a demo/small test, not concurrent production use.
