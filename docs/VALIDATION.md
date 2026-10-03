# Desktop revision validation

The revision is inspected with Chrome DevTools and exercised with the repository’s browser tests. No Lighthouse audit is part of this workflow.

Final results, 3 October 2026: **35 portfolio/window browser checks, 20 extended application checks, and 9 logic tests passed**. Both browser suites ran against the production preview at `http://127.0.0.1:4173`. No uncaught runtime errors or failed assets were recorded. The TypeScript check and production bundle pass. Vite notes that the optional Three.js racing chunk exceeds 500 kB; it is lazy-loaded and is not part of the initial desktop bundle.

The final keyboard refinement was checked directly in Chrome DevTools: dragging a shortcut stores its position and Enter still launches it afterward. The expanded terminal help was verified in the rebuilt production preview. Desktop, tablet, and mobile screenshots and the console/network panels were reviewed separately from the automated suites.

## Coverage

- Original portfolio walkthrough: source content, all 29 projects, search/filtering, verified links, clipboard, Files navigation and images, terminal history/completion, settings/reset, malformed storage, reload, direct routes and browser back/forward.
- Shared window manager: pointer dragging, resizing, edge snapping, titlebar maximize/restore, taskbar minimize/restore, grouped project windows, focus, show-desktop, viewport bounds and preservation of desktop geometry through mobile views.
- Added applications: all eight game launches; 2048 movement/undo, safe first Mines reveal/flags/difficulty, Snake pause/minimize, Brickfall locking, chess computer/legal moves/checkmate/undo, Solitaire deal/draw/undo/hints, actual DOOM frame rendering/menu input/pause, and WebGL racing/steering/pause.
- Local documents: editor save, shared Files listing, trash/restore, search, and reload. Calculator arithmetic/error handling, browser tabs/history/bookmarks/local preview, Ambient and shared volume, task monitor, notifications, network, lock/power/restart.
- Screenshots at desktop (1440×900), tablet (1024×768), and phone (390×844). Keyboard use, reduced motion, page overflow, console errors and failed assets.

## Reproduce

Start the development server and run `npm test`, `npm run test:e2e`, and `npm run test:apps`. Run `npm run build` for the production typecheck/bundle. To check production, start `npm run preview` and set `DESKTOP_TEST_URL=http://127.0.0.1:4173` when running each browser suite. Browser test artifacts are written under ignored `.qa/`.

## Deliberate limits

- Games are implemented for casual portfolio exploration; best scores persist, full game sessions do not.
- The selected DOOM engine has no audio or persistent save support. The original shareware episode is playable locally.
- The browser cannot force external websites to allow embedding. The normal external-link route remains available.
- System statistics describe this page, and network status is the browser’s online indicator. No fabricated device processes or disk capacity are shown.
- Local storage can be unavailable or full. Editor errors offer downloading a copy; no cloud save is claimed.
