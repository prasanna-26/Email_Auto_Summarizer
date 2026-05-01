# Email Summarizer for Gmail

> A lightweight Chrome extension that auto-summarizes any Gmail email or thread the moment you open it, powered by Anthropic's Claude API.

Open an email and within seconds a clean side panel appears with a structured summary covering the conversation flow, key points, action items, deadlines, links, and a final conclusion. No buttons to press, no copy-paste.

---

## Features

- **Zero-click summarization.** Runs automatically when any email is opened.
- **Full thread support.** Expands every message in a thread, including older messages that Gmail collapses by default.
- **Structured output.** Every summary is broken into eight consistent sections: Overview, Conversation Flow, Key Points, Action Items, Deadlines & Dates, Links & Next Steps, Conclusion, and Tone & Priority.
- **Smart link extraction.** Pulls real URLs out of email HTML and unwraps Gmail's tracking redirects so the links you see are the ones the sender actually shared.
- **Clickable links in the summary panel.** Open in a new tab with one click.
- **Privacy-friendly.** Your API key is stored locally in Chrome storage and never leaves your machine except to call the Anthropic API.

## Tech Stack

| Layer | Technology |
|---|---|
| Editor | Visual Studio Code |
| Runtime | Chrome Extensions Manifest V3 |
| Frontend | Vanilla HTML, CSS, JavaScript (no build step, no frameworks) |
| LLM | Anthropic Claude API (`claude-haiku-4-5`) |
| Storage | Chrome `storage.local` API |

## Project Structure

```
email-summarizer/
├── README.md
├── LICENSE
├── CHANGELOG.md
├── CONTRIBUTING.md
├── SECURITY.md
├── .gitignore
├── docs/
│   ├── ARCHITECTURE.md
│   └── INSTALLATION.md
└── extension/                  ← The 8 files Chrome loads
    ├── manifest.json           Extension config: permissions, scripts, host targets
    ├── background.js           Service worker; calls the Claude API
    ├── content.js              Runs on Gmail; extracts threads and renders the summary panel
    ├── content.css             Styling for the floating summary panel
    ├── popup.html              Toolbar popup markup (status + settings shortcut)
    ├── popup.js                Toolbar popup logic
    ├── options.html            Settings page (API key entry)
    └── options.js              Settings page logic (saves to Chrome storage)
```

### What each file does

