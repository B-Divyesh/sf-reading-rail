# Reading Rail repair 1 handoff — PASS

## Release identity

- Implementation SHA: `ee5cd8c0254ab485fdd152b1ed05c0067962e812`
- Documentation SHA: `821a21c61668229cb2629fad1c841ff131045f67` (repair handoff report).
- Live URL: <https://reading-rail.sociobot.in>
- Deployed: 2026-09-06 via the existing `sf-reading-rail` static app. The
  deployment completed successfully before the HTTPS cold checks below.

## What changed

- Added a direct, one-click `/demo/` route with nine realistic library website
  review notes, populated rail controls, persistent **Demo — sample data,
  nothing is saved** label, **Reset demo**, and **Start for real**.
- Kept demo state isolated in `demo:reading-rail:sample-state`. It neither
  reads nor changes extension storage or a non-demo browser-storage key.
- Added `.factory/claims.json`, `.factory/demo.md`, and 14 tagged Playwright
  claim tests. The tests load the packaged extension against `/demo/` in fresh
  browser contexts where the claim concerns the extension.
- Rewrote the first screen in plain words: it names the job, readers with
  dyslexia or visual crowding, and **Try it with sample data** as the first
  action. `.factory/copy-audit.md` records the word-count audit.
- Added a designed real `404.html` and Static Web Apps 404 response override.
  Unknown live routes now return HTTP 404 with a route home.
- Added metadata and shared structure across routes: canonical URLs, Open
  Graph/Twitter image, Apple touch icon, Demo navigation, footer version and
  Param Factory credit, robots/sitemap entries, and original-art disclosure.
- Added CSP, anti-framing, COOP, `nosniff`, referrer, and permissions headers
  through `staticwebapp.config.json`.
- Added light and dark treatments; both pass serious/critical Axe checks.
- Pinned Playwright to 1.58.2 and separated the Vitest and Playwright runners
  so `npm test` works from a clean checkout.

## Review finding disposition

| Finding | Disposition |
| --- | --- |
| R1 — no isolated sample | Fixed by `/demo/`, `demo:` namespace, reset, banner, start-for-real exit, and isolation tests. |
| R2 — no claims manifest/tests | Fixed with 14 observable claim tests and a clean `npm test` command. The old untestable wording about offline use, a three-minute install, and named browser compatibility was removed. |
| R3 — no real 404 | Fixed with `404.html`, Static Web Apps response override, local verifier, and live HTTP 404 check. |
| R4 — first-screen copy | Fixed with a job title, audience sentence, clear sample action, and three short facts before scrolling on desktop and phone. |
| R5 — metadata/skeleton | Fixed on home, demo, privacy, terms, and 404 routes. |
| R6 — response headers | Fixed in the static configuration and confirmed live on every public route. |

The earlier verification’s development-only dependency advisory note remains
accurate. `npm audit --omit=dev` is clean; the full development dependency tree
still reports WXT transitive advisories and is not shipped.

## Clean setup and verification

From this repository on Node 22.23.2 and npm 10.9.8:

```sh
npm ci
npm test
npm run check
npm run build
npm run preview:site
VERIFY_URL=http://127.0.0.1:4173 npm run verify:site
VERIFY_URL=http://127.0.0.1:4173 npm run verify:extension
npm audit --omit=dev
```

Results:

- `npm ci`: pass.
- `npm test`: pass — 6 unit tests and 14 tagged clean-consumer claim tests.
- `npm run check`: pass.
- `npm run build`: pass — creates `dist/site/`, `dist/extension/`, and the
  downloadable ZIP.
- `verify:site`: pass — home/demo/privacy/terms semantics, mobile overflow,
  console, Axe, demo move/reset, 404/status, headers, local links, skip-link
  keyboard order, reduced motion, and dark-mode Axe.
- `verify:extension`: pass — packaged extension popup, rail, movement,
  spacing, Escape, and Axe.
- `npm audit --omit=dev`: 0 vulnerabilities.
- Lighthouse mobile JSON recorded Performance 100, Accessibility 100, Best
  Practices 100, SEO 100; LCP 1,073ms, CLS 0, TBT 0ms, transferred 46KB. The
  Lighthouse process reported a tab crash after writing this complete report,
  so the JSON metrics are evidence rather than a successful CLI exit code.

## Live verification

Fresh desktop (1440 × 1000) and phone (390 × 844) contexts opened the live
home page. Before scrolling, each showed:

- Job: “Follow dense text one line at a time.”
- Audience: readers with dyslexia or visual crowding.
- First action: **Try it with sample data**, within the viewport.

In both fresh contexts the action opened `/demo/`; the persistent label was
visible, the populated sample moved from Line 1 of 9 to Line 2 of 9, and Reset
demo returned it to Line 1 of 9. Live Axe found no serious or critical issue,
there were no console errors, and requests stayed on the product origin.

Live `/`, `/demo/`, `/privacy/`, `/terms/`, and `404.html` byte-match the built
candidate. Live `/no-such-page` returns HTTP 404. CSP, X-Frame-Options, COOP,
Referrer-Policy, and nosniff headers were present on home, demo, legal, and 404
responses.

## Known limits and next steps

- Browser-protected pages, browser stores, some PDF viewers, canvas text, and
  cross-origin embedded documents may not expose readable text geometry to a
  content extension.
- Read aloud uses browser/operating-system voices; a voice the user configured
  separately may use that voice provider’s network service. Reading Rail has
  no product network request for this feature.
- The ZIP is an unpacked developer-install package. Store signing/listing and a
  reader study of the brief’s 25% place-retention target remain future factory
  work; the target is not advertised as an achieved result.
