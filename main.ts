// The Quiet Gallery — entry program.
//
// Copies game/ and screenshots/ from this repository into the output
// directory and writes the dossier buildDossier derives from them, so the
// sealed scorer can check the entry byte for byte. Outside the grader the
// output directory comes from MAKEFUN_OUTPUT_DIR; inside it, /output.
import { cpSync, mkdirSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-game.ts';

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)));
const outDir = resolve(process.env.MAKEFUN_OUTPUT_DIR ?? '/output');

const dossier = buildDossier(repoRoot, {
  text_max_bytes: 163840,
  screenshots: { max: 4, max_bytes: 262144 },
  game_max_files: 993,
  game_max_bytes: 50331648,
});

// Start from a clean output directory so a second run writes the same bytes.
// Clear the directory's contents, never the directory itself: in the grader
// /output is a mount point, and removing it fails (rmdir on a mount point is
// refused), which used to throw here and exit the program with code 1.
mkdirSync(outDir, { recursive: true });
for (const entry of readdirSync(outDir)) {
  rmSync(join(outDir, entry), { recursive: true, force: true });
}
cpSync(join(repoRoot, 'game'), join(outDir, 'game'), { recursive: true });
cpSync(join(repoRoot, 'screenshots'), join(outDir, 'screenshots'), { recursive: true });
writeFileSync(join(outDir, 'dossier.json'), dossier);
console.log(`wrote ${outDir} (dossier ${dossier.length} bytes)`);
