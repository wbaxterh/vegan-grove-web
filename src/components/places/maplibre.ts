import 'maplibre-gl/dist/maplibre-gl.css';
import { setWorkerUrl } from 'maplibre-gl';

/**
 * Shared MapLibre setup for every map on the site. Import this module only from client
 * islands: MapLibre touches `window` at import time.
 */

// Self-hosted worker (see scripts/copy-maplibre-worker.mjs): the bundled one
// cannot resolve its shared chunk under Turbopack's hashed file names.
setWorkerUrl('/maplibre/maplibre-gl-worker.mjs');

/** OpenFreeMap: no API key, no cookies, no per-user data on the tile server. */
export const STYLE_URL = 'https://tiles.openfreemap.org/styles/liberty';

/** Long Beach, the first grove. Device location never leaves the browser (privacy rule 3). */
export const INITIAL_VIEW = { longitude: -118.19, latitude: 33.83, zoom: 9 };
