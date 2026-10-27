/*
 * Service worker de CASAFAMI (application installable).
 * - Pages : le réseau d'abord ; sans connexion, la dernière version gardée du site, sinon la page « hors connexion ».
 * - Fichiers du site (scripts, styles, images, polices) : servis depuis le cache, puis mis à jour en arrière-plan.
 * - L'API (rendez-vous, dossiers, comptes…) n'est JAMAIS mise en cache : ce sont des données de santé, qui doivent rester fraîches.
 * Changer VERSION à chaque modification de ce fichier : l'ancien cache est alors supprimé.
 */
const VERSION = 'casafami-v1';
const CACHE_PAGES = `${VERSION}-pages`;
const CACHE_FICHIERS = `${VERSION}-fichiers`;
const HORS_CONNEXION = '/hors-connexion.html';
const PRECHARGES = ['/', HORS_CONNEXION, '/manifest.webmanifest', '/pwa-192.png', '/logo_casafami.png'];
const POLICES = ['https://fonts.googleapis.com', 'https://fonts.gstatic.com'];

self.addEventListener('install', event => {
    event.waitUntil(caches.open(CACHE_PAGES).then(cache => cache.addAll(PRECHARGES)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', event => {
    event.waitUntil(
        caches.keys()
            .then(noms => Promise.all(noms.filter(nom => !nom.startsWith(VERSION)).map(nom => caches.delete(nom))))
            .then(() => self.clients.claim()),
    );
});

const estUnFichierDuSite = url =>
    url.origin === self.location.origin && (url.pathname.startsWith('/assets/') || /\.(png|jpe?g|svg|webp|ico|woff2?)$/i.test(url.pathname));

self.addEventListener('fetch', event => {
    const { request } = event;
    if (request.method !== 'GET') return;
    const url = new URL(request.url);

    // l'API et tout autre site (sauf les polices) passent directement par le réseau, sans cache
    if (url.pathname.startsWith('/api/') || (url.origin !== self.location.origin && !POLICES.includes(url.origin))) return;

    // navigation : réseau d'abord, puis la page gardée, puis la page « hors connexion »
    if (request.mode === 'navigate') {
        event.respondWith(
            fetch(request)
                .then(reponse => {
                    // le site est une seule page (index.html) : on garde la dernière version reçue pour l'ouvrir hors connexion
                    if (reponse.ok) { const copie = reponse.clone(); caches.open(CACHE_PAGES).then(cache => cache.put('/', copie)); }
                    return reponse;
                })
                .catch(async () => (await caches.match('/')) || caches.match(HORS_CONNEXION)),
        );
        return;
    }

    // fichiers du site et polices : cache d'abord, mise à jour en arrière-plan
    if (estUnFichierDuSite(url) || POLICES.includes(url.origin)) {
        event.respondWith(
            caches.open(CACHE_FICHIERS).then(async cache => {
                const enCache = await cache.match(request);
                const reseau = fetch(request)
                    .then(reponse => { if (reponse.ok || reponse.type === 'opaque') cache.put(request, reponse.clone()); return reponse; })
                    .catch(() => enCache);
                return enCache || reseau;
            }),
        );
    }
});
