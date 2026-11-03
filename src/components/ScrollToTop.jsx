import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

/**
 * À chaque changement de page : retour en haut en douceur. Si l'adresse porte une ancre (#horaires, #faq-q-0-1…, lien venant de la recherche
 * du site), on défile jusqu'à l'élément visé ; les pages chargent leur contenu en différé, on le cherche donc pendant 2 secondes au plus.
 */
function ScrollToTop() {
    const { pathname, hash } = useLocation();

    useEffect(() => {
        const id = hash ? decodeURIComponent(hash.slice(1)) : '';
        if (!id) { window.scrollTo({ top: 0, behavior: 'smooth' }); return undefined; }
        let essais = 0;
        const chercher = window.setInterval(() => {
            const cible = document.getElementById(id);
            if (cible) { window.clearInterval(chercher); cible.scrollIntoView({ behavior: 'smooth', block: 'start' }); }
            else if (++essais > 20) window.clearInterval(chercher);
        }, 100);
        return () => window.clearInterval(chercher);
    }, [pathname, hash]);

    return null;  // Ce composant n'affiche rien
}

export default ScrollToTop;
