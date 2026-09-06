# Reading Rail demo sandbox

## Entry point

Open `https://reading-rail.sociobot.in/demo/` or choose **Try it with sample
data** on the landing page. The page immediately shows nine realistic library
website review notes with the rail on the first line.

## Isolation and reset

The demo writes only `demo:reading-rail:sample-state` in the browser's local
storage. It never reads or writes the extension's local browser storage or any
non-`demo:` key. **Reset demo** removes that key and restores the first line,
line focus, 68% dim, and original spacing. **Start for real** returns home; it
does not copy demo state into extension settings.

## What claim tests use

The claim suite starts from `/demo/` in a fresh browser context. Extension
claims load the packaged extension against the same sample page, so the sample
is the only page content involved. No account or network service is required.
