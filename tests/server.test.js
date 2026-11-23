import express from 'express';
import assert from 'node:assert/strict';
import { once } from 'node:events';
import { createServer } from 'node:net';
import { test } from 'node:test';

import { startServer } from '../server.js';
import { loadTestConfig } from './helpers.js';

test('starting on a port that is already in use fails', async testContext => {
  const otherServer = createServer().listen(0, '127.0.0.1');
  await once(otherServer, 'listening');
  testContext.after(() => otherServer.close());

  const { port } = otherServer.address();
  const config = loadTestConfig({
    REVPROD_LISTEN_HOST: '127.0.0.1',
    REVPROD_LISTEN_PORT: String(port)
  });

  await assert.rejects(
    startServer(config, express()),
    new Error(`Port ${port} is already in use`)
  );
});
