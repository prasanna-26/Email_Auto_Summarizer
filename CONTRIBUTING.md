# Contributing

Thanks for the interest in improving Email Summarizer!

## Reporting Issues

If you find a bug or a Gmail layout the extension doesn't handle:

1. Open an issue with a clear title.
2. Include the browser and version (e.g., Chrome 130, Edge 131).
3. Describe the thread structure if relevant (number of messages, whether older messages were collapsed, any unusual Gmail features in use).
4. A screenshot of the summary panel and the Gmail thread is highly helpful.
5. If possible, paste the relevant errors from the DevTools Console (`F12` then Console tab).

## Submitting Changes

1. Fork the repo and create a feature branch:
   ```bash
   git checkout -b feature/your-feature-name
   ```
2. Make your changes. Keep them focused. One feature or fix per PR is easier to review.
3. Test thoroughly:
   - Load the unpacked extension in `chrome://extensions`.
   - Open multiple Gmail threads of varying lengths (single message, short, long, with attachments, with collapsed clusters).
   - Confirm the summary panel renders correctly and links work.
4. Commit with clear messages:
   ```bash
   git commit -m "Add: support for Outlook web inbox"
   ```
5. Push and open a pull request describing what changed and why.

## Code Style

- Vanilla JavaScript, no frameworks.
- Two-space indentation.
- Prefer `const` and `let` over `var`.
- Keep functions small and named descriptively.
- Add brief comments for non-obvious DOM selectors or Gmail-specific behavior. Gmail's class names are inscrutable and future maintainers will thank you.

## Areas Where Help Is Welcome

- Outlook Web App support.
- Better handling of mailing list digests.
- Localization (currently English-only prompts).
- Caching summaries per email ID to avoid duplicate API calls.
- Improved automated tests (currently manual).

## Code of Conduct

Be respectful. Assume good intent. Give constructive feedback. That's it.
