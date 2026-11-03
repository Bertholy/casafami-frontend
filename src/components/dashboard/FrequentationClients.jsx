import { useEffect, useState } from 'react';
import { Baby, History, Mars, PersonStanding, User, UserPlus, Users, Venus } from 'lucide-react';
import axiosClient from '../../api/axiosClient';

const ICONES = { FEMME: Venus, HOMME: Mars, ADOLESCENT: PersonStanding, ENFANT: Baby, NON_PRECISE: User };
const card = 'rounded-lg border border-slate-200 bg-white dark:border-gray-800 dark:bg-gray-900';

/**
 * Fréquentation de la période choisie sur le tableau de bord (réservé à qui voit les statistiques) : combien de passages, de clients nouveaux et anciens,
 * et combien de femmes, d'hommes et d'enfants. Un « passage » est un rendez-vous non annulé ; un client est « nouveau » à son premier passage au cabinet.
 * `rafraichir` change quand la liste des rendez-vous est rechargée : les chiffres suivent.
 */
export default function FrequentationClients({ debut, fin, libellePeriode, rafraichir }) {
    const [donnees, setDonnees] = useState(null);

    useEffect(() => {
        let actif = true;
        axiosClient.get('/stats/synthese', { params: { debut, fin } })
            .then(({ data }) => { if (actif) setDonnees(data.frequentation || null); })
            .catch(() => { if (actif) setDonnees(null); });
        return () => { actif = false; };
    }, [debut, fin, rafraichir]);

    if (!donnees) return null;
    const categories = donnees.parCategorie.filter(c => c.code !== 'NON_PRECISE' || c.patients > 0);
    const totaux = [
        { cle: 'passages', libelle: 'Passages', valeur: donnees.passages, icone: Users, aide: 'Rendez-vous non annulés' },
        { cle: 'nouveaux', libelle: 'Nouveaux clients', valeur: donnees.nouveaux, icone: UserPlus, aide: 'Premier passage au cabinet' },
        { cle: 'anciens', libelle: 'Anciens clients', valeur: donnees.anciens, icone: History, aide: 'Déjà venus avant' },
    ];
    return (
        <section aria-label="Fréquentation" className={`${card} p-4`}>
            <div className="mb-3 flex flex-wrap items-baseline justify-between gap-x-3">
                <h2 className="text-sm font-semibold">Fréquentation · <span className="text-teal-700 dark:text-teal-300">{libellePeriode}</span></h2>
                <p className="text-xs text-slate-500 dark:text-gray-400">{donnees.patients} client{donnees.patients > 1 ? 's' : ''} différent{donnees.patients > 1 ? 's' : ''}</p>
            </div>
            <div className="grid gap-4 lg:grid-cols-2">
                <ul className="grid grid-cols-3 gap-2">
                    {totaux.map(({ cle, libelle, valeur, icone: Icone, aide }) => (
                        <li key={cle} title={aide} className="rounded-lg bg-slate-50 px-3 py-2.5 dark:bg-gray-800/60">
                            <span className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-gray-400"><Icone size={14} aria-hidden="true" />{libelle}</span>
                            <span className="mt-0.5 block text-xl font-bold tabular-nums">{valeur}</span>
                        </li>
                    ))}
                </ul>
                <ul className={`grid gap-2 ${categories.length > 4 ? 'grid-cols-2 sm:grid-cols-5' : categories.length > 3 ? 'grid-cols-2 sm:grid-cols-4' : 'grid-cols-3'}`}>
                    {categories.map(c => {
                        const Icone = ICONES[c.code] || User;
                        return (
                            <li key={c.code} title={`${c.patients} client${c.patients > 1 ? 's' : ''} : ${c.nouveaux} nouveau${c.nouveaux > 1 ? 'x' : ''}, ${c.anciens} ancien${c.anciens > 1 ? 's' : ''} · ${c.passages} passage${c.passages > 1 ? 's' : ''}`}
                                className="rounded-lg bg-slate-50 px-3 py-2.5 dark:bg-gray-800/60">
                                <span className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-gray-400"><Icone size={14} aria-hidden="true" />{c.libelle}</span>
                                <span className="mt-0.5 flex items-baseline gap-1.5">
                                    <span className="text-xl font-bold tabular-nums">{c.patients}</span>
                                    <span className="text-[11px] text-slate-500 dark:text-gray-400">{c.nouveaux} nouv. · {c.anciens} anc.</span>
                                </span>
                            </li>
                        );
                    })}
                </ul>
            </div>
        </section>
    );
}
