/**
 * AI Settings Modal
 * 
 * Shows owner-managed AI status.
 * Optional BYOK fields remain for local fallback/testing only.
 */

const AISettings = (function () {
  const el = id => document.getElementById(id);
  const t = (key, fb) => (typeof I18n !== 'undefined' ? I18n.t(key, fb) : fb || key);
  
  function openModal() {
    const existing = el('ai-settings-modal');
    if (existing) {
      existing.style.display = 'flex';
      return;
    }
    
    const modal = document.createElement('div');
    modal.id = 'ai-settings-modal';
    modal.className = 'modal-overlay';
    modal.style.display = 'flex';
    modal.innerHTML = `
      <div class="modal-box" style="max-width: 520px; padding: 24px">
        <h2 style="margin:0 0 18px">🤖 ${t('editor.aiSettings', 'AI Settings')}</h2>
        
        <div style="margin-bottom: 20px; padding: 14px; background: #ecfdf5; border: 1px solid #bbf7d0; border-radius: 10px">
          <div style="font-weight: 700; margin-bottom: 4px">${t('ai.managedTitle', 'Managed AI is enabled')}</div>
          <p style="font-size: 13px; color: #166534; margin: 0">${t('ai.managedCopy', 'Users do not need API keys. CV Studio sends AI requests to the server, and the server uses the owner API key.')}</p>
        </div>

        <details style="margin-bottom: 20px">
          <summary style="cursor:pointer; font-weight:700">${t('ai.advanced', 'Advanced local fallback')}</summary>
          <div style="margin-top: 14px">
          <label style="display: block; margin-bottom: 8px; font-weight: 600">${t('ai.provider', 'AI Provider')}</label>
          <select id="ai-provider-select" class="wizard-input" style="width: 100%">
            <option value="">None (Offline Only)</option>
            <option value="gemini">Google Gemini (Free Tier)</option>
            <option value="openrouter">OpenRouter (Multi-Model)</option>
            <option value="openai">OpenAI (GPT)</option>
            <option value="anthropic">Anthropic (Claude)</option>
          </select>
          </div>
        
          <div style="margin-bottom: 20px">
          <label style="display: block; margin-bottom: 8px; font-weight: 600">${t('ai.apiKey', 'API Key')}</label>
          <input id="ai-api-key" type="password" class="wizard-input" placeholder="${t('ai.apiKeyPh', 'Enter your API key')}" style="width: 100%">
          <p style="font-size: 12px; color: #666; margin-top: 4px">${t('ai.localKey', 'Optional fallback for local testing only. Production uses the server key.')}</p>
          </div>
        </details>
        
        <div style="margin-bottom: 20px; padding: 12px; background: #f5f5f7; border-radius: 8px">
          <div style="font-size: 14px; font-weight: 600; margin-bottom: 4px">${t('ai.usageCost', 'Usage Cost')}</div>
          <div id="ai-usage-cost" style="font-size: 24px; font-weight: 700; color: #111">$0.00</div>
          <button id="ai-reset-cost" style="font-size: 12px; color: #666; background: none; border: none; cursor: pointer; text-decoration: underline">${t('ai.reset', 'Reset')}</button>
        </div>
        
        <div style="margin-bottom: 20px">
          <label style="display: flex; align-items: center; gap: 8px; cursor: pointer">
            <input type="checkbox" id="ai-prompt-preview">
            <span>${t('ai.promptPreview', 'Show prompt preview before sending to AI')}</span>
          </label>
        </div>
        
        <div class="wizard-actions" style="justify-content: flex-end; gap: 8px">
          <button class="btn btn-ghost" onclick="AISettings.closeModal()">${t('cancel', 'Cancel')}</button>
          <button class="btn btn-primary" onclick="AISettings.saveSettings()">${t('ed.modal.save_changes', 'Save')}</button>
        </div>
      </div>
    `;
    
    document.body.appendChild(modal);
    
    // Load saved settings
    const savedProvider = localStorage.getItem('cv_studio_ai_provider') || '';
    const savedKey = localStorage.getItem('cv_studio_ai_key') || '';
    const savedPreview = localStorage.getItem('cv_studio_ai_preview') === 'true';
    
    el('ai-provider-select').value = savedProvider;
    el('ai-api-key').value = savedKey;
    el('ai-prompt-preview').checked = savedPreview;
    
    // Load usage cost
    const savedCost = parseFloat(localStorage.getItem('cv_studio_ai_cost') || '0');
    el('ai-usage-cost').textContent = `$${savedCost.toFixed(2)}`;
    
    // Event listeners
    el('ai-reset-cost').addEventListener('click', () => {
      localStorage.setItem('cv_studio_ai_cost', '0');
      el('ai-usage-cost').textContent = '$0.00';
    });
    
    // Close on outside click
    modal.addEventListener('click', (e) => {
      if (e.target === modal) closeModal();
    });
  }
  
  function closeModal() {
    const modal = el('ai-settings-modal');
    if (modal) modal.style.display = 'none';
  }
  
  function saveSettings() {
    const provider = el('ai-provider-select').value;
    const key = el('ai-api-key').value;
    const preview = el('ai-prompt-preview').checked;
    
    localStorage.setItem('cv_studio_ai_provider', provider);
    localStorage.setItem('cv_studio_ai_key', key);
    localStorage.setItem('cv_studio_ai_preview', preview.toString());
    
    closeModal();
    alert(t('ai.saved', 'AI settings saved!'));
  }
  
  function getProvider() {
    return localStorage.getItem('cv_studio_ai_provider') || '';
  }
  
  function getApiKey() {
    return localStorage.getItem('cv_studio_ai_key') || '';
  }
  
  function shouldShowPreview() {
    return localStorage.getItem('cv_studio_ai_preview') === 'true';
  }
  
  function addCost(amount) {
    const current = parseFloat(localStorage.getItem('cv_studio_ai_cost') || '0');
    const newCost = current + amount;
    localStorage.setItem('cv_studio_ai_cost', newCost.toString());
    return newCost;
  }
  
  return {
    openModal,
    closeModal,
    saveSettings,
    getProvider,
    getApiKey,
    shouldShowPreview,
    addCost
  };
})();
