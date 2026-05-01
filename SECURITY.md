# Security Policy

## Reporting a Vulnerability

If you discover a security vulnerability in this extension, please **do not open a public issue**.

Instead, email the maintainer directly with:

- A description of the vulnerability
- Steps to reproduce
- Potential impact
- (Optional) A suggested fix

Reasonable response time: within 5 business days.

## Scope

This extension:

- Stores the user's Anthropic API key in `chrome.storage.local` (sandboxed per-extension on the user's machine).
- Sends the content of currently-opened Gmail threads to the Anthropic API for summarization.
- Does not transmit data to any third-party server other than Anthropic's API endpoint.

If you find:

- A way for the extension to leak the stored API key off-machine
- A way to access Gmail data outside `mail.google.com`
- A code injection or XSS vulnerability in the rendered summary panel
- Any other security-relevant issue

…please report it privately as described above.

## Out of Scope

- The Anthropic API itself (report to Anthropic).
- Gmail's own security model (report to Google).
- Issues requiring physical access to an unlocked machine.
