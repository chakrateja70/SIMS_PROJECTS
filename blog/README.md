# Academic Projects Platform

Brand website, domain showcase, SEO knowledge hub and student lead-generation platform for a CSE/IT academic projects business, with an admin dashboard (CMS + enquiry CRM).

> **Business rule enforced by design:** there is no project catalogue anywhere in the data model or UI. Only technology **domains** are public. Project lists are shared privately after a student makes contact (WhatsApp or enquiry form).

## Architecture

```
Browser ──► Next.js 15 (frontend/)  ──server-side──►  FastAPI (backend/)  ──►  Neon PostgreSQL
            · SSG/ISR public pages                    · REST API, validation
            · /api/* proxy (cookie auth, CSRF check)  · JWT auth, roles, rate limits
            · /admin dashboard                        · uploads, first-party analytics
```

- **Public pages** are statically generated and refreshed with ISR (60–300 s). Any admin change triggers instant revalidation, so the site is fast and SEO-friendly while staying fully CMS-driven.
- **The browser never talks to FastAPI directly.** Forms post to Next.js route handlers, which forward the client IP (for rate limiting) and enforce same-origin checks. The admin JWT lives in an **HttpOnly, SameSite=Lax cookie** and is attached server-side.
- **The backend is the single source of truth** for brand, contact, WhatsApp number, homepage copy, SEO defaults and analytics IDs, all editable in **Admin → Website settings**.

## Project structure

```
blog/
├── backend/                     FastAPI service
│   ├── app/
│   │   ├── api/
│   │   │   ├── deps.py          role guards, shared helpers
│   │   │   └── routes/
│   │   │       ├── public.py    settings, domains, posts, enquiries, events
│   │   │       └── admin/       auth, dashboard, domains, posts, taxonomy, uploads,
│   │   │                        enquiries, site_settings, users
│   │   ├── core/                config (env), security (JWT, bcrypt, rate limiter)
│   │   ├── db/                  SQLAlchemy session + models
│   │   ├── schemas/             Pydantic schemas by feature
│   │   ├── services/            query helpers, site settings store
│   │   ├── seed/                first admin, domains, categories, starter articles
│   │   ├── utils/               text sanitising, slugs, reading time
│   │   └── main.py              app factory, middleware, error handlers
│   ├── tests/                   pytest suite (public + admin flows)
│   └── pyproject.toml           ruff + pytest config
├── frontend/                    Next.js 15 + TypeScript + Tailwind + Framer Motion
│   └── src/
│       ├── app/
│       │   ├── (site)/          public pages: home, domains, knowledge-hub, about, contact, legal
│       │   ├── admin/           login + (dashboard) pages
│       │   ├── api/             (public)/[resource], admin/[...path], auth, revalidate
│       │   ├── sitemap.ts, robots.ts, opengraph-image.tsx
│       ├── components/          admin/ analytics/ blog/ domains/ forms/ home/ layout/ seo/ ui/ whatsapp/
│       ├── constants/           accents, fallback settings
│       ├── lib/                 api/ (server content, proxy, admin client), analytics, whatsapp, utils, og
│       ├── types/               shared TypeScript types
│       └── middleware.ts        protects /admin
└── scripts/backup.sh            nightly DB + uploads backup with retention
```

## Local development

**Requirements:** Python 3.11+, Node 20+. Database: Neon PostgreSQL. Paste the Neon connection string into `backend/.env` as `DATABASE_URL` (as given; the `postgresql+psycopg` driver prefix is added automatically). For offline work, `sqlite:///./dev.db` also works.

```bash
# 1. API → http://localhost:8000  (docs at /docs)
cd backend
python -m venv .venv && . .venv/Scripts/activate      # macOS/Linux: source .venv/bin/activate
pip install -r requirements-dev.txt
cp .env.example .env                                  # edit ADMIN_EMAIL / ADMIN_PASSWORD
uvicorn app.main:app --reload

# 2. Website → http://localhost:3000   Admin → http://localhost:3000/admin
cd frontend
npm install
cp .env.example .env.local
npm run dev
```

On first start the API creates the admin account from `ADMIN_EMAIL`/`ADMIN_PASSWORD` and seeds 16 domains, 6 categories and 7 starter articles (only into empty tables). **Change the admin password** under Admin → My account.

### Quality checks

| | Command |
|---|---|
| Backend lint / format | `ruff check app tests` · `ruff format app tests` |
| Backend tests | `pytest` |
| Frontend types / lint | `npm run typecheck` · `npm run lint` |
| Frontend format | `npm run format` |
| Production build | `npm run build` |

