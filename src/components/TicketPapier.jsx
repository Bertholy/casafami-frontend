import { Check } from 'lucide-react';

/**
 * Présentation « ticket de caisse » d'un document à l'écran (même esprit que le reçu d'un transfert d'argent mobile) : papier blanc aux bords dentelés,
 * coche verte, titre, référence et date, champs empilés (libellé gris au-dessus, valeur en gras), montant total en grand, puis les boutons d'action sous le papier.
 * Il ne change QUE l'affichage : les documents PDF et image téléchargés restent ceux de utils/receipt.js et utils/proforma.js.
 *
 * lignes : [{ libelle, valeur, detail?, mono?, gras? }] ; total : { libelle, valeur, detail? } ; pied : texte discret sous le papier ;
 * children : contenu libre à l'intérieur du papier (par exemple un code à scanner) ; actions : boutons posés sous le ticket.
 */
export default function TicketPapier({ titre, reference, lignes = [], total, pied, children, actions, className = '' }) {
    return (
        <div className={`ticket-boite ${className}`}>
            <div className="ticket-ombre">
                <article className="ticket-papier" aria-label={titre}>
                    <div className="ticket-coche" aria-hidden="true"><Check size={34} strokeWidth={3} /></div>
                    <h2 className="ticket-titre">{titre}</h2>
                    {reference && <p className="ticket-reference">{reference}</p>}
                    <hr className="ticket-trait" />
                    <dl className="ticket-champs">
                        {lignes.map(({ libelle, valeur, detail, mono, gras = true }, i) => (
                            <div key={`${libelle}-${i}`} className="ticket-champ">
                                <dt>{libelle}</dt>
                                <dd className={`${mono ? 'ticket-mono' : ''} ${gras ? '' : 'ticket-normal'}`}>{valeur}</dd>
                                {detail && <dd className="ticket-detail">{detail}</dd>}
                            </div>
                        ))}
                    </dl>
                    {total && (
                        <>
                            <hr className="ticket-trait" />
                            <div className="ticket-champ">
                                <dt>{total.libelle}</dt>
                                <dd className="ticket-total">{total.valeur}</dd>
                                {total.detail && <dd className="ticket-detail">{total.detail}</dd>}
                            </div>
                            <hr className="ticket-trait" />
                        </>
                    )}
                    {children}
                    {pied && <p className="ticket-pied">{pied}</p>}
                </article>
            </div>
            {actions && <div className="ticket-actions">{actions}</div>}
        </div>
    );
}

/** Classes d'un bouton « pilule » contour fin posé sous le ticket (Télécharger, Partager). */
export const pilule = 'inline-flex items-center justify-center gap-2 rounded-full border border-teal-700 bg-transparent px-5 py-2 text-sm font-semibold text-teal-800 transition hover:bg-teal-50 disabled:opacity-50 dark:border-teal-300 dark:text-teal-200 dark:hover:bg-teal-500/10';
