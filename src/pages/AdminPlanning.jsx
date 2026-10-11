import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { BellRing, CalendarOff, Loader2, Plus, Save, Trash2 } from 'lucide-react';
import axiosClient from '../api/axiosClient';
import AdminLayout from '../components/AdminLayout';
import Notice from '../components/Notice';
import { formatDateFr, todayISO } from '../constants/app';
import { btnPrimary, btnSecondary, card, inputClass } from '../constants/ui';
import { resetPlanningCache } from '../utils/horaires';
import { apiErrorMessage, getRole, hasSession, homeForRole, LOGIN_PATH, peut } from '../utils/auth';

const JOURS = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche'];
const hhmm = value => (value ? String(value).slice(0, 5) : '');

export default function AdminPlanning() {
    const navigate = useNavigate();
    const [planning, setPlanning] = useState(null);
    const [fermes, setFermes] = useState([]);
    const [nouveau, setNouveau] = useState({ date: '', motif: '' });
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');
    const [notice, setNotice] = useState('');

    const load = useCallback(async () => {
        try {
            const { data } = await axiosClient.get('/planning');
            const { joursFermes, ...reste } = data;
            setPlanning({ ...reste, horaires: reste.horaires.map(h => ({ ...h, matinDebut: hhmm(h.matinDebut), matinFin: hhmm(h.matinFin), apresMidiDebut: hhmm(h.apresMidiDebut), apresMidiFin: hhmm(h.apresMidiFin) })) });
            setFermes(joursFermes);
        } catch (err) { setError(apiErrorMessage(err, 'Impossible de charger le planning.')); }
    }, []);

    useEffect(() => {
        const role = getRole();
        if (!hasSession()) { navigate(LOGIN_PATH); return undefined; }
        if (!peut('PLANNING_GERER')) { navigate(homeForRole(role)); return undefined; }
        const timer = window.setTimeout(load, 0);
        return () => window.clearTimeout(timer);
    }, [load, navigate]);

    const setJour = (index, patch) => setPlanning(current => ({ ...current, horaires: current.horaires.map((h, i) => (i === index ? { ...h, ...patch } : h)) }));

    const enregistrer = async () => {
        setSaving(true); setError(''); setNotice('');
        const payload = {
            dureeCreneauMinutes: Number(planning.dureeCreneauMinutes),
            capaciteParCreneau: Number(planning.capaciteParCreneau),
            horaires: planning.horaires.map(h => ({
                jourSemaine: h.jourSemaine, ouvert: h.ouvert,
                matinDebut: h.ouvert && h.matinDebut ? h.matinDebut : null, matinFin: h.ouvert && h.matinFin ? h.matinFin : null,
                apresMidiDebut: h.ouvert && h.apresMidiDebut ? h.apresMidiDebut : null, apresMidiFin: h.ouvert && h.apresMidiFin ? h.apresMidiFin : null,
            })),
        };
        try { await axiosClient.put('/admin/planning', payload); resetPlanningCache(); setNotice('Planning enregistré. Il s’applique immédiatement à la prise de rendez-vous et au site.'); await load(); }
        catch (err) { setError(apiErrorMessage(err, 'Enregistrement impossible.')); }
        finally { setSaving(false); }
    };

    const fermer = async event => {
        event.preventDefault(); setError(''); setNotice('');
        try {
            const { data } = await axiosClient.post('/admin/jours-fermes', { date: nouveau.date, motif: nouveau.motif });
            setNouveau({ date: '', motif: '' }); resetPlanningCache();
            const prevenus = data.personnelPrevenu > 0 ? ` Le personnel est prévenu : ${data.personnelPrevenu} notification(s) et ${data.smsEnvoyes} SMS (simulés tant que le SMS réel n’est pas activé).` : '';
            setNotice((data.rdvImpactes > 0
                ? `Jour fermé. Attention : ${data.rdvImpactes} rendez-vous existent déjà ce jour-là — pensez à prévenir les patients (annulez-les ou déplacez-les).`
                : 'Jour fermé : plus aucun créneau ne sera proposé.') + prevenus);
            await load();
        } catch (err) { setError(apiErrorMessage(err, 'Impossible de fermer ce jour.')); }
    };

    const rouvrir = async jour => {
        try { await axiosClient.delete(`/admin/jours-fermes/${jour.id}`); resetPlanningCache(); setFermes(current => current.filter(j => j.id !== jour.id)); setNotice('Jour rouvert. Le personnel en est informé.'); }
        catch (err) { setError(apiErrorMessage(err, 'Impossible de rouvrir ce jour.')); }
    };

    const rappels = async () => {
        setError(''); setNotice('');
        try {
            const { data } = await axiosClient.post('/admin/rappels/envoyer');
            setNotice(`${data.envoyes} rappel(s) pour les rendez-vous de demain ${data.envoyes ? '(simulation : visibles dans les journaux du serveur tant que le SMS réel n’est pas activé).' : '— aucun rappel en attente.'}`);
        } catch (err) { setError(apiErrorMessage(err, 'Envoi des rappels impossible.')); }
    };

    if (!planning) return <AdminLayout title="Horaires et congés"><Notice tone="error">{error}</Notice>{!error && <div className="flex items-center justify-center gap-2 p-12 text-sm text-slate-500"><Loader2 className="animate-spin" size={18} />Chargement…</div>}</AdminLayout>;

    return (
        <AdminLayout title="Horaires et congés" subtitle="Les créneaux proposés aux patients sont calculés à partir de ces réglages">
            <Notice tone="success" onClose={() => setNotice('')}>{notice}</Notice>
            <Notice tone="error" onClose={() => setError('')}>{error}</Notice>

            <section className={`${card} p-5`}>
                <h2 className="font-semibold">Réglages des créneaux</h2>
                <div className="mt-4 grid gap-4 sm:grid-cols-2">
                    <label className="text-sm font-medium">Durée d’un créneau (minutes)
                        <input type="number" min={15} max={120} step={5} value={planning.dureeCreneauMinutes} onChange={e => setPlanning({ ...planning, dureeCreneauMinutes: e.target.value })} className={`${inputClass} mt-1.5`} /></label>
                    <label className="text-sm font-medium">Rendez-vous simultanés par créneau
                        <input type="number" min={1} max={20} value={planning.capaciteParCreneau} onChange={e => setPlanning({ ...planning, capaciteParCreneau: e.target.value })} className={`${inputClass} mt-1.5`} />
                        <span className="mt-1 block text-xs font-normal text-slate-500">1 = un seul patient à la fois. Mettez 2 si deux praticiens reçoivent en même temps.</span></label>
                </div>
            </section>

            <section className={`${card} overflow-hidden`}>
                <div className="border-b border-slate-200 px-5 py-4 dark:border-gray-800"><h2 className="font-semibold">Horaires d’ouverture</h2><p className="text-xs text-slate-500">Laissez une plage vide si le cabinet ne reçoit pas à ce moment (ex. pas d’après-midi).</p></div>
                <div className="overflow-x-auto">
                    <table className="w-full min-w-[760px] text-left text-sm">
                        <thead className="bg-slate-50 text-xs uppercase text-slate-500 dark:bg-gray-800/60"><tr><th className="px-4 py-3">Jour</th><th className="px-4 py-3">Ouvert</th><th className="px-4 py-3">Matin (de / à)</th><th className="px-4 py-3">Après-midi (de / à)</th></tr></thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-gray-800">
                            {planning.horaires.map((h, i) => (
                                <tr key={h.jourSemaine} className={h.ouvert ? '' : 'bg-slate-50/60 text-slate-400 dark:bg-gray-800/30'}>
                                    <td className="px-4 py-3 font-medium">{JOURS[h.jourSemaine - 1]}</td>
                                    <td className="px-4 py-3"><input type="checkbox" checked={h.ouvert} onChange={e => setJour(i, { ouvert: e.target.checked })} aria-label={`${JOURS[h.jourSemaine - 1]} ouvert`} className="h-4 w-4 accent-teal-700" /></td>
                                    <td className="px-4 py-3"><div className="flex items-center gap-2"><input type="time" disabled={!h.ouvert} value={h.matinDebut} onChange={e => setJour(i, { matinDebut: e.target.value })} aria-label={`${JOURS[h.jourSemaine - 1]} début du matin`} className={`${inputClass} w-28`} />→<input type="time" disabled={!h.ouvert} value={h.matinFin} onChange={e => setJour(i, { matinFin: e.target.value })} aria-label={`${JOURS[h.jourSemaine - 1]} fin du matin`} className={`${inputClass} w-28`} /></div></td>
                                    <td className="px-4 py-3"><div className="flex items-center gap-2"><input type="time" disabled={!h.ouvert} value={h.apresMidiDebut} onChange={e => setJour(i, { apresMidiDebut: e.target.value })} aria-label={`${JOURS[h.jourSemaine - 1]} début de l’après-midi`} className={`${inputClass} w-28`} />→<input type="time" disabled={!h.ouvert} value={h.apresMidiFin} onChange={e => setJour(i, { apresMidiFin: e.target.value })} aria-label={`${JOURS[h.jourSemaine - 1]} fin de l’après-midi`} className={`${inputClass} w-28`} /></div></td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                <div className="flex justify-end border-t border-slate-200 p-4 dark:border-gray-800"><button onClick={enregistrer} disabled={saving} className={btnPrimary}>{saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}Enregistrer le planning</button></div>
            </section>

            <section className={`${card} p-5`}>
                <div className="mb-4 flex items-center gap-2"><CalendarOff size={19} className="text-teal-700" /><h2 className="font-semibold">Jours de fermeture (congés, jours fériés)</h2></div>
                <form onSubmit={fermer} className="grid gap-3 sm:grid-cols-[180px_1fr_auto]">
                    <input required type="date" min={todayISO()} value={nouveau.date} onChange={e => setNouveau({ ...nouveau, date: e.target.value })} aria-label="Date de fermeture" className={inputClass} />
                    <input maxLength={200} value={nouveau.motif} onChange={e => setNouveau({ ...nouveau, motif: e.target.value })} placeholder="Motif (ex. 26 juin — fête de l’Indépendance)" aria-label="Motif de fermeture" className={inputClass} />
                    <button className={btnPrimary}><Plus size={16} />Fermer ce jour</button>
                </form>
                {fermes.length === 0 ? <p className="mt-4 text-sm text-slate-500">Aucune fermeture exceptionnelle à venir.</p> : (
                    <ul className="mt-4 divide-y divide-slate-100 dark:divide-gray-800">
                        {fermes.map(j => (
                            <li key={j.id} className="flex items-center justify-between gap-3 py-2.5 text-sm">
                                <span><strong className="capitalize">{formatDateFr(j.date, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</strong>{j.motif ? ` — ${j.motif}` : ''}</span>
                                <button onClick={() => rouvrir(j)} aria-label={`Rouvrir le ${j.date}`} className="rounded-lg p-2 text-rose-700 hover:bg-rose-50 dark:text-rose-300 dark:hover:bg-rose-500/10"><Trash2 size={16} /></button>
                            </li>
                        ))}
                    </ul>
                )}
            </section>

            <section className={`${card} flex flex-wrap items-center justify-between gap-4 p-5`}>
                <div><h2 className="flex items-center gap-2 font-semibold"><BellRing size={18} className="text-teal-700" />Rappels de rendez-vous</h2>
                    <p className="mt-1 max-w-xl text-sm text-slate-500 dark:text-gray-400">Chaque jour à 18h, un SMS de rappel est envoyé aux patients qui ont rendez-vous le lendemain. Tant que l’envoi réel de SMS n’est pas activé, les rappels sont seulement écrits dans les journaux du serveur.</p></div>
                <button onClick={rappels} className={btnSecondary}><BellRing size={16} />Envoyer les rappels de demain maintenant</button>
            </section>
        </AdminLayout>
    );
}
