import { lazy, useCallback, useEffect, useMemo, useState } from 'react';
import { SkeletonTable } from '../components/ui/skeleton';
import { Link, useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import {
    BadgeCheck, Ban, UserCheck, CalendarCheck, CalendarClock, CalendarDays, Check, CheckCheck, Clock3,
    ChevronDown, CircleChevronLeft, CircleChevronRight, Download, Eye, FileSpreadsheet, FileText, FolderOpen, Pencil, Plus, RotateCw, Search, Trash2,
} from 'lucide-react';
import axiosClient from '../api/axiosClient';
import BoutonTelecharger from '../components/BoutonTelecharger';
import AdminLayout from '../components/AdminLayout';
import GrapheDiffere from '../components/dashboard/GrapheDiffere';
import BoutonScanQr from '../components/BoutonScanQr';
import ActivityLog from '../components/dashboard/ActivityLog';
import Notice from '../components/Notice';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { toast } from '../lib/toast';
import AgendaToday from '../components/dashboard/AgendaToday';
import ApercuSemaine from '../components/dashboard/ApercuSemaine';
import RdvFormModal from '../components/dashboard/RdvFormModal';
import AttributionDialog from '../components/dashboard/AttributionDialog';
import CarteDemande from '../components/dashboard/CarteDemande';
import { STATUS, formatDateFr, hhmm, todayISO } from '../constants/app';
import { apiErrorMessage, getRole, hasSession, homeForRole, LOGIN_PATH, peut } from '../utils/auth';
import { formatPhone } from '../utils/phone';

// Les graphiques (Recharts) se chargent après le reste de la page.
const WeekChart = lazy(() => import('../components/dashboard/WeekChart'));
const ColumnChart = lazy(() => import('../components/dashboard/ColumnChart'));

const PERIODS = [
    ['a_venir', 'À venir'],
    ['aujourd_hui', "Aujourd'hui"],
    ['cette_semaine', 'Cette semaine'],
    ['ce_mois', 'Ce mois'],
];
const EMPTY_STATS = { total: 0, pending: 0, confirmed: 0, cancelled: 0, done: 0 };
const FILTERS = [['TOUS', 'Tous'], ['EN_ATTENTE', 'En cours'], ['CONFIRME', 'Confirmés'], ['TERMINE', 'Terminés'], ['ANNULE', 'Annulés']];

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

/** Date courte et heure, mises à jour toutes les 15 secondes (comme dans la maquette de la console). */
function Horloge() {
    const [maintenant, setMaintenant] = useState(() => new Date());
    useEffect(() => {
        const minuteur = window.setInterval(() => setMaintenant(new Date()), 15000);
        return () => window.clearInterval(minuteur);
    }, []);
    const heure = maintenant.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
    const [heures, minutes] = heure.split(':');
    return (
        <div className="hidden items-baseline gap-3 sm:flex" aria-hidden="true">
            <div className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500 dark:text-gray-400">{maintenant.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })}</div>
            <div className="text-3xl font-extrabold leading-none tabular-nums">{heures}<span className="mx-0.5 animate-pulse text-(--mt-main)">:</span>{minutes}</div>
        </div>
    );
}

/** Couleurs des statuts dans le graphique « par statut ». */
const COULEURS_STATUT = { EN_ATTENTE: '#f59e0b', CONFIRME: '#10b981', TERMINE: '#0ea5e9', ANNULE: '#f43f5e' };

function Dashboard() {
    const navigate = useNavigate();
    const location = useLocation();
    const [params, setParams] = useSearchParams();
    const rdvCible = Number(params.get('rdv')) || null; // rendez-vous à traiter, ouvert depuis une notification
    const role = getRole();
    const home = homeForRole(role);
    const isSuperAdmin = role === 'SUPER_ADMIN';
    const estPraticien = ['MEDECIN', 'SAGE_FEMME', 'INFIRMIERE'].includes(role);
    const canOpenDossier = peut('DOSSIERS_LIRE');
    const droitAttribuer = peut('RDV_ATTRIBUER'), droitConfirmer = peut('RDV_CONFIRMER'), droitAccepter = peut('RDV_ACCEPTER');
    // Un soignant qui ne répartit pas les rendez-vous (pas d'attribution ni de confirmation) a une vue personnelle : ses patients, pas la gestion du cabinet.
    const vuePraticien = estPraticien && !droitAttribuer && !droitConfirmer;
    const droitTerminer = peut('RDV_TERMINER'), droitModifier = peut('RDV_MODIFIER'), droitCreer = peut('RDV_CREER');

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
    const [confirmDialog, setConfirmDialog] = useState(null);
    const [attribution, setAttribution] = useState(null); // { rdv }
    const [cible, setCible] = useState({ id: null, rdv: null, absent: false });

    const load = useCallback(async (silencieux = false) => {
        if (!silencieux) { setLoading(true); setError(''); }
        try {
            const [selected, week] = await Promise.all([
                axiosClient.get('/rendez-vous/dashboard', { params: { periode: period } }),
                axiosClient.get('/rendez-vous/dashboard', { params: { periode: 'cette_semaine' } }),
            ]);
            // Vue personnelle : seulement les rendez-vous confiés à cette personne (ceux pas encore attribués relèvent du cabinet).
            const siens = liste => (vuePraticien ? (liste || []).filter(rdv => rdv.praticienId != null) : (liste || []));
            const mesRdvs = siens(selected.data.rendezVous);
            setRdvs(mesRdvs);
            setStats(vuePraticien
                ? { ...EMPTY_STATS, total: mesRdvs.length, pending: mesRdvs.filter(r => r.statut === 'EN_ATTENTE').length, confirmed: mesRdvs.filter(r => r.statut === 'CONFIRME').length, done: mesRdvs.filter(r => r.statut === 'TERMINE').length, cancelled: mesRdvs.filter(r => r.statut === 'ANNULE').length }
                : { ...EMPTY_STATS, ...selected.data.stats });
            setWeekRdvs(siens(week.data.rendezVous));
            if (rdvCible) {
                try { const { data } = await axiosClient.get(`/rdv/${rdvCible}`); setCible({ id: rdvCible, rdv: data, absent: false }); }
                catch { setCible({ id: rdvCible, rdv: null, absent: true }); }
            }
        } catch (err) {
            console.error('Chargement du tableau de bord impossible', err);
            setError(apiErrorMessage(err, 'Impossible de charger le tableau de bord. Réessayez dans un instant.'));
        } finally { setLoading(false); }
    }, [period, rdvCible, vuePraticien]);

    // Redirige vers l'espace du rôle (ex. une secrétaire arrivée sur /medecin/dashboard), puis charge les données.
    useEffect(() => {
        if (!hasSession()) { navigate(LOGIN_PATH, { replace: true }); return undefined; }
        if (location.pathname !== home) { navigate(home, { replace: true }); return undefined; }
        const timer = window.setTimeout(() => load(), 0);
        return () => window.clearTimeout(timer);
    }, [load, navigate, home, location.pathname]);

    // Actualisation discrète toutes les 20 secondes et au retour sur l'onglet.
    useEffect(() => {
        const rafraichir = () => { if (document.visibilityState === 'visible') load(true); };
        const timer = window.setInterval(rafraichir, 20000);
        window.addEventListener('focus', rafraichir);
        return () => { window.clearInterval(timer); window.removeEventListener('focus', rafraichir); };
    }, [load]);

    useEffect(() => {
        axiosClient.get('/rdv/form-options').then(({ data }) => setOptions(data)).catch(() => {});
    }, []);

    // Le lien « Nouveau rendez-vous » de la barre latérale ouvre directement le formulaire.
    useEffect(() => {
        if (!location.state?.create) return;
        const date = location.state.date;
        const timer = window.setTimeout(() => { if (droitCreer) setModal({ type: 'create', date }); }, 0);
        navigate(location.pathname, { replace: true, state: null });
        return () => window.clearTimeout(timer);
    }, [location.state, location.pathname, navigate, droitCreer]);

    const week = useMemo(() => buildWeek(weekRdvs), [weekRdvs]);
    const today = todayISO();
    const todayItems = useMemo(
        () => weekRdvs.filter(rdv => rdv.dateRdv === today && rdv.statut !== 'ANNULE').sort((a, b) => hhmm(a.heureRdv).localeCompare(hhmm(b.heureRdv))),
        [weekRdvs, today],
    );
    const pendingToday = todayItems.filter(rdv => rdv.statut === 'EN_ATTENTE').length;

    const filtered = useMemo(() => rdvs.filter(rdv => {
        const q = query.trim().toLocaleLowerCase('fr');
        const matchesQuery = !q || [rdv.id, rdv.nomClient, rdv.telephoneClient, rdv.dateRdv, rdv.heureRdv, rdv.serviceNom, rdv.praticienNom, rdv.cleSuivi, STATUS[rdv.statut]?.label]
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

    // Deux confirmations : 1) la personne attribuée accepte ; 2) le super administrateur confirme (le patient reçoit alors son SMS).
    const aucunPraticien = (options.praticiens || []).length === 0;
    const estMien = (rdv, profile) => estPraticien && rdv.praticienId === profile?.id;
    const peutAccepter = (rdv, profile) => droitAccepter && estMien(rdv, profile) && !rdv.personnelConfirme && (rdv.statut === 'EN_ATTENTE' || rdv.statut === 'CONFIRME');
    const peutConfirmer = rdv => droitConfirmer && rdv.statut === 'EN_ATTENTE' && (rdv.praticienId ? rdv.personnelConfirme : aucunPraticien);
    const peutTerminer = (rdv, profile) => rdv.statut === 'CONFIRME' && droitTerminer && (isSuperAdmin || estMien(rdv, profile));
    const accepterRdv = rdv => run(async () => { await axiosClient.put(`/rdv/${rdv.id}/accepter`); setNotice(`Vous avez accepté le rendez-vous de ${rdv.nomClient}. Le super administrateur en est informé et va le confirmer.`); }, 'L’acceptation a échoué. Réessayez.');
    const confirmRdv = rdv => run(async () => { await axiosClient.put(`/rdv/${rdv.id}/confirmer`); setNotice(`Rendez-vous de ${rdv.nomClient} confirmé : le patient va recevoir son SMS.`); }, 'La confirmation a échoué. Réessayez.');
    const badgeAcceptation = rdv => {
        if (!rdv.praticienId || (rdv.statut !== 'EN_ATTENTE' && rdv.statut !== 'CONFIRME')) return null;
        return rdv.personnelConfirme
            ? <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-[11px] font-semibold text-emerald-800 dark:bg-emerald-500/15 dark:text-emerald-300"><Check size={11} />Accepté</span>
            : <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-semibold text-amber-800 dark:bg-amber-500/15 dark:text-amber-300"><Clock3 size={11} />Réponse attendue</span>;
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
        toast.info('Rendez-vous placé dans la corbeille.', {
            duration: 8000,
            action: {
                label: 'Annuler',
                onClick: async () => {
                    try { await axiosClient.put(`/rdv/${rdv.id}/annuler-suppression`); await load(); toast.success('Rendez-vous restauré.'); }
                    catch { toast.error('Impossible de restaurer ce rendez-vous (le créneau a peut-être été repris).'); }
                },
            },
        });
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

    const onSaved = async (saved, editing) => {
        setModal(null);
        setNotice(editing ? 'Rendez-vous modifié.' : 'Rendez-vous enregistré.');
        await load();
    };

    const kpis = [
        { key: 'TOUS', label: 'Total', value: stats.total, icon: CalendarDays, tone: 'text-teal-700 bg-teal-100 dark:bg-teal-500/15 dark:text-teal-300' },
        { key: 'EN_ATTENTE', label: 'En cours', value: stats.pending, icon: Clock3, tone: 'text-amber-700 bg-amber-100 dark:bg-amber-500/15 dark:text-amber-300' },
        { key: 'CONFIRME', label: 'Confirmés', value: stats.confirmed, icon: CalendarCheck, tone: 'text-emerald-700 bg-emerald-100 dark:bg-emerald-500/15 dark:text-emerald-300' },
        { key: 'TERMINE', label: 'Terminés', value: stats.done, icon: CheckCheck, tone: 'text-sky-700 bg-sky-100 dark:bg-sky-500/15 dark:text-sky-300' },
        { key: 'ANNULE', label: 'Annulés', value: stats.cancelled, icon: Ban, tone: 'text-rose-700 bg-rose-100 dark:bg-rose-500/15 dark:text-rose-300' },
    ];
    const periodLabel = PERIODS.find(([key]) => key === period)?.[1];
    const salutation = new Date().getHours() < 18 ? 'Bonjour' : 'Bonsoir';
    const phraseJour = todayItems.length
        ? (vuePraticien ? `${todayItems.length} patient${todayItems.length > 1 ? 's' : ''} aujourd’hui` : `${todayItems.length} rendez-vous aujourd’hui`)
        : (vuePraticien ? 'Aucun patient aujourd’hui' : 'Aucun rendez-vous aujourd’hui');
    const parStatut = [['EN_ATTENTE', stats.pending], ['CONFIRME', stats.confirmed], ['TERMINE', stats.done], ['ANNULE', stats.cancelled]].map(([key, value]) => ({
        key, label: STATUS[key].label, value, color: COULEURS_STATUT[key], tooltip: [STATUS[key].label, `${value} rendez-vous · ${periodLabel.toLowerCase()}`],
    }));
    const card = 'rounded-lg border border-slate-200 bg-white dark:border-gray-800 dark:bg-gray-900';

    const newButton = !droitCreer ? null : (
        <button onClick={() => setModal({ type: 'create' })} aria-label="Nouveau rendez-vous" className="inline-flex items-center gap-2 rounded-md bg-teal-700 px-3 py-2 text-sm font-semibold text-white transition hover:bg-teal-800">
            <Plus size={16} /><span className="hidden whitespace-nowrap 2xl:inline">Nouveau rendez-vous</span>
        </button>
    );

    return (
        <AdminLayout title={vuePraticien ? 'Mon espace' : 'Tableau de bord'} subtitle={formatDateFr(today, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })} actions={newButton}>
            {profile => <>
                {/* ---------- Demande à traiter (ouverte depuis une notification) ---------- */}
                {rdvCible && cible.id === rdvCible && (
                    <CarteDemande rdv={cible.rdv} absent={cible.absent} estSuperAdmin={isSuperAdmin || (droitAttribuer && droitConfirmer)}
                        peutAccepter={Boolean(cible.rdv) && peutAccepter(cible.rdv, profile)} peutConfirmer={Boolean(cible.rdv) && peutConfirmer(cible.rdv)}
                        onAccepter={() => accepterRdv(cible.rdv)} onConfirmer={() => confirmRdv(cible.rdv)} onAttribuer={() => setAttribution({ rdv: cible.rdv })}
                        onFermer={() => setParams({}, { replace: true })} />
                )}

                {/* ---------- Accueil : salutation, actions, heure ---------- */}
                <section className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div className="min-w-0">
                        <h2 className="text-2xl font-light sm:text-3xl">{salutation}{profile?.nom ? <>, <span className="font-bold">{profile.nom}</span></> : ''}</h2>
                        <p className="mt-1 max-w-2xl text-sm text-slate-600 dark:text-gray-400">
                            <strong className="font-semibold text-slate-800 dark:text-gray-100">{phraseJour}.</strong>{' '}
                            {vuePraticien
                                ? (rdvs.filter(rdv => peutAccepter(rdv, profile)).length > 0
                                    ? `${rdvs.filter(rdv => peutAccepter(rdv, profile)).length} rendez-vous vous attendent : acceptez-les pour que le cabinet les confirme au patient.`
                                    : 'Vos rendez-vous sont à jour.')
                                : pendingToday > 0
                                    ? (droitConfirmer ? `${pendingToday} en cours de confirmation. Pensez à les valider pour prévenir les patients.` : `${pendingToday} en cours de confirmation par le cabinet.`)
                                    : todayItems.length ? 'Tout est confirmé pour aujourd’hui.' : 'Profitez-en pour préparer la semaine ou saisir un nouveau rendez-vous.'}
                        </p>
                    </div>
                    <div className="flex flex-col gap-2 sm:items-end sm:gap-3">
                        <Horloge />
                        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                        {peut('EXPORT_RDV') && <details className="group/export relative">
                            <summary className="group inline-flex items-center gap-2 rounded-xl border border-(--st-line) bg-(--st-panel) py-1.5 pl-2 pr-3.5 text-sm font-semibold shadow-sm transition duration-150 hover:-translate-y-0.5 hover:border-(--mt-main) hover:shadow-md active:translate-y-0 cursor-pointer list-none [&::-webkit-details-marker]:hidden"><span className="flex h-7 w-7 items-center justify-center rounded-lg bg-(--mt-main)/15 text-(--mt-main-fort) transition group-hover:bg-(--mt-main) group-hover:text-(--mt-sur-main) dark:text-(--mt-main)"><Download size={15} /></span>Exporter<ChevronDown size={14} className="text-slate-400 transition-transform duration-200 group-open/export:rotate-180" /></summary>
                            <div className="absolute right-0 z-20 mt-2 w-64 overflow-hidden rounded-xl border border-(--st-line) bg-(--st-panel) p-1.5 text-sm text-slate-800 shadow-xl dark:text-gray-100">
                                <p className="px-3 pb-1 pt-1.5 text-[11px] font-semibold uppercase tracking-widest text-slate-400">{periodLabel}</p>
                                <button onClick={event => { event.currentTarget.closest('details')?.removeAttribute('open'); exportList('csv'); }} className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left transition hover:bg-slate-100 dark:hover:bg-gray-800"><span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-emerald-500/15 text-emerald-600 dark:text-emerald-400"><FileSpreadsheet size={16} /></span><span><span className="block font-semibold">Excel</span><span className="block text-xs text-slate-500 dark:text-gray-400">Fichier CSV, à ouvrir dans un tableur</span></span></button>
                                <button onClick={event => { event.currentTarget.closest('details')?.removeAttribute('open'); exportList('pdf'); }} className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left transition hover:bg-slate-100 dark:hover:bg-gray-800"><span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-rose-500/15 text-rose-600 dark:text-rose-400"><FileText size={16} /></span><span><span className="block font-semibold">PDF</span><span className="block text-xs text-slate-500 dark:text-gray-400">Liste prête à imprimer</span></span></button>
                            </div>
                        </details>}
                        <button onClick={() => load()} className="group inline-flex items-center gap-2 rounded-xl border border-(--st-line) bg-(--st-panel) py-1.5 pl-2 pr-3.5 text-sm font-semibold shadow-sm transition duration-150 hover:-translate-y-0.5 hover:border-(--mt-main) hover:shadow-md active:translate-y-0"><span className="flex h-7 w-7 items-center justify-center rounded-lg bg-(--mt-main)/15 text-(--mt-main-fort) transition group-hover:bg-(--mt-main) group-hover:text-(--mt-sur-main) dark:text-(--mt-main)"><RotateCw size={15} className={loading ? 'animate-spin' : 'transition-transform duration-500 group-hover:rotate-180'} /></span>Actualiser</button>
                        </div>
                    </div>
                </section>

                <Notice tone="success" onClose={() => setNotice('')}>{notice}</Notice>
                <Notice tone="error" onClose={() => setError('')}>{error}</Notice>

                {/* ---------- Indicateurs ---------- */}
                <section aria-label="Indicateurs" className="space-y-3">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                        <h2 className="text-sm font-semibold">Vue d’ensemble · <span className="text-teal-700 dark:text-teal-300">{periodLabel}</span></h2>
                        <Tabs value={period} onValueChange={valeur => { setPeriod(valeur); setPage(1); }}>
                            <TabsList aria-label="Période">
                                {PERIODS.map(([key, label]) => <TabsTrigger key={key} value={key}>{label}</TabsTrigger>)}
                            </TabsList>
                            {PERIODS.map(([key]) => <TabsContent key={key} value={key} />)}
                        </Tabs>
                    </div>
                    <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-5">
                        {kpis.map(({ key, label, value, icon: Icon }) => (
                            <button key={key} onClick={() => { setStatus(key); setPage(1); }} aria-pressed={status === key}
                                className={`${card} flex items-center gap-3 px-3.5 py-3 text-left transition hover:bg-slate-50 dark:hover:bg-gray-800/60 ${status === key ? 'border-(--mt-main) ring-1 ring-(--mt-main)/60' : ''}`}>
                                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-linear-to-br from-(--mt-main) to-(--mt-main-clair) text-(--mt-sur-main)"><Icon size={17} aria-hidden="true" /></span>
                                <span className="min-w-0">
                                    <span className="block truncate text-xs text-slate-500 dark:text-gray-400">{label}</span>
                                    <span className="block text-xl font-bold leading-tight tabular-nums">{loading ? '…' : value}</span>
                                </span>
                            </button>
                        ))}
                    </div>
                </section>

                {/* ---------- Aperçu de la semaine : courbes, anneau par service, jauges, radar (lecture seule, mêmes données que la page) ---------- */}
                {!loading && <ApercuSemaine week={week} weekRdvs={weekRdvs} rdvs={rdvs} stats={stats} />}

                {/* ---------- Graphiques, agenda du jour et activité récente ---------- */}
                <section className="grid gap-4 xl:grid-cols-3">
                    <div className="min-w-0 space-y-4 xl:col-span-2">
                        <div className={`${card} p-4`}>
                            <div className="mb-3 flex items-start justify-between gap-3">
                                <div><h2 className="font-semibold">{vuePraticien ? 'Ma semaine' : 'Rendez-vous de la semaine'}</h2><p className="text-xs text-slate-500 dark:text-gray-400">Par jour, hors rendez-vous annulés</p></div>
                                <span className="rounded-full bg-(--mt-main)/15 px-3 py-1 text-xs font-semibold tabular-nums text-teal-800 dark:text-teal-300">{week.reduce((sum, day) => sum + day.total, 0)} au total</span>
                            </div>
                            <GrapheDiffere hauteur="h-48"><WeekChart days={week} /></GrapheDiffere>
                        </div>
                        <div className={`${card} p-4`}>
                            <div className="mb-3"><h2 className="font-semibold">Rendez-vous par statut</h2><p className="text-xs text-slate-500 dark:text-gray-400">{periodLabel}</p></div>
                            <GrapheDiffere><ColumnChart items={parStatut} ariaLabel="Rendez-vous par statut" height="h-44" /></GrapheDiffere>
                        </div>
                    </div>
                    <div className="min-w-0 space-y-4">
                        <div className={`${card} p-4`}>
                            <div className="mb-3 flex items-center justify-between">
                                <div><h2 className="font-semibold">{vuePraticien ? 'Mes patients du jour' : 'Agenda du jour'}</h2><p className="text-xs text-slate-500 dark:text-gray-400">{formatDateFr(today, { weekday: 'long', day: 'numeric', month: 'long' })}</p></div>
                                <CalendarClock className="text-teal-600" size={20} />
                            </div>
                            <AgendaToday items={todayItems} peutConfirmer={rdv => peutAccepter(rdv, profile) || peutConfirmer(rdv)} libelle={rdv => (peutAccepter(rdv, profile) ? 'Accepter' : 'Confirmer')} onConfirm={rdv => (peutAccepter(rdv, profile) ? accepterRdv(rdv) : confirmRdv(rdv))} onOpen={rdv => setModal({ type: 'view', rdv })} />
                        </div>
                        {peut('JOURNAL_VOIR') && <ActivityLog />}
                    </div>
                </section>

                {/* ---------- Tableau des rendez-vous ---------- */}
                <section className={`${card} overflow-hidden`}>
                    <div className="space-y-4 border-b border-slate-200 p-4 dark:border-gray-800 sm:p-5">
                        <div className="flex items-center justify-between">
                            <div>
                                <h2 className="font-semibold">{vuePraticien ? 'Mes rendez-vous' : 'Liste des rendez-vous'}</h2>
                                <p className="mt-0.5 text-xs text-slate-500 dark:text-gray-400">{filtered.length} résultat{filtered.length > 1 ? 's' : ''} · {periodLabel.toLowerCase()}</p>
                            </div>
                        </div>
                        <div className="flex flex-col gap-3 xl:flex-row xl:items-center">
                            <label className="relative flex-1">
                                <Search size={17} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                                <BoutonScanQr onCle={cle => { setQuery(cle); setPage(1); }} label="Scanner un QR code de rendez-vous" className="absolute right-1.5 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-md text-slate-500 transition hover:bg-slate-100 hover:text-teal-700 dark:text-gray-400 dark:hover:bg-gray-800" />
                                <input value={query} onChange={e => { setQuery(e.target.value); setPage(1); }} placeholder="Rechercher un patient, un téléphone, un service…"
                                    className="w-full rounded-xl border border-slate-200 py-2.5 pl-10 pr-11 text-sm outline-none transition focus:border-teal-600 focus:ring-2 focus:ring-teal-600/20 dark:border-gray-700 dark:bg-gray-950" />
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
                        <table className="w-full min-w-230 border-collapse text-left text-sm">
                            <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500 dark:bg-gray-800/60 dark:text-gray-400">
                                <tr>{['Patient', 'Date et heure', 'Service', ...(vuePraticien ? [] : ['Praticien']), 'Statut', 'Actions'].map(label => <th key={label} scope="col" className="px-4 py-3 font-semibold">{label}</th>)}</tr>
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
                                                    <div className="min-w-0"><div className="truncate font-medium">{rdv.nomClient}</div><div className="text-xs text-slate-500 dark:text-gray-400">{formatPhone(rdv.telephoneClient)}</div>{rdv.cleSuivi && <div title="Clé de suivi du patient (à donner s'il l'a perdue)" className="select-all font-mono text-xs text-teal-700 dark:text-teal-400">{rdv.cleSuivi}</div>}</div>
                                                </div>
                                            </td>
                                            <td className="px-4 py-3 whitespace-nowrap"><div className="font-medium">{formatDateFr(rdv.dateRdv)}</div><div className="text-xs text-slate-500 dark:text-gray-400">{hhmm(rdv.heureRdv)}</div></td>
                                            <td className="px-4 py-3 text-slate-600 dark:text-gray-300">{rdv.serviceNom || '—'}</td>
                                            {!vuePraticien && <td className="px-4 py-3 text-slate-600 dark:text-gray-300">{rdv.praticienNom ? <div className="flex flex-col items-start gap-1"><span className="inline-flex items-center gap-1.5 font-medium"><UserCheck size={14} className="text-teal-600" />{rdv.praticienNom}</span>{badgeAcceptation(rdv)}</div> : (droitAttribuer && rdv.statut !== 'ANNULE' && rdv.statut !== 'TERMINE' ? <button onClick={() => setAttribution({ rdv })} className="rounded-full bg-amber-100 px-2.5 py-1 text-xs font-semibold text-amber-800 transition hover:bg-amber-200 dark:bg-amber-500/15 dark:text-amber-300">À attribuer</button> : <span className="text-slate-400">Non attribué</span>)}</td>}
                                            <td className="px-4 py-3"><span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${st.badge}`}><span className={`h-1.5 w-1.5 rounded-full ${st.dot}`} />{st.label}</span></td>
                                            <td className="px-4 py-3">
                                                <div className="flex items-center gap-0.5">
                                                    {canOpenDossier && <Link to={`/patients/dossier?telephone=${encodeURIComponent(rdv.telephoneClient)}`} title="Dossier du patient" aria-label={`Dossier de ${rdv.nomClient}`} className="rounded-lg p-2 text-slate-500 transition hover:bg-slate-100 hover:text-teal-700 dark:text-gray-400 dark:hover:bg-gray-800"><FolderOpen size={16} /></Link>}
                                                    <IconButton label="Voir le détail" onClick={() => setModal({ type: 'view', rdv })}><Eye size={16} /></IconButton>
                                                    {droitModifier && !vuePraticien && <IconButton label="Modifier" onClick={() => setModal({ type: 'edit', rdv })}><Pencil size={16} /></IconButton>}
                                                    {peutAccepter(rdv, profile) && <IconButton label="Accepter ce rendez-vous (je le prends)" tone="text-emerald-700 hover:bg-emerald-50 dark:text-emerald-300 dark:hover:bg-emerald-500/10" onClick={() => accepterRdv(rdv)}><Check size={16} /></IconButton>}
                                                    {peutConfirmer(rdv) && <IconButton label="Confirmer le rendez-vous (le patient reçoit son SMS)" tone="text-emerald-700 hover:bg-emerald-50 dark:text-emerald-300 dark:hover:bg-emerald-500/10" onClick={() => confirmRdv(rdv)}><BadgeCheck size={16} /></IconButton>}
                                                    {droitAttribuer && (rdv.statut === 'EN_ATTENTE' || rdv.statut === 'CONFIRME') && <IconButton label="Attribuer à une personne du personnel" tone="text-violet-700 hover:bg-violet-50 dark:text-violet-300 dark:hover:bg-violet-500/10" onClick={() => setAttribution({ rdv })}><UserCheck size={16} /></IconButton>}
                                                    {peutTerminer(rdv, profile) && <IconButton label="Marquer comme terminé" tone="text-sky-700 hover:bg-sky-50 dark:text-sky-300 dark:hover:bg-sky-500/10" onClick={() => finishRdv(rdv)}><CheckCheck size={16} /></IconButton>}
                                                    <BoutonTelecharger rdv={rdv} icone onDebut={() => setError('')} onErreur={setError} className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 hover:text-teal-700 dark:text-gray-400 dark:hover:bg-gray-800" />
                                                    {open && !vuePraticien && <IconButton label="Annuler le rendez-vous" tone="text-amber-700 hover:bg-amber-50 dark:text-amber-300 dark:hover:bg-amber-500/10" onClick={() => cancelRdv(rdv)}><Ban size={16} /></IconButton>}
                                                    {droitModifier && !vuePraticien && <IconButton label="Mettre dans la corbeille" tone="text-rose-700 hover:bg-rose-50 dark:text-rose-300 dark:hover:bg-rose-500/10" onClick={() => trashRdv(rdv)}><Trash2 size={16} /></IconButton>}
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                        {loading && <SkeletonTable rows={6} cols={5} />}
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
                            <button disabled={currentPage <= 1} onClick={() => setPage(currentPage - 1)} className="rounded-full text-slate-500 transition hover:text-(--mt-main) disabled:opacity-30 disabled:hover:text-slate-500 dark:text-gray-300" aria-label="Page précédente"><CircleChevronLeft size={26} /></button>
                            <span>Page {currentPage} / {pages}</span>
                            <button disabled={currentPage >= pages} onClick={() => setPage(currentPage + 1)} className="rounded-full text-slate-500 transition hover:text-(--mt-main) disabled:opacity-30 disabled:hover:text-slate-500 dark:text-gray-300" aria-label="Page suivante"><CircleChevronRight size={26} /></button>
                        </div>
                    </div>
                </section>

                {confirmDialog && (
                    <div className="fixed inset-0 z-70 flex items-center justify-center bg-slate-950/50 p-4 backdrop-blur-sm">
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
                {attribution && <AttributionDialog key={attribution.rdv.id} rdv={attribution.rdv} onClose={() => setAttribution(null)} onDone={attributionTerminee} />}
                {modal && <RdvFormModal key={`${modal.type}-${modal.rdv?.id ?? 'new'}`} modal={modal} options={options} canAssign={droitAttribuer} onClose={() => setModal(null)} onSaved={onSaved} />}
            </>}
        </AdminLayout>
    );
}

function IconButton({ label, onClick, tone = 'text-slate-500 hover:bg-slate-100 hover:text-teal-700 dark:text-gray-400 dark:hover:bg-gray-800', children }) {
    return <button type="button" onClick={onClick} title={label} aria-label={label} className={`rounded-lg p-2 transition ${tone}`}>{children}</button>;
}

export default Dashboard;
