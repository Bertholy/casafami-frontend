import { useEffect, useState } from 'react';
import { Bot, Calendar, Check, Clock, Loader2, Phone, Sunrise, Sunset, User, X } from 'lucide-react';
import MotifAssistant from '../MotifAssistant';
import { useAvailableSlots } from '../../hooks/useAvailableSlots';
import { formatPhone, formatPhoneInput, isPlausiblePhone } from '../../utils/phone';
import axiosClient from '../../api/axiosClient';
import AutreDate from '../AutreDate';
import VoyantPatient from '../VoyantPatient';
import { Button } from '../ui/button';
import { Input, Label, Textarea, champClasses } from '../ui/input';
import { ajouterJours, formaterJour } from '../../utils/jours';
import { apiErrorMessage } from '../../utils/auth';
import { STATUS, hhmm, todayISO } from '../../constants/app';
import ChoixSexe, { SelectCivilite } from './ChoixSexe';
import { civiliteDetaillee } from '../../utils/civilite';

const EMPTY_FORM = { nomClient: '', ageClient: '', sexe: '', telephoneClient: '', motif: '', dateRdv: '', heureRdv: '', serviceId: '', praticienId: '' };

function initialForm(modal) {
    const rdv = modal.rdv;
    if (modal.type !== 'edit' || !rdv) return { ...EMPTY_FORM, dateRdv: modal.date || '' };
    return {
        nomClient: rdv.nomClient, ageClient: String(rdv.ageClient ?? ''), sexe: rdv.sexe || '', telephoneClient: formatPhone(rdv.telephoneClient), motif: rdv.motif || '',
        dateRdv: rdv.dateRdv, heureRdv: hhmm(rdv.heureRdv), serviceId: rdv.serviceId ? String(rdv.serviceId) : '',
        praticienId: rdv.praticienId ? String(rdv.praticienId) : '',
    };
}

