# Reading Rail

Reading Rail is a free Chrome extension for readers with dyslexia or visual
crowding who need a clear place in dense browser text. It moves a focus rail
through text one line or paragraph at a time without replacing the page.

Try the isolated sample first: <https://reading-rail.sociobot.in/demo/>.
The sample uses `demo:` browser storage, so its controls do not change your
extension settings.

## What it does

- Moves the rail through readable browser text one line at a time
- Focuses a line or a paragraph, and keeps links and text selection available
- Keeps the rail visible after the page reflows
- Dims surrounding text while leaving the current reading unit visible
- Saves original, open, or wide text spacing for one site only
- Starts browser speech for the selected text
- Uses Arrow keys to move and Escape to hide the rail
- Needs no account, content upload, or tracking request

Each statement above is declared in [.factory/claims.json](.factory/claims.json)
and has a tagged browser test that runs against the sample page.

## Install

1. Download `reading-rail-chrome.zip` from the live site.
2. Unzip it.
3. Open `chrome://extensions`, turn on Developer mode, and choose **Load
   unpacked**.
4. Select the unzipped folder and open Reading Rail on a text page.

Browser-protected pages, browser stores, PDF viewers, and unusually rendered
pages may not expose usable text to a browser extension.

## Develop and verify

Requires Node.js 20+ and npm. Playwright is pinned to 1.58.2; its Chromium
browser is required for the consumer and claim checks.

```sh
npm ci
npm test
npm run check
npm run build
npm run preview:site
VERIFY_URL=http://127.0.0.1:4173 npm run verify:site
VERIFY_URL=http://127.0.0.1:4173 npm run verify:extension
```

`npm test` runs the unit suite and every claim in a fresh browser setup. To
run one declared claim, copy its command from `.factory/claims.json`, for
example:

```sh
npm run test:claims -- --grep @claim:demo-isolation
```

The factory build command is `npm run build`. It produces:

- `dist/extension/` — unpacked Chrome MV3 extension
- `dist/site/` — deployable static site
- `dist/site/downloads/reading-rail-chrome.zip` — extension package linked by the site

## Privacy and sample data

The extension stores per-site settings in local browser storage. Its page
content stays in the browser; it has no account flow or tracking request.
The demo is separate from extension storage and has **Reset demo** plus
**Start for real** controls. See [.factory/demo.md](.factory/demo.md) and
[the privacy policy](site/privacy/index.html) for details.

## Project layout

- `entrypoints/` — WXT background, content, and popup entrypoints
- `lib/` — settings and rail geometry shared with tests
- `site/` — static landing, demo, privacy, terms, and 404 pages
- `tests/claims/` — clean-consumer claim tests
- `assets/src/` — original generated artwork and provenance
- `.factory/design.md` — product-specific visual system
- `.factory/handoff.md` — build and verification record

## Deploy

Deploy `dist/site/` as a static directory using its included
`staticwebapp.config.json`. The Param Factory owns deployment and DNS; this
repository does not modify infrastructure.

## License

MIT. Generated artwork is original to the project and covered by the same
license. Its prompt and review record are in `assets/src/hero-reading-rail.json`.
