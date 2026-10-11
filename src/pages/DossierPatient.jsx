import { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { ClipboardPlus, FileSignature, Loader2, Pencil, Phone, Save, Search, Stethoscope, Trash2, UserRound } from 'lucide-react';
import axiosClient from '../api/axiosClient';
import AdminLayout from '../components/AdminLayout';
import Notice from '../components/Notice';
import PatientSearch from '../components/PatientSearch';
import MaterniteDossier from '../components/maternite/MaterniteDossier';
import { STATUS, formatDateFr, hhmm } from '../constants/app';
import { btnPrimary, btnSecondary, card, inputClass } from '../constants/ui';
import { apiErrorMessage, getRole, hasSession, LOGIN_PATH, homeForRole, peut } from '../utils/auth';
import { formatPhone } from '../utils/phone';

const VIDE = { rendezVousId: '', dateConsultation: '', notes: '', diagnostic: '', ordonnance: '' };

/** Dossier d'un patient : allergies, antécédents, historique des rendez-vous et comptes rendus de consultation. */
export default function DossierPatient() {
    const navigate = useNavigate();
    const [params] = useSearchParams();
    const telephone = params.get('telephone');
    const role = getRole();
    const peutSupprimer = peut('DOSSIERS_SUPPRIMER');
    const peutEcrire = peut('DOSSIERS_MODIFIER');
    const [dossier, setDossier] = useState(null);
    const [fiche, setFiche] = useState({ nom: '', allergies: '', antecedents: '', notes: '' });
    const [consultation, setConsultation] = useState(null); // formulaire ouvert (nouveau ou modification)
    const [enEdition, setEnEdition] = useState(null);
    const [loading, setLoading] = useState(Boolean(telephone));
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');
    const [notice, setNotice] = useState('');

    const appliquer = data => {
        setDossier(data);
        setFiche({ nom: data.nom || '', allergies: data.allergies || '', antecedents: data.antecedents || '', notes: data.notes || '' });
    };

    const load = useCallback(async () => {
        if (!telephone) return;
        setLoading(true); setError('');
        try { const { data } = await axiosClient.get(`/dossiers/${encodeURIComponent(telephone)}`); appliquer(data); }
        catch (err) { setError(apiErrorMessage(err, 'Impossible de charger ce dossier.')); }
        finally { setLoading(false); }
    }, [telephone]);

    useEffect(() => {
        if (!hasSession()) { navigate(LOGIN_PATH); return undefined; }
        if (!peut('DOSSIERS_LIRE')) { navigate(homeForRole(role)); return undefined; }
        const timer = window.setTimeout(load, 0);
        return () => window.clearTimeout(timer);
    }, [load, navigate, role]);

    const enregistrerFiche = async event => {
        event.preventDefault(); setSaving(true); setError(''); setNotice('');
        try { const { data } = await axiosClient.put(`/dossiers/${encodeURIComponent(telephone)}`, fiche); appliquer(data); setNotice('Dossier enregistré.'); }
        catch (err) { setError(apiErrorMessage(err, 'Enregistrement impossible.')); }
        finally { setSaving(false); }
    };

    const ouvrirConsultation = (existante, rendezVousId = '') => {
        setEnEdition(existante?.id || null);
        setConsultation(existante
            ? { rendezVousId: existante.rendezVousId || '', dateConsultation: existante.dateConsultation, notes: existante.notes || '', diagnostic: existante.diagnostic || '', ordonnance: existante.ordonnance || '' }
            : { ...VIDE, rendezVousId });
    };

    const enregistrerConsultation = async event => {
        event.preventDefault(); setSaving(true); setError(''); setNotice('');
        const payload = { ...consultation, rendezVousId: consultation.rendezVousId ? Number(consultation.rendezVousId) : null, dateConsultation: consultation.dateConsultation || null };
        try {
            if (enEdition) await axiosClient.put(`/dossiers/consultations/${enEdition}`, payload);
            else await axiosClient.post(`/dossiers/${encodeURIComponent(telephone)}/consultations`, payload);
            setConsultation(null); setEnEdition(null); setNotice('Compte rendu enregistré.'); await load();
        } catch (err) { setError(apiErrorMessage(err, 'Enregistrement impossible.')); }
        finally { setSaving(false); }
    };

    const supprimerConsultation = async id => {
        if (!window.confirm('Supprimer définitivement ce compte rendu ?')) return;
        try { await axiosClient.delete(`/dossiers/consultations/${id}`); setNotice('Compte rendu supprimé.'); await load(); }
        catch (err) { setError(apiErrorMessage(err, 'Suppression impossible.')); }
    };

    if (!telephone) {
        return (
            <AdminLayout title="Dossier patient" subtitle="Retrouvez un patient par son nom ou son numéro">
                <section className={`${card} mx-auto w-full max-w-xl p-8 text-center`}>
                    <UserRound className="mx-auto mb-3 text-teal-600" size={40} />
                    <h2 className="text-lg font-semibold">Quel patient souhaitez-vous consulter ?</h2>
                    <p className="mt-1 text-sm text-slate-500">Tapez un nom (même partiel, sans accent) ou un numéro de téléphone.</p>
                    <div className="mt-5 flex justify-center"><PatientSearch className="relative z-30 w-full max-w-sm" /></div>
                </section>
            </AdminLayout>
        );
    }

    const rdvs = dossier?.rendezVous || [];
    const rdvAssocie = id => rdvs.find(r => r.id === id);

    return (
        <AdminLayout title={dossier?.nom || 'Dossier patient'} subtitle={formatPhone(dossier?.telephone || telephone)}>
            <Notice tone="success" onClose={() => setNotice('')}>{notice}</Notice>
            <Notice tone="error" onClose={() => setError('')}>{error}</Notice>
            {loading && !dossier && <div className="flex items-center justify-center gap-2 p-12 text-sm text-slate-500"><Loader2 className="animate-spin" size={18} />Chargement du dossier…</div>}

            {dossier && !peutEcrire && <Notice tone="info">Vous pouvez consulter ce dossier mais pas le modifier.</Notice>}
            {dossier && (
                <fieldset disabled={!peutEcrire} className="m-0 min-w-0 border-0 p-0"><div className="grid gap-6 xl:grid-cols-[380px_1fr]">
                    <div className="space-y-6">
                        <form onSubmit={enregistrerFiche} className={`${card} space-y-4 p-5`}>
                            <div className="flex items-center gap-3">
                                <span className="flex h-12 w-12 items-center justify-center rounded-full bg-teal-100 text-lg font-bold text-teal-800 dark:bg-teal-500/15 dark:text-teal-300" aria-hidden="true">{(fiche.nom || '?').charAt(0).toUpperCase()}</span>
                                <div className="min-w-0"><div className="truncate font-semibold">{dossier.nom || 'Patient'}</div><div className="flex items-center gap-1 text-sm text-slate-500"><Phone size={13} />{formatPhone(dossier.telephone)}{dossier.ageDernierRdv ? ` · ${dossier.ageDernierRdv} ans` : ''}</div></div>
                            </div>
                            <label className="block text-sm font-medium">Nom<input maxLength={100} value={fiche.nom} onChange={e => setFiche({ ...fiche, nom: e.target.value })} className={`${inputClass} mt-1.5`} /></label>
                            <label className="block text-sm font-medium"><span className="text-rose-700 dark:text-rose-300">Allergies</span>
                                <textarea rows={2} maxLength={1000} value={fiche.allergies} onChange={e => setFiche({ ...fiche, allergies: e.target.value })} placeholder="Ex. pénicilline, aspirine…" className={`${inputClass} mt-1.5`} />
                                <span className="mt-1 block text-xs font-normal text-slate-500">Elles sont contrôlées automatiquement par l’assistant d’ordonnance.</span></label>
                            <label className="block text-sm font-medium">Antécédents<textarea rows={3} maxLength={2000} value={fiche.antecedents} onChange={e => setFiche({ ...fiche, antecedents: e.target.value })} placeholder="Césarienne, diabète, hypertension…" className={`${inputClass} mt-1.5`} /></label>
                            <label className="block text-sm font-medium">Notes<textarea rows={3} maxLength={2000} value={fiche.notes} onChange={e => setFiche({ ...fiche, notes: e.target.value })} className={`${inputClass} mt-1.5`} /></label>
                            <button disabled={saving} className={`${btnPrimary} w-full`}>{saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}Enregistrer le dossier</button>
                            {dossier.modifieLe && <p className="text-xs text-slate-400">Modifié le {new Date(dossier.modifieLe).toLocaleString('fr-FR')} par {dossier.modifiePar}</p>}
                        </form>
                        <Link to={`/assistant/ordonnance?telephone=${encodeURIComponent(dossier.telephone)}`} className={`${btnSecondary} w-full`}><FileSignature size={16} />Préparer une ordonnance</Link>
                    </div>

                    <div className="space-y-6">
                        <MaterniteDossier telephone={dossier.telephone} peutSupprimer={peutSupprimer} />
                        <section className={`${card} p-5`}>
                            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                                <h2 className="flex items-center gap-2 font-semibold"><Stethoscope size={18} className="text-teal-700" />Consultations <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs dark:bg-gray-800">{dossier.consultations.length}</span></h2>
                                <button onClick={() => ouvrirConsultation(null)} className={btnPrimary}><ClipboardPlus size={16} />Nouveau compte rendu</button>
                            </div>

                            {consultation && (
                                <form onSubmit={enregistrerConsultation} className="mb-5 space-y-3 rounded-2xl border border-teal-200 bg-teal-50/50 p-4 dark:border-teal-500/30 dark:bg-teal-500/5">
                                    <h3 className="font-semibold">{enEdition ? 'Modifier le compte rendu' : 'Nouveau compte rendu'}</h3>
                                    <div className="grid gap-3 sm:grid-cols-2">
                                        <label className="text-sm font-medium">Rendez-vous concerné
                                            <select value={consultation.rendezVousId} onChange={e => setConsultation({ ...consultation, rendezVousId: e.target.value })} className={`${inputClass} mt-1.5`}>
                                                <option value="">Aucun (consultation hors rendez-vous)</option>
                                                {rdvs.filter(r => r.statut !== 'ANNULE').map(r => <option key={r.id} value={r.id}>{formatDateFr(r.dateRdv)} à {hhmm(r.heureRdv)}</option>)}
                                            </select></label>
                                        <label className="text-sm font-medium">Date<input type="date" value={consultation.dateConsultation} onChange={e => setConsultation({ ...consultation, dateConsultation: e.target.value })} className={`${inputClass} mt-1.5`} /></label>
                                    </div>
                                    <label className="block text-sm font-medium">Diagnostic<input maxLength={500} value={consultation.diagnostic} onChange={e => setConsultation({ ...consultation, diagnostic: e.target.value })} className={`${inputClass} mt-1.5`} /></label>
                                    <label className="block text-sm font-medium">Notes de consultation<textarea rows={4} maxLength={4000} value={consultation.notes} onChange={e => setConsultation({ ...consultation, notes: e.target.value })} className={`${inputClass} mt-1.5`} /></label>
                                    <label className="block text-sm font-medium">Ordonnance<textarea rows={4} maxLength={4000} value={consultation.ordonnance} onChange={e => setConsultation({ ...consultation, ordonnance: e.target.value })} className={`${inputClass} mt-1.5 font-mono`} /></label>
                                    <div className="flex justify-end gap-2"><button type="button" onClick={() => { setConsultation(null); setEnEdition(null); }} className={btnSecondary}>Annuler</button><button disabled={saving} className={btnPrimary}>{saving && <Loader2 size={16} className="animate-spin" />}Enregistrer</button></div>
                                </form>
                            )}

                            {dossier.consultations.length === 0 && !consultation ? <p className="py-6 text-center text-sm text-slate-500">Aucun compte rendu pour ce patient.</p> : (
                                <ol className="space-y-3">
                                    {dossier.consultations.map(c => (
                                        <li key={c.id} className="rounded-2xl border border-slate-200 p-4 dark:border-gray-800">
                                            <div className="flex flex-wrap items-start justify-between gap-2">
                                                <div><div className="font-semibold capitalize">{formatDateFr(c.dateConsultation, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</div><div className="text-xs text-slate-500">Par {c.auteurNom}{rdvAssocie(c.rendezVousId) ? ` · rendez-vous de ${hhmm(rdvAssocie(c.rendezVousId).heureRdv)}` : ''}</div></div>
                                                <div className="flex gap-1">
                                                    <button onClick={() => ouvrirConsultation(c)} aria-label="Modifier ce compte rendu" className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-gray-800"><Pencil size={16} /></button>
                                                    {peutSupprimer && <button onClick={() => supprimerConsultation(c.id)} aria-label="Supprimer ce compte rendu" className="rounded-lg p-2 text-rose-700 hover:bg-rose-50 dark:text-rose-300 dark:hover:bg-rose-500/10"><Trash2 size={16} /></button>}
                                                </div>
                                            </div>
                                            {c.diagnostic && <p className="mt-2 text-sm"><strong>Diagnostic :</strong> {c.diagnostic}</p>}
                                            {c.notes && <p className="mt-2 whitespace-pre-wrap text-sm text-slate-700 dark:text-gray-300">{c.notes}</p>}
                                            {c.ordonnance && <pre className="mt-3 whitespace-pre-wrap rounded-xl bg-slate-50 p-3 font-sans text-sm dark:bg-gray-800/60"><strong className="mb-1 block text-xs uppercase text-slate-500">Ordonnance</strong>{c.ordonnance}</pre>}
                                        </li>
                                    ))}
                                </ol>
                            )}
                        </section>

                        <section className={`${card} p-5`}>
                            <h2 className="mb-4 flex items-center gap-2 font-semibold"><Search size={18} className="text-teal-700" />Historique des rendez-vous <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs dark:bg-gray-800">{rdvs.length}</span></h2>
                            {rdvs.length === 0 ? <p className="py-4 text-center text-sm text-slate-500">Aucun rendez-vous.</p> : (
                                <ul className="divide-y divide-slate-100 dark:divide-gray-800">
                                    {rdvs.map(r => {
                                        const st = STATUS[r.statut] || STATUS.EN_ATTENTE;
                                        return (
                                            <li key={r.id} className="flex flex-wrap items-center gap-3 py-3 text-sm">
                                                <span className="w-32 font-medium capitalize">{formatDateFr(r.dateRdv)}</span><span className="tabular-nums text-slate-500">{hhmm(r.heureRdv)}</span>
                                                <span className="min-w-0 flex-1 truncate text-slate-600 dark:text-gray-300">{r.serviceNom || 'Service non précisé'}{r.motif ? ` — ${r.motif.split('\n')[0]}` : ''}</span>
                                                <span className={`inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[11px] font-semibold ${st.badge}`}><span className={`h-1.5 w-1.5 rounded-full ${st.dot}`} />{st.label}</span>
                                                {r.statut !== 'ANNULE' && !dossier.consultations.some(c => c.rendezVousId === r.id) && <button onClick={() => ouvrirConsultation(null, String(r.id))} className="text-xs font-medium text-teal-700 hover:underline dark:text-teal-300">Ajouter un compte rendu</button>}
                                            </li>
                                        );
                                    })}
                                </ul>
                            )}
                        </section>
                    </div>
                </div></fieldset>
            )}
        </AdminLayout>
    );
}
