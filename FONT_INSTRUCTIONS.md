# Font Subsetting Instructions

For the Beta environment, we are using subsetted fonts to reduce the Cloudflare Worker's memory footprint.

When processing the `.ttf` font files (e.g., using `pyftsubset` or a similar tool), please restrict the glyphs to the following Unicode ranges:

- **Basic Latin:** `U+0020-U+007E`
- **Latin-1 Supplement:** `U+00C0-U+00FF`

These ranges provide coverage for standard characters, punctuation, and common accents required for Metamorfit while minimizing file size.
