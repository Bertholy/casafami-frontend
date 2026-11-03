import { lignes, partageDisponible, pdfAvecImage, telecharger, versBlob } from './receipt';
import { COULEURS, dessinerEntete, dessinerPied } from './enteteCabinet';
import { dessinerTicket } from './ticketImage';

/**
 * Facture proforma d'un patient reçu sans rendez-vous : un devis chiffré en Ariary, remis au patient s'il le souhaite. Elle est dessinée dans le navigateur
 * (même méthode que le reçu : un canvas, puis une image PNG ou un PDF identique) ; rien n'est envoyé ni enregistré sur le serveur.
 * Ce n'est pas une facture définitive ni un reçu de paiement : la mention figure sur le document.
 */

// ---- montants ----
export const formaterMontant = valeur => new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 0 }).format(Math.round(Number(valeur) || 0)).replace(new RegExp(String.fromCharCode(0x202f) + '|' + String.fromCharCode(0xa0), 'g'), ' ');
export const totalLignes = liste => liste.reduce((somme, ligne) => somme + (Number(ligne.quantite) || 0) * (Number(ligne.prix) || 0), 0);

// ---- somme en toutes lettres (français) ----
const UNITES = ['zéro', 'un', 'deux', 'trois', 'quatre', 'cinq', 'six', 'sept', 'huit', 'neuf', 'dix', 'onze', 'douze', 'treize', 'quatorze', 'quinze', 'seize', 'dix-sept', 'dix-huit', 'dix-neuf'];
const DIZAINES = ['', '', 'vingt', 'trente', 'quarante', 'cinquante', 'soixante'];
function moinsDeCent(n, final) {
    if (n < 20) return UNITES[n];
    if (n < 70) { const d = Math.floor(n / 10), u = n % 10; return DIZAINES[d] + (u === 1 ? ' et un' : u ? `-${UNITES[u]}` : ''); }
    if (n < 80) { const u = n - 60; return u === 11 ? 'soixante et onze' : `soixante-${UNITES[u]}`; }
    const u = n - 80;
    return u === 0 ? (final ? 'quatre-vingts' : 'quatre-vingt') : `quatre-vingt-${UNITES[u]}`;
}
function moinsDeMille(n, final) {
    const centaines = Math.floor(n / 100), reste = n % 100;
    let texte = '';
    if (centaines) texte = centaines === 1 ? 'cent' : `${UNITES[centaines]} cent${reste === 0 && final ? 's' : ''}`;
    if (reste) texte += (texte ? ' ' : '') + moinsDeCent(reste, final);
    return texte;
}
/** 125000 → « cent vingt-cinq mille » */
export function enLettres(nombre) {
    let n = Math.max(0, Math.round(Number(nombre) || 0));
    if (n === 0) return 'zéro';
    const groupes = [[1e9, 'milliard'], [1e6, 'million']];
    const morceaux = [];
    for (const [valeur, nom] of groupes) {
        const q = Math.floor(n / valeur);
        if (q) { morceaux.push(`${moinsDeMille(q, false)} ${nom}${q > 1 ? 's' : ''}`); n -= q * valeur; }
    }
    const milliers = Math.floor(n / 1000);
    if (milliers) { morceaux.push(milliers === 1 ? 'mille' : `${moinsDeMille(milliers, false)} mille`); n -= milliers * 1000; }
    if (n) morceaux.push(moinsDeMille(n, true));
    return morceaux.join(' ');
}

export const numeroProforma = (id, date = new Date()) => `PF-${date.getFullYear()}-${String(id).padStart(5, '0')}`;

// ---- le document ----
/**
 * donnees : { numero, date, destinataire: { nom, telephone, mention }, patient: { nom, telephone }, lignes: [{ designation, quantite, prix }],
 *             cabinet: { nom, sousTitre, adresse, telephones } }
 */
