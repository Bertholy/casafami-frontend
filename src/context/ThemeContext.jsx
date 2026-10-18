import { createContext, useContext, useEffect, useState } from 'react';
import axiosClient from '../api/axiosClient';

const DEFAULT_THEME = {
    primaryColor: '#03cce6', secondaryColor: '#5be3f5', buttonColor: '#03cce6', linkColor: '#0794a8',
    backgroundColor: '#ffffff', panelColor: '#f8fafc', textColor: '#1f2937', navColor: '#0f172a',
    sidebarColor: '#0f172a', borderColor: '#e2e8f0',
};
// Anciennes couleurs d'origine (vert du premier design, bleu de la version précédente) : elles sont enregistrées chez les
// visiteurs et en base, mais ne sont pas un choix du super administrateur ; on les traite comme « pas de couleur choisie ».
const COULEURS_PAR_DEFAUT = new Set(['#0f766e', '#14b8a6', '#0a8fc7', '#03cce6', '#5be3f5', '#0794a8']);
const ThemeContext = createContext(null);

/** Texte lisible sur une couleur de fond : bleu nuit sur une couleur claire (comme le cyan), blanc sur une couleur foncée. */
function texteSur(couleur) {
    const m = /^#?([0-9a-f]{6})$/i.exec(String(couleur || '').trim());
    if (!m) return '#05303a';
    const [r, g, b] = [0, 2, 4].map(i => parseInt(m[1].slice(i, i + 2), 16) / 255).map(v => (v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4));
    return 0.2126 * r + 0.7152 * g + 0.0722 * b > 0.3 ? '#05303a' : '#ffffff';
}
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
            const surProperty = property.replace('--site-', '--site-sur-');
            if (valeur && !COULEURS_PAR_DEFAUT.has(valeur.toLowerCase())) { root.style.setProperty(property, valeur); root.style.setProperty(surProperty, texteSur(valeur)); }
            else { root.style.removeProperty(property); root.style.removeProperty(surProperty); }
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
