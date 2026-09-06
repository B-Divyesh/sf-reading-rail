# Verification 2 — Follow dense text one line at a time

**Work order:** `reading-rail-verify-2`  
**Verified:** 2026-09-06  
**Live URL:** <https://reading-rail.sociobot.in>  
**Implementation candidate:** `a1ad87e6447fbddec21b74e6364406137b3ffb3a`  
**Documentation baseline reviewed:** `a291140ffc042f907da91eb3caa5e48c4f82a9f5`

## Verdict

**FAIL — 1 medium finding, 0 untested public claims.**

The job is to follow dense browser text one line at a time. It is for readers
with dyslexia or visual crowding. Before scrolling, both a fresh 1440 × 1000
desktop page and a fresh 390 × 844 phone page show **Try it with sample data**;
it opens a populated sample reading view.

`a1ad87e` is the implementation reviewed. The documentation baseline is later
than that implementation, but `git diff --name-status a1ad87e..a291140` shows
only `.factory/handoff.md`; no later product image was required for review.

## Finding

| ID | Severity | Finding | Evidence and required fix |
| --- | --- | --- | --- |
| V2-1 | Medium | **Start for real does not discard demo data.** The sample sandbox remains in browser storage after the visitor leaves it. | In a fresh live browser context, `/demo/` created `demo:reading-rail:sample-state` after moving to Line 2. Clicking **Start for real** navigated to `/`, but that exact `demo:` key and value remained. This does not change extension settings or real data, but it violates the demo-sandbox contract: leaving demo mode must discard demo data, or explicitly offer a one-time keep choice. Make the exit remove the `demo:` key before navigation, then add a tagged observable test. |

## Clean checkout and declared claims

I created a detached clean checkout at `a1ad87e`, used Node 22.23.2 and npm
10.9.8, then ran `npm ci`. The documented setup completed successfully.

| Check | Evidence | Result |
| --- | --- | --- |
| `npm test` | 6 unit tests and all 15 Playwright claim tests | Pass |
| `npm run check` | `tsc --noEmit` | Pass |
| `npm run build` | Built `dist/site/`, `dist/extension/`, and the ZIP | Pass |
| `npm audit --omit=dev` | Production dependency tree | Pass: 0 vulnerabilities |
| `verify:site` | Semantics, mobile overflow, live demo control, 404, headers, links, keyboard, reduced motion, dark-mode Axe | Pass |
| `verify:extension` | Packaged popup, rail, movement, spacing, Escape, Axe | Pass |

Every command declared in `.factory/claims.json` was run separately from that
clean checkout. Each selected exactly one tagged test and passed. A final
unfiltered `npm run test:claims` also passed all 15 tests.

| Claim ID | Standalone result |
| --- | --- |
| `demo-sample` | Pass |
| `demo-isolation` | Pass |
| `demo-reset` | Pass |
| `rail-line` | Pass |
| `rail-paragraph` | Pass |
| `page-intact` | Pass |
| `rail-reflow` | Pass |
| `dim-surroundings` | Pass |
| `spacing-local` | Pass |
| `browser-speech` | Pass |
| `keyboard-escape` | Pass |
| `reset-local` | Pass |
| `local-settings` | Pass |
| `private-network` | Pass |
| `free-download` | Pass |

The public site, README, privacy page, terms, and demo documentation were
cross-checked against this manifest. All public functional/privacy promises are
listed and tested. There is no public offline, update, backend, tenant, or rate
limit promise; those checks do not apply to this static MV3 extension.

## Live site checks

Fresh desktop and phone browser contexts opened the live page. In each context,
before scrolling, the h1 was “Follow dense text one line at a time.”, the
audience sentence named readers with dyslexia or visual crowding, and the hero
action was visible in the viewport.

The action opened `/demo/` in one click. The page showed nine realistic library
website review notes, the persistent **Demo — sample data, nothing is saved**
label, movement from Line 1 of 9 to Line 2 of 9, and Reset demo returning to
Line 1 of 9. In a fresh context with a `reading-rail:real-settings` sentinel,
using demo movement and wide spacing left that sentinel unchanged and wrote
only `demo:reading-rail:sample-state`. The demo reset status explicitly stated
that extension settings were not changed.

Clicking **Start for real** was also checked. It correctly returned home and
did not copy any state into real extension settings, but it left the demo key
behind. This is V2-1.

Live `/`, `/demo/`, `/privacy/`, and `/terms/` returned 200. An unknown route
returned the designed 404 page with HTTP 404; the browser’s expected failed
resource console message for that deliberate status is not a defect. Privacy
and terms had their route titles, one main, and one h1. Every same-origin link
from the demo resolved successfully.

Fresh desktop and dark-mode phone Axe checks found zero serious or critical
violations on home, demo, privacy, terms, and the designed 404. The phone had
no horizontal overflow. Tab reached the visible 3px skip-link focus ring first.
Reduced-motion mode set the rail transition to `1e-05s`. Normal live page loads
had no console errors and made requests only to the product origin.

## Extension and artifact checks

The live `/`, `/demo/`, `/privacy/`, `/terms/`, and `/404.html` bytes each
SHA-256-match the fresh candidate build. The downloaded live ZIP was unpacked
into a new Chromium consumer profile; every unpacked file exactly matched
`dist/extension/`.

That clean installed artifact was exercised on the live demo. It started the
rail, moved it with ArrowDown, hid it with Escape, and applied the 25% and 88%
surrounding-dim boundaries. Invalid persisted values (`enabled: 'yes'`, invalid
mode/spacing, and `dim: 999`) recovered to disabled line/original settings with
the dim clamped to 88%. On `chrome://version/`, the popup showed its protected-
page unavailable recovery state. No extension console or page errors occurred.

## Security and earlier findings

Live `/demo/` sent HSTS, CSP with `frame-ancestors 'none'`, X-Frame-Options
DENY, COOP, nosniff, Referrer-Policy, and a restrictive Permissions-Policy.

| Earlier finding | Current disposition | Evidence |
| --- | --- | --- |
| R1: no isolated sample | Partially fixed; V2-1 open | Direct populated `/demo/`, persistent label, reset, and real-settings isolation work. The exit does not discard its demo key. |
| R2: no claims manifest/tests | Fixed | 15 manifest entries, 15 individually passing tagged tests, plus full clean run. |
| R3: no real 404 | Fixed | Live unknown route returns designed HTTP 404. |
| R4: unclear first screen | Fixed | Desktop and phone show job, audience, and sample first action before scrolling. |
| R5: missing metadata/skeleton | Fixed | Route titles, canonical/social metadata, Demo navigation, footer, legal routes, and local-link crawl pass. |
| R6: missing security headers | Fixed | Live CSP, anti-framing, and COOP response headers confirmed. |
| Verify-1 development-only advisories | Not a shipped finding | `npm audit --omit=dev` is clean; the documented full-tree WXT tooling advisories remain development-only. |

## Result

**FAIL.** The clean gates and all declared claims pass, but V2-1 remains a
medium demo-sandbox defect. The product cannot receive PASS until leaving the
demo discards its state or offers the contract’s explicit one-time keep choice,
with a matching tagged claim test.
