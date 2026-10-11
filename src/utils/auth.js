const HOME_BY_ROLE = {
    SUPER_ADMIN: '/admin/dashboard',
    SECRETAIRE: '/espace/secretariat',
    SAGE_FEMME: '/espace/sage-femme',
    INFIRMIERE: '/espace/sage-femme',
    MEDECIN: '/medecin/dashboard',
};

export const LOGIN_PATH = '/medecin/login';

/*
 * La session est propre à CHAQUE onglet (sessionStorage) : on peut garder ouverts en même temps le super administrateur,
 * un médecin, une sage-femme, une secrétaire… sans que la connexion d'un onglet remplace celle des autres.
 * (Avec localStorage, tous les onglets partageaient le même compte : le dernier connecté prenait la place des autres.)
 */
const SESSION_KEYS = ['token', 'email', 'role', 'permissions'];
// Ancien emplacement, partagé entre tous les onglets : on le vide pour qu'une ancienne session ne réapparaisse pas.
try { SESSION_KEYS.forEach(key => localStorage.removeItem(key)); } catch { /* stockage indisponible */ }

export const getToken = () => sessionStorage.getItem('token');
export const getRole = () => sessionStorage.getItem('role');
export const getEmail = () => sessionStorage.getItem('email') || '';
export const hasSession = () => Boolean(getToken());
export const homeForRole = role => HOME_BY_ROLE[role] || LOGIN_PATH;

export function saveSession({ token, email, role, permissions }) {
    sessionStorage.setItem('token', token);
    sessionStorage.setItem('email', email);
    sessionStorage.setItem('role', role);
    savePermissions(permissions);
}

/**
 * Droits de la personne connectée (liste de codes renvoyée à la connexion et par /profile).
 * Le site s'en sert pour masquer ce qui n'est pas permis ; c'est toujours le serveur qui décide.
 * Sans liste connue (ancienne session), on ne cache rien : le serveur refusera si besoin.
 */
export function getPermissions() {
    try {
        const brut = sessionStorage.getItem('permissions');
        const liste = brut ? JSON.parse(brut) : null;
        return Array.isArray(liste) ? liste : null;
    } catch { return null; }
}

export function savePermissions(permissions) {
    if (Array.isArray(permissions)) sessionStorage.setItem('permissions', JSON.stringify([...permissions].sort()));
}

/** true si la personne a ce droit (le super administrateur a tout ; liste inconnue = on laisse faire, le serveur tranche). */
export function peut(code) {
    if (getRole() === 'SUPER_ADMIN') return true;
    const liste = getPermissions();
    return liste === null ? true : liste.includes(code);
}

export function clearSession() {
    SESSION_KEYS.forEach(key => sessionStorage.removeItem(key));
}

/** Message lisible à partir d'une erreur Axios (corps d'erreur de l'API, sinon message de repli). */
export function apiErrorMessage(error, fallback) {
    const data = error?.response?.data;
    if (data?.erreurs && typeof data.erreurs === 'object') {
        const first = Object.values(data.erreurs)[0];
        if (first) return String(first);
    }
    if (data?.message && error.response.status < 500) return String(data.message);
    if (!error?.response) return 'Le serveur est injoignable. Vérifiez que le backend est démarré.';
    return fallback;
}

/** Met à jour les droits mémorisés ; renvoie true si la liste a changé (la page doit alors se recharger pour s'adapter). */
export function majPermissions(permissions) {
    if (!Array.isArray(permissions)) return false;
    const avant = getPermissions();
    const apres = [...permissions].sort();
    if (avant && avant.length === apres.length && avant.every((code, i) => code === apres[i])) return false;
    savePermissions(apres);
    return true;
}
