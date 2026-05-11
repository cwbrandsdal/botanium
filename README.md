# Botanium ESP32 Controller

Replacement electronics and firmware for a Botanium-style self-watering planter.

The project uses an ESP32 to run a small watering controller. It creates a Wi-Fi setup portal, serves a local settings page, stores watering settings in SPIFFS, and drives a pump on a timed interval using an RV-8803 real-time clock interrupt.

## What It Does

- Controls a water pump from an ESP32 GPIO pin.
- Lets the user configure watering interval and pump duration from a web page.
- Stores settings on the ESP32 filesystem as `/settings.json`.
- Uses WiFiManager for first-time Wi-Fi provisioning.
- Exposes a WebSocket endpoint for saving and loading settings.
- Uses mDNS so the device can be reached as `http://mtnlab-botanium.local` on supported networks.
- Includes a simple over-the-air firmware upload page.

## Project Layout

```text
ESP32/
  platformio.ini      PlatformIO build configuration
  src/main.cpp        ESP32 firmware
  lib/                Bundled Arduino libraries used by the firmware
  include/            PlatformIO include folder
  test/               PlatformIO test folder

WEB/
  index.html          Standalone copy of the settings page
  script.js           Browser-side WebSocket/settings logic
  css/                Bootstrap CSS assets
  js/                 Bootstrap JS assets
```

## Hardware

The firmware is currently configured for an Adafruit Feather ESP32 board.

Default pins:

- Pump control: GPIO `21`
- RTC interrupt: GPIO `17`

The code expects a SparkFun Qwiic RV-8803 RTC connected over I2C.

## Network Behavior

On startup, the ESP32 uses WiFiManager:

1. If saved Wi-Fi credentials are available, it connects to the configured network.
2. If not, it starts a setup access point named `mtnLab-Botanium`.
3. After connecting, it starts the local web services.

Local services:

- Settings page: `http://mtnlab-botanium.local/` or the ESP32 IP address on port `80`
- Settings WebSocket: port `81`
- Firmware update page: port `82`

## Watering Settings

The web UI exposes two settings:

- `interval`: minutes between watering cycles
- `duration`: seconds to run the pump

Defaults are applied by the firmware if no saved settings file exists:

- Interval: `60` minutes
- Duration: `10` seconds

## Build and Upload

Install PlatformIO, then build from the `ESP32` directory:

```powershell
cd ESP32
pio run
```

Upload to the connected board:

```powershell
pio run --target upload
```

Open the serial monitor:

```powershell
pio device monitor
```

## Security Notes

Before deploying this outside a trusted local network, review these items:

- Change `wifiPortalPassword` in `ESP32/src/main.cpp` from the placeholder value.
- The firmware update server on port `82` is currently unauthenticated.
- The settings page and WebSocket endpoint do not require authentication.
- The hosted HTML references assets from `brandsdal.io` and public CDNs.

## Repository Notes

The `WEB` folder is a standalone copy of the web UI assets. The firmware also embeds the main HTML page in `ESP32/src/main.cpp`.
