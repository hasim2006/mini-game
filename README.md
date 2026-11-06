<div align="center">

# 🕹️ Mini Game Arcade

**A high-performance, responsive HTML5 Canvas browser arcade featuring Fruit Blade and Memory Match, powered by a procedural Web Audio API sound engine and dual-state theme architecture.**

[![Live Web Application](https://img.shields.io/badge/Production%20App-mini--game--arcade--tan.vercel.app-6366F1?style=for-the-badge&logo=vercel&logoColor=white)](https://mini-game-arcade-tan.vercel.app)
[![CI Pipeline](https://img.shields.io/github/actions/workflow/status/hasim2006/mini-game/ci.yml?branch=main&style=for-the-badge&label=CI%20Pipeline&logo=githubactions&logoColor=white)](https://github.com/hasim2006/mini-game/actions)
[![Vanilla JS](https://img.shields.io/badge/Vanilla_JS-ES6+-F7DF1E?style=for-the-badge&logo=javascript&logoColor=black)](https://developer.mozilla.org/en-US/docs/Web/JavaScript)
[![HTML5 Canvas](https://img.shields.io/badge/HTML5-Canvas_2D-E34F26?style=for-the-badge&logo=html5&logoColor=white)](https://developer.mozilla.org/en-US/docs/Web/API/Canvas_API)
[![Web Audio API](https://img.shields.io/badge/Web_Audio-Procedural_Synth-8B5CF6?style=for-the-badge&logo=soundcharts&logoColor=white)](https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API)
[![Responsive](https://img.shields.io/badge/Mobile-Adaptive_320px_to_4K-10B981?style=for-the-badge&logo=safari&logoColor=white)](https://mini-game-arcade-tan.vercel.app)
[![License](https://img.shields.io/badge/License-CC0_1.0-blue?style=for-the-badge)](LICENSE)

<br />

<p align="center">
  <a href="https://mini-game-arcade-tan.vercel.app">
    <img src="https://img.shields.io/badge/▶_PLAY_LIVE_NOW-VISIT_ARCADE-4F46E5?style=for-the-badge&labelColor=0B0E1A" alt="Play Live Now" height="42" />
  </a>
</p>

</div>

---

## 📖 About The Project

**Mini Game Arcade** is a lightweight, zero-dependency browser gaming platform engineered entirely with standard Web platform technologies — **HTML5, Modern CSS3, and Vanilla JavaScript (ES6+)**. 

Unlike modern web games that bundle heavy game engines or bloated framework runtimes, Mini Game Arcade achieves sub-second initial load times, high-FPS canvas rendering, and procedural sound generation using 100% native browser APIs. It is designed to run seamlessly on everything from low-end smartphones to high-refresh-rate desktop displays.

---

## 🎮 Included Arcade Games

### 🍉 1. Fruit Blade Frenzy
A fast-paced, gesture-driven slicing game featuring custom Canvas physics:
* **Neon Blade Trail**: Real-time spline interpolation tracks user swipes and mouse drags with glowing trail shaders.
* **Fruit Split & Particle Physics**: Cut fruits realistically divide into independent physics halves with juice splatter decals dynamically stamped onto the background.
* **Multi-Fruit Combos**: Slicing multiple targets in a single stroke triggers floating combo banners and multiplier scoring.
* **Hazard Avoidance**: Dynamic black bombs deduct lives; 3 strikes end the run.

### 🧠 2. Cyber Memory Matrix
A cognitive spatial recall puzzle with card matching:
* **3 Difficulty Grids**: Easy (12 cards, 4×3), Medium (16 cards, 4×4), and Hard (20 cards, 5×4).
* **3D Hardware-Accelerated Card Flips**: CSS 3D transforms (`rotateY`) deliver 60 FPS flip and match animations.
* **Live Stopwatch & Move Counter**: Dynamic star rating calculation based on turn efficiency and speed.
* **Victory Fanfare**: Web Audio victory chime and completion modal.

---

## ⚡ Core Platform Capabilities

* 🌓 **Universal Dual-State Theme Engine**:
  * Features a sliding dual-state switch pill (`☀️ Sun` and `🌙 Moon`).
  * Zero Flash of Unstyled Content (FOUC) through synchronous root attribute application.
  * Cross-tab live synchronization via `storage` events and automatic OS `prefers-color-scheme` adaptation.
  * Native browser `color-scheme` enforcement for dark/light scrollbars and form inputs.

* 🎵 **Custom Music Player Deck**:
  * Floating, minimizable audio deck with animated equalizer bars.
  * **User Audio Upload**: Load and loop custom songs (`.mp3`, `.wav`, `.ogg`) via client-side HTML5 File API.
  * **Procedural Synth Beats**: Includes 2 procedural background tracks (*Arcade Groove* & *Retro Synthwave*) generated in real-time through Web Audio oscillators without audio file downloads.

* 📱 **Universal Device Responsiveness**:
  * Mobile touch gesture support (swiping, multi-touch handling, safe area padding).
  * Auto-scaling responsive canvases with crisp device pixel ratio (`window.devicePixelRatio`) scaling.

* 🛡️ **AdSense & Legal Compliance**:
  * Complete, legally vetted policy pages: Privacy Policy (GDPR / CCPA / CalOPPA compliant), Terms of Service, About, and Contact.
  * Pre-configured, non-intrusive AdSense ad unit placeholders with labels.

---

## 📂 Domain-Based Directory Architecture

The project follows a modular, domain-driven structure separating core pages, game engines, styles, scripts, and vector assets:

```
mini-game/
├── index.html                  # Arcade Homepage & Game Catalog
├── about.html                  # About & Platform Overview
├── contact.html                # Contact & User Feedback Form
├── privacy.html                # GDPR / CCPA Legal Privacy Policy
├── terms.html                  # Terms of Service & Disclaimer
├── robots.txt                  # Search Engine Crawler Directives
├── sitemap.xml                 # XML Sitemap for Search Indexing
├── vercel.json                 # Vercel Deployment & Caching Config
├── LICENSE                     # CC0 1.0 Universal License
│
├── assets/                     # Vector SVGs & Artwork
│   ├── favicon.svg             # Arcade Pixel Joystick Icon
│   ├── logo.svg                # Full Brand Vector Logo
│   ├── fruit-blade-thumb.svg   # Fruit Blade Game Cover Card
│   └── memory-match-thumb.svg  # Memory Matrix Game Cover Card
│
├── css/                        # Modular Stylesheets
│   ├── main.css                # Global Theme Variables, Layout, Responsive Grid
│   ├── fruit-slice.css         # Fruit Blade Canvas Stage, HUD, Overlay Dialogs
│   ├── memory-match.css        # Memory Match 3D Cards, Board, Victory Modals
│   └── music-player.css        # Floating Audio Player & Equalizer Animations
│
├── js/                         # Game & Platform Logic Modules
│   ├── theme.js                # Dual-State Theme Engine & Cross-Tab Sync
│   ├── audio.js                # Web Audio API Procedural Synthesizer
│   ├── music-player.js         # Custom Music Deck & User File Uploader
│   ├── db.js                   # Client Storage & High Score Persistence
│   ├── fruit-slice.js          # Fruit Blade Physics, Slicing & Splatter Engine
│   └── memory-match.js         # Memory Matrix Match Algorithm & Timer Engine
│
└── games/                      # Game Stage Viewports
    ├── fruit-slice/
    │   └── index.html          # Fruit Blade Game Arena
    └── memory-match/
        └── index.html          # Memory Matrix Game Arena
```

---

## 🛠️ Technology Stack

| Component | Technology | Description |
| :--- | :--- | :--- |
| **Engine Core** | Vanilla JavaScript (ES6+) | Strict mode, zero external frameworks, zero bundle size overhead |
| **Rendering** | HTML5 Canvas 2D | Double-buffered frame loop (`requestAnimationFrame`) with DPR scaling |
| **Audio Engine** | Web Audio API | Procedural sound generation (OscillatorNode, GainNode, BiquadFilter) |
| **Styling & Themes** | Modern CSS3 | CSS Custom Properties, Glassmorphism, 3D Transforms, Flexbox, Grid |
| **Hosting & CI/CD** | Vercel Edge Network | Global edge delivery, instant HTTPS, zero-cold-start static serving |

---

## 🚀 Getting Started Locally

No npm dependencies or compilers are required. You can run the arcade locally in seconds:

### Prerequisites
* Any modern web browser (Google Chrome, Firefox, Safari, Edge)

### Installation & Run

1. **Clone the repository:**
   ```bash
   git clone https://github.com/hasim2006/mini-game.git
   cd mini-game
   ```

2. **Serve locally using any static web server:**
   * Using Python 3:
     ```bash
     python -m http.server 3000
     ```
   * Using Node.js:
     ```bash
     npx serve .
     ```
   * Or simply open `index.html` directly in your browser.

3. **Navigate to:**
   ```
   http://localhost:3000
   ```

---

## 👨‍💻 Author

**Mohammad Hasim**
* GitHub: [@hasim2006](https://github.com/hasim2006)
* Portfolio: [Mohammad Hasim](https://github.com/hasim2006/Portfolio)
* Projects: [PulmoGuard](https://github.com/hasim2006/PulmoGuard) • [GeoFlux](https://github.com/hasim2006/GeoFlux) • [PhantomGrid](https://github.com/hasim2006/PhantomGrid-Predictive-Defense-SIH26153)

---

## 📄 License

This project is open-source and released under the [CC0 1.0 Universal (Public Domain)](LICENSE) license.
