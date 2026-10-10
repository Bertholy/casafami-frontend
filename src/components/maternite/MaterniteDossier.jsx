import { useCallback, useEffect, useMemo, useState } from 'react';
import { AlertTriangle, Baby, CalendarClock, CheckCircle2, ClipboardPlus, HeartPulse, Loader2, Plus, Syringe, Trash2, X } from 'lucide-react';
import axiosClient from '../../api/axiosClient';
import Notice from '../Notice';
import { formatDateFr, todayISO } from '../../constants/app';
import { btnPrimary, btnSecondary, card, inputClass } from '../../constants/ui';
import { apiErrorMessage } from '../../utils/auth';

const ACTES = [['VAT', 'Vaccin antitétanique (VAT)'], ['SP', 'Prévention du paludisme (SP)'], ['FER', 'Fer / acide folique'], ['MILDA', 'Moustiquaire imprégnée'], ['DEPISTAGE', 'Dépistage (VIH, syphilis…)'], ['ECHO', 'Échographie'], ['PALU', 'Test de paludisme']];
const ETATS = {
    FAIT: { texte: 'Faite', classe: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-500/15 dark:text-emerald-300' },
    A_FAIRE: { texte: 'À faire maintenant', classe: 'bg-amber-100 text-amber-800 dark:bg-amber-500/15 dark:text-amber-300' },
    EN_RETARD: { texte: 'En retard', classe: 'bg-rose-100 text-rose-800 dark:bg-rose-500/15 dark:text-rose-300' },
    MANQUE: { texte: 'Non faite', classe: 'bg-slate-200 text-slate-700 dark:bg-gray-700 dark:text-gray-300' },
    A_VENIR: { texte: 'À venir', classe: 'bg-slate-100 text-slate-600 dark:bg-gray-800 dark:text-gray-300' },
};
const ETATS_VACCIN = { ...ETATS, FAIT: { texte: 'Fait', classe: ETATS.FAIT.classe } };
const dateLongue = iso => formatDateFr(iso, { day: 'numeric', month: 'long', year: 'numeric' });
const dateCourte = iso => formatDateFr(iso, { day: 'numeric', month: 'short' });
const num = valeur => (valeur === '' || valeur == null ? null : Number(valeur));

function Etat({ etat, table = ETATS }) {
    const { texte, classe } = table[etat] || ETATS.A_VENIR;
    return <span className={`inline-flex shrink-0 items-center rounded-full px-2 py-0.5 text-[11px] font-semibold ${classe}`}>{texte}</span>;
}

const ageLisible = jours => (jours < 14 ? `${jours} jour${jours > 1 ? 's' : ''}` : jours < 90 ? `${Math.floor(jours / 7)} semaines` : `${Math.floor(jours / 30.4)} mois`);

/**
 * Suivi de maternité d'une patiente : grossesse en cours (terme, calendrier des consultations prénatales, mesures et alertes),
 * grossesses passées et carnet de vaccination des enfants. Les calendriers sont des repères, à adapter par le soignant.
 */
export default function MaterniteDossier({ telephone, peutSupprimer }) {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [notice, setNotice] = useState('');
    const [saving, setSaving] = useState(false);
    const [formulaire, setFormulaire] = useState(null); // { type: 'grossesse' | 'cpn' | 'fin' | 'enfant', ... }
    const [dateVaccin, setDateVaccin] = useState({});

    const charger = useCallback(async () => {
        try { const { data: d } = await axiosClient.get(`/dossiers/${encodeURIComponent(telephone)}/maternite`); setData(d); }
        catch (err) { setError(apiErrorMessage(err, 'Impossible de charger le suivi de maternité.')); }
        finally { setLoading(false); }
    }, [telephone]);

    useEffect(() => {
        const timer = window.setTimeout(charger, 0);
        return () => window.clearTimeout(timer);
    }, [charger]);

    const envoyer = async (requete, message) => {
        setSaving(true); setError(''); setNotice('');
        try { await requete(); setFormulaire(null); setNotice(message); await charger(); }
        catch (err) { setError(apiErrorMessage(err, 'Enregistrement impossible. Vérifiez les valeurs saisies.')); }
        finally { setSaving(false); }
    };

    const enCours = useMemo(() => (data?.grossesses || []).find(g => g.statut === 'EN_COURS'), [data]);
    const passees = useMemo(() => (data?.grossesses || []).filter(g => g.statut !== 'EN_COURS'), [data]);
    const champ = (nom, valeur) => setFormulaire(f => ({ ...f, [nom]: valeur }));

    const ouvrirCpn = () => setFormulaire({ type: 'cpn', date: todayISO(), poidsKg: '', tensionSystolique: '', tensionDiastolique: '', hauteurUterineCm: '', bcf: '', albuminurie: '', oedemes: false, presentation: '', actes: [], observations: '', prochainRdv: '' });
    const basculerActe = code => setFormulaire(f => ({ ...f, actes: f.actes.includes(code) ? f.actes.filter(a => a !== code) : [...f.actes, code] }));

    const soumettre = event => {
        event.preventDefault();
        const f = formulaire;
        if (f.type === 'grossesse') {
            return envoyer(() => axiosClient.post(`/dossiers/${encodeURIComponent(telephone)}/grossesses`, { ddr: f.ddr || null, dpa: f.dpa || null, groupeSanguin: f.groupeSanguin || null, risques: f.risques || null }), 'Grossesse ouverte.');
        }
        if (f.type === 'cpn') {
            return envoyer(() => axiosClient.post(`/dossiers/grossesses/${enCours.id}/consultations`, {
                date: f.date || null, poidsKg: num(f.poidsKg), tensionSystolique: num(f.tensionSystolique), tensionDiastolique: num(f.tensionDiastolique),
                hauteurUterineCm: num(f.hauteurUterineCm), bcf: num(f.bcf), oedemes: f.oedemes, albuminurie: f.albuminurie || null, presentation: f.presentation || null,
                actes: f.actes, observations: f.observations || null, prochainRdv: f.prochainRdv || null,
            }), 'Consultation prénatale enregistrée.');
        }
        if (f.type === 'fin') {
            return envoyer(() => axiosClient.put(`/dossiers/grossesses/${enCours.id}/terminer`, { statut: f.statut, dateFin: f.dateFin || null, issue: f.issue || null }), 'Grossesse clôturée.');
        }
        return envoyer(() => axiosClient.post(`/dossiers/${encodeURIComponent(telephone)}/enfants`, { nom: f.nom, sexe: f.sexe || null, dateNaissance: f.dateNaissance, poidsNaissanceG: num(f.poidsNaissanceG), grossesseId: f.grossesseId ? Number(f.grossesseId) : null }), 'Enfant ajouté.');
    };

    const supprimer = async (url, question, message) => {
        if (!window.confirm(question)) return;
        await envoyer(() => axiosClient.delete(url), message);
    };

    const vacciner = (enfant, vaccin) => envoyer(() => axiosClient.put(`/dossiers/enfants/${enfant.id}/vaccins/${vaccin.code}`, { dateFaite: dateVaccin[enfant.id] || todayISO() }), `${vaccin.libelle.split(' (')[0]} enregistré.`);
    const annulerVaccin = (enfant, vaccin) => envoyer(() => axiosClient.put(`/dossiers/enfants/${enfant.id}/vaccins/${vaccin.code}/annuler`), 'Vaccin retiré du carnet.');

    const label = 'block text-sm font-medium';
    const petit = `${inputClass} mt-1`;

    return (
        <section className={`${card} p-5`} aria-label="Suivi de maternité">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                <h2 className="flex items-center gap-2 font-semibold"><HeartPulse size={18} className="text-rose-600" />Maternité : grossesse et enfants</h2>
                <div className="flex flex-wrap gap-2">
                    {!enCours && <button onClick={() => setFormulaire({ type: 'grossesse', ddr: '', dpa: '', groupeSanguin: '', risques: '' })} className={btnPrimary}><Plus size={16} />Ouvrir une grossesse</button>}
                    <button onClick={() => setFormulaire({ type: 'enfant', nom: '', sexe: '', dateNaissance: '', poidsNaissanceG: '', grossesseId: '' })} className={btnSecondary}><Baby size={16} />Ajouter un enfant</button>
                </div>
            </div>
            <Notice tone="success" onClose={() => setNotice('')}>{notice}</Notice>
            <Notice tone="error" onClose={() => setError('')}>{error}</Notice>
            {loading && <div className="flex justify-center p-6"><Loader2 size={18} className="animate-spin text-slate-400" /></div>}

            {formulaire && (
                <form onSubmit={soumettre} className="my-4 space-y-3 rounded-2xl border border-teal-200 bg-teal-50/50 p-4 dark:border-teal-500/30 dark:bg-teal-500/5">
                    <div className="flex items-center justify-between">
                        <h3 className="font-semibold">{{ grossesse: 'Ouvrir une grossesse', cpn: 'Nouvelle consultation prénatale', fin: 'Clôturer la grossesse', enfant: 'Ajouter un enfant' }[formulaire.type]}</h3>
                        <button type="button" onClick={() => setFormulaire(null)} aria-label="Fermer le formulaire"><X size={18} /></button>
                    </div>

                    {formulaire.type === 'grossesse' && (
                        <div className="grid gap-3 sm:grid-cols-2">
                            <label className={label}>Date des dernières règles<input type="date" max={todayISO()} value={formulaire.ddr} onChange={e => champ('ddr', e.target.value)} className={petit} /></label>
                            <label className={label}>ou date prévue d’accouchement<input type="date" value={formulaire.dpa} onChange={e => champ('dpa', e.target.value)} className={petit} /></label>
                            <p className="text-xs text-slate-500 sm:col-span-2">Avec la date des dernières règles, le terme est calculé automatiquement (+ 280 jours). Indiquez au moins l’une des deux dates.</p>
                            <label className={label}>Groupe sanguin<select value={formulaire.groupeSanguin} onChange={e => champ('groupeSanguin', e.target.value)} className={petit}><option value="">Non connu</option>{['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map(g => <option key={g}>{g}</option>)}</select></label>
                            <label className={label}>Facteurs de risque<input maxLength={1000} value={formulaire.risques} onChange={e => champ('risques', e.target.value)} placeholder="Ex. césarienne précédente, hypertension…" className={petit} /></label>
                        </div>
                    )}

                    {formulaire.type === 'cpn' && (
                        <>
                            <div className="grid gap-3 sm:grid-cols-3">
                                <label className={label}>Date<input type="date" required max={todayISO()} value={formulaire.date} onChange={e => champ('date', e.target.value)} className={petit} /></label>
                                <label className={label}>Poids (kg)<input type="number" step="0.1" min="20" max="200" value={formulaire.poidsKg} onChange={e => champ('poidsKg', e.target.value)} className={petit} /></label>
                                <label className={label}>Hauteur utérine (cm)<input type="number" min="0" max="60" value={formulaire.hauteurUterineCm} onChange={e => champ('hauteurUterineCm', e.target.value)} className={petit} /></label>
                                <label className={label}>Tension max (systolique)<input type="number" min="50" max="260" value={formulaire.tensionSystolique} onChange={e => champ('tensionSystolique', e.target.value)} placeholder="ex. 120" className={petit} /></label>
                                <label className={label}>Tension min (diastolique)<input type="number" min="30" max="160" value={formulaire.tensionDiastolique} onChange={e => champ('tensionDiastolique', e.target.value)} placeholder="ex. 80" className={petit} /></label>
                                <label className={label}>Cœur du bébé (bpm)<input type="number" min="60" max="220" value={formulaire.bcf} onChange={e => champ('bcf', e.target.value)} placeholder="ex. 140" className={petit} /></label>
                                <label className={label}>Albuminurie<select value={formulaire.albuminurie} onChange={e => champ('albuminurie', e.target.value)} className={petit}><option value="">Non faite</option>{['NEG', '+', '++', '+++'].map(a => <option key={a}>{a}</option>)}</select></label>
                                <label className={label}>Présentation<select value={formulaire.presentation} onChange={e => champ('presentation', e.target.value)} className={petit}><option value="">Non précisée</option>{['Céphalique', 'Siège', 'Transverse'].map(p => <option key={p}>{p}</option>)}</select></label>
                                <label className="flex items-center gap-2 pt-6 text-sm font-medium"><input type="checkbox" checked={formulaire.oedemes} onChange={e => champ('oedemes', e.target.checked)} className="h-4 w-4 accent-teal-700" />Œdèmes</label>
                            </div>
                            <fieldset><legend className="mb-1 text-sm font-medium">Actes réalisés</legend>
                                <div className="flex flex-wrap gap-2">{ACTES.map(([code, nom]) => (
                                    <label key={code} className={`cursor-pointer rounded-full border px-3 py-1 text-xs font-medium transition ${formulaire.actes.includes(code) ? 'border-teal-600 bg-teal-600 text-white' : 'border-slate-300 hover:border-teal-400 dark:border-gray-600'}`}>
                                        <input type="checkbox" className="sr-only" checked={formulaire.actes.includes(code)} onChange={() => basculerActe(code)} />{nom}
                                    </label>))}
                                </div>
                            </fieldset>
                            <label className={label}>Observations<textarea rows={3} maxLength={2000} value={formulaire.observations} onChange={e => champ('observations', e.target.value)} className={petit} /></label>
                            <label className={label}>Prochaine consultation prévue le<input type="date" value={formulaire.prochainRdv} onChange={e => champ('prochainRdv', e.target.value)} className={`${petit} sm:w-60`} /></label>
                        </>
                    )}

                    {formulaire.type === 'fin' && (
                        <div className="grid gap-3 sm:grid-cols-2">
                            <label className={label}>Issue<select value={formulaire.statut} onChange={e => champ('statut', e.target.value)} className={petit}><option value="TERMINEE">Accouchement</option><option value="INTERROMPUE">Fausse couche / interruption</option></select></label>
                            <label className={label}>Date<input type="date" max={todayISO()} value={formulaire.dateFin} onChange={e => champ('dateFin', e.target.value)} className={petit} /></label>
                            <label className={`${label} sm:col-span-2`}>Détails<input maxLength={300} value={formulaire.issue} onChange={e => champ('issue', e.target.value)} placeholder="Ex. accouchement normal, fille 3,2 kg" className={petit} /></label>
                        </div>
                    )}

                    {formulaire.type === 'enfant' && (
                        <div className="grid gap-3 sm:grid-cols-2">
                            <label className={label}>Nom<input required maxLength={100} value={formulaire.nom} onChange={e => champ('nom', e.target.value)} className={petit} /></label>
                            <label className={label}>Date de naissance<input type="date" required max={todayISO()} value={formulaire.dateNaissance} onChange={e => champ('dateNaissance', e.target.value)} className={petit} /></label>
                            <label className={label}>Sexe<select value={formulaire.sexe} onChange={e => champ('sexe', e.target.value)} className={petit}><option value="">Non précisé</option><option value="F">Fille</option><option value="M">Garçon</option></select></label>
                            <label className={label}>Poids de naissance (g)<input type="number" min="300" max="7000" value={formulaire.poidsNaissanceG} onChange={e => champ('poidsNaissanceG', e.target.value)} className={petit} /></label>
                        </div>
                    )}
                    <div className="flex justify-end gap-2">
                        <button type="button" onClick={() => setFormulaire(null)} className={btnSecondary}>Annuler</button>
                        <button disabled={saving} className={btnPrimary}>{saving && <Loader2 size={15} className="animate-spin" />}Enregistrer</button>
                    </div>
                </form>
            )}

            {/* ---------- grossesse en cours ---------- */}
            {enCours && (
                <div className="space-y-4 rounded-2xl border border-rose-200 bg-rose-50/40 p-4 dark:border-rose-500/20 dark:bg-rose-500/5">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                        <div>
                            <p className="text-xs font-semibold uppercase tracking-wide text-rose-700 dark:text-rose-300">Grossesse en cours</p>
                            <p className="text-2xl font-bold">{enCours.sa} SA{enCours.saJours ? ` + ${enCours.saJours} j` : ''} <span className="text-base font-medium text-slate-500">· {enCours.trimestre}{enCours.trimestre === 1 ? 'er' : 'e'} trimestre</span></p>
                            <p className="text-sm text-slate-600 dark:text-gray-300">Terme prévu le <strong>{dateLongue(enCours.dpa)}</strong>{enCours.joursRestants != null && (enCours.joursRestants >= 0 ? ` (dans ${enCours.joursRestants} jours)` : ` (dépassé de ${-enCours.joursRestants} jours)`)}{enCours.groupeSanguin && <> · groupe <strong>{enCours.groupeSanguin}</strong></>}</p>
                        </div>
                        <div className="flex flex-wrap gap-2">
                            <button onClick={ouvrirCpn} className={btnPrimary}><ClipboardPlus size={16} />Consultation prénatale</button>
                            <button onClick={() => setFormulaire({ type: 'fin', statut: 'TERMINEE', dateFin: '', issue: '' })} className={btnSecondary}>Clôturer</button>
                        </div>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-rose-100 dark:bg-gray-800" role="progressbar" aria-valuenow={enCours.sa} aria-valuemin={0} aria-valuemax={41} aria-label="Avancement de la grossesse">
                        <div className="h-full rounded-full bg-rose-500" style={{ width: `${Math.min(100, Math.round((enCours.sa / 41) * 100))}%` }} />
                    </div>
                    {enCours.rappels?.length > 0 && (
                        <ul className="space-y-1">{enCours.rappels.map(r => <li key={r} className="flex items-start gap-2 text-sm text-amber-800 dark:text-amber-300"><AlertTriangle size={15} className="mt-0.5 shrink-0" />{r}</li>)}</ul>
                    )}
                    <div>
                        <h3 className="mb-2 flex items-center gap-2 text-sm font-semibold"><CalendarClock size={16} />Calendrier des consultations prénatales <span className="text-xs font-normal text-slate-500">(repères OMS, à adapter)</span></h3>
                        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
                            {enCours.calendrier.map(e => (
                                <div key={e.code} className="rounded-xl border border-slate-200 bg-white p-3 text-sm dark:border-gray-700 dark:bg-gray-900">
                                    <div className="mb-1 flex items-center justify-between gap-2"><strong>{e.code}</strong><Etat etat={e.etat} /></div>
                                    <p className="text-xs text-slate-500">{e.debutSa}–{e.finSa} SA</p>
                                    <p className="text-xs text-slate-500">{dateCourte(e.debut)} → {dateCourte(e.fin)}</p>
                                </div>
                            ))}
                        </div>
                        {enCours.prochainRdv && <p className="mt-2 text-sm">Prochaine consultation prévue le <strong>{dateLongue(enCours.prochainRdv)}</strong>.</p>}
                    </div>
                    {enCours.risques && <p className="text-sm"><strong>Facteurs de risque :</strong> {enCours.risques}</p>}
                    <Consultations liste={enCours.consultations} peutSupprimer={peutSupprimer} onSupprimer={c => supprimer(`/dossiers/grossesses/consultations/${c.id}`, 'Supprimer cette consultation prénatale ?', 'Consultation supprimée.')} />
                    {peutSupprimer && <button onClick={() => supprimer(`/dossiers/grossesses/${enCours.id}`, 'Supprimer définitivement cette grossesse et toutes ses consultations ?', 'Grossesse supprimée.')} className="text-xs text-rose-700 hover:underline dark:text-rose-300">Supprimer cette grossesse</button>}
                </div>
            )}

            {!loading && !enCours && passees.length === 0 && (data?.enfants || []).length === 0 && <p className="py-6 text-center text-sm text-slate-500">Aucun suivi de maternité pour cette patiente.</p>}

            {/* ---------- grossesses passées ---------- */}
            {passees.length > 0 && (
                <div className="mt-4 space-y-2">
                    <h3 className="text-sm font-semibold">Grossesses précédentes</h3>
                    {passees.map(g => (
                        <details key={g.id} className="rounded-xl border border-slate-200 p-3 text-sm dark:border-gray-800">
                            <summary className="cursor-pointer font-medium">
                                {g.statut === 'TERMINEE' ? 'Accouchement' : 'Interrompue'} le {g.dateFin ? dateLongue(g.dateFin) : '—'} <span className="font-normal text-slate-500">· {g.consultations.length} consultation(s){g.issue ? ` · ${g.issue}` : ''}</span>
                            </summary>
                            <div className="mt-3 space-y-3">
                                <div className="grid gap-2 sm:grid-cols-4">{g.calendrier.map(e => <div key={e.code} className="flex items-center justify-between gap-2 rounded-lg bg-slate-50 px-2 py-1 text-xs dark:bg-gray-800/60"><strong>{e.code}</strong><Etat etat={e.etat} /></div>)}</div>
                                <Consultations liste={g.consultations} peutSupprimer={peutSupprimer} onSupprimer={c => supprimer(`/dossiers/grossesses/consultations/${c.id}`, 'Supprimer cette consultation prénatale ?', 'Consultation supprimée.')} />
                                {peutSupprimer && <button onClick={() => supprimer(`/dossiers/grossesses/${g.id}`, 'Supprimer définitivement cette grossesse et ses consultations ?', 'Grossesse supprimée.')} className="text-xs text-rose-700 hover:underline dark:text-rose-300">Supprimer cette grossesse</button>}
                            </div>
                        </details>
                    ))}
                </div>
            )}

            {/* ---------- enfants et vaccinations ---------- */}
            {(data?.enfants || []).map(enfant => {
                const groupes = [...new Set(enfant.vaccins.map(v => v.groupe))];
                return (
                    <div key={enfant.id} className="mt-4 space-y-3 rounded-2xl border border-sky-200 bg-sky-50/40 p-4 dark:border-sky-500/20 dark:bg-sky-500/5">
                        <div className="flex flex-wrap items-start justify-between gap-3">
                            <div>
                                <p className="flex items-center gap-2 font-semibold"><Baby size={18} className="text-sky-700" />{enfant.nom} {enfant.sexe && <span className="text-xs font-normal text-slate-500">({enfant.sexe === 'F' ? 'fille' : 'garçon'})</span>}</p>
                                <p className="text-sm text-slate-600 dark:text-gray-300">Né(e) le {dateLongue(enfant.dateNaissance)} · {ageLisible(enfant.ageJours)}{enfant.poidsNaissanceG ? ` · ${enfant.poidsNaissanceG} g à la naissance` : ''}</p>
                            </div>
                            <div className="flex items-center gap-2">
                                <label className="flex items-center gap-2 text-xs font-medium">Date de l’injection<input type="date" max={todayISO()} min={enfant.dateNaissance} value={dateVaccin[enfant.id] || todayISO()} onChange={e => setDateVaccin(d => ({ ...d, [enfant.id]: e.target.value }))} className={`${inputClass} !w-40 !py-1.5`} /></label>
                                {peutSupprimer && <button onClick={() => supprimer(`/dossiers/enfants/${enfant.id}`, `Supprimer ${enfant.nom} et son carnet de vaccination ?`, 'Enfant supprimé.')} aria-label={`Supprimer ${enfant.nom}`} className="rounded-lg p-2 text-rose-700 hover:bg-rose-50 dark:text-rose-300 dark:hover:bg-rose-500/10"><Trash2 size={16} /></button>}
                            </div>
                        </div>
                        <div className="space-y-3">
                            {groupes.map(groupe => (
                                <div key={groupe}>
                                    <p className="mb-1 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-slate-500"><Syringe size={13} />{groupe}</p>
                                    <ul className="divide-y divide-slate-100 rounded-xl border border-slate-200 bg-white dark:divide-gray-800 dark:border-gray-700 dark:bg-gray-900">
                                        {enfant.vaccins.filter(v => v.groupe === groupe).map(v => (
                                            <li key={v.code} className="flex flex-wrap items-center gap-2 px-3 py-2 text-sm">
                                                <span className="min-w-0 flex-1">{v.libelle}<span className="ml-2 text-xs text-slate-400">prévu le {dateCourte(v.echeance)}</span>{v.dateFaite && <span className="ml-2 text-xs text-emerald-700 dark:text-emerald-300">fait le {dateCourte(v.dateFaite)}{v.lot ? ` · lot ${v.lot}` : ''}</span>}</span>
                                                <Etat etat={v.statut} table={ETATS_VACCIN} />
                                                {v.statut === 'FAIT'
                                                    ? <button onClick={() => annulerVaccin(enfant, v)} aria-label={`Retirer ${v.libelle} du carnet`} className="text-xs text-slate-500 hover:underline">Retirer</button>
                                                    : <button disabled={saving} onClick={() => vacciner(enfant, v)} className="inline-flex items-center gap-1 rounded-lg bg-teal-700 px-2.5 py-1 text-xs font-semibold text-white hover:bg-teal-800 disabled:opacity-50"><CheckCircle2 size={13} />Fait</button>}
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            ))}
                        </div>
                    </div>
                );
            })}
            {(data?.enfants || []).length > 0 && <p className="mt-3 text-xs text-slate-500">Calendrier vaccinal de référence (programme élargi de vaccination) : à valider et adapter par le médecin ou la sage-femme.</p>}
        </section>
    );
}

function Consultations({ liste, peutSupprimer, onSupprimer }) {
    if (!liste.length) return <p className="text-sm text-slate-500">Aucune consultation prénatale enregistrée.</p>;
    return (
        <div>
            <h3 className="mb-2 text-sm font-semibold">Consultations prénatales <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs dark:bg-gray-800">{liste.length}</span></h3>
            <ol className="space-y-2">
                {[...liste].reverse().map(c => (
                    <li key={c.id} className="rounded-xl border border-slate-200 bg-white p-3 text-sm dark:border-gray-700 dark:bg-gray-900">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                            <span className="font-medium">{dateLongue(c.date)} <span className="ml-1 rounded-full bg-rose-100 px-2 py-0.5 text-xs font-semibold text-rose-800 dark:bg-rose-500/15 dark:text-rose-300">{c.termeSa} SA</span></span>
                            {peutSupprimer && <button onClick={() => onSupprimer(c)} aria-label="Supprimer cette consultation" className="rounded-lg p-1.5 text-rose-700 hover:bg-rose-50 dark:text-rose-300 dark:hover:bg-rose-500/10"><Trash2 size={15} /></button>}
                        </div>
                        <p className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-600 dark:text-gray-300">
                            {c.poidsKg != null && <span>Poids {c.poidsKg} kg</span>}
                            {c.tensionSystolique != null && <span>TA {c.tensionSystolique}/{c.tensionDiastolique ?? '?'}</span>}
                            {c.hauteurUterineCm != null && <span>HU {c.hauteurUterineCm} cm</span>}
                            {c.bcf != null && <span>BCF {c.bcf}</span>}
                            {c.albuminurie && <span>Albuminurie {c.albuminurie}</span>}
                            {c.oedemes && <span>Œdèmes</span>}
                            {c.presentation && <span>{c.presentation}</span>}
                        </p>
                        {c.actes.length > 0 && <p className="mt-1 flex flex-wrap gap-1">{c.actes.map(a => <span key={a} className="rounded-full bg-teal-100 px-2 py-0.5 text-[11px] font-medium text-teal-800 dark:bg-teal-500/15 dark:text-teal-300">{ACTES.find(([code]) => code === a)?.[1] || a}</span>)}</p>}
                        {c.alertes.length > 0 && <ul className="mt-2 space-y-0.5">{c.alertes.map(a => <li key={a} className="flex items-start gap-1.5 text-xs font-medium text-rose-700 dark:text-rose-300"><AlertTriangle size={13} className="mt-0.5 shrink-0" />{a}</li>)}</ul>}
                        {c.observations && <p className="mt-2 whitespace-pre-wrap text-slate-700 dark:text-gray-300">{c.observations}</p>}
                        <p className="mt-1 text-[11px] text-slate-400">{c.auteur}{c.prochainRdv ? ` · prochaine consultation le ${dateCourte(c.prochainRdv)}` : ''}</p>
                    </li>
                ))}
            </ol>
        </div>
    );
}
