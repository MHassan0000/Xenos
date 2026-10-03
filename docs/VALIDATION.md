# Validation — 3 October 2026

Validated against the built application at `http://127.0.0.1:4173/` with Google Chrome. Development checks also ran on port 5173. No external publishing was performed.

## Automated results

- `npm run build`: passed TypeScript compilation, Vite production bundling, and generation of the static portfolio.
- `npm test`: four geometry tests passed, covering viewport recovery, snap/restore geometry, minimum resize sizes, and reachable titlebars.
- `npm run test:e2e` against production: **35 checks passed**. No captured runtime/console errors, failed requests, or HTTP asset errors.
- `git diff --check`: passed.
- 29 portfolio records and 33 locally served WebP images verified. Image payload totals approximately 1.05 MiB across the entire archive; most are lazy-loaded.

## Browser coverage

The production walkthrough verifies initial welcome routes; shortcut selection/double-click; launcher and keyboard search; category filtering and project details; verified live/source links and copy actions; multiple-window focus; drag, resize, left edge snap, maximize/restore, titlebar double-click, minimize/taskbar restoration; grouped project window switching; desktop hide/restore; file paths and back/forward history; image viewer opening; 27 skill entries and six journey entries; Terminal navigation, reading, completion, history, errors, and launching; appearance persistence; disabling session restoration; local notes; reset; calendar navigation; context menu actions; browser deep links/back/forward; malformed saved state; and the JavaScript-free portfolio.

Screenshots reviewed at 1440×900, 1024×768, and 390×844. Mobile uses maximized app surfaces with a touch launcher and scrollable dock. Returning from mobile preserves desktop window dimensions. OS reduced-motion preferences override interface animations.

## Chrome DevTools audits

Final production desktop snapshot:

| Category | Score |
| --- | --- |
| Accessibility | 100 |
| Best practices | 100 |
| SEO | 100 |
| Agentic browsing | 100 |

The standalone `/portfolio.html` snapshot also scored 100 in each category, with zero failing audits. These are Lighthouse snapshot scores, not a blanket accessibility certification or performance measurement. The desktop report retains an unscored experimental visible-label warning on its live clock. Standard accessibility checks pass; the clock is keyboard-operable and explicitly named with its date/time.

Earlier screenshot/audit findings were corrected: vertically clipped welcome content, an effect returning a browser API value in Terminal, covered mobile windows appearing in navigation, desktop geometry shrinking during phone presentation, and low-contrast decorative labels.

Local screenshots and full walkthrough output are saved in ignored `.qa/`. Run the commands in README to regenerate them.

## Remaining boundaries

- No source CV file was available. Résumé is a readable profile rather than an invented PDF.
- Contact uses real `mailto:` and verified external links; there is no delivery backend or simulated send success.
- External demo/repository URLs were extracted from the owner's portfolio. Third-party uptime and sign-in requirements are outside Xenos.
- Files are virtual; settings and notes remain in local browser storage. Saved app geometry persists, while transient filters and Terminal history reset on reload.
- Validation used Chromium. Firefox and Safari were not independently exercised in this session.
