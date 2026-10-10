import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import axiosClient from '../api/axiosClient';
import { apiErrorMessage, getRole, hasSession } from '../utils/auth';

/**
 * Éditeur du site public. Tous les visiteurs reçoivent les textes et positions personnalisés ;
 * seul le super administrateur peut activer le « mode édition » (clic sur un texte pour le modifier, poignée ✥ pour déplacer).
 * Chaque modification est enregistrée aussitôt sur le serveur.
 */
const SiteContentContext = createContext(null);
const EDIT_KEY = 'site-edit-mode';

export function SiteContentProvider({ children }) {
    const location = useLocation();
    const navigate = useNavigate();
    const [content, setContent] = useState({});
    const [editMode, setEditMode] = useState(() => {
        try { return sessionStorage.getItem(EDIT_KEY) === '1'; } catch { return false; }
    });
    const [status, setStatus] = useState({ type: 'idle', message: '' });
    const canEdit = hasSession() && getRole() === 'SUPER_ADMIN';

    useEffect(() => {
        let cancelled = false;
        axiosClient.get('/site-content').then(({ data }) => { if (!cancelled) setContent(data || {}); }).catch(() => {});
        return () => { cancelled = true; };
    }, []);

    // Lien « Modifier le site » du menu d'administration : /?edition=1
    useEffect(() => {
        if (!canEdit || new URLSearchParams(location.search).get('edition') !== '1') return;
        const timer = window.setTimeout(() => {
            setEditMode(true);
            navigate(location.pathname, { replace: true });
        }, 0);
        return () => window.clearTimeout(timer);
    }, [canEdit, location.search, location.pathname, navigate]);

    const active = canEdit && editMode;

    const toggleEditMode = useCallback(() => {
        setEditMode(current => {
            const next = !current;
            try { sessionStorage.setItem(EDIT_KEY, next ? '1' : '0'); } catch { /* stockage indisponible : le mode n'est pas mémorisé */ }
            return next;
        });
    }, []);

    const flash = useCallback((type, message) => {
        setStatus({ type, message });
        window.setTimeout(() => setStatus(current => (current.message === message ? { type: 'idle', message: '' } : current)), 2500);
    }, []);

    const save = useCallback(async (cle, patch) => {
        try {
            const { data } = await axiosClient.put(`/site-content/${encodeURIComponent(cle)}`, patch);
            setContent(current => {
                const next = { ...current };
                if (data.texte == null && data.offsetX == null && data.offsetY == null) delete next[cle];
                else next[cle] = data;
                return next;
            });
            flash('ok', 'Modification enregistrée');
            return true;
        } catch (err) {
            flash('error', apiErrorMessage(err, 'Enregistrement impossible'));
            return false;
        }
    }, [flash]);

    const reset = useCallback(async prefixe => {
        try {
            await axiosClient.delete('/site-content', { params: prefixe ? { prefixe } : {} });
            const { data } = await axiosClient.get('/site-content');
            setContent(data || {});
            flash('ok', prefixe ? 'Page remise à l’origine' : 'Site remis à l’origine');
        } catch (err) {
            flash('error', apiErrorMessage(err, 'Réinitialisation impossible'));
        }
    }, [flash]);

    const value = useMemo(() => ({ content, editMode: active, canEdit, toggleEditMode, save, reset, status }),
        [content, active, canEdit, toggleEditMode, save, reset, status]);
    return <SiteContentContext.Provider value={value}>{children}</SiteContentContext.Provider>;
}

// eslint-disable-next-line react-refresh/only-export-components
export function useSiteContent() {
    const context = useContext(SiteContentContext);
    if (!context) throw new Error('useSiteContent doit être utilisé dans un SiteContentProvider');
    return context;
}
