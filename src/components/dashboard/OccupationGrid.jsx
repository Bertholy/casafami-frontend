import { STATUS, getRoleLabel } from '../../constants/app';
import { cn } from '../../lib/utils';

/**
 * Occupation du personnel pour une journée : une ligne par personne, une colonne par créneau.
 * Créneau libre : un petit point vert discret ; créneau occupé : un bloc rouge clair « RDV » (le nom du patient et le statut sont dans l'info-bulle).
 * La colonne `surligne` (le créneau du rendez-vous) est teintée, son en-tête en gras avec un soulignement de la couleur primaire.
 * La colonne des noms reste fixe quand la grille défile horizontalement. Une ligne ambre « À répartir » montre les rendez-vous sans personne attribuée.
 * Les couleurs viennent des jetons du design system (primary, success, destructive, warning) : rien n'est codé en dur.
 */
export default function OccupationGrid({ data, surligne, rdvId }) {
    if (!data) return null;
    const { creneaux, personnel, sansPraticien } = data;
    if (!personnel.length) return <p className="rounded-xl bg-muted p-4 text-center text-sm text-muted-foreground">Aucun membre du personnel (médecin, sage-femme) n’est encore enregistré.</p>;
    if (!creneaux.length) return <p className="rounded-xl bg-muted p-4 text-center text-sm text-muted-foreground">Le cabinet est fermé ce jour-là : aucun créneau.</p>;

    const colonne = heure => cn('px-1.5 py-2 text-center', heure === surligne && 'bg-primary/10');
    return (
        <div className="overflow-x-auto rounded-xl border border-border">
            <table className="w-full min-w-max border-collapse text-xs">
                <caption className="sr-only">Occupation du personnel, créneau par créneau. Un point vert indique un créneau libre, « RDV » un créneau occupé.</caption>
                <thead>
                    <tr className="bg-muted">
                        <th scope="col" className="sticky left-0 z-10 bg-muted px-3 py-2 text-left font-semibold text-foreground">Personnel</th>
                        {creneaux.map(h => (
                            <th key={h} scope="col" aria-current={h === surligne ? 'true' : undefined}
                                className={cn(colonne(h), 'border-b-2 font-medium tabular-nums', h === surligne ? 'border-primary font-bold text-foreground' : 'border-transparent text-muted-foreground')}>{h}</th>
                        ))}
                    </tr>
                </thead>
                <tbody className="divide-y divide-border">
                    {personnel.map(p => (
                        <tr key={p.id}>
                            <th scope="row" className="sticky left-0 z-10 bg-card px-3 py-2 text-left font-medium text-foreground">
                                <div className="max-w-40 truncate">{p.nom}</div>
                                <div className="text-[11px] font-normal text-muted-foreground">{getRoleLabel(p.role)} · {p.total} rendez-vous</div>
                            </th>
                            {creneaux.map(h => {
                                const cellule = p.occupations[h];
                                const st = cellule && (STATUS[cellule.statut] || STATUS.EN_ATTENTE);
                                return (
                                    <td key={h} className={colonne(h)}>
                                        {cellule
                                            ? <span title={`${cellule.patient} — ${st.label}`} aria-label={`Occupé : ${cellule.patient}, ${st.label}`}
                                                className={cn('block rounded-md bg-destructive-soft px-1.5 py-1 font-semibold text-destructive-soft-foreground', cellule.rdvId === rdvId && 'ring-2 ring-primary')}>RDV</span>
                                            : <span role="img" aria-label="Libre" className="mx-auto block size-1.5 rounded-full bg-success opacity-70" />}
                                    </td>
                                );
                            })}
                        </tr>
                    ))}
                    <tr className="bg-warning-soft">
                        <th scope="row" className="sticky left-0 z-10 bg-warning-soft px-3 py-2 text-left font-medium text-warning-soft-foreground">À répartir<div className="text-[11px] font-normal">sans personne attribuée</div></th>
                        {creneaux.map(h => {
                            const liste = sansPraticien[h] || [];
                            const nom = liste.length > 1 ? `${liste.length} patients` : liste[0]?.patient;
                            const celuiCi = liste.some(r => r.rdvId === rdvId);
                            return (
                                <td key={h} className={cn(colonne(h), h === surligne && 'bg-primary/15')}>
                                    {liste.length > 0 && (
                                        <span title={liste.map(r => r.patient).join(', ')}
                                            className={cn('block max-w-28 truncate rounded-md border px-1.5 py-1 font-semibold', celuiCi || h === surligne ? 'border-primary bg-card text-foreground' : 'border-transparent bg-card/70 text-warning-soft-foreground')}>{nom}</span>
                                    )}
                                </td>
                            );
                        })}
                    </tr>
                </tbody>
            </table>
        </div>
    );
}
