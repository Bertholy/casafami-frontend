import { lienSuivi, qrDataUrl } from './suivi';

const STATUTS = { EN_ATTENTE: 'En cours', CONFIRME: 'Confirmé', ANNULE: 'Annulé', TERMINE: 'Terminé' };
const TEAL = '#0f766e';

const chargerImage = src => new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = reject;
    image.src = src;
});

function lignes(contexte, texte, largeurMax) {
    const resultat = [];
    for (const paragraphe of String(texte).split(/\r?\n/)) {
        let courant = '';
        for (const mot of paragraphe.split(/\s+/)) {
            const essai = courant ? `${courant} ${mot}` : mot;
            if (courant && contexte.measureText(essai).width > largeurMax) { resultat.push(courant); courant = mot; } else courant = essai;
        }
        resultat.push(courant);
    }
    return resultat;
}

/**
 * Dessine le reçu du rendez-vous sur un canvas : c'est la même page pour l'image et pour le PDF, donc les deux documents sont identiques.
 * Il porte la clé de suivi (la référence qui sert à retrouver le rendez-vous dans « Mes rendez-vous ») et un QR code qui ouvre cette page.
 * `facteur` agrandit le dessin (2 pour le PDF, afin qu'il reste net à l'impression).
 */
async function dessinerRecu(rdv, facteur = 1) {
    const largeur = 800;
    const motif = rdv.motif ? String(rdv.motif) : '';
    const mesure = document.createElement('canvas').getContext('2d');
    mesure.font = '18px Arial, sans-serif';
    const lignesMotif = motif ? lignes(mesure, motif, 450) : [];
    const hauteur = 640 + (rdv.cleSuivi ? 330 : 0) + lignesMotif.length * 24;

    const canvas = document.createElement('canvas');
    canvas.width = largeur * facteur; canvas.height = hauteur * facteur;
    const c = canvas.getContext('2d');
    c.scale(facteur, facteur);
    c.fillStyle = '#ffffff'; c.fillRect(0, 0, largeur, hauteur);
    c.textBaseline = 'alphabetic';

    try { c.drawImage(await chargerImage('/logo_casafami.png'), 40, 36, 80, 80); } catch { /* le logo est facultatif */ }
    c.fillStyle = '#1f2937'; c.font = 'bold 34px Arial, sans-serif'; c.fillText('Casafami', 140, 76);
    c.fillStyle = '#475569'; c.font = '18px Arial, sans-serif'; c.fillText('Cabinet médical', 140, 106);
    c.fillStyle = TEAL; c.fillRect(40, 134, largeur - 80, 4);
    c.font = 'bold 28px Arial, sans-serif'; c.textAlign = 'center'; c.fillText('REÇU DE RENDEZ-VOUS', largeur / 2, 194);
    c.textAlign = 'left';

    let y = 224;
    if (rdv.cleSuivi) {
        c.fillStyle = '#ecfdf5'; c.fillRect(40, y, largeur - 80, 110);
        c.strokeStyle = TEAL; c.lineWidth = 2; c.strokeRect(40, y, largeur - 80, 110);
        c.fillStyle = '#475569'; c.font = '17px Arial, sans-serif'; c.fillText('Clé de suivi (référence)', 60, y + 32);
        c.fillStyle = TEAL; c.font = 'bold 44px Consolas, "Courier New", monospace'; c.fillText(rdv.cleSuivi, 60, y + 80);
        y += 140;
    }

    const date = String(rdv.dateRdv || '').split('-').reverse().join('/');
    const ligne = (libelle, valeur) => {
        c.fillStyle = '#64748b'; c.font = '18px Arial, sans-serif'; c.fillText(libelle, 50, y);
        c.fillStyle = '#1f2937'; c.font = 'bold 19px Arial, sans-serif'; c.textAlign = 'right'; c.fillText(String(valeur ?? ''), largeur - 50, y); c.textAlign = 'left';
        c.fillStyle = '#d1d5db'; c.fillRect(40, y + 14, largeur - 80, 1);
        y += 48;
    };
    ligne('Numéro du rendez-vous', rdv.id);
    ligne('Client', rdv.nomClient);
    ligne('Téléphone', rdv.telephoneClient);
    ligne('Rendez-vous', `${date} à ${String(rdv.heureRdv || '').slice(0, 5)}`);
    ligne('Statut', STATUTS[rdv.statut] || rdv.statut);
    if (lignesMotif.length) {
        c.fillStyle = '#64748b'; c.font = '18px Arial, sans-serif'; c.fillText('Motif', 50, y);
        c.fillStyle = '#1f2937'; c.font = 'bold 18px Arial, sans-serif'; c.textAlign = 'right';
        lignesMotif.forEach((texte, index) => c.fillText(texte, largeur - 50, y + index * 24));
        c.textAlign = 'left'; y += lignesMotif.length * 24 + 24;
    }

    if (rdv.cleSuivi) {
        try {
            const qr = await chargerImage(await qrDataUrl(lienSuivi(rdv.cleSuivi), 440));
            c.drawImage(qr, (largeur - 220) / 2, y + 6, 220, 220);
            y += 252;
            c.fillStyle = '#475569'; c.font = '16px Arial, sans-serif'; c.textAlign = 'center';
            c.fillText('Scannez ce code, ou saisissez la clé dans « Mes rendez-vous », pour retrouver ce rendez-vous.', largeur / 2, y);
            c.textAlign = 'left'; y += 30;
        } catch { /* sans QR code, la clé écrite suffit */ }
    }
    c.fillStyle = '#64748b'; c.font = '15px Arial, sans-serif'; c.fillText('Ce document confirme l’enregistrement du rendez-vous. Veuillez le présenter au cabinet si nécessaire.', 40, Math.min(hauteur - 24, y + 20));

    return { canvas, largeur, hauteur };
}

