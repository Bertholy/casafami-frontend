// Lit la posologie écrite à la main (« 1 cp matin et soir », « 1 matin, 2 midi, 1 soir », « 3 fois par jour ») pour savoir quelles prises de la journée sont concernées
// et combien d'unités à chacune. Sert à allumer les trois boules Matin / Midi / Soir de l'assistant d'ordonnance. Logique pure : le texte de la posologie reste la seule source,
// rien n'est enregistré à part et ce qui n'est pas compris n'allume simplement rien.

export const PRISES = [['matin', 'Matin'], ['midi', 'Midi'], ['soir', 'Soir']];

// mots du texte → prise de la journée
const MOMENTS = {
    matin: 'matin', matinee: 'matin', reveil: 'matin', lever: 'matin',
    midi: 'midi', dejeuner: 'midi', repas: null,
    soir: 'soir', soiree: 'soir', coucher: 'soir', nuit: 'soir', diner: 'soir', couche: 'soir',
};
// un nombre suivi d'une de ces unités est une dose ou une durée (« 500 mg », « 5 jours »), pas un nombre de prises
const UNITES = new Set(['mg', 'g', 'kg', 'mcg', 'ug', 'ml', 'cl', 'l', 'ui', 'iu', 'h', 'heure', 'heures', 'jour', 'jours', 'j', 'semaine', 'semaines', 'mois', 'min', 'minutes', 'cm', 'mm']);
const FOIS = new Set(['fois', 'x']);

const SANS_ACCENT = 'àâäáãåéèêëíìîïóòôöõúùûüçñœ';
const PLAIN = 'aaaaaaeeeeiiiiooooouuuucno';
const plier = texte => String(texte ?? '').toLowerCase().split('').map(c => { const i = SANS_ACCENT.indexOf(c); return i >= 0 ? PLAIN[i] : c; }).join('');

/**
 * { matin, midi, soir } : le nombre d'unités à chaque prise (0 = aucune, 0.5 = une demi-unité). Exemples :
 *   « 1 cp matin et soir »        → matin 1, midi 0, soir 1
 *   « 1 matin, 2 midi, 1 soir »   → 1, 2, 1
 *   « matin midi et soir »        → 1, 1, 1
 *   « 3 fois par jour »           → 1, 1, 1 ;  « 2 fois par jour » → matin et soir ; « 1 fois par jour » → matin
 *   « 500 mg matin pendant 5 jours » → matin 1 (500 mg et 5 jours ne sont pas des prises)
 */
export function prisesDuJour(posologie) {
    const resultat = { matin: 0, midi: 0, soir: 0 };
    const texte = plier(posologie).replace(/½/g, ' 0.5 ').replace(/\b1\s*\/\s*2\b/g, ' 0.5 ').replace(/\b1\s*\/\s*4\b/g, ' 0.25 ').replace(/(\d),(\d)/g, '$1.$2');
    const mots = texte.match(/\d+(?:\.\d+)?|[a-z]+/g) || [];

    let quantite = null;      // le dernier nombre lu, qui s'applique aux moments qui suivent (« 1 cp matin et soir »)
    let foisParJour = 0;
    mots.forEach((mot, i) => {
        const suivant = mots[i + 1];
        if (/^\d/.test(mot)) {
            const nombre = Number(mot);
            if (suivant && FOIS.has(suivant)) { foisParJour = nombre; return; }
            if (suivant === 'par' && mots[i + 2] && mots[i + 2].startsWith('jour')) { foisParJour = nombre; return; }
            if (suivant && UNITES.has(suivant)) return;
            if (nombre > 0 && nombre <= 9) { quantite = nombre; }
            return;
        }
        const moment = MOMENTS[mot];
        if (!moment) return;
        resultat[moment] = quantite ?? 1;
    });

    // « 2 fois par jour » sans moment précisé : matin et soir (1 fois : matin ; 3 fois et plus : matin, midi et soir)
    if (!resultat.matin && !resultat.midi && !resultat.soir && foisParJour > 0) {
        if (foisParJour === 1) resultat.matin = 1;
        else if (foisParJour === 2) { resultat.matin = 1; resultat.soir = 1; }
        else { resultat.matin = 1; resultat.midi = 1; resultat.soir = 1; }
    }
    return resultat;
}

/** Affichage d'une quantité dans une boule : 1, 2, ½, ¼. */
export const libelleQuantite = n => (n === 0.5 ? '½' : n === 0.25 ? '¼' : String(n));

// ----------------------------------------------------------------------------- écrire la posologie à partir des boules

