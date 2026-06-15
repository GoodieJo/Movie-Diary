# 🎬 Movie Diary

> Our story, one movie at a time.

A private, password-protected digital diary for two people to record memories of movies they've watched together. Built with Next.js 15, deployed on Cloudflare Pages, backed by D1 (SQLite) and R2 (photo storage).

---

## ✨ Features

- **🔒 Private diary cover** — a beautiful animated lock screen with floating particles, a daily quote, and a password-protected diary book. Only people who know the secret can enter.
- **📝 5-step entry form** — movie details, ratings, memories, mood, and photos
- **⭐ 10-point rating system** — rate together out of 10, with average shown automatically
- **🖼️ Manual poster & photo support** — paste any poster image URL; upload couple selfies, snacks, tickets, and more (stored in Cloudflare R2)
- **✏️ Full edit support** — update any field of an entry after saving, including poster, ratings, memories, mood, and photos (add/remove)
- **📚 Scrapbook-style browsing** — search, filter by genre/year, sort by date or rating
- **📅 Timeline view** — entries grouped by year and month
- **📊 Statistics dashboard** — total movies, genre breakdown, monthly activity, rating distribution, achievements/badges
- **🎲 Random memory** — "Surprise Me" opens a random past entry
- **🌸 Cozy scrapbook aesthetic** — cream/rose palette, handwriting fonts, paper textures, smooth Framer Motion animations
- **📱 Fully responsive** — works great on mobile, tablet, and desktop

---

## 🧱 Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 15 (App Router, TypeScript) |
| Styling | Tailwind CSS, custom scrapbook theme |
| Animation | Framer Motion |
| Forms | React Hook Form + Zod |
| State | Zustand |
| Charts | Recharts |
| Database | Cloudflare D1 (SQLite) — with local SQLite fallback via `@libsql/client` for dev |
| File storage | Cloudflare R2 |
| Hosting | Cloudflare Pages (Edge Runtime) |
| Auth | Custom password gate — PBKDF2-SHA256 (Web Crypto API), HttpOnly session cookie |

---

## 🔐 Authentication Model

This is **not** a multi-user login system — it's a single shared secret for two people.

- The diary password is **never stored in plaintext** anywhere, including code, env files, or the database.
- A **PBKDF2-SHA256 hash** (100,000 iterations) of the password is stored as `DIARY_PASSWORD_HASH`.
- On successful login, a **deterministic session token** (SHA-256 derived from the hash) is set as an `HttpOnly`, `Secure`, `SameSite=Strict` cookie, valid for 30 days.
- `middleware.ts` protects every route except the cover page (`/`) and the login/logout API routes — unauthenticated visitors are redirected to the cover.

---

## 📁 Project Structure

```
movie-diary/
├── middleware.ts             # Route protection (must stay at project root)
├── lib/
│   ├── auth.ts                # Password hashing & session verification (Web Crypto)
│   ├── db-adapter.ts          # D1 (edge) + local SQLite (dev) adapter
│   └── utils.ts                # Date formatting, mood/location emoji helpers
├── app/
│   ├── page.tsx                # 🔒 Diary cover / password gate
│   ├── home/page.tsx           # Diary home (Add / Browse / Stats / Surprise Me)
│   ├── add/page.tsx            # 5-step "new entry" form
│   ├── entries/
│   │   ├── page.tsx             # Browse diary (search/filter/sort)
│   │   └── [id]/
│   │       ├── page.tsx          # Entry detail (scrapbook view + photo lightbox)
│   │       └── edit/page.tsx     # Edit entry (incl. photo management)
│   ├── timeline/page.tsx       # Year/month timeline
│   ├── stats/page.tsx          # Charts + achievements
│   └── api/
│       ├── auth/
│       │   ├── login/route.ts   # Verify password, set session cookie
│       │   └── logout/route.ts  # Clear session cookie
│       ├── entries/
│       │   ├── route.ts          # GET (list), POST (create)
│       │   └── [id]/route.ts     # GET, PUT (update), DELETE
│       ├── photos/[id]/route.ts # DELETE a single photo
│       ├── upload/route.ts      # Upload photo to R2 + link to entry
│       ├── stats/route.ts       # Aggregated statistics
│       └── random/route.ts      # Random entry
├── components/
│   ├── auth/
│   │   ├── DiaryBook.tsx        # Animated diary cover/book + password form
│   │   └── FloatingParticles.tsx
│   ├── diary/
│   │   ├── EntryCard.tsx
│   │   ├── StarRating.tsx        # 10-point rating component
│   │   ├── MoodPicker.tsx
│   │   ├── PhotoUpload.tsx
│   │   └── PhotoGrid.tsx         # Photo lightbox + delete
│   └── layout/Navbar.tsx
├── database/
│   ├── migrations/
│   │   ├── 0001_initial_schema.sql
│   │   └── 0002_update_rating_max.sql   # Upgrades ratings to 1–10
│   └── seed.sql                  # 10 demo entries
├── scripts/
│   └── hash-password.mjs        # Generate DIARY_PASSWORD_HASH
└── wrangler.toml                 # Cloudflare bindings (D1, R2)
```

