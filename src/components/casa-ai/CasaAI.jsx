import { lazy, Suspense, useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { X } from 'lucide-react';
import { useLang } from '../../i18n/LangContext';
import MascotteCasaAI from './MascotteCasaAI';
import { salutation } from '../../utils/casaAI';

// Le panneau de discussion n'est chargé qu'à la première ouverture (il garde ensuite la conversation).
const PanneauChat = lazy(() => import('./PanneauChat'));

const CLE_BULLE = 'casaai-bulle-fermee';
const DELAI_BULLE = 3000;   // première apparition, après l'arrivée sur l'accueil
const DUREE_BULLE = 6000;   // la bulle reste visible 6 s…
const PERIODE_BULLE = 10000; // … puis revient toutes les 10 s

/**
 * CASA'AI, l'assistant IA de casafami : petit robot qui salue, fixé en bas à droite de l'écran sur toutes les pages du site public. Il ne bouge pas
 * quand on défile ni quand on change de page (ce composant reste monté dans App.jsx) et rebondit avec son ombre au sol.
 * Sur la page d'accueil, une bulle d'accueil apparaît 3 secondes après l'arrivée, reste 6 secondes, puis revient toutes les 10 secondes. Elle s'arrête
 * quand on l'a fermée (pour la visite en cours) ou quand le chat est ouvert, et réapparaît à la visite suivante.
 * Un clic sur le bouton ou sur la bulle ouvre la discussion. Styles : .casaai-* dans index.css.
 */
export default function CasaAI() {
    const { t } = useLang();
    const [ouvert, setOuvert] = useState(false);
    const [charge, setCharge] = useState(false);
    const [bulle, setBulle] = useState(false);

    const memoriserFermeture = () => { try { sessionStorage.setItem(CLE_BULLE, '1'); } catch { /* stockage indisponible : la bulle pourra revenir à la page suivante */ } };

    const { pathname } = useLocation();
    const surAccueil = pathname === '/';

    // cycle de la bulle : visible 6 s, cachée 4 s (soit une apparition toutes les 10 s), tant qu'on est sur l'accueil, que le chat est fermé et que la bulle n'a pas été fermée
    useEffect(() => {
        let fermee = false;
        try { fermee = sessionStorage.getItem(CLE_BULLE) === '1'; } catch { /* stockage indisponible : la bulle s'affiche */ }
        if (fermee || !surAccueil || ouvert) return undefined;
        let cacher; let revenir;
        const montrer = () => {
            setBulle(true);
            cacher = window.setTimeout(() => { setBulle(false); revenir = window.setTimeout(montrer, PERIODE_BULLE - DUREE_BULLE); }, DUREE_BULLE);
        };
        const debut = window.setTimeout(montrer, DELAI_BULLE);
        return () => { window.clearTimeout(debut); window.clearTimeout(cacher); window.clearTimeout(revenir); setBulle(false); };
    }, [surAccueil, ouvert]);

    const fermerBulle = () => { setBulle(false); memoriserFermeture(); };
    const ouvrir = () => { setCharge(true); if (bulle) fermerBulle(); setOuvert(valeur => !valeur); };

    return (
        <div className="casaai" data-ouvert={ouvert}>
            {bulle && !ouvert && (
                <div className="casaai-msg" role="status">
                    <button type="button" onClick={ouvrir} className="casaai-msg-texte">
                        {salutation(t)} {t("Je suis CASA'AI, l’assistant IA de casafami.")} {t("Je suis un robot, pas une personne.")} {t("Comment puis-je vous aider ?")}
                    </button>
                    <button type="button" onClick={fermerBulle} aria-label={t("Fermer")} className="casaai-msg-fermer"><X size={15} aria-hidden="true" /></button>
                </div>
            )}
            {charge && <Suspense fallback={null}><PanneauChat visible={ouvert} onFermer={() => setOuvert(false)} /></Suspense>}
            <button type="button" onClick={ouvrir} className="casaai-bouton" aria-label="Ouvrir le chat avec CASA'AI, l'assistant IA" aria-expanded={ouvert} aria-haspopup="dialog">
                <MascotteCasaAI className="h-full w-full" />
            </button>
            <span className="casaai-ombre" aria-hidden="true" />
        </div>
    );
}
