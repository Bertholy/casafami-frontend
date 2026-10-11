import { createContext, useContext, useEffect, useState } from 'react';
import axiosClient from '../api/axiosClient';

const DEFAULT_THEME = {
    primaryColor: '#0f766e', secondaryColor: '#14b8a6', buttonColor: '#0f766e', linkColor: '#0f766e',
    backgroundColor: '#ffffff', panelColor: '#f8fafc', textColor: '#1f2937', navColor: '#0f172a',
    sidebarColor: '#0f172a', borderColor: '#e2e8f0',
};
const ThemeContext = createContext(null);
const CSS_KEYS = {
    primaryColor: '--casafami-primary', secondaryColor: '--casafami-secondary', buttonColor: '--casafami-button',
    linkColor: '--casafami-link', backgroundColor: '--casafami-background', panelColor: '--casafami-panel',
    textColor: '--casafami-text', navColor: '--casafami-nav', sidebarColor: '--casafami-sidebar', borderColor: '--casafami-border',
};

export function ThemeProvider({ children }) {
    const [theme, setTheme] = useState(() => localStorage.getItem('theme') || (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'));
    const [siteTheme, setSiteTheme] = useState(() => {
        try { return { ...DEFAULT_THEME, ...JSON.parse(localStorage.getItem('siteTheme') || '{}') }; }
        catch { return DEFAULT_THEME; }
    });

    useEffect(() => {
        axiosClient.get('/theme').then(({ data }) => setSiteTheme(current => ({ ...current, ...data }))).catch(() => {});
    }, []);
    useEffect(() => {
        const root = document.documentElement;
        root.classList.toggle('dark', theme === 'dark');
        localStorage.setItem('theme', theme);
        Object.entries(CSS_KEYS).forEach(([key, property]) => root.style.setProperty(property, siteTheme[key] || DEFAULT_THEME[key]));
        // Site public : la couleur d'origine du cabinet (vert) laisse la place au bleu du bâtiment (design « montagne ») ;
        // une couleur choisie par le super administrateur dans « Couleurs du site » est en revanche respectée.
        [['primaryColor', '--site-primary'], ['buttonColor', '--site-button'], ['linkColor', '--site-link']].forEach(([key, property]) => {
            const valeur = siteTheme[key];
            if (valeur && valeur.toLowerCase() !== DEFAULT_THEME[key].toLowerCase()) root.style.setProperty(property, valeur);
            else root.style.removeProperty(property);
        });
        localStorage.setItem('siteTheme', JSON.stringify(siteTheme));
    }, [theme, siteTheme]);

    return <ThemeContext.Provider value={{ theme, toggleTheme: () => setTheme(value => value === 'light' ? 'dark' : 'light'), siteTheme, setSiteTheme, defaultSiteTheme: DEFAULT_THEME }}>{children}</ThemeContext.Provider>;
}

// eslint-disable-next-line react-refresh/only-export-components
export function useTheme() {
    const context = useContext(ThemeContext);
    if (!context) throw new Error('useTheme doit être utilisé dans un ThemeProvider');
    return context;
}
