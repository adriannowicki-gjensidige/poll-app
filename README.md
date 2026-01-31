# Poll App

A simple polling application with QR code access for public voting and an admin dashboard.

## Features

- **Public Voting**: Users scan a QR code to access polls - no login required
- **Anonymous Identity**: Uses localStorage to track voters (can return and change answers)
- **Admin Dashboard**: Password-protected area to manage polls, questions, and candidates
- **Live Results**: View voting results with visual charts
- **Autosave**: Votes are saved automatically with visual confirmation

## Quick Start

### 1. Set up a Database

**Option A: Neon (Recommended - Free, no install needed)**
1. Go to [neon.tech](https://neon.tech) and create a free account
2. Create a new project
3. Copy the connection string (looks like `postgresql://...@...neon.tech/...?sslmode=require`)
4. Paste it in `.env` as `DATABASE_URL`

**Option B: Supabase**
1. Go to [supabase.com](https://supabase.com) and create a project
2. Go to Settings → Database → Connection string (URI)
3. Paste it in `.env` as `DATABASE_URL`

**Option C: Docker (if installed)**
```bash
docker run --name poll-postgres -e POSTGRES_PASSWORD=postgres -e POSTGRES_DB=polldb -p 5432:5432 -d postgres:15
# Use: DATABASE_URL="postgresql://postgres:postgres@localhost:5432/polldb"
```

### 2. Configure Environment

Edit `.env`:
```env
DATABASE_URL="your-connection-string-here"
ADMIN_PASSWORD="your-secure-password"
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

### 3. Install & Run

```bash
# Install dependencies
npm install

# Generate Prisma client and push schema to database
npm run db:generate
npm run db:push

# Start development server
npm run dev
```

### 4. Access the App

- **Admin**: http://localhost:3000/admin (password from `.env`)
- **Public Poll**: http://localhost:3000/p/{slug} (after creating a poll)

## Usage

1. Login to admin at `/admin`
2. Create a new poll with a title and slug
3. Add questions (what you're voting on)
4. Add candidates/names (who can be voted for)
5. Share the QR code or link with participants
6. View results at any time in the admin dashboard

## Tech Stack

- **Next.js 14** (App Router)
- **Prisma** (ORM)
- **PostgreSQL** (Database)
- **Tailwind CSS** (Styling)
- **qrcode.react** (QR Code generation)
