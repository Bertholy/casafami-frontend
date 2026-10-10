import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, ChevronRight, Loader2, ScrollText } from 'lucide-react';
import axiosClient from '../api/axiosClient';
import AdminLayout from '../components/AdminLayout';
import Notice from '../components/Notice';
import { getRoleLabel } from '../constants/app';
import { card, inputClass } from '../constants/ui';
import { apiErrorMessage, getRole, hasSession, homeForRole, LOGIN_PATH } from '../utils/auth';

// Libellés lisibles des actions enregistrées par le serveur.
const ACTIONS = {
    CONNEXION: 'Connexion', CONNEXION_ECHEC: 'Échec de connexion', RDV_CREE: 'Rendez-vous créé', RDV_MODIFIE: 'Rendez-vous modifié',
    RDV_CONFIRME: 'Rendez-vous confirmé', RDV_TERMINE: 'Rendez-vous terminé', RDV_ANNULE: 'Rendez-vous annulé', RDV_CORBEILLE: 'Mis en corbeille',
    RDV_RESTAURE: 'Restauré de la corbeille', RDV_SUPPRIME_DEFINITIVEMENT: 'Supprimé définitivement', CORBEILLE_VIDEE: 'Corbeille vidée',
    COMPTE_CREE: 'Compte créé', COMPTE_MODIFIE: 'Compte modifié', COMPTE_SUPPRIME: 'Compte supprimé', ROLE_MODIFIE: 'Rôle modifié',
    MOT_DE_PASSE_REINITIALISE: 'Mot de passe réinitialisé', MOT_DE_PASSE_CHANGE: 'Mot de passe changé',
    SERVICE_CREE: 'Service ajouté', SERVICE_SUPPRIME: 'Service supprimé', THEME_MODIFIE: 'Thème modifié',
    SITE_MODIFIE: 'Site modifié', SITE_REINITIALISE: 'Site réinitialisé', PLANNING_MODIFIE: 'Planning modifié', JOUR_FERME: 'Jour fermé', JOUR_ROUVERT: 'Jour rouvert',
    DOSSIER_MODIFIE: 'Dossier patient modifié', CONSULTATION_CREEE: 'Consultation enregistrée', CONSULTATION_MODIFIEE: 'Consultation modifiée', CONSULTATION_SUPPRIMEE: 'Consultation supprimée',
    MALADIE_CREEE: 'Maladie ajoutée', MALADIE_MODIFIEE: 'Maladie modifiée', MALADIE_SUPPRIMEE: 'Maladie supprimée',
    TRAITEMENT_AJOUTE: 'Traitement ajouté', TRAITEMENT_MODIFIE: 'Traitement modifié', TRAITEMENT_SUPPRIME: 'Traitement supprimé',
    EXPORT: 'Export', ENCODAGE_REPARE: 'Textes cassés réparés', RAPPELS_ENVOYES: 'Rappels envoyés', RAPPELS_MANUELS: 'Rappels envoyés (manuel)',
};
const GRAVES = ['CONNEXION_ECHEC', 'RDV_SUPPRIME_DEFINITIVEMENT', 'CORBEILLE_VIDEE', 'COMPTE_SUPPRIME', 'ROLE_MODIFIE', 'MOT_DE_PASSE_REINITIALISE', 'CONSULTATION_SUPPRIMEE'];

