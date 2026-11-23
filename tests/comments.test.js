import { DateTime } from 'luxon';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { test } from 'node:test';

import { setUpDatabase, startApplication } from './helpers.js';

const start = DateTime.fromISO('2026-11-23T10:00:00Z');

/**
 * Start the application with an empty database and the clock stopped at the
 * start time, until the end of the test.
 */
async function setUp(testContext) {
  testContext.mock.timers.enable({ apis: ['Date'], now: start.toMillis() });
  const dbFile = await setUpDatabase(testContext);
  const baseUrl = await startApplication(testContext);
  return { baseUrl, dbFile };
}

function share(baseUrl, comment) {
  return fetch(`${baseUrl}/share`, {
    method: 'POST',
    body: new URLSearchParams(comment),
    redirect: 'manual'
  });
}

async function getComments(baseUrl) {
  const res = await fetch(`${baseUrl}/comments`);
  assert.equal(res.status, 200);
  assert.equal(
    res.headers.get('content-type'),
    'application/json; charset=utf-8'
  );
  return res.json();
}

function minutesAfterStart(minutes) {
  return start.plus({ minutes }).toISO();
}

test('there are no comments initially', async testContext => {
  const { baseUrl } = await setUp(testContext);

  assert.deepEqual(await getComments(baseUrl), []);
});

test('share a comment', async testContext => {
  const { baseUrl } = await setUp(testContext);

  const res = await share(baseUrl, {
    name: 'Alice',
    text: 'It changed my life.'
  });

  assert.equal(res.status, 200);
  assert.match(await res.text(), /We appreciate your feedback\./u);
  assert.deepEqual(await getComments(baseUrl), [
    { name: 'Alice', text: 'It changed my life.', date: minutesAfterStart(0) }
  ]);
});

test('comments are saved to the database file', async testContext => {
  const { baseUrl, dbFile } = await setUp(testContext);

  await share(baseUrl, { name: 'Alice', text: 'It changed my life.' });

  assert.deepEqual(JSON.parse(await readFile(dbFile, 'utf8')), {
    comments: [
      { name: 'Alice', text: 'It changed my life.', date: minutesAfterStart(0) }
    ]
  });
});

for (const [description, comment] of [
  ['without a name', { name: '', text: 'Anonymous.' }],
  ['with a name that is too long', { name: 'A'.repeat(51), text: 'Long.' }],
  ['without a text', { name: 'Bob' }],
  ['with an unknown field', { name: 'Bob', text: 'Hi.', admin: 'true' }]
]) {
  test(`a comment ${description} is rejected`, async testContext => {
    const { baseUrl } = await setUp(testContext);
    await share(baseUrl, { name: 'Alice', text: 'It changed my life.' });

    const res = await share(baseUrl, comment);

    assert.equal(res.status, 302);
    assert.equal(res.headers.get('location'), '/');
    assert.deepEqual(await getComments(baseUrl), [
      { name: 'Alice', text: 'It changed my life.', date: minutesAfterStart(0) }
    ]);
  });
}

test('only the 5 most recent comments are kept, the most recent first', async testContext => {
  const { baseUrl } = await setUp(testContext);

  for (let index = 0; index <= 5; index++) {
    // Each comment must be saved before the next one is shared.
    // eslint-disable-next-line no-await-in-loop
    await share(baseUrl, {
      name: `Customer ${index}`,
      text: `Testimonial ${index}`
    });
    testContext.mock.timers.tick(60_000);
  }

  assert.deepEqual(
    await getComments(baseUrl),
    [5, 4, 3, 2, 1].map(index => ({
      name: `Customer ${index}`,
      text: `Testimonial ${index}`,
      date: minutesAfterStart(index)
    }))
  );
});
