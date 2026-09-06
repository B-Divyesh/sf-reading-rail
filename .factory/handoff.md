# Reading Rail v1 handoff — review 1 FAIL

## Current review status

**FAIL (2026-09-06)** — review 1 found 6 product/documentation findings and
18 untested public claims. The live deployment matches implementation candidate
`428dc81d3ab05e916d47813d3567f2b989cd499e`; documentation is at
`9c1fc42773b47dba152dea24054ab8d972c45b2a`. The earlier verification below is
historical evidence, not the current acceptance verdict. See
[review-1.md](review-1.md) for evidence and required repairs.

The release must not be called PASS until it has an isolated one-click demo,
claim manifest and tagged sandbox tests, a real 404, plain first-screen copy,
complete site metadata/skeleton, and the outstanding response headers.

## Verification status

**PASS** — independent QA on 2026-08-27 verified candidate
`b56e046777f4262cbd9162b87d7c4b77e71f941a` and the live deployment at
https://reading-rail.sociobot.in. The live home/legal pages, JS, and CSS
byte-match the candidate. The live extension ZIP has different archive
metadata but every unpacked artifact is byte-identical and the downloaded ZIP
passed a fresh extension smoke test.

See [verification.md](verification.md) for exact command results, functional
coverage, accessibility/performance results, headers, privacy/network evidence,
and findings. There are no critical, high, or medium shipped-product defects.
The only product observation is low severity: hosted pages do not currently
send CSP/anti-framing/COOP headers. Full `npm audit` advisories are confined to
development-only WXT dependencies; `npm audit --omit=dev` is clean.

## Shipped

- A WXT + TypeScript Manifest V3 Chromium extension that finds real rendered
  text lines on ordinary web pages and places a pointer-transparent focus rail
  over the current line or paragraph.
- Keyboard navigation (`↑`/`↓`), instant `Escape`, global toggle and speech
  shortcuts, adjustable surrounding dim, user-initiated browser TTS, and clear
  empty/restricted/speech-error states.
- Local, per-host Original/Open/Wide text-spacing settings. Wide provides 1.7
  line height and WCAG test spacing of 0.12em between letters. No page content
  or preferences are transmitted.
- A compact accessible popup with light/dark treatments, 44px controls,
  visible focus, live announcements, and reduced-motion behavior.
- A responsive static landing site, interactive rail demonstration,
  installation guide, privacy and terms pages, original generated hero art,
  robots/sitemap/LLM metadata, and immutable asset-cache guidance.
- A packaged extension at `dist/site/downloads/reading-rail-chrome.zip` and an
  unpacked build at `dist/extension/` after the factory build.

## Run and verify

```sh
npm install
npm test
npm run check
npm run build
npx vite preview --config vite.site.config.ts --host 127.0.0.1 --port 4173
VERIFY_URL=http://127.0.0.1:4173 npm run verify:site
VERIFY_URL=http://127.0.0.1:4173 npm run verify:extension
```

Verified on 2026-08-27 using Chromium 151:

- Unit tests: 6/6 pass.
- Strict TypeScript: pass.
- Clean `npm run build`: pass; `dist/site/index.html` exists.
- Packaged extension smoke: popup → start rail → move → per-site spacing →
  Escape, pass; zero serious/critical axe findings and no console errors.
- Landing, privacy, and terms at 390 × 844: semantic checks pass, no horizontal
  overflow, one `h1` and `main` each, zero serious/critical axe findings, and no
  console errors.
- Lighthouse mobile against the production build: Performance 100,
  Accessibility 100, Best Practices 100, SEO 100; LCP 1.1 s, CLS 0, TBT 0 ms,
  transferred weight 27 KiB.
- Initial site JavaScript 0.94 KiB raw; CSS 10.76 KiB raw; mobile hero AVIF
  18 KiB; extension total 37.27 KiB. All are within the factory budgets.
- `npm audit --omit=dev`: zero production vulnerabilities.

The generated source artwork and its exact prompt/model metadata are in
`assets/src/`; the reviewed responsive AVIF/WebP/JPEG outputs are in
`site/public/assets/`. See `.factory/design.md` for visual rationale and
provenance.

## Known gaps and next steps

- Chrome blocks content extensions on internal/browser-store pages; the popup
  explains this state. Canvas text, cross-origin embedded documents, and some
  browser PDF viewers cannot expose usable text geometry.
- Browser and operating-system speech voices vary, and a user-configured voice
  may rely on its provider’s network service. Reading Rail itself has no
  network code.
- The downloadable zip is an unpacked/developer-install distribution. Store
  signing and listing are factory deployment tasks.
- Full `npm audit` reports advisories in WXT’s development-only Firefox runner
  dependency chain. They are absent from production dependencies and shipped
  artifacts; upgrade when WXT publishes a compatible fix.
- The product success target (25% better place retention after interruption)
  needs a timed study with target readers after distribution; this repository
  supplies the working testable v1, not a claimed outcome.
