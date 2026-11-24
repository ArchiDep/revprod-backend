/**
 * Tell whoever checks the application's health, such as Docker, that it is up
 * and answering requests.
 */
export function healthCheck(req, res) {
  res.type('text').send('OK');
}
