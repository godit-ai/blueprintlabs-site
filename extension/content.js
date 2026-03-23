// PMI Chrome Extension - Content Script
// Intercepts prompts on ChatGPT, Claude, and Gemini

(function() {
  'use strict';
  
  // PMI API endpoint (update with your deployed API)
  const PMI_API_URL = 'https://api.blueprintlabs.live';
  
  // State
  let isEnabled = true;
  let useCompression = true;
  let useObjectMemory = true;
  let usePrefixCache = true;
  let apiKey = null;
  
  // Statistics
  let stats = {
    totalTokensSaved: 0,
    totalCostSaved: 0,
    compressionsCount: 0
  };
  
  // Initialize
  init();
  
  async function init() {
    // Load settings
    const result = await chrome.storage.sync.get([
      'pmi-enabled',
      'pmi-compression',
      'pmi-objects',
      'pmi-cache',
      'pmi-api-key',
      'pmi-stats'
    ]);
    
    isEnabled = result['pmi-enabled'] !== false;
    useCompression = result['pmi-compression'] !== false;
    useObjectMemory = result['pmi-objects'] !== false;
    usePrefixCache = result['pmi-cache'] !== false;
    apiKey = result['pmi-api-key'] || null;
    stats = result['pmi-stats'] || { totalTokensSaved: 0, totalCostSaved: 0, compressionsCount: 0 };
    
    if (!isEnabled) return;
    
    // Detect platform and inject
    const hostname = window.location.hostname;
    
    if (hostname.includes('chat.openai.com')) {
      initChatGPT();
    } else if (hostname.includes('claude.ai')) {
      initClaude();
    } else if (hostname.includes('gemini.google.com')) {
      initGemini();
    }
  }
  
  // ChatGPT Integration
  function initChatGPT() {
    console.log('PMI: Initializing ChatGPT integration');
    
    // Watch for textarea
    const observer = new MutationObserver(() => {
      const textarea = document.querySelector('textarea[data-id="root"]');
      if (textarea && !textarea.dataset.pmiEnabled) {
        enablePMIForTextarea(textarea, 'chatgpt');
      }
    });
    
    observer.observe(document.body, { childList: true, subtree: true });
  }
  
  // Claude Integration
  function initClaude() {
    console.log('PMI: Initializing Claude integration');
    
    const observer = new MutationObserver(() => {
      const textarea = document.querySelector('div[contenteditable="true"]');
      if (textarea && !textarea.dataset.pmiEnabled) {
        enablePMIForTextarea(textarea, 'claude');
      }
    });
    
    observer.observe(document.body, { childList: true, subtree: true });
  }
  
  // Gemini Integration
  function initGemini() {
    console.log('PMI: Initializing Gemini integration');
    
    const observer = new MutationObserver(() => {
      const textarea = document.querySelector('textarea');
      if (textarea && !textarea.dataset.pmiEnabled) {
        enablePMIForTextarea(textarea, 'gemini');
      }
    });
    
    observer.observe(document.body, { childList: true, subtree: true });
  }
  
  // Enable PMI for a textarea
  function enablePMIForTextarea(textarea, platform) {
    textarea.dataset.pmiEnabled = 'true';
    
    // Add compression indicator
    const indicator = document.createElement('div');
    indicator.className = 'pmi-indicator';
    indicator.innerHTML = `
      <span class="pmi-icon">🗜️</span>
      <span class="pmi-text">PMI Active</span>
      <span class="pmi-savings"></span>
    `;
    
    // Position indicator near textarea
    const wrapper = textarea.parentElement;
    if (wrapper) {
      wrapper.style.position = 'relative';
      wrapper.appendChild(indicator);
    }
    
    // Intercept form submission
    const form = textarea.closest('form');
    if (form) {
      form.addEventListener('submit', async (e) => {
        if (!isEnabled) return;
        
        const text = textarea.value || textarea.innerText;
        if (!text || text.length < 50) return;
        
        e.preventDefault();
        
        // Show compressing state
        indicator.querySelector('.pmi-text').textContent = 'Compressing...';
        
        try {
          const compressed = await compressPrompt(text);
          
          // Update textarea with compressed text
          if (platform === 'claude') {
            textarea.innerText = compressed.compressed.text;
          } else {
            textarea.value = compressed.compressed.text;
          }
          
          // Update indicator
          const savings = compressed.metrics.compressionRatio;
          indicator.querySelector('.pmi-text').textContent = 'Compressed';
          indicator.querySelector('.pmi-savings').textContent = `-${savings}%`;
          
          // Update stats
          stats.totalTokensSaved += compressed.metrics.tokensSaved;
          stats.totalCostSaved += (compressed.metrics.tokensSaved / 1000) * 0.01; // Approx $0.01 per 1K tokens
          stats.compressionsCount++;
          
          await chrome.storage.sync.set({ 'pmi-stats': stats });
          
          // Store last compression for popup
          await chrome.storage.local.set({ 'pmi-last-compression': compressed });
          
          // Submit form after brief delay
          setTimeout(() => {
            form.dispatchEvent(new Event('submit', { bubbles: true }));
          }, 100);
          
        } catch (error) {
          console.error('PMI compression failed:', error);
          indicator.querySelector('.pmi-text').textContent = 'PMI Error';
          // Continue with original submission
          form.dispatchEvent(new Event('submit', { bubbles: true }));
        }
      }, true);
    }
  }
  
  // Compress prompt via API
  async function compressPrompt(text) {
    const options = {
      targetRatio: 0.5,
      useObjectMemory,
      usePrefixCache
    };
    
    const headers = {
      'Content-Type': 'application/json'
    };
    
    if (apiKey) {
      headers['Authorization'] = `Bearer ${apiKey}`;
    }
    
    // Try authenticated endpoint first, fall back to demo
    const endpoint = apiKey ? '/api/compress' : '/api/compress/demo';
    
    const response = await fetch(`${PMI_API_URL}${endpoint}`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ text, options })
    });
    
    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }
    
    const result = await response.json();
    return result.data;
  }
  
  // Listen for messages from popup
  chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'getStats') {
      sendResponse(stats);
    } else if (request.action === 'getLastCompression') {
      chrome.storage.local.get('pmi-last-compression').then(result => {
        sendResponse(result['pmi-last-compression']);
      });
      return true; // Async response
    } else if (request.action === 'refresh') {
      init();
      sendResponse({ success: true });
    }
  });
  
})();
