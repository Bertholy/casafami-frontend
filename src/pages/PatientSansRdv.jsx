import { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AlertTriangle, Check, CheckCircle, Clock3, FileText, Loader2, RotateCw, UserRoundCheck, Users } from 'lucide-react';
import axiosClient from '../api/axiosClient';
import AdminLayout from '../components/AdminLayout';
import Notice from '../components/Notice';
import ChoixSexe, { SelectCivilite } from '../components/dashboard/ChoixSexe';
import GardeDuJour from '../components/dashboard/GardeDuJour';
import VoyantPatient from '../components/VoyantPatient';
import ProformaPanel from '../components/dashboard/ProformaPanel';
import { todayISO, formatDateFr, hhmm } from '../constants/app';
import { btnPrimary, btnSecondary, card, inputClass } from '../constants/ui';
import { apiErrorMessage, getRole, hasSession, homeForRole, LOGIN_PATH, peut } from '../utils/auth';
import { SEXES, civiliteSelonAge, nomAvecCivilite } from '../utils/civilite';
import { formatPhone, formatPhoneInput } from '../utils/phone';

const ROLES = { MEDECIN: 'Médecin', SAGE_FEMME: 'Sage-femme', INFIRMIERE: 'Infirmier(ère)' };
const LIENS = ['Parent', 'Conjoint(e)', 'Enfant', 'Frère / sœur', 'Ami(e)', 'Voisin(e)', 'Autre'];
const VIDE = { nomClient: '', ageClient: '', sexe: '', telephoneClient: '', motif: '', serviceIds: [], urgence: false, accompagnantNom: '', accompagnantTelephone: '', accompagnantLien: '', accompagnantSexe: '', proforma: false };

/**
 * Patient venu au cabinet sans rendez-vous (page du secrétariat, comme le calendrier) : on voit tout de suite qui est libre en ce moment ; si quelqu'un l'est,
 * on remplit le formulaire et le patient part en consultation immédiate, sans réservation ni double confirmation. En cas d'urgence, la personne qui
 * accompagne le patient peut remplir le formulaire à sa place (ses coordonnées sont alors enregistrées). Une facture proforma est proposée si le patient la souhaite.
 * La liste des personnes libres se remet à jour toute seule toutes les 15 secondes.
 */
