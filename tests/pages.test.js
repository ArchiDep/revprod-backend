import assert from 'node:assert/strict';
import { before, test } from 'node:test';

import { startApplication } from './helpers.js';

let baseUrl;

before(async testContext => {
  baseUrl = await startApplication(testContext, {
    REVPROD_LANDING_PAGE_BASE_URL: 'http://revprod-landing.example.com',
    REVPROD_TITLE: 'The Evolutionary Product'
  });
});

test('the home page redirects to the share page', async () => {
  const res = await fetch(`${baseUrl}/`, { redirect: 'manual' });

  assert.equal(res.status, 302);
  assert.equal(res.headers.get('location'), '/share');
});

test('the share page has a form to share a testimonial', async () => {
  const res = await fetch(`${baseUrl}/share`);
  const body = await res.text();

  assert.equal(res.status, 200);
  assert.equal(res.headers.get('content-type'), 'text/html; charset=utf-8');
  assert.match(body, /<form action="\/share" method="POST">/u);
  assert.match(body, /<title>The Evolutionary Product<\/title>/u);
});

test('the share page links to the landing page', async () => {
  const res = await fetch(`${baseUrl}/share`);
  const body = await res.text();

  const links = body.match(/href="http:\/\/revprod-landing\.example\.com\/"/gu);
  assert.equal(links?.length, 2);
});

test('the stylesheet is served', async () => {
  const res = await fetch(`${baseUrl}/css/app.css`);

  assert.equal(res.status, 200);
  assert.equal(res.headers.get('content-type'), 'text/css; charset=utf-8');
});

test('an unknown page is not found', async () => {
  const res = await fetch(`${baseUrl}/unknown`);
  const body = await res.text();

  assert.equal(res.status, 404);
  assert.match(body, /<h1 class="mt-5 text-danger">Not Found<\/h1>/u);
});
