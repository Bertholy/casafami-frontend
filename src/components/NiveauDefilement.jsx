import { useEffect, useRef, useState } from 'react';
import { ArrowUp } from 'lucide-react';

const SEUIL_BOUTON = 480;   // px de défilement à partir desquels le bouton « haut de page » apparaît
const RAYON = 18;
const CIRCONFERENCE = 2 * Math.PI * RAYON;

/**
 * Niveau de défilement : une fine barre en haut de l'écran qui se remplit au fil de la lecture,
 * et un bouton rond (avec le même niveau en anneau) pour remonter en haut de la page.
 * `decalageGauche` réserve la place d'une barre latérale fixe (espace du personnel).
 */
export default function NiveauDefilement({ decalageGauche = false }) {
    const barre = useRef(null);
    const anneau = useRef(null);
    const [visible, setVisible] = useState(false);
    const [pourcent, setPourcent] = useState(0);

    useEffect(() => {
        let image = 0;
        const mesurer = () => {
            image = 0;
            const racine = document.documentElement;
            const total = racine.scrollHeight - racine.clientHeight;
            const niveau = total > 0 ? Math.min(1, Math.max(0, window.scrollY / total)) : 0;
            if (barre.current) barre.current.style.transform = `scaleX(${niveau})`;
            if (anneau.current) anneau.current.style.strokeDashoffset = String(CIRCONFERENCE * (1 - niveau));
            setVisible(window.scrollY > SEUIL_BOUTON);
            setPourcent(Math.round(niveau * 100));
        };
        const surDefilement = () => { if (!image) image = window.requestAnimationFrame(mesurer); };
        mesurer();
        window.addEventListener('scroll', surDefilement, { passive: true });
        window.addEventListener('resize', surDefilement);
        return () => { window.removeEventListener('scroll', surDefilement); window.removeEventListener('resize', surDefilement); if (image) window.cancelAnimationFrame(image); };
    }, []);

    const remonter = () => {
        const reduit = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        window.scrollTo({ top: 0, behavior: reduit ? 'auto' : 'smooth' });
    };

    return (
        <>
            <div aria-hidden="true" className="pointer-events-none fixed inset-x-0 top-0 z-[60] h-[3px]">
                <div ref={barre} className="h-full origin-left bg-(--mt-main,#01bdda)" style={{ transform: 'scaleX(0)' }} />
            </div>
            <button type="button" onClick={remonter} aria-label={`Remonter en haut de la page (${pourcent} % lu)`} tabIndex={visible ? 0 : -1}
                className={`fixed bottom-4 left-4 z-50 flex h-11 w-11 items-center justify-center rounded-full bg-white text-slate-700 shadow-md ring-1 ring-slate-200 transition duration-200 hover:text-(--mt-main,#01bdda) dark:bg-gray-900 dark:text-gray-200 dark:ring-gray-700 ${decalageGauche ? 'lg:left-64' : ''} ${visible ? 'translate-y-0 opacity-100' : 'pointer-events-none translate-y-3 opacity-0'}`}>
                <svg viewBox="0 0 44 44" className="absolute inset-0 -rotate-90" aria-hidden="true">
                    <circle cx="22" cy="22" r={RAYON} fill="none" strokeWidth="2.5" className="stroke-slate-200 dark:stroke-gray-700" />
                    <circle ref={anneau} cx="22" cy="22" r={RAYON} fill="none" strokeWidth="2.5" strokeLinecap="round" strokeDasharray={CIRCONFERENCE} strokeDashoffset={CIRCONFERENCE} className="stroke-(--mt-main,#01bdda)" />
                </svg>
                <ArrowUp size={17} aria-hidden="true" />
            </button>
        </>
    );
}