/** Fenêtre de création / modification / consultation d'un rendez-vous. */
export default function RdvFormModal({ modal, options, canAssign = false, onClose, onSaved }) {
    const [form, setForm] = useState(() => initialForm(modal));
    const [error, setError] = useState('');
    const [saving, setSaving] = useState(false);
    const [assistant, setAssistant] = useState(false);
    const [autreDate, setAutreDate] = useState(false);   // « Une autre date ? » : les cases jour / mois / année remplacent les jours en cartes
    const editing = modal.type === 'edit';
    const currentSlot = editing ? hhmm(modal.rdv.heureRdv) : '';
    const originalDate = editing ? modal.rdv.dateRdv : '';

    const { slots: freeSlots, loading: slotsLoading, error: slotsError, refresh: refreshSlots } = useAvailableSlots(form.dateRdv, form.praticienId);
    // Créneaux encore libres ce jour-là ; en modification, le créneau actuel du rendez-vous reste choisissable tant que la date n'a pas changé.
    const keepCurrent = editing && form.dateRdv === originalDate && currentSlot && !freeSlots.includes(currentSlot) && (!form.praticienId || String(modal.rdv.praticienId || '') === String(form.praticienId));
    const slots = keepCurrent ? [...freeSlots, currentSlot].sort() : freeSlots;
    const heureChoisie = slots.includes(form.heureRdv) ? form.heureRdv : '';

    const set = (key, value) => setForm(previous => ({ ...previous, [key]: key === 'telephoneClient' ? formatPhoneInput(value) : value, ...(key === 'dateRdv' || key === 'praticienId' ? { heureRdv: '' } : {}) }));
    const applyMotif = ({ motif, serviceId }) => {
        setForm(previous => ({ ...previous, motif, serviceId: serviceId && !previous.serviceId ? String(serviceId) : previous.serviceId }));
        setAssistant(false);
    };

    const submit = async event => {
        event.preventDefault(); setError('');
        if (!heureChoisie) { setError(form.heureRdv ? 'Ce créneau n’est plus disponible : choisissez-en un autre parmi ceux qui restent.' : 'Choisissez un créneau horaire.'); return; }
        setSaving(true);
        try {
            const payload = {
                ...form,
                nomClient: form.nomClient.trim(),
                ageClient: Number(form.ageClient),
                heureRdv: `${heureChoisie}:00`,
                serviceId: form.serviceId ? Number(form.serviceId) : null,
                praticienId: form.praticienId ? Number(form.praticienId) : null,
            };
            const { data } = editing
                ? await axiosClient.put(`/rdv/${modal.rdv.id}`, payload)
                : await axiosClient.post('/rdv', payload);
            await onSaved(data, editing);
        } catch (err) {
            if (err.response?.status === 409) {
                // Créneau pris entre-temps : on le retire de la liste et on réaffiche ce qui reste libre.
                setForm(previous => ({ ...previous, heureRdv: '' }));
                refreshSlots();
                setError(apiErrorMessage(err, 'Ce créneau vient d’être pris.') + ' Les créneaux encore disponibles sont affichés : choisissez-en un autre.');
            } else setError(apiErrorMessage(err, 'Impossible d’enregistrer le rendez-vous. Réessayez.'));
        } finally { setSaving(false); }
    };

    if (modal.type === 'view') {
        const rdv = modal.rdv;
        const status = STATUS[rdv.statut];
        const rows = [
            ['Patient', rdv.nomClient], ['Civilité', civiliteDetaillee(rdv.ageClient, rdv.sexe) || 'Non précisée'], ['Téléphone', formatPhone(rdv.telephoneClient)], ['Âge', `${rdv.ageClient} an${rdv.ageClient > 1 ? 's' : ''}`],
            ['Date', rdv.dateRdv], ['Heure', hhmm(rdv.heureRdv)], ['Statut', status?.label || rdv.statut],
            [rdv.servicesNoms?.length > 1 ? 'Services' : 'Service', rdv.servicesNoms?.length ? rdv.servicesNoms.join(', ') : (rdv.serviceNom || 'Non précisé')], ['Praticien', rdv.praticienNom || 'Non attribué'],
            ...(rdv.urgence ? [['Urgence', 'Oui']] : []),
            ...(rdv.accompagnantNom ? [['Accompagnant', `${[rdv.accompagnantCivilite, rdv.accompagnantNom].filter(Boolean).join(' ')}${rdv.accompagnantLien ? ` (${rdv.accompagnantLien})` : ''}${rdv.accompagnantTelephone ? ` · ${formatPhone(rdv.accompagnantTelephone)}` : ''}`]] : []),
            ['N° du rendez-vous', rdv.id], ['Créé le', rdv.dateCreation ? new Date(rdv.dateCreation).toLocaleString('fr-FR') : '—'],
        ];
        return (
            <ModalShell title="Détails du rendez-vous" onClose={onClose}>
                <div className="grid grid-cols-2 gap-4 p-5 text-sm">
                    {rows.map(([label, value]) => <div key={label}><div className="text-xs text-slate-500">{label}</div><div className="mt-1 font-medium">{value}</div></div>)}
                    <div className="col-span-2"><div className="text-xs text-slate-500">Motif</div><div className="mt-1 whitespace-pre-wrap font-medium">{rdv.motif || 'Non précisé'}</div></div>
                </div>
            </ModalShell>
        );
    }

    // Présentation reprise de la page de réservation du site (étapes, sections à pastille, jours en cartes, créneaux du matin et de l'après-midi) ; les champs et les règles restent les mêmes.
    const aujourdhui = todayISO();
    const jours = [0, 1, 2, 3, 4, 5].map(n => ajouterJours(aujourdhui, n));
    const matin = slots.filter(h => h < '12:00');
    const apresMidi = slots.filter(h => h >= '12:00');
    const infosValides = form.nomClient.trim().length >= 2 && form.ageClient !== '' && isPlausiblePhone(form.telephoneClient);
    const etapes = [
        { label: 'Patient', fait: infosValides },
        { label: 'Date', fait: Boolean(form.dateRdv) },
        { label: 'Heure', fait: Boolean(heureChoisie) },
    ];
    const etapeCourante = etapes.findIndex(etape => !etape.fait);
    const choisirJour = iso => { setAutreDate(false); set('dateRdv', iso); };

    return (
        <ModalShell title={editing ? 'Modifier le rendez-vous' : 'Nouveau rendez-vous'} onClose={onClose} large>
            <form onSubmit={submit}>
                <ol className="mx-auto flex max-w-md items-start px-5 pb-1 pt-5" aria-label="Étapes du rendez-vous">
                    {etapes.map((etape, i) => (
                        <li key={etape.label} className="relative flex flex-1 flex-col items-center text-center" aria-current={i === etapeCourante ? 'step' : undefined}>
                            {i > 0 && <span aria-hidden="true" className={`absolute right-1/2 top-4 h-0.5 w-full -translate-y-1/2 transition-colors ${etapes[i - 1].fait ? 'bg-teal-600' : 'bg-gray-200 dark:bg-gray-700'}`} />}
                            <span className={`relative z-10 flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold transition ${
                                etape.fait ? 'bg-teal-600 text-white' : i === etapeCourante ? 'bg-white text-teal-700 ring-2 ring-teal-600 dark:bg-gray-900 dark:text-teal-300' : 'bg-gray-200 text-gray-500 dark:bg-gray-700 dark:text-gray-400'}`}>
                                {etape.fait ? <Check className="h-4 w-4" /> : i + 1}
                            </span>
                            <span className={`mt-1.5 text-xs font-medium ${etape.fait || i === etapeCourante ? 'text-teal-700 dark:text-teal-400' : 'text-gray-500'}`}>{etape.label}</span>
                        </li>
                    ))}
                </ol>

                {/* ========== SECTION 1 : LE PATIENT ========== */}
                <Section icone={User} titre="Informations du patient" aide="Nom, âge, téléphone, service et motif de la visite">
                    <div className="space-y-4">
                        <div className="flex flex-col gap-4 sm:flex-row">
                            <div className="sm:w-36">
                                <span className="mb-2 block text-sm font-medium leading-none">Civilité</span>
                                <SelectCivilite sexe={form.sexe} onChange={valeur => set('sexe', valeur)} className={`${champClasses} h-11`} />
                            </div>
                            <div className="min-w-0 flex-1">
                                <Label htmlFor="rdv-nom" className="mb-2 block">Nom complet *</Label>
                                <Input id="rdv-nom" required minLength={2} maxLength={100} autoComplete="off" value={form.nomClient} onChange={e => set('nomClient', e.target.value)} placeholder="Ex : Rasoa Hanta" />
                                {!editing && <VoyantPatient className="mt-2" nom={form.nomClient} telephone={form.telephoneClient}
                                    onChoisir={patient => setForm(previous => ({ ...previous, nomClient: patient.nom, telephoneClient: formatPhone(patient.telephone) }))} />}
                            </div>
                        </div>
                        <div className="grid gap-4 sm:grid-cols-2">
                            <div>
                                <Label htmlFor="rdv-age" className="mb-2 block">Âge *</Label>
                                <Input id="rdv-age" required type="number" inputMode="numeric" min={0} max={120} value={form.ageClient} onChange={e => set('ageClient', e.target.value)} placeholder="30" />
                            </div>
                            <div>
                                <Label htmlFor="rdv-tel" className="mb-2 block">Téléphone *</Label>
                                <div className="relative">
                                    <Phone className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" aria-hidden="true" />
                                    <Input id="rdv-tel" required type="tel" inputMode="tel" autoComplete="off" maxLength={20} placeholder="034 12 345 67" value={form.telephoneClient} onChange={e => set('telephoneClient', e.target.value)} className="pl-10" />
                                </div>
                            </div>
                        </div>
                        <div className={`grid gap-4 ${canAssign ? 'sm:grid-cols-2' : ''}`}>
                            <div>
                                <Label htmlFor="rdv-service" className="mb-2 block">Service</Label>
                                <select id="rdv-service" value={form.serviceId} onChange={e => set('serviceId', e.target.value)} className={`${champClasses} h-11`}>
                                    <option value="">Non précisé</option>
                                    {(options.services || []).map(service => <option key={service.id} value={service.id}>{service.nom}</option>)}
                                </select>
                            </div>
                            {canAssign && (
                                <div>
                                    <Label htmlFor="rdv-praticien" className="mb-2 block">Praticien</Label>
                                    <select id="rdv-praticien" value={form.praticienId} onChange={e => set('praticienId', e.target.value)} className={`${champClasses} h-11`}>
                                        <option value="">Non attribué</option>
                                        {(options.praticiens || []).map(p => <option key={p.id} value={p.id}>{p.nom}</option>)}
                                    </select>
                                </div>
                            )}
                        </div>
                        <div>
                            <div className="mb-2 flex items-center justify-between gap-2">
                                <Label htmlFor="rdv-motif">Motif</Label>
                                <button type="button" onClick={() => setAssistant(true)} className="inline-flex items-center gap-1.5 rounded-md bg-teal-50 px-3 py-1.5 text-xs font-semibold text-teal-800 transition hover:bg-teal-100 dark:bg-teal-500/15 dark:text-teal-200 dark:hover:bg-teal-500/25"><Bot size={14} aria-hidden="true" />Assistant de motif</button>
                            </div>
                            <Textarea id="rdv-motif" maxLength={2000} rows={3} value={form.motif} onChange={e => set('motif', e.target.value)} placeholder="La raison de la visite : suivi de grossesse, consultation, échographie…" />
                            <p className="mt-1 text-right text-xs text-gray-500">{form.motif.length}/2000</p>
                        </div>
                        <ChoixSexe sexe={form.sexe} age={form.ageClient} onChange={valeur => set('sexe', valeur)} />
                    </div>
                </Section>

                {/* ========== SECTION 2 : LA DATE ========== */}
                <Section icone={Calendar} titre="Choisissez une date" aide={form.dateRdv ? formaterJour(form.dateRdv, 'fr', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }) : 'Aujourd’hui et les jours suivants, ou une autre date'}>
                    <div className="mb-4 grid grid-cols-3 gap-2 sm:grid-cols-6">
                        {jours.map((iso, i) => {
                            const choisi = form.dateRdv === iso;
                            return (
                                <button key={iso} type="button" aria-pressed={choisi} onClick={() => choisirJour(iso)}
                                    className={`rounded-md border px-2 py-2.5 text-center transition-colors ${choisi ? 'border-primary bg-primary text-primary-foreground' : 'border-input bg-background text-foreground hover:bg-accent'}`}>
                                    <span className="block text-[11px] font-semibold uppercase tracking-wide opacity-80">{i === 0 ? 'Aujourd’hui' : i === 1 ? 'Demain' : formaterJour(iso, 'fr', { weekday: 'short' })}</span>
                                    <span className="block text-xl font-bold leading-tight">{formaterJour(iso, 'fr', { day: 'numeric' })}</span>
                                    <span className="block text-xs opacity-80">{formaterJour(iso, 'fr', { month: 'short' })}</span>
                                </button>
                            );
                        })}
                    </div>
                    <AutreDate ouvert={autreDate || (Boolean(form.dateRdv) && !jours.includes(form.dateRdv))} onBascule={setAutreDate} valeur={form.dateRdv} min={editing ? '1900-01-01' : aujourdhui}
                        onChange={iso => set('dateRdv', iso)} prefixe="rdv-staff" />
                </Section>

                {/* ========== SECTION 3 : LE CRÉNEAU ========== */}
                {form.dateRdv && (
                    <Section icone={Clock} titre="Choisissez un créneau"
                        aide={slotsLoading || slotsError ? 'Créneaux encore libres ce jour-là' : slots.length > 0 ? `${slots.length} créneau${slots.length > 1 ? 'x' : ''} disponible${slots.length > 1 ? 's' : ''} ce jour-là` : 'Aucun créneau libre ce jour-là'}>
                        {slotsLoading ? (
                            <div className="py-6 text-center">
                                <Loader2 className="mx-auto mb-2 h-8 w-8 animate-spin text-teal-600" />
                                <p className="text-sm text-gray-500 dark:text-gray-400">Chargement des créneaux…</p>
                            </div>
                        ) : slotsError ? (
                            <div className="border-l-2 border-red-500 py-1 pl-3"><p className="text-sm text-red-700 dark:text-red-300">Impossible de charger les créneaux. <button type="button" onClick={refreshSlots} className="font-semibold underline">Réessayer</button></p></div>
                        ) : slots.length === 0 ? (
                            <div className="border-l-2 border-amber-500 py-1 pl-3"><p className="text-sm text-orange-700 dark:text-orange-300">Aucun créneau disponible ce jour-là (cabinet fermé ou tout est réservé). Choisissez une autre date.</p></div>
                        ) : (
                            <div className="space-y-5">
                                {[{ cle: 'matin', titre: 'Matin', Icone: Sunrise, liste: matin }, { cle: 'apres-midi', titre: 'Après-midi', Icone: Sunset, liste: apresMidi }].filter(groupe => groupe.liste.length > 0).map(({ cle, titre, Icone, liste }) => (
                                    <div key={cle}>
                                        <p className="mb-2 flex items-center gap-2 text-sm font-semibold text-gray-600 dark:text-gray-400"><Icone className="h-4 w-4 text-teal-600" aria-hidden="true" />{titre}</p>
                                        <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-6">
                                            {liste.map(h => (
                                                <button key={h} type="button" aria-pressed={heureChoisie === h} onClick={() => set('heureRdv', h)}
                                                    className={`h-11 rounded-md border text-sm font-medium transition-colors ${heureChoisie === h ? 'border-primary bg-primary text-primary-foreground' : 'border-input bg-background text-foreground hover:bg-accent'}`}>{h}</button>
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </Section>
                )}

                {/* ========== ENREGISTRER ========== */}
                <div className="space-y-3 bg-gray-50 p-5 dark:bg-gray-800/50 md:px-8">
                    {error && <p role="alert" className="rounded-xl bg-rose-50 px-3 py-2 text-sm text-rose-700 dark:bg-rose-500/10 dark:text-rose-300">{error}</p>}
                    <p aria-live="polite" className={`text-center text-sm ${heureChoisie ? 'font-medium text-teal-700 dark:text-teal-300' : 'text-gray-500 dark:text-gray-400'}`}>
                        {heureChoisie ? `Rendez-vous le ${formaterJour(form.dateRdv, 'fr', { weekday: 'long', day: 'numeric', month: 'long' })} à ${heureChoisie}`
                            : form.dateRdv ? 'Choisissez un créneau pour continuer.' : 'Choisissez une date et un créneau pour continuer.'}
                    </p>
                    <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                        <Button type="button" variant="outline" size="lg" onClick={onClose}>Annuler</Button>
                        <Button type="submit" size="lg" disabled={saving}>
                            {saving ? <Loader2 className="h-5 w-5 animate-spin" /> : <Calendar className="h-5 w-5" />}{saving ? 'Enregistrement…' : 'Enregistrer'}
                        </Button>
                    </div>
                </div>
            </form>
            {assistant && <MotifAssistant services={options.services || []} onApply={applyMotif} onClose={() => setAssistant(false)} />}
        </ModalShell>
    );
}

/** Une section du formulaire : une pastille avec son icône, un titre et une ligne d'aide (comme sur la page de réservation du site). */
function Section({ icone: Icone, titre, aide, children }) {
    return (
        <div className="border-b border-border p-5 md:p-8">
            <div className="mb-5 flex items-center gap-3">
                <div className="flex size-11 shrink-0 items-center justify-center rounded-md bg-primary text-primary-foreground"><Icone className="size-5" aria-hidden="true" /></div>
                <div className="min-w-0">
                    <h3 className="text-lg font-bold text-gray-800 dark:text-white">{titre}</h3>
                    {aide && <p className="text-sm first-letter:uppercase text-gray-500 dark:text-gray-400">{aide}</p>}
                </div>
            </div>
            {children}
        </div>
    );
}

export function ModalShell({ title, onClose, children, large = false }) {
    useEffect(() => {
        const onKey = event => { if (event.key === 'Escape') onClose(); };
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, [onClose]);
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4 backdrop-blur-sm" onMouseDown={e => { if (e.target === e.currentTarget) onClose(); }}>
            <section role="dialog" aria-modal="true" aria-label={title} className={`max-h-[92vh] w-full ${large ? 'max-w-3xl' : 'max-w-2xl'} overflow-y-auto rounded-2xl bg-white shadow-2xl dark:bg-gray-900`}>
                <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4 dark:border-gray-800">
                    <h2 className="font-semibold">{title}</h2>
                    <button onClick={onClose} aria-label="Fermer" className="rounded-lg p-1 hover:bg-slate-100 dark:hover:bg-gray-800"><X size={20} /></button>
                </div>
                {children}
            </section>
        </div>
    );
}
