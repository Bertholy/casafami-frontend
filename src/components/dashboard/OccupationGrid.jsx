import { STATUS, getRoleLabel } from '../../constants/app';

/**
 * Occupation du personnel pour une journée : une ligne par personne, une colonne par créneau.
 * Case vide = libre ; case colorée = occupée (nom du patient). La colonne `surligne` met en avant le créneau d'un rendez-vous.
 * Une ligne « À répartir » montre les rendez-vous qui n'ont pas encore de personne attribuée.
 */
export default function OccupationGrid({ data, surligne, rdvId }) {
    if (!data) return null;
    const { creneaux, personnel, sansPraticien } = data;
    if (!personnel.length) return <p className="rounded-xl bg-slate-50 p-4 text-center text-sm text-slate-500 dark:bg-gray-800">Aucun membre du personnel (médecin, sage-femme) n’est encore enregistré.</p>;
    if (!creneaux.length) return <p className="rounded-xl bg-slate-50 p-4 text-center text-sm text-slate-500 dark:bg-gray-800">Le cabinet est fermé ce jour-là : aucun créneau.</p>;

    const colonne = heure => `px-1.5 py-2 text-center ${heure === surligne ? 'bg-teal-50 dark:bg-teal-500/10' : ''}`;
    return (
        <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-gray-800">
            <table className="w-full min-w-max border-collapse text-xs">
                <thead className="bg-slate-50 dark:bg-gray-800/60">
                    <tr>
                        <th scope="col" className="sticky left-0 z-10 bg-slate-50 px-3 py-2 text-left font-semibold dark:bg-gray-800">Personnel</th>
                        {creneaux.map(h => <th key={h} scope="col" className={`${colonne(h)} font-semibold tabular-nums ${h === surligne ? 'text-teal-800 dark:text-teal-300' : 'text-slate-500 dark:text-gray-400'}`}>{h}</th>)}
                    </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-gray-800">
                    {personnel.map(p => (
                        <tr key={p.id}>
                            <th scope="row" className="sticky left-0 z-10 bg-white px-3 py-2 text-left font-medium dark:bg-gray-900">
                                <div className="max-w-40 truncate">{p.nom}</div>
                                <div className="text-[10px] font-normal text-slate-500 dark:text-gray-400">{getRoleLabel(p.role)} · {p.total} rendez-vous</div>
                            </th>
                            {creneaux.map(h => {
                                const cellule = p.occupations[h];
                                const st = cellule && (STATUS[cellule.statut] || STATUS.EN_ATTENTE);
                                return (
                                    <td key={h} className={colonne(h)}>
                                        {cellule
                                            ? <span title={`${cellule.patient} — ${st.label}`} className={`block max-w-24 truncate rounded-md px-1.5 py-1 font-medium ${st.badge} ${cellule.rdvId === rdvId ? 'ring-2 ring-teal-600' : ''}`}>{cellule.patient}</span>
                                            : <span className="block rounded-md border border-dashed border-emerald-300 px-1.5 py-1 text-emerald-700 dark:border-emerald-500/40 dark:text-emerald-300" aria-label="libre">libre</span>}
                                    </td>
                                );
                            })}
                        </tr>
                    ))}
                    <tr className="bg-amber-50/40 dark:bg-amber-500/5">
                        <th scope="row" className="sticky left-0 z-10 bg-amber-50 px-3 py-2 text-left font-medium text-amber-900 dark:bg-gray-900 dark:text-amber-200">À répartir<div className="text-[10px] font-normal">sans personne attribuée</div></th>
                        {creneaux.map(h => {
                            const liste = sansPraticien[h] || [];
                            return (
                                <td key={h} className={colonne(h)}>
                                    {liste.length > 0 && <span title={liste.map(r => r.patient).join(', ')} className={`block max-w-24 truncate rounded-md bg-amber-100 px-1.5 py-1 font-medium text-amber-900 dark:bg-amber-500/20 dark:text-amber-200 ${liste.some(r => r.rdvId === rdvId) ? 'ring-2 ring-teal-600' : ''}`}>{liste.length > 1 ? `${liste.length} patients` : liste[0].patient}</span>}
                                </td>
                            );
                        })}
                    </tr>
                </tbody>
            </table>
        </div>
    );
}
