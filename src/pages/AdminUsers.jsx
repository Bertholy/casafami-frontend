import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { KeyRound, Loader2, Pencil, Plus, ShieldCheck, Trash2, UserCog, X } from 'lucide-react';
import axiosClient from '../api/axiosClient';
import AdminLayout from '../components/AdminLayout';
import { apiErrorMessage, clearSession, getEmail, getRole, hasSession, homeForRole, LOGIN_PATH, peut } from '../utils/auth';

const ROLES = [
    ['MEDECIN', 'Médecin'],
    ['SAGE_FEMME', 'Sage-femme'],
    ['SECRETAIRE', 'Secrétaire'],
    ['SUPER_ADMIN', 'Super administrateur'],
];
const EMPTY = { nom: '', email: '', motDePasse: '', telephone: '', role: 'SAGE_FEMME' };
const field = 'rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none transition focus:border-teal-600 focus:ring-2 focus:ring-teal-600/20 dark:border-gray-700 dark:bg-gray-950';
const card = 'rounded-2xl border border-slate-200/80 bg-white shadow-sm dark:border-gray-800 dark:bg-gray-900';

export default function AdminUsers() {
    const navigate = useNavigate();
    const [users, setUsers] = useState([]);
    const [form, setForm] = useState(EMPTY);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');
    const [notice, setNotice] = useState('');
    const myEmail = getEmail();
    const [dialog, setDialog] = useState(null); // { type: 'edit' | 'password', user, nom, email, telephone, motDePasse }
    const [dialogError, setDialogError] = useState('');
    const [dialogSaving, setDialogSaving] = useState(false);

    // silencieux = actualisation en arrière-plan : la liste reste affichée au lieu de repasser par « Chargement… »
    const load = useCallback(async (silencieux = false) => {
        if (!silencieux) setLoading(true);
        try { const response = await axiosClient.get('/admin/users'); setUsers(response.data); }
        catch (err) { setError(apiErrorMessage(err, 'Impossible de charger les comptes.')); }
        finally { setLoading(false); }
    }, []);

    useEffect(() => {
        const role = getRole();
        if (!hasSession()) { navigate(LOGIN_PATH); return undefined; }
        if (!peut('COMPTES_GERER')) { navigate(homeForRole(role)); return undefined; }
        const timer = window.setTimeout(() => load(), 0);
        return () => window.clearTimeout(timer);
    }, [load, navigate]);

    const createUser = async event => {
        event.preventDefault(); setSaving(true); setError(''); setNotice('');
        try {
            const { data: cree } = await axiosClient.post('/admin/users', form);
            // le nouveau compte apparaît immédiatement (sans attendre le rechargement de la liste)
            setUsers(current => [...current.filter(u => u.id !== cree.id), cree]);
            setForm(EMPTY);
            setNotice(`Compte créé pour ${cree.nom} (${cree.email}). La personne peut se connecter avec son e-mail et son mot de passe.`);
            load(true);
        } catch (err) { setError(apiErrorMessage(err, 'La création du compte a échoué. Vérifiez les informations.')); }
        finally { setSaving(false); }
    };

    const changeRole = async (user, role) => {
        setError(''); setNotice('');
        try {
            const response = await axiosClient.patch(`/admin/users/${user.id}/role`, { role });
            setUsers(current => current.map(item => item.id === user.id ? response.data : item));
            setNotice(`Rôle de ${user.nom} modifié.`);
            if (user.email === myEmail && role !== 'SUPER_ADMIN') { clearSession(); navigate(LOGIN_PATH); }
        } catch (err) { setError(apiErrorMessage(err, 'La modification du rôle a échoué.')); await load(); }
    };

    const deleteUser = async user => {
        if (!window.confirm(`Supprimer le compte de ${user.nom} (${user.email}) ?`)) return;
        setError(''); setNotice('');
        try { await axiosClient.delete(`/admin/users/${user.id}`); setUsers(current => current.filter(item => item.id !== user.id)); setNotice('Compte supprimé.'); }
        catch (err) { setError(apiErrorMessage(err, 'La suppression du compte a échoué.')); }
    };

    const openDialog = (type, user) => {
        setDialogError('');
        setDialog({ type, user, nom: user.nom, email: user.email, telephone: user.telephone || '', motDePasse: '' });
    };

    const submitDialog = async event => {
        event.preventDefault(); setDialogSaving(true); setDialogError('');
        try {
            if (dialog.type === 'edit') {
                const response = await axiosClient.put('/admin/users/' + dialog.user.id, { nom: dialog.nom, email: dialog.email, telephone: dialog.telephone });
                setUsers(current => current.map(item => item.id === dialog.user.id ? response.data : item));
                const emailChanged = dialog.user.email === myEmail && response.data.email !== myEmail;
                setNotice(emailChanged ? 'Votre adresse e-mail a changé : reconnectez-vous avec la nouvelle.' : 'Compte modifié.');
                if (emailChanged) { clearSession(); navigate(LOGIN_PATH); return; }
            } else {
                await axiosClient.put('/admin/users/' + dialog.user.id + '/password', { motDePasse: dialog.motDePasse });
                setNotice('Mot de passe de ' + dialog.user.nom + ' réinitialisé. Communiquez-le-lui de vive voix ; il pourra ensuite le changer lui-même.');
            }
            setDialog(null);
        } catch (err) { setDialogError(apiErrorMessage(err, 'Action impossible. Vérifiez les informations.')); }
        finally { setDialogSaving(false); }
    };

    return (
        <AdminLayout title="Comptes et accès" subtitle="Créez les comptes du personnel et gérez leurs rôles">
            {notice && <div role="status" className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-200">{notice}</div>}
            {error && <div role="alert" className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-200">{error}</div>}

            <section className={`${card} p-5`}>
                <div className="mb-4 flex items-center gap-2"><Plus size={19} className="text-teal-700" /><h2 className="font-semibold">Créer un compte du personnel</h2></div>
                <form onSubmit={createUser} className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    <input required maxLength={100} aria-label="Nom complet" placeholder="Nom complet" value={form.nom} onChange={e => setForm({ ...form, nom: e.target.value })} className={field} />
                    <input required type="email" aria-label="Adresse e-mail" placeholder="Adresse e-mail" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} className={field} />
                    <input required type="password" minLength={10} maxLength={72} autoComplete="new-password" aria-label="Mot de passe" placeholder="Mot de passe (10 caractères min.)" value={form.motDePasse} onChange={e => setForm({ ...form, motDePasse: e.target.value })} className={field} />
                    <input type="tel" maxLength={20} aria-label="Téléphone" placeholder="Téléphone (facultatif)" value={form.telephone} onChange={e => setForm({ ...form, telephone: e.target.value })} className={field} />
                    <select aria-label="Rôle" value={form.role} onChange={e => setForm({ ...form, role: e.target.value })} className={field}>{ROLES.map(([key, label]) => <option key={key} value={key}>{label}</option>)}</select>
                    <button disabled={saving} className="inline-flex items-center justify-center gap-2 rounded-xl bg-teal-700 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-teal-800 disabled:opacity-60">{saving ? <Loader2 size={16} className="animate-spin" /> : <Plus size={16} />}Créer le compte</button>
                </form>
            </section>

            <section className={`${card} overflow-hidden`}>
                <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4 dark:border-gray-800">
                    <div className="flex items-center gap-2"><UserCog size={19} className="text-teal-700" /><h2 className="font-semibold">Comptes existants</h2><span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs dark:bg-gray-800">{users.length}</span></div>
                    <button onClick={() => load()} className="text-sm text-teal-700 hover:underline dark:text-teal-300">Actualiser</button>
                </div>
                {loading ? <div className="flex items-center justify-center gap-2 p-10 text-sm text-slate-500"><Loader2 size={18} className="animate-spin" />Chargement…</div> : (
                    <div className="overflow-x-auto">
                        <table className="w-full min-w-175 text-left text-sm">
                            <thead className="bg-slate-50 text-xs uppercase text-slate-500 dark:bg-gray-800/60"><tr>{['Nom', 'E-mail', 'Téléphone', 'Rôle et accès', 'Action'].map(h => <th key={h} className="px-5 py-3 font-semibold">{h}</th>)}</tr></thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-gray-800">
                                {users.map(user => (
                                    <tr key={user.id}>
                                        <td className="px-5 py-3 font-medium">{user.nom}</td>
                                        <td className="px-5 py-3">{user.email}</td>
                                        <td className="px-5 py-3">{user.telephone || '—'}</td>
                                        <td className="px-5 py-3">
                                            <select aria-label={`Rôle de ${user.nom}`} value={user.role} onChange={e => changeRole(user, e.target.value)} className="rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-sm dark:border-gray-700 dark:bg-gray-950">
                                                {ROLES.concat(user.role === 'INFIRMIERE' ? [['INFIRMIERE', 'Infirmière (ancien rôle)']] : []).map(([key, label]) => <option key={key} value={key}>{label}</option>)}
                                            </select>
                                        </td>
                                        <td className="flex gap-1 px-5 py-3">
                                            <button onClick={() => openDialog('edit', user)} aria-label={'Modifier le compte de ' + user.nom} title="Modifier le nom, l'e-mail ou le téléphone" className="rounded-lg p-2 text-slate-500 transition hover:bg-slate-100 dark:hover:bg-gray-800"><Pencil size={16} /></button>
                                            <button onClick={() => openDialog('password', user)} aria-label={'Réinitialiser le mot de passe de ' + user.nom} title="Réinitialiser le mot de passe" className="rounded-lg p-2 text-slate-500 transition hover:bg-slate-100 dark:hover:bg-gray-800"><KeyRound size={16} /></button>
                                            <button disabled={user.email === myEmail} onClick={() => deleteUser(user)} aria-label={`Supprimer le compte de ${user.nom}`}
                                                title={user.email === myEmail ? 'Vous ne pouvez pas supprimer votre propre compte' : 'Supprimer le compte'}
                                                className="rounded-lg p-2 text-rose-700 transition hover:bg-rose-50 disabled:opacity-30 dark:text-rose-300 dark:hover:bg-rose-500/10"><Trash2 size={16} /></button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                        {users.length === 0 && <div className="p-10 text-center text-sm text-slate-500">Aucun compte trouvé.</div>}
                    </div>
                )}
            </section>

            {dialog && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4 backdrop-blur-sm" onMouseDown={e => { if (e.target === e.currentTarget) setDialog(null); }}>
                    <form onSubmit={submitDialog} role="dialog" aria-modal="true" className="w-full max-w-md space-y-4 rounded-2xl bg-white p-6 shadow-2xl dark:bg-gray-900">
                        <div className="flex items-center justify-between"><h2 className="font-semibold">{dialog.type === 'edit' ? 'Modifier le compte' : 'Réinitialiser le mot de passe'}</h2><button type="button" onClick={() => setDialog(null)} aria-label="Fermer"><X size={18} /></button></div>
                        {dialog.type === 'edit' ? (
                            <>
                                <label className="block text-sm font-medium">Nom complet<input required maxLength={100} value={dialog.nom} onChange={e => setDialog({ ...dialog, nom: e.target.value })} className={field + ' mt-1.5 w-full'} /></label>
                                <label className="block text-sm font-medium">Adresse e-mail<input required type="email" maxLength={150} value={dialog.email} onChange={e => setDialog({ ...dialog, email: e.target.value })} className={field + ' mt-1.5 w-full'} /></label>
                                <label className="block text-sm font-medium">Téléphone<input type="tel" maxLength={20} value={dialog.telephone} onChange={e => setDialog({ ...dialog, telephone: e.target.value })} className={field + ' mt-1.5 w-full'} /></label>
                            </>
                        ) : (
                            <>
                                <p className="text-sm text-slate-600 dark:text-gray-300">Nouveau mot de passe pour <strong>{dialog.user.nom}</strong> ({dialog.user.email}).</p>
                                <label className="block text-sm font-medium">Nouveau mot de passe (10 caractères minimum)<input required type="password" minLength={10} maxLength={72} autoComplete="new-password" value={dialog.motDePasse} onChange={e => setDialog({ ...dialog, motDePasse: e.target.value })} className={field + ' mt-1.5 w-full'} /></label>
                            </>
                        )}
                        {dialogError && <p role="alert" className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700 dark:bg-rose-500/10 dark:text-rose-300">{dialogError}</p>}
                        <div className="flex justify-end gap-2"><button type="button" onClick={() => setDialog(null)} className="rounded-xl border border-slate-200 px-4 py-2 text-sm dark:border-gray-700">Annuler</button><button disabled={dialogSaving} className="inline-flex items-center gap-2 rounded-xl bg-teal-700 px-4 py-2 text-sm font-semibold text-white hover:bg-teal-800 disabled:opacity-50">{dialogSaving && <Loader2 size={15} className="animate-spin" />}Enregistrer</button></div>
                    </form>
                </div>
            )}

            <div className="flex gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-200">
                <ShieldCheck size={18} className="mt-0.5 shrink-0" />
                <p><strong>Règles d’accès :</strong> le super administrateur gère les comptes. Les médecins, sages-femmes et secrétaires ont chacun leur espace. Les comptes avec l’ancien rôle « Infirmière » restent reconnus et peuvent être changés ici.</p>
            </div>
        </AdminLayout>
    );
}
