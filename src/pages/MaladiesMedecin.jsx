import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import axiosClient from '../api/axiosClient';
import AdminLayout from '../components/AdminLayout';
import { apiErrorMessage, getRole, hasSession, homeForRole, LOGIN_PATH } from '../utils/auth';
import { Plus, Trash2, Pill, Loader2, AlertCircle, Stethoscope, Activity, FileSignature, Pencil, Check, X } from 'lucide-react';
import { Link } from 'react-router-dom';

const field = 'w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-teal-600 focus:ring-2 focus:ring-teal-600/20 dark:border-gray-700 dark:bg-gray-950';
const card = 'rounded-2xl border border-slate-200/80 bg-white shadow-sm dark:border-gray-800 dark:bg-gray-900';

function MaladiesMedecin() {
    const navigate = useNavigate();
    const role = getRole();
    const canWrite = role === 'MEDECIN' || role === 'SUPER_ADMIN';
    const [maladies, setMaladies] = useState([]);
    const [loading, setLoading] = useState(true);
    const [erreur, setErreur] = useState(null);
    const [showForm, setShowForm] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [form, setForm] = useState({ nom: '', description: '', symptomes: '' });
    const [edition, setEdition] = useState(null); // { id, nom, description, symptomes }
    const [traitement, setTraitement] = useState(null); // { maladieId, medicament, posologie, duree, remarques }

    const chargerMaladies = useCallback(async () => {
        setLoading(true);
        try {
            const res = await axiosClient.get('/maladies');
            setMaladies(res.data);
        } catch (err) {
            setErreur(apiErrorMessage(err, 'Erreur lors du chargement'));
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        if (!hasSession()) { navigate(LOGIN_PATH); return undefined; }
        if (role === 'SECRETAIRE') { navigate(homeForRole(role)); return undefined; }
        const timer = window.setTimeout(chargerMaladies, 0);
        return () => window.clearTimeout(timer);
    }, [navigate, chargerMaladies, role]);

    const ajouter = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        setErreur(null);
        try {
            const res = await axiosClient.post('/maladies', form);
            setMaladies(current => [...current, res.data]);
            setForm({ nom: '', description: '', symptomes: '' });
            setShowForm(false);
        } catch (err) {
            setErreur(apiErrorMessage(err, 'Impossible d’ajouter la maladie'));
        } finally {
            setSubmitting(false);
        }
    };

    const supprimer = async (id) => {
        if (!window.confirm('Supprimer cette maladie et ses traitements ?')) return;
        try {
            await axiosClient.delete(`/maladies/${id}`);
            setMaladies(current => current.filter(m => m.id !== id));
        } catch (err) {
            setErreur(apiErrorMessage(err, 'Impossible de supprimer'));
        }
    };

    const onChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

    const remplacer = maladieMiseAJour => setMaladies(current => current.map(m => (m.id === maladieMiseAJour.id ? { ...m, ...maladieMiseAJour } : m)));

    const enregistrerEdition = async (e) => {
        e.preventDefault();
        try {
            const { data } = await axiosClient.put(`/maladies/${edition.id}`, { nom: edition.nom, description: edition.description, symptomes: edition.symptomes });
            remplacer(data); setEdition(null);
        } catch (err) { setErreur(apiErrorMessage(err, 'Impossible de modifier la maladie')); }
    };

    const ajouterTraitement = async (e) => {
        e.preventDefault();
        const { maladieId, ...corps } = traitement;
        try {
            const { data } = await axiosClient.post(`/maladies/${maladieId}/traitements`, corps);
            setMaladies(current => current.map(m => (m.id === maladieId ? { ...m, traitements: [...(m.traitements || []), data] } : m)));
            setTraitement(null); setErreur(null);
        } catch (err) { setErreur(apiErrorMessage(err, 'Impossible d’ajouter le traitement')); }
    };

    const supprimerTraitement = async (maladieId, traitementId) => {
        if (!window.confirm('Supprimer ce traitement ?')) return;
        try {
            await axiosClient.delete(`/maladies/${maladieId}/traitements/${traitementId}`);
            setMaladies(current => current.map(m => (m.id === maladieId ? { ...m, traitements: m.traitements.filter(t => t.id !== traitementId) } : m)));
        } catch (err) { setErreur(apiErrorMessage(err, 'Impossible de supprimer le traitement')); }
    };

    const ordonnanceButton = (role === 'MEDECIN' || role === 'SAGE_FEMME' || role === 'SUPER_ADMIN') && (
        <Link to="/assistant/ordonnance" className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-3 py-2.5 text-sm font-medium transition hover:bg-slate-50 dark:border-gray-700 dark:hover:bg-gray-800"><FileSignature size={16} /><span className="hidden sm:inline">Assistant d’ordonnance</span></Link>
    );
    const addButton = canWrite && (
        <button onClick={() => setShowForm(!showForm)} className="inline-flex items-center gap-2 rounded-xl bg-teal-700 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-teal-800">
            <Plus size={17} /><span className="hidden sm:inline">Nouvelle maladie</span>
        </button>
    );

    return (
        <AdminLayout title="Maladies et traitements" subtitle={`${maladies.length} maladie${maladies.length > 1 ? 's' : ''} enregistrée${maladies.length > 1 ? 's' : ''}`} actions={<>{ordonnanceButton}{addButton}</>}>
            {showForm && canWrite && (
                <form onSubmit={ajouter} className={`${card} p-6`}>
                    <h2 className="mb-4 flex items-center gap-2 text-lg font-bold"><Plus className="h-5 w-5 text-teal-600" />Ajouter une maladie</h2>
                    <div className="space-y-4">
                        <input type="text" name="nom" value={form.nom} onChange={onChange} required maxLength={100} placeholder="Nom de la maladie (ex : Anémie)" className={field} />
                        <textarea name="description" value={form.description} onChange={onChange} maxLength={1000} placeholder="Description" rows="2" className={field} />
                        <textarea name="symptomes" value={form.symptomes} onChange={onChange} maxLength={500} placeholder="Symptômes (ex : fatigue, pâleur)" rows="2" className={field} />
                        <div className="flex gap-2">
                            <button type="submit" disabled={submitting} className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-teal-700 py-3 font-bold text-white transition hover:bg-teal-800 disabled:opacity-50">
                                {submitting ? <><Loader2 className="h-5 w-5 animate-spin" />Ajout…</> : 'Ajouter'}
                            </button>
                            <button type="button" onClick={() => setShowForm(false)} className="rounded-xl bg-slate-100 px-6 py-3 font-bold text-slate-700 transition hover:bg-slate-200 dark:bg-gray-800 dark:text-gray-300">Annuler</button>
                        </div>
                    </div>
                </form>
            )}

            {erreur && (
                <div role="alert" className="flex items-center gap-3 rounded-xl border-l-4 border-rose-500 bg-rose-50 p-4 dark:bg-rose-500/10">
                    <AlertCircle className="h-5 w-5 text-rose-500" /><p className="text-sm text-rose-700 dark:text-rose-300">{erreur}</p>
                </div>
            )}

            {loading ? (
                <div className="py-16 text-center"><Loader2 className="mx-auto mb-3 h-10 w-10 animate-spin text-teal-600" /><p className="text-slate-500">Chargement…</p></div>
            ) : maladies.length === 0 ? (
                <div className={`${card} p-12 text-center`}>
                    <Activity className="mx-auto mb-4 h-14 w-14 text-slate-300" />
                    <p className="text-slate-500">Aucune maladie enregistrée</p>
                </div>
            ) : (
                <div className="space-y-4">
                    {maladies.map(maladie => (
                        <article key={maladie.id} className={`${card} p-6`}>
                            {edition?.id === maladie.id ? (
                                <form onSubmit={enregistrerEdition} className="space-y-3">
                                    <input required maxLength={100} value={edition.nom} onChange={e => setEdition({ ...edition, nom: e.target.value })} aria-label="Nom de la maladie" className={field} />
                                    <textarea rows={2} maxLength={1000} value={edition.description || ''} onChange={e => setEdition({ ...edition, description: e.target.value })} aria-label="Description" placeholder="Description" className={field} />
                                    <textarea rows={2} maxLength={500} value={edition.symptomes || ''} onChange={e => setEdition({ ...edition, symptomes: e.target.value })} aria-label="Symptômes" placeholder="Symptômes (mots-clés utilisés par l’assistant d’ordonnance)" className={field} />
                                    <div className="flex gap-2"><button className="inline-flex items-center gap-2 rounded-xl bg-teal-700 px-4 py-2 text-sm font-semibold text-white hover:bg-teal-800"><Check size={16} />Enregistrer</button><button type="button" onClick={() => setEdition(null)} className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-4 py-2 text-sm dark:border-gray-700"><X size={16} />Annuler</button></div>
                                </form>
                            ) : (
                                <div className="flex items-start justify-between">
                                    <div className="flex items-start gap-3">
                                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-teal-100 dark:bg-teal-500/15"><Stethoscope className="h-5 w-5 text-teal-600 dark:text-teal-300" /></div>
                                        <div>
                                            <h3 className="text-lg font-bold">{maladie.nom}</h3>
                                            {maladie.description && <p className="mt-1 text-sm text-slate-600 dark:text-gray-400">{maladie.description}</p>}
                                            {maladie.symptomes && <p className="mt-2 text-xs text-slate-500">Symptômes : {maladie.symptomes}</p>}
                                        </div>
                                    </div>
                                    {canWrite && (
                                        <div className="flex gap-1">
                                            <button onClick={() => setEdition({ id: maladie.id, nom: maladie.nom, description: maladie.description, symptomes: maladie.symptomes })} title="Modifier" aria-label={`Modifier ${maladie.nom}`} className="rounded-lg p-2 text-slate-500 transition hover:bg-slate-100 dark:hover:bg-gray-800"><Pencil className="h-4 w-4" /></button>
                                            <button onClick={() => supprimer(maladie.id)} title="Supprimer" aria-label={`Supprimer ${maladie.nom}`} className="rounded-lg p-2 text-rose-600 transition hover:bg-rose-50 dark:hover:bg-rose-500/10"><Trash2 className="h-4 w-4" /></button>
                                        </div>
                                    )}
                                </div>
                            )}

                            <div className="mt-4 rounded-xl bg-teal-50 p-4 dark:bg-gray-800/60">
                                <div className="mb-2 flex items-center justify-between gap-2">
                                    <p className="flex items-center gap-1 text-xs font-bold text-teal-700 dark:text-teal-300"><Pill className="h-3 w-3" />Traitements ({maladie.traitements?.length || 0})</p>
                                    {canWrite && traitement?.maladieId !== maladie.id && <button onClick={() => setTraitement({ maladieId: maladie.id, medicament: '', posologie: '', duree: '', remarques: '' })} className="inline-flex items-center gap-1 text-xs font-semibold text-teal-700 hover:underline dark:text-teal-300"><Plus className="h-3 w-3" />Ajouter un traitement</button>}
                                </div>
                                {maladie.traitements?.length > 0 ? (
                                    <ul className="space-y-1.5">
                                        {maladie.traitements.map(t => (
                                            <li key={t.id} className="flex items-start gap-2 text-sm">
                                                <span className="font-bold text-teal-600">•</span>
                                                <span className="min-w-0 flex-1"><strong>{t.medicament}</strong>{t.posologie && ` — ${t.posologie}`}{t.duree && ` — pendant ${t.duree}`}{t.remarques && <span className="block text-xs text-slate-500">{t.remarques}</span>}</span>
                                                {canWrite && <button onClick={() => supprimerTraitement(maladie.id, t.id)} aria-label={`Supprimer le traitement ${t.medicament}`} className="rounded-md p-1 text-rose-600 hover:bg-rose-100 dark:hover:bg-rose-500/10"><Trash2 className="h-3.5 w-3.5" /></button>}
                                            </li>
                                        ))}
                                    </ul>
                                ) : <p className="text-sm text-slate-500">Aucun traitement enregistré pour cette maladie.</p>}

                                {traitement?.maladieId === maladie.id && (
                                    <form onSubmit={ajouterTraitement} className="mt-3 grid gap-2 rounded-xl bg-white p-3 dark:bg-gray-900 sm:grid-cols-6">
                                        <input required maxLength={150} value={traitement.medicament} onChange={e => setTraitement({ ...traitement, medicament: e.target.value })} placeholder="Médicament (ex. Amoxicilline 500 mg)" aria-label="Médicament" className={`${field} sm:col-span-6`} />
                                        <input maxLength={200} value={traitement.posologie} onChange={e => setTraitement({ ...traitement, posologie: e.target.value })} placeholder="Posologie (ex. 1 gélule 3 fois par jour)" aria-label="Posologie" className={`${field} sm:col-span-4`} />
                                        <input maxLength={100} value={traitement.duree} onChange={e => setTraitement({ ...traitement, duree: e.target.value })} placeholder="Durée (ex. 7 jours)" aria-label="Durée" className={`${field} sm:col-span-2`} />
                                        <input maxLength={500} value={traitement.remarques} onChange={e => setTraitement({ ...traitement, remarques: e.target.value })} placeholder="Remarques (ex. à prendre pendant le repas)" aria-label="Remarques" className={`${field} sm:col-span-6`} />
                                        <div className="flex gap-2 sm:col-span-6"><button className="inline-flex items-center gap-2 rounded-xl bg-teal-700 px-4 py-2 text-sm font-semibold text-white hover:bg-teal-800"><Check size={16} />Ajouter</button><button type="button" onClick={() => setTraitement(null)} className="rounded-xl border border-slate-200 px-4 py-2 text-sm dark:border-gray-700">Annuler</button></div>
                                    </form>
                                )}
                            </div>
                        </article>
                    ))}
                </div>
            )}
        </AdminLayout>
    );
}

export default MaladiesMedecin;
