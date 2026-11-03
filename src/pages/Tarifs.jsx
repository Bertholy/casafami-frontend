import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Check, Loader2, Pencil, Plus, Search, X } from 'lucide-react';
import axiosClient from '../api/axiosClient';
import AdminLayout from '../components/AdminLayout';
import Notice from '../components/Notice';
import { btnPrimary, btnSecondary, card, inputClass } from '../constants/ui';
import { apiErrorMessage, hasSession, LOGIN_PATH, peut } from '../utils/auth';
import { formaterMontant } from '../utils/proforma';

const sansAccent = texte => String(texte || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
const chiffres = texte => String(texte ?? '').replace(/\D/g, '');
const VIDE = { nom: '', duree: '', prix: '', description: '' };

/**
 * Services du cabinet avec leur tarif (en Ariary), pour le personnel, le secrétariat en particulier : on répond tout de suite à « combien coûte… ? ».
 * Les prix ne sont jamais montrés sur le site public. Celui qui gère les services (SERVICES_GERER, l'administration par défaut) peut ici
 * ajouter un service avec son tarif et corriger un prix sur place ; photos et descriptions se complètent dans « Gestion des services ».
 * Ces mêmes tarifs préremplissent la facture proforma.
 */
export default function Tarifs() {
    const navigate = useNavigate();
    const gere = peut('SERVICES_GERER');
    const [services, setServices] = useState(null);
    const [recherche, setRecherche] = useState('');
    const [erreur, setErreur] = useState('');
    const [info, setInfo] = useState('');
    const [chargementEchoue, setChargementEchoue] = useState(false);
    const [ajoutOuvert, setAjoutOuvert] = useState(false);
    const [nouveau, setNouveau] = useState(VIDE);
    const [edition, setEdition] = useState(null);            // { id, prix } : le prix en cours de correction
    const [envoi, setEnvoi] = useState(false);

    const charger = useCallback(async () => {
        try {
            const { data } = await axiosClient.get('/services/tarifs');
            setServices(data); setChargementEchoue(false);
        } catch (err) {
            setServices([]); setChargementEchoue(true);
            // 404 ou 405 : le serveur tourne encore avec une ancienne version, sans la liste des tarifs
            setErreur([404, 405].includes(err.response?.status) ? 'Le serveur n’est pas à jour : redémarrez le backend pour afficher les services et leurs tarifs.' : apiErrorMessage(err, 'Impossible de charger les services et leurs tarifs.'));
        }
    }, []);

    useEffect(() => {
        if (!hasSession()) { navigate(LOGIN_PATH); return undefined; }
        const timer = window.setTimeout(charger, 0);
        return () => window.clearTimeout(timer);
    }, [charger, navigate]);

    const filtres = useMemo(() => {
        const q = sansAccent(recherche.trim());
        return (services || []).filter(s => !q || sansAccent(`${s.nom} ${s.description || ''}`).includes(q));
    }, [services, recherche]);
    const sansPrix = (services || []).filter(s => s.prix == null).length;

    const ajouter = async evenement => {
        evenement.preventDefault(); setErreur(''); setInfo(''); setEnvoi(true);
        try {
            const prix = chiffres(nouveau.prix);
            await axiosClient.post('/services/tarifs', { nom: nouveau.nom.trim(), duree: nouveau.duree.trim() || null, prix: prix === '' ? null : Number(prix), description: nouveau.description.trim() || null });
            setInfo(`Service « ${nouveau.nom.trim()} » ajouté${prix === '' ? '' : ` à ${formaterMontant(Number(prix))} Ar`}. Vous pouvez ajouter sa photo et sa description dans « Gestion des services ».`);
            setNouveau(VIDE); setAjoutOuvert(false); await charger();
        } catch (err) { setErreur(apiErrorMessage(err, 'Impossible d’ajouter ce service.')); }
        finally { setEnvoi(false); }
    };

    const enregistrerPrix = async service => {
        setErreur(''); setInfo(''); setEnvoi(true);
        try {
            const prix = chiffres(edition.prix);
            const { data } = await axiosClient.put(`/services/${service.id}/tarif`, { prix: prix === '' ? null : Number(prix) });
            setServices(liste => liste.map(s => (s.id === data.id ? { ...s, prix: data.prix } : s)));
            setEdition(null); setInfo(`Tarif de « ${service.nom} » ${data.prix == null ? 'supprimé' : `mis à ${formaterMontant(data.prix)} Ar`}.`);
        } catch (err) { setErreur(apiErrorMessage(err, 'Impossible de changer ce tarif.')); }
        finally { setEnvoi(false); }
    };

    return (
        <AdminLayout title="Services et tarifs" subtitle="Les prestations du cabinet et leur prix"
            actions={gere ? <button type="button" onClick={() => setAjoutOuvert(ouvert => !ouvert)} aria-expanded={ajoutOuvert} className={btnPrimary}><Plus size={16} />Ajouter un service</button> : null}>
            {() => <>
                {erreur && <Notice tone="error" onClose={() => setErreur('')}>{erreur}</Notice>}
                {info && <Notice tone="success" onClose={() => setInfo('')}>{info}</Notice>}

                {gere && ajoutOuvert && (
                    <form onSubmit={ajouter} className={`${card} space-y-4 p-5 sm:p-6`}>
                        <h2 className="text-base font-semibold">Ajouter un service avec son tarif</h2>
                        <div className="grid gap-4 sm:grid-cols-3">
                            <label className="text-sm font-medium sm:col-span-2">Nom du service *
                                <input required maxLength={100} value={nouveau.nom} onChange={e => setNouveau(c => ({ ...c, nom: e.target.value }))} placeholder="Ex. Échographie obstétricale" className={`${inputClass} mt-1.5`} autoFocus /></label>
                            <label className="text-sm font-medium">Prix (Ar)
                                <input inputMode="numeric" maxLength={14} value={nouveau.prix} onChange={e => setNouveau(c => ({ ...c, prix: e.target.value.replace(/[^\d\s]/g, '') }))} placeholder="Ex. 25 000" className={`${inputClass} mt-1.5`} /></label>
                            <label className="text-sm font-medium">Durée
                                <input maxLength={50} value={nouveau.duree} onChange={e => setNouveau(c => ({ ...c, duree: e.target.value }))} placeholder="Ex. 30 minutes" className={`${inputClass} mt-1.5`} /></label>
                            <label className="text-sm font-medium sm:col-span-2">Description (facultatif)
                                <input maxLength={500} value={nouveau.description} onChange={e => setNouveau(c => ({ ...c, description: e.target.value }))} placeholder="Une phrase sur ce service" className={`${inputClass} mt-1.5`} /></label>
                        </div>
                        <p className="text-xs text-slate-500 dark:text-gray-400">Le prix reste réservé au personnel. Le service apparaît aussi sur le site public ; sa photo et sa description se complètent dans « Gestion des services ».</p>
                        <div className="flex flex-wrap items-center justify-end gap-2 border-t border-slate-200 pt-4 dark:border-gray-800">
                            <button type="button" onClick={() => { setAjoutOuvert(false); setNouveau(VIDE); }} className={btnSecondary}>Annuler</button>
                            <button disabled={envoi || !nouveau.nom.trim()} className={btnPrimary}>{envoi && <Loader2 size={15} className="animate-spin" />}Ajouter le service</button>
                        </div>
                    </form>
                )}

                <section className={`${card} p-4 sm:p-5`}>
                    <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                        <label className="relative block w-full max-w-sm">
                            <span className="sr-only">Rechercher un service</span>
                            <Search size={16} aria-hidden="true" className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                            <input type="search" value={recherche} onChange={e => setRecherche(e.target.value)} placeholder="Rechercher un service…" className={`${inputClass} pl-9`} />
                        </label>
                        {services && !chargementEchoue && <p className="text-sm text-slate-500 dark:text-gray-400">{filtres.length} service{filtres.length > 1 ? 's' : ''}{sansPrix > 0 ? ` · ${sansPrix} sans prix` : ''} · montants en Ariary (Ar)</p>}
                    </div>

                    {services === null ? <p className="flex items-center gap-2 rounded-lg bg-slate-50 p-4 text-sm text-slate-500 dark:bg-gray-800"><Loader2 size={16} className="animate-spin" />Chargement…</p>
                        : chargementEchoue ? <p className="rounded-lg bg-slate-50 p-4 text-sm text-slate-600 dark:bg-gray-800 dark:text-gray-300">La liste n’a pas pu être chargée.</p>
                            : filtres.length === 0 ? (
                                <p className="rounded-lg bg-slate-50 p-4 text-sm text-slate-600 dark:bg-gray-800 dark:text-gray-300">
                                    {services.length > 0 ? 'Aucun service ne correspond à cette recherche.' : gere ? 'Aucun service enregistré pour le moment : utilisez « Ajouter un service » pour créer le premier avec son tarif.' : 'Aucun service enregistré pour le moment.'}
                                </p>
                            ) : (
                                <div className="overflow-x-auto">
                                    <table className="w-full min-w-[36rem] text-sm">
                                        <thead>
                                            <tr className="text-left text-xs uppercase tracking-wide text-slate-500 dark:text-gray-400">
                                                <th className="pb-2 pr-3 font-semibold">Service</th>
                                                <th className="hidden pb-2 pr-3 font-semibold sm:table-cell">Durée</th>
                                                <th className="pb-2 text-right font-semibold">Prix</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-200 dark:divide-gray-800">
                                            {filtres.map(s => {
                                                const enEdition = edition?.id === s.id;
                                                return (
                                                    <tr key={s.id} className="align-top">
                                                        <td className="py-3 pr-3"><p className="font-medium">{s.nom}</p>{s.description && <p className="mt-0.5 line-clamp-2 text-xs text-slate-500 dark:text-gray-400">{s.description}</p>}</td>
                                                        <td className="hidden py-3 pr-3 text-slate-600 sm:table-cell dark:text-gray-300">{s.duree || '—'}</td>
                                                        <td className="whitespace-nowrap py-3 text-right">
                                                            {enEdition ? (
                                                                <form onSubmit={e => { e.preventDefault(); enregistrerPrix(s); }} className="inline-flex items-center gap-1.5">
                                                                    <input autoFocus inputMode="numeric" aria-label={`Prix de ${s.nom} en Ariary`} maxLength={14} value={edition.prix} onChange={e => setEdition({ id: s.id, prix: e.target.value.replace(/[^\d\s]/g, '') })} onKeyDown={e => { if (e.key === 'Escape') setEdition(null); }} placeholder="Sans prix" className={`${inputClass} w-32! py-1.5! text-right`} />
                                                                    <button type="submit" disabled={envoi} aria-label="Enregistrer le prix" className="rounded-lg bg-teal-700 p-2 text-white transition hover:bg-teal-800 disabled:opacity-60">{envoi ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}</button>
                                                                    <button type="button" onClick={() => setEdition(null)} aria-label="Annuler" className="rounded-lg p-2 text-slate-500 transition hover:bg-slate-100 dark:hover:bg-gray-800"><X size={14} /></button>
                                                                </form>
                                                            ) : (
                                                                <span className="inline-flex items-center gap-2">
                                                                    <span className={s.prix != null ? 'font-semibold tabular-nums' : 'text-slate-400 dark:text-gray-500'}>{s.prix != null ? `${formaterMontant(s.prix)} Ar` : 'Non défini'}</span>
                                                                    {gere && <button type="button" onClick={() => setEdition({ id: s.id, prix: s.prix != null ? String(s.prix) : '' })} aria-label={`Modifier le prix de ${s.nom}`} className="rounded-lg p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-teal-700 dark:hover:bg-gray-800"><Pencil size={14} /></button>}
                                                                </span>
                                                            )}
                                                        </td>
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                    {gere && <p className="mt-4 text-xs text-slate-500 dark:text-gray-400">Pour changer le nom, la photo ou la description d’un service, ou pour en supprimer un, ouvrez <Link to="/admin/services" className="font-medium text-teal-700 underline-offset-2 hover:underline dark:text-teal-300">Gestion des services</Link>.</p>}
                </section>
            </>}
        </AdminLayout>
    );
}
