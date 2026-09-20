# DeskFlow ESP32 firmware

## Startup behavior (safe default)

On boot, **both GPIO 25 (light) and GPIO 26 (filter) are driven OFF** before Wi-Fi connects.

This avoids unpredictable switching if the board reboots or loses power.

## Failure behavior

| Condition | Behavior |
|-----------|----------|
| Wi-Fi lost | Keep last GPIO state; retry reconnect; do not rapidly toggle outputs |
| API unavailable | Keep last successfully applied state; retry next poll |
| Bad credentials | HTTP error logged; outputs unchanged |

## GPIO

| Pin | Role | MVP test | Later |
|-----|------|----------|-------|
| 25 | Aquarium light | LED / logic indicator | Relay module |
| 26 | Aquarium filter | LED / logic indicator | Relay module |

API `true` always means **desired ON**. Electrical polarity is handled in `setLight` / `setFilter` via `OUTPUT_ACTIVE_HIGH` in `outputs.h`.

## Secrets

1. Copy `include/secrets.h.example` → `include/secrets.h`
2. Fill Wi-Fi, `DEVICE_ID`, `DEVICE_KEY`, `API_BASE_URL`
3. Never commit `secrets.h`

## Build / flash

```bash
cd firmware/deskflow-esp32
pio run -t upload
pio device monitor
```

Use your Vercel HTTPS URL as `API_BASE_URL` (no trailing slash).
