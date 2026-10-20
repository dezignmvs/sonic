# Sonic

A vanilla HTML/CSS/JavaScript music PWA starter. It includes a responsive player, JioSaavn and Audius discovery adapters, device-local music selection, guest playlists/likes, a local upload preview workflow, and optional Firebase/Cloudinary adapters. It has no build step or frontend framework.

## Run locally

Serve this folder over HTTP(S); opening `index.html` as a `file:` URL will prevent JavaScript modules, service workers, and install prompts from working.

```sh
cd sonic
python -m http.server 8000
```

Open `http://localhost:8000`. Localhost is treated as a secure context for development. For production, deploy the folder to a static host with HTTPS. The Service Worker caches the app shell and provides `offline.html` for navigation while disconnected. It does not cache streamed audio or the music catalog.

## What works now

- Responsive desktop and mobile layouts with a persistent HTML Audio player.
- Hugeicons free stroke icon font for interface icons.
- JioSaavn song search and discovery through the hosted, unofficial API. Returned audio links play in Sonic's standard audio player.
- Audius trending and search requests through a replaceable adapter. Audius track links are streamed through its documented track stream endpoint.
- Optional Jamendo trending and search, including its API-provided stream links, attribution page, and Creative Commons license URL. Jamendo requires a client ID; without one Sonic uses Audius only.
- Play/pause, previous/next, seek, volume/mute, shuffle, repeat off/all/one, a queue, queue clearing/removal, liked tracks, keyboard controls, Media Session metadata/actions, and an expanded player.
- Device file picker, multi-select, local playback, and local upload preview. Audio is held as a browser object URL and isn't uploaded by the Local Music flow.
- Device-local playlists and guest profile name, search and browse views, PWA install prompt, settings screen, and light theme.

Guest state is stored in localStorage. Audio bytes are never put there. Local file object URLs are session-only and are not restored after reload.

## Music catalogs and attribution

