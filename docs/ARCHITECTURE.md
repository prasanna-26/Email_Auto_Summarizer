# Architecture

This document describes the internal architecture of the Email Summarizer extension for anyone reading the code or contributing.

## High-Level Flow

```
User opens Gmail email
        │
        ▼
┌─────────────────────────────────────────┐
│         content.js (in Gmail tab)       │
│                                         │
│  1. URL hash change detected            │
│  2. Expand all collapsed messages       │
│  3. Walk DOM, extract per-message data  │
│  4. Unwrap tracking redirects in links  │
│  5. Send thread payload to background   │
└─────────────────────────────────────────┘
        │
        │ chrome.runtime.sendMessage
        ▼
┌─────────────────────────────────────────┐
│       background.js (service worker)    │
│                                         │
│  1. Load API key from chrome.storage    │
│  2. Build structured prompt             │
│  3. Call Anthropic API (fetch)          │
│  4. Strip stray markdown                │
│  5. Return summary text                 │
└─────────────────────────────────────────┘
        │
        │ async response
        ▼
┌─────────────────────────────────────────┐
│         content.js (rendering)          │
│                                         │
│  1. Parse section headers + bullets     │
│  2. Linkify URLs                        │
│  3. Inject HTML into floating panel     │
└─────────────────────────────────────────┘
```

## Manifest V3 Components

The extension uses three Manifest V3 component types:

| Component | File(s) | Runtime |
|---|---|---|
| Service worker | `background.js` | Chrome extension background, on-demand |
| Content script | `content.js`, `content.css` | Gmail tab DOM |
| Action popup | `popup.html`, `popup.js` | When toolbar icon clicked |
| Options page | `options.html`, `options.js` | Settings page |

The service worker is intentionally stateless. It only runs while a request is being processed, then unloads.

## Thread Extraction Strategy

Gmail's DOM hides older messages in two ways:

1. **Collapsed message cards.** Each `.adn` element exists but has no body content (no `.a3s.aiL` child).
2. **Clustered older messages.** When a thread has many messages, Gmail wraps the older ones in `.adx` elements and renders them only when clicked.

The expansion logic in `content.js`:

- Runs up to 10 passes.
- On each pass:
  - Clicks `[aria-label*="Expand all"]` buttons.
  - Clicks `[aria-label*="trimmed"]` and "Show more" buttons.
  - Clicks all `.adx` cluster wrappers.
  - Sweeps `[role="button"]` elements for "N earlier messages" text.
  - Clicks each individual collapsed message card.
- Bails out early once the message count is stable for 2 consecutive passes with zero remaining collapsed messages.

This handles every Gmail layout encountered in testing, including threads of 11+ messages with multiple cluster groups.

## Link Extraction

Gmail wraps every link as:

```
https://www.google.com/url?q=https%3A%2F%2Freal-url.com%2Fpath&sa=D&source=editors
```

The `unwrapGoogleRedirect` function in `content.js` parses this URL, extracts the `q` parameter, and returns the decoded original URL. This ensures:

- Claude receives the real URL when summarizing.
- The user clicks through to the actual destination, not a tracking redirect.
- Links don't break if Google's redirect service ever changes.

The `extractBodyWithLinks` function clones the message DOM, walks all `<a>` elements, and converts them inline as:

```
"Click here" becomes "Click here (https://real-url.com)"
```

This preserves both the link text (which carries semantic meaning) and the URL (which carries the destination) in the plain-text payload sent to Claude.

## Prompt Engineering

The prompt in `background.js` is structured to:

1. **Force consistent section headers.** Every summary uses the same eight ALL-CAPS labels so `content.js` can parse them deterministically.
2. **Forbid markdown.** Explicit "DO NOT use asterisks, underscores, backticks" rules, plus a defensive regex strip in `summarizeEmail` that removes any markdown that slips through.
3. **Demand specificity.** The prompt emphasizes concrete details over vague summaries.
4. **Handle threads vs single messages.** The prompt branches at the top: if `isThread`, it asks for a sequential conversation flow covering every message; otherwise a simpler single-message summary.

## Rendering

`renderStructuredSummary` in `content.js` does line-by-line parsing:

- Lines matching one of the known section headers get wrapped in `.claude-summary-section-header`.
- Lines starting with `- ` or `• ` get wrapped in `.claude-summary-bullet`.
- Other lines are also rendered as bullets (defensive fallback).

`linkifyAndEscape` handles URLs:

1. Escapes HTML entities first to prevent XSS from email content.
2. Then matches `https?://...` patterns and wraps them in `<a target="_blank" rel="noopener noreferrer">`.
3. Strips trailing punctuation from URLs so a sentence-ending period doesn't get included in the link.

## Storage

The API key lives in `chrome.storage.local`, scoped to the extension. It is:

- Never sent anywhere except `api.anthropic.com`.
- Not synced across devices (intentional, since `storage.sync` is size-limited and may be backed up to Google).
- Cleared when the extension is uninstalled.

## Why No Build Step?

The extension is intentionally vanilla JS, HTML, and CSS to:

- Make the source instantly readable by anyone cloning the repo.
- Avoid supply-chain risk from npm dependencies in a code path that handles email content.
- Skip the toolchain overhead. No webpack, no babel, no tsc.
- Keep the install path as simple as "Load unpacked".

If the project grows, this can be revisited. For now the simplicity is a feature.
