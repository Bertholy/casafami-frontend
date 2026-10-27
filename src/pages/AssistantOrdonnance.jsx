import { useEffect, useMemo, useState } from 'react';
import { SkeletonPage } from '../components/ui/skeleton';
import { Checkbox } from '../components/ui/checkbox';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { AlertOctagon, AlertTriangle, ClipboardCheck, Copy, Info, Loader2, Plus, Printer, Save, Sparkles, Trash2, UserRound } from 'lucide-react';
import axiosClient from '../api/axiosClient';
import AdminLayout from '../components/AdminLayout';
import Notice from '../components/Notice';
import PatientSearch from '../components/PatientSearch';
import { formatDateFr, hhmm } from '../constants/app';
import { btnPrimary, btnSecondary, card, inputClass } from '../constants/ui';
import { checkSafety, ordonnanceTexte, printOrdonnance, suggestMaladies } from '../utils/ordonnance';
import { apiErrorMessage, getRole, hasSession, homeForRole, LOGIN_PATH, peut } from '../utils/auth';
import { formatPhone } from '../utils/phone';

const ALLOWED = ['SUPER_ADMIN', 'MEDECIN', 'SAGE_FEMME'];
// Contrôles : une ligne avec un trait à gauche, sans fond coloré ; seule l'icône et le trait portent la couleur.
const NIVEAUX = {
    danger: { classe: 'border-rose-500', couleurIcone: 'text-rose-600 dark:text-rose-400', Icone: AlertOctagon, titre: 'À vérifier absolument' },
    attention: { classe: 'border-amber-500', couleurIcone: 'text-amber-600 dark:text-amber-400', Icone: AlertTriangle, titre: 'Attention' },
    info: { classe: 'border-slate-300 dark:border-gray-600', couleurIcone: 'text-slate-400', Icone: Info, titre: 'Pour information' },
};
let compteur = 0;
const nouvelleLigne = (base = {}) => ({ id: ++compteur, actif: true, medicament: '', posologie: '', duree: '', remarques: '', ...base });

/**
 * Assistant d'ordonnance : suggère des fiches à partir des symptômes, pré-remplit l'ordonnance depuis les protocoles
 * du cabinet (Maladies et traitements), contrôle les risques et produit un document à relire, corriger et signer.
 */
