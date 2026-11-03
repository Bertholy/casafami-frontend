import { useCallback, useEffect, useState } from 'react';
import { SkeletonTable } from '../components/ui/skeleton';
import { useNavigate } from 'react-router-dom';
import { Check, Copy, KeyRound, Loader2, Pencil, Plus, Search, Trash2, UserCog, Wand2, X } from 'lucide-react';
import axiosClient from '../api/axiosClient';
import AdminLayout from '../components/AdminLayout';
import { apiErrorMessage, clearSession, getEmail, getRole, hasSession, homeForRole, LOGIN_PATH, peut } from '../utils/auth';
import ChampMotDePasse from '../components/ChampMotDePasse';

const ROLES = [
    ['MEDECIN', 'Médecin'],
    ['SAGE_FEMME', 'Sage-femme'],
    ['SECRETAIRE', 'Secrétaire'],
    ['SUPER_ADMIN', 'Super administrateur'],
];
// Recherche sans tenir compte des majuscules ni des accents (« Secretaire » trouve « Secrétaire »).
const normaliser = texte => String(texte ?? '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
/** Mot de passe aléatoire de 14 caractères (sans 0/O/1/l/I qu'on confond à la lecture), avec majuscule, minuscule, chiffre et symbole. */
function genererMotDePasse() {
    const groupes = ['ABCDEFGHJKLMNPQRSTUVWXYZ', 'abcdefghijkmnpqrstuvwxyz', '23456789', '!@#$%&*?'];
    const tout = groupes.join('');
    const tirer = max => { const t = new Uint32Array(1); const limite = 0x100000000 - (0x100000000 % max); do crypto.getRandomValues(t); while (t[0] >= limite); return t[0] % max; };
    const signes = groupes.map(g => g[tirer(g.length)]);
    while (signes.length < 14) signes.push(tout[tirer(tout.length)]);
    for (let i = signes.length - 1; i > 0; i--) { const j = tirer(i + 1); [signes[i], signes[j]] = [signes[j], signes[i]]; }
    return signes.join('');
}
const EMPTY = { nom: '', email: '', motDePasse: '', telephone: '', role: 'SAGE_FEMME' };
const field = 'rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none transition focus:border-teal-600 focus:ring-2 focus:ring-teal-600/20 dark:border-gray-700 dark:bg-gray-950';
const card = 'rounded-2xl border border-slate-200/80 bg-white shadow-sm dark:border-gray-800 dark:bg-gray-900';

export default function AdminUsers() {
    const navigate = useNavigate();
    const [users, setUsers] = useState([]);
    const [form, setForm] = useState(EMPTY);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [creation, setCreation] = useState(false);   // le formulaire de création n'est déplié qu'après un clic sur « Créer un compte »
    const [copie, setCopie] = useState(false);
    const [error, setError] = useState('');
    const [notice, setNotice] = useState('');
    const myEmail = getEmail();
    const [dialog, setDialog] = useState(null); // { type: 'edit' | 'password', user, nom, email, telephone, motDePasse }
    const [dialogError, setDialogError] = useState('');
    const [recherche, setRecherche] = useState('');
    const terme = normaliser(recherche.trim());
    const libelleRole = Object.fromEntries([...ROLES, ['INFIRMIERE', 'Infirmière']]);
    const affiches = terme ? users.filter(user => [user.nom, user.email, user.telephone, libelleRole[user.role]].some(valeur => normaliser(valeur).includes(terme))) : users;
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

    const ouvrirCreation = () => { setForm(EMPTY); setCopie(false); setError(''); setNotice(''); setCreation(true); };
    const fermerCreation = () => { setCreation(false); setForm(EMPTY); setCopie(false); };
    const generer = () => { setForm(f => ({ ...f, motDePasse: genererMotDePasse() })); setCopie(false); };
    const copier = async () => {
        try { await navigator.clipboard.writeText(form.motDePasse); setCopie(true); }
        catch { setError('Copie impossible : sélectionnez le mot de passe (œil pour l’afficher) et copiez-le à la main.'); }
    };

    const createUser = async event => {
        event.preventDefault(); setSaving(true); setError(''); setNotice('');
        try {
            const { data: cree } = await axiosClient.post('/admin/users', form);
            // le nouveau compte apparaît immédiatement (sans attendre le rechargement de la liste)
            setUsers(current => [...current.filter(u => u.id !== cree.id), cree]);
            // le mot de passe n'est plus consultable après la création : on le rappelle une dernière fois pour le transmettre
            setNotice(`Compte créé pour ${cree.nom} (${cree.email}). Mot de passe à lui communiquer : ${form.motDePasse}`);
            fermerCreation();
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

            {!creation ? (
                <div>
                    <button type="button" onClick={ouvrirCreation} aria-expanded="false" className="inline-flex items-center gap-2 rounded-xl bg-teal-700 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-teal-800"><Plus size={16} />Créer un compte</button>
                </div>
            ) : (
                <section className={`${card} p-5`}>
                    <div className="mb-4 flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2"><Plus size={19} className="text-teal-700" /><h2 className="font-semibold">Créer un compte du personnel</h2></div>
                        <button type="button" onClick={fermerCreation} aria-label="Fermer le formulaire" title="Fermer le formulaire" className="rounded-lg p-1.5 text-slate-500 transition hover:bg-slate-100 dark:hover:bg-gray-800"><X size={18} /></button>
                    </div>
                    <form onSubmit={createUser} className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                        <input required autoFocus maxLength={100} aria-label="Nom complet" placeholder="Nom complet" value={form.nom} onChange={e => setForm({ ...form, nom: e.target.value })} className={field} />
                        <input required type="email" aria-label="Adresse e-mail" placeholder="Adresse e-mail" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} className={field} />
                        <input type="tel" maxLength={20} aria-label="Téléphone" placeholder="Téléphone (facultatif)" value={form.telephone} onChange={e => setForm({ ...form, telephone: e.target.value })} className={field} />
                        <select aria-label="Rôle" value={form.role} onChange={e => setForm({ ...form, role: e.target.value })} className={field}>{ROLES.map(([key, label]) => <option key={key} value={key}>{label}</option>)}</select>
                        <div className="sm:col-span-2">
                            <div className="flex gap-2">
                                <div className="min-w-0 flex-1"><ChampMotDePasse required minLength={10} maxLength={72} autoComplete="new-password" aria-label="Mot de passe" placeholder="Mot de passe (10 caractères min.)" value={form.motDePasse} onChange={e => { setForm({ ...form, motDePasse: e.target.value }); setCopie(false); }} className={field} /></div>
                                <button type="button" onClick={generer} className="inline-flex shrink-0 items-center gap-2 rounded-xl border border-slate-200 px-3 py-2.5 text-sm font-medium transition hover:bg-slate-50 dark:border-gray-700 dark:hover:bg-gray-800"><Wand2 size={16} aria-hidden="true" />Générer</button>
                                <button type="button" onClick={copier} disabled={!form.motDePasse} aria-label="Copier le mot de passe" title="Copier le mot de passe" className="inline-flex shrink-0 items-center gap-2 rounded-xl border border-slate-200 px-3 py-2.5 text-sm font-medium transition hover:bg-slate-50 disabled:opacity-40 dark:border-gray-700 dark:hover:bg-gray-800">{copie ? <Check size={16} aria-hidden="true" /> : <Copy size={16} aria-hidden="true" />}{copie ? 'Copié' : 'Copier'}</button>
                            </div>
                            <p className="mt-1.5 text-xs text-slate-500 dark:text-gray-400">Cliquez sur « Générer » pour un mot de passe sûr, puis communiquez-le à la personne de vive voix : elle pourra le changer ensuite.</p>
                        </div>
                        <div className="flex items-start gap-2">
                            <button disabled={saving} className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-teal-700 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-teal-800 disabled:opacity-60">{saving ? <Loader2 size={16} className="animate-spin" /> : <Plus size={16} />}Créer le compte</button>
                            <button type="button" onClick={fermerCreation} className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm transition hover:bg-slate-50 dark:border-gray-700 dark:hover:bg-gray-800">Annuler</button>
                        </div>
                    </form>
                </section>
            )}

            <section className={`${card} overflow-hidden`}>
                <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4 dark:border-gray-800">
                    <div className="flex items-center gap-2"><UserCog size={19} className="text-teal-700" /><h2 className="font-semibold">Comptes existants</h2><span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs dark:bg-gray-800">{terme ? `${affiches.length} sur ${users.length}` : users.length}</span></div>
                    <div className="flex items-center gap-4">
                        <label className="relative block w-48 sm:w-64">
                            <Search size={15} aria-hidden="true" className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                            <input type="search" value={recherche} onChange={e => setRecherche(e.target.value)} onKeyDown={e => { if (e.key === 'Escape') setRecherche(''); }}
                                placeholder="Rechercher un compte…" aria-label="Rechercher un compte par nom, e-mail, téléphone ou rôle" autoComplete="off"
                                className="w-full rounded-xl border border-slate-200 bg-white py-2 pl-9 pr-8 text-sm outline-none transition focus:border-teal-600 focus:ring-2 focus:ring-teal-600/20 dark:border-gray-700 dark:bg-gray-950 [&::-webkit-search-cancel-button]:hidden" />
                            {recherche && <button type="button" onClick={() => setRecherche('')} aria-label="Effacer la recherche" className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full p-1 text-slate-400 hover:text-slate-700 dark:hover:text-gray-200"><X size={14} /></button>}
                        </label>
                        <button onClick={() => load()} className="text-sm text-teal-700 hover:underline dark:text-teal-300">Actualiser</button>
                    </div>
                </div>
                {loading ? <SkeletonTable rows={6} cols={5} /> : (
                    <div className="overflow-x-auto">
                        <table className="w-full min-w-175 text-left text-sm">
                            <thead className="bg-slate-50 text-xs uppercase text-slate-500 dark:bg-gray-800/60"><tr>{['Nom', 'E-mail', 'Téléphone', 'Rôle et accès', 'Action'].map(h => <th key={h} className="px-5 py-3 font-semibold">{h}</th>)}</tr></thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-gray-800">
                                {affiches.map(user => (
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
                        {affiches.length === 0 && <div className="p-10 text-center text-sm text-slate-500">{users.length === 0 ? 'Aucun compte trouvé.' : `Aucun compte ne correspond à « ${recherche.trim()} ».`}</div>}
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
                                <label className="block text-sm font-medium">Nouveau mot de passe (10 caractères minimum)<ChampMotDePasse required minLength={10} maxLength={72} autoComplete="new-password" value={dialog.motDePasse} onChange={e => setDialog({ ...dialog, motDePasse: e.target.value })} className={field + ' mt-1.5 w-full'} /></label>
                            </>
                        )}
                        {dialogError && <p role="alert" className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700 dark:bg-rose-500/10 dark:text-rose-300">{dialogError}</p>}
                        <div className="flex justify-end gap-2"><button type="button" onClick={() => setDialog(null)} className="rounded-xl border border-slate-200 px-4 py-2 text-sm dark:border-gray-700">Annuler</button><button disabled={dialogSaving} className="inline-flex items-center gap-2 rounded-xl bg-teal-700 px-4 py-2 text-sm font-semibold text-white hover:bg-teal-800 disabled:opacity-50">{dialogSaving && <Loader2 size={15} className="animate-spin" />}Enregistrer</button></div>
                    </form>
                </div>
            )}

            <p className="px-1 text-xs text-slate-500 dark:text-gray-400">Seul le super administrateur gère les comptes. Les comptes « Infirmière » déjà créés restent valables et peuvent être modifiés ici.</p>
        </AdminLayout>
    );
}
