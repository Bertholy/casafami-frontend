import { Children, useCallback, useEffect, useRef, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useSiteContent } from '../../context/SiteContentContext';
import { useLang } from '../../i18n/LangContext';

const PAUSE_MS = 4200;

/** Nombre de cartes visibles selon la largeur disponible. */
function visibles(largeur) { return largeur >= 960 ? 3 : largeur >= 600 ? 2 : 1; }

/**
 * Carrousel qui fait défiler ses cartes de la droite vers la gauche, en boucle, tout seul (il s'arrête quand on le survole ou
 * qu'on le touche, et si l'appareil demande moins d'animations). Deux flèches permettent d'avancer ou de revenir.
 * S'il y a peu de cartes (elles tiennent toutes à l'écran), elles s'affichent simplement côte à côte. Pendant la modification
 * du site, les cartes sont affichées à plat pour que chaque texte reste facile à modifier.
 */
export default function Carrousel({ children, label }) {
    const { t } = useLang();
    const { editMode } = useSiteContent();
    const cartes = Children.toArray(children);
    const n = cartes.length;
    const conteneur = useRef(null);
    const [v, setV] = useState(3);
    const [index, setIndex] = useState(0);
    const [anime, setAnime] = useState(true);     // false = repositionnement instantané (boucle)
    const [pause, setPause] = useState(false);
    const [reduit, setReduit] = useState(false);
    const actif = !editMode && n > v;

    useEffect(() => {
        const mesure = () => setV(visibles(conteneur.current?.clientWidth || window.innerWidth));
        mesure();
        const observateur = new ResizeObserver(mesure);
        if (conteneur.current) observateur.observe(conteneur.current);
        const requete = window.matchMedia('(prefers-reduced-motion: reduce)');
        const surReduit = () => setReduit(requete.matches);
        surReduit(); requete.addEventListener('change', surReduit);
        return () => { observateur.disconnect(); requete.removeEventListener('change', surReduit); };
    }, []);

    const avancer = useCallback(() => { setAnime(true); setIndex(i => i + 1); }, []);
    const reculer = useCallback(() => {
        if (index > 0) { setAnime(true); setIndex(i => i - 1); return; }
        // au début : on se place sans animation sur la copie de fin, puis on recule d'un cran avec animation
        setAnime(false); setIndex(n);
        window.requestAnimationFrame(() => window.requestAnimationFrame(() => { setAnime(true); setIndex(n - 1); }));
    }, [index, n]);

    useEffect(() => {
        if (!actif || pause || reduit) return undefined;
        const minuteur = window.setInterval(avancer, PAUSE_MS);
        return () => window.clearInterval(minuteur);
    }, [actif, pause, reduit, avancer]);

    // arrivé sur la copie du début : retour invisible au vrai début
    const finDeTransition = () => { if (index >= n) { setAnime(false); setIndex(0); } };

    if (!actif) {
        return (
            <div ref={conteneur} className={`grid gap-8 ${v === 1 ? 'grid-cols-1' : v === 2 ? 'grid-cols-2' : n >= 4 ? 'grid-cols-4' : 'grid-cols-3'} max-sm:grid-cols-1`}>
                {cartes}
            </div>
        );
    }

    const piste = [...cartes, ...cartes.slice(0, v)];
    const largeurCarte = 100 / v;
    const fleche = 'absolute top-[28%] z-10 flex h-11 w-11 items-center justify-center rounded-full bg-white/95 text-teal-700 ring-1 ring-slate-200 transition hover:bg-teal-600 hover:text-white dark:bg-gray-800/95 dark:ring-gray-700 dark:text-teal-300 dark:hover:bg-teal-600 dark:hover:text-white';

    return (
        <div ref={conteneur} className="relative" role="region" aria-roledescription="carrousel" aria-label={label}
            onMouseEnter={() => setPause(true)} onMouseLeave={() => setPause(false)} onFocus={() => setPause(true)} onBlur={() => setPause(false)}
            onTouchStart={() => setPause(true)} onTouchEnd={() => window.setTimeout(() => setPause(false), 6000)}>
            <div className="overflow-hidden">
                <div className="flex" onTransitionEnd={finDeTransition}
                    style={{ transform: `translateX(-${index * largeurCarte}%)`, transition: anime ? 'transform 700ms cubic-bezier(.65,0,.35,1)' : 'none' }}>
                    {piste.map((carte, i) => (
                        <div key={i} aria-hidden={i >= n ? true : undefined} className="shrink-0 px-3" style={{ width: `${largeurCarte}%` }}>{carte}</div>
                    ))}
                </div>
            </div>
            <button type="button" onClick={reculer} aria-label={t('Précédent')} className={`${fleche} -left-2 sm:-left-5`}><ChevronLeft size={22} /></button>
            <button type="button" onClick={avancer} aria-label={t('Suivant')} className={`${fleche} -right-2 sm:-right-5`}><ChevronRight size={22} /></button>
        </div>
    );
}