export default function AssistantOrdonnance() {
    const navigate = useNavigate();
    const [params] = useSearchParams();
    const telephone = params.get('telephone');
    const role = getRole();
    const [maladies, setMaladies] = useState([]);
    const [dossier, setDossier] = useState(null);
    const [prescripteur, setPrescripteur] = useState('');
    const [patient, setPatient] = useState({ nom: '', age: '', enceinte: 'inconnu', allergies: '' });
    const [symptomes, setSymptomes] = useState('');
    const [maladieId, setMaladieId] = useState('');
    const [lignes, setLignes] = useState([]);
    const [rdvId, setRdvId] = useState('');
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');
    const [notice, setNotice] = useState('');

    useEffect(() => {
        if (!hasSession()) { navigate(LOGIN_PATH); return undefined; }
        if (!ALLOWED.includes(role) || !peut('MALADIES_LIRE')) { navigate(homeForRole(role)); return undefined; }
        let cancelled = false;
        const timer = window.setTimeout(async () => {
            try {
                const requetes = [axiosClient.get('/maladies'), axiosClient.get('/profile')];
                if (telephone) requetes.push(axiosClient.get(`/dossiers/${encodeURIComponent(telephone)}`));
                const [m, profil, d] = await Promise.all(requetes);
                if (cancelled) return;
                setMaladies(m.data); setPrescripteur(profil.data.nom);
                if (d) {
                    setDossier(d.data);
                    setPatient(current => ({ ...current, nom: d.data.nom || '', age: d.data.ageDernierRdv ? String(d.data.ageDernierRdv) : '', allergies: d.data.allergies || '' }));
                    const dernier = d.data.rendezVous.find(r => r.statut !== 'ANNULE');
                    if (dernier) setRdvId(String(dernier.id));
                }
            } catch (err) { if (!cancelled) setError(apiErrorMessage(err, 'Impossible de charger les données.')); }
            finally { if (!cancelled) setLoading(false); }
        }, 0);
        return () => { cancelled = true; window.clearTimeout(timer); };
    }, [navigate, role, telephone]);

    const suggestions = useMemo(() => suggestMaladies(maladies, symptomes), [maladies, symptomes]);
    const maladie = maladies.find(m => String(m.id) === String(maladieId));
    const actives = useMemo(() => lignes.filter(l => l.actif), [lignes]);
    const alertes = useMemo(() => checkSafety(actives, patient), [actives, patient]);
    const diagnostic = maladie?.nom || '';
    const texte = ordonnanceTexte({ diagnostic, lignes: actives });
    const bloquant = alertes.some(a => a.niveau === 'danger');

    const choisir = id => {
        setMaladieId(String(id));
        const fiche = maladies.find(m => m.id === id);
        setLignes((fiche?.traitements || []).map(t => nouvelleLigne({ medicament: t.medicament, posologie: t.posologie || '', duree: t.duree || '', remarques: t.remarques || '' })));
    };
    const setLigne = (id, patch) => setLignes(current => current.map(l => (l.id === id ? { ...l, ...patch } : l)));

    const imprimer = () => {
        if (bloquant && !window.confirm('Des alertes importantes sont affichées. Avez-vous bien vérifié l’ordonnance avant de l’imprimer ?')) return;
        printOrdonnance({ patient, diagnostic, lignes: actives, prescripteur });
    };
    const copier = async () => {
        try { await navigator.clipboard.writeText(texte); setNotice('Ordonnance copiée dans le presse-papiers.'); }
        catch { setError('Copie impossible : sélectionnez le texte manuellement.'); }
    };
    const enregistrer = async () => {
        if (!telephone) return;
        if (bloquant && !window.confirm('Des alertes importantes sont affichées. Enregistrer quand même cette ordonnance dans le dossier ?')) return;
        setSaving(true); setError(''); setNotice('');
        try {
            await axiosClient.post(`/dossiers/${encodeURIComponent(telephone)}/consultations`, {
                rendezVousId: rdvId ? Number(rdvId) : null, diagnostic, ordonnance: texte,
            });
            setNotice('Ordonnance enregistrée dans le dossier du patient.');
        } catch (err) { setError(apiErrorMessage(err, 'Enregistrement impossible.')); }
        finally { setSaving(false); }
    };

    if (loading) return <AdminLayout title="Assistant d’ordonnance"><SkeletonPage /></AdminLayout>;

    return (
        <AdminLayout title="Assistant d’ordonnance" subtitle="Brouillon à relire, corriger et signer par le prescripteur">
            <p className="px-1 text-xs text-slate-500 dark:text-gray-400">Brouillon à relire : la décision et la responsabilité de la prescription restent au prescripteur.</p>
            <Notice tone="success" onClose={() => setNotice('')}>{notice}</Notice>
            <Notice tone="error" onClose={() => setError('')}>{error}</Notice>

            {maladies.length === 0 && (
                <Notice tone="info">Aucune fiche maladie n’est encore enregistrée. {role !== 'SAGE_FEMME' ? <Link to="/medecin/maladies" className="font-semibold underline">Ajoutez vos protocoles</Link> : 'Demandez au médecin d’ajouter ses protocoles'} (maladie + traitements) pour que l’assistant puisse les proposer.</Notice>
            )}

            <div className="grid gap-6 xl:grid-cols-[1fr_420px]">
                <div className="space-y-6">
                    {/* 1. Patient */}
                    <section className={`${card} p-5`}>
                        <h2 className="mb-4 flex items-center gap-2 font-semibold"><UserRound size={18} className="text-teal-700" />1. Patient</h2>
                        {!telephone && (
                            <div className="mb-4 rounded-xl bg-slate-50 p-4 text-sm dark:bg-gray-800/60">
                                <p className="mb-2 text-slate-600 dark:text-gray-300">Pour contrôler les allergies et enregistrer l’ordonnance dans le dossier, recherchez le patient :</p>
                                <PatientSearch className="relative z-20 w-full max-w-sm" />
                                <p className="mt-2 text-xs text-slate-500">Sinon, remplissez simplement les champs ci-dessous (rien ne sera enregistré).</p>
                            </div>
                        )}
                        {dossier && <p className="mb-3 text-sm text-slate-500">Dossier de <Link to={`/patients/dossier?telephone=${encodeURIComponent(dossier.telephone)}`} className="font-semibold text-teal-700 underline dark:text-teal-300">{dossier.nom}</Link> · {formatPhone(dossier.telephone)}</p>}
                        <div className="grid gap-4 sm:grid-cols-3">
                            <label className="text-sm font-medium sm:col-span-2">Nom<input value={patient.nom} onChange={e => setPatient({ ...patient, nom: e.target.value })} maxLength={100} className={`${inputClass} mt-1.5`} /></label>
                            <label className="text-sm font-medium">Âge<input type="number" min={0} max={120} value={patient.age} onChange={e => setPatient({ ...patient, age: e.target.value })} className={`${inputClass} mt-1.5`} /></label>
                            <label className="text-sm font-medium">Enceinte ?
                                <select value={patient.enceinte} onChange={e => setPatient({ ...patient, enceinte: e.target.value })} className={`${inputClass} mt-1.5`}>
                                    <option value="inconnu">Non précisé</option><option value="non">Non</option><option value="oui">Oui</option>
                                </select></label>
                            <label className="text-sm font-medium sm:col-span-2">Allergies connues<input value={patient.allergies} onChange={e => setPatient({ ...patient, allergies: e.target.value })} maxLength={1000} placeholder="Ex. pénicilline, aspirine" className={`${inputClass} mt-1.5`} /></label>
                        </div>
                    </section>

                    {/* 2. Maladie */}
                    <section className={`${card} p-5`}>
                        <h2 className="mb-4 flex items-center gap-2 font-semibold"><Sparkles size={18} className="text-teal-700" />2. Motif de la prescription</h2>
                        <label className="block text-sm font-medium">Symptômes ou motif (mots-clés)
                            <textarea rows={2} value={symptomes} onChange={e => setSymptomes(e.target.value)} placeholder="Ex. fièvre, frissons, maux de tête" className={`${inputClass} mt-1.5`} /></label>
                        {symptomes.trim() && (
                            <div className="mt-3">
                                {suggestions.length === 0 ? <p className="text-sm text-slate-500">Aucune fiche ne correspond à ces mots. Choisissez la maladie dans la liste ci-dessous.</p> : (
                                    <>
                                        <p className="mb-2 text-xs text-slate-500">Fiches qui contiennent ces mots (correspondance de mots-clés, ce n’est pas un diagnostic) :</p>
                                        <div className="flex flex-wrap gap-2">
                                            {suggestions.map(({ maladie: m, matched }) => (
                                                <button key={m.id} onClick={() => choisir(m.id)} aria-pressed={String(m.id) === maladieId}
                                                    className={`rounded-xl border-2 px-3 py-2 text-left text-sm transition ${String(m.id) === maladieId ? 'border-teal-600 bg-teal-50 dark:bg-teal-500/10' : 'border-slate-200 hover:border-teal-400 dark:border-gray-700'}`}>
                                                    <span className="block font-semibold">{m.nom}</span><span className="text-xs text-slate-500">{matched.length} mot{matched.length > 1 ? 's' : ''} commun{matched.length > 1 ? 's' : ''} : {matched.join(', ')}</span>
                                                </button>
                                            ))}
                                        </div>
                                    </>
                                )}
                            </div>
                        )}
                        <label className="mt-4 block text-sm font-medium">Ou choisir directement une fiche
                            <select value={maladieId} onChange={e => choisir(Number(e.target.value))} className={`${inputClass} mt-1.5`}>
                                <option value="">— Sélectionner une maladie —</option>
                                {maladies.map(m => <option key={m.id} value={m.id}>{m.nom}{m.traitements?.length ? ` (${m.traitements.length} traitement${m.traitements.length > 1 ? 's' : ''})` : ' (sans traitement)'}</option>)}
                            </select></label>
                        {maladie?.description && <p className="mt-3 text-sm text-slate-600 dark:text-gray-300">{maladie.description}</p>}
                    </section>

                    {/* 3. Médicaments */}
                    <section className={`${card} p-5`}>
                        <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
                            <h2 className="flex items-center gap-2 font-semibold"><ClipboardCheck size={18} className="text-teal-700" />3. Médicaments</h2>
                            <button onClick={() => setLignes(current => [...current, nouvelleLigne()])} className={btnSecondary}><Plus size={16} />Ajouter une ligne</button>
                        </div>
                        {lignes.length === 0 ? <p className="py-4 text-center text-sm text-slate-500">Choisissez une maladie pour pré-remplir l’ordonnance, ou ajoutez une ligne libre.</p> : (
                            <ul className="space-y-3">
                                {lignes.map(l => (
                                    <li key={l.id} className={`rounded-2xl border p-3 transition ${l.actif ? 'border-slate-200 dark:border-gray-700' : 'border-dashed border-slate-300 opacity-60 dark:border-gray-700'}`}>
                                        <div className="flex items-start gap-3">
                                            <Checkbox checked={l.actif} onCheckedChange={valeur => setLigne(l.id, { actif: valeur === true })} aria-label={`Inclure ${l.medicament || 'cette ligne'} dans l’ordonnance`} className="mt-3" />
                                            <div className="grid flex-1 gap-2 sm:grid-cols-6">
                                                <input value={l.medicament} onChange={e => setLigne(l.id, { medicament: e.target.value })} placeholder="Médicament" aria-label="Médicament" maxLength={150} className={`${inputClass} sm:col-span-6 font-medium`} />
                                                <input value={l.posologie} onChange={e => setLigne(l.id, { posologie: e.target.value })} placeholder="Posologie (ex. 1 cp matin et soir)" aria-label="Posologie" maxLength={200} className={`${inputClass} sm:col-span-4`} />
                                                <input value={l.duree} onChange={e => setLigne(l.id, { duree: e.target.value })} placeholder="Durée (ex. 5 jours)" aria-label="Durée" maxLength={100} className={`${inputClass} sm:col-span-2`} />
                                                <input value={l.remarques} onChange={e => setLigne(l.id, { remarques: e.target.value })} placeholder="Remarques (ex. à prendre pendant le repas)" aria-label="Remarques" maxLength={500} className={`${inputClass} sm:col-span-6`} />
                                            </div>
                                            <button onClick={() => setLignes(current => current.filter(x => x.id !== l.id))} aria-label="Supprimer cette ligne" className="mt-1.5 rounded-lg p-2 text-rose-700 hover:bg-rose-50 dark:text-rose-300 dark:hover:bg-rose-500/10"><Trash2 size={16} /></button>
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </section>
                </div>

                {/* Contrôles + aperçu */}
                <aside className="space-y-6 xl:sticky xl:top-24 xl:self-start">
                    <section className={`${card} p-5`} aria-live="polite">
                        <h2 className="mb-3 font-semibold">Contrôles automatiques</h2>
                        {alertes.length === 0 ? <p className="flex items-center gap-2 text-sm text-emerald-700 dark:text-emerald-300"><ClipboardCheck size={16} />Aucune alerte détectée (cela ne dispense pas de votre vérification).</p> : (
                            <ul className="space-y-1.5">
                                {alertes.map(a => {
                                    const { classe, couleurIcone, Icone, titre } = NIVEAUX[a.niveau];
                                    return <li key={a.message} className={`flex gap-2.5 border-l-2 py-1 pl-3 text-sm text-slate-700 dark:text-gray-200 ${classe}`}><Icone size={16} className={`mt-0.5 shrink-0 ${couleurIcone}`} aria-label={titre} /><span>{a.message}</span></li>;
                                })}
                            </ul>
                        )}
                    </section>

                    <section className={`${card} p-5`}>
                        <h2 className="mb-3 font-semibold">Aperçu de l’ordonnance</h2>
                        <div className="rounded-xl border border-slate-200 bg-white p-4 text-sm text-slate-800 dark:border-gray-700 dark:bg-gray-950 dark:text-gray-100">
                            <div className="flex justify-between text-xs text-slate-500"><span>{patient.nom || 'Nom du patient'}{patient.age ? `, ${patient.age} ans` : ''}</span><span>{formatDateFr(new Date().toLocaleDateString('en-CA'), { day: 'numeric', month: 'long', year: 'numeric' })}</span></div>
                            {diagnostic && <p className="mt-3 text-slate-600 dark:text-gray-300"><strong>Motif :</strong> {diagnostic}</p>}
                            {actives.filter(l => l.medicament.trim()).length === 0 ? <p className="mt-4 text-slate-400">Aucun médicament.</p> : (
                                <ol className="mt-3 list-decimal space-y-2 pl-5">
                                    {actives.filter(l => l.medicament.trim()).map(l => <li key={l.id}><strong>{l.medicament}</strong>{l.posologie && <div>{l.posologie}{l.duree ? ` — pendant ${l.duree}` : ''}</div>}{l.remarques && <div className="text-xs text-slate-500">{l.remarques}</div>}</li>)}
                                </ol>
                            )}
                            <p className="mt-6 border-t border-dashed border-slate-300 pt-2 text-right text-xs text-slate-400 dark:border-gray-700">{prescripteur ? `${prescripteur} — ` : ''}signature</p>
                        </div>
                        <div className="mt-4 grid gap-2">
                            <button onClick={imprimer} disabled={!patient.nom.trim() || !texte} className={btnPrimary}><Printer size={16} />Imprimer l’ordonnance</button>
                            <div className="grid grid-cols-2 gap-2">
                                <button onClick={copier} disabled={!texte} className={btnSecondary}><Copy size={16} />Copier</button>
                                <button onClick={enregistrer} disabled={!telephone || !texte || saving} title={telephone ? 'Enregistrer dans le dossier du patient' : 'Ouvrez cet assistant depuis un dossier patient pour enregistrer'} className={btnSecondary}>{saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}Dossier</button>
                            </div>
                            {telephone && dossier && rdvIdOptions(dossier).length > 0 && (
                                <label className="text-xs font-medium text-slate-500">Rattacher au rendez-vous
                                    <select value={rdvId} onChange={e => setRdvId(e.target.value)} className={`${inputClass} mt-1`}>
                                        <option value="">Aucun rendez-vous</option>
                                        {rdvIdOptions(dossier).map(r => <option key={r.id} value={r.id}>{formatDateFr(r.dateRdv)} à {hhmm(r.heureRdv)}</option>)}
                                    </select></label>
                            )}
                        </div>
                    </section>
                </aside>
            </div>
        </AdminLayout>
    );
}

const rdvIdOptions = dossier => dossier.rendezVous.filter(r => r.statut !== 'ANNULE');
