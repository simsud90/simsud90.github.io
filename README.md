# Little Play
Plain HTML, CSS, and JavaScript. No framework, package installation, build step, analytics, or account.

## Run
From this folder, run `node server.cjs` and open `http://localhost:8080`. ES modules require serving over HTTP; opening index.html directly will not work. Node 18 or newer is sufficient. The included server is for local development.

For a tablet, deploy these files to an HTTPS static host. Visiting an ordinary HTTP LAN address can preview the app, but installation and offline caching require HTTPS (or localhost on the same device).

On iPad: open in Safari, choose Share → Add to Home Screen. On Android: use Install in the app if available, or the browser’s Install app menu. The home page and drawing tools work offline after one successful connected visit. Videos always require internet.

## Choose videos
Edit **videos.js**. Each entry has a title, subtitle, and URL. YouTube thumbnails are generated automatically from the URL; optional emoji and background color fields customize the fallback if an image fails to load. URLs can be normal YouTube links, short links, shorts, live links, embed links, or raw video IDs. Reload while connected to pick up edits. Preview every selection yourself, including whether embedding is enabled.

Thumbnails load from YouTube's image servers as preview cards approach the viewport. The privacy-enhanced YouTube player loads only after a video is selected. Embedding **does not disable advertising**. There is no supported embed parameter that reproduces Brave’s ad blocking. YouTube may show ads, controls, external links, and recommendations; `rel=0` restricts recommendations to the same channel rather than removing them. A browser’s blocking behavior is outside this app’s control. For reliably ad-free video, use appropriately licensed local video files instead.

### Ad blocking
To block YouTube ads, open this app in Brave and enable Brave Shields for the site, or use a browser with a compatible ad-blocking extension. Blocking depends on the browser and YouTube and is not guaranteed. The app does not bundle an ad blocker or bypass the browser's restrictions; installing the app alone does not add ad blocking.

Videos open in a viewport-filling player and request browser fullscreen on tap. To close the video and leave fullscreen, tap **Back** and the **square** button in either order. The first button stays highlighted while playback continues; tapping it again does not count as the other button. Exit progress resets for each video. Escape does not close the app's player. YouTube's own fullscreen and picture-in-picture permissions are disabled so the app's controls remain available.

Some browsers, particularly iPad Safari, limit programmatic fullscreen; the player still fills the app. Browser/OS fullscreen exits (such as Escape or system gestures) cannot be disabled by a website, and do not close the video. Autoplay with sound can also require a second tap under browser policy. This app is not a device kiosk or parental-control boundary.

## Drawing
Each finger or pen gets an independent stroke using Pointer Events and pointer capture. Canvas gestures do not scroll or zoom the page; page-level zoom remains available for accessibility. A gesture with simultaneous fingers is one undo step. Tools include six colors, three sizes, erasing, eight undo steps, confirmed clearing, and PNG export. Rotation retains the picture, adapting it to the new canvas proportions. Export is 2048 × 1536.

The latest drawing is stored only in localStorage on this device. Storage can be unavailable, full, or cleared by the browser; use Save picture for a permanent copy. Downloads may open a preview on iPad, where Share → Save Image can be used.

## Checks before handing to a child
Run **node tools/check.cjs** for syntax, video URL validation, simulated multitouch and undo, pointer cancellation, player cleanup, icon dimensions, and offline file checks. These simulations do not replace browser and device testing.

Use the target tablet to check simultaneous fingers, a resting second finger, pointer cancellation, rotation, undo, erasing, relaunch persistence, PNG export, offline launch, installation, and video/fullscreen behavior. Review your selected videos.

## Updating
Serve every file, including the icons directory. If changing the offline asset list, increment the cache version in sw.js. Connected reloads fetch the newest files; open sessions use their currently loaded code until reloaded.
