import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
    Ban, UserCheck, CalendarCheck, CalendarClock, CalendarDays, Check, CheckCheck, ChevronLeft, ChevronRight, Clock3,
    Download, Eye, FileDown, FolderOpen, Loader2, Pencil, Plus, Printer, RefreshCw, Search, Trash2, X,
} from 'lucide-react';
import axiosClient from '../api/axiosClient';
import { downloadRendezVousPdf } from '../api/rendezVousPdf';
import { printReceipt } from '../utils/receipt';
import AdminLayout from '../components/AdminLayout';
import WeekChart from '../components/dashboard/WeekChart';
import AgendaToday from '../components/dashboard/AgendaToday';
import RdvFormModal from '../components/dashboard/RdvFormModal';
import AttributionDialog from '../components/dashboard/AttributionDialog';
import { STATUS, formatDateFr, hhmm, todayISO } from '../constants/app';
import { apiErrorMessage, getRole, hasSession, homeForRole, LOGIN_PATH } from '../utils/auth';
import { formatPhone } from '../utils/phone';

const PERIODS = [
    ['a_venir', 'À venir'],
    ['aujourd_hui', "Aujourd'hui"],
    ['cette_semaine', 'Cette semaine'],
    ['ce_mois', 'Ce mois'],
];
const EMPTY_STATS = { total: 0, pending: 0, confirmed: 0, cancelled: 0, done: 0 };
const FILTERS = [['TOUS', 'Tous'], ['EN_ATTENTE', 'En attente'], ['CONFIRME', 'Confirmés'], ['TERMINE', 'Terminés'], ['ANNULE', 'Annulés']];

/** Les 7 jours (lundi → dimanche) de la semaine en cours, avec le détail par statut. */
function buildWeek(weekRdvs) {
    const today = todayISO();
    const base = new Date(`${today}T12:00:00`);
    const monday = new Date(base);
    monday.setDate(base.getDate() - ((base.getDay() + 6) % 7));
    return Array.from({ length: 7 }, (_, index) => {
        const date = new Date(monday);
        date.setDate(monday.getDate() + index);
        const iso = date.toLocaleDateString('en-CA');
        const items = weekRdvs.filter(rdv => rdv.dateRdv === iso && rdv.statut !== 'ANNULE');
        const byStatus = items.reduce((acc, rdv) => ({ ...acc, [rdv.statut]: (acc[rdv.statut] || 0) + 1 }), {});
        return { iso, total: items.length, byStatus, isToday: iso === today };
    });
}

/** Dates [début, fin] (AAAA-MM-JJ) de la période choisie sur le tableau de bord. */
function periodDates(period) {
    const today = new Date(`${todayISO()}T12:00:00`);
    const iso = date => date.toLocaleDateString('en-CA');
    if (period === 'cette_semaine') {
        const monday = new Date(today); monday.setDate(today.getDate() - ((today.getDay() + 6) % 7));
        const sunday = new Date(monday); sunday.setDate(monday.getDate() + 6);
        return [iso(monday), iso(sunday)];
    }
    if (period === 'a_venir') { const end = new Date(today); end.setDate(today.getDate() + 30); return [iso(today), iso(end)]; }
    if (period === 'ce_mois') return [iso(new Date(today.getFullYear(), today.getMonth(), 1, 12)), iso(new Date(today.getFullYear(), today.getMonth() + 1, 0, 12))];
    return [iso(today), iso(today)];
}

