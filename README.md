# DeskFlow

Remote control for an **aquarium light** and **aquarium filter** via ESP32 + Next.js + Supabase.

```text
User → Next.js dashboard (Supabase Auth + RLS)
ESP32 → HTTPS /api/v1/device/* (device key) → Next.js → Supabase (service role)
ESP32 GPIO 25 = Light, GPIO 26 = Filter (test LEDs now; relays later)
```

The ESP32 **never** talks to Supabase directly.

---

## Repository structure

```text
DeskFlow/
├── apps/web/                 # Next.js dashboard + device API
├── firmware/deskflow-esp32/  # PlatformIO ESP32 firmware
├── packages/shared/          # Shared TypeScript API/types
├── supabase/migrations/      # SQL schema + RLS
├── .env.example
└── README.md
```

---

## Supabase keys you need

From **Supabase → Project Settings → API**:

| Variable | Value | Where it goes |
|----------|-------|----------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Project URL | Local `.env.local` + Vercel env |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | `anon` `public` key | Local + Vercel (safe in browser; RLS protects data) |
| `SUPABASE_SERVICE_ROLE_KEY` | `service_role` key | Local + Vercel **server only** — never in ESP32, never in client JS, never in Git |

### Local

```bash
cp .env.example apps/web/.env.local
# paste the three values
```

### Vercel

1. Import the GitHub repo in Vercel
2. Set **Root Directory** to `apps/web`
3. Add Environment Variables (Production + Preview):

| Name | From Supabase |
|------|----------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | `anon` `public` |
| `SUPABASE_SERVICE_ROLE_KEY` | `service_role` (**secret**) |

4. Deploy
5. Set ESP32 `API_BASE_URL` to `https://your-deployment.vercel.app` (no trailing slash)
6. Re-flash the firmware

---

## 1. Database migration + RLS

In Supabase SQL Editor, run the full contents of:

[`supabase/migrations/20260320000000_init.sql`](supabase/migrations/20260320000000_init.sql)

This creates:

- `profiles` (auto on signup)
- `devices` (hashed device key, `last_seen`)
- `device_states` (`desired_*` vs `reported_*`)
- RLS so users only see their own rows

### Auth settings (recommended for MVP)

Authentication → Providers → Email:

- Enable Email
- For fastest local testing, you may disable “Confirm email”

---

## 2. Install and run the web app

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

---

## 3. Create account + device

1. Sign up with email/password
2. Sign in
3. Click **Create Aquarium Controller**
4. **Copy Device ID + Device Key immediately** (key shown once)
5. Put them in firmware `secrets.h`

---

## 4. ESP32 setup

See also [`firmware/deskflow-esp32/README.md`](firmware/deskflow-esp32/README.md).

```bash
cd firmware/deskflow-esp32
cp include/secrets.h.example include/secrets.h
```

Edit `secrets.h`:

```cpp
#define WIFI_SSID "..."
#define WIFI_PASSWORD "..."
#define DEVICE_ID "uuid-from-dashboard"
#define DEVICE_KEY "one-time-secret-from-dashboard"
#define API_BASE_URL "https://your-app.vercel.app"  // no trailing slash
```

Flash:

```bash
pio run -t upload
pio device monitor
```

### GPIO test

| GPIO | Function | MVP |
|------|----------|-----|
| 25 | Aquarium light | LED / meter |
| 26 | Aquarium filter | LED / meter |

Toggle Light/Filter on the dashboard; within ~5s the pins should follow.

---

## 5. Deploy to Vercel

Covered in **Supabase keys → Vercel** above. After deploy, point the ESP32 at your HTTPS URL and re-flash.

---

## Architecture notes

### Desired vs reported

| Field | Owner |
|-------|--------|
| `desired_light_on` / `desired_filter_on` | Dashboard (user) |
| `reported_light_on` / `reported_filter_on` | ESP32 via `POST /api/v1/device/report` |

Online status is derived only from `last_seen` (within 30 seconds).

### Device API

| Method | Path | Auth |
|--------|------|------|
| `GET` | `/api/v1/device/state` | `X-Device-Id` + `X-Device-Key` |
| `POST` | `/api/v1/device/report` | same |

Invalid credentials → generic `401` (no ID existence leak).

### Security

- Device secrets hashed (SHA-256) at rest
- Service role used only in server routes
- RLS on user tables
- `secrets.h` and `.env*` gitignored

---

## Replacing test GPIOs with relays later

No API or database changes required.

1. Wire relay module inputs to GPIO 25 / 26 (with appropriate power/isolation)
2. If your relays are **active-LOW**, set `OUTPUT_ACTIVE_HIGH` to `false` in `firmware/deskflow-esp32/include/outputs.h`
3. Keep using dashboard ON/OFF — `true` still means desired ON

Do not drive mains loads until you understand relay ratings and electrical safety.

---

## Out of scope (MVP)

MQTT, Redis, sensors, schedules, multi-device UX, magic links, ESP32→Supabase direct.
