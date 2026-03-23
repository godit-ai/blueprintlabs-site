// PMI Chrome Extension - Popup Script

document.addEventListener('DOMContentLoaded', async () => {
  // Load settings
  const settings = await chrome.storage.sync.get([
    'pmi-enabled',
    'pmi-compression',
    'pmi-objects',
    'pmi-cache',
    'pmi-api-key',
    'pmi-stats'
  ]);
  
  const stats = settings['pmi-stats'] || { totalTokensSaved: 0, totalCostSaved: 0 };
  
  // Update stats display
  document.getElementById('tokens-saved').textContent = stats.totalTokensSaved.toLocaleString();
  document.getElementById('cost-saved').textContent = `$${stats.totalCostSaved.toFixed(2)}`;
  
  // Set toggle states
  document.getElementById('toggle-compression').classList.toggle('active', settings['pmi-compression'] !== false);
  document.getElementById('toggle-objects').classList.toggle('active', settings['pmi-objects'] !== false);
  document.getElementById('toggle-cache').classList.toggle('active', settings['pmi-cache'] !== false);
  
  // Load API key
  if (settings['pmi-api-key']) {
    document.getElementById('api-key').value = settings['pmi-api-key'];
  }
  
  // Load last compression
  const lastCompression = await chrome.storage.local.get('pmi-last-compression');
  if (lastCompression['pmi-last-compression']) {
    const data = lastCompression['pmi-last-compression'];
    document.getElementById('original-tokens').textContent = `${data.original.tokens} tokens`;
    document.getElementById('compressed-tokens').textContent = `${data.compressed.tokens} tokens`;
    document.getElementById('savings-percent').textContent = `${data.metrics.compressionRatio}%`;
  }
  
  // Toggle handlers
  document.getElementById('toggle-compression').addEventListener('click', async () => {
    const el = document.getElementById('toggle-compression');
    const newState = !el.classList.contains('active');
    el.classList.toggle('active');
    await chrome.storage.sync.set({ 'pmi-compression': newState });
    notifyContentScript();
  });
  
  document.getElementById('toggle-objects').addEventListener('click', async () => {
    const el = document.getElementById('toggle-objects');
    const newState = !el.classList.contains('active');
    el.classList.toggle('active');
    await chrome.storage.sync.set({ 'pmi-objects': newState });
    notifyContentScript();
  });
  
  document.getElementById('toggle-cache').addEventListener('click', async () => {
    const el = document.getElementById('toggle-cache');
    const newState = !el.classList.contains('active');
    el.classList.toggle('active');
    await chrome.storage.sync.set({ 'pmi-cache': newState });
    notifyContentScript();
  });
  
  // Save API key
  document.getElementById('save-key').addEventListener('click', async () => {
    const key = document.getElementById('api-key').value.trim();
    if (key) {
      await chrome.storage.sync.set({ 'pmi-api-key': key });
      document.getElementById('save-key').textContent = 'Saved!';
      setTimeout(() => {
        document.getElementById('save-key').textContent = 'Save API Key';
      }, 2000);
      notifyContentScript();
    }
  });
  
  // Notify content script to refresh
  async function notifyContentScript() {
    const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
    if (tabs[0]) {
      chrome.tabs.sendMessage(tabs[0].id, { action: 'refresh' });
    }
  }
});
