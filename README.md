# Miron

A simple black-and-white website demo for a business that buys homes for cash.

Use plain text labels throughout the site. Do not add emoji, decorative arrows, or decorative UI icons. Keep the Miron logo and functional color swatches.

## Preview

Run `python -m http.server 4317 --directory dist --bind 127.0.0.1` and open `http://127.0.0.1:4317`.

There is no build step or dependency installation. The publishable site is the `dist` directory.

The **Colors** button opens six palette presets plus main/background and accent controls. Text contrast adjusts with the palette, including the seller questionnaire. Choices are saved only in the visitor's browser; they do not publish a new default for other visitors. **Reset to black & white** restores the original design. The shared-link image remains the original Miron logo.

## Activate contact details

Edit `dist/config.js`. Set `phone` to the verified international number, such as `+1` followed by the real 10-digit number, and `phoneDisplay` to its readable version. Add a verified `serviceArea` and `buyerName` when available. All call links then use that number. With no phone, the call buttons open a clearly labeled demo notice.

## Seller questionnaire

Sell now opens ten short screens and an editable review. The first eight answers are quick choices, starting with the seller's priorities. Only the property address, name, and one contact method require typing. Size and price use ranges with an unsure option. Answers remain in tab memory, survive closing and reopening the dialog, and clear on page refresh. In demo mode, **Preview this lead** opens a buyer summary instead of downloading a file. It shows the seller, contact method, property, selling plans, and reasons for the follow-up priority. It does not submit or persist a lead.

The homepage now leads with **We buy your house for cash** and **Get my cash offer**. The first priority question appears beside the headline instead of the concept house image. Selecting a choice carries that answer into the same questionnaire and opens question two; Back lets the seller change it. Other answers are preserved when an inline priority is changed, and ordinary offer buttons resume the current questionnaire. The navigation retains **Sell now**.

The mobile bottom action bar appears only after the hero's offer buttons have scrolled above the screen. It hides again when those buttons return or the closing contact actions are visible, avoiding duplicate calls to action.

Lead priority uses only timing and stated selling intent: **Hot** means within three months and beyond exploring; **Warm** means three to six months, uncertain timing, or exploratory near-term interest; **Cold** means over six months or exploring without near-term timing. Price, address, property condition, occupancy, and seller identity do not change priority. The buyer checklist gives contextual prompts to confirm contact/intent, authority to sell, and property details. Checklist marks are manual, remain in tab memory, and reset when answers change. No lead is automatically verified or approved. The priority legend is available inside the preview. Connected submission mode retains the seller review and consent flow.

To enable delivery, configure `leadEndpoint` in `dist/config.js` with the business's approved HTTPS endpoint or a same-origin path. This frontend does not include a receiving backend. An endpoint must validate and save the lead, enforce appropriate limits, and return JSON `{"accepted":true}` only after actual acceptance; support `requestId` deduplication so retries do not duplicate leads. Cross-origin endpoints must allow this site's origin and JSON POST requests. Keep secrets on the server; this configuration is public. Before transmission, the seller reviews answers and explicitly agrees to share them with Miron for contact about the property. No marketing/text-message enrollment is included.

The payload includes `requestId`, `source`, `answers`, and `contactConsent`. Only the selected contact method is included. Requests use POST JSON with no cookies, no redirects, and a 15-second timeout. Unconfirmed or failed delivery retains the answers for retry and never displays a success message.

Run the behavior tests with `node --test`.

## Seller walkthrough

The homepage focuses on selling as-is, with a **Sell now** primary action, repair/inheritance/property/moving situations, and three short steps. A prominent **See how selling to Miron works** banner below the hero opens https://ironfaith.github.io/miron/selling/. The 30-second video has on-screen text, optional captions, and a transcript; it has no audio. Its Sell now link opens the questionnaire directly. Mobile visitors have a fixed Sell now / Call now bar. Timing guidance reflects the seller's first priority answer without changing the questions or lead scoring.

Regenerate this video and poster with `python scripts/render-seller-demo.py` (Pillow, FFmpeg, and Windows Segoe UI fonts required). There is no website build step.

## Realtor video demo

The separate buyer walkthrough remains at https://ironfaith.github.io/miron/demo/. **Watch lead demo (30 sec)** is available in a lead's priority card, where it opens a new tab to preserve questionnaire answers. You can also share `dist/demo/miron-lead-demo.mp4`. It uses one fictional seller with three sets of timing/intent answers to illustrate hot, warm, and cold priorities, then shows the buyer confirmation checklist. It is an illustrated walkthrough, with no audio. The player includes optional captions and a text transcript.

The examples are checked against the actual `summarizeLead` function in `scripts/lead-demo-data.mjs`. To regenerate the video and poster on Windows, run `python scripts/render-lead-demo.py` with Pillow, Node.js, FFmpeg, and Segoe UI fonts available. This is only needed when changing the video; the website still has no build step.

Before promoting the site, verify the buying terms, service area, actual business identity, and required business disclosures. No specific price, closing period, fee waiver, or acceptance of a property is promised. The house illustration is AI-generated concept imagery, not a past project. The logo is an initial raster asset.

## Files

- `dist/index.html`: page content and semantic controls.
- `dist/styles.css`: responsive monochrome design.
- `dist/app.js`: contact configuration, mobile menu, and dialog behavior.
- `dist/seller-flow.mjs` and `dist/seller-flow.css`: questionnaire presentation and interaction.
- `dist/seller-questions.mjs`: question content, validation, summaries, and delivery contract.
- `dist/lead-summary.mjs`: explainable follow-up priority and buyer review prompts.
- `dist/theme-preview.mjs`, `dist/theme-preview.css`, and `dist/palettes.mjs`: browser-local palette controls and readable theme colors.
- `dist/assets/`: generated logo and house illustration.
- `docs/asset-prompts.txt`: exact prompts and generation provenance.

Live demo on GitHub Pages: https://ironfaith.github.io/miron/

Public source repository: https://github.com/IronFaith/miron

The Pages workflow publishes `dist` when site files change on `main`. You can also run **Publish Miron to GitHub Pages** manually from the repository's Actions tab. The live site uses relative asset paths so it works under `/miron/`.
