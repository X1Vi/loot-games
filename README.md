<p align="center">
  <img src="https://img.shields.io/badge/LOOT-TERMINAL-%2300ff41?style=for-the-badge&logo=terminal&logoColor=%2300ff41&labelColor=%230a0a0f" alt="LOOT TERMINAL" />
</p>

<p align="center">
  <strong>Real-time free game &amp; deal aggregator — terminal-style.</strong><br/>
  Monitors <em>GamerPower</em>, <em>Epic Games</em>, <em>SteamDB</em>, <em>IsThereAnyDeal</em>, and <em>CheapShark</em>.<br/>
  <sub>100% client-side · Zero backend · Hosted on GitHub Pages</sub>
</p>

<p align="center">
  <a href="https://github.com/X1Vi/loot-games/actions/workflows/deploy.yml">
    <img src="https://img.shields.io/github/actions/workflow/status/X1Vi/loot-games/deploy.yml?branch=main&style=flat-square&color=%2300ff41&labelColor=%230a0a0f" alt="CI" />
  </a>
  <a href="./LICENSE">
    <img src="https://img.shields.io/badge/license-MIT-%2300ff41?style=flat-square&labelColor=%230a0a0f" alt="License" />
  </a>
  <img src="https://img.shields.io/badge/react-19-%2300ff41?style=flat-square&logo=react&labelColor=%230a0a0f" alt="React 19" />
  <img src="https://img.shields.io/badge/typescript-6-%2300ff41?style=flat-square&logo=typescript&labelColor=%230a0a0f" alt="TypeScript" />
  <img src="https://img.shields.io/badge/vite-8-%2300ff41?style=flat-square&logo=vite&labelColor=%230a0a0f" alt="Vite" />
</p>

---

## 🔍 Overview

**LOOT TERMINAL** is a unified, client-only web application that aggregates free game giveaways and game deals from five sources into a single terminal-themed dashboard. It was built by extracting, normalizing, and unifying the API calls from four open-source projects:

