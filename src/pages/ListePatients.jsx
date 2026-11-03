import { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Baby, FolderOpen, Loader2, Mars, PersonStanding, Search, User, Users, Venus } from 'lucide-react';
import axiosClient from '../api/axiosClient';
import AdminLayout from '../components/AdminLayout';
import Notice from '../components/Notice';
import { card, inputClass } from '../constants/ui';
import { apiErrorMessage, hasSession, LOGIN_PATH, peut } from '../utils/auth';
import { civiliteSelonAge } from '../utils/civilite';
import { formatPhone } from '../utils/phone';

const jour = iso => (iso ? new Date(`${iso}T12:00:00`).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' }) : '—');
const FILTRES = [['', 'Tous'], ['NOUVEAU', 'Nouveaux'], ['ANCIEN', 'Anciens']];
const CATEGORIES = [['FEMME', 'Femmes', Venus], ['HOMME', 'Hommes', Mars], ['ADOLESCENT', 'Adolescents', PersonStanding], ['ENFANT', 'Enfants', Baby], ['NON_PRECISE', 'Non précisé', User]];

/** Le voyant d'un patient : même code que dans les formulaires (vert = déjà venu plusieurs fois, rouge = nouveau, un seul passage). */
function Etat({ nouveau, passages }) {
    return (
        <span className={`inline-flex items-center gap-2 rounded-full px-2.5 py-1 text-xs font-semibold ${nouveau ? 'bg-rose-50 text-rose-700 dark:bg-rose-500/10 dark:text-rose-300' : 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300'}`}
            title={nouveau ? 'Un seul passage : nouveau patient' : `${passages} passages : patient existant`}>
            <span className="relative flex h-2.5 w-2.5" aria-hidden="true">
                {!nouveau && <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-60 motion-reduce:animate-none" />}
                <span className={`relative inline-flex h-2.5 w-2.5 rounded-full ${nouveau ? 'bg-rose-500' : 'bg-emerald-500'}`} />
            </span>
            {nouveau ? 'Nouveau' : 'Ancien'}
        </span>
    );
}

/**
 * La liste des patients du cabinet (réservée au personnel, le patient ne voit rien de tout cela) : un patient par ligne, avec le voyant « nouveau » (un seul passage)
 * ou « ancien » (plusieurs), son nombre de passages et son dernier passage, et en haut le décompte des nouveaux, des anciens, des femmes, des hommes et des enfants.
 * Un patient est reconnu à son nom et à son numéro ; seuls les rendez-vous non annulés comptent comme des passages.
 */
export default function ListePatients() {
    const navigate = useNavigate();
    const [filtre, setFiltre] = useState('');
    const [recherche, setRecherche] = useState('');
    const [donnees, setDonnees] = useState(null);
    const [erreur, setErreur] = useState('');
    const [charge, setCharge] = useState(false);
    const dossiers = peut('DOSSIERS_LIRE');

    const charger = useCallback(async (q, statut) => {
        setCharge(true);
        try {
            const { data } = await axiosClient.get('/patients/liste', { params: { q: q || undefined, statut: statut || undefined } });
            setDonnees(data); setErreur('');
        } catch (err) {
            setErreur([404, 405].includes(err.response?.status) ? 'Le serveur n’est pas à jour : redémarrez le backend pour afficher la liste des patients.' : apiErrorMessage(err, 'Impossible de charger la liste des patients.'));
        } finally { setCharge(false); }
    }, []);

    useEffect(() => {
        if (!hasSession()) { navigate(LOGIN_PATH); return undefined; }
        const minuteur = window.setTimeout(() => charger(recherche.trim(), filtre), recherche ? 300 : 0);
        return () => window.clearTimeout(minuteur);
    }, [charger, navigate, recherche, filtre]);

    const patients = donnees?.patients || [];
    const tuiles = donnees ? [
        { cle: 'total', libelle: 'Patients', valeur: donnees.total, icone: <Users size={15} aria-hidden="true" /> },
        { cle: 'nouveaux', libelle: 'Nouveaux', valeur: donnees.nouveaux, icone: <span className="h-2.5 w-2.5 rounded-full bg-rose-500" aria-hidden="true" /> },
        { cle: 'anciens', libelle: 'Anciens', valeur: donnees.anciens, icone: <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" aria-hidden="true" /> },
        ...CATEGORIES.filter(([code]) => code !== 'NON_PRECISE' || donnees.parCategorie[code] > 0).map(([code, libelle, Icone]) => ({ cle: code, libelle, valeur: donnees.parCategorie[code], icone: <Icone size={15} aria-hidden="true" /> })),
    ] : [];

    return (
        <AdminLayout title="Liste des patients" subtitle="Nouveaux et anciens patients du cabinet">
            {() => <>
                {erreur && <Notice tone="error" onClose={() => setErreur('')}>{erreur}</Notice>}

                {donnees && (
                    <ul className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-7" aria-label="Décompte des patients">
                        {tuiles.map(({ cle, libelle, valeur, icone }) => (
                            <li key={cle} className={`${card} px-3.5 py-3`}>
                                <span className="flex items-center gap-2 text-xs text-slate-500 dark:text-gray-400">{icone}{libelle}</span>
                                <span className="mt-0.5 block text-xl font-bold tabular-nums">{valeur}</span>
                            </li>
                        ))}
                    </ul>
                )}

                <section className={`${card} p-4 sm:p-5`}>
                    <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                        <label className="relative block w-full max-w-sm">
                            <span className="sr-only">Rechercher un patient</span>
                            <Search size={16} aria-hidden="true" className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                            <input type="search" value={recherche} onChange={e => setRecherche(e.target.value)} placeholder="Nom ou téléphone…" autoComplete="off" className={`${inputClass} pl-9`} />
                        </label>
                        <div role="group" aria-label="Filtrer les patients" className="flex items-center gap-2">
                            {charge && <Loader2 size={16} className="animate-spin text-slate-400" aria-hidden="true" />}
                            {FILTRES.map(([code, libelle]) => (
                                <button key={code || 'tous'} type="button" aria-pressed={filtre === code} onClick={() => setFiltre(code)}
                                    className={`rounded-full px-3 py-1.5 text-xs font-medium transition ${filtre === code ? 'bg-teal-700 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700'}`}>{libelle}</button>
                            ))}
                        </div>
                    </div>

                    {donnees === null && !erreur ? <p className="flex items-center gap-2 rounded-lg bg-slate-50 p-4 text-sm text-slate-500 dark:bg-gray-800"><Loader2 size={16} className="animate-spin" />Chargement…</p>
                        : patients.length === 0 ? <p className="rounded-lg bg-slate-50 p-4 text-sm text-slate-600 dark:bg-gray-800 dark:text-gray-300">{recherche || filtre ? 'Aucun patient ne correspond.' : 'Aucun patient pour le moment : ils apparaissent ici dès leur premier rendez-vous.'}</p>
                            : (
                                <div className="overflow-x-auto">
                                    <table className="w-full min-w-[40rem] text-sm">
                                        <thead>
                                            <tr className="text-left text-xs uppercase tracking-wide text-slate-500 dark:text-gray-400">
                                                <th className="pb-2 pr-3 font-semibold">Patient</th>
                                                <th className="pb-2 pr-3 font-semibold">Téléphone</th>
                                                <th className="pb-2 pr-3 text-right font-semibold">Passages</th>
                                                <th className="hidden pb-2 pr-3 font-semibold md:table-cell">Dernier passage</th>
                                                <th className="pb-2 pr-3 font-semibold">Statut</th>
                                                <th className="pb-2 text-right font-semibold"><span className="sr-only">Ouvrir</span></th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-200 dark:divide-gray-800">
                                            {patients.map(p => (
                                                <tr key={`${p.nom}-${p.telephone}`} className="align-middle">
                                                    <td className="py-3 pr-3">
                                                        <p className="font-medium">{p.nom}</p>
                                                        <p className="text-xs text-slate-500 dark:text-gray-400">{[civiliteSelonAge(p.age, p.sexe), p.age != null ? `${p.age} an${p.age > 1 ? 's' : ''}` : null].filter(Boolean).join(' · ')}</p>
                                                    </td>
                                                    <td className="whitespace-nowrap py-3 pr-3 tabular-nums text-slate-600 dark:text-gray-300">{formatPhone(p.telephone)}</td>
                                                    <td className="py-3 pr-3 text-right font-semibold tabular-nums">{p.passages}</td>
                                                    <td className="hidden whitespace-nowrap py-3 pr-3 text-slate-600 md:table-cell dark:text-gray-300">{jour(p.dernierPassage)}</td>
                                                    <td className="py-3 pr-3"><Etat nouveau={p.nouveau} passages={p.passages} /></td>
                                                    <td className="py-3 text-right">
                                                        {dossiers
                                                            ? <Link to={`/patients/dossier?telephone=${encodeURIComponent(p.telephone)}`} aria-label={`Ouvrir le dossier de ${p.nom}`} title="Dossier du patient" className="inline-flex rounded-lg p-2 text-slate-500 transition hover:bg-slate-100 dark:hover:bg-gray-800"><FolderOpen size={16} /></Link>
                                                            : <Link to={`/mes-rdv?q=${encodeURIComponent(p.telephone)}`} className="text-xs font-medium text-teal-700 hover:underline dark:text-teal-300">Rendez-vous</Link>}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                    {donnees?.tronque && <p className="mt-3 text-xs text-slate-500 dark:text-gray-400">Les 500 patients les plus récents sont affichés : précisez la recherche pour trouver les autres.</p>}
                    <p className="mt-4 text-xs text-slate-500 dark:text-gray-400">« Nouveau » : un seul passage au cabinet. « Ancien » : plusieurs passages. Un patient est reconnu à son nom et à son numéro de téléphone ; les rendez-vous annulés ne comptent pas.</p>
                </section>
            </>}
        </AdminLayout>
    );
}
