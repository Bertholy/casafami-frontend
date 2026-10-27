/**
 * Audit Lighthouse de TOUTES les pages : site public et espace du personnel.
 *
 *   npm run lighthouse
 *
 * Il faut que le site tourne (par défaut l'aperçu de production : « npm run build » puis « npm run preview », port 4173)
 * et, pour l'espace du personnel, que l'API tourne aussi et qu'un compte existe :
 *
 *   LH_URL=http://localhost:4173  LH_API=http://localhost:8081/api
 *   LH_EMAIL=... LH_PASSWORD=...      (sans compte, seules les pages publiques sont auditées)
 *   LH_MOBILE=1                       (profil téléphone ; sinon ordinateur)
 *
 * Les rapports détaillés (HTML) sont écrits dans lighthouse-reports/ ; le tableau des notes est affiché à la fin.
 * Utilisez un compte de TEST, jamais celui du cabinet.
 */
import fs from 'node:fs';
import path from 'node:path';
import puppeteer from 'puppeteer-core';
import lighthouse from 'lighthouse';

const BASE = (process.env.LH_URL || 'http://localhost:4173').replace(/\/$/, '');
const API = process.env.LH_API || 'http://localhost:8081/api';
const MOBILE = process.env.LH_MOBILE === '1';
const SORTIE = path.resolve('lighthouse-reports');

const PAGES_PUBLIQUES = ['/', '/services', '/prendre-rdv', '/mes-rdv', '/medecin/login', '/medecin/mot-de-passe-oublie'];
const PAGES_PERSONNEL = [
    '/admin/dashboard', '/calendrier', '/corbeille', '/statistiques', '/messagerie',
    '/patients/dossier', '/patients/maternite', '/espace/mes-patients', '/assistant/ordonnance', '/medecin/maladies',
    '/admin/utilisateurs', '/admin/permissions', '/admin/services', '/admin/planning', '/admin/occupation',
    '/admin/journal', '/admin/sauvegardes', '/admin/personnalisation',
];

const NAVIGATEURS = [
    process.env.CHROME_PATH,
    'C:/Program Files/Google/Chrome/Application/chrome.exe',
    'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe',
    'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
    'C:/Program Files/Microsoft/Edge/Application/msedge.exe',
].filter(Boolean);
const chromePath = NAVIGATEURS.find(chemin => fs.existsSync(chemin));
if (!chromePath) { console.error('Aucun Chrome ou Edge trouvé : indiquez CHROME_PATH.'); process.exit(1); }

/** Ouvre une session dans le navigateur (sessionStorage) : c'est ce que le site lit pour savoir qui est connecté. */
async function connexion() {
    const { LH_EMAIL: email, LH_PASSWORD: motDePasse } = process.env;
    if (!email || !motDePasse) return null;
    const reponse = await fetch(`${API}/auth/login`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email, motDePasse }) });
    if (!reponse.ok) throw new Error(`Connexion impossible (${reponse.status}) : vérifiez LH_EMAIL, LH_PASSWORD et LH_API.`);
    return reponse.json();
}

const flags = { logLevel: 'error', output: 'html', formFactor: MOBILE ? 'mobile' : 'desktop', screenEmulation: { disabled: true }, disableStorageReset: true };
const CATEGORIES = [['performance', 'Perf.'], ['accessibility', 'Access.'], ['best-practices', 'Bonnes prat.'], ['seo', 'SEO']];

fs.mkdirSync(SORTIE, { recursive: true });
const session = await connexion();
if (!session) console.log('Pas de compte (LH_EMAIL / LH_PASSWORD) : seules les pages publiques sont auditées.\n');

const navigateur = await puppeteer.launch({ executablePath: chromePath, headless: true, args: ['--no-sandbox', '--lang=fr-FR'] });
const lignes = [];
try {
    const page = await navigateur.newPage();
    if (MOBILE) await page.setViewport({ width: 412, height: 823, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
    else await page.setViewport({ width: 1350, height: 940 });
    // La session (sessionStorage) est propre à l'onglet : on l'écrit dans CET onglet, que Lighthouse réutilise ensuite.
    if (session) {
        await page.goto(`${BASE}/medecin/login`, { waitUntil: 'domcontentloaded' });
        await page.evaluate(donnees => {
            sessionStorage.setItem('token', donnees.token);
            sessionStorage.setItem('role', donnees.role);
            sessionStorage.setItem('email', donnees.email || '');
            sessionStorage.setItem('permissions', JSON.stringify(donnees.permissions || []));
        }, session);
    }
    const pages = [...PAGES_PUBLIQUES, ...(session ? PAGES_PERSONNEL : [])];
    for (const chemin of pages) {
        const resultat = await lighthouse(BASE + chemin, flags, { extends: 'lighthouse:default', settings: { onlyCategories: CATEGORIES.map(([id]) => id) } }, page);
        const arrivee = new URL(resultat.lhr.finalDisplayedUrl).pathname;
        const notes = Object.fromEntries(CATEGORIES.map(([id]) => [id, Math.round((resultat.lhr.categories[id]?.score ?? 0) * 100)]));
        const nom = (chemin === '/' ? 'accueil' : chemin.slice(1).replaceAll('/', '-')) + '.html';
        fs.writeFileSync(path.join(SORTIE, nom), resultat.report);
        lignes.push({ page: chemin, ...notes });
        const redirige = arrivee !== chemin ? `   ⚠ redirigée vers ${arrivee} (session refusée ?)` : '';
        console.log(`${chemin.padEnd(32)} ${CATEGORIES.map(([id, nomCat]) => `${nomCat} ${String(notes[id]).padStart(3)}`).join('  ')}${redirige}`);
    }
} finally {
    await navigateur.close();
}

const moyenne = id => Math.round(lignes.reduce((somme, ligne) => somme + ligne[id], 0) / lignes.length);
console.log(`\n${'MOYENNE'.padEnd(32)} ${CATEGORIES.map(([id, nomCat]) => `${nomCat} ${String(moyenne(id)).padStart(3)}`).join('  ')}`);
console.log(`Rapports détaillés : ${SORTIE}`);
