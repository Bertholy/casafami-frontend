import { MG } from './mg';

/** Espaces et retours à la ligne multiples ramenés à un seul espace (comme le fait le navigateur à l'affichage). */
export const normaliser = texte => String(texte ?? '').replace(/\s+/g, ' ').trim();

/**
 * Traduit un texte français : en malgache si le dictionnaire le connaît, sinon le texte français (jamais de texte vide).
 * `variables` remplace les marques {nom} du texte.
 */
export function traduire(lang, texte, variables) {
    const brut = normaliser(texte);
    const resultat = lang === 'mg' ? (MG[brut] ?? brut) : brut;
    return variables ? resultat.replace(/\{(\w+)\}/g, (_, nom) => String(variables[nom] ?? '')) : resultat;
}

const MOIS_MG = ['Janoary', 'Febroary', 'Martsa', 'Aprily', 'Mey', 'Jona', 'Jolay', 'Aogositra', 'Septambra', 'Oktobra', 'Novambra', 'Desambra'];

/** « 14 octobre 2026 » en français, « 14 Oktobra 2026 » en malgache (les navigateurs ne gèrent pas toujours le malgache). */
export function formatDateLongue(lang, iso) {
    if (!iso) return '';
    const date = new Date(`${iso}T12:00:00`);
    if (lang === 'mg') return `${date.getDate()} ${MOIS_MG[date.getMonth()]} ${date.getFullYear()}`;
    return date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });
}
