// Compteur des chargements en cours (requêtes au serveur, pages qui se chargent) : la barre de progression du haut s'y abonne.
let actifs = 0;
const abonnes = new Set();
const prevenir = () => abonnes.forEach(abonne => abonne(actifs > 0));

/** Un chargement commence. */
export function debutChargement() { actifs += 1; prevenir(); }

/** Un chargement se termine (succès ou échec). */
export function finChargement() { actifs = Math.max(0, actifs - 1); prevenir(); }

/** `rappel(enCours)` est appelé à chaque changement ; renvoie la fonction qui désabonne. */
export function surChargement(rappel) {
    abonnes.add(rappel);
    return () => { abonnes.delete(rappel); };
}
