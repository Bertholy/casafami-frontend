import { Loader2 } from 'lucide-react';
import { cn } from '../../lib/utils';

/*
 * Plus de squelettes gris qui pulsent : pendant un chargement, la page n'affiche qu'un petit indicateur rond discret.
 * Les noms des composants sont gardés pour que les pages n'aient pas à changer ; `Skeleton` (un bloc isolé) n'affiche plus rien.
 */

/** Ancien bloc gris : ne dessine plus rien. */
// eslint-disable-next-line no-unused-vars
export function Skeleton(props) {
    return null;
}

/** Indicateur de chargement : un petit cercle qui tourne, annoncé « Chargement… » aux lecteurs d'écran. */
function Chargement({ className, label = 'Chargement…' }) {
    return (
        <div role="status" aria-busy="true" className={cn('flex items-center justify-center py-10 text-slate-400 dark:text-gray-500', className)}>
            <Loader2 aria-hidden="true" size={22} className="animate-spin" />
            <span className="sr-only">{label}</span>
        </div>
    );
}

/** Liste de lignes (patients, événements, conversations…). */
export function SkeletonList({ className }) {
    return <Chargement className={className} />;
}

/** Tableau. */
export function SkeletonTable({ className }) {
    return <Chargement className={className} />;
}

/** Cartes (services, galeries). */
export function SkeletonCards({ className }) {
    return <Chargement className={className} />;
}

/** Page de texte (fiches, formulaires, réglages). */
export function SkeletonPage({ className }) {
    return <Chargement className={className} />;
}
