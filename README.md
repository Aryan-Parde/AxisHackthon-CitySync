# 🏙️ CitySync – Intelligent Urban Complaint Routing System

An AI-powered civic platform where citizens report city issues, AI classifies and routes them to the right authority, and tracks resolution in real-time.

## ✨ Features

- 📱 **Mobile OTP Authentication** – Passwordless login with 6-digit OTP
- 🤖 **AI-Powered Classification** – Google Gemini auto-classifies complaints
- 🗺️ **Mapbox Integration** – Interactive maps with markers, clusters, and heatmaps
- 🏷️ **Smart Priority Scoring** – Multi-factor priority algorithm (category + keywords + frequency + time)
- 🔄 **Duplicate Detection** – Geo-proximity + text similarity to merge similar complaints
- 📊 **Admin Analytics** – Charts, department performance, hotspot analysis
- 🔺 **Auto-Escalation** – SLA breach detection with PIL draft generation
- 🎨 **Premium Dark UI** – Glassmorphism design with smooth animations

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 15 (App Router), React, Tailwind CSS v4 |
| Backend | Node.js, Express.js |
| Database | MongoDB (Mongoose) with geospatial indexes |
| AI | Google Gemini API |
| Maps | Mapbox GL JS |
| Auth | Mobile OTP + JWT |
| Charts | Recharts |

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- MongoDB Atlas account (or local MongoDB)
- Mapbox access token
- Google Gemini API key

### 1. Clone & Install

```bash
# Backend
cd backend
npm install

# Frontend
cd ../frontend
npm install
```

### 2. Configure Environment

**Backend** (`backend/.env`):
```
PORT=5000
MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=your_secret_key
GOOGLE_GEMINI_API_KEY=your_gemini_key
MAPBOX_ACCESS_TOKEN=your_mapbox_token
```

**Frontend** (`frontend/.env.local`):
```
NEXT_PUBLIC_API_URL=http://localhost:5000/api
NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN=your_mapbox_token
```

### 3. Seed Database

```bash
cd backend
npm run seed
```

### 4. Start Development Servers

```bash
# Terminal 1: Backend (port 5000)
cd backend
npm run dev

# Terminal 2: Frontend (port 3000)
cd frontend
npm run dev
```

### 5. Open App
Visit **http://localhost:3000**

**Demo accounts:**
- Any mobile number works (OTP shown in backend console)
- Admin: +919999999999
- Citizen: +919876500000

## 📁 Project Structure

```
├── backend/
│   └── src/
│       ├── config/        # DB, env config
│       ├── controllers/   # Route handlers
│       ├── middleware/     # Auth, rate limit, error
│       ├── models/        # Mongoose schemas
│       ├── routes/        # API routes
│       ├── services/      # Business logic (AI, OTP, routing, escalation)
│       ├── utils/         # Helpers (geo, similarity, priority)
│       ├── server.js      # Entry point
│       └── seed.js        # Database seeder
│
├── frontend/
│   └── src/
│       ├── app/           # Next.js App Router pages
│       │   ├── auth/      # Login + OTP verify
│       │   ├── dashboard/ # Citizen dashboard, complaints, map
│       │   └── admin/     # Admin dashboard + analytics
│       ├── context/       # Auth context
│       └── lib/           # API client, utilities
```

## 🔌 API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/send-otp` | Send OTP to mobile |
| POST | `/api/auth/verify-otp` | Verify OTP & login |
| GET | `/api/auth/me` | Get current user |
| POST | `/api/complaints` | Submit complaint (AI pipeline) |
| GET | `/api/complaints` | User's complaints |
| GET | `/api/complaints/:id` | Complaint detail |
| GET | `/api/admin/dashboard` | Dashboard stats |
| GET | `/api/admin/analytics` | Analytics data |
| GET | `/api/map/complaints` | GeoJSON for map |
| GET | `/api/map/heatmap` | Heatmap data |

## 🧠 AI Pipeline

```
User Input → Gemini Classification → Embedding Generation → Duplicate Check
    → Priority Scoring → Department Routing → Notification
```

## 📊 Escalation Flow

```
Level 0: Ward Officer (24h) → Level 1: Zone Manager (48h)
    → Level 2: Commissioner (72h) → Level 3: PIL Auto-Draft (96h)
```

---
CitySync follows a modern full-stack architecture designed for scalability, real-time processing, and intelligent decision-making.

Frontend Layer
Built using Next.js 15 and React
Provides citizen dashboard, complaint submission portal, live map visualizations, and admin analytics

Backend Layer
Powered by Node.js and Express.js
Handles authentication, complaint processing, routing logic, escalation workflows, and API orchestration

AI Processing Layer
Google Gemini classifies complaint categories
Duplicate detection engine identifies overlapping complaints
Priority scoring engine ranks issues based on urgency and impact
Automated authority routing ensures complaints reach the relevant department

Data Layer
MongoDB with geospatial indexing for location-based queries
Stores complaints, users, escalation states, and analytics data

Visualization Layer
Mapbox for interactive maps and hotspot analysis
Recharts for analytical dashboards and department performance insights


--------

Innovation Highlights

AI-Powered Complaint Routing
Automatically classifies and routes complaints to the correct civic authority.
Smart Duplicate Detection
Reduces redundancy by merging complaints using geospatial and semantic similarity analysis.
Dynamic Priority Scoring
Evaluates complaints based on severity, recurrence, frequency, and temporal urgency.
Automated Escalation Workflow
Escalates unresolved complaints through multiple administrative levels.
PIL Draft Generation
Generates structured escalation documentation for unresolved civic issues.
Real-Time Civic Hotspot Intelligence
Identifies issue-dense regions through heatmap-based analytics.

---------
Future Scope

CitySync can be further enhanced through:
Multilingual complaint submission support
Voice-based issue reporting
Integration with municipal corporation APIs
Predictive issue forecasting using historical complaint data
Mobile app deployment for Android and iOS
AI-powered recommendation engine for preventive civic maintenance

---------
Built for **Axis Hackathon 2026** 🏆