// quantités proposées quand on clique sur une boule : rien, 1, 2, 3, puis une demi-unité, puis on repart de rien
const QUANTITES = [0, 1, 2, 3, 0.5];
export const prochaineQuantite = n => QUANTITES[(QUANTITES.indexOf(n) + 1) % QUANTITES.length];
export const precedenteQuantite = n => QUANTITES[(QUANTITES.indexOf(n) + QUANTITES.length - 1) % QUANTITES.length];

const UNITES_DE_PRISE = new Set(['cp', 'comprime', 'comprimes', 'gelule', 'gelules', 'capsule', 'capsules', 'sachet', 'sachets', 'goutte', 'gouttes', 'cuilleree', 'cuillerees', 'ampoule', 'ampoules', 'dose', 'doses', 'suppo', 'suppositoire', 'suppositoires']);
const LIAISONS = new Set(['et', 'le', 'la', 'au', 'aux', 'du', 'en', 'a', 'puis']);
const ecrireNombre = n => (n === 0.5 ? '1/2' : n === 0.25 ? '1/4' : String(n));
const listeMoments = moments => (moments.length <= 1 ? moments.join('') : `${moments.slice(0, -1).join(', ')} et ${moments[moments.length - 1]}`);

/**
 * La posologie réécrite d'après les boules : « 1 matin », « 1 cp matin et soir », « 1 matin, 2 soir »… Ce que la personne avait écrit d'autre (« avant le repas », « pendant 5 jours »)
 * est gardé après les prises ; l'unité qu'elle utilisait (cp, gélule…) aussi. Sans aucune prise, il ne reste que son texte libre.
 */
export function ecrirePrises(posologie, prises) {
    const original = String(posologie ?? '');
    const pliee = plier(original);   // même longueur que l'original : les positions se correspondent
    const jetons = [...pliee.matchAll(/\d+\s*\/\s*\d+|\d+(?:[.,]\d+)?|½|[a-z]+/g)].map(m => ({ mot: m[0].replace(/\s+/g, ''), debut: m.index, fin: m.index + m[0].length }));
    const nombre = jeton => (jeton.mot === '½' ? 0.5 : jeton.mot.includes('/') ? (jeton.mot === '1/2' ? 0.5 : jeton.mot === '1/4' ? 0.25 : NaN) : Number(jeton.mot.replace(',', '.')));
    const estNombre = jeton => /^\d|^½/.test(jeton.mot);

    const retirer = new Set();
    let enAttente = [];
    let unite = '';
    jetons.forEach((jeton, i) => {
        const suivant = jetons[i + 1];
        if (estNombre(jeton)) {
            if (suivant && FOIS.has(suivant.mot)) { [i, i + 1].forEach(k => retirer.add(k)); if (jetons[i + 2]?.mot === 'par' && jetons[i + 3]?.mot.startsWith('jour')) { retirer.add(i + 2); retirer.add(i + 3); } return; }
            if (suivant?.mot === 'par' && jetons[i + 2]?.mot.startsWith('jour')) { [i, i + 1, i + 2].forEach(k => retirer.add(k)); return; }
            if (suivant && UNITES.has(suivant.mot)) return;
            const valeur = nombre(jeton);
            if (valeur > 0 && valeur <= 9) {
                enAttente = [i];
                if (suivant && UNITES_DE_PRISE.has(suivant.mot)) { enAttente.push(i + 1); unite = original.slice(suivant.debut, suivant.fin); }
            }
            return;
        }
        if (!MOMENTS[jeton.mot]) return;
        retirer.add(i);
        enAttente.forEach(k => retirer.add(k));
        // « le matin », « au coucher », « matin et soir » : les petits mots qui lient ce moment aux autres partent avec lui
        for (let k = i - 1; k >= 0 && LIAISONS.has(jetons[k].mot) && !retirer.has(k); k -= 1) retirer.add(k);
    });
    const reste = jetons.map((jeton, i) => (retirer.has(i) ? null : original.slice(jeton.debut, jeton.fin))).filter(Boolean).join(' ');

    const actifs = PRISES.filter(([cle]) => prises[cle] > 0);
    if (actifs.length === 0) return reste;
    const u = unite ? ` ${unite}` : '';
    const memeQuantite = actifs.every(([cle]) => prises[cle] === prises[actifs[0][0]]);
    const prisesEcrites = memeQuantite
        ? `${ecrireNombre(prises[actifs[0][0]])}${u} ${listeMoments(actifs.map(([cle]) => cle))}`
        : actifs.map(([cle]) => `${ecrireNombre(prises[cle])}${u} ${cle}`).join(', ');
    return reste ? `${prisesEcrites} ${reste}` : prisesEcrites;
}
