/**
 * Convention des photos du personnel : TOUTE image choisie est convertie dans le navigateur, dès son choix et avant l'envoi,
 * en JPEG (qualité 85 %), 1600 px au plus sur le grand côté, avec un fond blanc à la place de la transparence, et remise
 * à l'endroit (orientation des photos de téléphone). Le serveur stocke déjà ses photos en JPEG : les deux côtés suivent la même règle.
 * Accepte tout ce que le navigateur sait afficher (JPEG, PNG, WebP, GIF, BMP, SVG, AVIF…) et les photos HEIC des iPhone :
 * heic-to les décode, puis on applique le recadrage, la rotation et le miroir que le fichier demande.
 */
export const CONVENTION_PHOTO = Object.freeze({ type: 'image/jpeg', extension: 'jpg', cote: 1600, qualite: 0.85, fond: '#ffffff' });

/** Phrase affichée sous chaque champ « photo » : le personnel sait d'avance ce qui va se passer. */
export const LIBELLE_CONVENTION = 'Choisissez n’importe quelle image (JPEG, PNG, HEIC d’iPhone, WebP, GIF, BMP, SVG…) : elle est convertie automatiquement en JPEG, 1600 px au plus.';

const NOMS_FORMATS = {
    'image/jpeg': 'JPEG', 'image/jpg': 'JPEG', 'image/pjpeg': 'JPEG', 'image/png': 'PNG', 'image/webp': 'WebP', 'image/gif': 'GIF',
    'image/bmp': 'BMP', 'image/svg+xml': 'SVG', 'image/avif': 'AVIF', 'image/heic': 'HEIC', 'image/heif': 'HEIF', 'image/tiff': 'TIFF',
};

// Repli seulement : une photo HEIC que la bibliothèque n'arrive pas à lire (fichier abîmé, ou format non pris en charge).
const MESSAGE_HEIC = 'Cette photo HEIC (photo d’iPhone) n’a pas pu être convertie. Enregistrez-la en JPEG, puis choisissez-la à nouveau. Pour que les prochaines photos soient des JPEG : sur iPhone, Réglages › Appareil photo › Formats › « Le plus compatible ».';

const estHeic = fichier => /hei[cf]/i.test(fichier.type || '') || /\.hei[cf]$/i.test(fichier.name || '');

/** Nom du format du fichier d'origine, pour l'afficher (PNG, WebP…). */
function formatDe(fichier) {
    if (NOMS_FORMATS[fichier.type]) return NOMS_FORMATS[fichier.type];
    const extension = /\.([^./\\]+)$/.exec(fichier.name || '')?.[1];
    return extension ? extension.toUpperCase() : 'inconnu';
}

const taille = octets => (octets >= 1048576
    ? `${(octets / 1048576).toLocaleString('fr-FR', { maximumFractionDigits: 1 })} Mo`
    : `${Math.max(1, Math.round(octets / 1024)).toLocaleString('fr-FR')} Ko`);

/**
 * Photos HEIC (iPhone) : décodées par heic-to (libheif compilé en WebAssembly). La bibliothèque n'est téléchargée qu'au moment
 * où l'on choisit une photo HEIC : le reste du site n'en est pas alourdi. Retourne null si la photo ne peut pas être décodée.
 * heic-to donne les pixels bruts : le recadrage et la rotation sont appliqués ensuite (voir transformationsHeic).
 */
async function ouvrirHeic(fichier) {
    try {
        const { heicTo } = await import('heic-to');
        const bitmap = await heicTo({ blob: fichier, type: 'bitmap' });
        return { source: bitmap, largeur: bitmap.width, hauteur: bitmap.height, liberer: () => bitmap.close() };
    } catch {
        return null;
    }
}

/**
 * Ouvre la photo dans le navigateur : heic-to pour le HEIC ; sinon createImageBitmap, puis un élément <img>
 * (SVG, et les formats que seul <img> accepte). Retourne null si le navigateur ne peut vraiment pas lire le fichier.
 */
async function ouvrir(fichier) {
    if (estHeic(fichier)) return ouvrirHeic(fichier);
    try {
        const bitmap = await createImageBitmap(fichier, { imageOrientation: 'from-image' });
        return { source: bitmap, largeur: bitmap.width, hauteur: bitmap.height, liberer: () => bitmap.close() };
    } catch { /* on essaie avec <img> ci-dessous */ }
    const url = URL.createObjectURL(fichier);
    const image = new Image();
    try {
        image.src = url;
        await image.decode();
    } catch {
        URL.revokeObjectURL(url);
        return null;
    }
    return {
        source: image,
        largeur: image.naturalWidth || 1024,   // SVG sans dimensions : carré de 1024 px par défaut
        hauteur: image.naturalHeight || 1024,
        liberer: () => URL.revokeObjectURL(url),
    };
}

