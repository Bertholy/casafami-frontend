import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ImagePlus, Loader2, Pencil, Plus, Trash2, X } from 'lucide-react';
import axiosClient, { assetUrl } from '../api/axiosClient';
import AdminLayout from '../components/AdminLayout';
import { apiErrorMessage, getRole, hasSession, homeForRole, LOGIN_PATH } from '../utils/auth';

const EMPTY = { nom: '', description: '', duree: '', photo: null };
const field = 'mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 font-normal outline-none transition focus:border-teal-600 focus:ring-2 focus:ring-teal-600/20 dark:border-gray-700 dark:bg-gray-950';
const card = 'rounded-2xl border border-slate-200/80 bg-white shadow-sm dark:border-gray-800 dark:bg-gray-900';
const fallbackImage = name => {
    const normalized = (name || '').toLocaleLowerCase('fr');
    if (normalized.includes('vaccin')) return '/vaccination.jpg';
    if (normalized.includes('sang') || normalized.includes('analyse')) return '/sang.jpg';
    if (normalized.includes('grossesse')) return '/suivi-grossesse.png';
    if (normalized.includes('accouchement')) return '/accouchement.png';
    if (normalized.includes('échographie') || normalized.includes('echographie')) return '/echo.png';
    if (normalized.includes('planning')) return '/planning-familial.png';
    if (normalized.includes('soin')) return '/infi.png';
    return '/general.jpg';
};

