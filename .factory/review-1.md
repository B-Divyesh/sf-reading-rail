# Reading Rail review 1 — keep your place in browser text

**Work order:** `reading-rail-review-1`  
**Reviewed:** 2026-09-06  
**Live URL:** https://reading-rail.sociobot.in  
**Implementation candidate:** `428dc81d3ab05e916d47813d3567f2b989cd499e`  
**Documentation SHA:** `9c1fc42773b47dba152dea24054ab8d972c45b2a`

## Verdict

**FAIL — 6 findings, 18 untested public claims.**

Reading Rail's job is to help readers with dyslexia or visual crowding keep
their place in dense browser text. Its audience is readers who need to review
one manageable line or paragraph without leaving the original page. The first
action should be **Try it with sample data**, before scrolling. The live first
action instead downloads a ZIP; there is no sample action.

The implementation candidate is `428dc81`. `b56e046`, `2130d25`, and
`9c1fc42` change only handoff/verification documentation after it. A fresh
build from the review checkout produced an `index.html` whose SHA-256 exactly
matches live (`f5c715cf…`). The live ZIP archive has different archive
metadata, but its nine unpacked extension files byte-match the fresh build.

## Findings

| ID | Severity | Finding | Evidence and required disposition |
| --- | --- | --- | --- |
| R1 | High | There is no one-click, isolated sample sandbox. | The live desktop and 390px phone first screens contain no “Try it with sample data” action, persistent `Demo — sample data, nothing is saved` label, `Reset demo`, or `Start for real`. `GET /demo` returns the ordinary landing page (HTTP 200), not a seeded demo. This fails the demo-sandbox contract and prevents checking that sample actions never alter real data. Add a direct `/demo` with separate `demo:` storage, realistic populated output, a persistent label, reset, and a real-data exit. |
| R2 | High | The required claims contract is entirely absent. | `.factory/claims.json` does not exist and `rg '@claim:'` finds no tagged observable claim test. Consequently all 18 identified public claim units below are untested; there is no declared command to run for them from a clean checkout. Add the manifest and one clean-demo test per claim, or remove claims that cannot be demonstrated. |
| R3 | Medium | Unknown routes do not have a designed 404. | `GET /no-such-page` returns the home document with HTTP 200. `staticwebapp.config.json` sends navigation fallback to `/index.html` and has no `/404.html` response override. Add a real product-styled 404 with an HTTP 404 status and a route back home. A deliberate 404 is expected; returning unrelated content is not. |
| R4 | Medium | The first screen does not state the job, audience, and sample first action in plain words. | Its only h1 is “Keep your place. Keep the page.” This is a slogan rather than the job; the copy does not name readers with visual crowding/dyslexia on the first screen; and the first primary action is “Download for Chromium.” Replace it with a ≤9-word job headline, a ≤22-word audience/result sentence, and the sample action required by R1. |
| R5 | Medium | Required site-structure metadata and common skeleton details are missing. | The landing and legal pages have no canonical URL, Open Graph/Twitter card, social image, or Apple touch icon. The header has no Demo link; the footer omits “Built by Param Factory” and a version/build id. The sitemap does not list `/demo` or a 404 route because neither exists. Supply the required metadata and the standard header/footer on every route. |
| R6 | Low | The previous security-header finding remains open. | Live `/`, `/privacy/`, and `/terms/` provide HSTS, `nosniff`, Referrer-Policy, and Permissions-Policy, but no Content-Security-Policy, `frame-ancestors`/X-Frame-Options, or COOP. The committed static config likewise lacks them. This is the low-severity finding recorded in `.factory/verification.md`; it is not fixed. Add a CSP matching the self-hosted assets and a response-header anti-framing policy. |

### Untested public claims counted for R2

These 18 discrete claim units are visitor-facing in the live landing page,
README, or privacy page, and none has a claim entry and tagged sandbox test:

1. Keeps a reader's place in dense browser text.
2. Keeps the original page intact.
3. Is free forever.
4. Works offline / is fully offline.
5. Finds readable rendered lines.
6. Keeps the guide aligned through scrolling and reflow.
7. Focuses either one line or a paragraph.
8. Dims surrounding content while retaining live original content.
9. Saves text-spacing presets per site, including the stated WCAG-width preset.
10. Uses the browser voice to read the current line.
11. Supports the advertised keyboard shortcuts and immediate Escape exit.
12. Has no account, analytics, ads, extension network requests, or content upload.
13. Stores only per-site settings locally in the browser.
14. Makes no tracking requests.
15. Keeps page content from leaving the browser / being saved or sent to the product.
16. Lets links work and words remain selectable with the rail active.
17. Installs in three minutes.
18. Gives the stated browser compatibility (Chrome, Edge, Brave, and Chromium).

## Checks that passed

| Check | Evidence | Result |
| --- | --- | --- |
| Clean dependencies | `npm ci` on Node 22.23.2 | Pass; documented prerequisites installed. |
| Unit tests | `npm test` | Pass: 2 files, 6 tests. |
| Type check | `npm run check` | Pass. |
| Production build | `npm run build` | Pass; `dist/site/` and extension ZIP created. |
| Declared local site verifier | `VERIFY_URL=http://127.0.0.1:4173 npm run verify:site` | Pass for `/`, `/privacy/`, `/terms/`; semantic checks, no 390px overflow, zero serious/critical axe findings, no console errors. |
| Declared extension verifier | `VERIFY_URL=http://127.0.0.1:4173 npm run verify:extension` | Pass: packaged extension popup, rail, movement, spacing, Escape, and axe smoke. |
| Live accessibility smoke | Fresh Playwright desktop and 390×844 phone contexts; AxeBuilder against `/`, `/privacy/`, `/terms/` | Pass: one main and h1 per tested page, no horizontal overflow, zero serious/critical axe violations, no console errors. Keyboard reached the skip link with a visible white 3px focus ring; the live rail demonstration moved from line 1 to 2. |
| Reduced motion | Fresh 390px context with `reducedMotion: 'reduce'` | Pass: demo rail transition reports `0.00001s`; document scroll behavior is `auto`. |
| Privacy smoke | Browser request capture while loading and using the live rail demonstration in fresh phone and desktop contexts | Pass: only `https://reading-rail.sociobot.in` was requested; no browser console errors. This does not replace the missing claim test for the privacy promises. |
| Protected-page recovery | Fresh installed extension at `chrome://version/` | Pass: popup shows its unavailable state with app controls hidden and no errors. |
| Live/candidate artifact comparison | Fresh built site and ZIP versus live | Pass: home byte-match; every unpacked live extension file byte-matches the candidate build. |
| Production dependency audit | `npm audit --omit=dev` | Pass: 0 vulnerabilities. |

## Earlier findings and notes

- The prior verification's low CSP/anti-framing/COOP finding is still open as
  R6.
- Its note about full `npm audit` development dependency advisories remains
  accurate: `npm ci` reports 10 development-only advisories; the production
  dependency audit is clean. This is not counted as a shipped-product finding.
- The previous report had no other product finding to re-test. Its reported
  extension normal flow, empty/restricted state, invalid-settings recovery,
  boundaries, spacing, selection, and Escape are implementation-verification
  evidence, but they do not satisfy the newly missing claims contract.

## Recovery path

Implement R1 and R2 first, then test every public claim only through `/demo`
in a fresh context. Add the 404, plain first-screen copy, metadata/skeleton,
and response headers. Re-run the declared commands plus live phone/desktop
and extension-install checks before requesting another review.
