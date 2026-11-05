import { Fragment } from 'react';
import { PRISES, ecrirePrises, libelleQuantite, precedenteQuantite, prisesDuJour, prochaineQuantite } from '../utils/posologie';

/**
 * Les trois prises de la journée d'un médicament, dans le style des étapes de la page de réservation : le mot (Matin, Midi, Soir) au-dessus, puis une boule avec le nombre d'unités.
 * La boule est blanche à 0 et devient bleue dès qu'il y a une prise. On la règle de deux façons, qui se suivent l'une l'autre :
 *  - en cliquant sur la boule (0 → 1 → 2 → 3 → ½ → 0 ; Maj + clic ou flèche du bas pour revenir en arrière) : la posologie est réécrite avec ce choix, sans perdre le texte libre ;
 *  - en écrivant la posologie à côté (« 1 matin », « 1 cp matin et soir ») : les boules se mettent à jour.
 * Le texte de la posologie reste la seule source (aperçu, impression, enregistrement). Sans `onChange`, les boules s'affichent seulement.
 * `compact` : petite version, pour l'aperçu de l'ordonnance (boules allumées uniquement).
 */
export default function PrisesDuJour({ posologie, onChange, compact = false, className = '' }) {
    const prises = prisesDuJour(posologie);
    const modifiable = typeof onChange === 'function' && !compact;
    const regler = (cle, quantite) => onChange(ecrirePrises(posologie, { ...prises, [cle]: quantite }));

    if (compact) {
        const allumees = PRISES.filter(([cle]) => prises[cle] > 0);
        if (allumees.length === 0) return null;
        return (
            <span role="group" aria-label="Prises dans la journée" className={`flex flex-wrap items-center gap-2 ${className}`}>
                {allumees.map(([cle, libelle]) => (
                    <span key={cle} className="inline-flex items-center gap-1 text-xs text-slate-600 dark:text-gray-300">
                        {libelle}
                        <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-(--mt-main) px-1 text-[11px] font-bold tabular-nums text-(--mt-sur-main)">{libelleQuantite(prises[cle])}</span>
                    </span>
                ))}
            </span>
        );
    }

    return (
        <div className={className}>
            <div role="group" aria-label="Prises dans la journée" className="flex items-start">
                {PRISES.map(([cle, libelle], i) => {
                    const quantite = prises[cle];
                    const active = quantite > 0;
                    const classes = `flex h-9 w-9 items-center justify-center rounded-full text-sm font-bold tabular-nums transition-colors ${active ? 'bg-(--mt-main) text-(--mt-sur-main)' : 'border-2 border-[#cbd5e1] bg-[#ffffff] text-slate-400 dark:border-[#374151] dark:bg-[#111827] dark:text-gray-500'}`;
                    const etiquette = active ? `${libelle} : ${libelleQuantite(quantite)}` : `${libelle} : aucune prise`;
                    return (
                        <Fragment key={cle}>
                            {i > 0 && <span aria-hidden="true" className={`mt-[2.35rem] h-0.5 w-8 shrink-0 transition-colors sm:w-12 ${active && prises[PRISES[i - 1][0]] > 0 ? 'bg-(--mt-main)' : 'bg-slate-200 dark:bg-gray-700'}`} />}
                            <div className="flex w-14 shrink-0 flex-col items-center gap-1.5 text-center">
                                <span className={`text-xs font-medium transition-colors ${active ? 'text-(--mt-main-fort) dark:text-(--mt-main)' : 'text-slate-500 dark:text-gray-400'}`}>{libelle}</span>
                                {modifiable ? (
                                    <button type="button" aria-label={`${etiquette}. Cliquer pour changer la quantité`} title="Cliquer pour changer la quantité (Maj + clic pour reculer)"
                                        onClick={event => regler(cle, event.shiftKey ? precedenteQuantite(quantite) : prochaineQuantite(quantite))}
                                        onKeyDown={event => {
                                            if (event.key === 'ArrowUp' || event.key === 'ArrowRight') { event.preventDefault(); regler(cle, prochaineQuantite(quantite)); }
                                            if (event.key === 'ArrowDown' || event.key === 'ArrowLeft') { event.preventDefault(); regler(cle, precedenteQuantite(quantite)); }
                                        }}
                                        className={`${classes} rounded-full! cursor-pointer select-none hover:brightness-95 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--mt-main)`}>
                                        {active ? libelleQuantite(quantite) : 0}
                                    </button>
                                ) : (
                                    <span aria-label={etiquette} className={classes}>{active ? libelleQuantite(quantite) : 0}</span>
                                )}
                            </div>
                        </Fragment>
                    );
                })}
            </div>
            {modifiable && <p className="mt-1 text-xs text-slate-500 dark:text-gray-400">Cliquez sur une boule pour changer la quantité : la posologie s’écrit toute seule.</p>}
        </div>
    );
}
