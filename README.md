# Haji Mohammad Yassin – VR | Homepage v2.1

A static website using HTML, CSS, JavaScript, and Google `<model-viewer>`.

## Start

Run `python -m http.server 8000` from this folder, then open `http://localhost:8000`.
Do not open `index.html` via `file://` because model loading and API requests can fail.

## Assets

- `models/mosque.glb` — **included** (your uploaded 3D model, ~44 MB).
- `assets/logo_company.png` — **add your own** company logo.
- `assets/logo_vr.png` — **add your own** VR logo.
- `assets/mosque-1.jpg`, `mosque-2.jpg`, `mosque-3.jpg` — **add your own** real mosque photos; the carousel skips missing photos.

If your logo files use a different extension, change the `src` attributes in `index.html`.

## Model appearance

Your screenshot shows very bright white walls. The viewer is now set to `exposure="0.85"`, `tone-mapping="neutral"`, a neutral environment, and softer shadows. These are starting values: material texture and model lighting will affect results. To tune, edit the `<model-viewer>` attributes in `index.html` and the `.viewer-panel model-viewer` background in `styles.css`.

## Place 3D annotations on the **actual** model

The supplied GLB has thousands of nodes. Generic hotspot coordinates are not reliable, so the three example hotspots start hidden rather than floating in arbitrary places.

1. Run the site, open the homepage and click **Place labels** under the model.
2. Click the exact spot on the 3D mosque where you want an annotation.
3. Copy the `data-position` and `data-normal` values from the popup (also logged to the browser console).
4. Find the appropriate `<button class="hotspot">` in `index.html`, replace its position/normal, and remove its `hidden` attribute.
5. Edit the text in `ANNOTATIONS` in `script.js`.
6. Click **Place labels** again to leave picking mode. **Show labels** displays configured annotations.

The example titles are *Main entrance*, *Roof details*, and *Prayer hall*. They are placeholders; edit as needed.

## Prayer times

The homepage fetches the JHR04 zone using `https://api.waktusolat.app/v2/solat/JHR04` and caches the daily timetable. Check the API response and prayer zone before deployment; no times are invented when the service is unavailable.

## Pages

`gallery.html` and `ar-cam.html` are placeholder pages to be developed later.

## Project structure

- `index.html` — page sections and `<model-viewer>` hotspots
- `styles.css` — all styles, responsive rules and viewer presentation
- `script.js` — prayer API, navigation, hotspot interaction, carousel
- `models/` — 3D model
- `assets/` — logos and real mosque photos
