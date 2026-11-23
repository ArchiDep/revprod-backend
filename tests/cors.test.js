import assert from 'node:assert/strict';
import { test } from 'node:test';

import { setUpDatabase, startApplication } from './helpers.js';

const landingPageOrigin = 'http://revprod-landing.example.com';

async function getAllowedOrigin(testContext, variables, origin) {
  await setUpDatabase(testContext);
  const baseUrl = await startApplication(testContext, variables);
  const res = await fetch(`${baseUrl}/comments`, { headers: { origin } });
  assert.equal(res.status, 200);
  return res.headers.get('access-control-allow-origin');
}

test('cross-origin requests are not allowed by default', async testContext => {
  assert.equal(
    await getAllowedOrigin(testContext, {}, landingPageOrigin),
    null
  );
});

test('CORS allows all origins without a list of origins', async testContext => {
  const variables = { REVPROD_CORS: 'true' };

  assert.equal(
    await getAllowedOrigin(testContext, variables, landingPageOrigin),
    '*'
  );
});

test('CORS allows the listed origins', async testContext => {
  const variables = {
    REVPROD_CORS: 'true',
    REVPROD_CORS_ORIGINS: `http://other.example.com,${landingPageOrigin}`
  };

  assert.equal(
    await getAllowedOrigin(testContext, variables, landingPageOrigin),
    landingPageOrigin
  );
});

test('CORS does not allow an origin that is not listed', async testContext => {
  const variables = {
    REVPROD_CORS: 'true',
    REVPROD_CORS_ORIGINS: landingPageOrigin
  };

  assert.equal(
    await getAllowedOrigin(testContext, variables, 'http://evil.example.com'),
    null
  );
});
