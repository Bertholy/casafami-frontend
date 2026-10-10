// Contrôle d'encodage : échoue si un fichier du site contient un caractère cassé (« mÃ©dicale » au lieu de « médicale »,
// ou le caractère de remplacement �). Lancé automatiquement par « npm run lint » et « npm run build ».
// Le même contrôle existe côté serveur (EncodageTests) pour tout le projet.
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { extname, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const racineSite = resolve(fileURLToPath(new URL('..', import.meta.url)));
const dossiers = ['src', 'public', 'index.html', 'package.json'];
const extensions = new Set(['.js', '.jsx', '.mjs', '.css', '.html', '.svg', '.json', '.md']);

// Ã n'existe pas en français ; Â n'est cassé que suivi d'un signe latin-1 (« Âge » est correct) ; â€ = apostrophe ou tiret mal lus.
const CASSE = /[Ã�]|Â[ -¿]|â€/;

const problemes = [];
function parcourir(chemin) {
    const stat = statSync(chemin);
    if (stat.isDirectory()) { for (const nom of readdirSync(chemin)) parcourir(join(chemin, nom)); return; }
    if (!extensions.has(extname(chemin))) return;
    const texte = readFileSync(chemin, 'utf8');
    const trouve = CASSE.exec(texte);
    if (trouve) problemes.push(` - ${relative(racineSite, chemin)} : « ${texte.slice(Math.max(0, trouve.index - 15), trouve.index + 25).replace(/\s+/g, ' ')} »`);
}
for (const d of dossiers) { try { parcourir(join(racineSite, d)); } catch { /* dossier absent */ } }

if (problemes.length) {
    console.error('Caractères cassés détectés (double encodage) :\n' + problemes.join('\n'));
    console.error('\nEnregistrez les fichiers en UTF-8 et corrigez le texte (ex. « mÃ©dicale » → « médicale »).');
    process.exit(1);
}
console.log('Encodage : aucun caractère cassé.');
