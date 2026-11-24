import log4js from 'log4js';
import assert from 'node:assert/strict';
import { before, beforeEach, test } from 'node:test';

import { startApplication } from './helpers.js';

const recording = log4js.recording();

let baseUrl;

before(async testContext => {
  baseUrl = await startApplication(testContext);
});

beforeEach(() => {
  recording.erase();
});

test('the health check answers OK', async () => {
  const res = await fetch(`${baseUrl}/health`);

  assert.equal(res.status, 200);
  assert.equal(res.headers.get('content-type'), 'text/plain; charset=utf-8');
  assert.equal(await res.text(), 'OK');
});

test('the health check is not logged', async () => {
  const res = await fetch(`${baseUrl}/health`);
  await res.text();

  assert.deepEqual(recording.replay(), []);
});

test('other requests are logged', async () => {
  const res = await fetch(`${baseUrl}/share`);
  await res.text();

  const messages = recording.replay().map(event => event.data.join(' '));
  assert.equal(messages.length, 1);
  assert.match(messages[0], /"GET \/share HTTP\/1\.1" 200/u);
});
