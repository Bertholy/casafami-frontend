import { useCallback, useEffect, useState } from 'react';

// Style de l'espace du personnel : « neumorphisme » (par défaut), « encoche » ou « console », mémorisé sur cet appareil.
// « console » est l'ancien aspect ; les deux autres s'activent par une classe du même nom sur <html>
// (voir staff-neumorphisme.css et staff-encoche.css) : elle atteint aussi les fenêtres et menus affichés hors de la page (portails).
// La clé porte un numéro : un ancien choix, enregistré automatiquement avant que le défaut change, n'écrase pas le nouveau défaut.
const CLE = 'style-personnel-3';
const STYLES = ['neumorphisme', 'encoche', 'console'];
const AVEC_CLASSE = ['encoche', 'neumorphisme'];

const lire = () => {
    try { const valeur = localStorage.getItem(CLE); return STYLES.includes(valeur) ? valeur : STYLES[0]; }
    catch { return STYLES[0]; }
};

export function useStylePersonnel() {
    const [style, setStyle] = useState(lire);

    useEffect(() => {
        AVEC_CLASSE.forEach(nom => document.documentElement.classList.toggle(nom, style === nom));
        try { localStorage.setItem(CLE, style); } catch { /* le choix ne sera pas gardé : pas grave */ }
        // en quittant l'espace du personnel (site public), le style ne doit pas suivre
        return () => AVEC_CLASSE.forEach(nom => document.documentElement.classList.remove(nom));
    }, [style]);

    // neumorphisme → encoche → console → neumorphisme
    const suivant = STYLES[(STYLES.indexOf(style) + 1) % STYLES.length];
    const basculerStyle = useCallback(() => setStyle(s => STYLES[(STYLES.indexOf(s) + 1) % STYLES.length]), []);
    return { style, suivant, basculerStyle };
}
