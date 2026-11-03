// Civilité d'un patient, calculée automatiquement d'après son âge et son sexe (même règle que le serveur : util/Civilite.java).
// Avant 18 ans : « Enfant » ; ensuite « Mr » (homme) ou « Mme » (femme). Elle se met à jour toute seule quand l'âge ou le sexe change.
export const AGE_ADOLESCENT = 12;   // avant 12 ans : « Enfant » ; de 12 à 17 ans : « Adolescent »
export const AGE_ADULTE = 18;

export const SEXES = [{ valeur: 'HOMME', libelle: 'Homme' }, { valeur: 'FEMME', libelle: 'Femme' }];

/** « Enfant », « Mr », « Mme », ou '' quand on ne sait pas (adulte dont le sexe n'est pas précisé, ou âge pas encore saisi). */
export function civilite(age, sexe) {
    const nombre = age === '' || age == null ? NaN : Number(age);
    if (Number.isFinite(nombre) && nombre < AGE_ADOLESCENT) return 'Enfant';
    if (Number.isFinite(nombre) && nombre < AGE_ADULTE) return 'Adolescent';
    if (sexe === 'HOMME') return Number.isFinite(nombre) ? 'Mr' : '';
    if (sexe === 'FEMME') return Number.isFinite(nombre) ? 'Mme' : '';
    return '';
}

/** Précision pour un enfant ou un adolescent : « Enfant · garçon », « Adolescent · fille »… ; pour un adulte, la civilité seule. */
export function civiliteDetaillee(age, sexe) {
    const c = civilite(age, sexe);
    if (c !== 'Enfant' && c !== 'Adolescent') return c;
    return sexe === 'HOMME' ? `${c} · garçon` : sexe === 'FEMME' ? `${c} · fille` : c;
}

/** Civilité de « Mr » / « Mme » à partir du sexe, et inversement : le choix de l'un remplit l'autre. */
export const CIVILITES = [{ valeur: 'Mr', sexe: 'HOMME' }, { valeur: 'Mme', sexe: 'FEMME' }];
export const civilitePourSexe = sexe => CIVILITES.find(c => c.sexe === sexe)?.valeur ?? '';
export const sexePourCivilite = valeur => CIVILITES.find(c => c.valeur === valeur)?.sexe ?? '';

/** Catégorie affichée dès que l'âge est saisi : « Enfant · garçon », « Adulte · Mr »… ('' tant que l'âge est inconnu). */
export function civiliteSelonAge(age, sexe) {
    const nombre = age === '' || age == null ? NaN : Number(age);
    if (!Number.isFinite(nombre)) return '';
    if (nombre < AGE_ADULTE) return civiliteDetaillee(age, sexe);
    return sexe ? `Adulte · ${civilite(age, sexe)}` : 'Adulte';
}

/** Nom précédé de la civilité : « Mme Rasoa », « Enfant Lova » (le nom seul si la civilité est inconnue). */
export function nomAvecCivilite(nom, age, sexe) {
    const c = civilite(age, sexe);
    return c ? `${c} ${nom}` : nom;
}
