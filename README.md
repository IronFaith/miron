# Miron

A simple black-and-white website demo for a business that buys homes for cash.

## Preview

Run `python -m http.server 4317 --directory dist --bind 127.0.0.1` and open `http://127.0.0.1:4317`.

There is no build step or dependency installation. The publishable site is the `dist` directory.

## Activate contact details

Edit `dist/config.js`. Set `phone` to the verified international number, such as `+1` followed by the real 10-digit number, and `phoneDisplay` to its readable version. Add a verified `serviceArea` and `buyerName` when available. All call links then use that number. With no phone, the call buttons open a clearly labeled demo notice.

## Seller questionnaire

Sell now opens ten short screens and an editable review. Answers remain in tab memory, survive closing and reopening the dialog, and clear on page refresh. The preview asks visitors to use sample details and can download a local text summary. It does not submit or persist a lead.

To enable delivery, configure `leadEndpoint` in `dist/config.js` with the business's approved HTTPS endpoint or a same-origin path. This frontend does not include a receiving backend. An endpoint must validate and save the lead, enforce appropriate limits, and return JSON `{"accepted":true}` only after actual acceptance; support `requestId` deduplication so retries do not duplicate leads. Cross-origin endpoints must allow this site's origin and JSON POST requests. Keep secrets on the server; this configuration is public. Before transmission, the seller reviews answers and explicitly agrees to share them with Miron for contact about the property. No marketing/text-message enrollment is included.

The payload includes `requestId`, `source`, `answers`, and `contactConsent`. Only the selected contact method is included. Requests use POST JSON with no cookies, no redirects, and a 15-second timeout. Unconfirmed or failed delivery retains the answers for retry and never displays a success message.

Run the focused behavior tests with `node --test tests/seller-questions.test.mjs`.

Before promoting the site, verify the buying terms, service area, actual business identity, and required business disclosures. No specific price, closing period, fee waiver, or acceptance of a property is promised. The house illustration is AI-generated concept imagery, not a past project. The logo is an initial raster asset.

## Files

- `dist/index.html`: page content and semantic controls.
- `dist/styles.css`: responsive monochrome design.
- `dist/app.js`: contact configuration, mobile menu, and dialog behavior.
- `dist/seller-flow.mjs` and `dist/seller-flow.css`: questionnaire presentation and interaction.
- `dist/seller-questions.mjs`: question content, validation, summaries, and delivery contract.
- `dist/assets/`: generated logo and house illustration.
- `docs/asset-prompts.txt`: exact prompts and generation provenance.

The source repository and hosted demo are public: https://github.com/IronFaith/miron and https://miron-home-buyers.wlfhse.chatgpt.site. GitHub Pages is not enabled for this business site.
