import { lienSuivi, qrDataUrl } from './suivi';

const STATUTS = { EN_ATTENTE: 'En attente', CONFIRME: 'Confirmé', ANNULE: 'Annulé', TERMINE: 'Terminé' };
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
 * Reçu du rendez-vous en image PNG, téléchargé sur demande (jamais automatiquement).
 * Il porte la clé de suivi (la référence qui sert à retrouver le rendez-vous dans « Mes RDV ») et un QR code qui ouvre cette page.
 */
export async function downloadReceiptImage(rdv) {
    const largeur = 800;
    const motif = rdv.motif ? String(rdv.motif) : '';
    const mesure = document.createElement('canvas').getContext('2d');
    mesure.font = '18px Arial, sans-serif';
    const lignesMotif = motif ? lignes(mesure, motif, 450) : [];
    const hauteur = 640 + (rdv.cleSuivi ? 330 : 0) + lignesMotif.length * 24;

    const canvas = document.createElement('canvas');
    canvas.width = largeur; canvas.height = hauteur;
    const c = canvas.getContext('2d');
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
            c.fillText('Scannez ce code, ou saisissez la clé dans « Mes RDV », pour retrouver ce rendez-vous.', largeur / 2, y);
            c.textAlign = 'left'; y += 30;
        } catch { /* sans QR code, la clé écrite suffit */ }
    }
    c.fillStyle = '#64748b'; c.font = '15px Arial, sans-serif'; c.fillText('Ce document confirme l’enregistrement du rendez-vous. Veuillez le présenter au cabinet si nécessaire.', 40, Math.min(hauteur - 24, y + 20));

    const blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/png'));
    if (!blob) throw new Error('Impossible de créer l’image du reçu.');
    const url = URL.createObjectURL(blob);
    const lien = document.createElement('a');
    lien.href = url; lien.download = `casafami-recu-rdv-${rdv.id}.png`;
    document.body.appendChild(lien); lien.click(); lien.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}
