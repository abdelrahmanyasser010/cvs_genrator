/** Production safety stub: direct browser/provider API access is disabled. */
module.exports = Object.freeze({
  setKey() { throw new Error('API keys must be configured on the server, never in the browser.'); },
  async generate() { throw new Error('Use the same-origin /api/ai/generate task endpoint.'); }
});