function telecharger(blob, nom) {
    const url = URL.createObjectURL(blob);
    const lien = document.createElement('a');
    lien.href = url; lien.download = nom;
    document.body.appendChild(lien); lien.click(); lien.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}

const versBlob = (canvas, type, qualite) => new Promise(resolve => canvas.toBlob(resolve, type, qualite));

/** Reçu du rendez-vous en image PNG, téléchargé sur demande (jamais automatiquement). */
export async function downloadReceiptImage(rdv) {
    const { canvas } = await dessinerRecu(rdv);
    const blob = await versBlob(canvas, 'image/png');
    if (!blob) throw new Error('Impossible de créer l’image du reçu.');
    telecharger(blob, `casafami-recu-rdv-${rdv.id}.png`);
}

/**
 * Une page A4 qui ne contient que l'image du reçu : le PDF est ainsi exactement le même document que l'image téléchargée.
 * Le PDF est écrit à la main (une image JPEG dans une page), sans bibliothèque supplémentaire.
 */
function pdfAvecImage(jpeg, largeurPx, hauteurPx) {
    const PAGE_L = 595.28, PAGE_H = 841.89, MARGE = 28;   // A4 en points
    const echelle = Math.min((PAGE_L - 2 * MARGE) / largeurPx, (PAGE_H - 2 * MARGE) / hauteurPx);
    const w = largeurPx * echelle, h = hauteurPx * echelle;
    const x = (PAGE_L - w) / 2, y = PAGE_H - MARGE - h;
    const encodeur = new TextEncoder();
    const morceaux = [];
    const offsets = [];
    let longueur = 0;
    const ajouter = donnees => { const octets = typeof donnees === 'string' ? encodeur.encode(donnees) : donnees; morceaux.push(octets); longueur += octets.length; };
    const objet = (numero, corps) => { offsets[numero] = longueur; ajouter(`${numero} 0 obj\n${corps}\nendobj\n`); };

    ajouter(new Uint8Array([0x25, 0x50, 0x44, 0x46, 0x2d, 0x31, 0x2e, 0x34, 0x0a, 0x25, 0xe2, 0xe3, 0xcf, 0xd3, 0x0a])); // « %PDF-1.4 » puis le marqueur binaire
    objet(1, '<< /Type /Catalog /Pages 2 0 R >>');
    objet(2, '<< /Type /Pages /Kids [3 0 R] /Count 1 >>');
    objet(3, `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${PAGE_L} ${PAGE_H}] /Resources << /XObject << /Im0 4 0 R >> >> /Contents 5 0 R >>`);
    offsets[4] = longueur;
    ajouter(`4 0 obj\n<< /Type /XObject /Subtype /Image /Width ${largeurPx} /Height ${hauteurPx} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${jpeg.length} >>\nstream\n`);
    ajouter(jpeg);
    ajouter('\nendstream\nendobj\n');
    const dessin = `q ${w.toFixed(2)} 0 0 ${h.toFixed(2)} ${x.toFixed(2)} ${y.toFixed(2)} cm /Im0 Do Q`;
    objet(5, `<< /Length ${dessin.length} >>\nstream\n${dessin}\nendstream`);

    const debutXref = longueur;
    let xref = 'xref\n0 6\n0000000000 65535 f \n';
    for (let n = 1; n <= 5; n++) xref += `${String(offsets[n]).padStart(10, '0')} 00000 n \n`;
    ajouter(`${xref}trailer\n<< /Size 6 /Root 1 0 R >>\nstartxref\n${debutXref}\n%%EOF\n`);

    const resultat = new Uint8Array(longueur);
    let position = 0;
    for (const m of morceaux) { resultat.set(m, position); position += m.length; }
    return new Blob([resultat], { type: 'application/pdf' });
}

/** Reçu du rendez-vous en PDF : le même dessin que l'image, sur une page A4. */
export async function downloadReceiptPdf(rdv) {
    const { canvas } = await dessinerRecu(rdv, 2);
    const blob = await versBlob(canvas, 'image/jpeg', 0.92);
    if (!blob) throw new Error('Impossible de créer le PDF du reçu.');
    const jpeg = new Uint8Array(await blob.arrayBuffer());
    telecharger(pdfAvecImage(jpeg, canvas.width, canvas.height), `casafami-recu-rdv-${rdv.id}.pdf`);
}
