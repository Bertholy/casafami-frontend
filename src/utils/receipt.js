import { lienSuivi, qrDataUrl } from './suivi';
import { CABINET, COULEURS, dessinerEntete, dessinerPied } from './enteteCabinet';
import { dessinerTicket } from './ticketImage';

/** Tous les services du rendez-vous (le principal d'abord). */
const servicesDe = rdv => (rdv.servicesNoms?.length ? rdv.servicesNoms : (rdv.serviceNom ? [rdv.serviceNom] : []));

const STATUTS = { EN_ATTENTE: 'En cours', CONFIRME: 'Confirmé', ANNULE: 'Annulé', TERMINE: 'Terminé' };
const ETATS = {
    EN_ATTENTE: { titre: 'Rendez-vous enregistré', couleur: '#0a8fc7' },
    CONFIRME: { titre: 'Rendez-vous confirmé', couleur: '#16a34a' },
    TERMINE: { titre: 'Consultation terminée', couleur: '#16a34a' },
    ANNULE: { titre: 'Rendez-vous annulé', couleur: '#dc2626' },
};

export const chargerImage = src => new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = reject;
    image.src = src;
});

export function lignes(contexte, texte, largeurMax) {
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
 * Dessine la page A4 du reçu du rendez-vous, utilisée par le PDF (l'image téléchargée ou partagée est un « ticket », voir utils/ticketImage.js).
 * Même mise en page que la facture proforma (utils/proforma.js) : bandeau du cabinet, bloc patient et bloc rendez-vous, tableau des informations,
 * puis la clé de suivi (pour retrouver le rendez-vous dans « Mes rendez-vous ») avec son QR code. Format A4, 794 px de large.
 * `facteur` agrandit le dessin (2 pour le PDF, afin qu'il reste net à l'impression).
 */
async function dessinerRecu(rdv, facteur = 1) {
    const largeur = 794, marge = 56;
    const { ENCRE, GRIS, FILET, ACCENT, FOND_ENTETE } = COULEURS;
    const etat = ETATS[rdv.statut] || ETATS.EN_ATTENTE;
    const annee = String(rdv.dateRdv || '').slice(0, 4) || String(new Date().getFullYear());
    const numero = `RV-${annee}-${String(rdv.id ?? 0).padStart(5, '0')}`;
    const emis = new Date();

    const mesure = document.createElement('canvas').getContext('2d');
    const jour = rdv.dateRdv ? new Date(`${rdv.dateRdv}T12:00:00`) : null;
    const dateLongue = jour && !Number.isNaN(jour.getTime())
        ? jour.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }).replace(/^./, c => c.toUpperCase())
        : String(rdv.dateRdv || '');
    const heure = String(rdv.heureRdv || '').slice(0, 5);
    const colonneDetail = marge + 230;
    mesure.font = '16px Arial, sans-serif';
    const lignesMotif = rdv.motif ? lignes(mesure, String(rdv.motif).replace(/^⚠[^\n]*\n?/, '').trim(), largeur - marge - 10 - colonneDetail).slice(0, 6) : [];
    const nomPatient = [rdv.civilite, rdv.nomClient].filter(Boolean).join(' ');
    const infos = [
        ...(servicesDe(rdv).length ? [{ libelle: servicesDe(rdv).length > 1 ? 'Services' : 'Service', valeurs: [servicesDe(rdv).join(', ')] }] : []),
        { libelle: 'Date du rendez-vous', valeurs: [dateLongue] },
        { libelle: 'Heure', valeurs: [heure] },
        { libelle: 'Reçu par', valeurs: [rdv.praticienNom || 'À préciser par le cabinet'] },
        { libelle: 'Statut', valeurs: [STATUTS[rdv.statut] || rdv.statut || ''], couleur: etat.couleur, gras: true },
        ...(lignesMotif.length ? [{ libelle: 'Motif', valeurs: lignesMotif }] : []),
    ];
    const hauteurInfo = i => i.valeurs.length * 22 + 22;
    const hauteurTableau = infos.reduce((s, i) => s + hauteurInfo(i), 0);
    const hauteurCle = rdv.cleSuivi ? 214 : 0;
    const hauteur = Math.max(1123, 154 + 46 + 100 + 34 + hauteurTableau + 44 + hauteurCle + (rdv.cleSuivi ? 44 : 0) + 110 + 60);

    const canvas = document.createElement('canvas');
    canvas.width = largeur * facteur; canvas.height = hauteur * facteur;
    const c = canvas.getContext('2d');
    c.scale(facteur, facteur);
    c.textBaseline = 'alphabetic';
    c.fillStyle = '#ffffff'; c.fillRect(0, 0, largeur, hauteur);

    // ---- bandeau du cabinet ----
    await dessinerEntete(c, largeur, marge, CABINET, {
        titre: 'REÇU DE RENDEZ-VOUS', numero,
        lignes: [`Émis le ${emis.toLocaleDateString('fr-FR')} à ${emis.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}`, { texte: etat.titre, couleur: etat.couleur, gras: true }],
    });

    // ---- patient et rendez-vous ----
    let y = 200;
    c.textAlign = 'left';
    c.fillStyle = GRIS; c.font = 'bold 13px Arial, sans-serif'; c.fillText('PATIENT', marge, y);
    c.fillStyle = ENCRE; c.font = 'bold 20px Arial, sans-serif'; c.fillText(nomPatient, marge, y + 28);
    c.fillStyle = GRIS; c.font = '15px Arial, sans-serif';
    let yg = y + 50;
    for (const ligne of [rdv.telephoneClient && `Tél. ${rdv.telephoneClient}`, rdv.ageClient != null && rdv.ageClient !== '' && `${rdv.ageClient} an${Number(rdv.ageClient) > 1 ? 's' : ''}`].filter(Boolean)) { c.fillText(ligne, marge, yg); yg += 20; }
    c.fillStyle = GRIS; c.font = 'bold 13px Arial, sans-serif'; c.fillText('RENDEZ-VOUS', largeur / 2 + 20, y);
    c.fillStyle = ENCRE; c.font = 'bold 18px Arial, sans-serif'; c.fillText(dateLongue, largeur / 2 + 20, y + 28);
    c.fillStyle = GRIS; c.font = '15px Arial, sans-serif'; c.fillText(`à ${heure}`, largeur / 2 + 20, y + 50);
    y = Math.max(yg, y + 70) + 24;

    // ---- tableau des informations ----
    c.fillStyle = ACCENT; c.fillRect(marge, y, largeur - 2 * marge, 34);
    c.fillStyle = '#ffffff'; c.font = 'bold 14px Arial, sans-serif';
    c.fillText('Information', marge + 10, y + 22); c.fillText('Détail', colonneDetail, y + 22);
    y += 34;
    infos.forEach((info, i) => {
        const h = hauteurInfo(info);
        if (i % 2 === 1) { c.fillStyle = '#f9fafb'; c.fillRect(marge, y, largeur - 2 * marge, h); }
        c.fillStyle = GRIS; c.font = '15px Arial, sans-serif'; c.fillText(info.libelle, marge + 10, y + 28);
        c.fillStyle = info.couleur || ENCRE; c.font = `${info.gras ? 'bold ' : ''}16px Arial, sans-serif`;
        info.valeurs.forEach((valeur, k) => c.fillText(String(valeur ?? ''), colonneDetail, y + 28 + k * 22));
        c.fillStyle = FILET; c.fillRect(marge, y + h - 1, largeur - 2 * marge, 1);
        y += h;
    });
    y += 44;

    // ---- clé de suivi et QR code ----
    if (rdv.cleSuivi) {
        c.fillStyle = FOND_ENTETE; c.fillRect(marge, y, largeur - 2 * marge, hauteurCle);
        c.fillStyle = ACCENT; c.fillRect(marge, y, 4, hauteurCle);
        c.fillStyle = GRIS; c.font = 'bold 13px Arial, sans-serif'; c.fillText('CLÉ DE SUIVI (À GARDER)', marge + 26, y + 36);
        c.fillStyle = ACCENT; c.font = 'bold 34px Consolas, "Courier New", monospace'; c.fillText(rdv.cleSuivi, marge + 26, y + 84);
        c.fillStyle = GRIS; c.font = '14px Arial, sans-serif';
        lignes(c, 'Saisissez cette clé dans « Mes rendez-vous » du site pour retrouver, annuler ou télécharger ce reçu.', 330).forEach((texte, k) => c.fillText(texte, marge + 26, y + 118 + k * 20));
        try {
            const qr = await chargerImage(await qrDataUrl(lienSuivi(rdv.cleSuivi), 440));
            c.drawImage(qr, largeur - marge - 26 - 150, y + 20, 150, 150);
            c.textAlign = 'center'; c.fillStyle = GRIS; c.font = '12px Arial, sans-serif';
            c.fillText('Scannez pour retrouver', largeur - marge - 26 - 75, y + 190);
            c.textAlign = 'left';
        } catch { /* sans QR code, la clé écrite suffit */ }
        y += hauteurCle + 44;
    }

    // ---- mentions ----
    c.fillStyle = GRIS; c.font = '13px Arial, sans-serif';
    c.fillText('Présentez ce reçu à l’accueil du cabinet si nécessaire.', marge, y);
    c.fillText('Document administratif : il ne contient aucune information médicale.', marge, y + 20);
    c.textAlign = 'right'; c.fillStyle = ENCRE; c.font = 'bold 15px Arial, sans-serif'; c.fillText('Le cabinet', largeur - marge, y + 4);
    c.fillStyle = FILET; c.fillRect(largeur - marge - 180, y + 78, 180, 1);
    dessinerPied(c, largeur, hauteur, CABINET);
    return { canvas, largeur, hauteur };
}

