import assert from 'node:assert/strict';
import { join as joinPath } from 'node:path';
import { test } from 'node:test';

import { root } from '../config.js';
import { loadTestConfig } from './helpers.js';

function withoutFunctions(config) {
  const { createLogger, ...values } = config;
  assert.equal(typeof createLogger, 'function');
  return values;
}

test('default configuration', () => {
  assert.deepEqual(withoutFunctions(loadTestConfig()), {
    dbFile: joinPath(root, 'db.json'),
    env: 'development',
    host: '0.0.0.0',
    port: 3000,
    cors: false,
    corsOrigins: [],
    title: 'The Revolutionary Product',
    landingPageBaseUrl: ''
  });
});

test('configuration with every variable set', () => {
  const config = loadTestConfig({
    NODE_ENV: 'production',
    REVPROD_CORS: 'true',
    REVPROD_CORS_ORIGINS: 'http://a.example.com,http://b.example.com',
    REVPROD_DB_FILE: '/var/lib/revprod/comments.json',
    REVPROD_LANDING_PAGE_BASE_URL: 'http://revprod-landing.example.com',
    REVPROD_LISTEN_HOST: '127.0.0.1',
    REVPROD_LISTEN_PORT: '4200',
    REVPROD_LOG_LEVEL: 'warn',
    REVPROD_TITLE: 'The Evolutionary Product'
  });

  assert.deepEqual(withoutFunctions(config), {
    dbFile: '/var/lib/revprod/comments.json',
    env: 'production',
    host: '127.0.0.1',
    port: 4200,
    cors: true,
    corsOrigins: ['http://a.example.com', 'http://b.example.com'],
    title: 'The Evolutionary Product',
    landingPageBaseUrl: 'http://revprod-landing.example.com'
  });
  assert.equal(config.createLogger('test').level.levelStr, 'WARN');
});

test('a relative database file is relative to the application', () => {
  const config = loadTestConfig({ REVPROD_DB_FILE: 'data/comments.json' });

  assert.equal(config.dbFile, joinPath(root, 'data', 'comments.json'));
});

test('the default log level is TRACE in development', () => {
  const config = loadTestConfig();

  assert.equal(config.createLogger('test').level.levelStr, 'TRACE');
});

test('the default log level is DEBUG in production', () => {
  const config = loadTestConfig({ NODE_ENV: 'production' });

  assert.equal(config.createLogger('test').level.levelStr, 'DEBUG');
});

for (const [value, expected] of [
  ['1', true],
  ['yes', true],
  ['t', true],
  ['0', false],
  ['no', false],
  ['f', false]
]) {
  test(`REVPROD_CORS=${value} is ${expected}`, () => {
    assert.equal(loadTestConfig({ REVPROD_CORS: value }).cors, expected);
  });
}

for (const [variables, message] of [
  [
    { REVPROD_CORS: 'maybe' },
    '$REVPROD_CORS must be a boolean, but its value is "maybe"'
  ],
  [
    { REVPROD_LISTEN_PORT: 'abc' },
    '$REVPROD_LISTEN_PORT must be an integer between 1 and 65535, but its value is "abc"'
  ],
  [
    { REVPROD_LISTEN_PORT: '0' },
    '$REVPROD_LISTEN_PORT must be an integer between 1 and 65535, but its value is "0"'
  ],
  [
    { REVPROD_LISTEN_PORT: '65536' },
    '$REVPROD_LISTEN_PORT must be an integer between 1 and 65535, but its value is "65536"'
  ],
  [
    { REVPROD_LOG_LEVEL: 'verbose' },
    '$REVPROD_LOG_LEVEL must be one of "FATAL", "ERROR", "WARN", "INFO", "DEBUG", "TRACE", but its value is "VERBOSE"'
  ]
]) {
  test(`invalid configuration ${JSON.stringify(variables)}`, () => {
    assert.throws(() => loadTestConfig(variables), new Error(message));
  });
}
