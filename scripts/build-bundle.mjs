import esbuild from 'esbuild';
import path from 'path';
import { fileURLToPath } from 'url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

await esbuild.build({
    entryPoints: [path.join(root, 'js', 'sketch.js')],
    bundle: true,
    format: 'esm',
    outfile: path.join(root, 'js', 'bundle.mjs'),
    external: ['three', 'three/*']
});

console.log('Wrote js/bundle.mjs');