export default function AdminJournal() {
    const navigate = useNavigate();
    const [filtres, setFiltres] = useState({ action: '', q: '', debut: '', fin: '' });
    const [page, setPage] = useState(0);
    const [data, setData] = useState({ contenu: [], totalPages: 1, total: 0, actions: [] });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    const load = useCallback(async () => {
        setLoading(true); setError('');
        try {
            const { data: result } = await axiosClient.get('/admin/journal', { params: { ...filtres, page, size: 25 } });
            setData(result);
        } catch (err) { setError(apiErrorMessage(err, 'Impossible de charger le journal.')); }
        finally { setLoading(false); }
    }, [filtres, page]);

    useEffect(() => {
        const role = getRole();
        if (!hasSession()) { navigate(LOGIN_PATH); return undefined; }
        if (role !== 'SUPER_ADMIN') { navigate(homeForRole(role)); return undefined; }
        const timer = window.setTimeout(load, 250);
        return () => window.clearTimeout(timer);
    }, [load, navigate]);

    const set = (key, value) => { setFiltres(current => ({ ...current, [key]: value })); setPage(0); };

    return (
        <AdminLayout title="Journal d’audit" subtitle="Qui a fait quoi, et quand">
            <Notice tone="error">{error}</Notice>
            <section className={`${card} p-4`}>
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                    <label className="text-xs font-medium text-slate-500">Action
                        <select value={filtres.action} onChange={e => set('action', e.target.value)} className={`${inputClass} mt-1`}>
                            <option value="">Toutes les actions</option>
                            {data.actions.map(a => <option key={a} value={a}>{ACTIONS[a] || a}</option>)}
                        </select></label>
                    <label className="text-xs font-medium text-slate-500">Recherche (personne, patient, détail)
                        <input value={filtres.q} onChange={e => set('q', e.target.value)} placeholder="Ex. nom, e-mail…" className={`${inputClass} mt-1`} /></label>
                    <label className="text-xs font-medium text-slate-500">Du<input type="date" value={filtres.debut} onChange={e => set('debut', e.target.value)} className={`${inputClass} mt-1`} /></label>
                    <label className="text-xs font-medium text-slate-500">Au<input type="date" value={filtres.fin} onChange={e => set('fin', e.target.value)} className={`${inputClass} mt-1`} /></label>
                </div>
            </section>

            <section className={`${card} overflow-hidden`}>
                <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4 dark:border-gray-800">
                    <div className="flex items-center gap-2"><ScrollText size={19} className="text-teal-700" /><h2 className="font-semibold">Événements</h2><span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs dark:bg-gray-800">{data.total}</span></div>
                    <button onClick={load} className="text-sm text-teal-700 hover:underline dark:text-teal-300">Actualiser</button>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full min-w-[820px] text-left text-sm">
                        <thead className="bg-slate-50 text-xs uppercase text-slate-500 dark:bg-gray-800/60"><tr>{['Date', 'Personne', 'Action', 'Détail'].map(h => <th key={h} className="px-4 py-3 font-semibold">{h}</th>)}</tr></thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-gray-800">
                            {data.contenu.map(e => (
                                <tr key={e.id}>
                                    <td className="whitespace-nowrap px-4 py-3 tabular-nums text-slate-600 dark:text-gray-300">{new Date(e.dateHeure).toLocaleString('fr-FR')}</td>
                                    <td className="px-4 py-3"><div className="font-medium">{e.acteurEmail}</div><div className="text-xs text-slate-500">{e.acteurRole === 'PUBLIC' ? 'Visiteur du site' : e.acteurRole === 'SYSTEME' ? 'Système' : getRoleLabel(e.acteurRole)}</div></td>
                                    <td className="px-4 py-3"><span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${GRAVES.includes(e.action) ? 'bg-rose-100 text-rose-800 dark:bg-rose-500/15 dark:text-rose-300' : 'bg-slate-100 text-slate-700 dark:bg-gray-800 dark:text-gray-200'}`}>{ACTIONS[e.action] || e.action}</span></td>
                                    <td className="px-4 py-3 text-slate-600 dark:text-gray-300">{e.details || '—'}{e.cibleId ? <span className="ml-2 text-xs text-slate-400">#{e.cibleId}</span> : null}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    {loading && <div className="flex items-center justify-center gap-2 p-10 text-sm text-slate-500"><Loader2 size={18} className="animate-spin" />Chargement…</div>}
                    {!loading && data.contenu.length === 0 && <div className="p-10 text-center text-sm text-slate-500">Aucun événement ne correspond à ces filtres.</div>}
                </div>
                <div className="flex items-center justify-end gap-2 border-t border-slate-200 px-4 py-3 text-xs text-slate-500 dark:border-gray-800">
                    <button disabled={page <= 0} onClick={() => setPage(page - 1)} aria-label="Page précédente" className="rounded-lg border border-slate-200 p-1.5 disabled:opacity-40 dark:border-gray-700"><ChevronLeft size={16} /></button>
                    <span>Page {page + 1} / {Math.max(1, data.totalPages)}</span>
                    <button disabled={page + 1 >= data.totalPages} onClick={() => setPage(page + 1)} aria-label="Page suivante" className="rounded-lg border border-slate-200 p-1.5 disabled:opacity-40 dark:border-gray-700"><ChevronRight size={16} /></button>
                </div>
            </section>
        </AdminLayout>
    );
}
