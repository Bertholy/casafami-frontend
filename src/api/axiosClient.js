import axios from 'axios';
import { LOGIN_PATH, clearSession, getToken } from '../utils/auth';

// L'adresse de l'API peut être changée sans toucher au code : VITE_API_URL=https://mon-serveur/api
export const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080/api';
export const API_ORIGIN = API_URL.replace(/\/api\/?$/, '');

/** URL complète d'une image téléversée (ex. /uploads/services/x.png) ; les URLs absolues sont conservées. */
export const assetUrl = path => (!path ? '' : /^https?:/.test(path) ? path : `${API_ORIGIN}${path}`);

const axiosClient = axios.create({
    baseURL: API_URL,
    headers: {
        'Content-Type': 'application/json',
    },
    timeout: 10000,
});

// Intercepteur pour ajouter le token JWT automatiquement
axiosClient.interceptors.request.use(
    (config) => {
        const token = getToken();
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => Promise.reject(error)
);

// Session expirée ou compte supprimé : on nettoie et on renvoie vers la connexion au lieu de laisser une page cassée.
axiosClient.interceptors.response.use(
    response => response,
    error => {
        const isLogin = error.config?.url?.includes('/auth/login');
        if (error.response?.status === 401 && !isLogin && getToken()) {
            clearSession();
            if (window.location.pathname !== LOGIN_PATH) window.location.assign(LOGIN_PATH);
        }
        return Promise.reject(error);
    }
);

export default axiosClient;
