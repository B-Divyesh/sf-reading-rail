# Reading Rail — visual thesis

## Direction: monochrome typographic broadsheet

Reading Rail borrows from the physical acts of proofreading: a newspaper column,
a blue editor’s pencil, and an index card held under the current line. It should
feel precise and calm, not clinical. The landing page is a broadsheet with strong
rules and numbered folios; the extension popup is the same system compressed
into a useful tool. Decoration is limited to marks that explain focus and place.

## Palette

The base is explicitly light, like warm uncoated newsprint. A dark treatment is
provided for system dark mode.

| Token | Light | Dark | Role |
| --- | --- | --- | --- |
| Paper | `#F2EFE7` | `#171817` | background |
| Sheet | `#FAF8F1` | `#222321` | surface |
| Ink | `#171917` | `#F4F1E8` | primary text |
| Ash | `#5A5E59` | `#B9BDB5` | secondary text |
| Rule | `#9A9C94` | `#666A63` | structural rules |
| Editor blue | `#164B73` | `#7FC4F2` | focus and action |
| Blue contrast | `#FFFFFF` | `#102536` | accent text |
| Success | `#2F6647` | `#8AD6A8` | confirmation |
| Warning | `#7A4B08` | `#F0C16A` | unavailable state |
| Danger | `#8A2E28` | `#FF9E95` | error |

All body/accent combinations meet WCAG AA. Blue is never the only state cue:
labels, underlines, checks, and live text accompany it.

## Typography

- Display/editorial: Georgia, `Times New Roman`, serif. The distinctive,
  high-contrast shapes make headlines feel printed and are used only at large
  sizes.
- Utility/body: system UI (`Inter`-like platform sans without a download) for
  controls and long-form explanatory text. The extension never loads fonts or
  changes typeface on visited pages.
- Scale: 14, 16, 20, 28, 48, 72px. Body is never below 16px on the site.
  Reading measure is 45–72 characters; utility copy uses 1.5 leading.

## Spacing and form

An 8px base rhythm, with 4px for optical adjustments. Broadsheet sections use
24/48/80px vertical intervals and hairline rules. Corners are nearly square
(2–6px) to evoke trimmed paper, not cards. Controls are at least 44px tall.
The focus rail is a clear horizontal aperture with a 2px editor-blue rule and
soft neutral dimming above and below; it never receives pointer events.

## Interaction grammar

- “Place” is always explicit: `Line 4 of 12`, a position rule, and a short
  keyboard legend.
- Arrow movement is linear and predictable. A rail enters from its current
  reading position, not from a decorative direction.
- Buttons depress by 1px; settings confirm through concise live-region text.
- The extension’s dimmer is an overlay, preserving native links, selection,
  focus, screen-reader semantics, and the page DOM.
- Escape is the universal exit. `Alt/Option + Shift + R` toggles the rail;
  arrows move it; `Alt/Option + Shift + S` reads or stops the current line.

## Motion policy

Rail movement uses a 180ms transform/height transition so the ruler follows the
reader’s place. Control feedback uses 120ms opacity/transform changes. No motion
loops. With `prefers-reduced-motion: reduce`, all transitions and smooth scroll
are disabled; state and position remain fully apparent.

## Responsive intent

At 390px the landing page becomes a single column, drops nonessential folio
metadata, stacks calls to action, and keeps the interactive rail demonstration.
The extension popup fits a 360px browser panel; its two-column preset controls
become a single logical flow without shrinking touch targets.

## Asset plan and provenance

The hero uses one original generated editorial still-life: strips of newsprint
crossed by a cobalt reading ruler, photographed from above with empty areas and
no legible text. It clarifies the physical metaphor without pretending to be a
product screenshot. The interface diagram and icons are hand-authored SVG/CSS
because they must be exact and code-native.

### Prompt sheet

- Subject: a single cobalt-blue translucent reading ruler aligned across dense,
  abstract newspaper columns, with one line in crisp focus.
- World/materials: warm uncoated paper, graphite registration marks, letterpress
  ink, subtle fibre and imperfect deckled edges.
- Light/lens: soft north-window light, overhead editorial still-life,
  restrained shadow, 50mm-equivalent, sharp paper texture.
- Palette words: warm newsprint, carbon black, graphite grey, proofreader blue.
- Composition: landscape, diagonal paper layers, quiet negative space, no hands.
- Negative list: no readable text, no alphabet soup, no logos, no watermark,
  no people, no screens, no gradients, no saturated colors other than blue.

Generated with the Factory Azure image model (`factory-image`) on 2026-08-27.
The generated image is original to Reading Rail and used under the project MIT
license. Source prompt and generation metadata live beside the source image in
`assets/src/hero-reading-rail.json`.
