# Independent verification — PASS

**Work order:** `reading-rail-verify-1`  
**Candidate:** `b56e046777f4262cbd9162b87d7c4b77e71f941a`  
**Verified:** 2026-08-27  
**Live URL:** https://reading-rail.sociobot.in

## Verdict

**PASS.** The candidate delivers the researched smallest useful product: an
in-place, keyboard-operable focus rail with surrounding dimming, per-site text
spacing, optional browser speech control, local-only settings, immediate
Escape/reset, and a usable public installation site. Fresh deployment checks
show that the live product is the candidate's content.

## Clean-checkout gates

Verification used a fresh detached clone at the candidate SHA on Node 22.23.2
and npm 10.9.8.

| Check | Evidence | Result |
| --- | --- | --- |
| Install | `npm ci` completed; WXT generated types | Pass |
| Unit tests | `npm test`: 2 files, 6 tests passed | Pass |
| Type check | `npm run check` (`tsc --noEmit`) | Pass |
| Exact production build | `npm run build` | Pass; generated `dist/extension/`, ZIP, and `dist/site/` |
| Site verifier | `VERIFY_URL=http://127.0.0.1:4173 npm run verify:site` | Pass; home, privacy, terms; zero serious/critical axe findings and zero console errors |
| Extension verifier | `VERIFY_URL=http://127.0.0.1:4173 npm run verify:extension` | Pass; popup, rail, move, spacing, Escape; zero serious/critical axe findings and zero console errors |

The production extension is 37.27 kB total. Initial landing-site JS is 0.94
kB raw, CSS is 10.76 kB raw, and the 390px AVIF candidate is 17.62 kB. These
are within the stated 200/50/300 kB budgets.

## Independent functional exercise

Loaded the built unpacked extension in Chromium and separately loaded the ZIP
downloaded from production. On representative dense site content I verified:

- Start rail, ArrowDown line movement (`Line 1 of 3` to `Line 2 of 3`), and
  large up/down boundary traversal without an invalid position or page error.
- Paragraph mode through the final available paragraph (`Paragraph 52 of 52`).
- Surrounding-dim boundary inputs of 25% and 88% (observed overlay opacities
  `0.25` and `0.88`).
- Wide per-site spacing (`line-height: 1.7`, `letter-spacing: 0.12em`).
- Native page-text selection with the overlay active; Escape removes the
  overlay immediately.
- Invalid persisted values recover safely: `enabled: 'yes'`, invalid mode and
  spacing restore defaults; `dim: 999` clamps to 88%; no overlay appears.
- Empty-page recovery: “No article text found yet”; movement and speech
  controls are disabled.
- The production download loaded as an extension and completed rail/escape
  smoke with zero console/page errors.

## Accessibility, responsive behavior, and performance

- 390x844 mobile and 1440x1000 desktop: no horizontal overflow; the landing
  demonstration moves from keyboard ArrowDown; focused links show a 3px solid
  focus outline.
- Reduced-motion mode resolves the rail transition to 0.00001s (Chromium's
  representation of a zero-duration rule) and `scroll-behavior: auto`.
- Fresh mobile Lighthouse against the production build: Performance **99**,
  Accessibility **100**, Best Practices **100**, SEO **100**; LCP 1,579 ms,
  CLS 0, TBT 0 ms, total transferred 27,645 bytes. Lighthouse emitted a final
  `TARGET_CRASHED` screenshot/BFCache gatherer warning after collecting the
  scores; the reported audits and all product browser tests completed.
- Visual review of both the 390px landing page and 360px popup found the
  documented broadsheet system intact and controls legible/usable.

## Privacy, deployment, and response policy

- Static source scan found no fetch/XHR/WebSocket/beacon/analytics code. A
  live browser request capture made six requests, all to
  `https://reading-rail.sociobot.in`; no third-party origin, console error, or
  serious/critical axe finding occurred. Extension preferences use
  `chrome.storage.local`.
- `npm audit --omit=dev` reports **0 production vulnerabilities**.
- Live home, privacy, terms, main JS, and CSS SHA-256 values exactly match the
  production build. The live ZIP archive hash differs due to ZIP metadata, but
  its complete unpacked file list and every file SHA-256 match the candidate;
  its manifest is identical.
- Live responses provide HTTPS/HSTS, `nosniff`, `strict-origin-when-cross-origin`,
  and a camera/microphone/geolocation-denying Permissions-Policy. Hashed assets
  use `public, max-age=31536000, immutable`; the archive uses one-hour caching.

## Findings by severity

### Critical / high / medium

No shipped-product defects found.

### Low

- The hosted landing site does not send a Content-Security-Policy,
  `frame-ancestors`/X-Frame-Options, or COOP header. This did not expose a
  functional or privacy failure in this static, no-user-content site, but the
  deployment policy should be tightened in a future hosting change.

### Non-shipping tooling note

- Full `npm audit` reports 10 development dependency vulnerabilities (1 low,
  2 moderate, 4 high, 3 critical), rooted in WXT's development-only Firefox
  runner chain (`wxt` -> `web-ext-run`). They are absent under `--omit=dev` and
  from the delivered extension/site artifacts. Track upstream WXT remediation;
  this is not a release-artifact blocker.

## Re-run

```sh
npm ci
npm test
npm run check
npm run build
npx vite preview --config vite.site.config.ts --host 127.0.0.1 --port 4173
VERIFY_URL=http://127.0.0.1:4173 npm run verify:site
VERIFY_URL=http://127.0.0.1:4173 npm run verify:extension
```
