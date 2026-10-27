import { lienSuivi, qrDataUrl } from './suivi';

const STATUTS = { EN_ATTENTE: 'En cours', CONFIRME: 'Confirmé', ANNULE: 'Annulé', TERMINE: 'Terminé' };

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
 * Présentation en « ticket » : bords dentelés en haut et en bas, logo, grand pictogramme d'état, puis les informations
 * en lignes « libellé / valeur ». Il porte la clé de suivi (pour retrouver le rendez-vous dans « Mes rendez-vous ») et un QR code.
 * `facteur` agrandit le dessin (2 pour le PDF, afin qu'il reste net à l'impression).
 */
async function dessinerRecu(rdv, facteur = 1) {
    const largeur = 640, marge = 40;                     // marge = fond gris autour du ticket
    const x0 = marge, x1 = largeur - marge;              // bords du ticket
    const gauche = x0 + 44, droite = x1 - 44;            // colonne du texte
    const FOND = '#e9eef2', ENCRE = '#111827', GRIS = '#6b7280', FILET = '#e5e7eb';
    const ETATS = {
        EN_ATTENTE: { titre: 'Rendez-vous enregistré', couleur: '#0a8fc7', signe: 'coche' },
        CONFIRME: { titre: 'Rendez-vous confirmé', couleur: '#16a34a', signe: 'coche' },
        TERMINE: { titre: 'Consultation terminée', couleur: '#16a34a', signe: 'coche' },
        ANNULE: { titre: 'Rendez-vous annulé', couleur: '#dc2626', signe: 'croix' },
    };
    const etat = ETATS[rdv.statut] || ETATS.EN_ATTENTE;

    // ---- mise en page : la liste des lignes à écrire, pour connaître la hauteur avant de dessiner ----
    const mesure = document.createElement('canvas').getContext('2d');
    const jour = rdv.dateRdv ? new Date(`${rdv.dateRdv}T12:00:00`) : null;
    const dateLongue = jour && !Number.isNaN(jour.getTime())
        ? jour.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }).replace(/^./, c => c.toUpperCase())
        : String(rdv.dateRdv || '');
    mesure.font = 'bold 21px Arial, sans-serif';
    const lignesMotif = rdv.motif ? lignes(mesure, String(rdv.motif).replace(/^⚠[^\n]*\n?/, '').trim(), droite - gauche).slice(0, 6) : [];
    const blocs = [
        { libelle: 'Patiente', valeurs: [rdv.nomClient, rdv.telephoneClient].filter(Boolean) },
        { libelle: 'Rendez-vous', valeurs: [dateLongue, `à ${String(rdv.heureRdv || '').slice(0, 5)}`] },
        ...(rdv.serviceNom ? [{ libelle: 'Service', valeurs: [rdv.serviceNom] }] : []),
        { libelle: 'Avec', valeurs: [rdv.praticienNom || 'À préciser par le cabinet'] },
        { libelle: 'Statut', valeurs: [STATUTS[rdv.statut] || rdv.statut] },
        ...(lignesMotif.length ? [{ libelle: 'Motif', valeurs: lignesMotif, petit: true }] : []),
        { libelle: 'Numéro du rendez-vous', valeurs: [String(rdv.id)] },
    ];
    const hauteurBloc = b => 30 + b.valeurs.length * (b.petit ? 26 : 30) + 22;
    const hauteurTicket = 70 + 64 + 30 + 100 + 30 + 42 + 30            // logo, pictogramme, titre, date d'émission, filet
        + (rdv.cleSuivi ? 120 : 0)                                    // clé de suivi
        + blocs.reduce((total, b) => total + hauteurBloc(b), 0)
        + (rdv.cleSuivi ? 30 + 240 + 50 : 0)                           // filet, QR code et sa légende
        + 60;                                                         // note de bas
    const hauteur = hauteurTicket + marge * 2;

    const canvas = document.createElement('canvas');
    canvas.width = largeur * facteur; canvas.height = hauteur * facteur;
    const c = canvas.getContext('2d');
    c.scale(facteur, facteur);
    c.textBaseline = 'alphabetic';

    // ---- fond gris et ticket blanc à bords dentelés ----
    c.fillStyle = FOND; c.fillRect(0, 0, largeur, hauteur);
    const haut = marge, bas = marge + hauteurTicket;
    c.save();
    c.shadowColor = 'rgba(15, 23, 42, .12)'; c.shadowBlur = 18; c.shadowOffsetY = 4;
    c.fillStyle = '#ffffff'; c.fillRect(x0, haut, x1 - x0, hauteurTicket);
    c.restore();
    const degrade = c.createLinearGradient(0, haut, 0, haut + 120);   // léger voile gris en haut, comme un ticket imprimé
    degrade.addColorStop(0, '#eef1f4'); degrade.addColorStop(1, '#ffffff');
    c.fillStyle = degrade; c.fillRect(x0, haut, x1 - x0, 120);
    c.fillStyle = FOND;
    const rayon = 7, pas = 22;
    for (let x = x0 + pas / 2; x < x1; x += pas) {
        c.beginPath(); c.arc(x, haut, rayon, 0, Math.PI * 2); c.fill();
        c.beginPath(); c.arc(x, bas, rayon, 0, Math.PI * 2); c.fill();
    }

    let y = haut + 40;
    // ---- logo ----
    try {
        const logo = await chargerImage('/logo_casafami.png');
        const h = 60, w = Math.round(logo.width * h / logo.height);
        c.drawImage(logo, (largeur - w) / 2, y, w, h);
    } catch { /* le logo est facultatif */ }
    y += 70;

    // ---- pictogramme d'état : rond plein et coche (ou croix) blanche ----
    const cx = largeur / 2, cy = y + 32;
    c.fillStyle = etat.couleur; c.beginPath(); c.arc(cx, cy, 32, 0, Math.PI * 2); c.fill();
    c.strokeStyle = '#ffffff'; c.lineWidth = 6; c.lineCap = 'round'; c.lineJoin = 'round'; c.beginPath();
    if (etat.signe === 'coche') { c.moveTo(cx - 14, cy + 1); c.lineTo(cx - 4, cy + 11); c.lineTo(cx + 15, cy - 10); }
    else { c.moveTo(cx - 11, cy - 11); c.lineTo(cx + 11, cy + 11); c.moveTo(cx + 11, cy - 11); c.lineTo(cx - 11, cy + 11); }
    c.stroke();
    y += 64 + 30;

    // ---- titre et date d'émission ----
    c.textAlign = 'left';
    c.fillStyle = ENCRE; c.font = 'bold 26px Arial, sans-serif'; c.fillText(etat.titre, gauche, y + 10);
    const emis = new Date();
    c.fillStyle = GRIS; c.font = '17px Arial, sans-serif';
    c.fillText(`Reçu émis le ${emis.toLocaleDateString('fr-FR')} à ${emis.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}`, gauche, y + 40);
    y += 70;
    const filet = () => { c.fillStyle = FILET; c.fillRect(gauche - 14, y, droite - gauche + 28, 1.5); };
    filet(); y += 30;

    // ---- clé de suivi, bien visible ----
    if (rdv.cleSuivi) {
        c.fillStyle = '#ecfeff'; c.fillRect(gauche - 4, y, droite - gauche + 8, 96);
        c.fillStyle = GRIS; c.font = '16px Arial, sans-serif'; c.fillText('Clé de suivi (à garder)', gauche + 14, y + 30);
        c.fillStyle = '#0e7490'; c.font = 'bold 40px Consolas, "Courier New", monospace'; c.fillText(rdv.cleSuivi, gauche + 14, y + 76);
        y += 120;
    }

    // ---- lignes « libellé / valeur » ----
    for (const b of blocs) {
        c.fillStyle = GRIS; c.font = '17px Arial, sans-serif'; c.fillText(b.libelle, gauche, y + 18);
        y += 30;
        b.valeurs.forEach((valeur, i) => {
            c.fillStyle = ENCRE;
            c.font = b.petit ? '19px Arial, sans-serif' : (i === 0 ? 'bold 22px Arial, sans-serif' : 'bold 19px Arial, sans-serif');
            c.fillText(String(valeur ?? ''), gauche, y + 20);
            y += b.petit ? 26 : 30;
        });
        y += 22;
    }

    // ---- QR code ----
    if (rdv.cleSuivi) {
        filet(); y += 30;
        try {
            const qr = await chargerImage(await qrDataUrl(lienSuivi(rdv.cleSuivi), 440));
            c.drawImage(qr, (largeur - 210) / 2, y, 210, 210);
        } catch { /* sans QR code, la clé écrite suffit */ }
        y += 240;
        c.textAlign = 'center'; c.fillStyle = GRIS; c.font = '16px Arial, sans-serif';
        c.fillText('Scannez ce code pour retrouver votre rendez-vous.', largeur / 2, y);
        y += 50;
    }

    // ---- note de bas ----
    c.textAlign = 'center'; c.fillStyle = GRIS; c.font = '14px Arial, sans-serif';
    c.fillText('Cabinet d’accouchement Sainte Famille · Andongona, Antsohihy', largeur / 2, y + 10);
    c.fillText('Présentez ce reçu à l’accueil du cabinet si nécessaire.', largeur / 2, y + 32);
    c.textAlign = 'left';
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

/** Le téléphone sait-il partager une image (WhatsApp, Messenger, e-mail…) ? */
export const partageDisponible = () => {
    try { return Boolean(navigator.canShare?.({ files: [new File([''], 'recu.png', { type: 'image/png' })] })); }
    catch { return false; }
};

/** Partage le reçu en image avec les applications du téléphone (même dessin que le téléchargement). */
export async function shareReceiptImage(rdv) {
    const { canvas } = await dessinerRecu(rdv);
    const blob = await versBlob(canvas, 'image/png');
    if (!blob) throw new Error('Impossible de créer l’image du reçu.');
    const fichier = new File([blob], `casafami-recu-rdv-${rdv.id}.png`, { type: 'image/png' });
    try {
        await navigator.share({ files: [fichier], title: 'Reçu de rendez-vous CASAFAMI', text: rdv.cleSuivi ? `Ma clé de suivi : ${rdv.cleSuivi}` : undefined });
    } catch (erreur) {
        if (erreur?.name !== 'AbortError') throw new Error('Le partage a échoué. Téléchargez le reçu à la place.', { cause: erreur });
    }
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
