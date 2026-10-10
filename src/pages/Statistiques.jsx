import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Ban, CalendarDays, Loader2, UserPlus, Users } from 'lucide-react';
import axiosClient from '../api/axiosClient';
import AdminLayout from '../components/AdminLayout';
import ColumnChart from '../components/dashboard/ColumnChart';
import Notice from '../components/Notice';
import { STATUS, todayISO } from '../constants/app';
import { card } from '../constants/ui';
import { apiErrorMessage, getRole, hasSession, LOGIN_PATH, homeForRole } from '../utils/auth';

const ALLOWED = ['SUPER_ADMIN', 'MEDECIN', 'SECRETAIRE'];
const MOIS = ['janv.', 'févr.', 'mars', 'avr.', 'mai', 'juin', 'juil.', 'août', 'sept.', 'oct.', 'nov.', 'déc.'];
const JOURS = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];

function periodRange(key) {
    const today = new Date(`${todayISO()}T12:00:00`);
    const iso = date => date.toLocaleDateString('en-CA');
    const first = (y, m) => new Date(y, m, 1, 12);
    const last = (y, m) => new Date(y, m + 1, 0, 12);
    if (key === 'mois') return [iso(first(today.getFullYear(), today.getMonth())), iso(last(today.getFullYear(), today.getMonth()))];
    if (key === 'mois-precedent') return [iso(first(today.getFullYear(), today.getMonth() - 1)), iso(last(today.getFullYear(), today.getMonth() - 1))];
    if (key === 'trimestre') return [iso(first(today.getFullYear(), today.getMonth() - 2)), iso(last(today.getFullYear(), today.getMonth()))];
    return [iso(first(today.getFullYear(), 0)), iso(last(today.getFullYear(), 11))];
}

const PERIODES = [['mois', 'Ce mois'], ['mois-precedent', 'Mois précédent'], ['trimestre', '3 derniers mois'], ['annee', 'Cette année']];

/** Liste de barres horizontales (service, praticien…) : libellé, barre proportionnelle, valeur. */
function BarList({ items, empty = 'Aucune donnée sur cette période.' }) {
    if (!items.length) return <p className="py-6 text-center text-sm text-slate-500 dark:text-gray-400">{empty}</p>;
    const max = Math.max(...items.map(i => i.nombre), 1);
    return (
        <ul className="space-y-3">
            {items.map(item => (
                <li key={item.libelle}>
                    <div className="mb-1 flex items-baseline justify-between gap-3 text-sm"><span className="truncate">{item.libelle}</span><span className="font-semibold tabular-nums">{item.nombre}</span></div>
                    <div className="h-2.5 overflow-hidden rounded-full bg-slate-100 dark:bg-gray-800"><div className="h-full rounded-full bg-teal-600" style={{ width: `${(item.nombre / max) * 100}%` }} /></div>
                </li>
            ))}
        </ul>
    );
}

