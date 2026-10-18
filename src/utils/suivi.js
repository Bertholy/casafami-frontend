// Clé de suivi d'un rendez-vous (« CF-7K3M-9QX2 ») : remise au patient à la prise de rendez-vous, elle remplace la recherche par nom ou numéro.

/** Lien ouvert par le QR code : la page « Mes RDV » avec la clé déjà renseignée. */
export const lienSuivi = cle => `${window.location.origin}/mes-rdv?cle=${encodeURIComponent(cle)}`;

/** Met en forme ce que le patient tape : majuscules, tirets ajoutés (« cf7k3m9qx2 » → « CF-7K3M-9QX2 »). */
export function formaterCle(saisie) {
    const s = String(saisie ?? '').toUpperCase().replace(/[^A-Z0-9]/g, '');
    const corps = s.startsWith('CF') ? s.slice(2) : s;
    const morceaux = [corps.slice(0, 4), corps.slice(4, 8)].filter(Boolean);
    return s ? ['CF', ...morceaux].join('-') : '';
}

/** Une clé complète (avec son préfixe CF) : le personnel peut encore chercher par nom ou numéro, le reste est traité comme une clé. */
export const estUneCleComplete = saisie => /^CF[\s-]?[A-Z0-9]{4}[\s-]?[A-Z0-9]{4}$/i.test(String(saisie ?? '').trim());

let moduleQr;
/** QR code en image (data URL). La bibliothèque n'est chargée qu'au premier besoin. */
export async function qrDataUrl(texte, taille = 220) {
    moduleQr ??= import('qrcode');
    const { default: QRCode } = await moduleQr;
    return QRCode.toDataURL(texte, { width: taille, margin: 1, errorCorrectionLevel: 'M' });
}
