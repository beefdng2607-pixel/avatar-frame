# Avatar Frame Campaign Platform

> Production-ready monorepo platform for creating, hosting, and running 1080x1080 avatar frame campaigns with 100% client-side photo processing.

---

## 🚀 Key Features & Highlights

- 🖼️ **1080×1080 PNG Campaign Frames**: Transparent RGBA frame overlay at exactly 1:1 aspect ratio.
- 🔒 **100% Client-Side Processing**: User photos are transformed, rendered, and exported strictly inside the user's web browser using HTML Canvas. **User images are never uploaded or stored on backend servers**.
- 🤏 **Touch & Gesture Image Editor**: Pan (1-finger drag), Pinch-to-Zoom (2-finger pinch), 0–360° Rotation, and Reset controls. Mobile-first support for iOS Safari, Android Chrome, and Zalo in-app browser.
- 📱 **Zalo Profile Guidance**: Clear 3-step guide for users to manually update their downloaded 1080p PNG avatar in the Zalo mobile app.
- 🔑 **Secure Admin Panel**: JWT authentication via HttpOnly cookies, status gating (`draft`, `active`, `expired`, `disabled`), automatic slugification, client-side 1080x1080 PNG validation, and downloadable QR code generation.
- 📊 **Engagement Analytics**: Real-time tracking of campaign views, client-side renders, and avatar downloads.

---

## 🛠️ Technology Stack

| Layer | Technologies |
|---|---|
| **Frontend** | React 18, TypeScript, Vite, Tailwind CSS, HTML Canvas API, React Router v7 |
| **Backend** | Node.js, Express, TypeScript, Zod, Multer, Helmet, Rate Limiting, bcrypt, JWT |
| **Database** | MongoDB 7 + Mongoose ORM |
| **Storage** | Local filesystem (dev) / S3-compatible Object Storage (prod) |
| **DevOps** | Docker, Docker Compose, Nginx, Multi-stage builds |

---

## 📁 Repository Structure

```
avatar-frame/
├── packages/
│   └── shared/               # Shared TypeScript interfaces (Campaign, Admin, Analytics)
├── apps/
│   ├── api/                  # Express REST API
│   │   ├── src/
│   │   │   ├── controllers/  # Auth, Campaign, Analytics handlers
│   │   │   ├── middleware/   # JWT Auth, Error Handler, 404
│   │   │   ├── models/       # Mongoose Schemas (Admin, Campaign, AnalyticsEvent)
│   │   │   ├── routes/       # Express Routers
│   │   │   ├── services/     # Storage Service (Local / S3), Admin Seeder
│   │   │   └── utils/        # Env Zod validation, PNG 1080x1080 header validator
│   │   └── Dockerfile
│   └── web/                  # React + Vite Frontend
│       ├── src/
│       │   ├── canvas/       # AvatarCanvasEngine (1080x1080 rendering & export)
│       │   ├── components/   # Admin & User UI components
│       │   ├── hooks/        # useCanvasInteraction (touch gestures)
│       │   ├── pages/        # Campaign landing page & Admin pages
│       │   ├── services/     # API client functions
│       │   └── stores/       # AuthContext & state management
│       ├── nginx.conf
│       └── Dockerfile
├── docker-compose.yml        # Local dev DB (Mongo + Mongo Express UI)
├── docker-compose.prod.yml   # Production orchestration (API + Nginx Web + Mongo)
└── package.json              # Monorepo root workspace configuration
```

---

## ⚡ Quickstart Guide (Local Development)

### Prerequisites
- Node.js >= 20.0.0
- Docker & Docker Compose

### 1. Clone & Install Dependencies
```bash
git clone <repo-url>
cd avatar-frame
npm install
```

### 2. Start Local MongoDB
```bash
docker-compose up -d
```
> MongoDB runs on `localhost:27017` and Mongo Express UI on `http://localhost:8081` (user: `admin`, pass: `devpassword`).

### 3. Start Development Servers
```bash
npm run dev
```
- **Frontend App**: `http://localhost:3000`
- **Backend API**: `http://localhost:4000`

---

## 🔐 Default Admin Credentials

On initial startup, the API server automatically seeds the initial admin account if the database is empty:

- **Email**: `admin@example.com`
- **Password**: `admin123456`
- **Login URL**: `http://localhost:3000/admin`

---

## 🌐 Public Campaign Flow

Users access a campaign via its slug:
```
http://localhost:3000/c/:slug
```

**Example**:
1. Go to `http://localhost:3000/admin` and log in.
2. Click **Create Campaign** with name `Summer Festival 2026` (slug: `summer-festival-2026`).
3. Upload a 1080×1080 PNG frame and click **Publish**.
4. Open `http://localhost:3000/c/summer-festival-2026`.
5. Upload photo, adjust (drag & pinch zoom), and click **Download Avatar**.

---

## 📡 API Endpoints Overview

### Public
- `GET /api/campaigns/:slug` — Get public active campaign metadata.
- `POST /api/analytics` — Ingest analytics event (`campaign_view`, `image_render`, `image_download`).

### Auth
- `POST /api/auth/login` — Login admin & receive HttpOnly JWT cookie.
- `POST /api/auth/logout` — Clear HttpOnly cookie.
- `GET /api/auth/me` — Return current admin profile.

### Admin (JWT Cookie Protected)
- `GET /api/admin/campaigns` — List campaigns (with search & status filter).
- `POST /api/admin/campaigns` — Create campaign.
- `GET /api/admin/campaigns/:id` — Get campaign details.
- `PUT /api/admin/campaigns/:id` — Update campaign details.
- `DELETE /api/admin/campaigns/:id` — Delete campaign & frame file.
- `POST /api/admin/campaigns/:id/frame` — Upload 1080x1080 PNG frame file.
- `DELETE /api/admin/campaigns/:id/frame` — Remove frame file.
- `GET /api/admin/analytics/summary` — Get aggregated engagement metrics.

---

## 🐳 Production Deployment (Docker Compose)

### 1. Configure Environment Variables (`.env`)
Create a `.env` file at the root directory:
```env
MONGO_ROOT_USER=admin
MONGO_ROOT_PASSWORD=your_secure_password
JWT_SECRET=your_32_character_long_secret_string
CORS_ORIGIN=http://your-domain.com
ADMIN_EMAIL=admin@your-domain.com
ADMIN_PASSWORD=your_admin_password
STORAGE_PROVIDER=local
```

### 2. Launch Production Stack
```bash
docker-compose -f docker-compose.prod.yml up -d --build
```
Your application will be live on port `80` with Nginx handling SPA routing, static caching, and API proxying.

---

## 🧪 Verification Commands

```bash
# Type check all workspaces
npm run typecheck

# Lint all workspaces
npm run lint

# Production build
npm run build
```