/** Lit les boîtes d'un conteneur ISO BMFF (la structure des fichiers HEIC) : type, début du contenu et fin de la boîte. */
function lireBoites(vue, debut, fin) {
    const liste = [];
    let i = debut;
    while (i + 8 <= fin) {
        let taille = vue.getUint32(i);
        const type = String.fromCharCode(vue.getUint8(i + 4), vue.getUint8(i + 5), vue.getUint8(i + 6), vue.getUint8(i + 7));
        let entete = 8;
        if (taille === 1) { taille = Number(vue.getBigUint64(i + 8)); entete = 16; }
        else if (taille === 0) taille = fin - i;
        if (taille < entete || i + taille > fin) break;
        liste.push({ type, debut: i + entete, fin: i + taille });
        i += taille;
    }
    return liste;
}

/**
 * Transformations que le fichier HEIC demande pour l'image principale : recadrage (clap), rotation (irot, sens antihoraire)
 * et miroir (imir). Lues dans l'en-tête du fichier (meta → pitm, iprp → ipco / ipma). Retourne null si l'en-tête est illisible.
 */
function transformationsHeic(tampon) {
    const vue = new DataView(tampon);
    const meta = lireBoites(vue, 0, vue.byteLength).find(b => b.type === 'meta');
    if (!meta) return null;
    const racine = lireBoites(vue, meta.debut + 4, meta.fin);      // meta est une « FullBox » : 4 octets d'en-tête
    const pitm = racine.find(b => b.type === 'pitm');
    const iprp = racine.find(b => b.type === 'iprp');
    if (!pitm || !iprp) return null;
    const idPrincipal = vue.getUint8(pitm.debut) === 0 ? vue.getUint16(pitm.debut + 4) : vue.getUint32(pitm.debut + 4);
    const sous = lireBoites(vue, iprp.debut, iprp.fin);
    const ipco = sous.find(b => b.type === 'ipco');
    const ipma = sous.find(b => b.type === 'ipma');
    if (!ipco || !ipma) return null;
    const proprietes = lireBoites(vue, ipco.debut, ipco.fin);      // numérotées à partir de 1 par ipma
    const version = vue.getUint8(ipma.debut);
    const indexSur16Bits = (vue.getUint8(ipma.debut + 3) & 1) === 1;
    const nombre = vue.getUint32(ipma.debut + 4);
    let p = ipma.debut + 8;
    let associees = [];
    for (let e = 0; e < nombre; e++) {
        const id = version < 1 ? vue.getUint16(p) : vue.getUint32(p);
        p += version < 1 ? 2 : 4;
        const compte = vue.getUint8(p);
        p += 1;
        const liste = [];
        for (let k = 0; k < compte; k++) {
            if (indexSur16Bits) { liste.push(vue.getUint16(p) & 0x7fff); p += 2; }
            else { liste.push(vue.getUint8(p) & 0x7f); p += 1; }
        }
        if (id === idPrincipal) associees = liste;
    }
    const transformations = { recadrage: null, angle: 0, miroir: null };
    for (const index of associees) {
        const boite = proprietes[index - 1];
        if (!boite) continue;
        if (boite.type === 'clap') {
            // 8 entiers : largeur N/D, hauteur N/D, décalage horizontal N/D (signé), décalage vertical N/D (signé)
            const u = k => vue.getUint32(boite.debut + 4 * k);
            const s = k => vue.getInt32(boite.debut + 4 * k);
            if (u(1) && u(3) && u(5) && u(7)) {
                transformations.recadrage = { largeur: u(0) / u(1), hauteur: u(2) / u(3), decalX: s(4) / u(5), decalY: s(6) / u(7) };
            }
        } else if (boite.type === 'irot') {
            transformations.angle = (vue.getUint8(boite.debut) & 3) * 90;
        } else if (boite.type === 'imir') {
            // axe 0 : miroir autour d'un axe vertical (gauche ↔ droite) ; axe 1 : autour d'un axe horizontal (haut ↔ bas)
            transformations.miroir = (vue.getUint8(boite.debut) & 1) === 0 ? 'gauche-droite' : 'haut-bas';
        }
    }
    return transformations;
}

async function lireTransformations(fichier) {
    try { return transformationsHeic(await fichier.arrayBuffer()); }
    catch { return null; }
}

/** Enchaîne deux transformations affines [a, b, c, d, e, f] (x' = a·x + c·y + e ; y' = b·x + d·y + f) : B puis A. */
function enchainer(A, B) {
    return [
        A[0] * B[0] + A[2] * B[1],
        A[1] * B[0] + A[3] * B[1],
        A[0] * B[2] + A[2] * B[3],
        A[1] * B[2] + A[3] * B[3],
        A[0] * B[4] + A[2] * B[5] + A[4],
        A[1] * B[4] + A[3] * B[5] + A[5],
    ];
}

/**
 * Transformation à appliquer aux pixels bruts pour obtenir la photo telle qu'on la voit : recadrage, puis rotation,
 * puis miroir (ordre prévu par le format HEIC), puis mise à l'échelle.
 */
