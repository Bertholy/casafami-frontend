// Petites fonctions pour travailler sur du texte, utilisables dans toutes les pages et tous les composants.
// Une fonction écrite ici une seule fois évite de la recopier (et de la corriger) dans plusieurs fichiers.

/**
 * Met la première lettre en majuscule et laisse le reste du texte tel quel.
 * Exemple : premiereMajuscule('lundi 3 mars') donne 'Lundi 3 mars'.
 */
export const premiereMajuscule = texte => texte.charAt(0).toUpperCase() + texte.slice(1);