## First things to configure (Admin → Website settings)

1. **Brand name** (placeholder: *Innovexa*), tagline and about text.
2. **WhatsApp number** with country code (e.g. `919876543210`). Every WhatsApp CTA uses it.
3. Email, phone, hours, social links.
4. **GTM / GA4 / Meta Pixel IDs** and the Google Search Console verification code.
5. Review the Privacy Policy and Terms pages (`frontend/src/app/(site)/privacy-policy`, `/terms`) with a legal adviser.

## Features

**Public site:** animated hero, domain showcase (each with a WhatsApp CTA prefilled with the domain name), "Why choose us", 4-step process, Knowledge Hub (search, category pages, tags, featured, trending, pagination, related posts, table of contents, reading time, share buttons), About, Contact (validated enquiry form, honeypot, optional WhatsApp hand-off), floating WhatsApp button, generated on-brand blog covers and OG images (no stock imagery), accessible markup (skip link, focus rings, reduced-motion support).

**Admin (role-based):**

| Role | Access |
|---|---|
| admin | everything, incl. settings & team |
| editor | blog posts, categories/tags, domains, uploads |
| support | enquiries |

Dashboard KPIs (new enquiries, WhatsApp clicks by domain/placement, conversion rate, article views, top posts), enquiry CRM (filters, status pipeline New → Contacted → Interested → Converted → Closed, internal notes, WhatsApp reply, CSV export), Markdown post editor (live preview, image upload, code blocks, tags, scheduling, featured flag, SEO title/description/keywords/slug with search preview), domain manager (icon/colour picker, technologies, custom WhatsApp text, ordering, visibility, homepage featuring), team management, password change.

**SEO:** per-page metadata, canonical URLs, Open Graph/Twitter cards, dynamic OG images, XML sitemap, robots.txt, Organization / WebSite / Article / BreadcrumbList / ItemList JSON-LD, `noindex` on filtered listings and admin, semantic HTML, `next/font`, `next/image` (AVIF/WebP).

**Security:** bcrypt password hashing, short-lived JWT in an HttpOnly cookie, role guards, same-origin checks on mutations, rate limits (enquiries 5/min, login 10/min, events 60/min), honeypot spam traps, server-side validation and HTML stripping, Markdown rendered **without** raw HTML, magic-byte upload validation (SVG rejected), CSV formula-injection protection, strict analytics-ID validation before script injection, security headers, production config guard (refuses weak `JWT_SECRET` or SQLite).

**Analytics events** (sent to GTM/GA4/Pixel when configured, and logged first-party for the dashboard): `whatsapp_click`, `generate_lead`, `enquiry_submit`, `share`, `article_read`, `post_view`. Mark `generate_lead` as a conversion in GA4.

## Deployment

**Option A, recommended:** Vercel (frontend) + Neon PostgreSQL + the FastAPI backend on Render, Railway or a VPS.

- Vercel env: `NEXT_PUBLIC_SITE_URL`, `API_URL` (public API URL), `REVALIDATE_SECRET`.
- API env: see `backend/.env.example`, with `ENVIRONMENT=production`, the Neon `DATABASE_URL` (pooled `-pooler` host recommended), a strong `JWT_SECRET`, `CORS_ORIGINS=https://yourdomain.com` and `PUBLIC_BASE_URL=https://api.yourdomain.com`.
- API start command: `uvicorn app.main:app --host 0.0.0.0 --port $PORT --workers 2 --proxy-headers`.
- Uploads are stored on local disk (`UPLOAD_DIR`). On platforms with ephemeral disks, attach a persistent disk at that path.

**Option B, single VPS:** run the API with `uvicorn` (as above, port 8000) and the website with `npm run build && npm start` (port 3000), each under a process manager such as systemd or pm2. Put Caddy or Nginx in front for HTTPS (`yourdomain.com → :3000`, `api.yourdomain.com → :8000`).

**Scheduled posts** go live automatically within the ISR window (≤ 5 min). To publish exactly on time, call `POST /api/revalidate?secret=…` from a cron job every minute.

**Backups:** Neon provides point-in-time restore. `scripts/backup.sh` additionally takes a `pg_dump` of Neon and archives uploads with 14-day retention; schedule it with cron and copy `backups/` off-server.

**Schema changes:** tables are created automatically on startup. Once the site is live, adopt Alembic for migrations before changing existing columns.
