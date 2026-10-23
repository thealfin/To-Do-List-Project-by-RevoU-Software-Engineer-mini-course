---
inclusion: always
---

# Life Dashboard – Project Steering

## Project Overview
A minimal, Apple-inspired To-Do Life Dashboard built with vanilla HTML, CSS, and JavaScript.
No frameworks, no backend — pure client-side with Local Storage.

## Tech Stack
- **HTML5** – semantic structure (`index.html`)
- **CSS3** – custom properties (design tokens), Grid, Flexbox (`css/style.css`)
- **Vanilla JavaScript (ES6+)** – no libraries (`js/app.js`)
- **Local Storage API** – all persistence is client-side

## Folder Structure
```
project-root/
├── index.html        ← single HTML page
├── css/
│   └── style.css     ← ONE CSS file only
├── js/
│   └── app.js        ← ONE JS file only
├── .kiro/
│   ├── steering/
│   │   └── project.md
│   └── hooks/
└── README.md
```

## Implemented Features (MVP)
- ✅ Live clock & date in topbar
- ✅ Greeting based on time of day
- ✅ Focus timer (25-min default, SVG ring animation)
  - Start / Stop / Reset
- ✅ To-Do List (add, edit, mark done, delete)
  - Persisted in Local Storage
- ✅ Quick Links (add, delete, favicon auto-fetch)
  - Persisted in Local Storage

## Bonus Challenges (All 5 implemented)
1. ✅ Light / Dark mode toggle
2. ✅ Custom name in greeting
3. ✅ Change Pomodoro timer duration
4. ✅ Prevent duplicate tasks (case-insensitive check)
5. ✅ Sort tasks (A→Z, Z→A, Done last, Default)

## Coding Conventions
- All DOM IDs use kebab-case
- State object is the single source of truth
- Always save to LS after mutations
- Escape all user-provided strings before inserting into HTML
- No inline event handlers in HTML — all bindings in `bindEvents()`