- **`manifest.json`**: declares Manifest V3, requests the `storage` permission and host access for `mail.google.com` and `api.anthropic.com`, registers the content script, and points to the background service worker.
- **`background.js`**: receives the extracted thread payload from `content.js`, builds a structured prompt, calls the Anthropic API, and returns the summary. Strips any markdown that slips through.
- **`content.js`**: runs inside Gmail. Detects when an email is opened (via URL hash change), aggressively expands all collapsed messages in the thread (handles Gmail's "older messages" cluster), walks the DOM to extract each message's sender, body, and links, unwraps Gmail's `google.com/url?q=...` tracking redirects, and renders the summary panel.
- **`content.css`**: styles for the floating panel, including bottom-right placement, custom scrollbar, section headers, bullets, and clickable links.
- **`popup.html`**: markup for the small UI that appears when the extension's toolbar icon is clicked (status indicator and a settings button).
- **`popup.js`**: logic for the toolbar popup. Checks whether an API key is set and routes the user to the settings page.
- **`options.html`**: the settings page layout where the API key is entered.
- **`options.js`**: logic for the settings page. Saves the API key to Chrome's local storage and loads it back on revisits.

## How It Works

```
┌───────────────┐                  ┌──────────────┐                  ┌──────────────┐
│  Gmail tab    │                  │  content.js  │                  │ background.js│
│  (any email   │ ── opens ───────▶│  expands all │ ── thread ──────▶│  builds      │
│   thread)     │                  │  messages,   │   payload        │  prompt,     │
│               │                  │  extracts    │                  │  calls       │
│               │                  │  body+links  │                  │  Claude API  │
│               │                  │              │                  │              │
│               │◀── summary ──────│  renders     │◀── response ─────│              │
│               │   panel          │  panel       │                  │              │
└───────────────┘                  └──────────────┘                  └──────────────┘
```

1. **Detect.** `content.js` listens for URL hash changes in Gmail and detects when an email view is opened.
2. **Expand.** Runs up to 10 passes clicking "Expand all" buttons, collapsed message clusters (`.adx`), and individual collapsed message cards (`.adn`) until every message body is in the DOM.
3. **Extract.** Walks each `.adn` element, grabs sender, date, body text, and unwraps Gmail's tracking redirects to recover original links.
4. **Send.** Passes the full thread payload to `background.js` via `chrome.runtime.sendMessage`.
5. **Summarize.** `background.js` builds a structured prompt and calls the Anthropic API.
6. **Render.** The response is returned to `content.js`, which parses section headers and bullets and renders them as a clean panel with clickable links.

## Installation

### Prerequisites

- Google Chrome (or any Chromium-based browser: Edge, Brave, Arc).
- An Anthropic API key, available at [console.anthropic.com](https://console.anthropic.com).
- A few dollars of Anthropic API credits. Typical email summarization runs well under $0.01 per email with Claude Haiku.

### Steps

1. Clone or download this repository:
   ```bash
   git clone https://github.com/<your-username>/email-summarizer.git
   ```
2. Open `chrome://extensions` (or `edge://extensions`) in your browser.
3. Toggle **Developer mode** ON (top-right corner).
4. Click **Load unpacked** and select the `extension/` folder inside the repo (not the repo root).
5. Pin the extension from the toolbar puzzle-piece menu.
6. Click the extension icon, then **Open Settings**, paste your `sk-ant-...` API key, and click **Save**.
7. Open any Gmail email or thread. The summary panel appears automatically in the bottom-right corner.

## Usage

Once configured, the extension runs silently. Open any email or thread in Gmail and:

- A loading message appears: *"Reading thread (expanding all messages)..."*
- Followed by: *"Summarizing thread (N messages) with Claude..."*
- The structured summary then renders in the panel.

To dismiss the panel, click the **×** in its header. It will reappear on the next email.

## Output Format

Every summary follows this consistent structure:

- **Overview**: what the email or thread is about and who's involved.
- **Conversation Flow**: sequential narrative of who said what (no dates clutter).
- **Key Points**: substantive content with concrete details.
- **Action Items**: what the recipient needs to do.
- **Deadlines & Dates**: every time-bound item.
- **Links & Next Steps**: meeting links, attachments, follow-ups.
- **Conclusion**: current state of the conversation based on the latest message.
- **Tone & Priority**: overall tone and priority level for the recipient.

## Privacy & Security

- Your API key is stored exclusively in `chrome.storage.local` on your device.
- Email content is sent to Anthropic's API only when you open an email. Nothing is logged or persisted on any third-party server controlled by this extension.
- The extension only activates on `mail.google.com` (declared in `extension/manifest.json`).
- No analytics, telemetry, or tracking.

If your inbox contains highly sensitive content (HIPAA, attorney-client privilege, classified info), review Anthropic's [usage policies](https://www.anthropic.com/policies) and your organization's data-handling rules before installing.

## Customization

Want different summary sections, a different model, or a different prompt style? Edit the `prompt` variable in [`extension/background.js`](./extension/background.js). The prompt is plain English and you can tweak section names, length, tone, or output format directly.

To switch models (e.g., to Claude Sonnet for higher-quality summaries), change the `MODEL` constant at the top of `extension/background.js`:

```javascript
const MODEL = 'claude-sonnet-4-5'; // slower, more expensive, sharper
```

To extend support to Outlook web, Yahoo Mail, or other clients, add their domains to `host_permissions` and the content script's `matches` in `extension/manifest.json`, then update the DOM selectors in `extension/content.js` to match the new client's structure.

## Roadmap

Possible future additions:

- [ ] Cache summaries per email so re-opens are instant and free.
- [ ] One-click "draft a reply" using the summary as context.
- [ ] Action item extraction with calendar integration.
- [ ] Outlook web and Yahoo Mail support.
- [ ] Configurable summary depth (brief / standard / detailed) via settings page.
- [ ] Local model option via Ollama for fully offline use.

## Contributing

Issues and pull requests welcome. If you find a Gmail layout the extension doesn't handle (e.g., specific account types or experimental UIs), please open an issue with a screenshot and a description of the thread structure.

## License

[MIT](./LICENSE). Free to use, modify, and distribute.

## Acknowledgments

- Built with the [Anthropic Claude API](https://docs.anthropic.com/).
- Inspired by the small daily friction of skimming long email threads before replying.
