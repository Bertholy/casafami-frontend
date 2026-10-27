import { useEffect } from 'react';
import { Loader2 } from 'lucide-react';
import { debutChargement, finChargement } from '../utils/progression';

/** Page en cours de chargement (Suspense) : un petit indicateur rond au centre, sans squelette de mise en page. */
export default function ChargementPage({ personnel = false }) {
    // affichée pendant le chargement d'une page : la barre de progression du haut suit sa durée
    useEffect(() => { debutChargement(); return finChargement; }, []);
    return (
        <div role="status" aria-busy="true" className={`flex min-h-[60vh] items-center justify-center text-slate-400 dark:text-gray-500 ${personnel ? 'theme-staff bg-(--st-page) lg:pl-60' : ''}`}>
            <Loader2 aria-hidden="true" size={26} className="animate-spin" />
            <span className="sr-only">Chargement…</span>
        </div>
    );
}
