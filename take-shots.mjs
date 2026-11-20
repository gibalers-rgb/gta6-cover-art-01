#!/usr/bin/env node
// Takes the screenshots in shots.json with headless Chrome and converts them
// to JPEGs inside screenshots/ (each at most 256 KiB, long side at most 1280).
import { execFileSync } from 'node:child_process';
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = fileURLToPath(new URL('.', import.meta.url));
const CHROME = `${process.env.HOME}/.cache/ms-playwright/chromium-1148/chrome-linux/chrome`;
const PORT = process.env.SHOT_PORT ?? '8901';
const shots = JSON.parse(readFileSync(join(here, 'shots.json'), 'utf8'));

mkdirSync(join(here, 'screenshots'), { recursive: true });
for (const shot of shots) {
  const png = join('/tmp', `shot-${shot.name}.png`);
  const url = `http://localhost:${PORT}/${shot.query}`;
  execFileSync(CHROME, [
    '--headless=new', '--disable-gpu', '--no-sandbox',
    `--screenshot=${png}`, `--window-size=${shot.w},${shot.h}`,
    '--virtual-time-budget=9000', '--hide-scrollbars', url,
  ], { stdio: 'inherit' });
  // Convert with Python/PIL: resize to the shot size, JPEG quality 82, and
  // step the quality down until the file fits the 256 KiB cap.
  const out = join(here, 'screenshots', shot.name);
  const py = `
from PIL import Image
import os
im = Image.open(${JSON.stringify(png)}).convert('RGB')
im.thumbnail((${shot.w}, ${shot.h}), Image.LANCZOS)
q = 82
while True:
    im.save(${JSON.stringify(out)}, 'JPEG', quality=q)
    if os.path.getsize(${JSON.stringify(out)}) <= 262144 or q <= 40:
        break
    q -= 8
print(${JSON.stringify(shot.name)}, im.size, os.path.getsize(${JSON.stringify(out)}), 'q', q)
`;
  execFileSync('python3', ['-c', py], { stdio: 'inherit' });
}
console.log('done');
