// Mise en page commune des documents PDF / image du cabinet (facture proforma, reçu de rendez-vous) : un seul en-tête et un seul pied de page,
// pour que tous les documents aient le même aspect. Le serveur dessine le même en-tête dans ses PDF (RendezVousPdfService, RendezVousListePdfService).

export const COULEURS = { ENCRE: '#111827', GRIS: '#6b7280', FILET: '#d1d5db', ACCENT: '#0e7490', FOND_ENTETE: '#ecfeff' };

/** Coordonnées du cabinet quand le contenu du site n'est pas disponible (le site les modifie dans l'éditeur : accueil.adresse.*, accueil.tel.*). */
export const CABINET = {
    nom: 'CASAFAMI',
    sousTitre: 'Cabinet d’accouchement Sainte Famille',
    adresse: ['Chez Rasazy VERO', 'Andongona - ANTSOHIHY', 'Madagascar'],
    telephones: ['034 06 759 28', '032 43 035 07'],
};

const chargerLogo = src => new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = reject;
    image.src = src;
});

/**
 * Bandeau du haut (150 px de haut, puis un filet de 4 px) : logo et coordonnées du cabinet à gauche, titre du document, numéro et lignes d'information à droite.
 * `lignes` : jusqu'à deux lignes grises sous le numéro ; chacune est un texte ou { texte, couleur, gras }.
 */
export async function dessinerEntete(c, largeur, marge, cabinet, { titre, numero, lignes = [] }) {
    const { ENCRE, GRIS, ACCENT, FOND_ENTETE } = COULEURS;
    c.fillStyle = FOND_ENTETE; c.fillRect(0, 0, largeur, 150);
    c.fillStyle = ACCENT; c.fillRect(0, 150, largeur, 4);
    try {
        const logo = await chargerLogo('/logo_casafami.png');
        const h = 84, w = Math.round(logo.width * h / logo.height);
        c.drawImage(logo, marge, 34, w, h);
    } catch { /* le logo est facultatif */ }
    c.textAlign = 'left';
    c.fillStyle = ENCRE; c.font = 'bold 24px Arial, sans-serif'; c.fillText(cabinet.nom, marge + 130, 54);
    c.fillStyle = GRIS; c.font = '13px Arial, sans-serif';
    c.fillText(cabinet.sousTitre, marge + 130, 74);
    cabinet.adresse.forEach((ligne, i) => c.fillText(ligne, marge + 130, 94 + i * 17));
    c.fillText(`Tél. ${cabinet.telephones.join(' / ')}`, marge + 130, 94 + cabinet.adresse.length * 17);
    c.textAlign = 'right';
    // le titre prend 27 px, et rétrécit si besoin pour ne jamais passer sur les coordonnées du cabinet
    c.font = '13px Arial, sans-serif';
    const limite = marge + 130 + Math.max(...[cabinet.sousTitre, ...cabinet.adresse, `Tél. ${cabinet.telephones.join(' / ')}`].map(ligne => c.measureText(ligne).width)) + 24;
    let taille = 27;
    for (; taille > 16; taille -= 1) { c.font = `bold ${taille}px Arial, sans-serif`; if (largeur - marge - c.measureText(titre).width >= limite) break; }
    c.fillStyle = ACCENT; c.font = `bold ${taille}px Arial, sans-serif`; c.fillText(titre, largeur - marge, 62);
    c.fillStyle = ENCRE; c.font = 'bold 17px Arial, sans-serif'; c.fillText(`N° ${numero}`, largeur - marge, 94);
    lignes.slice(0, 2).forEach((ligne, i) => {
        const { texte, couleur, gras } = typeof ligne === 'string' ? { texte: ligne } : ligne;
        c.fillStyle = couleur || GRIS; c.font = `${gras ? 'bold ' : ''}14px Arial, sans-serif`;
        c.fillText(texte, largeur - marge, 116 + i * 20);
    });
    c.textAlign = 'left';
}

/** Ligne du bas de page, centrée : nom, sous-titre et adresse du cabinet. */
export function dessinerPied(c, largeur, hauteur, cabinet) {
    c.textAlign = 'center'; c.fillStyle = COULEURS.GRIS; c.font = '13px Arial, sans-serif';
    c.fillText(`${cabinet.nom} · ${cabinet.sousTitre} · ${cabinet.adresse.join(', ')}`, largeur / 2, hauteur - 40);
    c.textAlign = 'left';
}
