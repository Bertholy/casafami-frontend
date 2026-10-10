const HOME_BY_ROLE = {
    SUPER_ADMIN: '/admin/dashboard',
    SECRETAIRE: '/espace/secretariat',
    SAGE_FEMME: '/espace/sage-femme',
    INFIRMIERE: '/espace/sage-femme',
    MEDECIN: '/medecin/dashboard',
};

export const LOGIN_PATH = '/medecin/login';

export const getRole = () => localStorage.getItem('role');
export const getEmail = () => localStorage.getItem('email') || '';
export const hasSession = () => Boolean(localStorage.getItem('token'));
export const homeForRole = role => HOME_BY_ROLE[role] || LOGIN_PATH;

export function clearSession() {
    ['token', 'email', 'role'].forEach(key => localStorage.removeItem(key));
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
