import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const dataDir = path.join(root, 'data');

for (const name of ['config', 'copy', 'emotions', 'community-phrases', 'frasi-sesto-senso']) {
    const json = JSON.parse(fs.readFileSync(path.join(dataDir, `${name}.json`), 'utf8'));
    const js = [
        '(function (w) {',
        '  w.SESTOSENS_DATA = w.SESTOSENS_DATA || {};',
        `  w.SESTOSENS_DATA.${name.replace(/-([a-z])/g, (_, c) => c.toUpperCase())} = ${JSON.stringify(json)};`,
        '})(window);',
        ''
    ].join('\n');
    fs.writeFileSync(path.join(dataDir, `${name}.js`), js);
    console.log(`Wrote data/${name}.js`);
}
