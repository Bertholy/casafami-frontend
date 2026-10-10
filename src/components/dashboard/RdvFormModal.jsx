import { useEffect, useState } from 'react';
import { Bot, Loader2, X } from 'lucide-react';
import MotifAssistant from '../MotifAssistant';
import { useAvailableSlots } from '../../hooks/useAvailableSlots';
import { formatPhone, formatPhoneInput } from '../../utils/phone';
import axiosClient from '../../api/axiosClient';
import SlotPicker from '../SlotPicker';
import { apiErrorMessage } from '../../utils/auth';
import { STATUS, hhmm, todayISO } from '../../constants/app';

const EMPTY_FORM = { nomClient: '', ageClient: '', telephoneClient: '', motif: '', dateRdv: '', heureRdv: '', serviceId: '', praticienId: '' };
const inputClass = 'mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-normal outline-none transition focus:border-teal-600 focus:ring-2 focus:ring-teal-600/20 dark:border-gray-700 dark:bg-gray-950';

function initialForm(modal) {
    const rdv = modal.rdv;
    if (modal.type !== 'edit' || !rdv) return { ...EMPTY_FORM, dateRdv: modal.date || '' };
    return {
        nomClient: rdv.nomClient, ageClient: String(rdv.ageClient ?? ''), telephoneClient: formatPhone(rdv.telephoneClient), motif: rdv.motif || '',
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
            ['Patient', rdv.nomClient], ['Téléphone', formatPhone(rdv.telephoneClient)], ['Âge', `${rdv.ageClient} an${rdv.ageClient > 1 ? 's' : ''}`],
            ['Date', rdv.dateRdv], ['Heure', hhmm(rdv.heureRdv)], ['Statut', status?.label || rdv.statut],
            ['Service', rdv.serviceNom || 'Non précisé'], ['Praticien', rdv.praticienNom || 'Non attribué'],
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

    return (
        <ModalShell title={editing ? 'Modifier le rendez-vous' : 'Nouveau rendez-vous'} onClose={onClose}>
            <form onSubmit={submit} className="space-y-4 p-5">
                <div className="grid gap-4 sm:grid-cols-2">
                    <label className="text-sm font-medium">Nom du patient *
                        <input required minLength={2} maxLength={100} value={form.nomClient} onChange={e => set('nomClient', e.target.value)} className={inputClass} /></label>
                    <label className="text-sm font-medium">Téléphone *
                        <input required type="tel" inputMode="tel" maxLength={20} placeholder="034 12 345 67" value={form.telephoneClient} onChange={e => set('telephoneClient', e.target.value)} className={inputClass} /></label>
                    <label className="text-sm font-medium">Âge *
                        <input required type="number" min={0} max={120} value={form.ageClient} onChange={e => set('ageClient', e.target.value)} className={inputClass} /></label>
                    <label className="text-sm font-medium">Date *
                        <input required type="date" min={editing ? undefined : todayISO()} value={form.dateRdv} onChange={e => set('dateRdv', e.target.value)} className={inputClass} /></label>
                    <label className="text-sm font-medium">Service
                        <select value={form.serviceId} onChange={e => set('serviceId', e.target.value)} className={inputClass}>
                            <option value="">Non précisé</option>
                            {(options.services || []).map(service => <option key={service.id} value={service.id}>{service.nom}</option>)}
                        </select></label>
                    {canAssign && <label className="text-sm font-medium">Praticien
                        <select value={form.praticienId} onChange={e => set('praticienId', e.target.value)} className={inputClass}>
                            <option value="">Non attribué</option>
                            {(options.praticiens || []).map(p => <option key={p.id} value={p.id}>{p.nom}</option>)}
                        </select></label>}
                </div>

                <div>
                    <div className="text-sm font-medium">Créneau *</div>
                    <div className="mt-2">
                        {!form.dateRdv ? <p className="rounded-xl bg-slate-50 p-3 text-center text-sm text-slate-500 dark:bg-gray-800">Choisissez d’abord une date.</p>
                            : slotsError ? <p className="rounded-xl bg-rose-50 p-3 text-center text-sm text-rose-700 dark:bg-rose-500/10 dark:text-rose-300">Impossible de charger les créneaux. <button type="button" onClick={refreshSlots} className="font-semibold underline">Réessayer</button></p>
                                : slotsLoading ? <p className="flex items-center justify-center gap-2 p-3 text-sm text-slate-500"><Loader2 size={16} className="animate-spin" />Chargement des créneaux…</p>
                                : <SlotPicker slots={slots} selected={heureChoisie} onSelect={hour => set('heureRdv', hour)} />}
                    </div>
                </div>

                <div>
                    <div className="flex items-center justify-between gap-2">
                        <label htmlFor="rdv-motif" className="text-sm font-medium">Motif</label>
                        <button type="button" onClick={() => setAssistant(true)} className="inline-flex items-center gap-1.5 rounded-lg bg-teal-50 px-3 py-1.5 text-xs font-semibold text-teal-800 transition hover:bg-teal-100 dark:bg-teal-500/15 dark:text-teal-300"><Bot size={14} />Assistant de motif</button>
                    </div>
                    <textarea id="rdv-motif" maxLength={2000} rows={3} value={form.motif} onChange={e => set('motif', e.target.value)} className={inputClass} />
                </div>

                {error && <p role="alert" className="rounded-xl bg-rose-50 px-3 py-2 text-sm text-rose-700 dark:bg-rose-500/10 dark:text-rose-300">{error}</p>}
                <div className="flex justify-end gap-2">
                    <button type="button" onClick={onClose} className="rounded-xl border border-slate-200 px-4 py-2 text-sm hover:bg-slate-50 dark:border-gray-700 dark:hover:bg-gray-800">Annuler</button>
                    <button disabled={saving} className="inline-flex items-center gap-2 rounded-xl bg-teal-700 px-5 py-2 text-sm font-semibold text-white transition hover:bg-teal-800 disabled:opacity-50">
                        {saving && <Loader2 size={15} className="animate-spin" />}{saving ? 'Enregistrement…' : 'Enregistrer'}
                    </button>
                </div>
            </form>
            {assistant && <MotifAssistant services={options.services || []} onApply={applyMotif} onClose={() => setAssistant(false)} />}
        </ModalShell>
    );
}

function ModalShell({ title, onClose, children }) {
    useEffect(() => {
        const onKey = event => { if (event.key === 'Escape') onClose(); };
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, [onClose]);
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4 backdrop-blur-sm" onMouseDown={e => { if (e.target === e.currentTarget) onClose(); }}>
            <section role="dialog" aria-modal="true" aria-label={title} className="max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white shadow-2xl dark:bg-gray-900">
                <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4 dark:border-gray-800">
                    <h2 className="font-semibold">{title}</h2>
                    <button onClick={onClose} aria-label="Fermer" className="rounded-lg p-1 hover:bg-slate-100 dark:hover:bg-gray-800"><X size={20} /></button>
                </div>
                {children}
            </section>
        </div>
    );
}