export default function AdminServices() {
    const navigate = useNavigate();
    const [services, setServices] = useState([]);
    const [form, setForm] = useState(EMPTY);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');
    const [notice, setNotice] = useState('');
    const [edition, setEdition] = useState(null); // { id, nom, description, duree, photo, imageUrl }
    const [editionSaving, setEditionSaving] = useState(false);
    const [editionError, setEditionError] = useState('');

    const load = useCallback(async () => {
        setLoading(true);
        try { const { data } = await axiosClient.get('/services'); setServices(data); }
        catch (err) { setError(apiErrorMessage(err, 'Impossible de charger les services.')); }
        finally { setLoading(false); }
    }, []);

    useEffect(() => {
        const role = getRole();
        if (!hasSession()) { navigate(LOGIN_PATH); return undefined; }
        if (role !== 'SUPER_ADMIN') { navigate(homeForRole(role)); return undefined; }
        const timer = window.setTimeout(load, 0);
        return () => window.clearTimeout(timer);
    }, [load, navigate]);

    const createService = async event => {
        event.preventDefault();
        if (!form.photo) { setError('Ajoutez une photo au service.'); return; }
        setSaving(true); setError(''); setNotice('');
        const payload = new FormData();
        payload.append('nom', form.nom.trim());
        payload.append('description', form.description.trim());
        if (form.duree.trim()) payload.append('duree', form.duree.trim());
        payload.append('photo', form.photo);
        try {
            await axiosClient.post('/services', payload, { headers: { 'Content-Type': 'multipart/form-data' } });
            setForm(EMPTY); setNotice('Service ajouté au catalogue.'); await load();
        } catch (err) { setError(apiErrorMessage(err, 'L’ajout du service a échoué. Vérifiez les informations.')); }
        finally { setSaving(false); }
    };

    const saveEdition = async event => {
        event.preventDefault(); setEditionSaving(true); setEditionError('');
        const payload = new FormData();
        payload.append('nom', edition.nom.trim());
        payload.append('description', edition.description.trim());
        payload.append('duree', edition.duree.trim());
        if (edition.photo) payload.append('photo', edition.photo);
        try {
            const { data } = await axiosClient.put('/services/' + edition.id, payload, { headers: { 'Content-Type': 'multipart/form-data' } });
            setServices(items => items.map(item => item.id === data.id ? data : item));
            setEdition(null); setNotice('Service modifié.');
        } catch (err) { setEditionError(apiErrorMessage(err, 'La modification a échoué. Vérifiez les informations.')); }
        finally { setEditionSaving(false); }
    };

    const deleteService = async service => {
        if (!window.confirm(`Supprimer le service « ${service.nom} » ? Sa photo téléversée sera également supprimée.`)) return;
        setError(''); setNotice('');
        try { await axiosClient.delete(`/services/${service.id}`); setServices(items => items.filter(item => item.id !== service.id)); setNotice('Service supprimé.'); }
        catch (err) { setError(apiErrorMessage(err, 'La suppression du service a échoué.')); }
    };

    const imageUrl = service => service.imageUrl ? assetUrl(service.imageUrl) : fallbackImage(service.nom);

    return (
        <AdminLayout title="Gestion des services" subtitle="Les prestations et leurs photos sont visibles sur la page Services du site">
            {notice && <div role="status" className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-200">{notice}</div>}
            {error && <div role="alert" className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-200">{error}</div>}

            <section className={`${card} p-5`}>
                <div className="mb-4 flex items-center gap-2"><Plus size={19} className="text-teal-700" /><h2 className="font-semibold">Ajouter un service</h2></div>
                <form onSubmit={createService} className="grid gap-4 md:grid-cols-2">
                    <label className="text-sm font-medium">Nom du service *<input required maxLength={100} value={form.nom} onChange={e => setForm(c => ({ ...c, nom: e.target.value }))} placeholder="Ex. Consultation générale" className={field} /></label>
                    <label className="text-sm font-medium">Durée<input maxLength={50} value={form.duree} onChange={e => setForm(c => ({ ...c, duree: e.target.value }))} placeholder="Ex. 30 minutes" className={field} /></label>
                    <label className="text-sm font-medium md:col-span-2">Description *<textarea required maxLength={500} rows={3} value={form.description} onChange={e => setForm(c => ({ ...c, description: e.target.value }))} placeholder="Décrivez ce service médical…" className={`${field} resize-y`} /><span className="mt-1 block text-right text-xs text-slate-400">{form.description.length}/500</span></label>
                    <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-dashed border-slate-300 p-4 text-sm transition hover:border-teal-600 dark:border-gray-700 md:col-span-2">
                        <ImagePlus className="shrink-0 text-teal-700" size={22} />
                        <span className="min-w-0 flex-1"><span className="block font-medium">Photo du service *</span><span className="block truncate text-xs text-slate-500">{form.photo ? form.photo.name : 'JPEG ou PNG, 5 Mo maximum'}</span></span>
                        <input required type="file" accept="image/png,image/jpeg" onChange={e => setForm(c => ({ ...c, photo: e.target.files?.[0] || null }))} className="w-56 text-xs" />
                    </label>
                    <div className="flex justify-end md:col-span-2"><button disabled={saving} className="inline-flex items-center gap-2 rounded-xl bg-teal-700 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-teal-800 disabled:opacity-60">{saving ? <Loader2 size={17} className="animate-spin" /> : <Plus size={17} />}Ajouter au catalogue</button></div>
                </form>
            </section>

            <section>
                <div className="mb-3 flex items-center justify-between"><h2 className="font-semibold">Services publiés <span className="ml-1 rounded-full bg-slate-100 px-2 py-0.5 text-xs font-normal dark:bg-gray-800">{services.length}</span></h2><button onClick={load} className="text-sm text-teal-700 hover:underline dark:text-teal-300">Actualiser</button></div>
                {loading ? <div className={`${card} flex items-center justify-center gap-2 p-10 text-sm text-slate-500`}><Loader2 size={18} className="animate-spin" />Chargement des services…</div>
                    : services.length === 0 ? <div className={`${card} p-10 text-center text-sm text-slate-500`}>Aucun service dans le catalogue.</div>
                        : <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">{services.map(service => (
                            <article key={service.id} className={`${card} overflow-hidden`}>
                                <img src={imageUrl(service)} alt={service.nom} onError={e => { e.currentTarget.onerror = null; e.currentTarget.src = '/general.jpg'; }} className="h-44 w-full object-cover" />
                                <div className="p-4">
                                    <div className="flex items-start justify-between gap-3"><h3 className="font-semibold">{service.nom}</h3><div className="flex shrink-0"><button onClick={() => { setEditionError(''); setEdition({ id: service.id, nom: service.nom, description: service.description || '', duree: service.duree || '', photo: null, imageUrl: imageUrl(service) }); }} aria-label={`Modifier ${service.nom}`} className="rounded-lg p-2 text-slate-500 transition hover:bg-slate-100 dark:hover:bg-gray-800"><Pencil size={17} /></button><button onClick={() => deleteService(service)} aria-label={`Supprimer ${service.nom}`} className="rounded-lg p-2 text-rose-700 transition hover:bg-rose-50 dark:text-rose-300 dark:hover:bg-rose-500/10"><Trash2 size={17} /></button></div></div>
                                    <p className="mt-2 line-clamp-3 text-sm text-slate-600 dark:text-slate-300">{service.description || 'Aucune description.'}</p>
                                    <p className="mt-3 text-xs font-medium text-teal-700 dark:text-teal-300">{service.duree ? `Durée : ${service.duree}` : 'Sur rendez-vous'}</p>
                                </div>
                            </article>
                        ))}</div>}
            </section>
            {edition && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4 backdrop-blur-sm" onMouseDown={e => { if (e.target === e.currentTarget) setEdition(null); }}>
                    <form onSubmit={saveEdition} role="dialog" aria-modal="true" aria-label="Modifier le service" className="max-h-[92vh] w-full max-w-lg space-y-4 overflow-y-auto rounded-2xl bg-white p-6 shadow-2xl dark:bg-gray-900">
                        <div className="flex items-center justify-between"><h2 className="font-semibold">Modifier le service</h2><button type="button" onClick={() => setEdition(null)} aria-label="Fermer"><X size={18} /></button></div>
                        <label className="block text-sm font-medium">Nom *<input required maxLength={100} value={edition.nom} onChange={e => setEdition({ ...edition, nom: e.target.value })} className={field} /></label>
                        <label className="block text-sm font-medium">Durée<input maxLength={50} value={edition.duree} onChange={e => setEdition({ ...edition, duree: e.target.value })} className={field} /></label>
                        <label className="block text-sm font-medium">Description *<textarea required maxLength={500} rows={3} value={edition.description} onChange={e => setEdition({ ...edition, description: e.target.value })} className={field + ' resize-y'} /></label>
                        <div className="flex items-center gap-3 rounded-xl border border-dashed border-slate-300 p-3 text-sm dark:border-gray-700">
                            <img src={edition.photo ? URL.createObjectURL(edition.photo) : edition.imageUrl} alt="" className="h-14 w-20 rounded-lg object-cover" />
                            <label className="min-w-0 flex-1 cursor-pointer"><span className="block font-medium">Changer la photo (facultatif)</span><span className="block truncate text-xs text-slate-500">{edition.photo ? edition.photo.name : 'JPEG ou PNG, 5 Mo maximum'}</span>
                                <input type="file" accept="image/png,image/jpeg" onChange={e => setEdition({ ...edition, photo: e.target.files?.[0] || null })} className="mt-1 w-full text-xs" /></label>
                        </div>
                        {editionError && <p role="alert" className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700 dark:bg-rose-500/10 dark:text-rose-300">{editionError}</p>}
                        <div className="flex justify-end gap-2"><button type="button" onClick={() => setEdition(null)} className="rounded-xl border border-slate-200 px-4 py-2 text-sm dark:border-gray-700">Annuler</button><button disabled={editionSaving} className="inline-flex items-center gap-2 rounded-xl bg-teal-700 px-4 py-2 text-sm font-semibold text-white hover:bg-teal-800 disabled:opacity-50">{editionSaving && <Loader2 size={15} className="animate-spin" />}Enregistrer</button></div>
                    </form>
                </div>
            )}
        </AdminLayout>
    );
}
