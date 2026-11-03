// Image « ticket de papier » des documents du cabinet : c'est la présentation de tous les téléchargements en IMAGE (PNG) et des partages
// (reçu de rendez-vous, facture proforma), la même que celle affichée à l'écran par components/TicketPapier.jsx : papier blanc aux bords dentelés,
// coche verte, titre, référence, champs empilés (libellé gris, valeur en gras), montant total en grand. Les PDF gardent la page A4 (enteteCabinet.js).

const ENCRE = '#111827', GRIS = '#6b7280', FILET = '#e5e7eb', VERT = '#10b981', FOND = '#e9eef2';
const LARGEUR = 420, MARGE = 28, PADDING = 26;

const chargerImage = src => new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = reject;
    image.src = src;
});

/** Coupe un texte en lignes qui tiennent dans la largeur donnée (la police du contexte doit déjà être réglée). */
function couper(c, texte, largeurMax) {
    const resultat = [];
    for (const paragraphe of String(texte ?? '').split(/\r?\n/)) {
        let courant = '';
        for (const mot of paragraphe.split(/\s+/)) {
            const essai = courant ? `${courant} ${mot}` : mot;
            if (courant && c.measureText(essai).width > largeurMax) { resultat.push(courant); courant = mot; } else courant = essai;
        }
        resultat.push(courant);
    }
    return resultat;
}

/**
 * Dessine le ticket (le dessin est calculé une première fois pour connaître la hauteur, puis tracé).
 * contenu : { titre, reference, signe: 'coche' | 'croix', couleurSigne, lignes: [{ libelle, valeur, detail?, mono?, gras?, couleur? }],
 *             total?: { libelle, valeur, detail? }, qr?: { src, legende }, pied?, cabinet? }
 * facteur : finesse de l'image (3 → 1260 px de large, nette sur un téléphone).
 */
export async function dessinerTicket(contenu, facteur = 3) {
    const qrImage = contenu.qr ? await chargerImage(contenu.qr.src).catch(() => null) : null;
    const mesure = document.createElement('canvas').getContext('2d');
    const hauteurPapier = placer(mesure, contenu, qrImage, false);
    const hauteur = hauteurPapier + 2 * MARGE;

    const canvas = document.createElement('canvas');
    canvas.width = LARGEUR * facteur; canvas.height = hauteur * facteur;
    const c = canvas.getContext('2d');
    c.scale(facteur, facteur);
    c.textBaseline = 'alphabetic';

    // fond gris, papier blanc avec une ombre douce, puis les dents du haut et du bas
    c.fillStyle = FOND; c.fillRect(0, 0, LARGEUR, hauteur);
    const haut = MARGE, bas = MARGE + hauteurPapier;
    c.save();
    c.shadowColor = 'rgba(15, 23, 42, .18)'; c.shadowBlur = 18; c.shadowOffsetY = 5;
    c.fillStyle = '#ffffff'; c.fillRect(MARGE, haut, LARGEUR - 2 * MARGE, hauteurPapier);
    c.restore();
    c.fillStyle = FOND;
    for (let x = MARGE + 8; x < LARGEUR - MARGE; x += 17) {
        c.beginPath(); c.arc(x, haut, 6, 0, Math.PI * 2); c.fill();
        c.beginPath(); c.arc(x, bas, 6, 0, Math.PI * 2); c.fill();
    }
    placer(c, contenu, qrImage, true);
    return { canvas };
}