| Source Project | Purpose | Contributed APIs |
|---|---|---|
| [freebie-finder-bot](https://github.com/X1Vi/freebie-finder-bot) | Free game aggregator &amp; multi-channel notifier | GamerPower, SteamDB RSS, ITAD RSS |
| [lootscraper](https://github.com/X1Vi/lootscraper) | Multi-platform game/loot scraper &amp; bots | Epic Games Store API |
| [MercuryBot](https://github.com/X1Vi/MercuryBot) | Discord + Bluesky free game bot | Epic Games Store API (corroboration) |
| [PriceStalker](https://github.com/X1Vi/PriceStalker) | Self-hosted price tracker | CheapShark price/deal API |

> No backend, no database, no API keys — everything runs in your browser.

---

## ✨ Features

- **🎮 Free Games Explorer** — Browse current free game giveaways across GamerPower, Epic Games Store, SteamDB, and IsThereAnyDeal
- **💰 Deal Tracker** — Search and filter game deals via CheapShark with sortable columns and pagination
- **🖥️ Terminal UI** — Retro green-on-black terminal aesthetic with scanline overlay, monospace typography, and blinking cursor
- **⌨️ Keyboard Navigation** — `F1` / `F2` / `F3` to switch between tabs
- **📦 Zero Dependencies on Backend** — Pure static site, hostable anywhere (GitHub Pages, Netlify, Vercel, any CDN)
- **📱 Responsive** — Works on desktop, tablet, and mobile
- **♿ Accessible** — Semantic HTML, keyboard navigable

---

## 🚀 Quick Start

```bash
git clone https://github.com/X1Vi/loot-games.git
cd loot-games
npm install
npm run dev        # Start dev server at http://localhost:5173
```

### Build for Production

```bash
npm run build      # Outputs static files to ./dist
npm run preview    # Preview production build locally
```

The `dist/` directory is a fully self-contained static site. Drop it on any web server or CDN.

---

## 📡 API Sources

### 1. GamerPower (`gamerpower.ts`)
- **Endpoint:** `https://www.gamerpower.com/api/giveaways`
- **Method:** `GET` (JSON)
- **Returns:** Current free game giveaways with title, worth, platform, end date, thumbnail
- **Auth:** None (public, CORS-enabled)

### 2. Epic Games Store (`epicgames.ts`)
- **Endpoint:** `https://store-site-backend-static.ak.epicgames.com/freeGamesPromotions?locale=en-US&country=US&allowCountries=US`
- **Method:** `GET` (JSON)
- **Returns:** Current and upcoming free game promotions with images, slugs, dates
- **Auth:** None (public)

### 3. SteamDB (`rssfeeds.ts` — `fetchSteamDBFeed`)
- **RSS Feed:** `https://steamdb.info/upcoming/free/rss/`
- **Proxy:** Uses `rss2json.com` to convert RSS → JSON (CORS workaround)
- **Returns:** Upcoming free Steam game listings with store links

### 4. IsThereAnyDeal (`rssfeeds.ts` — `fetchITADFeed`)
- **RSS Feed:** `https://isthereanydeal.com/rss/free/`
- **Proxy:** Uses `rss2json.com` to convert RSS → JSON (CORS workaround)
- **Returns:** Free game deals across multiple storefronts

### 5. CheapShark (`cheapshark.ts`)
- **Endpoint:** `https://www.cheapshark.com/api/1.0/deals`
- **Method:** `GET` (JSON)
- **Params:** `storeID`, `pageNumber`, `pageSize`, `sortBy`, `upperPrice`, `lowerPrice`, `steamRating`, `metacritic`, `title`, `onSale`
- **Returns:** Game deals with prices, savings, ratings, redirect links
- **Auth:** None (public, CORS-enabled)

---

## 🏗️ Architecture

```
loot-terminal/
├── .github/workflows/
│   └── deploy.yml              # GitHub Pages auto-deploy
├── public/                      # Static assets
├── src/
│   ├── api/                     # API client modules
│   │   ├── gamerpower.ts        #   GamerPower giveaway API
│   │   ├── epicgames.ts         #   Epic Games free games API
│   │   ├── cheapshark.ts        #   CheapShark deals API + stores
│   │   └── rssfeeds.ts          #   SteamDB + ITAD RSS → JSON
│   ├── components/              # React components
│   │   ├── TerminalHeader.tsx   #   Top nav bar with tabs
│   │   ├── FreeGames.tsx        #   Free games dashboard
│   │   ├── Deals.tsx            #   Deals browser with filters
│   │   ├── About.tsx            #   Info/about panel
│   │   └── Output.tsx           #   Terminal output line
│   ├── hooks/
│   │   ├── useApi.ts            #   Generic async data fetcher
│   │   └── useLocalStorage.ts   #   localStorage persistence
│   ├── types/
│   │   └── index.ts             #   Shared TypeScript types
│   ├── App.tsx                   #   Root application shell
│   ├── index.css                #   Tailwind + terminal theme
│   └── main.tsx                 #   React entry point
├── index.html
├── package.json
├── vite.config.ts
└── README.md
```

---

## 🎨 Terminal Theme

The UI uses a custom terminal aesthetic:

| Property | Value |
|---|---|
| Background | `#0a0a0f` |
| Primary text | `#00ff41` (phosphor green) |
| Font | JetBrains Mono / Fira Code / Consolas / monospace |
| Borders | `rgba(0, 255, 65, 0.1–0.5)` |
| Accent hover | `rgba(0, 255, 65, 0.3)` |
| Scanline overlay | 2px repeating gradient at 3% opacity |

---

## 🔧 Tech Stack

| Layer | Technology |
|---|---|
| Framework | React 19 |
| Language | TypeScript 6 |
| Build Tool | Vite 8 |
| Styling | Tailwind CSS 4 |
| Deployment | GitHub Pages (via Actions) |

---

## 🧪 Testing

```bash
npm run build      # TypeScript type-check + Vite production build
npm run lint       # oxlint static analysis
```

---

## 📄 License

MIT © [X1Vi](https://github.com/X1Vi)

---

## 👤 Author

**X1Vi**

- GitHub: [@X1Vi](https://github.com/X1Vi)
- Project URL: [https://github.com/X1Vi/loot-games](https://github.com/X1Vi/loot-games)

---

<p align="center">
  <sub>Built with ❤️ from the combined APIs of freebie-finder-bot, lootscraper, MercuryBot, and PriceStalker.</sub>
</p>