async function dessinerProforma(donnees, facteur = 1) {
    const largeur = 794, marge = 56;
    const { ENCRE, GRIS, FILET, ACCENT, FOND_ENTETE } = COULEURS;
    const colonnes = { n: marge, designation: marge + 40, quantite: largeur - marge - 270, prix: largeur - marge - 190, montant: largeur - marge };
    const mesure = document.createElement('canvas').getContext('2d');
    mesure.font = '16px Arial, sans-serif';
    const lignesFacture = donnees.lignes.map(ligne => ({ ...ligne, lignesTexte: lignes(mesure, ligne.designation || '', colonnes.quantite - colonnes.designation - 30).slice(0, 4) }));
    const total = totalLignes(donnees.lignes);
    mesure.font = 'italic 16px Arial, sans-serif';
    const enMots = lignes(mesure, `Arrêtée la présente facture proforma à la somme de : ${enLettres(total)} Ariary.`.replace(/^./, c => c.toUpperCase()), largeur - 2 * marge);
    const hauteurLignes = lignesFacture.reduce((s, l) => s + Math.max(1, l.lignesTexte.length) * 22 + 22, 0);
    const hauteur = Math.max(1123, 330 + 150 + hauteurLignes + 60 + 70 + enMots.length * 24 + 230);

    const canvas = document.createElement('canvas');
    canvas.width = largeur * facteur; canvas.height = hauteur * facteur;
    const c = canvas.getContext('2d');
    c.scale(facteur, facteur);
    c.textBaseline = 'alphabetic';
    c.fillStyle = '#ffffff'; c.fillRect(0, 0, largeur, hauteur);

    // en-tête : logo, cabinet, titre (le même que celui des autres documents du cabinet)
    await dessinerEntete(c, largeur, marge, donnees.cabinet, { titre: 'FACTURE PROFORMA', numero: donnees.numero, lignes: [`Date : ${donnees.date.toLocaleDateString('fr-FR')}`, 'Valable 30 jours'] });

    // destinataire et patient
    let y = 200;
    c.textAlign = 'left';
    c.fillStyle = GRIS; c.font = 'bold 13px Arial, sans-serif'; c.fillText('FACTURÉ À', marge, y);
    c.fillStyle = ENCRE; c.font = 'bold 20px Arial, sans-serif'; c.fillText(donnees.destinataire.nom, marge, y + 28);
    c.fillStyle = GRIS; c.font = '15px Arial, sans-serif';
    let yd = y + 50;
    for (const ligne of [donnees.destinataire.telephone && `Tél. ${donnees.destinataire.telephone}`, donnees.destinataire.mention].filter(Boolean)) { c.fillText(ligne, marge, yd); yd += 20; }
    if (donnees.patient) {
        c.fillStyle = GRIS; c.font = 'bold 13px Arial, sans-serif'; c.fillText('PATIENT', largeur / 2 + 20, y);
        c.fillStyle = ENCRE; c.font = 'bold 18px Arial, sans-serif'; c.fillText(donnees.patient.nom, largeur / 2 + 20, y + 28);
        c.fillStyle = GRIS; c.font = '15px Arial, sans-serif'; c.fillText('Consultation sans rendez-vous', largeur / 2 + 20, y + 50);
    }
    y = Math.max(yd, y + 70) + 24;

    // tableau
    c.fillStyle = ACCENT; c.fillRect(marge, y, largeur - 2 * marge, 34);
    c.fillStyle = '#ffffff'; c.font = 'bold 14px Arial, sans-serif';
    c.textAlign = 'left'; c.fillText('N°', colonnes.n + 10, y + 22); c.fillText('Désignation', colonnes.designation, y + 22);
    c.textAlign = 'right'; c.fillText('Qté', colonnes.quantite + 40, y + 22); c.fillText('Prix unitaire (Ar)', colonnes.prix + 90, y + 22); c.fillText('Montant (Ar)', colonnes.montant - 10, y + 22);
    y += 34;
    lignesFacture.forEach((ligne, i) => {
        const h = Math.max(1, ligne.lignesTexte.length) * 22 + 22;
        if (i % 2 === 1) { c.fillStyle = '#f9fafb'; c.fillRect(marge, y, largeur - 2 * marge, h); }
        c.fillStyle = ENCRE; c.font = '16px Arial, sans-serif';
        c.textAlign = 'left'; c.fillText(String(i + 1), colonnes.n + 10, y + 28);
        ligne.lignesTexte.forEach((texte, k) => c.fillText(texte, colonnes.designation, y + 28 + k * 22));
        c.textAlign = 'right';
        c.fillText(String(Number(ligne.quantite) || 0), colonnes.quantite + 40, y + 28);
        c.fillText(formaterMontant(ligne.prix), colonnes.prix + 90, y + 28);
        c.font = 'bold 16px Arial, sans-serif'; c.fillText(formaterMontant((Number(ligne.quantite) || 0) * (Number(ligne.prix) || 0)), colonnes.montant - 10, y + 28);
        c.fillStyle = FILET; c.fillRect(marge, y + h - 1, largeur - 2 * marge, 1);
        y += h;
    });
    y += 26;

    // total
    c.fillStyle = FOND_ENTETE; c.fillRect(largeur - marge - 300, y, 300, 52);
    c.fillStyle = ACCENT; c.fillRect(largeur - marge - 300, y, 4, 52);
    c.textAlign = 'left'; c.fillStyle = ENCRE; c.font = 'bold 16px Arial, sans-serif'; c.fillText('TOTAL À PAYER', largeur - marge - 284, y + 32);
    c.textAlign = 'right'; c.font = 'bold 22px Arial, sans-serif'; c.fillText(`${formaterMontant(total)} Ar`, largeur - marge - 14, y + 34);
    y += 52 + 34;

    c.textAlign = 'left'; c.fillStyle = ENCRE; c.font = 'italic 16px Arial, sans-serif';
    enMots.forEach((ligne, i) => c.fillText(ligne, marge, y + i * 24));
    y += enMots.length * 24 + 40;

    // mention et signature
    c.fillStyle = GRIS; c.font = '13px Arial, sans-serif';
    c.fillText('Document informatif non contractuel : il ne vaut ni facture définitive ni reçu de paiement.', marge, y);
    c.fillText('Les montants peuvent évoluer selon les soins réellement réalisés.', marge, y + 20);
    c.textAlign = 'right'; c.fillStyle = ENCRE; c.font = 'bold 15px Arial, sans-serif'; c.fillText('Le cabinet', largeur - marge, y + 4);
    c.fillStyle = FILET; c.fillRect(largeur - marge - 180, y + 78, 180, 1);
    dessinerPied(c, largeur, hauteur, donnees.cabinet);
    return { canvas };
}

