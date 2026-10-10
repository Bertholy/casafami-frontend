// Les numéros sont saisis et affichés au format local « 034 12 345 67 ».
// Le serveur accepte aussi 34 12 345 67 ou un numéro avec indicatif, et enregistre toujours la forme locale à 10 chiffres.

const digits = value => String(value ?? '').replace(/\D/g, '');

/** Affichage d'un numéro enregistré : « 0341234567 » → « 034 12 345 67 ». */
export function formatPhone(raw) {
    const value = String(raw ?? '').trim();
    const d = digits(value);
    if (/^0\d{9}$/.test(d)) return `${d.slice(0, 3)} ${d.slice(3, 5)} ${d.slice(5, 8)} ${d.slice(8)}`;
    // ancien format avec indicatif : toujours présenté au format local
    if (/^261\d{9}$/.test(d)) return formatPhone(`0${d.slice(3)}`);
    return value;
}

/** Mise en forme pendant la saisie : seuls les numéros commençant par 0 sont regroupés (034 12 345 67). */
export function formatPhoneInput(raw) {
    const value = String(raw ?? '');
    if (value.trim().startsWith('+')) return `+${digits(value).slice(0, 15)}`; // numéro étranger : chiffres seulement
    const d = digits(value).slice(0, 10);
    if (!d.startsWith('0')) return d.slice(0, 15);
    return [d.slice(0, 3), d.slice(3, 5), d.slice(5, 8), d.slice(8, 10)].filter(Boolean).join(' ');
}

/** Un numéro est plausible s'il compte entre 8 et 15 chiffres (la validation définitive est faite par le serveur). */
export const isPlausiblePhone = raw => {
    const n = digits(raw).length;
    return n >= 8 && n <= 15;
};
