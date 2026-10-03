# Restrict Free Access and Rename the Product

## What will change
- Rename all customer-visible “Cadence” branding to “Unspoken,” including navigation, page titles, descriptions, FAQs, forms, legal pages, and demo labels.
- Preserve existing browser data while moving the internal storage key to the new product name.
- Keep the three free practice attempts and the useful basic result after each answer.
- Tighten free access so users see only a useful preview rather than complete paid views:
  - Dashboard: keep the current pattern and next practice; lock deeper recommendations, response history, and change tracking.
  - Responses: show only the newest response preview; lock full history, filters, and comparisons.
  - Skills: show the current focus summary; lock full skill cards, detailed evidence, and trends.
  - Drills: show the recommended drill preview; lock drill entry, recommendations, library, and completed results.
  - Progress: show the top-level progress summary; lock detailed skill changes, timing history, comparisons, patterns, and milestones.
- Keep paid Practice and Sprint access unchanged.

## Technical details
- Continue using the existing entitlement checks and shared locked-preview component.
- Add free-state branching at page-section level rather than hiding navigation or creating separate pages.
- Verify the Free Demo and paid demos in desktop and mobile views, and confirm the latest app build has no errors.
