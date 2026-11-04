# Seller questionnaire

One focused update: replace the header and hero How it works links with Sell now, opening a 10-question flow in the established monochrome design. Keep Call now and the existing informational three-step section.

Screens: address; property type; approximate beds/baths/size (optional); overall condition with optional repair notes; occupancy; ownership/representative relationship; preferred timing; selling priority; target price (optional); name and preferred contact method. Finish with an editable review, not an automatic offer or eligibility decision.

Interaction: one topic at a time, native radio options, explicit Continue, progress, Back, optional skips, focus management, and preserved answers while the tab is open. No storage, analytics, automatic transmission, financial account details, or identity documents. Preview mode uses sample details and clearly states nothing is sent. A verified lead endpoint is required for actual delivery. No destination has been supplied yet.

Research consulted November 4, 2026:
- https://www.webuyuglyhouses.com/ — address-first entry and conversation/walkthrough before an offer.
- https://help.opendoor.com/selling/how-it-works/what-types-of-homes — property type, condition, and occupancy considerations.
- https://www.opendoor.com/articles/how-opendoor-calculates-the-value-of-your-home — address, size, beds/baths, condition, and repairs inform valuation.
- https://www.offerpad.com/sell/ — selling priorities and timing shape the appropriate process.

These topics informed Miron's own flow; competitors' eligibility criteria, timelines, and fees are not adopted. Buyer-specific underwriting, title, mortgage/payoff questions, agent agreements, and detailed inspections belong in follow-up, not this short first contact.

Validation: three focused Node tests for property answers, contact data, and delivery confirmation/error behavior; browser walkthrough of steps, Back, edits, review, mobile layout, and demo completion. Preserve public access and publish to the existing Site; push the matching source to IronFaith/miron.

Verified locally: all ten screens, required-answer errors, optional size/price skipping, retained values on Back and reopening, both contact methods, ten-row review, saved edits, canceled edits restoring the prior value, and no horizontal overflow at 390px. No browser console errors. The preview download action displayed its requested status; the in-app browser did not expose a download event, so file delivery was not confirmed there. No live lead was submitted because no destination was supplied.
