# 🎬 Movie Diary

> Every movie. Every memory. Every date.

A romantic digital diary for two people to save memories of movies they watched together. Built with Next.js 15, Cloudflare D1, and the TMDb API.

---

## ✨ Features

- **TMDb auto-fill** — search any movie and poster, genre, runtime & overview fill automatically
- **5-step diary form** — movie details → ratings → memories → mood → photos
- **Scrapbook UI** — warm parchment aesthetic, handwriting font, floating hearts
- **Timeline** — browse entries grouped by year and month
- **Statistics** — charts for genre, monthly activity, rating distribution
- **Achievements** — unlock badges as you watch more movies together
- **Random memory** — "Surprise me" opens a random past entry
- **Full REST API** — Cloudflare Workers + D1 + R2

---

## 🚀 Quick Start

### 1. Install dependencies

```bash
npm install
```

### 2. Get a TMDb API key (free)

1. Sign up at [themoviedb.org](https://www.themoviedb.org/signup)
2. Go to Settings → API → Request an API key (free tier works fine)
3. Copy your API key (v3 auth)

### 3. Create `.env.local`

```bash
cp .env.example .env.local
```

Edit `.env.local`:
```
NEXT_PUBLIC_TMDB_API_KEY=your_tmdb_api_key_here
```

### 4. Set up Cloudflare D1

```bash
# Install wrangler if needed
npm install -g wrangler
wrangler login

# Create D1 database
wrangler d1 create movie-diary-db

# Copy the database_id output into wrangler.toml under [[d1_databases]]
```

Update `wrangler.toml`:
```toml
[[d1_databases]]
binding = "DB"
database_name = "movie-diary-db"
database_id = "YOUR_DATABASE_ID_HERE"   # ← paste here
```

### 5. Run migrations

```bash
# Remote (production)
npm run db:migrate

# Local dev
npm run db:local
```

### 6. Seed demo data (optional but recommended)

```bash
# Remote
npm run db:seed

# Local
npm run db:seed:local
```

### 7. Start dev server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

---

## ☁️ Cloudflare Deployment

### Set up R2 (photo uploads)

```bash
wrangler r2 bucket create movie-diary-photos
```

### Deploy to Cloudflare Pages

```bash
npm run build
wrangler pages deploy .next --project-name movie-diary
```

Or connect your GitHub repo to Cloudflare Pages for automatic deploys.

### Set environment variables in Cloudflare dashboard

Go to Pages → your project → Settings → Environment variables:

```
NEXT_PUBLIC_TMDB_API_KEY = your_tmdb_api_key
```

---

## 📁 Project Structure

```
movie-diary/
├── app/
│   ├── api/
│   │   ├── entries/         # GET list, POST create
│   │   │   └── [id]/        # GET, PUT, DELETE single
│   │   ├── stats/           # GET stats
│   │   ├── random/          # GET random entry
│   │   ├── upload/          # POST photo upload
│   │   └── tmdb/            # TMDb proxy (search, movie details)
│   ├── add/                 # Add entry form (5-step)
│   ├── entries/             # Browse diary
│   │   └── [id]/            # Entry detail / scrapbook view
│   ├── timeline/            # Year/month timeline
│   └── stats/               # Statistics + achievements
├── components/
│   ├── diary/               # StarRating, EntryCard, TMDbSearch, MoodPicker, PhotoUpload
│   └── layout/              # Navbar
├── database/
│   ├── migrations/          # SQL migrations
│   └── seed.sql             # 10 demo entries
├── hooks/                   # use-entries, use-toast
├── lib/                     # db helpers, tmdb client, utils
├── store/                   # Zustand store
├── types/                   # TypeScript types
└── wrangler.toml            # Cloudflare config
```

---

## 🔧 Commands

| Command | Description |
|---|---|
| `npm run dev` | Start dev server |
| `npm run build` | Build for production |
| `npm run db:migrate` | Apply migrations to remote D1 |
| `npm run db:seed` | Seed demo data to remote D1 |
| `npm run db:local` | Apply migrations to local D1 |
| `npm run db:seed:local` | Seed demo data to local D1 |
| `npm run deploy` | Build + deploy to Cloudflare Pages |

---

## 🐛 Troubleshooting

**TMDb search not working?**
- Make sure `NEXT_PUBLIC_TMDB_API_KEY` is set in `.env.local`
- The app shows a warning banner if the key is missing
- Free tier supports 40 req/10s — plenty for personal use

**Database errors?**
- Run `npm run db:local` to apply migrations locally
- Make sure the `database_id` in `wrangler.toml` matches your D1 instance

**Photos not uploading in production?**
- Create the R2 bucket: `wrangler r2 bucket create movie-diary-photos`
- Make sure R2 binding is in `wrangler.toml`

**Build errors?**
- The API routes use `@cloudflare/next-on-pages` runtime — they won't work in standard Node.js dev mode without wrangler
- For local dev, the DB calls gracefully return 503; use `wrangler pages dev` for full local Cloudflare emulation

---

## 📝 Notes

- All dates stored as `YYYY-MM-DD` strings in D1 (SQLite)
- Photos stored in Cloudflare R2; in dev without R2 they use placeholder picsum URLs
- TMDb API calls are server-side (API routes) to protect your key in production builds
