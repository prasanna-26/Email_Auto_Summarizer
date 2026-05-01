let currentEmailId = null;
let summaryPanel = null;
let debounceTimer = null;

const SECTION_HEADERS = [
  'OVERVIEW',
  'CONVERSATION FLOW',
  'THREAD FLOW',
  'KEY POINTS',
  'ACTION ITEMS',
  'DEADLINES & DATES',
  'DEADLINES AND DATES',
  'LINKS & NEXT STEPS',
  'LINKS AND NEXT STEPS',
  'CONCLUSION',
  'FINAL CONCLUSION',
  'CURRENT STATE',
  'TONE & PRIORITY',
  'TONE AND PRIORITY'
];

function getEmailIdFromUrl() {
  const hash = window.location.hash;
  const match = hash.match(/\/([a-zA-Z0-9]+)$/);
  return match ? match[1] : null;
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function unwrapGoogleRedirect(url) {
  if (!url) return url;
  try {
    const u = new URL(url, window.location.origin);
    if (u.hostname.endsWith('google.com') && u.pathname === '/url') {
      const real = u.searchParams.get('q') || u.searchParams.get('url');
      if (real) return real;
    }
  } catch (e) {}
  return url;
}

function extractBodyWithLinks(bodyEl) {
  const clone = bodyEl.cloneNode(true);
  const anchors = clone.querySelectorAll('a[href]');
  anchors.forEach((a) => {
    const text = (a.innerText || '').trim();
    const rawHref = a.getAttribute('href') || '';
    const href = unwrapGoogleRedirect(rawHref);
    let replacement = '';
    if (!href || href.startsWith('mailto:')) {
      replacement = href ? href.replace('mailto:', '') : text;
    } else if (text && text !== href) {
      replacement = `${text} (${href})`;
    } else {
      replacement = href;
    }
    a.replaceWith(document.createTextNode(replacement));
  });
  return clone.innerText.trim();
}

function safeClick(el) {
  if (!el) return;
  try { el.click(); } catch (e) {}
}

function looksLikeClusterButton(el) {
  const ariaLabel = (el.getAttribute('aria-label') || '').toLowerCase();
  const text = (el.textContent || '').trim().toLowerCase();
  if (/expand all/i.test(ariaLabel)) return true;
  if (/show trimmed/i.test(ariaLabel)) return true;
  if (/earlier message|older message|hidden message|more message/i.test(ariaLabel)) return true;
  if (/^\d+\s*(more|earlier|older|hidden)/i.test(text)) return true;
  if (/\d+ more in this conversation/i.test(text)) return true;
  return false;
}

// Aggressively expand:
//  1. Any "Expand all" / "Show trimmed" buttons
//  2. Any cluster element grouping older messages (.adx, .kv, "X earlier messages" buttons)
//  3. Each individual collapsed .adn message card
// Repeats until message count stabilizes AND no collapsed cards remain.
async function expandAllCollapsedMessages() {
  let lastTotal = -1;
  let stableIterations = 0;

  for (let pass = 0; pass < 10; pass++) {
    // 1. Click any "Expand all" button(s)
    document.querySelectorAll('[aria-label*="Expand all" i]').forEach(safeClick);

    // 2. Click any "Show trimmed content" / "trimmed" buttons
    document
      .querySelectorAll('[aria-label*="trimmed" i], [aria-label*="Show more" i]')
      .forEach(safeClick);

    // 3. Click Gmail's cluster wrappers that hide older messages.
    //    Common classes: .adx (truncation cluster), .kv (sometimes used too).
    document.querySelectorAll('.adx, span.adx, div.adx').forEach(safeClick);

    // 4. Sweep all role=button elements looking for "N earlier messages" type
    document.querySelectorAll('[role="button"], button').forEach((btn) => {
      if (looksLikeClusterButton(btn)) safeClick(btn);
    });

    await sleep(600);

    // 5. Expand individual collapsed message cards
    const messages = document.querySelectorAll('div.adn');
    const collapsed = Array.from(messages).filter(
      (m) => !m.querySelector('.a3s.aiL') && !m.querySelector('.ii.gt')
    );

    for (const msg of collapsed) {
      const target =
        msg.querySelector('[aria-expanded="false"]') ||
        msg.querySelector('.kQ') ||
        msg.querySelector('.gs') ||
        msg.querySelector('.G3') ||
        msg.querySelector('.h7') ||
        msg;
      safeClick(target);
    }

    await sleep(900);

    // 6. Check stability: same total count + zero collapsed for 2 passes = done
    const currentMessages = document.querySelectorAll('div.adn');
    const currentCollapsed = Array.from(currentMessages).filter(
      (m) => !m.querySelector('.a3s.aiL') && !m.querySelector('.ii.gt')
    );

    if (currentMessages.length === lastTotal && currentCollapsed.length === 0) {
      stableIterations++;
      if (stableIterations >= 2) return;
    } else {
      stableIterations = 0;
    }
    lastTotal = currentMessages.length;
  }
}

async function extractThreadContent() {
  const subjectEl = document.querySelector('h2.hP');
  if (!subjectEl) return null;
  const subject = subjectEl.innerText.trim();

  await expandAllCollapsedMessages();

  const messageEls = document.querySelectorAll('div.adn');
  const messages = [];

  messageEls.forEach((msgEl) => {
    const senderEl = msgEl.querySelector('.gD');
    const dateEl = msgEl.querySelector('.g3') || msgEl.querySelector('span.g3');
    const bodyEl = msgEl.querySelector('.a3s.aiL') || msgEl.querySelector('.ii.gt');
    const snippetEl = msgEl.querySelector('.y2');

    const sender = senderEl ? senderEl.innerText.trim() : 'Unknown sender';
    let date = 'Unknown date';
    if (dateEl) {
      date = dateEl.getAttribute('title') || dateEl.innerText.trim();
    }

    let body = '';
    if (bodyEl) {
      body = extractBodyWithLinks(bodyEl);
    } else if (snippetEl) {
      body = '[Only preview available] ' + snippetEl.innerText.trim();
    }

    if (body) {
      messages.push({ sender, date, body: body.slice(0, 3500) });
    }
  });

  if (messages.length === 0) {
    const senderEl = document.querySelector('.gD');
    const bodyEl = document.querySelector('.a3s.aiL') || document.querySelector('.ii.gt');
    if (!bodyEl) return null;
    messages.push({
      sender: senderEl ? senderEl.innerText.trim() : 'Unknown sender',
      date: 'Unknown date',
      body: extractBodyWithLinks(bodyEl).slice(0, 8000)
    });
  }

  let total = 0;
  const MAX_TOTAL = 22000;
  const trimmed = [];
  for (const m of messages) {
    if (total + m.body.length > MAX_TOTAL) {
      const remaining = Math.max(0, MAX_TOTAL - total);
      if (remaining > 200) {
        trimmed.push({ ...m, body: m.body.slice(0, remaining) + '\n[truncated]' });
      }
      break;
    }
    trimmed.push(m);
    total += m.body.length;
  }

  return { subject, messages: trimmed };
}

function createSummaryPanel() {
  if (summaryPanel) return summaryPanel;

  summaryPanel = document.createElement('div');
  summaryPanel.id = 'claude-summary-panel';
  summaryPanel.innerHTML = `
    <div class="claude-summary-header">
      <span class="claude-summary-title">Email Summary</span>
      <button class="claude-summary-close" id="claude-close-btn">&times;</button>
    </div>
    <div class="claude-summary-content" id="claude-summary-content"></div>
  `;
  document.body.appendChild(summaryPanel);
  document.getElementById('claude-close-btn').addEventListener('click', () => {
    summaryPanel.style.display = 'none';
  });
  return summaryPanel;
}

function escapeHtml(s) {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function linkifyAndEscape(text) {
  const escaped = escapeHtml(text);
  return escaped.replace(/(https?:\/\/[^\s<>"')\]]+)/g, (match) => {
    const trail = match.match(/[.,;:!?]+$/);
    let url = match;
    let suffix = '';
    if (trail) {
      url = match.slice(0, -trail[0].length);
      suffix = trail[0];
    }
    return `<a href="${url}" target="_blank" rel="noopener noreferrer">${url}</a>${suffix}`;
  });
}

function isSectionHeader(line) {
  const trimmed = line.trim().toUpperCase().replace(/:$/, '');
  return SECTION_HEADERS.includes(trimmed);
}

function renderStructuredSummary(text) {
  const lines = text.split('\n');
  const parts = [];

  for (const raw of lines) {
    const line = raw.trim();
    if (!line) continue;

    if (isSectionHeader(line)) {
      const label = line.replace(/:$/, '');
      parts.push(`<div class="claude-summary-section-header">${escapeHtml(label)}</div>`);
    } else if (line.startsWith('- ') || line.startsWith('• ')) {
      const bulletText = line.replace(/^[-•]\s+/, '');
      parts.push(`<div class="claude-summary-bullet">${linkifyAndEscape(bulletText)}</div>`);
    } else {
      parts.push(`<div class="claude-summary-bullet">${linkifyAndEscape(line)}</div>`);
    }
  }
  return parts.join('');
}

function showPanel() {
  const panel = createSummaryPanel();
  panel.style.display = 'flex';
}

function setPanelContent(text, className) {
  showPanel();
  const content = document.getElementById('claude-summary-content');
  content.className = 'claude-summary-content ' + (className || '');
  content.scrollTop = 0;

  if (className === 'loading' || className === 'error') {
    content.textContent = text;
  } else {
    content.innerHTML = renderStructuredSummary(text);
  }
}

async function summarizeCurrentEmail() {
  setPanelContent('Reading thread (expanding all messages)...', 'loading');

  const thread = await extractThreadContent();
  if (!thread) {
    setPanelContent('Could not read email content.', 'error');
    return;
  }

  const msgCount = thread.messages.length;
  const loadingMsg =
    msgCount > 1
      ? `Summarizing thread (${msgCount} messages) with Claude...`
      : 'Summarizing with Claude...';
  setPanelContent(loadingMsg, 'loading');

  try {
    const response = await chrome.runtime.sendMessage({
      type: 'SUMMARIZE',
      payload: thread
    });
    if (response.error) {
      setPanelContent(response.error, 'error');
    } else {
      setPanelContent(response.summary, '');
    }
  } catch (e) {
    setPanelContent('Failed: ' + e.message, 'error');
  }
}

function checkForEmailChange() {
  const newId = getEmailIdFromUrl();
  if (newId && newId !== currentEmailId && newId.length > 10) {
    currentEmailId = newId;
    setTimeout(summarizeCurrentEmail, 1300);
  } else if (!newId || newId.length <= 10) {
    currentEmailId = null;
    if (summaryPanel) summaryPanel.style.display = 'none';
  }
}

function debouncedCheck() {
  clearTimeout(debounceTimer);
  debounceTimer = setTimeout(checkForEmailChange, 400);
}

window.addEventListener('hashchange', debouncedCheck);
setTimeout(debouncedCheck, 1500);
