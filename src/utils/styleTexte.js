/** Palette proposée dans la fenêtre de modification (le super administrateur peut aussi choisir une couleur libre). */
export const COULEURS = ['#0f766e', '#0369a1', '#7c3aed', '#be123c', '#b45309', '#15803d', '#111827', '#ffffff'];
export const TAILLE_MIN = 12;
export const TAILLE_MAX = 96;

/**
 * Convertit la mise en forme enregistrée { gras, italique, taille, couleur, alignement } en style CSS.
 * Une grande taille est plafonnée à 9 % de la largeur de l'écran pour ne jamais déborder sur téléphone.
 */
export function cssDuStyle(style) {
    if (!style) return undefined;
    const css = {};
    if (style.gras) css.fontWeight = 700;
    if (style.italique) css.fontStyle = 'italic';
    if (style.taille) css.fontSize = style.taille > 28 ? `min(${style.taille}px, 9vw)` : `${style.taille}px`;
    if (style.couleur) css.color = style.couleur;
    if (style.alignement) css.textAlign = style.alignement;
    return Object.keys(css).length ? css : undefined;
}

/** Nettoie la mise en forme avant l'envoi : seules les options activées sont gardées. */
export function styleAEnvoyer({ gras, italique, taille, couleur, alignement }) {
    const style = {};
    if (gras) style.gras = true;
    if (italique) style.italique = true;
    if (taille) style.taille = Number(taille);
    if (couleur) style.couleur = couleur;
    if (alignement) style.alignement = alignement;
    return style;
}

/** Clé d'un nouveau texte ajouté : « ajout.<page>.<zone>.<repère> » (le repère classe les textes dans l'ordre de création). */
export const nouvelleCleAjout = (page, zone) => `ajout.${page}.${zone}.${Date.now().toString(36)}`;