---

## 🚀 Local Development Setup

### 1. Install dependencies

```bash
npm install
```

### 2. Set your diary password

Generate a hash for your shared secret password:

```bash
node scripts/hash-password.mjs "your-secret-password"
```

This prints a hash in the format `iterations:saltHex:hashHex`. Copy it.

### 3. Create `.env.local`

```bash
cp .env.example .env.local
```

Edit `.env.local`:

```env
DIARY_PASSWORD_HASH=100000:your_salt_hex:your_hash_hex
```

> No TMDb key is needed — movie posters are added manually via URL.

### 4. Run the dev server

```bash
npm run dev
```

This automatically seeds a local SQLite database (`.local-db/movie-diary.db`) with 10 demo entries on first run.

Open [http://localhost:3000](http://localhost:3000) — you'll see the diary cover. Click the book and enter your password to continue.

---

## ☁️ Cloudflare Deployment

### 1. Create the D1 database

```bash
wrangler d1 create movie-diary-db
```

Copy the printed `database_id` into `wrangler.toml`:

```toml
[[d1_databases]]
binding = "DB"
database_name = "movie-diary-db"
database_id = "PASTE_YOUR_ID_HERE"
migrations_dir = "database/migrations"
```

### 2. Create the R2 bucket

```bash
wrangler r2 bucket create movie-diary-photos
```

Enable public access so uploaded photos render in the browser:

```bash
wrangler r2 bucket dev-url enable movie-diary-photos
```

Copy the public `pub-xxxxxxxx.r2.dev` URL — update it in `app/api/upload/route.ts` where the R2 URL is constructed.

### 3. Run migrations & seed data

```bash
wrangler d1 migrations apply movie-diary-db --remote
wrangler d1 execute movie-diary-db --remote --file=database/seed.sql
```

### 4. Set the diary password secret

```bash
wrangler pages secret put DIARY_PASSWORD_HASH
```

Paste the **same hash** generated in local setup (Step 2 above).

### 5. Connect to Cloudflare Pages (GitHub)

In **Cloudflare Dashboard → Workers & Pages → Create → Pages → Connect to Git**:

| Setting | Value |
|---|---|
| Framework preset | `Next.js` |
| Build command | `npx @cloudflare/next-on-pages@1` |
| Build output directory | `.vercel/output/static` |
| Node.js version | `20` |

### 6. Add bindings

In **Settings → Bindings**:

| Type | Variable name | Resource |
|---|---|---|
| D1 database | `DB` | `movie-diary-db` |
| R2 bucket | `PHOTOS_BUCKET` | `movie-diary-photos` |

### 7. Deploy

Push to GitHub — Cloudflare Pages builds and deploys automatically. After adding bindings for the first time, retry the deployment once from the **Deployments** tab.

---

## 🔧 NPM Scripts

| Command | Description |
|---|---|
| `npm run dev` | Seed local DB (if empty) + start dev server |
| `npm run build` | Production build |
| `npm run seed:local` | Manually seed local SQLite DB |
| `node scripts/hash-password.mjs "<pw>"` | Generate `DIARY_PASSWORD_HASH` |

---

## 🗄️ Database Schema

| Table | Purpose |
|---|---|
| `movies` | Title, poster URL, genre, runtime, overview |
| `diary_entries` | Date watched, ratings (1–10), memories, mood, location, snacks |
| `photos` | Photo URLs linked to a diary entry |

Migration `0002_update_rating_max.sql` upgrades the `your_rating`/`partner_rating` CHECK constraints from 1–5 to 1–10 while preserving existing data.

---

## 🐛 Troubleshooting

**Locked out / forgot password?**
Generate a new hash with `scripts/hash-password.mjs` and update both `.env.local` and the `DIARY_PASSWORD_HASH` Cloudflare secret (`wrangler pages secret put DIARY_PASSWORD_HASH`).

**Photos not displaying after upload?**
Ensure the R2 bucket has public access enabled (`wrangler r2 bucket dev-url enable movie-diary-photos`) and that the public URL in `app/api/upload/route.ts` matches your bucket's `pub-xxxx.r2.dev` domain.

**"Database not available" errors?**
Confirm the D1 binding is named exactly `DB` and migrations have been applied with `--remote`.

**Middleware/build errors mentioning "edge runtime"?**
`middleware.ts` must be at the **project root** (same level as `package.json`) with **no** `export const runtime` declaration — middleware is always edge by default.

**Can bypass the password / navbar accessible without login?**
Verify `middleware.ts` is at the project root and restart the dev server fully (`Ctrl+C` then `npm run dev`).

---

## 📝 Notes

- All dates are stored as `YYYY-MM-DD` strings.
- The session cookie is a deterministic hash — no server-side session store needed.
- Local dev uses a file-based SQLite database (`.local-db/`, gitignored) that mirrors the D1 schema automatically.