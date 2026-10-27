import { Suspense } from 'react';

/** Affiche un graphique chargé à la demande (la bibliothèque de graphiques est lourde) avec un emplacement réservé pendant le chargement. */
export default function GrapheDiffere({ hauteur = 'h-44', children }) {
    return (
        <Suspense fallback={<div aria-hidden="true" className={hauteur} />}>
            {children}
        </Suspense>
    );
}
