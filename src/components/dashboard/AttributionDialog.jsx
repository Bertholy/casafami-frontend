import { useEffect, useMemo, useState } from 'react';
import { AlertTriangle, CheckCircle2, Loader2, UserCheck, X } from 'lucide-react';
import axiosClient from '../../api/axiosClient';
import { formatDateFr, getRoleLabel, hhmm } from '../../constants/app';
import { apiErrorMessage } from '../../utils/auth';
import OccupationGrid from './OccupationGrid';

/**
 * Le super administrateur décide qui prend le rendez-vous : il attribue (ou change, ou retire) la personne.
 * Celle-ci est prévenue par notification, doit accepter le rendez-vous ; le super administrateur le confirme ensuite.
 * Chaque personne est affichée libre ou occupée à ce créneau, avec le détail de la journée entière.
 */
export default function AttributionDialog({ rdv, onClose, onDone }) {
    const heure = hhmm(rdv.heureRdv);
    const [occupation, setOccupation] = useState(null);
    const [choix, setChoix] = useState(rdv.praticienId ? String(rdv.praticienId) : '');
    const [loadError, setLoadError] = useState('');
    const [error, setError] = useState('');
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        let cancelled = false;
        axiosClient.get('/admin/occupation', { params: { date: rdv.dateRdv } })
            .then(({ data }) => { if (!cancelled) setOccupation(data); })
            .catch(err => { if (!cancelled) setLoadError(apiErrorMessage(err, 'Impossible de charger l’occupation du personnel.')); });
        return () => { cancelled = true; };
    }, [rdv.dateRdv]);
    useEffect(() => {
        const onKey = event => { if (event.key === 'Escape') onClose(); };
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, [onClose]);

    // État de chaque personne à CE créneau (hors le rendez-vous lui-même)
    const personnel = useMemo(() => (occupation?.personnel || []).map(p => {
        const cellule = p.occupations[heure];
        const occupe = Boolean(cellule) && cellule.rdvId !== rdv.id;
        return { ...p, occupe, par: occupe ? cellule.patient : null };
    }), [occupation, heure, rdv.id]);
    const libres = personnel.filter(p => !p.occupe);
    const suggere = [...libres].sort((a, b) => a.total - b.total)[0];

    // Pré-sélection : la personne déjà attribuée, sinon la personne libre la moins chargée ce jour-là
    const choixEffectif = choix || (rdv.praticienId ? '' : String(suggere?.id || ''));
    const selection = personnel.find(p => String(p.id) === choixEffectif);

    const valider = async retirer => {
        setSaving(true); setError('');
        try {
            await axiosClient.put(`/rdv/${rdv.id}/praticien`, { praticienId: retirer ? null : Number(choixEffectif) });
            await onDone(retirer ? 'Attribution retirée.' : `Rendez-vous attribué à ${selection?.nom}. La personne a été prévenue : vous serez notifié(e) quand elle l’aura accepté, puis vous pourrez le confirmer.`);
        } catch (err) {
            setError(apiErrorMessage(err, 'Action impossible. Réessayez.'));
            axiosClient.get('/admin/occupation', { params: { date: rdv.dateRdv } }).then(({ data }) => setOccupation(data)).catch(() => {});
        } finally { setSaving(false); }
    };

    const peuDePersonnes = occupation && occupation.capaciteParCreneau < personnel.length;
    return (
        <div className="fixed inset-0 z-[65] flex items-center justify-center bg-slate-950/50 p-4 backdrop-blur-sm" onMouseDown={e => { if (e.target === e.currentTarget) onClose(); }}>
            <section role="dialog" aria-modal="true" aria-label="Attribuer le rendez-vous" className="max-h-[92vh] w-full max-w-3xl overflow-y-auto rounded-2xl bg-white shadow-2xl dark:bg-gray-900">
                <div className="flex items-start justify-between gap-3 border-b border-slate-200 px-5 py-4 dark:border-gray-800">
                    <div>
                        <h2 className="font-semibold">Attribuer le rendez-vous</h2>
                        <p className="mt-1 text-sm text-slate-500 dark:text-gray-400"><strong className="text-slate-700 dark:text-gray-200">{rdv.nomClient}</strong> · <span className="capitalize">{formatDateFr(rdv.dateRdv, { weekday: 'long', day: 'numeric', month: 'long' })}</span> à <strong>{heure}</strong>{rdv.serviceNom ? ` · ${rdv.serviceNom}` : ''}</p>
                    </div>
                    <button onClick={onClose} aria-label="Fermer" className="rounded-lg p-1 hover:bg-slate-100 dark:hover:bg-gray-800"><X size={20} /></button>
                </div>

                <div className="space-y-5 p-5">
                    {loadError && <p role="alert" className="rounded-xl bg-rose-50 p-3 text-sm text-rose-700 dark:bg-rose-500/10 dark:text-rose-300">{loadError}</p>}
                    {!occupation && !loadError && <p className="flex items-center justify-center gap-2 p-6 text-sm text-slate-500"><Loader2 size={18} className="animate-spin" />Chargement de l’occupation du personnel…</p>}

                    {occupation && (
                        <>
                            <fieldset>
                                <legend className="mb-2 text-sm font-semibold">Qui prend ce rendez-vous à {heure} ?</legend>
                                {personnel.length === 0 ? <p className="rounded-xl bg-slate-50 p-4 text-sm text-slate-500 dark:bg-gray-800">Aucun médecin ni sage-femme n’est enregistré. Créez d’abord leurs comptes dans « Comptes et accès ».</p> : (
                                    <div className="grid gap-2 sm:grid-cols-2">
                                        {personnel.map(p => (
                                            <label key={p.id} className={`flex cursor-pointer items-start gap-3 rounded-xl border-2 p-3 transition ${String(p.id) === choixEffectif ? 'border-teal-600 bg-teal-50 dark:bg-teal-500/10' : 'border-slate-200 dark:border-gray-700'} ${p.occupe ? 'cursor-not-allowed opacity-60' : 'hover:border-teal-400'}`}>
                                                <input type="radio" name="praticien" value={p.id} disabled={p.occupe} checked={String(p.id) === choixEffectif} onChange={() => setChoix(String(p.id))} className="mt-1 h-4 w-4 accent-teal-700" />
                                                <span className="min-w-0 flex-1">
                                                    <span className="block truncate text-sm font-semibold">{p.nom}</span>
                                                    <span className="block text-xs text-slate-500 dark:text-gray-400">{getRoleLabel(p.role)} · {p.total} rendez-vous ce jour</span>
                                                    {p.occupe
                                                        ? <span className="mt-1 inline-flex items-center gap-1 text-xs font-medium text-rose-700 dark:text-rose-300"><AlertTriangle size={12} />Occupé(e) à {heure} : {p.par}</span>
                                                        : <span className="mt-1 inline-flex items-center gap-1 text-xs font-medium text-emerald-700 dark:text-emerald-300"><CheckCircle2 size={12} />Libre à {heure}{suggere?.id === p.id && libres.length > 1 ? ' · moins chargé(e)' : ''}</span>}
                                                </span>
                                            </label>
                                        ))}
                                    </div>
                                )}
                                {personnel.length > 0 && libres.length === 0 && <p role="alert" className="mt-2 text-sm text-rose-700 dark:text-rose-300">Tout le personnel est déjà occupé à {heure}. Déplacez ce rendez-vous à un autre créneau, ou libérez une personne.</p>}
                            </fieldset>

                            <div>
                                <h3 className="mb-2 text-sm font-semibold">Occupation du personnel — <span className="capitalize">{formatDateFr(rdv.dateRdv, { weekday: 'long', day: 'numeric', month: 'long' })}</span></h3>
                                <OccupationGrid data={occupation} surligne={heure} rdvId={rdv.id} />
                                {peuDePersonnes && <p className="mt-2 text-xs text-slate-500 dark:text-gray-400">Le cabinet accepte {occupation.capaciteParCreneau} rendez-vous à la fois alors qu’il compte {personnel.length} personnes : augmentez « Rendez-vous simultanés » dans <em>Horaires et congés</em> pour que plusieurs personnes reçoivent en même temps.</p>}
                            </div>
                        </>
                    )}

                    {error && <p role="alert" className="rounded-xl bg-rose-50 px-3 py-2 text-sm text-rose-700 dark:bg-rose-500/10 dark:text-rose-300">{error}</p>}
                    <div className="flex flex-wrap items-center justify-end gap-2">
                        {rdv.praticienId && <button onClick={() => valider(true)} disabled={saving} className="mr-auto rounded-xl border border-slate-200 px-4 py-2 text-sm hover:bg-slate-50 disabled:opacity-50 dark:border-gray-700 dark:hover:bg-gray-800">Ne plus attribuer</button>}
                        <button onClick={onClose} className="rounded-xl border border-slate-200 px-4 py-2 text-sm hover:bg-slate-50 dark:border-gray-700 dark:hover:bg-gray-800">Annuler</button>
                        <button onClick={() => valider(false)} disabled={saving || !selection || selection.occupe}
                            className="inline-flex items-center gap-2 rounded-xl bg-teal-700 px-5 py-2 text-sm font-semibold text-white transition hover:bg-teal-800 disabled:opacity-50">
                            {saving ? <Loader2 size={16} className="animate-spin" /> : <UserCheck size={16} />}
                            {selection ? `Attribuer à ${selection.nom}` : 'Attribuer'}
                        </button>
                    </div>
                </div>
            </section>
        </div>
    );
}
