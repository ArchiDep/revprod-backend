import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { once } from 'node:events';
import { mkdtemp, rm } from 'node:fs/promises';
import { createServer } from 'node:net';
import { tmpdir } from 'node:os';
import { join as joinPath } from 'node:path';
import { test } from 'node:test';

import { root } from '../config.js';

/**
 * Find a port that is free now. The application refuses port 0, which would let
 * the operating system pick one.
 */
async function findFreePort() {
  const server = createServer().listen(0, '127.0.0.1');
  await once(server, 'listening');
  const { port } = server.address();
  server.close();
  await once(server, 'close');
  return port;
}

/**
 * Start the application in its own process, as it is run in production, and
 * resolve once it is listening. Returns the process and its base URL.
 */
async function startProcess(testContext) {
  const directory = await mkdtemp(joinPath(tmpdir(), 'revprod-backend-'));
  testContext.after(() => rm(directory, { recursive: true }));

  const port = await findFreePort();
  const child = spawn(process.execPath, [joinPath(root, 'bin.js')], {
    env: {
      PATH: process.env.PATH,
      REVPROD_DB_FILE: joinPath(directory, 'db.json'),
      REVPROD_LISTEN_HOST: '127.0.0.1',
      REVPROD_LISTEN_PORT: String(port)
    },
    stdio: ['ignore', 'pipe', 'inherit']
  });
  testContext.after(() => child.kill('SIGKILL'));

  let output = '';
  child.stdout.setEncoding('utf8');
  child.stdout.on('data', data => {
    output += data;
  });

  while (!output.includes('Listening on')) {
    // eslint-disable-next-line no-await-in-loop
    await once(child.stdout, 'data');
  }

  return {
    child,
    baseUrl: `http://127.0.0.1:${port}`,
    getOutput: () => output
  };
}

for (const signal of ['SIGINT', 'SIGTERM']) {
  test(`the application stops on ${signal}`, async testContext => {
    const { child, getOutput } = await startProcess(testContext);

    child.kill(signal);
    const [code] = await once(child, 'exit');

    assert.equal(code, 0);
    assert.match(getOutput(), new RegExp(`Received ${signal}, stopping`, 'u'));
    assert.match(getOutput(), /Stopped/u);
  });
}

test('a connection kept open does not delay stopping', async testContext => {
  const { child, baseUrl } = await startProcess(testContext);

  // Fetch keeps the connection open for the next request.
  const res = await fetch(`${baseUrl}/share`);
  await res.text();

  const start = Date.now();
  child.kill('SIGTERM');
  const [code] = await once(child, 'exit');

  assert.equal(code, 0);
  // The connection would otherwise only time out after five seconds.
  assert.ok(Date.now() - start < 2000);
});
