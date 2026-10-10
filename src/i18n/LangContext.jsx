import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { estEspacePersonnel } from '../constants/routes';
import { traduire } from './traduire';

/**
 * Langue du site public : français (par défaut) ou malgache.
 * Les textes écrits dans le code sont en français ; `t('texte français')` donne la version malgache si elle existe dans
 * `mg.js`, sinon le texte français (jamais de texte vide ni de clé technique à l'écran).
 * Les espaces du personnel restent en français.
 */
const LangContext = createContext(null);
const STORAGE_KEY = 'langue';

export function LangProvider({ children }) {
    const { pathname } = useLocation();
    const [choisie, setLangState] = useState(() => {
        try { return localStorage.getItem(STORAGE_KEY) === 'mg' ? 'mg' : 'fr'; } catch { return 'fr'; }
    });
    // Les espaces du personnel restent en français, quelle que soit la langue choisie sur le site public.
    const lang = estEspacePersonnel(pathname) ? 'fr' : choisie;

    useEffect(() => { document.documentElement.lang = lang; }, [lang]);

    const setLang = useCallback(valeur => {
        const suivante = valeur === 'mg' ? 'mg' : 'fr';
        setLangState(suivante);
        try { localStorage.setItem(STORAGE_KEY, suivante); } catch { /* stockage indisponible : la langue n'est pas mémorisée */ }
    }, []);

    const t = useCallback((texte, variables) => traduire(lang, texte, variables), [lang]);
    const value = useMemo(() => ({ lang, setLang, t }), [lang, setLang, t]);
    return <LangContext.Provider value={value}>{children}</LangContext.Provider>;
}

// eslint-disable-next-line react-refresh/only-export-components
export function useLang() {
    const context = useContext(LangContext);
    if (!context) throw new Error('useLang doit être utilisé dans un LangProvider');
    return context;
}
