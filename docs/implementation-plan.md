# Miron demo implementation plan

Goal: Deliver the approved one-page home-buying demo with a white logo and white text on black, a clear call action, and a three-step selling process.

Architecture: Buildless HTML, CSS, and small browser JavaScript in dist/. Business contact details live in one configuration file. No lead collection or invented business claims while contact details are missing.

Spec: The approved conversation direction: sell a home for cash, move forward with less hassle; explain the process; use the Miron M/roof/doorway logo. Latest direction is white lettering on black.

Single milestone:
- [x] Create responsive page, approved logo variant, illustrative house image, FAQ, and contact dialog.
- [x] Verify contact behavior, FAQ and mobile navigation, responsive layout, and local asset availability.
- [ ] Package and publish the private demo through Sites; preserve a separate GitHub source repository if creation is available.

Constraints: Keep business phone unset until supplied; show explicit demo contact status. No fake testimonials, fees, service area, closing promises, or successful submissions. English is the temporary default. No framework, dependencies, or parallel agents. Local self-review only.

Verification: Browser checks for desktop and narrow mobile layout, contact dialog and focus/keyboard behavior, FAQ expansion, and navigation. Static packaging check for references and JavaScript syntax. One final package.

Browser evidence: HTTP 200; 1280px and 390px layouts without horizontal overflow; all images loaded; contact dialog opens, Escape closes it and restores focus; mobile menu opens and closes after navigation; FAQ expands; fixed mobile call button is visible; no browser console errors. Phone number remains unset, so no real calls or lead submissions are enabled.