function transformationVersSortie({ cx, cy, cw, ch, angle, miroir, echelle }) {
    const pivote = angle === 90 || angle === 270;
    const rw = pivote ? ch : cw;
    const rh = pivote ? cw : ch;
    const recadre = [1, 0, 0, 1, -cx, -cy];
    const tourne = {
        0: [1, 0, 0, 1, 0, 0],
        90: [0, -1, 1, 0, 0, cw],        // antihoraire : (x, y) → (y, cw − x)
        180: [-1, 0, 0, -1, cw, ch],
        270: [0, 1, -1, 0, ch, 0],       // (x, y) → (ch − y, x)
    }[angle];
    const reflete = miroir === 'gauche-droite' ? [-1, 0, 0, 1, rw, 0]
        : miroir === 'haut-bas' ? [1, 0, 0, -1, 0, rh]
            : [1, 0, 0, 1, 0, 0];
    return enchainer([echelle, 0, 0, echelle, 0, 0], enchainer(reflete, enchainer(tourne, recadre)));
}

/**
 * Applique la convention à une photo choisie. Retourne { fichier, resume, largeur, hauteur, taille, origine }.
 * Lève une Error dont le message est lisible par le personnel si la photo ne peut pas être convertie.
 */
export async function convertirPhoto(fichier) {
    if (!fichier) throw new Error('Choisissez une photo.');
    if (fichier.size === 0) throw new Error(`« ${fichier.name} » est vide. Choisissez une autre photo.`);
    const ouverte = await ouvrir(fichier);
    if (!ouverte) {
        throw new Error(estHeic(fichier)
            ? MESSAGE_HEIC
            : `« ${fichier.name} » n’est pas une image que ce navigateur sait lire. Choisissez une photo JPEG, PNG, WebP, GIF ou BMP.`);
    }
    const { source, largeur: W, hauteur: H, liberer } = ouverte;

    // Photo HEIC : le fichier indique le recadrage, la rotation et le miroir à appliquer (heic-to ne les applique pas).
    const transfo = estHeic(fichier) ? await lireTransformations(fichier) : null;
    let cx = 0, cy = 0, cw = W, ch = H;
    if (transfo?.recadrage) {
        const r = transfo.recadrage;
        cw = Math.min(W, Math.max(1, Math.round(r.largeur)));
        ch = Math.min(H, Math.max(1, Math.round(r.hauteur)));
        // même arrondi que libheif (Box_clap::get_crop) : abscisse vers le bas, ordonnée au plus proche
        cx = Math.min(W - cw, Math.max(0, Math.floor((W - r.largeur) / 2 + r.decalX)));
        cy = Math.min(H - ch, Math.max(0, Math.round((H - r.hauteur) / 2 + r.decalY)));
    }
    const angle = transfo?.angle || 0;
    const pivote = angle === 90 || angle === 270;
    const ow = pivote ? ch : cw;           // dimensions de la photo telle qu'on la voit
    const oh = pivote ? cw : ch;
    const echelle = Math.min(1, CONVENTION_PHOTO.cote / Math.max(ow, oh));   // une petite photo n'est jamais agrandie
    const w = Math.max(1, Math.round(ow * echelle));
    const h = Math.max(1, Math.round(oh * echelle));

    const canvas = document.createElement('canvas');
    canvas.width = w;
    canvas.height = h;
    const contexte = canvas.getContext('2d');
    contexte.fillStyle = CONVENTION_PHOTO.fond;     // la transparence d'un PNG devient du blanc
    contexte.fillRect(0, 0, w, h);
    contexte.imageSmoothingQuality = 'high';
    const [a, b, c, d, e, f] = transformationVersSortie({ cx, cy, cw, ch, angle, miroir: transfo?.miroir ?? null, echelle });
    contexte.setTransform(a, b, c, d, e, f);
    contexte.drawImage(source, 0, 0, W, H);
    contexte.setTransform(1, 0, 0, 1, 0, 0);
    liberer();

    const blob = await new Promise(resolve => canvas.toBlob(resolve, CONVENTION_PHOTO.type, CONVENTION_PHOTO.qualite));
    if (!blob) throw new Error('La conversion de la photo a échoué. Essayez une autre photo.');
    const nom = `${fichier.name.replace(/\.[^./\\]+$/, '') || 'photo'}.${CONVENTION_PHOTO.extension}`;
    const converti = new File([blob], nom, { type: CONVENTION_PHOTO.type, lastModified: Date.now() });
    const origine = { format: formatDe(fichier), largeur: ow, hauteur: oh, taille: fichier.size };
    return {
        fichier: converti,
        largeur: w,
        hauteur: h,
        taille: converti.size,
        origine,
        resume: `Photo convertie : JPEG · ${w} × ${h} px · ${taille(converti.size)} (avant : ${origine.format} · ${ow} × ${oh} px · ${taille(fichier.size)}).`,
    };
}
