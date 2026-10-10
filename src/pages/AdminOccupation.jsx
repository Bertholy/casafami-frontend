import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, ChevronRight, Loader2 } from 'lucide-react';
import axiosClient from '../api/axiosClient';
import AdminLayout from '../components/AdminLayout';
import Notice from '../components/Notice';
import OccupationGrid from '../components/dashboard/OccupationGrid';
import { formatDateFr, todayISO } from '../constants/app';
import { btnSecondary, card, inputClass } from '../constants/ui';
import { apiErrorMessage, getRole, hasSession, homeForRole, LOGIN_PATH } from '../utils/auth';

const decaler = (iso, jours) => { const d = new Date(`${iso}T12:00:00`); d.setDate(d.getDate() + jours); return d.toLocaleDateString('en-CA'); };

/** Occupation du personnel, créneau par créneau, pour la journée choisie (super administrateur). */
export default function AdminOccupation() {
    const navigate = useNavigate();
    const [date, setDate] = useState(todayISO());
    const [data, setData] = useState(null);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(true);

    const load = useCallback(async () => {
        setLoading(true); setError('');
        try { const { data: result } = await axiosClient.get('/admin/occupation', { params: { date } }); setData(result); }
        catch (err) { setError(apiErrorMessage(err, 'Impossible de charger l’occupation du personnel.')); }
        finally { setLoading(false); }
    }, [date]);

    useEffect(() => {
        const role = getRole();
        if (!hasSession()) { navigate(LOGIN_PATH); return undefined; }
        if (role !== 'SUPER_ADMIN') { navigate(homeForRole(role)); return undefined; }
        const timer = window.setTimeout(load, 0);
        const interval = window.setInterval(load, 30000);
        return () => { window.clearTimeout(timer); window.clearInterval(interval); };
    }, [load, navigate]);

    return (
        <AdminLayout title="Occupation du personnel" subtitle="Qui est libre, qui est pris, créneau par créneau">
            <Notice tone="error" onClose={() => setError('')}>{error}</Notice>
            <section className={`${card} p-4 sm:p-5`}>
                <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                    <h2 className="font-semibold capitalize">{formatDateFr(date, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</h2>
                    <div className="flex items-center gap-2">
                        {loading && <Loader2 size={16} className="animate-spin text-slate-400" />}
                        <button onClick={() => setDate(todayISO())} className={btnSecondary}>Aujourd’hui</button>
                        <button onClick={() => setDate(decaler(date, -1))} aria-label="Jour précédent" className="rounded-xl border border-slate-200 p-2.5 hover:bg-slate-50 dark:border-gray-700 dark:hover:bg-gray-800"><ChevronLeft size={16} /></button>
                        <input type="date" value={date} onChange={e => e.target.value && setDate(e.target.value)} aria-label="Choisir le jour" className={`${inputClass} w-44`} />
                        <button onClick={() => setDate(decaler(date, 1))} aria-label="Jour suivant" className="rounded-xl border border-slate-200 p-2.5 hover:bg-slate-50 dark:border-gray-700 dark:hover:bg-gray-800"><ChevronRight size={16} /></button>
                    </div>
                </div>
                <OccupationGrid data={data} />
                <ul className="mt-4 flex flex-wrap gap-x-5 gap-y-1 text-xs text-slate-500 dark:text-gray-400">
                    <li><span className="mr-1 inline-block rounded border border-dashed border-emerald-300 px-1.5 text-emerald-700 dark:text-emerald-300">libre</span>créneau disponible</li>
                    <li><span className="mr-1 inline-block rounded bg-amber-100 px-1.5 text-amber-800 dark:bg-amber-500/15 dark:text-amber-300">patient</span>en attente</li>
                    <li><span className="mr-1 inline-block rounded bg-emerald-100 px-1.5 text-emerald-800 dark:bg-emerald-500/15 dark:text-emerald-300">patient</span>confirmé</li>
                    <li><span className="mr-1 inline-block rounded bg-sky-100 px-1.5 text-sky-800 dark:bg-sky-500/15 dark:text-sky-300">patient</span>terminé</li>
                    <li>Ligne « À répartir » : rendez-vous à confier à quelqu’un — attribuez-les depuis le tableau de bord.</li>
                </ul>
            </section>
        </AdminLayout>
    );
}
