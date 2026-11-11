# Haji Mohammad Yassin – VR

Responsive static website: HTML + CSS + JavaScript.

## Start
Run a local HTTP server in this directory (do not open via file://):

```bash
python -m http.server 8000
```

Open http://localhost:8000

## Replace placeholder assets
- `assets/logo_company.png` — company logo
- `assets/logo_vr.png` — VR project logo
- `models/mosque.glb` — 3D mosque model for `<model-viewer>`

The website displays text/logo fallbacks when the logos are missing. The 3D viewer displays a poster placeholder until a valid GLB is supplied. Model viewing requires a browser with WebGL and an internet connection to load Google's model-viewer component.

## Prayer times
The page uses `https://api.waktusolat.app/v2/solat/JHR04` (Muar / Pagoh) and selects today's row in the Asia/Kuala_Lumpur timezone. The API may change or experience outages; in that case, no fabricated times are displayed. Daily entries are cached locally and the Refresh button forces a new fetch.

## Future pages
`gallery.html` and `ar-cam.html` are navigable placeholders, not completed features.
