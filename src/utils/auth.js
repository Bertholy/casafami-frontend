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
const SESSION_KEYS = ['token', 'email', 'role'];
// Ancien emplacement, partagé entre tous les onglets : on le vide pour qu'une ancienne session ne réapparaisse pas.
try { SESSION_KEYS.forEach(key => localStorage.removeItem(key)); } catch { /* stockage indisponible */ }

export const getToken = () => sessionStorage.getItem('token');
export const getRole = () => sessionStorage.getItem('role');
export const getEmail = () => sessionStorage.getItem('email') || '';
export const hasSession = () => Boolean(getToken());
export const homeForRole = role => HOME_BY_ROLE[role] || LOGIN_PATH;

export function saveSession({ token, email, role }) {
    sessionStorage.setItem('token', token);
    sessionStorage.setItem('email', email);
    sessionStorage.setItem('role', role);
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
