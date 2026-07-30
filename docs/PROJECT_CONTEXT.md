# Power Gym — Project Context

## Overview
Power Gym is a production-ready Gym Management System designed for a **single gym** (not multi-tenant). It manages members, subscriptions, payments, attendance (QR check-in), and automated WhatsApp notifications.

## Tech Stack

### Backend
- **Framework**: NestJS v11 (TypeScript)
- **ORM**: Prisma v7 with PostgreSQL 16
- **Auth**: JWT (passport-jwt) with Argon2 password hashing
- **Validation**: class-validator + class-transformer
- **Port**: 3001

### Frontend
- **Framework**: Next.js 16 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS v4 (PostCSS)
- **Charts**: Recharts
- **Port**: 3000

### Infrastructure
- **Database**: PostgreSQL 16 (Docker)
- **Container**: docker-compose.yml at project root

## Database Schema

| Model           | Purpose                                              |
|-----------------|------------------------------------------------------|
| Gym             | Single gym entity                                    |
| User            | Staff accounts (OWNER/RECEPTION/TRAINER)             |
| Member          | Gym members with QR codes                            |
| MembershipPlan  | Plan definitions (name, duration, price)             |
| Subscription    | Member↔Plan link with dates/status                  |
| Payment         | Payment records per subscription                     |
| Attendance      | Check-in records                                     |
| Notification    | WhatsApp notification log (WELCOME/EXPIRY/RENEWED)   |
| Expense         | Gym expense tracking                                 |

## Backend Module Status

| Module           | Status      | Key Endpoints                                    |
|------------------|-------------|--------------------------------------------------|
| Auth             | ✅ Complete  | POST /auth/login, POST /auth/register            |
| Members          | ✅ Complete  | CRUD + search + QR scan                          |
| Membership Plans | ✅ Complete  | CRUD                                             |
| Subscriptions    | ✅ Complete  | CRUD + renew                                     |
| Payments         | ✅ Complete  | CRUD                                             |
| Attendance       | ✅ Complete  | QR check-in + list                               |
| Dashboard        | ✅ Complete  | GET /dashboard/stats                             |
| Notifications    | ✅ Complete  | CRUD (WhatsApp integration is env-configured)    |
| Expenses         | ✅ Complete  | CRUD                                             |

## Frontend Status

| Feature             | Status       | Notes                                     |
|---------------------|-------------|-------------------------------------------|
| Login Page          | ✅ Complete  | JWT auth, redirect on success             |
| Dashboard           | ✅ Complete  | Stats, charts, recent members, alerts     |
| Members List        | ✅ Complete  | Search, pagination, delete                |
| Member Detail       | ✅ Complete  | Profile, subscriptions, attendance, modal |
| Add Member          | ✅ Complete  | Form with validation                      |
| Plans               | ✅ Complete  | CRUD with modal                           |
| Subscriptions       | ✅ Complete  | List, create, renew, filter               |
| Payments            | ✅ Complete  | List, record, filter by method            |
| Attendance          | ✅ Complete  | QR scan, manual, list                     |
| Expenses            | ✅ Complete  | CRUD with categories                      |
| Reports             | ✅ Complete  | Revenue/Attendance/Members charts         |
| Calendar            | ✅ Complete  | Monthly view with today's stats           |
| Notifications       | ✅ Complete  | Full list, filter by status, stats        |
| Settings            | ✅ Complete  | Gym info, WhatsApp config, about          |

## API Base URL
```
http://localhost:3001
```

Frontend proxies all `/api/proxy/*` calls to the backend via Next.js route handler at `app/api/proxy/[...path]/route.ts`.

## Environment Variables

### Backend (`backend/.env`)
```
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/power_gym
JWT_SECRET=<your-secret>
WHATSAPP_TOKEN=<your-token>
WHATSAPP_PHONE_ID=<your-phone-id>
```

### Frontend (`frontend/.env.local`)
```
NEXT_PUBLIC_API_URL=http://localhost:3001
```

## Quickstart

```bash
# 1. Start the database
docker compose up -d

# 2. Backend — install, migrate, seed, start
cd backend
npm install
npx prisma migrate dev --name init
npx prisma db seed         # admin@powergym.com / Admin123!
npm run start:dev

# 3. Frontend — install, start
cd ../frontend
npm install
npm run dev
```

Open http://localhost:3000 and log in with:
- **Email**: admin@powergym.com
- **Password**: Admin123!