export function telecharger(blob, nom) {
    const url = URL.createObjectURL(blob);
    const lien = document.createElement('a');
    lien.href = url; lien.download = nom;
    document.body.appendChild(lien); lien.click(); lien.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export const versBlob = (canvas, type, qualite) => new Promise(resolve => canvas.toBlob(resolve, type, qualite));

/**
 * Contenu du ticket (image) du reçu : même présentation que le ticket affiché à l'écran au patient (components/TicketPapier.jsx).
 * Le PDF reste la page A4 dessinée par dessinerRecu.
 */
async function ticketDuRecu(rdv) {
    const etat = ETATS[rdv.statut] || ETATS.EN_ATTENTE;
    const jour = rdv.dateRdv ? new Date(`${rdv.dateRdv}T12:00:00`) : null;
    const dateLongue = jour && !Number.isNaN(jour.getTime())
        ? jour.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }).replace(/^./, c => c.toUpperCase())
        : String(rdv.dateRdv || '');
    const annee = String(rdv.dateRdv || '').slice(0, 4) || String(new Date().getFullYear());
    const numero = `RV-${annee}-${String(rdv.id ?? 0).padStart(5, '0')}`;
    const emis = new Date();
    const services = servicesDe(rdv);
    const motif = rdv.motif ? String(rdv.motif).replace(/^⚠[^\n]*\n?/, '').trim().slice(0, 300) : '';
    const detailsPatient = [rdv.telephoneClient, rdv.ageClient != null && rdv.ageClient !== '' ? `${rdv.ageClient} an${Number(rdv.ageClient) > 1 ? 's' : ''}` : ''].filter(Boolean).join(' · ');
    return {
        titre: etat.titre,
        reference: `Réf : ${numero} | ${emis.toLocaleDateString('fr-FR')} à ${emis.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}`,
        signe: rdv.statut === 'ANNULE' ? 'croix' : 'coche', couleurSigne: rdv.statut === 'ANNULE' ? '#dc2626' : '#10b981',
        lignes: [
            { libelle: 'Patient', valeur: [rdv.civilite, rdv.nomClient].filter(Boolean).join(' '), detail: detailsPatient || undefined },
            ...(services.length ? [{ libelle: services.length > 1 ? 'Services' : 'Service', valeur: services.join(', ') }] : []),
            { libelle: 'Date du rendez-vous', valeur: dateLongue },
            { libelle: 'Heure', valeur: String(rdv.heureRdv || '').slice(0, 5) },
            { libelle: 'Reçu par', valeur: rdv.praticienNom || 'À préciser par le cabinet', gras: false },
            { libelle: 'Statut', valeur: STATUTS[rdv.statut] || rdv.statut || '', couleur: etat.couleur },
            ...(motif ? [{ libelle: 'Motif', valeur: motif, gras: false }] : []),
            ...(rdv.cleSuivi ? [{ libelle: 'Votre clé de suivi', valeur: rdv.cleSuivi, mono: true }] : []),
        ],
        qr: rdv.cleSuivi ? { src: await qrDataUrl(lienSuivi(rdv.cleSuivi), 440), legende: 'Scannez ce code pour retrouver votre rendez-vous.' } : undefined,
        pied: 'Présentez ce reçu à l’accueil du cabinet si nécessaire. Document administratif : il ne contient aucune information médicale.',
        cabinet: `${CABINET.nom} · ${CABINET.sousTitre}`,
    };
}

/** Reçu du rendez-vous en image PNG (présentée comme un ticket), téléchargé sur demande (jamais automatiquement). */
export async function downloadReceiptImage(rdv) {
    const { canvas } = await dessinerTicket(await ticketDuRecu(rdv));
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
    const { canvas } = await dessinerTicket(await ticketDuRecu(rdv));
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
 * Une page A4 qui ne contient que le dessin du document (reçu ou facture proforma).
 * Le PDF est écrit à la main (une image JPEG dans une page), sans bibliothèque supplémentaire.
 */
export function pdfAvecImage(jpeg, largeurPx, hauteurPx) {
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

/** Reçu du rendez-vous en PDF : la page A4 au style de la facture proforma. */
export async function downloadReceiptPdf(rdv) {
    const { canvas } = await dessinerRecu(rdv, 2);
    const blob = await versBlob(canvas, 'image/jpeg', 0.92);
    if (!blob) throw new Error('Impossible de créer le PDF du reçu.');
    const jpeg = new Uint8Array(await blob.arrayBuffer());
    telecharger(pdfAvecImage(jpeg, canvas.width, canvas.height), `casafami-recu-rdv-${rdv.id}.pdf`);
}