export async function downloadProformaPdf(donnees) {
    const { canvas } = await dessinerProforma(donnees, 2);
    const blob = await versBlob(canvas, 'image/jpeg', 0.92);
    if (!blob) throw new Error('Impossible de créer le PDF de la facture proforma.');
    telecharger(pdfAvecImage(new Uint8Array(await blob.arrayBuffer()), canvas.width, canvas.height), `casafami-proforma-${donnees.numero}.pdf`);
}

/**
 * Contenu du ticket de la facture : affiché à l'écran (components/TicketPapier.jsx) et dessiné dans l'image téléchargée ou partagée (utils/ticketImage.js),
 * donc identique dans les deux cas. Le PDF reste la page A4 dessinée par dessinerProforma.
 */
export function ticketProforma(donnees) {
    const total = totalLignes(donnees.lignes);
    const dateFacture = donnees.date.toLocaleDateString('fr-FR');
    const heureFacture = donnees.date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
    return {
        titre: 'Facture proforma',
        reference: `Réf : ${donnees.numero} | ${dateFacture} à ${heureFacture}`,
        lignes: [
            { libelle: donnees.patient ? 'Facturé à' : 'Client', valeur: donnees.destinataire.nom, detail: [donnees.destinataire.telephone, donnees.destinataire.mention].filter(Boolean).join(' · ') || undefined },
            ...(donnees.patient ? [{ libelle: 'Patient', valeur: donnees.patient.nom }] : []),
            ...(donnees.lignes.length > 0
                ? donnees.lignes.map(l => ({ libelle: l.designation, valeur: `${formaterMontant((Number(l.quantite) || 0) * (Number(l.prix) || 0))} Ar`, detail: `${Number(l.quantite)} × ${formaterMontant(l.prix)} Ar` }))
                : [{ libelle: 'Services', valeur: 'Aucun pour le moment', gras: false }]),
        ],
        total: { libelle: 'Montant total', valeur: `${formaterMontant(total)} Ar`, detail: total > 0 ? `${enLettres(total).replace(/^./, c => c.toUpperCase())} Ariary` : undefined },
        pied: 'Document informatif non contractuel : il ne vaut ni facture définitive ni reçu de paiement. Valable 30 jours.',
    };
}

const imageTicketProforma = async donnees => (await dessinerTicket({ ...ticketProforma(donnees), cabinet: `${donnees.cabinet.nom} · ${donnees.cabinet.sousTitre}` })).canvas;

/** Facture proforma en image PNG, présentée comme un ticket. */
export async function downloadProformaImage(donnees) {
    const canvas = await imageTicketProforma(donnees);
    const blob = await versBlob(canvas, 'image/png');
    if (!blob) throw new Error('Impossible de créer l’image de la facture proforma.');
    telecharger(blob, `casafami-proforma-${donnees.numero}.png`);
}

/**
 * Partage la facture proforma (même image que le téléchargement) avec les applications de l'appareil (WhatsApp, e-mail…).
 * Quand l'appareil ne sait pas partager un fichier (ordinateur), l'image est téléchargée à la place : la fonction retourne alors false.
 */
export async function shareProformaImage(donnees) {
    const canvas = await imageTicketProforma(donnees);
    const blob = await versBlob(canvas, 'image/png');
    if (!blob) throw new Error('Impossible de créer l’image de la facture proforma.');
    const nom = `casafami-proforma-${donnees.numero}.png`;
    if (!partageDisponible()) { telecharger(blob, nom); return false; }
    try {
        await navigator.share({ files: [new File([blob], nom, { type: 'image/png' })], title: `Facture proforma ${donnees.numero} — CASAFAMI` });
    } catch (erreur) {
        if (erreur?.name !== 'AbortError') throw new Error('Le partage a échoué. Téléchargez la facture à la place.', { cause: erreur });
    }
    return true;
}