export default function PatientSansRdv() {
    const navigate = useNavigate();
    const role = getRole();
    const home = homeForRole(role);
    const autorise = peut('RDV_SANS_RDV');
    const [libres, setLibres] = useState({ chargement: true, erreur: '', heure: '', ouvert: true, praticiens: [] });
    const [options, setOptions] = useState({ services: [] });
    const [form, setForm] = useState(VIDE);
    const [praticienId, setPraticienId] = useState('');
    const [erreur, setErreur] = useState('');
    const [envoi, setEnvoi] = useState(false);
    const [recu, setRecu] = useState(null);                 // patient qui vient d'être reçu (réponse du serveur)
    const [aujourdhui, setAujourdhui] = useState([]);       // patients reçus aujourd'hui sans rendez-vous
    const [factureOuverte, setFactureOuverte] = useState(null);   // identifiant du rendez-vous dont on établit la proforma

    const chargerLibres = useCallback(async () => {
        try {
            const { data } = await axiosClient.get('/rdv/sans-rendez-vous/libres');
            setLibres({ chargement: false, erreur: '', heure: data.heure, ouvert: data.ouvert, praticiens: data.praticiens || [] });
        } catch (err) {
            setLibres(precedent => ({ ...precedent, chargement: false, erreur: apiErrorMessage(err, 'Impossible de savoir qui est libre pour le moment. Réessayez.') }));
        }
    }, []);
    const chargerJour = useCallback(async () => {
        try {
            const { data } = await axiosClient.get('/rendez-vous/dashboard', { params: { periode: 'aujourd_hui' } });
            setAujourdhui((data.rendezVous || []).filter(rdv => rdv.sansRendezVous));
        } catch { /* la liste du jour est un confort : la page fonctionne sans */ }
    }, []);

    useEffect(() => {
        if (!hasSession()) { navigate(LOGIN_PATH); return undefined; }
        const premier = window.setTimeout(() => { chargerLibres(); chargerJour(); axiosClient.get('/rdv/form-options').then(({ data }) => setOptions(data)).catch(() => {}); }, 0);
        const intervalle = window.setInterval(chargerLibres, 15000);
        return () => { window.clearTimeout(premier); window.clearInterval(intervalle); };
    }, [chargerLibres, chargerJour, navigate]);

    const personnelLibre = libres.praticiens.filter(p => p.libre);
    // la personne choisie reste choisie tant qu'elle est libre ; sinon la première personne libre
    const choisi = personnelLibre.some(p => String(p.id) === String(praticienId)) ? praticienId : (personnelLibre[0] ? String(personnelLibre[0].id) : '');
    const set = (cle, valeur) => setForm(precedent => ({ ...precedent, [cle]: cle === 'telephoneClient' || cle === 'accompagnantTelephone' ? formatPhoneInput(valeur) : valeur }));

    // Un enfant (moins de 18 ans) n'a pas de téléphone : son parent ou responsable est le contact (nom et numéro obligatoires).
    const enfant = form.ageClient !== '' && Number(form.ageClient) < 18;
    const accompagnant = form.urgence || enfant;
    const lienAccompagnant = form.accompagnantLien || (enfant ? 'Parent' : '');

    const envoyer = async evenement => {
        evenement.preventDefault(); setErreur('');
        if (!choisi) { setErreur('Aucune personne libre à qui confier ce patient.'); return; }
        if (!form.sexe) { setErreur('Indiquez si le patient est un homme ou une femme.'); return; }
        if (enfant) {
            if (!form.accompagnantNom.trim()) { setErreur('Indiquez le nom du parent ou du responsable de l’enfant.'); return; }
            if (!form.accompagnantTelephone) { setErreur('Un enfant n’a pas de téléphone : indiquez celui de son parent ou de son responsable.'); return; }
        } else if (!form.telephoneClient && !(form.urgence && form.accompagnantTelephone)) { setErreur(form.urgence ? 'Indiquez le téléphone du patient ou celui de la personne qui l’accompagne.' : 'Indiquez le téléphone du patient.'); return; }
        setEnvoi(true);
        try {
            const { data } = await axiosClient.post('/rdv/sans-rendez-vous', {
                nomClient: form.nomClient.trim(), ageClient: Number(form.ageClient), sexe: form.sexe, telephoneClient: enfant ? '' : form.telephoneClient, motif: form.motif,
                serviceId: form.serviceIds.length ? Number(form.serviceIds[0]) : null, serviceIds: form.serviceIds.map(Number), praticienId: Number(choisi),
                urgence: form.urgence, accompagnantNom: accompagnant ? form.accompagnantNom.trim() : '', accompagnantTelephone: accompagnant ? form.accompagnantTelephone : '', accompagnantLien: accompagnant ? lienAccompagnant : '', accompagnantSexe: accompagnant ? form.accompagnantSexe : '',
            });
            setRecu({ rdv: data, praticienNom: libres.praticiens.find(p => String(p.id) === String(choisi))?.nom || data.praticienNom });
            setFactureOuverte(form.proforma ? data.id : null);
            chargerLibres(); chargerJour();
            window.scrollTo({ top: 0, behavior: 'smooth' });
        } catch (err) {
            if (err.response?.status === 409) { chargerLibres(); setErreur(`${apiErrorMessage(err, 'Cette personne vient d’être prise.')} La liste a été mise à jour.`); }
            else setErreur(apiErrorMessage(err, 'Impossible d’enregistrer ce patient. Réessayez.'));
        } finally { setEnvoi(false); }
    };

    const nouveauPatient = () => { setRecu(null); setForm(VIDE); setErreur(''); setFactureOuverte(null); chargerLibres(); };

    if (!autorise) {
        return (
            <AdminLayout title="Patient sans rendez-vous" subtitle="Accueil d’un patient venu sans rendez-vous">
                <Notice tone="error">Vous n’avez pas le droit d’utiliser cette page. <Link to={home} className="font-semibold underline">Retour à l’accueil</Link></Notice>
            </AdminLayout>
        );
    }

    // Récapitulatif qui se remplit en direct à côté du formulaire (sous le formulaire, en bandeau, quand l'urgence affiche deux formulaires)
    const servicesChoisis = form.serviceIds.map(id => (options.services || []).find(s => String(s.id) === String(id))).filter(Boolean);
    const basculerService = id => setForm(precedent => ({ ...precedent, serviceIds: precedent.serviceIds.includes(id) ? precedent.serviceIds.filter(x => x !== id) : [...precedent.serviceIds, id] }));
    const nomPatient = form.nomClient.trim();
    const nomAccompagnant = form.accompagnantNom.trim();
    const libelleSexe = valeur => SEXES.find(s => s.valeur === valeur)?.libelle || '';
    const lignesPatient = [
        ['Patient', nomPatient ? nomAvecCivilite(nomPatient, form.ageClient, form.sexe) : ''],
        ['Civilité', civiliteSelonAge(form.ageClient, form.sexe)],
        ['Âge', form.ageClient === '' ? '' : `${form.ageClient} an${Number(form.ageClient) > 1 ? 's' : ''}`],
        ['Sexe', libelleSexe(form.sexe)],
        ['Téléphone', enfant ? 'Aucun (enfant)' : form.telephoneClient],
    ];
    const lignesVisite = [
        [servicesChoisis.length > 1 ? 'Services' : 'Service', servicesChoisis.length ? servicesChoisis.map(s => s.nom).join(', ') : 'Non précisé'],
        ['Motif', form.motif.trim()],
        ['Date', formatDateFr(todayISO(), { weekday: 'long', day: 'numeric', month: 'long' })],
        ...(form.urgence ? [['Urgence', 'Oui']] : []),
    ];
    const lignesAccompagnant = [
        ['Nom', nomAccompagnant ? [form.accompagnantSexe === 'FEMME' ? 'Mme' : form.accompagnantSexe === 'HOMME' ? 'Mr' : '', nomAccompagnant].filter(Boolean).join(' ') : ''],
        ['Sexe', libelleSexe(form.accompagnantSexe)],
        ['Téléphone', form.accompagnantTelephone],
        ['Lien', lienAccompagnant],
    ];
    const lignes = (liste, classe) => (
        <dl className={classe}>
            {liste.map(([libelle, valeur]) => (
                <div key={libelle} className="flex items-baseline justify-between gap-4 border-b border-slate-100 pb-2 last:border-0 last:pb-0 dark:border-gray-800">
                    <dt className="text-slate-500 dark:text-gray-400">{libelle}</dt>
                    <dd className={`min-w-0 break-words text-right font-semibold first-letter:uppercase ${valeur ? '' : 'text-slate-300 dark:text-gray-600'}`}>{valeur || '—'}</dd>
                </div>
            ))}
        </dl>
    );
    // Avec un accompagnant (urgence) ou un parent (enfant), le récapitulatif se divise en deux comme le formulaire : le patient d'un côté, la personne qui l'accompagne de l'autre.
    const resume = (
        <aside aria-label="Récapitulatif" className={`${card} p-5 sm:p-6 ${accompagnant ? 'order-first' : 'xl:sticky xl:top-4'}`}>
            <h2 className="mb-4 flex items-center gap-2 text-lg font-bold"><CheckCircle size={20} className="text-teal-600" aria-hidden="true" />Récapitulatif</h2>
            {accompagnant ? (
                <div className="space-y-5">
                    {lignes(lignesVisite, 'grid gap-x-8 gap-y-3 text-sm sm:grid-cols-2 lg:grid-cols-4')}
                    <div className="grid items-start gap-5 lg:grid-cols-2 lg:gap-8">
                        <section aria-label={enfant ? 'L’enfant' : 'Le patient'} className="rounded-xl border border-slate-300 p-4 dark:border-gray-600">
                            <h3 className="mb-3 flex items-center gap-1.5 text-sm font-semibold"><UserRoundCheck size={15} aria-hidden="true" />{enfant ? 'L’enfant' : 'Le patient'}</h3>
                            {lignes(lignesPatient, 'space-y-3 text-sm')}
                        </section>
                        <section aria-label={enfant ? 'Parent ou responsable' : 'Personne qui accompagne'} className={`rounded-xl border p-4 ${form.urgence ? 'border-rose-300 bg-rose-50/40 dark:border-rose-500/40 dark:bg-rose-500/5' : 'border-teal-300 bg-teal-50/40 dark:border-teal-500/40 dark:bg-teal-500/5'}`}>
                            <h3 className="mb-3 flex items-center gap-1.5 text-sm font-semibold"><Users size={15} aria-hidden="true" />{enfant ? 'Parent ou responsable' : 'Personne qui accompagne'}</h3>
                            {lignes(lignesAccompagnant, 'space-y-3 text-sm')}
                        </section>
                    </div>
                </div>
            ) : lignes([...lignesPatient, ...lignesVisite], 'space-y-3 text-sm')}
        </aside>
    );
    return (
        <AdminLayout title="Patient sans rendez-vous" subtitle="Voir qui est libre et recevoir un patient tout de suite"
            actions={<button type="button" onClick={() => navigate(home, { state: { create: true } })} className={`${btnSecondary} hidden sm:inline-flex`}>Plutôt prendre un rendez-vous</button>}>
            {() => <>
                {/* ---------- patient qui vient d'être reçu ---------- */}
                {recu && (
                    <section className={`${card} border-emerald-300 p-5 sm:p-6 dark:border-emerald-500/40`} aria-live="polite">
                        <div className="flex flex-wrap items-start gap-4">
                            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300"><CheckCircle size={26} /></span>
                            <div className="min-w-0 flex-1">
                                <h2 className="text-lg font-semibold">{nomAvecCivilite(recu.rdv.nomClient, recu.rdv.ageClient, recu.rdv.sexe)} est {recu.rdv.sexe === 'FEMME' ? 'reçue' : 'reçu'} par {recu.praticienNom}{recu.rdv.urgence && <span className="ml-2 rounded-full bg-rose-100 px-2.5 py-0.5 align-middle text-xs font-bold text-rose-800 dark:bg-rose-500/15 dark:text-rose-200">URGENCE</span>}</h2>
                                <p className="mt-1 text-sm text-slate-600 dark:text-gray-300">La consultation commence maintenant. {recu.praticienNom} vient d’être prévenu(e). Le patient peut entrer ou patienter.</p>
                                {recu.rdv.accompagnantNom && <p className="mt-1 text-sm text-slate-600 dark:text-gray-300">{recu.rdv.ageClient < 18 ? 'Parent ou responsable : ' : 'Accompagné(e) par '}{[recu.rdv.accompagnantCivilite, recu.rdv.accompagnantNom].filter(Boolean).join(' ')}{recu.rdv.accompagnantLien ? ` (${recu.rdv.accompagnantLien})` : ''}{recu.rdv.accompagnantTelephone ? ` · ${formatPhone(recu.rdv.accompagnantTelephone)}` : ''}.</p>}
                                {recu.rdv.cleSuivi && <p className="mt-1 text-sm text-slate-500 dark:text-gray-400">Clé de suivi : <span className="select-all font-mono font-bold tracking-widest text-slate-800 dark:text-gray-100">{recu.rdv.cleSuivi}</span></p>}
                            </div>
                            <div className="flex flex-wrap gap-2">
                                <button type="button" onClick={() => setFactureOuverte(ouverte => (ouverte === recu.rdv.id ? null : recu.rdv.id))} aria-expanded={factureOuverte === recu.rdv.id} className={btnSecondary}><FileText size={16} />Facture proforma</button>
                                <button type="button" onClick={nouveauPatient} className={btnPrimary}>Un autre patient</button>
                            </div>
                        </div>
                        {factureOuverte === recu.rdv.id && <div className="mt-5 border-t border-slate-200 pt-5 dark:border-gray-800"><ProformaPanel rdv={recu.rdv} /></div>}
                    </section>
                )}

                <GardeDuJour />

                {/* ---------- qui est libre maintenant ---------- */}
                <section className={`${card} p-5 sm:p-6`}>
                    <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                        <h2 className="flex items-center gap-2 text-base font-semibold"><Clock3 size={18} aria-hidden="true" />Libres maintenant{libres.heure && <span className="text-sm font-normal text-slate-500 dark:text-gray-400">· il est {libres.heure}</span>}</h2>
                        <button type="button" onClick={chargerLibres} className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-sm font-medium text-slate-600 transition hover:bg-slate-100 dark:text-gray-300 dark:hover:bg-gray-800"><RotateCw size={14} aria-hidden="true" />Actualiser</button>
                    </div>
                    {libres.chargement ? <p className="flex items-center gap-2 rounded-lg bg-slate-50 p-4 text-sm text-slate-500 dark:bg-gray-800"><Loader2 size={16} className="animate-spin" />Recherche des personnes libres…</p>
                        : libres.erreur ? <Notice tone="error">{libres.erreur}</Notice>
                            : libres.praticiens.length === 0 ? <p className="rounded-lg bg-slate-50 p-4 text-sm text-slate-600 dark:bg-gray-800 dark:text-gray-300">Aucun médecin, sage-femme ni infirmier(ère) n’est enregistré.</p>
                                : (
                                    <ul className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3" role="radiogroup" aria-label="Personne qui reçoit le patient">
                                        {libres.praticiens.map(p => {
                                            const actif = String(p.id) === choisi;
                                            return (
                                                <li key={p.id}>
                                                    <button type="button" role="radio" aria-checked={actif} disabled={!p.libre || Boolean(recu)} onClick={() => setPraticienId(String(p.id))}
                                                        className={`flex w-full items-center gap-3 rounded-xl border px-3 py-3 text-left text-sm transition ${p.libre ? (actif ? 'border-teal-600 bg-teal-50 ring-2 ring-teal-600/20 dark:bg-teal-500/10' : 'border-slate-200 hover:border-teal-500 dark:border-gray-700') : 'cursor-not-allowed border-slate-200 bg-slate-50 opacity-60 dark:border-gray-700 dark:bg-gray-800'}`}>
                                                        <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${p.libre ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300' : 'bg-slate-200 text-slate-500 dark:bg-gray-700'}`}><UserRoundCheck size={19} /></span>
                                                        <span className="min-w-0 flex-1">
                                                            <span className="block truncate font-medium">{p.nom}</span>
                                                            <span className="block truncate text-xs text-slate-500 dark:text-gray-400">{ROLES[p.role] || p.role} · {p.libre ? (p.prochainRdv ? `libre jusqu’à ${p.prochainRdv}` : 'libre') : `occupé(e) jusqu’à ${p.occupeJusqua}`}</span>
                                                        </span>
                                                    </button>
                                                </li>
                                            );
                                        })}
                                    </ul>
                                )}
                    {!libres.chargement && !libres.erreur && !libres.ouvert && <p className="mt-3 text-sm text-amber-700 dark:text-amber-300">Le cabinet est hors de ses horaires habituels. Vous pouvez quand même recevoir ce patient si une personne est présente.</p>}
                    {!libres.chargement && !libres.erreur && libres.praticiens.length > 0 && personnelLibre.length === 0 && (
                        <div className="mt-4 rounded-xl border border-amber-300 bg-amber-50 p-4 text-sm text-amber-900 dark:border-amber-500/40 dark:bg-amber-500/10 dark:text-amber-100">
                            <p className="font-semibold">Personne n’est libre pour le moment.</p>
                            <p className="mt-1 leading-relaxed">Vous pouvez attendre qu’une personne se libère (la liste se met à jour toute seule), ou prendre un rendez-vous pour plus tard.</p>
                            <button type="button" onClick={() => navigate(home, { state: { create: true } })} className={`${btnPrimary} mt-3`}>Prendre un rendez-vous</button>
                        </div>
                    )}
                </section>

                {/* ---------- formulaire ---------- */}
                {!recu && personnelLibre.length > 0 && (
                    <div className={accompagnant ? 'flex flex-col gap-6' : 'grid items-start gap-6 xl:grid-cols-[minmax(0,1fr)_19rem]'}>
                    <form onSubmit={envoyer} className={`${card} space-y-5 p-5 sm:p-6`}>
                        <h2 className="text-base font-semibold">Le patient</h2>

                        {/* urgence : un accompagnant remplit le formulaire à la place du patient */}
                        <label className={`flex cursor-pointer items-start gap-3 rounded-xl border p-3.5 transition ${form.urgence ? 'border-rose-400 bg-rose-50 dark:border-rose-500/50 dark:bg-rose-500/10' : 'border-slate-200 dark:border-gray-700'}`}>
                            <input type="checkbox" checked={form.urgence} onChange={e => set('urgence', e.target.checked)} className="mt-1 h-4 w-4 accent-rose-600" />
                            <span className="text-sm">
                                <span className="flex items-center gap-1.5 font-semibold"><AlertTriangle size={15} aria-hidden="true" className="text-rose-600" />Patient en urgence</span>
                                <span className="mt-0.5 block text-slate-600 dark:text-gray-300">La personne qui l’accompagne remplit le formulaire à sa place. La personne qui reçoit le patient est prévenue d’une urgence.</span>
                            </span>
                        </label>

                        {/* en urgence, le formulaire de la personne qui accompagne s'affiche à côté de celui du patient */}
                        <div className={accompagnant ? 'grid items-start gap-6 lg:grid-cols-2 lg:gap-8' : ''}>
                        <div className={accompagnant ? 'space-y-5 rounded-xl border border-slate-300 p-4 dark:border-gray-600' : 'space-y-5'}>
                        {accompagnant && <p className="flex items-center gap-1.5 text-sm font-semibold"><UserRoundCheck size={15} aria-hidden="true" />Le patient</p>}
                        {/* chaque champ a son étiquette au-dessus ; la civilité (courte) est sur la même ligne que le nom et choisit le sexe, et inversement */}
                        <div className="space-y-4">
                            <div className="flex flex-wrap items-start gap-4">
                                <label className="text-sm font-medium">Civilité *
                                    <SelectCivilite sexe={form.sexe} onChange={valeur => set('sexe', valeur)} className={`${inputClass} mt-1.5 block w-32! min-w-0`} /></label>
                                <div className="min-w-[12rem] flex-1 text-sm font-medium">
                                    <label htmlFor="sans-rdv-nom">Nom du patient *</label>
                                    <input id="sans-rdv-nom" required minLength={2} maxLength={100} value={form.nomClient} onChange={e => set('nomClient', e.target.value)} className={`${inputClass} mt-1.5`} autoFocus />
                                    {form.urgence && <button type="button" onClick={() => set('nomClient', 'Patient non identifié')} className="mt-1.5 text-xs font-normal text-teal-700 underline-offset-2 hover:underline dark:text-teal-300">Identité inconnue pour le moment</button>}
                                    {/* voyant réservé au personnel : vert = patient déjà venu, rouge = nouveau patient (le numéro d'un enfant est celui de son parent : il n'entre pas dans la vérification) */}
                                    <VoyantPatient className="mt-2 font-normal" nom={form.nomClient === 'Patient non identifié' ? '' : form.nomClient} telephone={enfant ? '' : form.telephoneClient}
                                        onChoisir={patient => setForm(precedent => ({ ...precedent, nomClient: patient.nom, telephoneClient: enfant ? precedent.telephoneClient : formatPhone(patient.telephone) }))} />
                                </div>
                            </div>
                            <div className="grid items-start gap-4 sm:grid-cols-2">
                                <label className="text-sm font-medium">Âge{form.urgence ? ' (estimé si inconnu)' : ''} *
                                    <input required type="number" min={0} max={120} value={form.ageClient} onChange={e => set('ageClient', e.target.value)} className={`${inputClass} mt-1.5`} /></label>
                                <label className="text-sm font-medium">Téléphone du patient{form.urgence || enfant ? '' : ' *'}
                                    <input type="tel" inputMode="tel" maxLength={20} disabled={enfant} placeholder={enfant ? 'Aucun pour un enfant' : '034 12 345 67'} value={enfant ? '' : form.telephoneClient} onChange={e => set('telephoneClient', e.target.value)} className={`${inputClass} mt-1.5 disabled:cursor-not-allowed disabled:opacity-60`} />
                                    {enfant && <span className="mt-1.5 block text-xs font-normal text-slate-500 dark:text-gray-400">Un enfant n’a pas de téléphone : le contact est son parent ou son responsable.</span>}
                                    {form.urgence && !enfant && <span className="mt-1.5 block text-xs font-normal text-slate-500 dark:text-gray-400">Sans numéro, celui de la personne qui l’accompagne sera utilisé.</span>}
                                </label>
                                <ChoixSexe sexe={form.sexe} age={form.ageClient} onChange={valeur => set('sexe', valeur)} obligatoire />
                            </div>
                            {/* un ou plusieurs services : le premier choisi est le service principal, les autres se retrouvent dans la facture proforma */}
                            <fieldset>
                                <legend className="text-sm font-medium">Services souhaités <span className="font-normal text-slate-500 dark:text-gray-400">· un ou plusieurs{form.serviceIds.length > 0 ? ` · ${form.serviceIds.length} choisi${form.serviceIds.length > 1 ? 's' : ''}` : ''}</span></legend>
                                {(options.services || []).length === 0 ? <p className="mt-1.5 text-sm text-slate-500 dark:text-gray-400">Aucun service enregistré.</p> : (
                                    <div className="mt-2 flex flex-wrap gap-2" role="group" aria-label="Services souhaités">
                                        {(options.services || []).map(service => {
                                            const actif = form.serviceIds.includes(service.id);
                                            return (
                                                <button key={service.id} type="button" role="checkbox" aria-checked={actif} onClick={() => basculerService(service.id)}
                                                    className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm font-medium transition ${actif ? 'border-teal-700 bg-teal-700 text-white' : 'border-slate-300 bg-white hover:border-teal-600 dark:border-gray-600 dark:bg-gray-950'}`}>
                                                    {actif && <Check size={14} aria-hidden="true" />}{service.nom}
                                                </button>
                                            );
                                        })}
                                    </div>
                                )}
                            </fieldset>
                        </div>
                        </div>

                        {accompagnant && (
                            <fieldset className={`space-y-4 rounded-xl border p-4 ${form.urgence ? 'border-rose-300 bg-rose-50/40 dark:border-rose-500/40 dark:bg-rose-500/5' : 'border-teal-300 bg-teal-50/40 dark:border-teal-500/40 dark:bg-teal-500/5'}`}>
                                <legend className="flex items-center gap-1.5 px-1 text-sm font-semibold"><Users size={15} aria-hidden="true" />{enfant ? 'Parent ou responsable de l’enfant' : 'Personne qui accompagne le patient'} <span className="font-normal text-slate-500 dark:text-gray-400">{enfant ? '(obligatoire)' : '(facultatif)'}</span></legend>
                                <div className="flex flex-wrap items-start gap-4">
                                    <label className="text-sm font-medium">Civilité
                                        <SelectCivilite sexe={form.accompagnantSexe} onChange={valeur => set('accompagnantSexe', valeur)} className={`${inputClass} mt-1.5 block w-32! min-w-0`} /></label>
                                    <label className="min-w-[12rem] flex-1 text-sm font-medium">{enfant ? 'Nom du parent ou responsable *' : 'Nom de l’accompagnant'}
                                        <input required={enfant} maxLength={100} value={form.accompagnantNom} onChange={e => set('accompagnantNom', e.target.value)} className={`${inputClass} mt-1.5`} /></label>
                                </div>
                                <ChoixSexe sexe={form.accompagnantSexe} onChange={valeur => set('accompagnantSexe', valeur)} etiquette={enfant ? 'Sexe du parent ou responsable' : 'Sexe de l’accompagnant'} idEtiquette="choix-sexe-accompagnant" avecCivilite={false} />
                                <label className="block text-sm font-medium">{enfant ? 'Téléphone du parent ou responsable *' : 'Téléphone de l’accompagnant'}
                                    <input required={enfant} type="tel" inputMode="tel" maxLength={20} placeholder="034 12 345 67" value={form.accompagnantTelephone} onChange={e => set('accompagnantTelephone', e.target.value)} className={`${inputClass} mt-1.5`} /></label>
                                <label className="block text-sm font-medium">{enfant ? 'Lien avec l’enfant' : 'Lien avec le patient'}
                                    <select value={lienAccompagnant} onChange={e => set('accompagnantLien', e.target.value)} className={`${inputClass} mt-1.5`}>
                                        <option value="">Non précisé</option>
                                        {LIENS.map(lien => <option key={lien} value={lien}>{lien}</option>)}
                                    </select></label>
                            </fieldset>
                        )}
                        </div>

                        <label className="block text-sm font-medium">Motif de la visite
                            <textarea maxLength={2000} rows={3} value={form.motif} onChange={e => set('motif', e.target.value)} className={`${inputClass} mt-1.5`} /></label>

                        <label className="flex cursor-pointer items-center gap-3 text-sm">
                            <input type="checkbox" checked={form.proforma} onChange={e => set('proforma', e.target.checked)} className="h-4 w-4 accent-teal-700" />
                            <span><span className="font-medium">Le patient souhaite une facture proforma</span><span className="text-slate-500 dark:text-gray-400"> · facultatif, elle s’établit après l’enregistrement</span></span>
                        </label>

                        {erreur && <p role="alert" className="rounded-xl bg-rose-50 px-3 py-2 text-sm text-rose-700 dark:bg-rose-500/10 dark:text-rose-300">{erreur}</p>}
                        <div className="flex flex-wrap items-center justify-end gap-2 border-t border-slate-200 pt-4 dark:border-gray-800">
                            <button disabled={envoi || !choisi} className={btnPrimary}>{envoi && <Loader2 size={15} className="animate-spin" />}{envoi ? 'Enregistrement…' : 'Recevoir maintenant'}</button>
                        </div>
                    </form>
                    {resume}
                    </div>
                )}

                {/* ---------- reçus aujourd'hui ---------- */}
                <section className={`${card} p-5 sm:p-6`}>
                    <h2 className="mb-3 text-base font-semibold">Reçus aujourd’hui sans rendez-vous <span className="font-normal text-slate-500 dark:text-gray-400">· {formatDateFr(todayISO(), { weekday: 'long', day: 'numeric', month: 'long' })}</span></h2>
                    {aujourdhui.length === 0 ? <p className="rounded-lg bg-slate-50 p-4 text-sm text-slate-600 dark:bg-gray-800 dark:text-gray-300">Aucun patient reçu sans rendez-vous pour le moment.</p> : (
                        <ul className="divide-y divide-slate-200 dark:divide-gray-800">
                            {aujourdhui.map(rdv => (
                                <li key={rdv.id} className="py-3">
                                    <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
                                        <span className="w-14 shrink-0 text-sm font-semibold tabular-nums">{hhmm(rdv.heureRdv)}</span>
                                        <div className="min-w-0 flex-1">
                                            <p className="truncate text-sm font-medium">{nomAvecCivilite(rdv.nomClient, rdv.ageClient, rdv.sexe)}{rdv.urgence && <span className="ml-2 rounded-full bg-rose-100 px-2 py-0.5 text-[10px] font-bold text-rose-800 dark:bg-rose-500/15 dark:text-rose-200">URGENCE</span>}</p>
                                            <p className="truncate text-xs text-slate-500 dark:text-gray-400">Reçu par {rdv.praticienNom || '—'}{rdv.accompagnantNom ? ` · accompagné par ${[rdv.accompagnantCivilite, rdv.accompagnantNom].filter(Boolean).join(' ')}` : ''}</p>
                                        </div>
                                        <button type="button" onClick={() => setFactureOuverte(ouverte => (ouverte === rdv.id ? null : rdv.id))} aria-expanded={factureOuverte === rdv.id} className={btnSecondary}><FileText size={15} />Facture proforma</button>
                                    </div>
                                    {factureOuverte === rdv.id && !(recu && recu.rdv.id === rdv.id) && <div className="mt-4 rounded-xl bg-slate-50 p-4 dark:bg-gray-800/50"><ProformaPanel rdv={rdv} /></div>}
                                </li>
                            ))}
                        </ul>
                    )}
                </section>
            </>}
        </AdminLayout>
    );
}
