# Seller questionnaire

One focused update: replace the header and hero How it works links with Sell now, opening a 10-question flow in the established monochrome design. Keep Call now and the existing informational three-step section.

Screens: selling priority; preferred timing; property type; condition; approximate size range; occupancy; ownership/representative relationship; target price range; address; name and preferred contact method. The first eight screens use short tap-to-select answers. Size and price include an unsure option. No written explanations or repair-notes box. Start with the seller's priorities, then ask for address and contact details after the quick choices. Finish with an editable review, not an automatic offer or eligibility decision.

Interaction: one topic at a time, native radio options, explicit Continue, completed-step progress, Back, focus management, and preserved answers while the tab is open. Short prompts and progress cues help sellers keep moving; no emojis, decorative arrows, fake urgency, or promised offer. No storage, analytics, automatic transmission, financial account details, or identity documents. Preview mode uses sample details and clearly states nothing is sent. A verified lead endpoint is required for actual delivery. No destination has been supplied yet.

Research consulted November 4, 2026:
- https://www.webuyuglyhouses.com/ — address-first entry and conversation/walkthrough before an offer.
- https://help.opendoor.com/selling/how-it-works/what-types-of-homes — property type, condition, and occupancy considerations.
- https://www.opendoor.com/articles/how-opendoor-calculates-the-value-of-your-home — address, size, beds/baths, condition, and repairs inform valuation.
- https://www.offerpad.com/sell/ — selling priorities and timing shape the appropriate process.

These topics informed Miron's own flow; competitors' eligibility criteria, timelines, and fees are not adopted. Buyer-specific underwriting, title, mortgage/payoff questions, agent agreements, and detailed inspections belong in follow-up, not this short first contact.

Validation: three focused Node tests for property answers, contact data, and delivery confirmation/error behavior; browser walkthrough of steps, Back, edits, review, mobile layout, and demo completion. Preserve public access and publish from IronFaith/miron to GitHub Pages at https://ironfaith.github.io/miron/.

Earlier verification covered retained values on Back and reopening, both contact methods, saved and canceled edits, and no horizontal overflow at 390px. The preview download action displayed its requested status; the in-app browser did not expose a download event, so file delivery was not confirmed there. No live lead was submitted because no destination was supplied.

Quick-choice revision verified: all eight choice screens contain no typing fields; required-choice feedback, range summaries, retained price on Back, the final address/contact screens, and the ten-row review work. Canceling an edit to the first answer restores it. The opener fits at 390 × 844 with no horizontal overflow; desktop rendering is also checked. All three behavior tests pass and the browser reports no console errors.
