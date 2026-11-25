// main.ts — Sizzle Station hand-in (Node 22, standard library only).
//
// The program copies this repo's game/ and screenshots/ into the output
// directory and writes dossier.json with the kit's vendored library, so the
// sealed scorer and the judge see exactly what was built here.
//
// Run locally:  mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
// In the grader: /output is used instead of MAKEFUN_OUTPUT_DIR.

import { cpSync, existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-game.ts';

const repoRoot = fileURLToPath(new URL('.', import.meta.url));
const outputDir = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

mkdirSync(outputDir, { recursive: true });
cpSync(join(repoRoot, 'game'), join(outputDir, 'game'), { recursive: true });
mkdirSync(join(outputDir, 'screenshots'), { recursive: true });
if (existsSync(join(repoRoot, 'screenshots'))) {
  cpSync(join(repoRoot, 'screenshots'), join(outputDir, 'screenshots'), { recursive: true });
}

// Caps from the competition gate: 4 screenshots at most 256 KiB each,
// game/ at most 993 files and 48 MiB, paths at most 1000 bytes, and the
// dossier text capped at 163,840 bytes (160 KiB).
writeFileSync(
  join(outputDir, 'dossier.json'),
  buildDossier(outputDir, {
    text_max_bytes: 163840,
    screenshots: { max: 4, max_bytes: 262144 },
    game_max_files: 993,
    game_max_bytes: 50331648,
    game_path_max_bytes: 1000,
  }),
);
