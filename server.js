import { createServer as createHttpServer } from 'node:http';

export function startServer(config, app) {
  const logger = config.createLogger('www');

  const server = createHttpServer(app);

  return new Promise((resolve, reject) => {
    server.listen(config.port, config.host);
    server.on('error', onServerError);
    server.on('listening', onServerListening);

    function onServerError(err) {
      if (err.syscall !== 'listen') {
        reject(err);
        return;
      }

      // Handle specific listen errors with friendly messages.
      switch (err.code) {
        case 'EACCES': {
          reject(new Error(`Port ${config.port} requires elevated privileges`));
          break;
        }
        case 'EADDRINUSE': {
          reject(new Error(`Port ${config.port} is already in use`));
          break;
        }
        default: {
          reject(err);
        }
      }
    }

    function onServerListening() {
      // A signal sent once the message below is seen must find the handlers.
      stopOnSignal(server, logger);
      logger.info(`Listening on ${config.host}:${config.port}`);
      resolve();
    }
  });
}

/**
 * Stop the server when the process is asked to stop: SIGTERM from a process
 * manager such as systemd or Docker, or SIGINT from Ctrl-C. Idle connections
 * are closed at once, the others once their request has been answered.
 *
 * This is also what makes the application stop in a container, where it is the
 * first process: the kernel gives that process no default action for these
 * signals, so without a handler it would ignore them until it is killed.
 *
 * A second signal has its default action again, which ends the process at once
 * without waiting for the requests in progress: an impatient Ctrl-C.
 */
function stopOnSignal(server, logger) {
  for (const signal of ['SIGINT', 'SIGTERM']) {
    process.once(signal, onSignal);
  }

  function onSignal(signal) {
    logger.info(`Received ${signal}, stopping`);
    process.removeListener('SIGINT', onSignal);
    process.removeListener('SIGTERM', onSignal);

    // Once closed, the process exits, having nothing left to do.
    server.close(() => {
      logger.info('Stopped');
    });
  }
}
