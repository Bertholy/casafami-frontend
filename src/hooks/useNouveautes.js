import { useCallback, useEffect, useRef, useState } from 'react';
import axiosClient from '../api/axiosClient';
import { getEmail } from '../utils/auth';

/** Pages du menu qui affichent un petit nombre de nouveautés (même noms que dans l'API /nouveautes). */
const SECTIONS = ['rdv', 'calendrier', 'corbeille', 'dossiers', 'maternite', 'journal'];

/** Page ouverte → section du menu dont les nouveautés sont alors « vues ». */
export function sectionDePage(pathname) {
    if (['/admin/dashboard', '/medecin/dashboard', '/espace/sage-femme', '/espace/secretariat'].includes(pathname)) return 'rdv';
    return { '/calendrier': 'calendrier', '/corbeille': 'corbeille', '/patients/dossier': 'dossiers', '/patients/maternite': 'maternite', '/admin/journal': 'journal' }[pathname] || null;
}

const cle = () => `vu:${getEmail().toLowerCase()}`;
const lire = () => { try { return JSON.parse(localStorage.getItem(cle()) || '{}') || {}; } catch { return {}; } };
const ecrire = valeur => { try { localStorage.setItem(cle(), JSON.stringify(valeur)); } catch { /* stockage indisponible : les nombres repartent de zéro */ } };

/**
 * Petits nombres du menu : ce qui est nouveau depuis la dernière visite de chaque page (heure de visite gardée dans ce navigateur,
 * par personne ; la référence est l'heure du serveur). La page ouverte est considérée comme vue : son nombre reste à 0.
 * « aAccepter » n'est pas une nouveauté mais un état (rendez-vous confiés, pas encore acceptés).
 */
export default function useNouveautes(sectionOuverte) {
    const [comptes, setComptes] = useState({});
    const ouverte = useRef(sectionOuverte);
    useEffect(() => { ouverte.current = sectionOuverte; }, [sectionOuverte]);

    const rafraichir = useCallback(async () => {
        const vus = lire();
        const params = {};
        SECTIONS.forEach(section => { if (vus[section]) params[section] = vus[section]; });
        try {
            const { data } = await axiosClient.get('/nouveautes', { params });
            let change = false;
            SECTIONS.forEach(section => {
                // première fois (ou page ouverte en ce moment) : on part de maintenant, sans compter tout l'historique
                if ((!vus[section] && section in data) || section === ouverte.current) { vus[section] = data.maintenant; change = true; }
            });
            if (change) ecrire(vus);
            setComptes(ouverte.current ? { ...data, [ouverte.current]: 0 } : data);
        } catch { /* le menu s'affiche sans nombres */ }
    }, []);

    useEffect(() => {
        const premier = window.setTimeout(rafraichir, 0);
        const minuteur = window.setInterval(() => { if (document.visibilityState === 'visible') rafraichir(); }, 30000);
        window.addEventListener('focus', rafraichir);
        return () => { window.clearTimeout(premier); window.clearInterval(minuteur); window.removeEventListener('focus', rafraichir); };
    }, [rafraichir]);

    return section => Number(comptes[section]) || 0;
}
