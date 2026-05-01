chrome.storage.local.get(['anthropicApiKey'], (result) => {
  const status = document.getElementById('status');
  if (result.anthropicApiKey) {
    status.className = 'status ok';
    status.textContent = '\u2713 API key set. Ready.';
  } else {
    status.className = 'status warn';
    status.textContent = '\u26A0 No API key. Click below.';
  }
});

document.getElementById('settingsBtn').addEventListener('click', () => {
  chrome.runtime.openOptionsPage();
});
