/**
 * Prépare une photo pour le site, dans le navigateur, avant l'envoi : redimensionnée (1600 px au plus), convertie en JPEG
 * (qualité 85 %) et remise à l'endroit (orientation des photos de téléphone). Accepte tout ce que le navigateur sait afficher :
 * JPEG, PNG, WebP, GIF, BMP, AVIF… Une photo de 8 Mo devient un fichier de quelques centaines de Ko.
 */
export const COTE_MAX = 1600;
const QUALITE = 0.85;

const nomEnJpeg = nom => `${String(nom || 'photo').replace(/\.[^./\\]+$/, '') || 'photo'}.jpg`;

function chargerImage(fichier) {
    return new Promise((resolve, reject) => {
        const url = URL.createObjectURL(fichier);
        const image = new Image();
        image.onload = () => { URL.revokeObjectURL(url); resolve(image); };
        image.onerror = () => { URL.revokeObjectURL(url); reject(new Error('illisible')); };
        image.src = url;
    });
}

async function decoder(fichier) {
    if (typeof createImageBitmap === 'function') {
        try { return await createImageBitmap(fichier, { imageOrientation: 'from-image' }); }
        catch { /* on essaie avec un élément <img> */ }
    }
    return chargerImage(fichier);
}

const kilo = octets => (octets >= 1048576 ? `${(octets / 1048576).toFixed(1)} Mo` : `${Math.max(1, Math.round(octets / 1024))} Ko`);

/** Retourne { fichier, resume } ; lève une Error au message lisible si la photo est illisible. */
export async function convertirImage(fichier) {
    if (!fichier) throw new Error('Choisissez une photo.');
    let source;
    try { source = await decoder(fichier); }
    catch { throw new Error('Cette photo ne peut pas être lue. Essayez une photo JPEG ou PNG (les formats HEIC/iPhone sont à enregistrer en JPEG).'); }

    const largeur = source.width, hauteur = source.height;
    const echelle = Math.min(1, COTE_MAX / Math.max(largeur, hauteur));
    const w = Math.max(1, Math.round(largeur * echelle)), h = Math.max(1, Math.round(hauteur * echelle));
    const canvas = document.createElement('canvas');
    canvas.width = w; canvas.height = h;
    const contexte = canvas.getContext('2d');
    contexte.fillStyle = '#ffffff';                     // la transparence d'un PNG devient du blanc
    contexte.fillRect(0, 0, w, h);
    contexte.imageSmoothingQuality = 'high';
    contexte.drawImage(source, 0, 0, w, h);
    if (typeof source.close === 'function') source.close();

    const blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/jpeg', QUALITE));
    if (!blob) throw new Error('La conversion de la photo a échoué. Essayez une autre photo.');
    const converti = new File([blob], nomEnJpeg(fichier.name), { type: 'image/jpeg', lastModified: Date.now() });
    return {
        fichier: converti,
        resume: `Photo adaptée automatiquement au site : ${w} × ${h} px, ${kilo(converti.size)} (avant : ${largeur} × ${hauteur} px, ${kilo(fichier.size)}).`,
    };
}
