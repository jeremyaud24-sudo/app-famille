// Prépare www/ : copie l'application web, y ajoute le pont iOS et les polices embarquées (fonctionnement hors ligne).
import { cpSync, mkdirSync, readFileSync, writeFileSync, rmSync, existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ici = dirname(fileURLToPath(import.meta.url)), racine = join(ici, '..', '..'), www = join(ici, '..', 'www');
rmSync(www, { recursive: true, force: true });
mkdirSync(join(www, 'fonts'), { recursive: true });

let html = readFileSync(join(racine, 'index.html'), 'utf8');
const scripts = [...html.matchAll(/<script src="([^"]+)"><\/script>/g)].map(m => m[1]);
for (const f of [...scripts, 'style.css', 'manifest.json']) cpSync(join(racine, f), join(www, f));
cpSync(join(racine, 'icons'), join(www, 'icons'), { recursive: true });
cpSync(join(ici, '..', '..', 'standalone', 'shim.js'), join(www, 'native-shim.js'));
cpSync(join(ici, '..', 'native', 'native.css'), join(www, 'native.css'));

// Polices (variables, sous-ensemble latin) copiées depuis node_modules
const nm = join(ici, '..', 'node_modules', '@fontsource-variable');
const polices = [['fraunces', 'Fraunces', 'fraunces-latin-wght-normal.woff2'], ['figtree', 'Figtree', 'figtree-latin-wght-normal.woff2']];
let css = '';
for (const [dossier, famille, fichier] of polices) {
  const src = join(nm, dossier, 'files', fichier);
  if (!existsSync(src)) throw new Error('Police introuvable : ' + src + ' (npm install ?)');
  cpSync(src, join(www, 'fonts', fichier));
  css += `@font-face{font-family:'${famille}';font-style:normal;font-display:swap;font-weight:300 900;src:url(fonts/${fichier}) format('woff2-variations'),url(fonts/${fichier}) format('woff2')}\n`;
}
writeFileSync(join(www, 'fonts.css'), css);

html = html.replace(/<link[^>]+fonts\.googleapis[^>]*>/g, '<link rel="stylesheet" href="fonts.css">');
html = html.replace('<script src="app.js"></script>', '<script src="native-shim.js"></script>\n<script src="app.js"></script>');
html = html.replace(/<link rel="manifest"[^>]*>/, '<link rel="stylesheet" href="native.css">');
writeFileSync(join(www, 'index.html'), html);
console.log('www/ prêt :', scripts.length, 'scripts + polices + pont iOS');
