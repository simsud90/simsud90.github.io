import { videos } from './videos.js';

const $ = (id) => document.getElementById(id);
const pages = ['home', 'videos', 'draw'];
const canvas = $('canvas');
const ctx = canvas.getContext('2d');
// A fixed backing canvas keeps pictures intact across rotation and resizing.
canvas.width = 2048;
canvas.height = 1536;
let color = '#e88779', brushSize = 16, erasing = false;
const pointers = new Map();
const history = [];
let dirty = false, saveTimer, restoring = true;
const storageKey = 'little-play-drawing-v1';
const palette = [
  ['Coral', '#e88779'], ['Yellow', '#e8b94b'], ['Green', '#79a782'],
  ['Blue', '#79aad0'], ['Purple', '#ac92be'], ['Charcoal', '#46514b'],
];

function announce(message) { $('drawing-status').textContent = message; }
function persistDrawing() {
  clearTimeout(saveTimer);
  if (!dirty || restoring || pointers.size) return;
  try { localStorage.setItem(storageKey, canvas.toDataURL('image/png')); dirty = false; }
  catch { announce('This device could not remember the picture. Use Save picture to keep it.'); }
}
function scheduleSave() { dirty = true; clearTimeout(saveTimer); saveTimer = setTimeout(persistDrawing, 600); }
function remember() {
  history.push(ctx.getImageData(0, 0, canvas.width, canvas.height));
  // Bound memory: one snapshot is about 12 MB.
  if (history.length > 8) history.shift();
  $('undo').disabled = false;
}
function endGesture(event) {
  if (!pointers.has(event.pointerId)) return;
  pointers.delete(event.pointerId);
  if (!pointers.size) scheduleSave();
}
function endAllGestures() {
  const hadPointers = pointers.size > 0;
  for (const id of pointers.keys()) { if (canvas.hasPointerCapture(id)) canvas.releasePointerCapture(id); }
  pointers.clear();
  if (hadPointers) scheduleSave();
}
function route() {
  endAllGestures();
  if ($('player').open) closePlayer();
  if ($('clear-dialog').open) $('clear-dialog').close();
  const requested = location.hash.slice(1);
  const active = pages.includes(requested) ? requested : 'home';
  for (const page of pages) $(page).hidden = page !== active;
  document.title = `${active === 'draw' ? 'Let’s draw' : active === 'videos' ? 'Let’s watch' : 'Little Play'} • Little Play`;
  window.scrollTo(0, 0);
}
window.addEventListener('hashchange', route);
route();

async function requestFullscreen(element) {
  try {
    if (element.requestFullscreen) await element.requestFullscreen();
    else if (element.webkitRequestFullscreen) element.webkitRequestFullscreen();
  } catch { /* The viewport-filling player remains available when fullscreen is denied. */ }
}
$('fullscreen').addEventListener('click', () => {
  if (document.fullscreenElement) document.exitFullscreen().catch(() => {});
  else requestFullscreen(document.documentElement);
});
document.addEventListener('fullscreenchange', () => {
  $('fullscreen').setAttribute('aria-label', document.fullscreenElement ? 'Exit full screen' : 'Enter full screen');
});

