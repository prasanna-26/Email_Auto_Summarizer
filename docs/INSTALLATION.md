# Installation Guide

A detailed walkthrough for installing and configuring Email Summarizer.

## Prerequisites

| Requirement | Notes |
|---|---|
| Chromium-based browser | Chrome, Edge, Brave, Arc, or Vivaldi |
| Anthropic API key | Free to create at [console.anthropic.com](https://console.anthropic.com) |
| API credits | Add ~$5 to your Anthropic account; typical email summarization costs well under $0.01 per email |

You do **not** need Node.js, npm, or any build tools. The extension is plain HTML, CSS, and JavaScript.

## Step 1: Get the Code

### Option A: Clone with Git
```bash
git clone https://github.com/<your-username>/email-summarizer.git
cd email-summarizer
```

### Option B: Download ZIP
1. Click the green **Code** button on the GitHub repo.
2. Click **Download ZIP**.
3. Unzip somewhere convenient (e.g., `~/projects/email-summarizer`).

## Step 2: Get Your Anthropic API Key

1. Go to [console.anthropic.com](https://console.anthropic.com) and sign in (or sign up).
2. Navigate to **Settings**, then **API Keys**.
3. Click **Create Key**, give it a name (e.g., "Email Summarizer"), and copy the key. It starts with `sk-ant-...`.
4. Add credits to your account if you haven't already (**Plans & Billing**).

> **Heads up:** The API key is only shown once at creation. Save it somewhere secure if you need it again.

## Step 3: Load the Extension

1. Open your browser and go to one of:
   - `chrome://extensions` (Chrome)
   - `edge://extensions` (Edge)
   - `brave://extensions` (Brave)
2. Toggle **Developer mode** ON in the top-right corner.
3. Click **Load unpacked**.
4. Select the `extension/` subfolder inside the repo you cloned or unzipped (not the repo root). The 8 extension files live there.
5. The extension will appear in your extensions list.
6. Click the puzzle-piece icon in your browser's toolbar and pin **Email Summarizer with Claude** so its icon is always visible.

## Step 4: Add Your API Key

1. Click the Email Summarizer icon in your toolbar.
2. Click **Open Settings**.
3. Paste your `sk-ant-...` key into the field.
4. Click **Save**. You should see a green "Saved ✓" confirmation.

## Step 5: Test It

1. Open [mail.google.com](https://mail.google.com) in the same browser.
2. Click on any email or thread.
3. Within 1 to 3 seconds, a panel appears in the bottom-right with the structured summary.
4. Try opening a longer thread to confirm the multi-message expansion works. The loading indicator will say "Summarizing thread (N messages) with Claude..."

## Troubleshooting

### The panel doesn't appear

- Verify the extension is enabled at `chrome://extensions`.
- Hard-refresh Gmail: `Ctrl+Shift+R` (Windows/Linux) or `Cmd+Shift+R` (Mac).
- Check that the API key is saved: click the toolbar icon. The status should say "✓ API key set."

### "API error 401" in the panel

- Your API key is invalid or has been revoked. Go back to **Settings** and paste a fresh key.

### "API error 429"

- Rate limit hit. Wait a minute and try again.
- If frequent, your account may be on a low rate-limit tier. Check Anthropic's console.

### Summary is missing some messages in a thread

- This usually happens with very large threads (50+ messages) where DOM expansion races with Gmail's lazy loading.
- Try refreshing Gmail and opening the thread again.
- If consistent, please [open an issue](https://github.com/<your-username>/email-summarizer/issues) with details.

### Extension stops working after a Chrome update

- Manifest V3 occasionally evolves. Reload the extension at `chrome://extensions` (the circular arrow icon).
- If still broken, pull the latest version from the repo.

## Updating

To pull the latest version:

```bash
cd email-summarizer
git pull
```

Then reload the extension at `chrome://extensions` (click the circular arrow on the extension card).

## Uninstalling

1. Go to `chrome://extensions`.
2. Find Email Summarizer with Claude.
3. Click **Remove**.

Your API key is stored in extension-local storage and is removed when you uninstall.
