import { useCallback, useEffect, useState } from 'react';
import { SkeletonList } from '../components/ui/skeleton';
import { Link, useNavigate } from 'react-router-dom';
import { AlertTriangle, Baby, CalendarClock, HeartPulse, Syringe } from 'lucide-react';
import axiosClient from '../api/axiosClient';
import AdminLayout from '../components/AdminLayout';
import Notice from '../components/Notice';
import { formatDateFr } from '../constants/app';
import { card } from '../constants/ui';
import { apiErrorMessage, getRole, hasSession, homeForRole, LOGIN_PATH, peut } from '../utils/auth';
import { formatPhone } from '../utils/phone';

const date = iso => formatDateFr(iso, { day: 'numeric', month: 'long', year: 'numeric' });
const dossier = tel => `/patients/dossier?telephone=${encodeURIComponent(tel)}`;

/** Vue d'ensemble de la maternité : grossesses à suivre (terme, consultations prénatales) et vaccins des enfants à faire ou en retard. */
export default function SuiviMaternite() {
    const navigate = useNavigate();
    const [data, setData] = useState(null);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(true);

    const charger = useCallback(async () => {
        try { const { data: d } = await axiosClient.get('/dossiers/maternite/rappels'); setData(d); }
        catch (err) { setError(apiErrorMessage(err, 'Impossible de charger le suivi de maternité.')); }
        finally { setLoading(false); }
    }, []);

    useEffect(() => {
        const role = getRole();
        if (!hasSession()) { navigate(LOGIN_PATH); return undefined; }
        if (!peut('DOSSIERS_LIRE')) { navigate(homeForRole(role)); return undefined; }
        const timer = window.setTimeout(charger, 0);
        return () => window.clearTimeout(timer);
    }, [charger, navigate]);

    const grossesses = data?.grossesses || [];
    const vaccins = data?.vaccins || [];

    return (
        <AdminLayout title="Suivi maternité" subtitle="Grossesses en cours, consultations prénatales et vaccinations des enfants">
            <Notice tone="error" onClose={() => setError('')}>{error}</Notice>
            {loading && <SkeletonList rows={4} />}

            <section className={`${card} p-5`}>
                <h2 className="mb-4 flex items-center gap-2 font-semibold"><HeartPulse size={18} className="text-rose-600" />Grossesses en cours <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs dark:bg-gray-800">{grossesses.length}</span></h2>
                {!loading && grossesses.length === 0 && <p className="py-6 text-center text-sm text-slate-500">Aucune grossesse en cours. Ouvrez-en une depuis le dossier d’une patiente.</p>}
                <ul className="grid gap-3 lg:grid-cols-2">
                    {grossesses.map(g => (
                        <li key={g.grossesseId} className={`rounded-2xl border p-4 ${g.rappels.length ? 'border-amber-300 dark:border-amber-500/30' : 'border-slate-200 dark:border-gray-800'}`}>
                            <div className="flex flex-wrap items-start justify-between gap-2">
                                <div>
                                    <Link to={dossier(g.telephone)} className="font-semibold text-teal-800 hover:underline dark:text-teal-300">{g.nom || 'Patiente'}</Link>
                                    <p className="text-xs text-slate-500">{formatPhone(g.telephone)}</p>
                                </div>
                                <div className="text-right">
                                    <p className="text-lg font-bold">{g.sa} SA{g.saJours ? ` + ${g.saJours} j` : ''}</p>
                                    <p className="text-xs text-slate-500">Terme : {date(g.dpa)}</p>
                                </div>
                            </div>
                            {g.rappels.length > 0 && <ul className="mt-3 space-y-1">{g.rappels.map(r => <li key={r} className="flex items-start gap-2 text-sm text-amber-800 dark:text-amber-300"><AlertTriangle size={15} className="mt-0.5 shrink-0" />{r}</li>)}</ul>}
                            {g.prochainRdv && <p className="mt-2 flex items-center gap-2 text-sm"><CalendarClock size={15} className="text-teal-700" />Prochaine consultation prévue le <strong>{date(g.prochainRdv)}</strong></p>}
                        </li>
                    ))}
                </ul>
            </section>

            <section className={`${card} p-5`}>
                <h2 className="mb-4 flex items-center gap-2 font-semibold"><Syringe size={18} className="text-sky-700" />Vaccins à faire ou en retard <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs dark:bg-gray-800">{vaccins.length}</span></h2>
                {!loading && vaccins.length === 0 && <p className="py-6 text-center text-sm text-slate-500">Aucun vaccin en attente.</p>}
                {vaccins.length > 0 && (
                    <div className="overflow-x-auto">
                        <table className="w-full min-w-[560px] text-left text-sm">
                            <thead className="bg-slate-50 text-xs uppercase text-slate-500 dark:bg-gray-800/60"><tr>{['Enfant', 'Vaccin', 'Échéance', 'État'].map(h => <th key={h} className="px-4 py-2 font-semibold">{h}</th>)}</tr></thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-gray-800">
                                {vaccins.map(v => (
                                    <tr key={`${v.enfantId}-${v.code}`}>
                                        <td className="px-4 py-2"><Link to={dossier(v.telephone)} className="inline-flex items-center gap-1.5 font-medium text-teal-800 hover:underline dark:text-teal-300"><Baby size={14} />{v.enfantNom}</Link><span className="block text-xs text-slate-500">Mère : {v.mere || formatPhone(v.telephone)}</span></td>
                                        <td className="px-4 py-2">{v.vaccin}</td>
                                        <td className="px-4 py-2 whitespace-nowrap">{date(v.echeance)}</td>
                                        <td className="px-4 py-2"><span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${v.statut === 'EN_RETARD' ? 'bg-rose-100 text-rose-800 dark:bg-rose-500/15 dark:text-rose-300' : 'bg-amber-100 text-amber-800 dark:bg-amber-500/15 dark:text-amber-300'}`}>{v.statut === 'EN_RETARD' ? 'En retard' : 'À faire bientôt'}</span></td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </section>
            <p className="text-xs text-slate-500">Les calendriers sont des repères (modèle OMS à 4 consultations prénatales, calendrier vaccinal de l’enfant) : ils aident à ne rien oublier mais ne remplacent pas l’avis du médecin ou de la sage-femme.</p>
        </AdminLayout>
    );
}
