const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { spawnSync } = require('node:child_process');
const root = path.resolve(__dirname, '..');
for (const filename of ['app.js', 'videos.js', 'sw.js', 'server.cjs']) {
  const result = spawnSync(process.execPath, ['--check', path.join(root, filename)], { encoding: 'utf8' });
  assert.equal(result.status, 0, result.stderr);
}
const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const elements = new Map();
const drawingCalls = [];
const context2d = {
  save() {}, restore() {}, scale() {}, beginPath() {},
  arc(...args) { drawingCalls.push(['dot', ...args]); }, fill() {},
  moveTo(...args) { drawingCalls.push(['move', ...args]); },
  lineTo(...args) { drawingCalls.push(['line', ...args]); }, stroke() {},
  getImageData() { return { snapshot: true }; },
  putImageData() { drawingCalls.push(['undo']); },
  clearRect() { drawingCalls.push(['clear']); },
  drawImage() {}, fillRect() {},
};
function element() {
  const listeners = new Map(), captured = new Set();
  return {
    listeners, children: [], style: { setProperty() {} },
    classList: { toggle() {} },
    attributes: {}, setAttribute(name, value) { this.attributes[name] = value; },
    addEventListener(name, listener) { listeners.set(name, listener); },
    append(...children) { this.children.push(...children); },
    replaceChildren(...children) { this.children = children; },
    getContext() { return context2d; },
    getBoundingClientRect() { return { left: 0, top: 0, width: 1024, height: 768 }; },
    setPointerCapture(id) { captured.add(id); },
    hasPointerCapture(id) { return captured.has(id); },
    releasePointerCapture(id) { captured.delete(id); },
    toDataURL() { return 'data:image/png;base64,test'; },
    requestFullscreen() { sandbox.document.fullscreenElement = this; return Promise.resolve(); },
    showModal() { this.open = true; }, close() { this.open = false; },
  };
}
for (const match of html.matchAll(/id="([^"]+)"/g)) elements.set(match[1], element());
let fullscreenExits = 0;
const sandbox = {
  document: {
    getElementById: id => { assert.ok(elements.has(id), 'Missing HTML id ' + id); return elements.get(id); },
    createElement: element, addEventListener() {}, documentElement: element(),
    exitFullscreen() { fullscreenExits++; this.fullscreenElement = null; return Promise.resolve(); },
  },
  window: { addEventListener() {}, scrollTo() {} },
  location: { hash: '#home', protocol: 'http:', hostname: 'localhost' },
  navigator: { onLine: true },
  localStorage: { getItem() { return null; }, setItem() {} },
  URL, setTimeout() { return 1; }, clearTimeout() {}, console,
};
vm.createContext(sandbox);
const videoSource = fs.readFileSync(path.join(root, 'videos.js'), 'utf8').replace('export const', 'const');
const appSource = fs.readFileSync(path.join(root, 'app.js'), 'utf8').replace("import { videos } from './videos.js';", '').replace('export function', 'function');
vm.runInContext(videoSource + '\n' + appSource, sandbox);
const evaluate = expression => vm.runInContext(expression, sandbox);
for (const url of ['XqZsoesa55w', 'https://youtu.be/XqZsoesa55w?t=4', 'https://www.youtube.com/watch?v=XqZsoesa55w', 'https://m.youtube.com/shorts/XqZsoesa55w', 'https://www.youtube-nocookie.com/embed/XqZsoesa55w', 'https://youtube.com/live/XqZsoesa55w']) {
  assert.equal(evaluate('youtubeId(' + JSON.stringify(url) + ')'), 'XqZsoesa55w');
}
for (const url of ['https://youtube.com.evil.test/watch?v=XqZsoesa55w', 'javascript:alert(1)', 'https://example.com/XqZsoesa55w', 'https://youtu.be/short', '', null]) {
  assert.equal(evaluate('youtubeId(' + JSON.stringify(url) + ')'), null);
}
assert.equal(elements.get('video-grid').children.length, 8);
for (const card of elements.get('video-grid').children) {
  const thumbnail = card.children[0].children[1];
  assert.ok(thumbnail.src.startsWith('https://i.ytimg.com/vi/'));
  thumbnail.listeners.get('error')();
  assert.equal(thumbnail.hidden, true, 'Unavailable thumbnails must reveal the fallback');
}
const canvas = elements.get('canvas');
function pointer(type, id, x, y) {
  canvas.listeners.get(type)({ pointerId: id, pointerType: 'touch', clientX: x, clientY: y, preventDefault() {} });
}
pointer('pointerdown', 1, 10, 20);
pointer('pointerdown', 2, 100, 200);
assert.equal(evaluate('pointers.size'), 2);
assert.equal(evaluate('history.length'), 1, 'Simultaneous fingers must share an undo gesture');
pointer('pointermove', 1, 30, 40);
pointer('pointermove', 2, 120, 220);
assert.deepEqual(drawingCalls.filter(call => call[0] === 'move'), [['move', 10, 20], ['move', 100, 200]], 'Each finger must keep its own previous position');
pointer('pointercancel', 1, 30, 40);
assert.equal(evaluate('pointers.size'), 1);
pointer('lostpointercapture', 2, 120, 220);
assert.equal(evaluate('pointers.size'), 0);
elements.get('undo').listeners.get('click')();
assert.equal(evaluate('history.length'), 0);
assert.equal(elements.get('undo').disabled, true);
pointer('pointerdown', 3, 40, 50);
evaluate('endAllGestures()');
assert.equal(evaluate('pointers.size'), 0);
elements.get('confirm-clear').listeners.get('click')();
assert.ok(drawingCalls.some(call => call[0] === 'clear'));
const player = elements.get('player');
const frame = elements.get('player-frame');
const click = id => elements.get(id).listeners.get('click')();
for (const action of ['back', 'cancel']) {
  elements.get('video-grid').children[0].listeners.get('click')();
  assert.equal(player.open, true);
  assert.equal(sandbox.document.fullscreenElement, player);
  const iframe = frame.children[0];
  assert.ok(iframe.src.startsWith('https://www.youtube-nocookie.com/embed/'));
  assert.equal(new URL(iframe.src).searchParams.get('fs'), '1');
  assert.equal(iframe.allowFullscreen, true);
  const before = fullscreenExits;
  if (action === 'back') click('close-player');
  else player.listeners.get('cancel')({ preventDefault() {} });
  assert.equal(player.open, false, `${action} must close the player without confirmation`);
  assert.equal(frame.children.length, 0, 'Closing must remove the playing iframe');
  assert.equal(fullscreenExits, before + 1);
}
elements.get('video-grid').children[0].listeners.get('click')();
const playingFrame = frame.children[0];
click('player-fullscreen');
assert.equal(sandbox.document.fullscreenElement, null, 'Square must leave fullscreen immediately');
assert.equal(player.open, true, 'Fullscreen toggle must not close the video');
assert.equal(frame.children[0], playingFrame, 'Fullscreen toggle must preserve playback');
click('player-fullscreen');
assert.equal(sandbox.document.fullscreenElement, player, 'Square must reenter fullscreen');
assert.equal(frame.children[0], playingFrame);
click('close-player');
player.requestFullscreen = undefined;
elements.get('video-grid').children[0].listeners.get('click')();
click('player-fullscreen');
assert.equal(player.open, true);
click('close-player');
assert.equal(player.open, false, 'Back must work without browser fullscreen support');
const manifest = JSON.parse(fs.readFileSync(path.join(root, 'manifest.webmanifest'), 'utf8'));
for (const icon of manifest.icons) {
  const bytes = fs.readFileSync(path.join(root, icon.src));
  const size = Number(icon.sizes.split('x')[0]);
  assert.equal(bytes.readUInt32BE(16), size); assert.equal(bytes.readUInt32BE(20), size);
}
const serviceWorker = fs.readFileSync(path.join(root, 'sw.js'), 'utf8');
const assetList = vm.runInNewContext(serviceWorker.match(/const ASSETS = (\[[^;]+\]);/)[1]);
for (const asset of assetList) assert.ok(fs.existsSync(path.join(root, asset)), 'Missing offline asset ' + asset);
console.log('Passed: JavaScript syntax, video URL validation, independent multitouch strokes, grouped undo, pointer cancellation, clearing, single-button player exit, dialog cancellation, fullscreen toggling without interrupting playback, fullscreen fallback, player cleanup, manifest icon sizes, and offline asset completeness.');
