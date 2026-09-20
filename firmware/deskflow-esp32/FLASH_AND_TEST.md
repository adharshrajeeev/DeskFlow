# How to flash DeskFlow to your ESP32 and see Light ON/OFF

## What "ON" looks like

The firmware does **not** blink forever. When you click **Light ON**, GPIO 25 goes **HIGH** (LED stays lit). **Light OFF** → GPIO 25 **LOW** (LED off). Same for Filter on GPIO 26.

## Wire a test LED (Light = GPIO 25)

```text
ESP32 3V3 ──(not used for this simple test)──
ESP32 GPIO 25 ──► 220Ω resistor ──► LED anode (+)
LED cathode (-) ──► ESP32 GND
```

Optional second LED for Filter on **GPIO 26** the same way.

## Flash with PlatformIO

1. Install [VS Code](https://code.visualstudio.com/) + **PlatformIO IDE** extension  
   (or install `pio` CLI: https://platformio.org/install/cli)

2. Copy secrets:

```bash
cd firmware/deskflow-esp32
copy include\secrets.h.example include\secrets.h
```

3. Edit `include/secrets.h`:

```cpp
#define WIFI_SSID "YourWiFi"
#define WIFI_PASSWORD "YourWiFiPassword"
#define DEVICE_ID "paste-from-dashboard"
#define DEVICE_KEY "paste-from-dashboard"
// Use your PC LAN IP while developing locally (ESP cannot reach localhost)
#define API_BASE_URL "http://192.168.x.x:3000"
// After Vercel deploy, switch to:
// #define API_BASE_URL "https://your-app.vercel.app"
```

Find your PC IP: `ipconfig` → IPv4 (same Wi‑Fi as the ESP32).

4. Plug ESP32 via USB. In VS Code open `firmware/deskflow-esp32`, then:

- PlatformIO → **Upload**
- PlatformIO → **Monitor** (115200 baud)

Or CLI:

```bash
pio run -t upload
pio device monitor
```

5. On the dashboard click **Light ON** → LED on pin 25 should light within ~5 seconds. **OFF** → LED goes dark. Status should show **Online**.

## If nothing happens

- Dashboard shows **Offline** → ESP not reaching API (wrong `API_BASE_URL`, Wi‑Fi, or firewall blocking port 3000)
- Serial monitor shows HTTP errors → check Device ID/Key
- LED never lights → check resistor/LED polarity/GPIO 25
