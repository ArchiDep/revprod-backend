#!/usr/bin/env node
import { styleText } from 'node:util';

import start from './start.js';

try {
  await start();
} catch (err) {
  // eslint-disable-next-line no-console
  console.error(styleText('red', err.stack, { stream: process.stderr }));
  process.exit(1);
}