The app uses the hosted [JioSaavn API](https://saavn.sumit.co/) for song search and discovery, and its returned audio links for playback. The service describes itself as an unofficial API; availability, catalog access, playback links, and permitted use depend on that service and the rights holders. Sonic does not download or store catalog audio. Review the API's [source and documentation](https://github.com/sumitkolhe/jiosaavn-api) and applicable terms before public or commercial use.

The app also uses Audius read endpoints for trending/search and `/v1/tracks/{track_id}/stream` for selected playback. Most read endpoints work without credentials; an optional read-only API key can improve rate limits. See the [Audius API reference](https://docs.audius.co/api/) and [track SDK documentation](https://docs.audius.co/sdk/tracks/).

Jamendo's documented tracks endpoint returns stream URLs, track metadata, and license information. A free Jamendo API client ID is required. Register an app at the [Jamendo developer portal](https://devportal.jamendo.com/), then open **Settings → Services** in Sonic and paste its public client ID. Alternatively set `JAMENDO_CLIENT_ID` in `js/config.js`. The [tracks API docs](https://developer.jamendo.com/v3.0/tracks) describe `audio` as a stream URL; Sonic does not use the download endpoint. Review each track's linked license and Jamendo's API terms before using content beyond personal listening.

The app combines JioSaavn and Audius search results, with Jamendo added when its client ID is configured. These services have different catalogs and terms; availability of commercial tracks is not guaranteed.

Internet Archive is not enabled as a music search source. Its collection includes material with varied rights and audio formats; adding it responsibly requires a rights/metadata filter rather than treating all files as streamable music. The UI displays each enabled source and provides a source-page link when available.

To add the optional keys, copy `js/config.example.js` to `js/config.js` and set `AUDIUS_API_KEY` and/or `JAMENDO_CLIENT_ID`. These are public client identifiers. JioSaavn does not need a key. Never add a secret credential to frontend code.

## Firebase setup

1. Create a Firebase project and register a web app.
2. Enable Email/Password in Firebase Authentication and create Firestore.
3. Copy the public web app fields into `FIREBASE_CONFIG` in `js/config.js`.
4. Publish `firebase/firestore.rules` and `firebase/firestore.indexes.json` with the Firebase CLI.
5. The `js/firebase.js` module provides initialization, email registration/login/logout, password reset, and an owner-scoped document helper.

Firebase keys in browser apps are public identifiers; authorization comes from Auth and Security Rules, not hiding buttons. Review rules before deployment. Settings exposes email registration, sign-in, sign-out, and password reset when credentials are filled in. Cloud uploads require a signed-in user. General playlist/library sync is still not wired; user-created playlists and likes currently remain local to the device.

## Cloudinary uploads

1. Create a Cloudinary cloud and two separate unsigned upload presets, one for audio and one for images.
2. Restrict each preset to the needed file formats, maximum file sizes, allowed folders, and upload behavior in the Cloudinary console.
3. Set the cloud name and preset names in `CLOUDINARY` in `js/config.js`.
4. `js/cloudinary.js` has separate upload functions, format/size checks, progress callbacks, and AbortSignal cancellation.

The upload page supports local preview and, when Cloudinary and Firebase are configured, uploading audio/artwork and saving private metadata to Firestore. Cloudinary API secrets must stay server-side. For production, use authenticated signed uploads generated by a backend, validate ownership server-side, store only asset URLs and metadata in Firestore, and delete assets only through an authorized backend operation. Unsigned presets cannot securely enforce user ownership on their own. Cloudinary assets are not deleted when a Firestore record is deleted; implement an authorized backend deletion endpoint before adding that feature.

## Local music and mobile limitations

Use **Local music → Choose audio files** or **Upload music** to select files through the operating system picker. The PWA cannot silently scan a device. Files selected through the picker are available only to this page/session, and the user may remove them with **Clear selection**. On iOS, use the Files picker; the app does not get unrestricted access to the phone's music library. File System Access API persistent directory handles are not implemented because browser support and permission behavior differ.

## Install and offline behavior

The manifest uses standalone display and an SVG app icon. Serve over HTTPS (or localhost during development), then use the browser's install/add-to-home-screen UI. Some browsers don't expose `beforeinstallprompt`; the install button then explains to use the browser menu. The service worker stores the application shell only. Network music discovery and streamed tracks need a connection. There is no offline music download feature.

After deploying a new version, increment the service worker's cache name (`sonic-shell-v8`) to refresh the shell. The service worker checks the network first for app scripts and styles, then uses its cached copy while offline. Browsers update the worker in the background; use the **Update** banner or close/reopen the app if an older installed shell remains open.

## Security and remaining production work

- `firebase/firestore.rules` restricts user profiles, private playlists, libraries, playback state, and track writes to owners. Review and adapt the schema/rules to the actual application before launch.
- Firestore cannot authorize deletion of Cloudinary assets. A trusted serverless function must validate Firebase identity and ownership before making Cloudinary Admin API requests.
- Add backend validation, rate limiting, abuse reporting, privacy disclosures, and a rights/takedown process before publishing user uploads to other listeners.
- Firestore synchronization of playlists/likes, upload metadata editing/deletion, artwork editing, pagination, and licensed offline downloads are not yet wired into the front end.
- No API secrets are included in the repository. `js/config.js` contains blank placeholders for local setup and should not be used to store private keys.

## Troubleshooting

- **No discovery:** check network access to `api.audius.co`; optional key setup can improve read rate limits.
- **Track won't play:** the provider can report unavailable or region-restricted media; try another result or open its Audius source page.
- **PWA won't install:** use HTTPS or localhost and verify the manifest and service worker load without errors.
- **Local audio is unsupported:** browser codec support varies; try a common MP3, AAC, WAV, or FLAC file.
- **Upload adapter rejects a file:** verify the MIME/extension and file size, then check the preset limits and Cloudinary response.
- **Firebase reads/writes fail:** check project config, Authentication settings, deployed rules, and the browser console.

## File map

```text
index.html
manifest.webmanifest
service-worker.js
offline.html
css/styles.css
js/app.js
js/config.js                 local placeholders; keep secrets out
js/config.example.js
js/api/audius.js
js/api/jamendo.js
js/api/saavn.js
js/firebase.js
js/cloudinary.js
firebase/firestore.rules
firebase/firestore.indexes.json
assets/icons/icon.svg
```

Interface glyphs use the [Hugeicons Free Icon Font](https://hugeicons.com/docs/icons-for-web/quick-start) stylesheet from its CDN; the custom Sonic logo/app icon remains an SVG asset.
