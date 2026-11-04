# Miron

A simple black-and-white website demo for a business that buys homes for cash.

## Preview

Run `python -m http.server 4317 --directory dist --bind 127.0.0.1` and open `http://127.0.0.1:4317`.

There is no build step or dependency installation. The publishable site is the `dist` directory.

## Activate contact details

Edit `dist/config.js`. Set `phone` to the verified international number, such as `+1` followed by the real 10-digit number, and `phoneDisplay` to its readable version. Add a verified `serviceArea` and `buyerName` when available. All call links then use that number. With no phone, the buttons open a clearly labeled demo notice; no data is collected or submitted.

Before promoting the site, verify the buying terms, service area, actual business identity, and required business disclosures. No specific price, closing period, fee waiver, or acceptance of a property is promised. The house illustration is AI-generated concept imagery, not a past project. The logo is an initial raster asset.

## Files

- `dist/index.html`: page content and semantic controls.
- `dist/styles.css`: responsive monochrome design.
- `dist/app.js`: contact configuration, mobile menu, and dialog behavior.
- `dist/assets/`: generated logo and house illustration.
- `docs/asset-prompts.txt`: exact prompts and generation provenance.

GitHub stores the source; Sites hosts the private demo. GitHub Pages is not enabled for this business site.
