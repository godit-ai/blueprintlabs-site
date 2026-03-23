// PMI Chrome Extension - Background Service Worker

chrome.runtime.onInstalled.addListener(() => {
  console.log('PMI Extension installed');
  
  // Set default settings
  chrome.storage.sync.set({
    'pmi-enabled': true,
    'pmi-compression': true,
    'pmi-objects': true,
    'pmi-cache': true,
    'pmi-stats': {
      totalTokensSaved: 0,
      totalCostSaved: 0,
      compressionsCount: 0
    }
  });
});

// Listen for tab updates to inject content script
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete') {
    const url = tab.url;
    if (url && (
      url.includes('chat.openai.com') ||
      url.includes('claude.ai') ||
      url.includes('gemini.google.com')
    )) {
      chrome.scripting.executeScript({
        target: { tabId: tabId },
        files: ['content.js']
      });
    }
  }
});