function Dashboard() {
    const navigate = useNavigate();
    const location = useLocation();
    const role = getRole();
    const home = homeForRole(role);
    const isSuperAdmin = role === 'SUPER_ADMIN';
    const estPraticien = ['MEDECIN', 'SAGE_FEMME', 'INFIRMIERE'].includes(role);
    const canOpenDossier = ['SUPER_ADMIN', 'MEDECIN', 'SAGE_FEMME', 'INFIRMIERE'].includes(role);

    const [rdvs, setRdvs] = useState([]);
    const [weekRdvs, setWeekRdvs] = useState([]);
    const [stats, setStats] = useState(EMPTY_STATS);
    const [options, setOptions] = useState({ services: [], praticiens: [] });
    const [period, setPeriod] = useState('a_venir'); // la liste ne reste pas vide les jours sans rendez-vous
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [notice, setNotice] = useState('');
    const [query, setQuery] = useState('');
    const [status, setStatus] = useState('TOUS');
    const [date, setDate] = useState('');
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);
    const [modal, setModal] = useState(null);
    const [toast, setToast] = useState(null);
    const [confirmDialog, setConfirmDialog] = useState(null);
    const [attribution, setAttribution] = useState(null); // { rdv, mode: 'confirm' | 'assign' }

    const load = useCallback(async () => {
        setLoading(true); setError('');
        try {
            const [selected, week] = await Promise.all([
                axiosClient.get('/rendez-vous/dashboard', { params: { periode: period } }),
                axiosClient.get('/rendez-vous/dashboard', { params: { periode: 'cette_semaine' } }),
            ]);
            setRdvs(selected.data.rendezVous || []);
            setStats({ ...EMPTY_STATS, ...selected.data.stats });
            setWeekRdvs(week.data.rendezVous || []);
        } catch (err) {
            console.error('Chargement du tableau de bord impossible', err);
            setError(apiErrorMessage(err, 'Impossible de charger le tableau de bord. Réessayez dans un instant.'));
        } finally { setLoading(false); }
    }, [period]);

    // Redirige vers l'espace du rôle (ex. une secrétaire arrivée sur /medecin/dashboard), puis charge les données.
    useEffect(() => {
        if (!hasSession()) { navigate(LOGIN_PATH, { replace: true }); return undefined; }
        if (location.pathname !== home) { navigate(home, { replace: true }); return undefined; }
        const timer = window.setTimeout(load, 0);
        return () => window.clearTimeout(timer);
    }, [load, navigate, home, location.pathname]);

    useEffect(() => {
        axiosClient.get('/rdv/form-options').then(({ data }) => setOptions(data)).catch(() => {});
    }, []);

    // Le lien « Nouveau rendez-vous » de la barre latérale ouvre directement le formulaire.
    useEffect(() => {
        if (!location.state?.create) return;
        const date = location.state.date;
        const timer = window.setTimeout(() => setModal({ type: 'create', date }), 0);
        navigate(location.pathname, { replace: true, state: null });
        return () => window.clearTimeout(timer);
    }, [location.state, location.pathname, navigate]);

    useEffect(() => {
        if (!toast) return undefined;
        const timer = window.setTimeout(() => setToast(null), 6000);
        return () => window.clearTimeout(timer);
    }, [toast]);

    const week = useMemo(() => buildWeek(weekRdvs), [weekRdvs]);
    const today = todayISO();
    const todayItems = useMemo(
        () => weekRdvs.filter(rdv => rdv.dateRdv === today && rdv.statut !== 'ANNULE').sort((a, b) => hhmm(a.heureRdv).localeCompare(hhmm(b.heureRdv))),
        [weekRdvs, today],
    );
    const pendingToday = todayItems.filter(rdv => rdv.statut === 'EN_ATTENTE').length;

    const filtered = useMemo(() => rdvs.filter(rdv => {
        const q = query.trim().toLocaleLowerCase('fr');
        const matchesQuery = !q || [rdv.id, rdv.nomClient, rdv.telephoneClient, rdv.dateRdv, rdv.heureRdv, rdv.serviceNom, rdv.praticienNom, STATUS[rdv.statut]?.label]
            .some(value => String(value ?? '').toLocaleLowerCase('fr').includes(q));
        return matchesQuery && (status === 'TOUS' || rdv.statut === status) && (!date || rdv.dateRdv === date);
    }), [rdvs, query, status, date]);
    const pages = Math.max(1, Math.ceil(filtered.length / pageSize));
    const currentPage = Math.min(page, pages);
    const visible = filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize);

    const run = async (task, fallback) => {
        setError(''); setNotice('');
        try { await task(); await load(); }
        catch (err) { console.error(fallback, err); setError(apiErrorMessage(err, fallback)); }
    };

    const confirmRdv = rdv => {
        if (isSuperAdmin) { setAttribution({ rdv, mode: 'confirm' }); return Promise.resolve(); }
        return run(async () => { await axiosClient.put(`/rdv/${rdv.id}/confirmer`); setNotice(`Rendez-vous de ${rdv.nomClient} confirmé.`); }, 'La confirmation a échoué. Réessayez.');
    };
    const attributionTerminee = async message => { setAttribution(null); setNotice(message); await load(); };
    const finishRdv = rdv => run(async () => { await axiosClient.put(`/rdv/${rdv.id}/terminer`); setNotice(`Consultation de ${rdv.nomClient} terminée.`); }, 'Le changement de statut a échoué. Réessayez.');
    const cancelRdv = rdv => setConfirmDialog({
        title: 'Annuler ce rendez-vous ?',
        message: `Le patient ${rdv.nomClient} sera prévenu par SMS et le créneau sera libéré.`,
        action: 'Annuler le rendez-vous',
        run: () => run(async () => { await axiosClient.put(`/rdv/${rdv.id}/annuler`); setNotice('Rendez-vous annulé.'); }, 'L’annulation a échoué. Réessayez.'),
    });
    const trashRdv = rdv => run(async () => {
        await axiosClient.delete(`/rdv/${rdv.id}`);
        setToast({ message: 'Rendez-vous placé dans la corbeille.', undo: async () => { await axiosClient.put(`/rdv/${rdv.id}/annuler-suppression`); await load(); } });
    }, 'La suppression a échoué. Réessayez.');

    const exportList = async format => {
        const [debut, fin] = periodDates(period);
        setError('');
        try {
            const response = await axiosClient.get('/export/rendez-vous', { params: { debut, fin, format }, responseType: 'blob' });
            const url = URL.createObjectURL(response.data);
            const anchor = window.document.createElement('a');
            anchor.href = url; anchor.download = `rendez-vous-${debut}_${fin}.${format}`;
            window.document.body.appendChild(anchor); anchor.click(); anchor.remove();
            window.setTimeout(() => URL.revokeObjectURL(url), 1000);
        } catch (err) {
            // en cas d'erreur, le corps est un blob JSON : on le lit pour afficher le message du serveur
            let message = 'Export impossible.';
            try { message = JSON.parse(await err.response.data.text()).message || message; } catch { /* corps illisible */ }
            setError(message);
        }
    };

    const downloadPdf = async rdv => {
        try { await downloadRendezVousPdf(rdv); }
        catch (pdfError) { setError(pdfError.message || 'Le reçu PDF n’a pas pu être téléchargé.'); }
    };

    const onSaved = async (saved, editing) => {
        setModal(null);
        setNotice(editing ? 'Rendez-vous modifié.' : 'Rendez-vous enregistré.');
        await load();
        if (!editing) {
            try { await downloadRendezVousPdf(saved); }
            catch (pdfError) { setError(pdfError.message || 'Le rendez-vous est enregistré, mais le PDF n’a pas pu être téléchargé.'); }
        }
    };

    const kpis = [
        { key: 'TOUS', label: 'Total', value: stats.total, icon: CalendarDays, tone: 'text-teal-700 bg-teal-100 dark:bg-teal-500/15 dark:text-teal-300' },
        { key: 'EN_ATTENTE', label: 'En attente', value: stats.pending, icon: Clock3, tone: 'text-amber-700 bg-amber-100 dark:bg-amber-500/15 dark:text-amber-300' },
        { key: 'CONFIRME', label: 'Confirmés', value: stats.confirmed, icon: CalendarCheck, tone: 'text-emerald-700 bg-emerald-100 dark:bg-emerald-500/15 dark:text-emerald-300' },
        { key: 'TERMINE', label: 'Terminés', value: stats.done, icon: CheckCheck, tone: 'text-sky-700 bg-sky-100 dark:bg-sky-500/15 dark:text-sky-300' },
        { key: 'ANNULE', label: 'Annulés', value: stats.cancelled, icon: Ban, tone: 'text-rose-700 bg-rose-100 dark:bg-rose-500/15 dark:text-rose-300' },
    ];
    const periodLabel = PERIODS.find(([key]) => key === period)?.[1];
    const card = 'rounded-2xl border border-slate-200/80 bg-white shadow-sm dark:border-gray-800 dark:bg-gray-900';

    const newButton = (
        <button onClick={() => setModal({ type: 'create' })} className="inline-flex items-center gap-2 rounded-xl bg-teal-700 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-teal-800">
            <Plus size={17} /><span className="hidden sm:inline">Nouveau rendez-vous</span>
        </button>
    );

    return (
        <AdminLayout title="Tableau de bord" subtitle={formatDateFr(today, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })} actions={newButton}>
            {profile => <>
                {/* ---------- Bandeau d'accueil ---------- */}
                <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-teal-700 via-teal-600 to-emerald-600 p-6 text-white shadow-lg sm:p-8">
                    <div className="pointer-events-none absolute -right-10 -top-16 h-56 w-56 rounded-full bg-white/10 blur-2xl" />
                    <div className="pointer-events-none absolute -bottom-20 right-1/3 h-48 w-48 rounded-full bg-emerald-300/20 blur-3xl" />
                    <div className="relative flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                            <p className="text-sm font-medium text-teal-100">Bonjour{profile?.nom ? `, ${profile.nom}` : ''}</p>
                            <h2 className="mt-1 text-2xl font-bold sm:text-3xl">
                                {todayItems.length
                                    ? `${todayItems.length} rendez-vous aujourd’hui`
                                    : 'Aucun rendez-vous aujourd’hui'}
                            </h2>
                            <p className="mt-2 max-w-xl text-sm text-teal-50">
                                {pendingToday > 0
                                    ? `${pendingToday} en attente de confirmation. Pensez à les valider pour prévenir les patients.`
                                    : todayItems.length ? 'Tout est confirmé pour aujourd’hui.' : 'Profitez-en pour préparer la semaine ou saisir un nouveau rendez-vous.'}
                            </p>
                        </div>
                        <div className="flex flex-wrap gap-3">
                            <button onClick={() => setModal({ type: 'create' })} className="inline-flex items-center gap-2 rounded-xl bg-white px-4 py-2.5 text-sm font-semibold text-teal-800 shadow transition hover:bg-teal-50"><Plus size={17} />Nouveau rendez-vous</button>
                            <details className="relative">
                                <summary className="inline-flex cursor-pointer list-none items-center gap-2 rounded-xl border border-white/30 bg-white/10 px-4 py-2.5 text-sm font-medium backdrop-blur transition hover:bg-white/20 [&::-webkit-details-marker]:hidden"><Download size={16} />Exporter</summary>
                                <div className="absolute right-0 z-20 mt-2 w-56 overflow-hidden rounded-xl bg-white p-1 text-sm text-slate-800 shadow-xl dark:bg-gray-900 dark:text-gray-100">
                                    <button onClick={() => exportList('csv')} className="block w-full rounded-lg px-3 py-2 text-left hover:bg-slate-100 dark:hover:bg-gray-800">Excel (CSV) — {periodLabel.toLowerCase()}</button>
                                    <button onClick={() => exportList('pdf')} className="block w-full rounded-lg px-3 py-2 text-left hover:bg-slate-100 dark:hover:bg-gray-800">PDF — {periodLabel.toLowerCase()}</button>
                                </div>
                            </details>
                            <button onClick={load} className="inline-flex items-center gap-2 rounded-xl border border-white/30 bg-white/10 px-4 py-2.5 text-sm font-medium backdrop-blur transition hover:bg-white/20"><RefreshCw size={16} className={loading ? 'animate-spin' : ''} />Actualiser</button>
                        </div>
                    </div>
                </section>

                {notice && <div role="status" className="flex items-center justify-between rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-200"><span>{notice}</span><button onClick={() => setNotice('')} aria-label="Fermer"><X size={16} /></button></div>}
                {error && <div role="alert" className="flex items-center justify-between rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-200"><span>{error}</span><button onClick={() => setError('')} aria-label="Fermer"><X size={16} /></button></div>}

                {/* ---------- Indicateurs ---------- */}
                <section aria-label="Indicateurs">
                    <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
                        <h2 className="font-semibold">Vue d’ensemble · <span className="text-teal-700 dark:text-teal-300">{periodLabel}</span></h2>
                        <div role="tablist" aria-label="Période" className="inline-flex rounded-xl bg-slate-100 p-1 dark:bg-gray-800">
                            {PERIODS.map(([key, label]) => (
                                <button key={key} role="tab" aria-selected={period === key} onClick={() => { setPeriod(key); setPage(1); }}
                                    className={`rounded-lg px-3 py-1.5 text-xs font-medium transition sm:text-sm ${period === key ? 'bg-white text-teal-800 shadow-sm dark:bg-gray-950 dark:text-teal-300' : 'text-slate-600 hover:text-slate-900 dark:text-gray-400'}`}>{label}</button>
                            ))}
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
                        {kpis.map(({ key, label, value, icon: Icon, tone }) => (
                            <button key={key} onClick={() => { setStatus(key); setPage(1); }} aria-pressed={status === key}
                                className={`${card} p-4 text-left transition hover:-translate-y-0.5 hover:shadow-md ${key === 'TOUS' ? 'col-span-2 lg:col-span-1' : ''} ${status === key ? 'ring-2 ring-teal-600/40' : ''}`}>
                                <div className="flex items-center justify-between">
                                    <span className="text-xs font-medium text-slate-500 dark:text-gray-400 sm:text-sm">{label}</span>
                                    <span className={`rounded-xl p-2 ${tone}`}><Icon size={17} /></span>
                                </div>
                                <div className="mt-3 text-3xl font-bold tabular-nums">{loading ? <span className="inline-block h-8 w-10 animate-pulse rounded bg-slate-200 dark:bg-gray-800" /> : value}</div>
                            </button>
                        ))}
                    </div>
                </section>

                {/* ---------- Graphique + agenda du jour ---------- */}
                <section className="grid gap-6 xl:grid-cols-5">
                    <div className={`${card} p-5 xl:col-span-3`}>
                        <div className="mb-4 flex items-start justify-between gap-3">
                            <div><h2 className="font-semibold">Rendez-vous de la semaine</h2><p className="text-xs text-slate-500 dark:text-gray-400">Par jour, hors rendez-vous annulés</p></div>
                            <span className="rounded-full bg-teal-100 px-3 py-1 text-xs font-semibold tabular-nums text-teal-800 dark:bg-teal-500/15 dark:text-teal-300">{week.reduce((sum, day) => sum + day.total, 0)} au total</span>
                        </div>
                        <WeekChart days={week} />
                    </div>
                    <div className={`${card} p-5 xl:col-span-2`}>
                        <div className="mb-4 flex items-center justify-between">
                            <div><h2 className="font-semibold">Agenda du jour</h2><p className="text-xs text-slate-500 dark:text-gray-400">{formatDateFr(today, { weekday: 'long', day: 'numeric', month: 'long' })}</p></div>
                            <CalendarClock className="text-teal-600" size={20} />
                        </div>
                        <AgendaToday items={todayItems} peutConfirmer={rdv => rdv.statut === 'EN_ATTENTE' && (isSuperAdmin || (estPraticien && rdv.praticienId === profile?.id))} onConfirm={confirmRdv} onOpen={rdv => setModal({ type: 'view', rdv })} />
                    </div>
                </section>

                {/* ---------- Tableau des rendez-vous ---------- */}
                <section className={`${card} overflow-hidden`}>
                    <div className="space-y-4 border-b border-slate-200 p-4 dark:border-gray-800 sm:p-5">
                        <div className="flex items-center justify-between">
                            <div>
                                <h2 className="font-semibold">Liste des rendez-vous</h2>
                                <p className="mt-0.5 text-xs text-slate-500 dark:text-gray-400">{filtered.length} résultat{filtered.length > 1 ? 's' : ''} · {periodLabel.toLowerCase()}</p>
                            </div>
                        </div>
                        <div className="flex flex-col gap-3 xl:flex-row xl:items-center">
                            <label className="relative flex-1">
                                <Search size={17} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                                <input value={query} onChange={e => { setQuery(e.target.value); setPage(1); }} placeholder="Rechercher un patient, un téléphone, un service…"
                                    className="w-full rounded-xl border border-slate-200 py-2.5 pl-10 pr-3 text-sm outline-none transition focus:border-teal-600 focus:ring-2 focus:ring-teal-600/20 dark:border-gray-700 dark:bg-gray-950" />
                            </label>
                            <div className="flex flex-wrap gap-2">
                                {FILTERS.map(([key, label]) => (
                                    <button key={key} onClick={() => { setStatus(key); setPage(1); }}
                                        className={`rounded-full px-3 py-1.5 text-xs font-medium transition ${status === key ? 'bg-teal-700 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700'}`}>{label}</button>
                                ))}
                            </div>
                            <input aria-label="Filtrer par date" type="date" value={date} onChange={e => { setDate(e.target.value); setPage(1); }}
                                className="rounded-xl border border-slate-200 px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-950" />
                        </div>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full min-w-[920px] border-collapse text-left text-sm">
                            <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500 dark:bg-gray-800/60 dark:text-gray-400">
                                <tr>{['Patient', 'Date et heure', 'Service', 'Praticien', 'Statut', 'Actions'].map(label => <th key={label} scope="col" className="px-4 py-3 font-semibold">{label}</th>)}</tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-gray-800">
                                {visible.map(rdv => {
                                    const st = STATUS[rdv.statut] || STATUS.EN_ATTENTE;
                                    const open = rdv.statut === 'EN_ATTENTE' || rdv.statut === 'CONFIRME';
                                    return (
                                        <tr key={rdv.id} className="transition hover:bg-slate-50/80 dark:hover:bg-gray-800/40">
                                            <td className="px-4 py-3">
                                                <div className="flex items-center gap-3">
                                                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-teal-100 text-sm font-bold text-teal-800 dark:bg-teal-500/15 dark:text-teal-300" aria-hidden="true">{rdv.nomClient?.trim().charAt(0).toUpperCase()}</span>
                                                    <div className="min-w-0"><div className="truncate font-medium">{rdv.nomClient}</div><div className="text-xs text-slate-500 dark:text-gray-400">{formatPhone(rdv.telephoneClient)}</div></div>
                                                </div>
                                            </td>
                                            <td className="px-4 py-3 whitespace-nowrap"><div className="font-medium">{formatDateFr(rdv.dateRdv)}</div><div className="text-xs text-slate-500 dark:text-gray-400">{hhmm(rdv.heureRdv)}</div></td>
                                            <td className="px-4 py-3 text-slate-600 dark:text-gray-300">{rdv.serviceNom || '—'}</td>
                                            <td className="px-4 py-3 text-slate-600 dark:text-gray-300">{rdv.praticienNom ? <span className="inline-flex items-center gap-1.5 font-medium"><UserCheck size={14} className="text-teal-600" />{rdv.praticienNom}</span> : (isSuperAdmin && rdv.statut !== 'ANNULE' && rdv.statut !== 'TERMINE' ? <button onClick={() => setAttribution({ rdv, mode: rdv.statut === 'EN_ATTENTE' ? 'confirm' : 'assign' })} className="rounded-full bg-amber-100 px-2.5 py-1 text-xs font-semibold text-amber-800 transition hover:bg-amber-200 dark:bg-amber-500/15 dark:text-amber-300">À attribuer</button> : <span className="text-slate-400">Non attribué</span>)}</td>
                                            <td className="px-4 py-3"><span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${st.badge}`}><span className={`h-1.5 w-1.5 rounded-full ${st.dot}`} />{st.label}</span></td>
                                            <td className="px-4 py-3">
                                                <div className="flex items-center gap-0.5">
                                                    {canOpenDossier && <Link to={`/patients/dossier?telephone=${encodeURIComponent(rdv.telephoneClient)}`} title="Dossier du patient" aria-label={`Dossier de ${rdv.nomClient}`} className="rounded-lg p-2 text-slate-500 transition hover:bg-slate-100 hover:text-teal-700 dark:text-gray-400 dark:hover:bg-gray-800"><FolderOpen size={16} /></Link>}
                                                    <IconButton label="Voir le détail" onClick={() => setModal({ type: 'view', rdv })}><Eye size={16} /></IconButton>
                                                    <IconButton label="Modifier" onClick={() => setModal({ type: 'edit', rdv })}><Pencil size={16} /></IconButton>
                                                    {rdv.statut === 'EN_ATTENTE' && (isSuperAdmin || (estPraticien && rdv.praticienId === profile?.id)) && <IconButton label={isSuperAdmin ? 'Confirmer et choisir qui prend le rendez-vous' : 'Confirmer'} tone="text-emerald-700 hover:bg-emerald-50 dark:text-emerald-300 dark:hover:bg-emerald-500/10" onClick={() => confirmRdv(rdv)}><Check size={16} /></IconButton>}
                                                    {isSuperAdmin && (rdv.statut === 'EN_ATTENTE' || rdv.statut === 'CONFIRME') && <IconButton label="Attribuer à une personne du personnel" tone="text-violet-700 hover:bg-violet-50 dark:text-violet-300 dark:hover:bg-violet-500/10" onClick={() => setAttribution({ rdv, mode: 'assign' })}><UserCheck size={16} /></IconButton>}
                                                    {rdv.statut === 'CONFIRME' && (isSuperAdmin || (estPraticien && rdv.praticienId === profile?.id)) && <IconButton label="Marquer comme terminé" tone="text-sky-700 hover:bg-sky-50 dark:text-sky-300 dark:hover:bg-sky-500/10" onClick={() => finishRdv(rdv)}><CheckCheck size={16} /></IconButton>}
                                                    <IconButton label="Télécharger le reçu PDF" onClick={() => downloadPdf(rdv)}><FileDown size={16} /></IconButton>
                                                    <IconButton label="Imprimer le reçu" onClick={() => printReceipt(rdv)}><Printer size={16} /></IconButton>
                                                    {open && <IconButton label="Annuler le rendez-vous" tone="text-amber-700 hover:bg-amber-50 dark:text-amber-300 dark:hover:bg-amber-500/10" onClick={() => cancelRdv(rdv)}><Ban size={16} /></IconButton>}
                                                    <IconButton label="Mettre dans la corbeille" tone="text-rose-700 hover:bg-rose-50 dark:text-rose-300 dark:hover:bg-rose-500/10" onClick={() => trashRdv(rdv)}><Trash2 size={16} /></IconButton>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                        {loading && <div className="flex items-center justify-center gap-2 p-12 text-sm text-slate-500"><Loader2 size={18} className="animate-spin" />Chargement des rendez-vous…</div>}
                        {!loading && visible.length === 0 && (
                            <div className="flex flex-col items-center gap-2 p-12 text-center text-sm text-slate-500 dark:text-gray-400">
                                <CalendarDays size={26} className="text-slate-300" />
                                {rdvs.length ? 'Aucun rendez-vous ne correspond à ces filtres.' : `Aucun rendez-vous ${periodLabel.toLowerCase()}.`}
                            </div>
                        )}
                    </div>

                    <div className="flex flex-col items-center justify-between gap-3 border-t border-slate-200 px-4 py-3 text-xs text-slate-500 dark:border-gray-800 dark:text-gray-400 sm:flex-row">
                        <div className="flex items-center gap-2">
                            <span>Afficher</span>
                            <select aria-label="Lignes par page" value={pageSize} onChange={e => { setPageSize(Number(e.target.value)); setPage(1); }} className="rounded-lg border border-slate-200 bg-white px-2 py-1 dark:border-gray-700 dark:bg-gray-950"><option>10</option><option>20</option><option>50</option></select>
                            <span>par page · {filtered.length ? (currentPage - 1) * pageSize + 1 : 0} à {Math.min(currentPage * pageSize, filtered.length)} sur {filtered.length}</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <button disabled={currentPage <= 1} onClick={() => setPage(currentPage - 1)} className="rounded-lg border border-slate-200 p-1.5 disabled:opacity-40 dark:border-gray-700" aria-label="Page précédente"><ChevronLeft size={16} /></button>
                            <span>Page {currentPage} / {pages}</span>
                            <button disabled={currentPage >= pages} onClick={() => setPage(currentPage + 1)} className="rounded-lg border border-slate-200 p-1.5 disabled:opacity-40 dark:border-gray-700" aria-label="Page suivante"><ChevronRight size={16} /></button>
                        </div>
                    </div>
                </section>

                {toast && (
                    <div role="status" className="fixed bottom-5 right-5 z-[60] flex items-center gap-4 rounded-xl bg-slate-900 px-4 py-3 text-sm text-white shadow-xl">
                        <span>{toast.message}</span>
                        {toast.undo && <button onClick={async () => { try { await toast.undo(); setToast(null); } catch { setError('Impossible de restaurer ce rendez-vous (le créneau a peut-être été repris).'); setToast(null); } }} className="font-semibold text-teal-300">Annuler</button>}
                        <button onClick={() => setToast(null)} aria-label="Fermer" className="text-slate-300"><X size={16} /></button>
                    </div>
                )}
                {confirmDialog && (
                    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-slate-950/50 p-4 backdrop-blur-sm">
                        <section role="alertdialog" aria-modal="true" aria-label={confirmDialog.title} className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl dark:bg-gray-900">
                            <h2 className="font-semibold">{confirmDialog.title}</h2>
                            <p className="mt-3 text-sm text-slate-600 dark:text-gray-300">{confirmDialog.message}</p>
                            <div className="mt-6 flex justify-end gap-2">
                                <button onClick={() => setConfirmDialog(null)} className="rounded-xl border border-slate-200 px-4 py-2 text-sm dark:border-gray-700">Retour</button>
                                <button onClick={async () => { const task = confirmDialog.run; setConfirmDialog(null); await task(); }} className="rounded-xl bg-rose-700 px-4 py-2 text-sm font-semibold text-white hover:bg-rose-800">{confirmDialog.action}</button>
                            </div>
                        </section>
                    </div>
                )}
                {attribution && <AttributionDialog key={`${attribution.mode}-${attribution.rdv.id}`} rdv={attribution.rdv} mode={attribution.mode} onClose={() => setAttribution(null)} onDone={attributionTerminee} />}
                {modal && <RdvFormModal key={`${modal.type}-${modal.rdv?.id ?? 'new'}`} modal={modal} options={options} canAssign={isSuperAdmin} onClose={() => setModal(null)} onSaved={onSaved} />}
            </>}
        </AdminLayout>
    );
}

function IconButton({ label, onClick, tone = 'text-slate-500 hover:bg-slate-100 hover:text-teal-700 dark:text-gray-400 dark:hover:bg-gray-800', children }) {
    return <button type="button" onClick={onClick} title={label} aria-label={label} className={`rounded-lg p-2 transition ${tone}`}>{children}</button>;
}

export default Dashboard;