export function youtubeId(value) {
  if (typeof value !== 'string') return null;
  const input = value.trim();
  if (/^[A-Za-z0-9_-]{11}$/.test(input)) return input;
  try {
    const url = new URL(input);
    if (url.protocol !== 'https:' && url.protocol !== 'http:') return null;
    const host = url.hostname.toLowerCase();
    let id;
    if (host === 'youtu.be' || host === 'www.youtu.be') id = url.pathname.split('/')[1];
    else if (['youtube.com', 'www.youtube.com', 'm.youtube.com', 'youtube-nocookie.com', 'www.youtube-nocookie.com'].includes(host)) {
      id = url.pathname === '/watch' ? url.searchParams.get('v') : ['embed', 'shorts', 'live'].includes(url.pathname.split('/')[1]) ? url.pathname.split('/')[2] : null;
    }
    return /^[A-Za-z0-9_-]{11}$/.test(id || '') ? id : null;
  } catch { return null; }
}
let playerOwnsFullscreen = false;
function openPlayer(video, id) {
  const iframe = document.createElement('iframe');
  iframe.title = video.title;
  iframe.allow = 'autoplay; encrypted-media; picture-in-picture; fullscreen';
  iframe.allowFullscreen = true;
  iframe.referrerPolicy = 'strict-origin-when-cross-origin';
  iframe.src = `https://www.youtube-nocookie.com/embed/${id}?autoplay=1&playsinline=1&rel=0&fs=1`;
  $('player-title').textContent = video.title;
  $('player-frame').replaceChildren(iframe);
  $('player').showModal();
  playerOwnsFullscreen = !document.fullscreenElement;
  if (playerOwnsFullscreen) requestFullscreen($('player'));
}
function closePlayer() {
  $('player-frame').replaceChildren(); // Remove the iframe to stop sound immediately.
  if ($('player').open) $('player').close();
  if (playerOwnsFullscreen && document.fullscreenElement === $('player')) document.exitFullscreen().catch(() => {});
  playerOwnsFullscreen = false;
}
$('close-player').addEventListener('click', closePlayer);
$('player').addEventListener('cancel', (event) => { event.preventDefault(); closePlayer(); });
$('player').addEventListener('close', () => $('player-frame').replaceChildren());
$('player-fullscreen').addEventListener('click', () => requestFullscreen($('player')));
let invalidVideos = 0;
for (const video of videos) {
  const id = youtubeId(video.url);
  if (!id) { invalidVideos++; continue; }
  const button = document.createElement('button');
  button.className = 'video-card';
  button.setAttribute('aria-label', `Watch ${video.title}`);
  const art = document.createElement('span');
  art.className = 'video-art';
  art.style.setProperty('--tile', /^#[0-9a-f]{6}$/i.test(video.color || '') ? video.color : '#e7eddc');
  const emoji = document.createElement('span');
  emoji.className = 'video-emoji'; emoji.textContent = video.emoji || '🎬'; emoji.setAttribute('aria-hidden', 'true');
  const play = document.createElement('span');
  play.className = 'video-play'; play.textContent = '▶'; play.setAttribute('aria-hidden', 'true');
  art.append(emoji, play);
  const caption = document.createElement('span');
  caption.className = 'video-caption'; caption.textContent = video.title || 'A little video';
  const subtitle = document.createElement('small'); subtitle.textContent = video.subtitle || 'Tap to watch';
  caption.append(subtitle); button.append(art, caption);
  button.addEventListener('click', () => openPlayer(video, id));
  $('video-grid').append(button);
}
function videoStatus() {
  $('video-status').textContent = !navigator.onLine ? 'Videos need an internet connection. You can still draw!' : !$('video-grid').children.length ? 'Your little library is waiting. Add videos in videos.js.' : invalidVideos ? `${invalidVideos} invalid video link(s) skipped. Check videos.js.` : '';
}
window.addEventListener('online', videoStatus);
window.addEventListener('offline', videoStatus);
videoStatus();

function selectTool(erase) {
  erasing = erase;
  for (const [id, selected] of [['brush', !erase], ['eraser', erase]]) {
    $(id).classList.toggle('selected', selected); $(id).setAttribute('aria-pressed', String(selected));
  }
}
for (const [name, hex] of palette) {
  const button = document.createElement('button');
  button.className = 'color'; button.style.setProperty('--color', hex);
  button.setAttribute('aria-label', name); button.setAttribute('aria-pressed', String(hex === color));
  button.classList.toggle('selected', hex === color);
  button.addEventListener('click', () => {
    color = hex; selectTool(false);
    for (const swatch of $('colors').children) {
      swatch.classList.toggle('selected', swatch === button); swatch.setAttribute('aria-pressed', String(swatch === button));
    }
  });
  $('colors').append(button);
}
$('brush').addEventListener('click', () => selectTool(false));
$('eraser').addEventListener('click', () => selectTool(true));
const sizes = [8, 16, 30];
const sizeNames = ['small', 'medium', 'big'];
$('size').addEventListener('click', () => {
  const index = (sizes.indexOf(brushSize) + 1) % sizes.length; brushSize = sizes[index];
  $('size-dot').style.width = $('size-dot').style.height = `${brushSize}px`;
  $('size').setAttribute('aria-label', `Brush size: ${sizeNames[index]}. Tap to change`);
});
function point(event) {
  const rect = canvas.getBoundingClientRect();
  return { x: (event.clientX - rect.left) * canvas.width / rect.width, y: (event.clientY - rect.top) * canvas.height / rect.height };
}
function paint(from, to, stroke) {
  ctx.save();
  // Transform coordinates back to screen proportions so strokes remain round in any orientation.
  ctx.scale(stroke.scaleX, stroke.scaleY);
  ctx.globalCompositeOperation = stroke.erase ? 'destination-out' : 'source-over';
  ctx.strokeStyle = stroke.color; ctx.fillStyle = stroke.color;
  ctx.lineWidth = stroke.width; ctx.lineCap = ctx.lineJoin = 'round';
  const x1 = from.x / stroke.scaleX, y1 = from.y / stroke.scaleY;
  const x2 = to.x / stroke.scaleX, y2 = to.y / stroke.scaleY;
  if (x1 === x2 && y1 === y2) { ctx.beginPath(); ctx.arc(x1, y1, stroke.width / 2, 0, Math.PI * 2); ctx.fill(); }
  else { ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke(); }
  ctx.restore();
}
canvas.addEventListener('pointerdown', (event) => {
  if (restoring || (event.pointerType === 'mouse' && event.button !== 0)) return;
  event.preventDefault();
  if (!pointers.size) remember();
  const rect = canvas.getBoundingClientRect();
  const start = point(event);
  const stroke = { last: start, color, erase: erasing, width: erasing ? 48 : brushSize, scaleX: canvas.width / rect.width, scaleY: canvas.height / rect.height };
  pointers.set(event.pointerId, stroke);
  canvas.setPointerCapture(event.pointerId);
  paint(start, start, stroke); dirty = true;
});
canvas.addEventListener('pointermove', (event) => {
  const stroke = pointers.get(event.pointerId); if (!stroke) return;
  event.preventDefault();
  const samples = event.getCoalescedEvents?.() || [];
  for (const sample of samples.length ? samples : [event]) {
    const next = point(sample); paint(stroke.last, next, stroke); stroke.last = next;
  }
});
for (const type of ['pointerup', 'pointercancel', 'lostpointercapture']) canvas.addEventListener(type, endGesture);
canvas.addEventListener('contextmenu', (event) => event.preventDefault());
window.addEventListener('resize', endAllGestures);
window.addEventListener('blur', endAllGestures);
document.addEventListener('visibilitychange', () => { if (document.hidden) { endAllGestures(); persistDrawing(); } });
window.addEventListener('pagehide', () => { endAllGestures(); persistDrawing(); });
$('undo').disabled = true;
$('undo').addEventListener('click', () => {
  endAllGestures(); const snapshot = history.pop();
  if (snapshot) { ctx.putImageData(snapshot, 0, 0); scheduleSave(); }
  $('undo').disabled = !history.length;
});
$('clear').addEventListener('click', () => { endAllGestures(); $('clear-dialog').showModal(); });
$('cancel-clear').addEventListener('click', () => $('clear-dialog').close());
$('confirm-clear').addEventListener('click', () => {
  remember(); ctx.clearRect(0, 0, canvas.width, canvas.height); scheduleSave(); $('clear-dialog').close();
});
$('save').addEventListener('click', () => {
  endAllGestures();
  const image = document.createElement('canvas'); image.width = canvas.width; image.height = canvas.height;
  const imageCtx = image.getContext('2d'); imageCtx.fillStyle = '#fffdf8'; imageCtx.fillRect(0, 0, image.width, image.height); imageCtx.drawImage(canvas, 0, 0);
  image.toBlob((blob) => {
    if (!blob) { announce('Could not save the picture. Please try again.'); return; }
    const url = URL.createObjectURL(blob); const link = document.createElement('a');
    link.href = url; link.download = `little-masterpiece-${new Date().toISOString().slice(0, 10)}.png`;
    document.body.append(link); link.click(); link.remove(); setTimeout(() => URL.revokeObjectURL(url), 60000);
    announce('Picture ready to save.');
  }, 'image/png');
});
try {
  const saved = localStorage.getItem(storageKey);
  if (saved) {
    const image = new Image();
    image.onload = () => { ctx.drawImage(image, 0, 0, canvas.width, canvas.height); restoring = false; };
    image.onerror = () => { restoring = false; announce('The previous picture could not be restored.'); };
    image.src = saved;
  } else restoring = false;
} catch { restoring = false; announce('Automatic saving is unavailable on this device.'); }

let installPrompt;
window.addEventListener('beforeinstallprompt', (event) => { event.preventDefault(); installPrompt = event; $('install').hidden = false; });
$('install').addEventListener('click', async () => {
  if (!installPrompt) return;
  await installPrompt.prompt(); await installPrompt.userChoice; installPrompt = null; $('install').hidden = true;
});
window.addEventListener('appinstalled', () => { $('install').hidden = true; installPrompt = null; });
if ('serviceWorker' in navigator && (location.protocol === 'https:' || ['localhost', '127.0.0.1'].includes(location.hostname))) {
  navigator.serviceWorker.register('./sw.js').catch(() => {
    $('video-status').textContent = 'Offline setup was unavailable. Reload while connected to try again.';
  });
}
