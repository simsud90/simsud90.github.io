const { spawn } = require('node:child_process');
const path = require('node:path');
const assert = require('node:assert/strict');
const server = spawn(process.execPath, [path.join(__dirname, '../server.cjs')], { stdio: ['ignore', 'pipe', 'pipe'] });
const timeout = setTimeout(() => { server.kill(); process.exitCode = 1; console.error('Server startup timed out'); }, 10000);
server.stderr.on('data', chunk => process.stderr.write(chunk));
server.once('error', error => { clearTimeout(timeout); console.error(error); process.exitCode = 1; });
server.stdout.once('data', async () => {
  clearTimeout(timeout);
  try {
    for (const [resource, mime] of [['/', 'text/html'], ['/app.js', 'text/javascript'], ['/videos.js', 'text/javascript'], ['/styles.css', 'text/css'], ['/sw.js', 'text/javascript'], ['/manifest.webmanifest', 'application/manifest+json'], ['/icons/icon-192.png', 'image/png'], ['/icons/icon-512.png', 'image/png']]) {
      const response = await fetch('http://127.0.0.1:8080' + resource);
      assert.equal(response.status, 200, resource);
      assert.equal(response.headers.get('content-type'), mime);
      assert.ok((await response.arrayBuffer()).byteLength > 0);
    }
    assert.equal((await fetch('http://127.0.0.1:8080/missing')).status, 404);
    assert.equal((await fetch('http://127.0.0.1:8080/.git/config')).status, 403);
    console.log('Passed: HTTP app delivery, asset MIME types, installation icon delivery, missing-file response, and hidden-file protection.');
  } catch (error) { console.error(error); process.exitCode = 1; }
  finally { server.kill(); }
});
