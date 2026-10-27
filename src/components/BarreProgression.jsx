import { useEffect, useRef, useState } from 'react';
import { surChargement } from '../utils/progression';

const DELAI_AFFICHAGE = 250;   // ms : un chargement plus rapide n'affiche pas la barre (pas de scintillement pour les actualisations discrètes)

/**
 * Barre de progression du haut de l'écran : elle apparaît quand une page ou des données mettent un peu de temps à arriver,
 * avance vite puis de plus en plus lentement (on ne connaît pas la durée), file à 100 % dès que tout est arrivé, puis s'efface.
 * Elle est abonnée à utils/progression.js (requêtes du serveur et pages chargées à la demande).
 */
export default function BarreProgression() {
    const [largeur, setLargeur] = useState(0);
    const [visible, setVisible] = useState(false);
    const minuteurs = useRef({ delai: 0, avance: 0, fin: 0 });

    useEffect(() => {
        const t = minuteurs.current;
        const arreter = () => { window.clearTimeout(t.delai); window.clearInterval(t.avance); window.clearTimeout(t.fin); };

        const desabonner = surChargement(enCours => {
            if (enCours) {
                if (t.avance || t.delai) return;   // déjà lancé
                window.clearTimeout(t.fin);
                t.delai = window.setTimeout(() => {
                    t.delai = 0;
                    setVisible(true);
                    setLargeur(12);
                    t.avance = window.setInterval(() => setLargeur(courant => courant + (92 - courant) * 0.12), 220);
                }, DELAI_AFFICHAGE);
            } else {
                const etaitAffichee = Boolean(t.avance);
                window.clearTimeout(t.delai); window.clearInterval(t.avance);
                t.delai = 0; t.avance = 0;
                if (!etaitAffichee) return;   // fini avant l'apparition de la barre : rien à montrer
                setLargeur(100);
                t.fin = window.setTimeout(() => { setVisible(false); t.fin = window.setTimeout(() => setLargeur(0), 300); }, 280);
            }
        });
        return () => { desabonner(); arreter(); };
    }, []);

    return (
        <div aria-hidden="true" className="pointer-events-none fixed inset-x-0 top-0 z-[90] h-[3px]">
            <div className="h-full origin-left rounded-r-full bg-(--mt-main,#03cce6) shadow-[0_0_10px_var(--mt-main,#03cce6)] transition-[width,opacity] duration-300 ease-out motion-reduce:transition-none"
                style={{ width: `${largeur}%`, opacity: visible ? 1 : 0 }} />
        </div>
    );
}
