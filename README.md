# Xenos

Muhammad Hassan Yousaf's personal portfolio as an original browser desktop. Built with React 19, TypeScript, Vite, Lucide, Inter, and JetBrains Mono. Dark charcoal surfaces, mint accents, and an original geometric wallpaper.

## Run locally

Requires Node.js 22.18+ and npm. Dependencies are already installed in this workspace.

```sh
npm ci
npm run dev
```

Open **http://127.0.0.1:5173/**. The direct, accessible portfolio is at **/portfolio.html** and works without JavaScript. `predev` regenerates this page from the shared content model.

```sh
npm run build
npm run preview
```

Production preview runs at **http://127.0.0.1:4173/**. Deploy the `dist/` directory to any static host at the domain root. No environment variables, server, API keys, or account access are required. Hash-based desktop deep links need no rewrite rules. This task prepares the local application; it does not publish to a hosting account.

## Edit your content

- `src/data/portfolio.ts`: name, title, biography, welcome copy, location, contact/social links, and grouped skills.
- `src/data/projects.json`: all 18 applications and 11 automation workflows, their descriptions, tags, categories, images, demos, and repositories.
- `src/data/journey.json`: the verified six-stage engineering journey.
- `public/assets/`: all 33 source screenshots and workflow diagrams, served locally.
- `index.html`: desktop page metadata and no-JavaScript fallback.

Files, search, project details, Terminal, and the standalone portfolio derive their content from these records. After edits, `npm run build` regenerates the standalone portfolio. During development, run `node scripts/static-portfolio.mjs` to refresh it without restarting the server. Do not edit generated `public/portfolio.html` directly.

No downloadable CV was present in the source. Résumé displays verified background and the published engineering journey, with a contact route for a current CV. No education, employer, testimonial, or metric was invented. Full research notes are in `docs/RESEARCH.md`.

## Theme and preferences

`src/styles.css` contains the shell, shared tokens, window controls, dock, menus, and responsive desktop rules. `src/styles/apps.css` styles app contents. `src/styles/refinements.css` contains final responsive and readability refinements. `src/core/persistence.ts` defines accent palettes and default preferences; `src/Desktop.tsx` contains the original wallpaper geometry.

Settings supports three wallpapers, four accent colors, animations, desktop shortcuts, session restoration, and resetting the desktop. Device reduced-motion preferences always win. Notes remain saved when the desktop is reset. All persistence uses versioned `xenos:v1:*` localStorage keys and handles unavailable or invalid storage.

## Architecture

```
src/core/registry.ts       App names, icons, colors, default sizes
src/core/windows.ts       Window lifecycle, focus, stacking, saved sessions
src/core/geometry.ts      Bounds, snapping, resizing, viewport recovery
src/core/filesystem.ts    Shared virtual folders, documents, images, links
src/core/terminal.ts      Virtual command execution and completion
src/core/persistence.ts   Validated browser-local preferences
src/components/Window.tsx Pointer gestures and shared window chrome
src/components/Popovers.tsx Launcher, search, calendar and focus management
src/apps/                 Purposeful portfolio applications
src/Desktop.tsx           Shell, taskbar, routing and desktop interactions
scripts/static-portfolio.mjs  Generates the indexable no-JS portfolio
```

Core applications are single-instance: relaunching brings the existing window forward. Each project, image, and document has one window per content ID. Taskbar groups provide a picker when several documents are open. Minimized applications remain mounted to retain their working state. Geometry, stacking order, minimization, and launch arguments persist when session restoration is enabled; transient search queries and Terminal history do not survive reloads. Mobile uses one maximized app at a time while retaining underlying desktop geometry.

Dragging and resizing use pointer capture and direct element updates, committing React state when the gesture ends. All eight resize handles share bounded geometry logic. Left/right/top edge snapping, titlebar double-click, and maximize/restore preserve prior geometry. Terminal and Notes are lazy-loaded. The clock updates on minute boundaries rather than repainting the desktop continuously.

## Controls

- Desktop: single click selects, double click opens; Enter opens focused shortcuts. Touch opens with one tap.
- Taskbar: launch, switch, minimize, restore, or select a grouped window.
- Right-click desktop: Files, Terminal, show/restore windows, hide/show shortcuts, refresh, personalization.
- `Ctrl/⌘ K`: global app/content search, with Up/Down and Enter.
- `Alt Shift D`: show/restore desktop outside text fields.
- `Alt Shift M`: maximize/restore the focused window.
- `Alt Shift Left/Right`: snap the focused window.
- `Escape`: dismiss menus; keyboard focus returns to the trigger.
- Terminal: `help`, `about`, `projects`, `skills`, `contact`, `ls`, `cd`, `cat`, `pwd`, `clear`, `open`, `neofetch`, `date`; history, Tab completion, and quoted paths.

Example deep links: `/#/projects`, `/#/resume`, `/#/contact`, `/#/project/axon`, `/#/files/%2FDocuments`. Browser Back/Forward follows launches. Direct portfolio permalinks include `/portfolio.html#axon`.

## Verify

```sh
npm test
npm run test:e2e
npm run build
```

Geometry tests run in Node. The browser walkthrough uses installed Google Chrome through Playwright and expects the dev server on port 5173. To test production on Windows PowerShell after starting `npm run preview`:

```powershell
$env:XENOS_TEST_URL = 'http://127.0.0.1:4173'
npm run test:e2e
```

Screenshots and structured results are saved to ignored `.qa/`. Tests cover app launches, all 29 projects, clipboard, focus, drag/resize/snap, minimize/maximize/restore, file history, image viewing, Terminal, settings, local notes, reset, browser history, desktop/tablet/phone views, reduced motion, malformed saved state, no-JavaScript access, and runtime/asset failures. Chrome DevTools was also used for reference research, real UI interaction, screenshot reviews, console checks, and Lighthouse accessibility audits.

## Browser boundaries and attribution

This is a portfolio desktop, not access to the visitor's actual operating system. Files are virtual. Notes and preferences stay in this browser; clearing site data removes them. Contact opens the visitor's email application and does not simulate delivery. External project/social links open separate tabs, and may depend on the external service's availability or authentication. Fullscreen is requested only from its explicit control.

No source CV file was provided, so no PDF download is offered. Essential content remains available in the simple portfolio. No boot sequence blocks entry. No LithOS or daedalOS code/assets are copied; see `docs/RESEARCH.md` and `public/THIRD-PARTY-NOTICES.txt`. Included third-party font and library notices ship in `public/licenses/`.
