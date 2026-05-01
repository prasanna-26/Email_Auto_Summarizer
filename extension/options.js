chrome.storage.local.get(['anthropicApiKey'], (result) => {
  if (result.anthropicApiKey) {
    document.getElementById('apiKey').value = result.anthropicApiKey;
  }
});

document.getElementById('saveBtn').addEventListener('click', () => {
  const key = document.getElementById('apiKey').value.trim();
  chrome.storage.local.set({ anthropicApiKey: key }, () => {
    const msg = document.getElementById('savedMsg');
    msg.style.display = 'inline';
    setTimeout(() => msg.style.display = 'none', 2000);
  });
});
