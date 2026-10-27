import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { CalendarPlus, ChevronLeft, ChevronRight, Loader2 } from 'lucide-react';
import axiosClient from '../api/axiosClient';
import AdminLayout from '../components/AdminLayout';
import Notice from '../components/Notice';
import { STATUS, formatDateFr, hhmm, todayISO } from '../constants/app';
import { btnPrimary, btnSecondary, card } from '../constants/ui';
import { apiErrorMessage, getRole, hasSession, homeForRole, LOGIN_PATH, peut } from '../utils/auth';

const ENTETES = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];

const monthKey = date => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
const iso = date => date.toLocaleDateString('en-CA');

/** Calendrier mensuel : nombre de rendez-vous par jour, jours fermés, détail du jour sélectionné. */
export default function Calendrier() {
    const navigate = useNavigate();
    const role = getRole();
    const today = todayISO();
    const [mois, setMois] = useState(() => new Date(`${today.slice(0, 7)}-01T12:00:00`));
    const [rdvs, setRdvs] = useState([]);
    const [fermes, setFermes] = useState([]);
    const [horaires, setHoraires] = useState([]);
    const [selection, setSelection] = useState(today);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    const key = monthKey(mois);
    const load = useCallback(async () => {
        setLoading(true); setError('');
        try {
            const [calendrier, planning] = await Promise.all([axiosClient.get('/rdv/calendrier', { params: { mois: key } }), axiosClient.get('/planning')]);
            setRdvs(calendrier.data.rendezVous); setFermes(calendrier.data.joursFermes); setHoraires(planning.data.horaires);
        } catch (err) { setError(apiErrorMessage(err, 'Impossible de charger le calendrier.')); }
        finally { setLoading(false); }
    }, [key]);

    useEffect(() => {
        if (!hasSession()) { navigate(LOGIN_PATH); return undefined; }
        const timer = window.setTimeout(load, 0);
        return () => window.clearTimeout(timer);
    }, [load, navigate]);

    const parJour = useMemo(() => {
        const map = {};
        for (const rdv of rdvs) (map[rdv.dateRdv] ||= []).push(rdv);
        return map;
    }, [rdvs]);
    const fermesParJour = useMemo(() => Object.fromEntries(fermes.map(f => [f.date, f.motif || 'Fermé'])), [fermes]);

    // Grille : semaines complètes (lundi → dimanche) qui couvrent le mois
    const cases = useMemo(() => {
        const premier = new Date(mois.getFullYear(), mois.getMonth(), 1, 12);
        const decalage = (premier.getDay() + 6) % 7;
        const total = Math.ceil((decalage + new Date(mois.getFullYear(), mois.getMonth() + 1, 0).getDate()) / 7) * 7;
        return Array.from({ length: total }, (_, i) => new Date(mois.getFullYear(), mois.getMonth(), 1 - decalage + i, 12));
    }, [mois]);

    const ouvert = date => horaires.find(h => h.jourSemaine === ((date.getDay() + 6) % 7) + 1)?.ouvert ?? true;
    const jourSelectionne = (parJour[selection] || []).slice().sort((a, b) => hhmm(a.heureRdv).localeCompare(hhmm(b.heureRdv)));
    const selectionOuverte = ouvert(new Date(`${selection}T12:00:00`)) && !fermesParJour[selection];
    const peutOuvrirDossier = peut('DOSSIERS_LIRE');
    const canCreate = selection >= today && selectionOuverte;
    const changerMois = delta => setMois(current => new Date(current.getFullYear(), current.getMonth() + delta, 1, 12));

    return (
        <AdminLayout title="Calendrier" subtitle="Vue mensuelle des rendez-vous">
            <Notice tone="error" onClose={() => setError('')}>{error}</Notice>
            <div className="grid gap-6 xl:grid-cols-[1fr_360px]">
                <section className={`${card} p-4 sm:p-5`}>
                    <div className="mb-4 flex items-center justify-between">
                        <h2 className="text-lg font-semibold capitalize">{mois.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })}</h2>
                        <div className="flex items-center gap-2">
                            {loading && <Loader2 size={16} className="animate-spin text-slate-400" />}
                            <button onClick={() => { setMois(new Date(`${today.slice(0, 7)}-01T12:00:00`)); setSelection(today); }} className={btnSecondary}>Aujourd’hui</button>
                            <button onClick={() => changerMois(-1)} aria-label="Mois précédent" className="rounded-xl border border-slate-200 p-2.5 hover:bg-slate-50 dark:border-gray-700 dark:hover:bg-gray-800"><ChevronLeft size={16} /></button>
                            <button onClick={() => changerMois(1)} aria-label="Mois suivant" className="rounded-xl border border-slate-200 p-2.5 hover:bg-slate-50 dark:border-gray-700 dark:hover:bg-gray-800"><ChevronRight size={16} /></button>
                        </div>
                    </div>
                    <div className="grid grid-cols-7 gap-1 text-center text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-gray-400">
                        {ENTETES.map(e => <div key={e} className="py-2">{e}</div>)}
                    </div>
                    <div className="grid grid-cols-7 gap-1">
                        {cases.map(date => {
                            const d = iso(date);
                            const dansLeMois = date.getMonth() === mois.getMonth();
                            const liste = parJour[d] || [];
                            const actifs = liste.filter(r => r.statut !== 'ANNULE');
                            const attente = actifs.filter(r => r.statut === 'EN_ATTENTE').length;
                            const ferme = fermesParJour[d];
                            const nonTravaille = !ouvert(date);
                            const estSelection = d === selection;
                            return (
                                <button key={d} onClick={() => setSelection(d)} aria-pressed={estSelection}
                                    aria-label={`${formatDateFr(d, { weekday: 'long', day: 'numeric', month: 'long' })} : ${actifs.length} rendez-vous${ferme ? ', cabinet fermé' : ''}`}
                                    className={`relative flex min-h-16 flex-col items-start rounded-xl border p-1.5 text-left transition sm:min-h-24 sm:p-2 ${estSelection ? 'border-teal-600 ring-2 ring-teal-600/30' : 'border-slate-200 hover:border-teal-400 dark:border-gray-800'} ${dansLeMois ? 'bg-white dark:bg-gray-900' : 'bg-slate-50 opacity-50 dark:bg-gray-950'} ${ferme || nonTravaille ? 'bg-[repeating-linear-gradient(45deg,transparent,transparent_6px,rgba(148,163,184,.12)_6px,rgba(148,163,184,.12)_12px)]' : ''}`}>
                                    <span className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-semibold tabular-nums ${d === today ? 'bg-teal-700 text-white' : ''}`}>{date.getDate()}</span>
                                    {ferme && <span className="mt-1 hidden truncate text-[10px] font-medium text-slate-500 sm:block" title={ferme}>{ferme}</span>}
                                    {actifs.length > 0 && (
                                        <span className="mt-auto flex flex-wrap items-center gap-1">
                                            <span className="rounded-full bg-teal-100 px-1.5 text-[11px] font-bold tabular-nums text-teal-800 dark:bg-teal-500/20 dark:text-teal-200">{actifs.length}</span>
                                            {attente > 0 && <span className="hidden rounded-full bg-amber-100 px-1.5 text-[10px] font-semibold text-amber-800 sm:inline dark:bg-amber-500/20 dark:text-amber-200">{attente} en cours</span>}
                                        </span>
                                    )}
                                </button>
                            );
                        })}
                    </div>
                    <p className="mt-3 text-xs text-slate-500 dark:text-gray-400">Les cases hachurées sont les jours où le cabinet est fermé (jour non travaillé ou fermeture exceptionnelle).</p>
                </section>

                <aside className={`${card} h-fit p-5`} aria-live="polite">
                    <h2 className="font-semibold capitalize">{formatDateFr(selection, { weekday: 'long', day: 'numeric', month: 'long' })}</h2>
                    {!selectionOuverte && <p className="mt-1 text-sm text-slate-500">Cabinet fermé{fermesParJour[selection] ? ` : ${fermesParJour[selection]}` : ' (jour non travaillé)'}.</p>}
                    {jourSelectionne.length === 0 ? <p className="mt-4 text-sm text-slate-500 dark:text-gray-400">Aucun rendez-vous ce jour-là.</p> : (
                        <ul className="mt-4 space-y-2">
                            {jourSelectionne.map(rdv => {
                                const st = STATUS[rdv.statut] || STATUS.EN_ATTENTE;
                                return (
                                    <li key={rdv.id} className="flex items-center gap-3 rounded-xl border border-slate-200 p-3 dark:border-gray-800">
                                        <span className="w-12 text-sm font-semibold tabular-nums">{hhmm(rdv.heureRdv)}</span>
                                        <div className="min-w-0 flex-1"><div className="truncate text-sm font-medium">{peutOuvrirDossier ? <Link to={`/patients/dossier?telephone=${encodeURIComponent(rdv.telephoneClient)}`} className="hover:text-teal-700 hover:underline">{rdv.nomClient}</Link> : rdv.nomClient}</div><div className="truncate text-xs text-slate-500 dark:text-gray-400">{rdv.serviceNom || 'Service non précisé'}{rdv.praticienNom ? ` · ${rdv.praticienNom}` : ''}</div></div>
                                        <span className={`inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[11px] font-semibold ${st.badge}`}><span className={`h-1.5 w-1.5 rounded-full ${st.dot}`} />{st.label}</span>
                                    </li>
                                );
                            })}
                        </ul>
                    )}
                    {canCreate && (
                        <button onClick={() => navigate(homeForRole(role), { state: { create: true, date: selection } })} className={`${btnPrimary} mt-5 w-full`}><CalendarPlus size={16} />Nouveau rendez-vous ce jour</button>
                    )}
                </aside>
            </div>
        </AdminLayout>
    );
}