export default function Statistiques() {
    const navigate = useNavigate();
    const role = getRole();
    const [periode, setPeriode] = useState('mois');
    const [synthese, setSynthese] = useState(null);
    const [mensuel, setMensuel] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    const load = useCallback(async () => {
        setLoading(true); setError('');
        const [debut, fin] = periodRange(periode);
        try {
            const [s, m] = await Promise.all([
                axiosClient.get('/stats/synthese', { params: { debut, fin } }),
                axiosClient.get('/stats/mensuel', { params: { mois: 12 } }),
            ]);
            setSynthese(s.data); setMensuel(m.data);
        } catch (err) { setError(apiErrorMessage(err, 'Impossible de charger les statistiques.')); }
        finally { setLoading(false); }
    }, [periode]);

    useEffect(() => {
        if (!hasSession()) { navigate(LOGIN_PATH); return undefined; }
        if (!ALLOWED.includes(role)) { navigate(homeForRole(role)); return undefined; }
        const timer = window.setTimeout(load, 0);
        return () => window.clearTimeout(timer);
    }, [load, navigate, role]);

    const mois = useMemo(() => mensuel.map((m, index) => {
        const [annee, numero] = m.mois.split('-').map(Number);
        const actifs = m.total - m.ANNULE;
        return {
            key: m.mois, label: MOIS[numero - 1], sublabel: index === 0 || numero === 1 ? String(annee) : '', value: actifs, highlight: index === mensuel.length - 1,
            tooltip: [`${MOIS[numero - 1]} ${annee}`, `${actifs} rendez-vous (hors annulés)`, m.ANNULE ? `${m.ANNULE} annulé${m.ANNULE > 1 ? 's' : ''}` : 'Aucune annulation'],
        };
    }), [mensuel]);

    const jours = useMemo(() => JOURS.map((label, i) => {
        const trouve = synthese?.parJourSemaine.find(j => Number(j.libelle) === i + 1);
        const value = trouve?.nombre || 0;
        return { key: label, label, value, tooltip: [label, `${value} rendez-vous`] };
    }), [synthese]);

    const heures = useMemo(() => (synthese?.parHeure || []).map(h => ({ key: h.libelle, label: h.libelle, value: h.nombre, tooltip: [h.libelle, `${h.nombre} rendez-vous`] })), [synthese]);

    const kpis = synthese && [
        { label: 'Rendez-vous', value: synthese.total, icon: CalendarDays, tone: 'bg-teal-100 text-teal-700 dark:bg-teal-500/15 dark:text-teal-300' },
        { label: 'Patients distincts', value: synthese.patientsDistincts, icon: Users, tone: 'bg-sky-100 text-sky-700 dark:bg-sky-500/15 dark:text-sky-300' },
        { label: 'Nouveaux patients', value: synthese.nouveauxPatients, icon: UserPlus, tone: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300' },
        { label: 'Taux d’annulation', value: `${synthese.tauxAnnulation} %`, icon: Ban, tone: 'bg-rose-100 text-rose-700 dark:bg-rose-500/15 dark:text-rose-300' },
    ];
    const totalStatuts = synthese ? Object.values(synthese.parStatut).reduce((a, b) => a + b, 0) : 0;
    const couleurStatut = { EN_ATTENTE: 'bg-amber-500', CONFIRME: 'bg-emerald-500', TERMINE: 'bg-sky-500', ANNULE: 'bg-rose-500' };

    return (
        <AdminLayout title="Statistiques" subtitle="L’activité du cabinet en un coup d’œil">
            <div className="flex flex-wrap items-center justify-between gap-3">
                <div role="tablist" aria-label="Période" className="inline-flex flex-wrap rounded-xl bg-slate-100 p-1 dark:bg-gray-800">
                    {PERIODES.map(([key, label]) => (
                        <button key={key} role="tab" aria-selected={periode === key} onClick={() => setPeriode(key)}
                            className={`rounded-lg px-3 py-1.5 text-sm font-medium transition ${periode === key ? 'bg-white text-teal-800 shadow-sm dark:bg-gray-950 dark:text-teal-300' : 'text-slate-600 hover:text-slate-900 dark:text-gray-400'}`}>{label}</button>
                    ))}
                </div>
                {synthese && <p className="text-sm text-slate-500 dark:text-gray-400">Du {new Date(`${synthese.debut}T12:00:00`).toLocaleDateString('fr-FR')} au {new Date(`${synthese.fin}T12:00:00`).toLocaleDateString('fr-FR')}</p>}
            </div>

            <Notice tone="error" onClose={() => setError('')}>{error}</Notice>
            {loading && !synthese && <div className="flex items-center justify-center gap-2 p-12 text-sm text-slate-500"><Loader2 className="animate-spin" size={18} />Chargement…</div>}

            {synthese && (
                <>
                    <section className="grid grid-cols-2 gap-3 lg:grid-cols-4" aria-label="Indicateurs">
                        {kpis.map(({ label, value, icon: Icon, tone }) => (
                            <div key={label} className={`${card} p-4`}>
                                <div className="flex items-center justify-between"><span className="text-xs font-medium text-slate-500 dark:text-gray-400 sm:text-sm">{label}</span><span className={`rounded-xl p-2 ${tone}`}><Icon size={17} /></span></div>
                                <div className="mt-3 text-3xl font-bold tabular-nums">{value}</div>
                            </div>
                        ))}
                    </section>

                    <section className={`${card} p-5`}>
                        <h2 className="font-semibold">Répartition par statut</h2>
                        {totalStatuts === 0 ? <p className="py-6 text-center text-sm text-slate-500 dark:text-gray-400">Aucun rendez-vous sur cette période.</p> : (
                            <>
                                <div className="mt-4 flex h-4 gap-0.5 overflow-hidden rounded-full" role="img" aria-label={Object.entries(synthese.parStatut).map(([k, v]) => `${STATUS[k].label} : ${v}`).join(', ')}>
                                    {Object.entries(synthese.parStatut).filter(([, v]) => v > 0).map(([k, v]) => <div key={k} className={couleurStatut[k]} style={{ width: `${(v / totalStatuts) * 100}%` }} title={`${STATUS[k].label} : ${v}`} />)}
                                </div>
                                <ul className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
                                    {Object.entries(synthese.parStatut).map(([k, v]) => (
                                        <li key={k} className="flex items-center gap-2 text-sm"><span className={`h-3 w-3 rounded-full ${couleurStatut[k]}`} aria-hidden="true" /><span className="text-slate-600 dark:text-gray-300">{STATUS[k].label}</span><span className="ml-auto font-semibold tabular-nums">{v}</span></li>
                                    ))}
                                </ul>
                            </>
                        )}
                    </section>

                    <section className={`${card} p-5`}>
                        <div className="mb-4"><h2 className="font-semibold">Évolution sur 12 mois</h2><p className="text-xs text-slate-500 dark:text-gray-400">Rendez-vous par mois, hors annulés</p></div>
                        <ColumnChart items={mois} ariaLabel="Rendez-vous par mois" />
                    </section>

                    <section className="grid gap-6 lg:grid-cols-2">
                        <div className={`${card} p-5`}><h2 className="mb-4 font-semibold">Par service</h2><BarList items={synthese.parService} /></div>
                        <div className={`${card} p-5`}><h2 className="mb-4 font-semibold">Par praticien</h2><BarList items={synthese.parPraticien} /></div>
                        <div className={`${card} p-5`}><div className="mb-4"><h2 className="font-semibold">Jours les plus chargés</h2><p className="text-xs text-slate-500 dark:text-gray-400">Hors annulés</p></div><ColumnChart items={jours} ariaLabel="Rendez-vous par jour de la semaine" height="h-44" /></div>
                        <div className={`${card} p-5`}><div className="mb-4"><h2 className="font-semibold">Heures les plus demandées</h2><p className="text-xs text-slate-500 dark:text-gray-400">Hors annulés</p></div>{heures.length ? <ColumnChart items={heures} ariaLabel="Rendez-vous par heure" height="h-44" /> : <p className="py-6 text-center text-sm text-slate-500 dark:text-gray-400">Aucune donnée sur cette période.</p>}</div>
                    </section>
                </>
            )}
        </AdminLayout>
    );
}
