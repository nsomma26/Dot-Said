#!/usr/bin/env python3
"""Generate data/*.js from data/*.json for file:// compatibility."""

import json
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
DATA = ROOT / 'data'

for name in ('config', 'copy', 'emotions'):
    payload = json.loads((DATA / f'{name}.json').read_text(encoding='utf-8'))
    js = '\n'.join([
        '(function (w) {',
        '  w.SESTOSENS_DATA = w.SESTOSENS_DATA || {};',
        f'  w.SESTOSENS_DATA.{name} = {json.dumps(payload, ensure_ascii=False)};',
        '})(window);',
        ''
    ])
    (DATA / f'{name}.js').write_text(js, encoding='utf-8')
    print(f'Wrote data/{name}.js')
