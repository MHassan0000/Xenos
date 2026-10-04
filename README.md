# Hassan’s personal desktop

A dark, interactive portfolio desktop for Muhammad Hassan Yousaf, based in Lahore, Pakistan. Built with React, TypeScript and Vite. The desktop follows LithOS’s Linux-style layout and interactions, with an original black ambient theme and independently implemented applications.

## Run

Requires Node 22.12+ and npm. From this folder:

```sh
npm install
npm run dev
```

Open **http://127.0.0.1:5173**. To serve the production build:

```sh
npm run build
npm run preview
```

Preview runs at **http://127.0.0.1:4173**. Deploy `dist/` to a static host. App routes use URL hashes, so no special server rewrite is required. The Web Browser app opens Hassan’s live portfolio at https://hassanyousaf.vercel.app.

## Included

- A bottom task panel, categorized/searchable launcher, draggable desktop shortcuts, useful desktop/file/window context menus, calendar, notification history, browser network status, shared volume, show-desktop, fullscreen, and lock/logout/restart/shutdown screens.
- Shared windows with focus, stacking, eight resize handles, minimize/maximize/restore, edge snapping, remembered geometry, grouped task switching, and mobile app views.
- Welcome, all 29 sourced projects/workflows, résumé/background, skills, contact, Files, image/text viewers and the portfolio terminal.
- A tabbed Web Browser, local Text Editor, Notes, Calculator, System Monitor, Trash, and three generative Ambient soundscapes.
- Eight playable games: **DOOM**, **Night Drive** (3D), **Solitaire**, **Chess** (computer/local), **2048**, **Brickfall**, **Mines**, and **Snake**. Games and utilities load on demand; DOOM’s 6.8 MB engine is fetched only after Launch.

## Edit content and appearance

| File | Purpose |
| --- | --- |
| `src/data/portfolio.ts` | Name, introduction, biography, location, email, profiles, skill groups |
| `src/data/projects.json` | All project descriptions, categories, tags, images and verified URLs |
| `src/data/journey.json` | Published engineering journey |
| `public/assets/` | Optimized portfolio screenshots and diagrams |
| `src/core/registry.ts` | Application names, icons, categories and default window sizes |
| `src/core/persistence.ts` | Default wallpaper, accent, motion and desktop preferences |
| `src/styles/desktop.css` | Black desktop theme, ambient wallpaper, panel, launcher and welcome layout |
| `src/styles/apps.css`, `utilities.css`, `games.css` | Individual application styling |

Edit the shared profile, project, and journey data shown in the native desktop applications. The visitor experience opens the live source portfolio from the Web Browser app.

## Architecture and behavior

`Desktop.tsx` assembles the shell. `core/windows.ts` owns window state; `geometry.ts` handles snapping and bounds. `components/Window.tsx` uses pointer capture and direct geometry updates while dragging/resizing. Applications communicate with the shell through `core/context.ts`.

`core/filesystem.ts` exposes portfolio folders and game launchers. `core/localFiles.ts` supplies locally saved editor documents to Files, search, Terminal, and Trash. Deletion moves local documents to Trash; permanent deletion requires an in-app confirmation. Filename collisions are resolved automatically.

Core apps and games are single-instance. Project details, images and portfolio documents have one window per item. Launching an open application raises and restores it. Closing a game ends its in-memory run; best arcade scores persist. Active games pause when switched away from, minimized, or when the page becomes hidden.

Appearance, desktop icon positions, optional window sessions, notes, editor drafts/documents and best scores use local storage (`workspace:v2`). Invalid records fall back to defaults. **Settings → Desktop → Restore defaults** resets appearance, icons and windows while retaining local documents and notes.

## Keyboard

- `Ctrl/Cmd K`: search apps, projects, skills and documents.
- `Alt Shift D`: show/restore desktop.
- `Alt Shift M`: maximize/restore the focused window.
- `Alt Shift ←/→`: snap the focused window.
- `Escape`: dismiss menus. `Enter`: launch a selected desktop shortcut or enter a locked guest session.
- Editor: `Ctrl/Cmd S` saves locally. Terminal: arrow history and Tab completion.
- Games show their controls. DOOM uses `F8` to release keyboard focus to its toolbar.

Terminal commands include `help`, `about`, `projects`, `skills`, `contact`, `ls`, `cd`, `cat`, `pwd`, `tree`, `open`, `neofetch`, `whoami`, `uname`, `echo`, `fortune`, `man hassan`, `games`, `date`, and `clear`.

## Validate

```sh
npm test
npm run test:e2e
npm run test:apps
npm run build
```

Browser scripts require installed Google Chrome and a running dev/preview server. Set `DESKTOP_TEST_URL` to target another URL. Ignored `.qa/` contains screenshots and structured test results. Chrome DevTools is used separately for direct interaction, responsive screenshots, console and asset inspection.

## Browser limits and credits

This is a browser workspace. Lock/power/network/system-monitor controls operate on this experience and do not control the visitor’s actual computer. There is no authentication, backend, fake message delivery or external upload of local notes.

The Web Browser displays websites inside the desktop where their security policies allow framing. Google uses its supported embedded view; sites such as GitHub and LinkedIn that block framing keep their open-in-tab action. Night Drive needs WebGL. The bundled DOOM port is silent, contains only the shareware episode, and does not persist saved games. A genuine downloadable CV was not found in the supplied portfolio; Résumé presents verified published information without inventing a PDF.

The LithOS repository had no top-level license grant when inspected; its application code and desktop art are not copied. DOOM is bundled independently from its upstream WebAssembly distribution, with the corresponding engine source archive and GPL license available from the game’s credits. See `public/THIRD-PARTY-NOTICES.txt` for dependencies, attribution and source provenance.
