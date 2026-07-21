const assert = require('assert');
const fs = require('fs');
const path = require('path');
const { sanitizePayload, buildPrompt } = require('../api/ai/task-prompts');
const { checkRequest } = require('../api/ai/request-guard');

assert.throws(() => sanitizePayload({ prompt: 'free prompt' }), /Unsupported AI task/);

const sanitized = sanitizePayload({
  task: 'improve_text',
  locale: 'ar',
  profile: { field: 'accountant', level: 'senior', targetTitle: 'مدير حسابات' },
  currentText: 'أدرت عملية الإغلاق الشهري.',
  name: 'Secret Name',
  email: 'secret@example.com',
  phone: '+20123456789',
  career: { personalInfo: { name: 'Secret' } }
});
assert.equal(sanitized.name, undefined);
assert.equal(sanitized.email, undefined);
assert.equal(sanitized.phone, undefined);
assert.equal(sanitized.career, undefined);

const built = buildPrompt(sanitized);
assert(!built.prompt.includes('Secret Name'));
assert(!built.prompt.includes('secret@example.com'));
assert(built.prompt.includes('Never invent'));
assert(built.maxOutputTokens <= 1000);

function req(headers = {}) {
  return { headers: { host: 'localhost:5500', origin: 'http://localhost:5500', ...headers }, socket: { remoteAddress: '127.0.0.1' } };
}
const badClient = checkRequest(req({ 'x-cv-session': 'abcdefghijklmnop' }), { task: 'summary' });
assert.equal(badClient.status, 403);
const badSession = checkRequest(req({ 'x-cv-client': 'web-v1', 'x-cv-session': 'bad' }), { task: 'summary' });
assert.equal(badSession.status, 400);
const valid = checkRequest(req({ 'x-cv-client': 'web-v1', 'x-cv-session': 'abcdefghijklmnop' }), { task: 'summary' });
assert.equal(valid.ok, true);

const client = fs.readFileSync(path.join(__dirname, '../app/assets/ai-client.js'), 'utf8');
assert(!/api\.openai\.com|api\.anthropic\.com|openrouter\.ai|generativelanguage\.googleapis\.com/.test(client));
assert(!/cv_studio_ai_key/.test(client));
const settings = fs.readFileSync(path.join(__dirname, '../app/assets/ai-settings.js'), 'utf8');
assert(!/type="password"|API Key|cv_studio_ai_key/.test(settings));
const editor = fs.readFileSync(path.join(__dirname, '../app/assets/editor.js'), 'utf8');
assert(!/application\/msword/.test(editor));

console.log('Production security checks passed.');
