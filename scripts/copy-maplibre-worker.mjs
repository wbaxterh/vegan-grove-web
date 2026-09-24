// MapLibre 6 runs its tile parsing in a module worker that imports a shared
// chunk by relative path. Turbopack emits both files under hashed names, so
// the worker's `./maplibre-gl-shared.mjs` import 404s and the map stays blank.
// Self-hosting the two files under public/maplibre/ keeps the relative import
// intact; places-map.tsx points MapLibre at it with setWorkerUrl(). Runs on
// predev and prebuild; the output directory is gitignored.
import { copyFile, mkdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.dirname(fileURLToPath(new URL('.', import.meta.url)));
const src = path.join(root, 'node_modules', 'maplibre-gl', 'dist');
const dest = path.join(root, 'public', 'maplibre');
const files = ['maplibre-gl-worker.mjs', 'maplibre-gl-shared.mjs'];

await mkdir(dest, { recursive: true });
for (const file of files) {
  await copyFile(path.join(src, file), path.join(dest, file));
}
console.log(`copied ${files.length} MapLibre worker files to public/maplibre/`);
