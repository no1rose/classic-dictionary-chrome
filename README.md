<img src="extension/icons/128.png" width="80" height="80" alt="Classic Dictionary icon">

# Classic Dictionary for Chrome

Bring back Google's familiar dictionary card for definition, synonym, and antonym searches, and hide known AI answer panels on those searches.

Classic Dictionary uses Google's actual Oxford dictionary card when Google provides it, preserving its native pronunciation, expansion, and similar/opposite-word controls.

**Early release:** Google controls dictionary availability and appearance. Restoration is not guaranteed for every word, account, or region. This project is not affiliated with Google or Oxford University Press.

## Install

No coding, account, API key, or build tools are needed.

1. On this repository, choose **Code → Download ZIP**.
2. Extract the downloaded ZIP and keep the extracted folder somewhere permanent.
3. Open `chrome://extensions` in desktop Chrome.
4. Enable **Developer mode** at the top right.
5. Click **Load unpacked** and select the **extension** folder inside the extracted repository. This is the folder containing `manifest.json`.
6. Refresh existing Google tabs, then search normally.

This is a manually installed extension, not a Chrome Web Store listing. Keep the extension folder in place while using it. Downloads from GitHub do not install automatically.

## Try it

| Search | Intended result |
| --- | --- |
| `define serendipity` | Google's original definition card |
| `happy synonyms` | Similar-word results |
| `happy antonyms` | Opposite-word results |
| `what does ephemeral mean` | Dictionary lookup |

Pin the extension through Chrome's puzzle-piece menu to access the on/off switch and the word lookup box.

## Features

- Recognizes explicit English definition, meaning, synonym, antonym, opposite, and pronunciation searches.
- Requests conventional Google results and promotes the original dictionary result above ordinary web results.
- Preserves the existing dictionary node and its controls rather than generating definitions.
- Hides known AI answer modules and the AI Mode navigation link on matching searches.
- Handles late-loading content and navigation within a search tab.
- Displays an unavailable notice when Google does not return a dictionary card, with links to try a definition or open Merriam-Webster.

## Scope and limitations

The extension uses Google's undocumented `tbs=1` filter behavior. Google may change it or its page structure at any time. An exact historical design, every dictionary feature, and removal of future AI layouts cannot be guaranteed.

Bare-word searches such as `happy` are left alone. Use `happy definition` or the popup. Explicit Images, Videos, News, Shopping, and Web-only searches are respected. English lookup wording is supported on google.com and the regional Google hosts listed in [the manifest](extension/manifest.json).

Requires desktop Chrome 111 or later. Mobile Chrome is not supported. This repository contains the Chrome edition only.

## Privacy

No analytics, developer server, remote code, or API key. The extension sends lookup searches to Google and stores the on/off preference locally. A recent-query guard in the Google tab prevents repeated reloads. An external dictionary is contacted only when its link is clicked. See [PRIVACY.md](PRIVACY.md) for details.

## Update or remove

To update, replace the files in the same extension folder, click **Reload** on `chrome://extensions`, then refresh Google. Updates from GitHub are manual.

To disable temporarily, use the popup switch. Refresh Google to clear the already-applied filter. To uninstall, click **Remove** on `chrome://extensions`.

## Testing

The included tests cover query matching, URL handling, domain restrictions, scoped AI hiding, native-card promotion, enable/disable behavior, late-loading results, and navigation. They use simulated browser APIs and DOM fixtures.

To run the developer tests with a current Node.js LTS release:

```sh
npm install
npm test
```

These dependencies are for tests only; they are not part of the installed extension. See [VERIFICATION.md](VERIFICATION.md) for the results and limits of testing.

## Report a problem

Open a GitHub issue describing your Chrome version, a non-sensitive example search, the Google domain, and what appeared. If adding a screenshot, remove account details and any personal information first.

## Rights

**All Rights Reserved.** This is not an MIT-licensed or open-source project. Personal installation and use are permitted under [LICENSE.txt](LICENSE.txt). GitHub's platform terms still apply to viewing and forking a public repository.

## References

- [Google dictionary boxes](https://support.google.com/websearch/answer/10106608?hl=en)
- [Chrome's unpacked-extension installation guide](https://developer.chrome.com/docs/extensions/get-started/tutorial/hello-world#load-unpacked)
- The `tbs=1` behavior was found in an [independently published userscript](https://greasyfork.org/en/scripts/580322-bye-bye-mr-google-ai/code). This extension's implementation was written separately.
