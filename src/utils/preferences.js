// Préférences personnelles du personnel, gardées sur cet appareil (navigateur) : son des notifications, déconnexion automatique, message de garde.
// Le thème, le style, le menu et la langue ont leur propre mémorisation (ThemeContext, stylePersonnel, AdminLayout, LangContext).

const CLE_SON = 'pref-son-notifications';
const CLE_INACTIVITE = 'pref-inactivite-minutes';

/** Délais proposés avant la déconnexion automatique, en minutes (0 = jamais). */
export const DUREES_INACTIVITE = [[0, 'Jamais'], [15, '15 minutes'], [30, '30 minutes'], [60, '1 heure'], [120, '2 heures']];

const lire = cle => { try { return localStorage.getItem(cle); } catch { return null; } };
const ecrire = (cle, valeur) => { try { localStorage.setItem(cle, valeur); } catch { /* stockage indisponible : le choix n'est pas gardé */ } };

/** Son quand une nouvelle notification arrive : activé tant que la personne ne l'a pas coupé. */
export const sonNotificationsActif = () => lire(CLE_SON) !== '0';
export const definirSonNotifications = actif => ecrire(CLE_SON, actif ? '1' : '0');

/** Minutes d'inactivité avant la déconnexion automatique (0 = jamais, par défaut). */
export function inactiviteMinutes() {
    const minutes = Number(lire(CLE_INACTIVITE));
    return DUREES_INACTIVITE.some(([valeur]) => valeur === minutes) ? minutes : 0;
}
export const definirInactiviteMinutes = minutes => ecrire(CLE_INACTIVITE, String(minutes));

/**
 * Le message « Vous êtes de garde » peut avoir été fermé avec « OK » ou « Ne me rappelez pas » : efface ces choix pour que la personne le revoie
 * à la prochaine ouverture de son espace. Retourne le nombre de choix effacés.
 */
export function reafficherMessageDeGarde(email) {
    let efface = 0;
    try {
        const prefixe = `garde-message-${email}-`;
        for (const cle of Object.keys(localStorage)) if (cle.startsWith(prefixe)) { localStorage.removeItem(cle); efface += 1; }
        if (sessionStorage.getItem('garde-message-ok') !== null) { sessionStorage.removeItem('garde-message-ok'); efface += 1; }
    } catch { /* stockage indisponible */ }
    return efface;
}
