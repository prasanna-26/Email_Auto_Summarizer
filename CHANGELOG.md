# Changelog

All notable changes to this project are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0] - 2026-04-30

### Added
- Initial public release.
- Auto-detection of opened Gmail emails via URL hash change.
- Multi-pass thread expansion to handle Gmail's collapsed message clusters.
- DOM-based extraction of sender, body, and links from each message in a thread.
- Unwrapping of Gmail's `google.com/url?q=...` tracking redirects to preserve original URLs.
- Structured eight-section summary output: Overview, Conversation Flow, Key Points, Action Items, Deadlines & Dates, Links & Next Steps, Conclusion, Tone & Priority.
- Floating summary panel rendered in the bottom-right corner of Gmail with custom scrollbar and clickable links.
- Toolbar popup showing API key status and a shortcut to settings.
- Settings page for entering and saving the Anthropic API key to `chrome.storage.local`.
- Markdown stripping on Claude responses to prevent stray `**` or `#` from leaking into the panel.
- Defensive defaults: graceful fallbacks if a thread can't be expanded; size caps so very long threads don't exceed prompt limits.
