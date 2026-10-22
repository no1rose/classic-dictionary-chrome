# Privacy

Classic Dictionary processes matching Google queries locally to recognize dictionary lookups. It reloads those searches on Google with a filter intended to restore conventional dictionary results. Words entered in the popup are also sent to Google.

The extension does not send searches or browsing activity to its developer. It uses no analytics, advertising trackers, developer-operated server, remote executable code, or external dictionary API.

The enabled/disabled setting is stored in Chrome's local extension storage. A single recent query and timestamp are kept in the Google tab's session storage to prevent repeated redirects. That record is overwritten by the next redirected query and stops being used after 30 seconds; it can remain in session storage until overwritten or the browser clears that storage. The extension does not transmit the guard. Google page scripts have access to their own session storage.

If you click the Merriam-Webster link, the lookup word is sent to that website. Google and Merriam-Webster handle website requests under their respective privacy policies.

The extension has the `storage` API permission and content-script access only to the Google hosts listed in its manifest. It has no access to all websites and does not request the browsing-history API.

Disable or remove the extension using Chrome's extension manager. Questions can be raised through this repository's issue tracker.
