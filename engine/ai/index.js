/**
 * AI Layer compatibility facade.
 * Production AI is server-managed through /api/ai/generate.
 * Browser API keys and direct provider calls are intentionally disabled.
 */
const AILayer = (function () {
  function setProvider() {
    throw new Error('Direct AI providers are disabled in production. Use the server-managed AI route.');
  }
  function getProvider() { return null; }
  function getUsageCost() { return 0; }
  function resetUsageCost() { return 0; }
  return { setProvider, getProvider, getUsageCost, resetUsageCost };
})();
if (typeof module !== 'undefined') module.exports = AILayer;
