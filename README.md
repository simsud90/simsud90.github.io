# Little Play
Plain HTML, CSS, and JavaScript. No framework, package installation, build step, analytics, or account.

## Run
From this folder, run `node server.cjs` and open `http://localhost:8080`. ES modules require serving over HTTP; opening index.html directly will not work. Node 18 or newer is sufficient. The included server is for local development.

For a tablet, deploy these files to an HTTPS static host. Visiting an ordinary HTTP LAN address can preview the app, but installation and offline caching require HTTPS (or localhost on the same device).

On iPad: open in Safari, choose Share → Add to Home Screen. On Android: use Install in the app if available, or the browser’s Install app menu. The home page and drawing tools work offline after one successful connected visit. Videos always require internet.

## Choose videos
Edit **videos.js**. Each entry has a title, subtitle, URL, emoji, and background color. URLs can be normal YouTube links, short links, shorts, live links, embed links, or raw video IDs. Delete the samples or add your own entries. Reload while connected to pick up edits. Preview every selection yourself, including whether embedding is enabled.

YouTube’s privacy-enhanced domain is used and no YouTube request is made until a video is selected. Embedding **does not disable advertising**. There is no supported embed parameter that reproduces Brave’s ad blocking. YouTube may show ads, controls, external links, and recommendations; `rel=0` restricts recommendations to the same channel rather than removing them. A browser’s blocking behavior is outside this app’s control. For reliably ad-free video, use appropriately licensed local video files instead.

Videos open in a viewport-filling player and request browser fullscreen on tap. Some browsers, particularly iPad Safari, limit programmatic fullscreen; the player still fills the app and YouTube’s fullscreen control remains available. Autoplay with sound can also require a second tap under browser policy. This app is not a device kiosk or parental-control boundary.

## Drawing
Each finger or pen gets an independent stroke using Pointer Events and pointer capture. Canvas gestures do not scroll or zoom the page; page-level zoom remains available for accessibility. A gesture with simultaneous fingers is one undo step. Tools include six colors, three sizes, erasing, eight undo steps, confirmed clearing, and PNG export. Rotation retains the picture, adapting it to the new canvas proportions. Export is 2048 × 1536.

The latest drawing is stored only in localStorage on this device. Storage can be unavailable, full, or cleared by the browser; use Save picture for a permanent copy. Downloads may open a preview on iPad, where Share → Save Image can be used.

## Checks before handing to a child
Run **node tools/check.cjs** for syntax, video URL validation, simulated multitouch and undo, pointer cancellation, player cleanup, icon dimensions, and offline file checks. These simulations do not replace browser and device testing.

Use the target tablet to check simultaneous fingers, a resting second finger, pointer cancellation, rotation, undo, erasing, relaunch persistence, PNG export, offline launch, installation, and video/fullscreen behavior. Review the sample videos and replace them with your own choices.

## Updating
Serve every file, including the icons directory. If changing the offline asset list, increment the cache version in sw.js. Connected reloads fetch the newest files; open sessions use their currently loaded code until reloaded.
