import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CalendarDays, RefreshCw, Trash2 } from 'lucide-react';
import axiosClient from '../api/axiosClient';
import AdminLayout from '../components/AdminLayout';
import { getRoleLabel } from '../constants/app';
import { apiErrorMessage, getRole, hasSession, homeForRole, LOGIN_PATH, peut } from '../utils/auth';

export default function Corbeille() {
    const navigate = useNavigate();
    const role = getRole();
    const superAdmin = role === 'SUPER_ADMIN';
    const peutVider = peut('RDV_SUPPRIMER_DEFINITIVEMENT');
    const [items, setItems] = useState([]);
    const [error, setError] = useState('');
    const [notice, setNotice] = useState('');
    const [dialog, setDialog] = useState(null);

    const load = useCallback(async () => {
        try { const { data } = await axiosClient.get('/rdv/corbeille'); setItems(data); }
        catch (err) { setError(apiErrorMessage(err, 'Impossible de charger la corbeille.')); }
    }, []);

    useEffect(() => {
        if (!hasSession()) { navigate(LOGIN_PATH); return undefined; }
        if (!peut('RDV_CORBEILLE')) { navigate(homeForRole(role)); return undefined; }
        const timer = window.setTimeout(load, 0);
        return () => window.clearTimeout(timer);
    }, [load, navigate, role]);

    const run = async action => {
        setError(''); setNotice('');
        try {
            if (action === 'empty') await axiosClient.delete('/rdv/corbeille');
            else if (action.type === 'delete') await axiosClient.delete(`/rdv/corbeille/${action.id}`);
            else { await axiosClient.put(`/rdv/${action.id}/restaurer`); setNotice('Rendez-vous restauré.'); }
            setDialog(null); await load();
        } catch (err) { setError(apiErrorMessage(err, 'Cette action n’a pas pu être effectuée. Réessayez.')); setDialog(null); }
    };
    const confirmation = dialog === 'empty'
        ? `Supprimer définitivement ${items.length} rendez-vous ? Cette action est irréversible.`
        : 'Supprimer définitivement ce rendez-vous ? Cette action est irréversible.';

    return (
        <AdminLayout title="Corbeille" subtitle={`${items.length} rendez-vous supprimé${items.length === 1 ? '' : 's'}`}>
            {error && <p role="alert" className="rounded-xl bg-rose-50 p-3 text-sm text-rose-700 dark:bg-rose-500/10 dark:text-rose-200">{error}</p>}
            {notice && <p role="status" className="rounded-xl bg-emerald-50 p-3 text-sm text-emerald-800 dark:bg-emerald-500/10 dark:text-emerald-200">{notice}</p>}
            <section className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm dark:border-gray-800 dark:bg-gray-900">
                {peutVider && (
                    <div className="flex justify-end border-b border-slate-200 p-4 dark:border-gray-800">
                        <button disabled={!items.length} onClick={() => setDialog('empty')} className="rounded-xl bg-rose-700 px-4 py-2 text-sm font-semibold text-white transition hover:bg-rose-800 disabled:opacity-40">Vider la corbeille</button>
                    </div>
                )}
                <div className="overflow-x-auto">
                    <table className="w-full min-w-[700px] text-left text-sm">
                        <thead className="bg-slate-50 text-xs uppercase text-slate-500 dark:bg-gray-800/60">
                            <tr>{['Patient', 'Téléphone', 'Date', 'Heure', 'Supprimé le', ...(superAdmin ? ['Supprimé par'] : []), 'Actions'].map(label => <th key={label} className="px-4 py-3 font-semibold">{label}</th>)}</tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-gray-800">
                            {items.map(item => {
                                const rdv = item.rendezVous || item;
                                return (
                                    <tr key={rdv.id}>
                                        <td className="px-4 py-3 font-medium">{rdv.nomClient}</td>
                                        <td className="px-4 py-3">{rdv.telephoneClient}</td>
                                        <td className="px-4 py-3">{rdv.dateRdv}</td>
                                        <td className="px-4 py-3">{rdv.heureRdv?.slice(0, 5)}</td>
                                        <td className="px-4 py-3">{rdv.deletedAt ? new Date(rdv.deletedAt).toLocaleString('fr-FR') : '—'}</td>
                                        {superAdmin && <td className="px-4 py-3">{item.deletedBy ? `${item.deletedBy.nom} · ${getRoleLabel(item.deletedBy.role)}` : '—'}</td>}
                                        <td className="px-4 py-3">
                                            <div className="flex gap-1">
                                                <button onClick={() => run({ type: 'restore', id: rdv.id })} title="Restaurer" aria-label="Restaurer" className="rounded-lg p-2 text-teal-700 transition hover:bg-teal-50 dark:text-teal-300 dark:hover:bg-teal-500/10"><RefreshCw size={16} /></button>
                                                {peutVider && <button onClick={() => setDialog({ type: 'delete', id: rdv.id })} title="Supprimer définitivement" aria-label="Supprimer définitivement" className="rounded-lg p-2 text-rose-700 transition hover:bg-rose-50 dark:text-rose-300 dark:hover:bg-rose-500/10"><Trash2 size={16} /></button>}
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                    {!items.length && <div className="flex flex-col items-center gap-2 p-12 text-center text-sm text-slate-500"><CalendarDays size={22} className="text-slate-400" />La corbeille est vide</div>}
                </div>
            </section>
            {dialog && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4 backdrop-blur-sm">
                    <section role="alertdialog" aria-modal="true" className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl dark:bg-gray-900">
                        <p className="text-sm">{confirmation}</p>
                        <div className="mt-6 flex justify-end gap-2">
                            <button onClick={() => setDialog(null)} className="rounded-xl border border-slate-200 px-4 py-2 text-sm dark:border-gray-700">Annuler</button>
                            <button onClick={() => run(dialog)} className="rounded-xl bg-rose-700 px-4 py-2 text-sm font-semibold text-white hover:bg-rose-800">Supprimer définitivement</button>
                        </div>
                    </section>
                </div>
            )}
        </AdminLayout>
    );
}
