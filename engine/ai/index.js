/**
 * AI Layer — Extensible architecture for AI providers and services
 * 
 * This layer provides:
 * - Provider abstraction (Gemini, OpenRouter, OpenAI, Anthropic, etc.)
 * - Prompt system (profession + language + experience based)
 * - Service layer (improve-summary, rewrite-experience, etc.)
 * - Offline helpers (Knowledge-based suggestions)
 * - Cost tracking
 * 
 * Design principles:
 * - AI is optional — product works fully without it
 * - Providers are pluggable — add new ones without changing code
 * - Prompts are contextual — based on profession, language, experience
 * - Offline first — use Knowledge Base before API calls
 */

const AILayer = (function () {
  let currentProvider = null;
  let apiKey = null;
  let usageCost = 0;

  function setProvider(providerName, key) {
    apiKey = key;
    // Load provider dynamically
    if (providerName === 'gemini') {
      currentProvider = require('./providers/gemini');
    } else if (providerName === 'openrouter') {
      currentProvider = require('./providers/openrouter');
    } else if (providerName === 'openai') {
      currentProvider = require('./providers/openai');
    } else if (providerName === 'anthropic') {
      currentProvider = require('./providers/anthropic');
    }
  }

  function getProvider() {
    return currentProvider;
  }

  function getUsageCost() {
    return usageCost;
  }

  function resetUsageCost() {
    usageCost = 0;
  }

  return {
    setProvider,
    getProvider,
    getUsageCost,
    resetUsageCost
  };
})();

if (typeof module !== 'undefined') module.exports = AILayer;