/** Place chaque élément ; avec « tracer » faux, ne dessine rien et retourne seulement la hauteur du papier. */
function placer(c, contenu, qrImage, tracer) {
    const gauche = MARGE + PADDING, droite = LARGEUR - MARGE - PADDING, largeurTexte = droite - gauche;
    const texte = (valeur, x, y, police, couleur, alignement = 'left') => {
        if (!tracer) return;
        c.font = police; c.fillStyle = couleur; c.textAlign = alignement; c.fillText(valeur, x, y);
    };
    const filet = y => { if (tracer) { c.fillStyle = FILET; c.fillRect(gauche - 4, y, largeurTexte + 8, 1); } };

    let y = MARGE + 36;
    // coche (ou croix) dans un rond plein
    const cx = LARGEUR / 2, cy = y + 30;
    if (tracer) {
        c.fillStyle = contenu.couleurSigne || VERT; c.beginPath(); c.arc(cx, cy, 31, 0, Math.PI * 2); c.fill();
        c.strokeStyle = '#ffffff'; c.lineWidth = 5; c.lineCap = 'round'; c.lineJoin = 'round'; c.beginPath();
        if (contenu.signe === 'croix') { c.moveTo(cx - 10, cy - 10); c.lineTo(cx + 10, cy + 10); c.moveTo(cx + 10, cy - 10); c.lineTo(cx - 10, cy + 10); }
        else { c.moveTo(cx - 13, cy + 1); c.lineTo(cx - 4, cy + 10); c.lineTo(cx + 14, cy - 9); }
        c.stroke();
    }
    y += 60 + 30;

    c.font = 'bold 20px Arial, sans-serif';
    for (const ligne of couper(c, contenu.titre, largeurTexte)) { texte(ligne, gauche, y, 'bold 20px Arial, sans-serif', ENCRE); y += 26; }
    c.font = '13px Arial, sans-serif';
    for (const ligne of couper(c, contenu.reference || '', largeurTexte)) { texte(ligne, gauche, y + 4, '13px Arial, sans-serif', GRIS); y += 18; }
    y += 14; filet(y); y += 24;

    for (const champ of contenu.lignes) {
        texte(champ.libelle, gauche, y, '13px Arial, sans-serif', GRIS); y += 21;
        const police = champ.mono ? 'bold 19px Consolas, "Courier New", monospace' : `${champ.gras === false ? '' : 'bold '}17px Arial, sans-serif`;
        c.font = police;
        for (const ligne of couper(c, champ.valeur, largeurTexte)) { texte(ligne, gauche, y, police, champ.couleur || ENCRE); y += 23; }
        if (champ.detail) {
            c.font = '13px Arial, sans-serif';
            for (const ligne of couper(c, champ.detail, largeurTexte)) { texte(ligne, gauche, y, '13px Arial, sans-serif', GRIS); y += 18; }
        }
        y += 14;
    }

    if (contenu.total) {
        filet(y); y += 26;
        texte(contenu.total.libelle, gauche, y, '13px Arial, sans-serif', GRIS); y += 34;
        texte(contenu.total.valeur, gauche, y, 'bold 31px Arial, sans-serif', ENCRE); y += 8;
        if (contenu.total.detail) {
            c.font = '13px Arial, sans-serif';
            for (const ligne of couper(c, contenu.total.detail, largeurTexte)) { y += 18; texte(ligne, gauche, y, '13px Arial, sans-serif', GRIS); }
        }
        y += 18; filet(y); y += 22;
    }

    if (qrImage) {
        y += 6;
        if (tracer) c.drawImage(qrImage, (LARGEUR - 150) / 2, y, 150, 150);
        y += 150 + 20;
        if (contenu.qr.legende) { texte(contenu.qr.legende, LARGEUR / 2, y, '12px Arial, sans-serif', GRIS, 'center'); y += 24; }
    }

    if (contenu.pied) {
        c.font = '12px Arial, sans-serif';
        for (const ligne of couper(c, contenu.pied, largeurTexte)) { y += 17; texte(ligne, gauche, y, '12px Arial, sans-serif', GRIS); }
        y += 14;
    }
    if (contenu.cabinet) {
        y += 14;
        c.font = 'bold 12px Arial, sans-serif';
        texte(contenu.cabinet, LARGEUR / 2, y, 'bold 12px Arial, sans-serif', GRIS, 'center'); y += 8;
    }
    return y + 30 - MARGE;
}
