import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import axiosClient from '../api/axiosClient';
import { apiErrorMessage, hasSession, peut } from '../utils/auth';

/**
 * Éditeur du site public. Tous les visiteurs reçoivent les textes, mises en forme et positions personnalisés ;
 * seul le super administrateur peut activer le « mode édition » : un clic sur un texte ouvre la fenêtre de modification,
 * la poignée ✥ déplace un bouton, « Ajouter un texte » crée un nouveau bloc. Chaque modification est enregistrée aussitôt
 * sur le serveur et peut être annulée (bouton « Annuler »).
 */
const SiteContentContext = createContext(null);
const EDIT_KEY = 'site-edit-mode';
const HISTORIQUE_MAX = 30;

export function SiteContentProvider({ children }) {
    const location = useLocation();
    const navigate = useNavigate();
    const [content, setContent] = useState({});
    const [editMode, setEditMode] = useState(() => {
        try { return sessionStorage.getItem(EDIT_KEY) === '1'; } catch { return false; }
    });
    const [status, setStatus] = useState({ type: 'idle', message: '' });
    const [historique, setHistorique] = useState([]);   // modifications annulables : [[{ cle, avant }], …]
    const [editeur, setEditeur] = useState(null);       // fenêtre de modification ouverte (ou null)
    const canEdit = hasSession() && peut('SITE_MODIFIER');

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
        setEditeur(null);
    }, []);

    const flash = useCallback((type, message) => {
        setStatus({ type, message });
        window.setTimeout(() => setStatus(current => (current.message === message ? { type: 'idle', message: '' } : current)), 2800);
    }, []);

    const appliquer = useCallback((cle, valeur) => setContent(current => {
        const next = { ...current };
        if (!valeur || (valeur.texte == null && valeur.offsetX == null && valeur.offsetY == null && !valeur.style)) delete next[cle];
        else next[cle] = valeur;
        return next;
    }), []);

    const memoriser = useCallback(lignes => setHistorique(current => [...current.slice(-(HISTORIQUE_MAX - 1)), lignes]), []);

    /** Enregistre le texte, la position ou la mise en forme d'un élément. `suivre: false` : pas d'entrée dans l'historique. */
    const save = useCallback(async (cle, patch, { suivre = true } = {}) => {
        const avant = content[cle] ?? null;
        try {
            const { data } = await axiosClient.put(`/site-content/${encodeURIComponent(cle)}`, patch);
            appliquer(cle, data);
            if (suivre) memoriser([{ cle, avant }]);
            flash('ok', 'Modification enregistrée');
            return true;
        } catch (err) {
            flash('error', apiErrorMessage(err, 'Enregistrement impossible'));
            return false;
        }
    }, [content, appliquer, memoriser, flash]);

    /** Supprime la personnalisation d'un ou plusieurs éléments (texte d'origine, ou texte ajouté supprimé). */
    const supprimer = useCallback(async (...cles) => {
        const lignes = cles.filter(cle => content[cle]).map(cle => ({ cle, avant: content[cle] }));
        try {
            for (const { cle } of lignes) await axiosClient.delete(`/site-content/${encodeURIComponent(cle)}`);
            lignes.forEach(({ cle }) => appliquer(cle, null));
            if (lignes.length) memoriser(lignes);
            flash('ok', 'Texte remis à l’origine');
            return true;
        } catch (err) {
            flash('error', apiErrorMessage(err, 'Suppression impossible'));
            return false;
        }
    }, [content, appliquer, memoriser, flash]);

    /** Annule la dernière modification (texte, mise en forme, position, ajout ou suppression). */
    const annuler = useCallback(async () => {
        const dernier = historique[historique.length - 1];
        if (!dernier) return;
        try {
            for (const { cle, avant } of dernier) {
                if (!avant) {
                    await axiosClient.delete(`/site-content/${encodeURIComponent(cle)}`);
                    appliquer(cle, null);
                } else {
                    const { data } = await axiosClient.put(`/site-content/${encodeURIComponent(cle)}`, {
                        texte: avant.texte ?? '', offsetX: avant.offsetX ?? 0, offsetY: avant.offsetY ?? 0, style: avant.style ?? {},
                    });
                    appliquer(cle, data);
                }
            }
            setHistorique(current => current.slice(0, -1));
            flash('ok', 'Dernière modification annulée');
        } catch (err) {
            flash('error', apiErrorMessage(err, 'Annulation impossible'));
        }
    }, [historique, appliquer, flash]);

    const reset = useCallback(async (...prefixes) => {
        try {
            for (const prefixe of prefixes) await axiosClient.delete('/site-content', { params: prefixe ? { prefixe } : {} });
            const { data } = await axiosClient.get('/site-content');
            setContent(data || {});
            setHistorique([]);
            flash('ok', prefixes[0] ? 'Page remise à l’origine' : 'Site remis à l’origine');
        } catch (err) {
            flash('error', apiErrorMessage(err, 'Réinitialisation impossible'));
        }
    }, [flash]);

    const ouvrirEditeur = useCallback(options => setEditeur(options), []);
    const fermerEditeur = useCallback(() => setEditeur(null), []);

    const value = useMemo(() => ({
        content, editMode: active, canEdit, toggleEditMode, save, supprimer, annuler, peutAnnuler: historique.length > 0, reset, status,
        editeur, ouvrirEditeur, fermerEditeur,
    }), [content, active, canEdit, toggleEditMode, save, supprimer, annuler, historique.length, reset, status, editeur, ouvrirEditeur, fermerEditeur]);
    return <SiteContentContext.Provider value={value}>{children}</SiteContentContext.Provider>;
}

// eslint-disable-next-line react-refresh/only-export-components
export function useSiteContent() {
    const context = useContext(SiteContentContext);
    if (!context) throw new Error('useSiteContent doit être utilisé dans un SiteContentProvider');
    return context;
}
