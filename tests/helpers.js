import log4js from 'log4js';
import { once } from 'node:events';
import { mkdtemp, rm } from 'node:fs/promises';
import { createServer } from 'node:http';
import { tmpdir } from 'node:os';
import { join as joinPath } from 'node:path';

import { loadSchemas } from '../app/validation.js';
import { createApplication } from '../app.js';
import { loadConfig } from '../config.js';
import { closeDatabase, openDatabase } from '../db.js';

// Keep log messages in memory instead of printing them among the test results.
log4js.configure({
  appenders: { recording: { type: 'recording' } },
  categories: { default: { appenders: ['recording'], level: 'all' } }
});

/**
 * Load the configuration from the given environment variables, which replace
 * any REVPROD_* variable set in the environment of the tests.
 */
export function loadTestConfig(variables = {}) {
  const original = { ...process.env };

  for (const name of Object.keys(process.env)) {
    if (name === 'NODE_ENV' || name.startsWith('REVPROD_')) {
      delete process.env[name];
    }
  }

  Object.assign(process.env, variables);

  try {
    return loadConfig();
  } finally {
    for (const name of Object.keys(process.env)) {
      delete process.env[name];
    }

    Object.assign(process.env, original);
  }
}

let schemasLoaded;

/**
 * Open an empty database in a new temporary directory, until the end of the
 * test, and load the JSON schemas if they are not loaded yet. Returns the path
 * of the database file.
 */
export async function setUpDatabase(testContext) {
  const directory = await mkdtemp(joinPath(tmpdir(), 'revprod-backend-'));
  const dbFile = joinPath(directory, 'db.json');
  const config = loadTestConfig({ REVPROD_DB_FILE: dbFile });

  // The schemas never change, and can only be loaded once per process.
  schemasLoaded ??= loadSchemas(config);
  await schemasLoaded;

  await openDatabase(config);
  testContext.after(async () => {
    closeDatabase();
    await rm(directory, { recursive: true });
  });

  return dbFile;
}

/**
 * Start the application on a random port, until the end of the test or suite.
 * Returns its base URL.
 */
export async function startApplication(testContext, variables = {}) {
  const config = loadTestConfig(variables);
  const server = createServer(createApplication(config));

  server.listen(0, '127.0.0.1');
  await once(server, 'listening');
  testContext.after(() => {
    server.closeAllConnections();
    server.close();
  });

  return `http://127.0.0.1:${server.address().port}`;
}
