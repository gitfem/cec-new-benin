# Christ Embassy New Benin — Church of Excellence

Official website portal and native mobile web app for **Christ Embassy New Benin (Church of Excellence)** with **Pastor Joseph Atibi-Brown**.

---

## Features

- **Dual-Experience Portal:**
  - **Desktop / Tablet View (`/`):** Full-bleed hero carousel with authentic congregation photography, glassmorphic header with official Christ Embassy logo, Experience Cards, mosaic church identity section, video/sermon library, upcoming events, and comprehensive footer.
  - **Native Mobile View (`/mobile/`):** Auto-redirects phones and touchscreens directly into a native-feeling mobile app shell with top app bar, live streaming hero, and fixed bottom navigation bar (`Home`, `Live`, `Watch`, `Events`, `Stories`, `Menu`).
- **Interactive Live Streaming (`#/live`):** HLS stream player with YouTube channel switcher, member attendance check-in, real-time live chat with shoutbox, and floating mini-player.
- **Centralized Content:** All pages, slides, sermon links, events, and ministries are driven by `assets/data/content.json`.
- **Branding & Identity:**
  - Global Ministry: Christ Embassy, led by Rev. Dr. Chris Oyakhilome (President).
  - Local Church: Christ Embassy New Benin, pastored by Pastor Joseph Atibi-Brown.
  - Official Global Vision: *"To take the divine presence of God to the nations and peoples of the world; and to demonstrate the character of the Spirit."*

---

## Project Structure

```
├── index.html                   # Desktop Vue 3 app shell & mobile device auto-router
├── mobile/
│   ├── index.html               # Dedicated native mobile app shell
│   ├── style.css                # Mobile app styles & bottom navigation bar
│   └── app.js                   # Mobile Vue 3 controller & screen router
├── assets/
│   ├── css/
│   │   └── style.css            # Desktop styles, glassmorphism, responsive tokens
│   ├── js/
│   │   └── app.js               # Desktop Vue 3 app controller & routes
│   ├── data/
│   │   └── content.json         # CMS data schema for all church content
│   └── uploaded_media/          # Authentic congregation photography & official logo
└── bridge_*.php                 # Dynamic API endpoints for live chat, presence & login
```

---

## Getting Started

Run with any local web server:
```bash
# Python 3
python -m http.server 8080

# Or using npx serve
npx serve .
```

Access locally:
- Desktop Portal: `http://localhost:8080/?desktop=true`
- Native Mobile App: `http://localhost:8080/mobile/`
