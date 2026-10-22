# Verification

## Automated checks

Latest package check: **14 tests passed, 0 failed**. All three packaged JavaScript files also passed syntax checks.

The repository includes 14 behavior tests covering query recognition, redirect idempotence, filter and search-mode preservation, host boundaries, encoded query values, manifest assets, dictionary promotion, retained button handlers, AI visibility, delayed results, missing-card recovery, toggling, and same-document navigation.

The DOM tests use jsdom and mocked Chrome APIs. They do not represent a complete installed-Chrome end-to-end test.

## Live Google checks from the original development session

With `tbs=1`, browser checks returned the Oxford definition card for `define serendipity`, the similar-word card for `synonyms of serendipity`, and the opposite-word card for `happy antonyms`. Expanding the definition card showed its origin and usage-over-time content.

The Google card and extension logic were checked separately. An installed-Chrome end-to-end test has not been completed. Audio output was not audited. Availability, regional experiments, account settings, future Google markup, and filter behavior remain external dependencies.
