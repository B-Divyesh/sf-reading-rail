# Reading Rail

Reading Rail is a free Chromium extension for readers who lose their place in
dense browser text or experience visual crowding. It places a keyboard-movable
focus rail over the original page, dims the surroundings, offers per-site WCAG
text-spacing presets, and can read the current line with the browser’s own
speech service.

It deliberately does not replace the page, change its font, summarise content,
track reading, or make medical claims. Page content never leaves the browser.

Live site: <https://reading-rail.sociobot.in>

## Features

- One-line or paragraph focus, aligned to the page’s rendered text
- Arrow-key navigation and instant `Escape` exit
- `Alt/Option + Shift + R` global toggle and `Alt/Option + Shift + S` speech toggle
- Adjustable surrounding dim and three per-site spacing presets
- Built-in browser text-to-speech for the current line or paragraph
- Local-only settings; no accounts, analytics, network calls, or content upload
- Light and dark popup treatments, reduced-motion support, and 44px controls

## Develop and test

Requires Node.js 20+ and npm.

```sh
npm install
npm run dev          # WXT extension development server
npm run dev:site     # landing site at http://localhost:5173
npm run check        # strict TypeScript
npm test             # unit tests
npm run build        # reproducible extension + site build
npm run verify:site  # axe + semantics + console checks (site server required)
npm run verify:extension # packaged extension smoke test (site server required)
```

The exact factory build command is `npm run build`. Outputs:

- `dist/extension/` — unpacked Chrome MV3 extension
- `dist/site/` — deployable static site (with `index.html` at its root)
- `dist/site/downloads/reading-rail-chrome.zip` — packaged extension linked by the site

To test the extension manually, open `chrome://extensions`, enable Developer
mode, choose **Load unpacked**, and select `dist/extension/`. Open a text-heavy
article and click the toolbar icon.

## Project layout

- `entrypoints/` — WXT background, content, and popup entrypoints
- `lib/` — settings and rail geometry shared with tests
- `site/` — Vite static landing, privacy, and terms pages
- `assets/src/` — original generated artwork and provenance
- `.factory/design.md` — product-specific visual system
- `.factory/handoff.md` — build and verification record

## Privacy and permissions

`storage` keeps site-specific preferences locally. `activeTab` lets the popup
talk to the current page, and `<all_urls>` lets the focus rail work wherever a
reader opens ordinary web content. Browser-protected pages remain inaccessible.
See [site/privacy/index.html](site/privacy/index.html) for the shipped policy.

## Deploy

Deploy `dist/site/` as a static directory. The Param Factory owns deployment,
DNS, and billing; this repository does not modify infrastructure.

## License

MIT. Generated artwork is original to the project and covered by the same
license; its prompt and review record are in `assets/src/hero-reading-rail.json`.
