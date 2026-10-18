import { useState, useEffect, useCallback, useRef } from 'react';
import { Link } from 'react-router-dom';
import axiosClient from '../api/axiosClient';
import { apiErrorMessage } from '../utils/auth';
import Editable from '../components/site/Editable';
import MotifAssistant from '../components/MotifAssistant';
import { useAvailableSlots } from '../hooks/useAvailableSlots';
import { explainNoSlots, libelleOuverture, usePlanning } from '../utils/horaires';
import { formatPhoneInput, isPlausiblePhone } from '../utils/phone';
import { todayISO } from '../constants/app';
import { downloadReceiptImage } from '../utils/receipt';
import { downloadRendezVousPdf } from '../api/rendezVousPdf';
import QrCode from '../components/QrCode';
import ServiceSelect from '../components/ServiceSelect';
import { lienSuivi } from '../utils/suivi';
import {
    Check,
    Copy,
    KeyRound,
    Calendar,
    User,
    Phone,
    Clock,
    Loader2,
    CheckCircle,
    AlertCircle,
    ChevronRight,
    Home,
    Bot,
    MessageSquare,
    ShieldCheck,
    Sunrise,
    Sunset,
} from 'lucide-react';
import { useLang } from '../i18n/LangContext';

// Jours affichés en raccourcis : aujourd'hui et les cinq suivants (calcul sur des dates ISO, sans décalage d'heure d'été).
const ajouterJours = (iso, n) => { const d = new Date(`${iso}T12:00:00Z`); d.setUTCDate(d.getUTCDate() + n); return d.toISOString().slice(0, 10); };
const formaterJour = (iso, lang, options) => iso ? new Date(`${iso}T12:00:00Z`).toLocaleDateString(lang === 'mg' ? 'mg' : 'fr-FR', { timeZone: 'UTC', ...options }) : '';
const heureCourte = heure => String(heure || '').slice(0, 5);

function PrendreRdv() {
    const { t, lang } = useLang();
    const [form, setForm] = useState({
        nomClient: '',
        ageClient: '',
        telephoneClient: '',
        motif: '',
        dateRdv: '',
        heureRdv: '',
        serviceId: '',
    });
    const [services, setServices] = useState([]);
    const [servicesStatut, setServicesStatut] = useState('chargement');
    const planning = usePlanning();
    const { slots: creneaux, loading: slotsLoading, error: slotsError, refresh: refreshSlots } = useAvailableSlots(form.dateRdv);
    const [loading, setLoading] = useState(false);
    const [erreur, setErreur] = useState(null);
    const [succes, setSucces] = useState(null);
    const [assistantOuvert, setAssistantOuvert] = useState(false);
    const [erreurPdf, setErreurPdf] = useState('');
    const [cleCopiee, setCleCopiee] = useState(false);
    const [telephoneTouche, setTelephoneTouche] = useState(false);
    const erreurRef = useRef(null);

    // Le message d'erreur est en haut du formulaire alors que le bouton est en bas : on y amène la personne.
    useEffect(() => {
        if (erreur) erreurRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, [erreur]);

    // La confirmation remplace le formulaire : on repart du haut de la page pour la lire en entier.
    useEffect(() => {
        if (succes) window.scrollTo({ top: 0, behavior: 'smooth' });
    }, [succes]);

    // Le reçu n'est jamais téléchargé tout seul : le patient le demande lui-même (bouton ci-dessous, ou QR code dans « Mes RDV »).
    const telechargerPdf = async () => {
        try { await downloadRendezVousPdf(succes); setErreurPdf(''); }
        catch (err) { console.error('Téléchargement du PDF impossible', err); setErreurPdf(err.message || t("Le téléchargement du PDF a échoué.")); }
    };

    const telechargerImage = async () => {
        try { await downloadReceiptImage(succes); setErreurPdf(''); }
        catch (err) { console.error('Création de l’image impossible', err); setErreurPdf(t("Le téléchargement de l’image a échoué.")); }
    };

    const copierCle = async () => {
        try { await navigator.clipboard.writeText(succes.cleSuivi); setCleCopiee(true); window.setTimeout(() => setCleCopiee(false), 2000); }
        catch { setCleCopiee(false); }
    };

    const chargerServices = useCallback(() => {
        setServicesStatut('chargement');
        axiosClient.get('/rdv/form-options')
            .then(res => res.data.services || [])
            .catch(() => axiosClient.get('/services').then(res => res.data))
            .then(liste => { setServices(liste); setServicesStatut('ok'); })
            .catch(() => setServicesStatut('erreur'));
    }, []);

    useEffect(() => {
        const timer = window.setTimeout(chargerServices, 0);
        return () => window.clearTimeout(timer);
    }, [chargerServices]);

    // Le créneau choisi n'est conservé que s'il est encore libre : si quelqu'un d'autre le réserve entre-temps, il disparaît.
    const heureChoisie = creneaux.includes(form.heureRdv) ? form.heureRdv : '';
    const creneauPerdu = Boolean(form.heureRdv) && !heureChoisie && !slotsLoading && Boolean(form.dateRdv);

    const aujourdhui = todayISO();
    const jours = [0, 1, 2, 3, 4, 5].map(n => ajouterJours(aujourdhui, n));
    const matin = creneaux.filter(h => h < '12:00');
    const apresMidi = creneaux.filter(h => h >= '12:00');
    const serviceChoisi = services.find(service => String(service.id) === String(form.serviceId));
    const infosValides = form.nomClient.trim().length >= 2 && form.ageClient !== '' && isPlausiblePhone(form.telephoneClient);
    const etapes = [
        { label: t("Vos infos"), fait: infosValides },
        { label: t("Date"), fait: Boolean(form.dateRdv) },
        { label: t("Heure"), fait: Boolean(heureChoisie) },
    ];
    const etapeCourante = etapes.findIndex(etape => !etape.fait);

    const onChange = (e) => {
        const { name } = e.target;
        const value = name === 'telephoneClient' ? formatPhoneInput(e.target.value) : e.target.value;
        setForm({ ...form, [name]: value, ...(name === 'dateRdv' ? { heureRdv: '' } : {}) });
    };

    const appliquerMotif = ({ motif, serviceId }) => {
        setForm(current => ({ ...current, motif, serviceId: serviceId && !current.serviceId ? String(serviceId) : current.serviceId }));
        setAssistantOuvert(false);
    };

    const onSubmit = async (e) => {
        e.preventDefault();
        setErreur(null);
        if (!heureChoisie) { setErreur(t("Choisissez un créneau encore disponible.")); return; }
        if (!isPlausiblePhone(form.telephoneClient)) { setErreur(t("Saisissez un numéro de téléphone valide, par exemple 034 12 345 67.")); return; }
        setLoading(true);

        try {
            const res = await axiosClient.post('/rdv', {
                ...form,
                ageClient: parseInt(form.ageClient),
                heureRdv: heureChoisie + ':00',
                serviceId: form.serviceId ? Number(form.serviceId) : null,
            });
            setSucces(res.data);
        } catch (err) {
            console.error('Création du rendez-vous impossible', err);
            setErreur(apiErrorMessage(err, t("Impossible d’enregistrer ce rendez-vous. Vérifiez les informations et le créneau, puis réessayez.")));
            const reponse = err.response?.data;
            if (reponse?.code === 'RESERVATION_RECENTE') {
                // Même nom ou même numéro déjà réservé il y a moins de 7 jours : on indique le rendez-vous existant et la date de la prochaine réservation possible.
                const jourFr = iso => String(iso).slice(0, 10).split('-').reverse().join('/');
                setErreur(t(reponse.critere === 'TELEPHONE'
                    ? "Une réservation existe déjà avec ce numéro de téléphone (rendez-vous du {date} à {heure}). Une nouvelle réservation sera possible à partir du {dispo}, ou dès que la première est annulée dans « Mes RDV »."
                    : "Une réservation existe déjà à ce nom (rendez-vous du {date} à {heure}). Une nouvelle réservation sera possible à partir du {dispo}, ou dès que la première est annulée dans « Mes RDV ».",
                    { date: jourFr(reponse.dateRdvExistant), heure: String(reponse.heureRdvExistant).slice(0, 5), dispo: `${jourFr(reponse.disponibleLe)} ${t('à')} ${String(reponse.disponibleLe).slice(11, 16)}` }));
            } else if (err.response?.status === 409) {
                // Le créneau vient d'être pris : on le retire et on réaffiche ce qui reste libre ce jour-là.
                setForm(current => ({ ...current, heureRdv: '' }));
                refreshSlots();
                setErreur(t("Ce créneau vient d’être réservé par quelqu’un d’autre. Voici les créneaux encore disponibles pour cette date : choisissez-en un autre."));
            }
        } finally {
            setLoading(false);
        }
    };

    // ========== PAGE DE SUCCÈS ==========
    if (succes) {
        return (
            <div className="min-h-screen bg-linear-to-br from-teal-50 via-white to-teal-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 py-16 px-4">
                <div className="max-w-lg mx-auto">
                    <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-2xl p-8 md:p-10 text-center border border-teal-100 dark:border-gray-700">
                        <div className="w-20 h-20 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-6">
                            <CheckCircle className="w-12 h-12 text-green-600 dark:text-green-400" />
                        </div>
                        <h2 className="text-3xl font-bold text-gray-800 dark:text-white mb-3">
                            {t("Demande enregistrée !")}
                        </h2>
                        <p className="text-gray-600 dark:text-gray-400 mb-8">
                            {t("Votre rendez-vous est en attente de confirmation par le cabinet. Vous serez prévenu par SMS.")}
                        </p>

                        <div className="bg-linear-to-br from-teal-50 to-teal-100 dark:from-gray-700 dark:to-gray-700 rounded-2xl p-6 text-left space-y-3 mb-8">
                            <div className="flex justify-between items-center">
                                <span className="text-gray-500 dark:text-gray-400 text-sm">{t("Nom")}</span>
                                <span className="font-bold text-gray-800 dark:text-white">{succes.nomClient}</span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-gray-500 dark:text-gray-400 text-sm">{t("Date")}</span>
                                <span className="font-bold first-letter:uppercase text-gray-800 dark:text-white">{formaterJour(succes.dateRdv, lang, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-gray-500 dark:text-gray-400 text-sm">{t("Heure")}</span>
                                <span className="font-bold text-teal-600 dark:text-teal-400 text-lg">{heureCourte(succes.heureRdv)}</span>
                            </div>
                        </div>

                        {succes.cleSuivi && (
                            <div className="mb-8 rounded-2xl border-2 border-dashed border-teal-300 bg-white p-5 dark:border-teal-700 dark:bg-gray-800">
                                <p className="flex items-center justify-center gap-2 text-sm font-semibold text-teal-800 dark:text-teal-300"><KeyRound className="h-4 w-4" />{t("Votre clé de suivi")}</p>
                                <div className="mt-2 flex items-center justify-center gap-2">
                                    <span className="select-all font-mono text-2xl font-bold tracking-widest text-gray-800 dark:text-white">{succes.cleSuivi}</span>
                                    <button type="button" onClick={copierCle} aria-label={t("Copier la clé")} className="rounded-lg border border-teal-200 p-2 text-teal-700 hover:bg-teal-50 dark:border-gray-600 dark:text-teal-300 dark:hover:bg-gray-700">{cleCopiee ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}</button>
                                </div>
                                <div className="mt-4 flex justify-center"><QrCode value={lienSuivi(succes.cleSuivi)} size={150} label={t("QR code de votre rendez-vous")} className="border border-slate-200" /></div>
                                <p className="mt-3 text-sm text-gray-600 dark:text-gray-400">{t("Conservez cette clé ou photographiez le QR code : c’est le seul moyen de retrouver, annuler ou télécharger le reçu de ce rendez-vous dans « Mes RDV ».")}</p>
                            </div>
                        )}

                        <div className="grid gap-3 sm:grid-cols-2">
                            <button onClick={telechargerPdf} className="rounded-xl bg-teal-700 px-3 py-3 font-semibold text-white hover:bg-teal-800">{t("Télécharger en PDF")}</button>
                            <button onClick={telechargerImage} className="rounded-xl border border-teal-200 px-3 py-3 font-semibold text-teal-800 hover:bg-teal-50">{t("Télécharger en image")}</button>
                            <Link
                                to="/"
                                className="flex-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 py-3 rounded-xl font-semibold hover:bg-gray-200 dark:hover:bg-gray-600 transition flex items-center justify-center gap-2"
                            >
                                <Home className="w-4 h-4" />
                                {t("Accueil")}
                            </Link>
                            <button
                                onClick={() => {
                                    setSucces(null);
                                    setForm({ nomClient: '', ageClient: '', telephoneClient: '', motif: '', dateRdv: '', heureRdv: '', serviceId: '' });
                                }}
                                className="flex-1 bg-teal-600 text-white py-3 rounded-xl font-semibold hover:bg-teal-700 transition"
                            >
                                {t("Autre RDV")}
                            </button>
                        </div>
                        {erreurPdf && <p role="alert" className="mt-4 rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700">{t(erreurPdf)}</p>}
                    </div>
                </div>
            </div>
        );
    }

    // ========== FORMULAIRE ==========
    return (
        <div className="transition-colors">

            {/* ========== HERO ========== */}
            <section className="px-4 pb-6 pt-10 sm:px-6 lg:px-8">
                <div className="mx-auto max-w-7xl">
                    <div className="mb-6 flex items-center gap-2 text-sm text-slate-500 dark:text-gray-400">
                        <Link to="/" className="transition hover:text-teal-700">{t("Accueil")}</Link>
                        <ChevronRight className="h-4 w-4" />
                        <span className="font-medium text-slate-800 dark:text-white">{t("Prendre RDV")}</span>
                    </div>

                    <div className="text-center">
                        <span className="mb-4 inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-semibold text-teal-700 shadow-[0_0_0_1px_#dce9f0] dark:bg-gray-800 dark:text-teal-300 dark:shadow-none">
                            <Calendar className="h-4 w-4" />
                            {t("Réservation en ligne")}
                        </span>
                        <Editable id="rdv.hero.titre" as="h1" className="mb-3 text-4xl font-extrabold md:text-5xl">Prenez votre rendez-vous</Editable>
                        <Editable id="rdv.hero.texte" as="p" className="mx-auto max-w-2xl text-lg text-slate-600 dark:text-gray-300">Remplissez le formulaire en 2 minutes. Confirmation par SMS.</Editable>
                    </div>
                </div>
            </section>

            {/* ========== ÉTAPES ========== */}
            <section className="py-6">
                <ol className="mx-auto flex max-w-xl items-start px-4" aria-label={t("Étapes de la réservation")}>
                    {etapes.map((etape, i) => (
                        <li key={i} className="relative flex flex-1 flex-col items-center text-center" aria-current={i === etapeCourante ? 'step' : undefined}>
                            {i > 0 && <span aria-hidden="true" className={`absolute right-1/2 top-5 h-0.5 w-full -translate-y-1/2 transition-colors ${etapes[i - 1].fait ? 'bg-teal-600' : 'bg-gray-200 dark:bg-gray-700'}`} />}
                            <span className={`relative z-10 flex h-10 w-10 items-center justify-center rounded-full font-bold transition ${
                                etape.fait ? 'bg-teal-600 text-white' : i === etapeCourante ? 'bg-white text-teal-700 ring-2 ring-teal-600 dark:bg-gray-900 dark:text-teal-300' : 'bg-gray-200 text-gray-500 dark:bg-gray-700 dark:text-gray-400'
                            }`}>
                                {etape.fait ? <Check className="h-5 w-5" /> : i + 1}
                            </span>
                            <span className={`mt-2 text-sm font-medium ${etape.fait || i === etapeCourante ? 'text-teal-700 dark:text-teal-400' : 'text-gray-500'}`}>{etape.label}</span>
                        </li>
                    ))}
                </ol>
            </section>

            {/* ========== FORMULAIRE ========== */}
            <section className="py-12">
                <div className="mx-auto max-w-6xl px-4">

                    {erreur && (
                        <div ref={erreurRef} role="alert" className="bg-red-50 dark:bg-red-900/20 border-l-4 border-red-500 rounded-xl p-4 mb-6 flex items-start gap-3">
                            <AlertCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
                            <div>
                                <p className="font-semibold text-red-700 dark:text-red-400">{t("Erreur")}</p>
                                <p className="text-sm text-red-600 dark:text-red-300">{t(erreur)}</p>
                            </div>
                        </div>
                    )}

                    <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_20rem] lg:items-start">
                    <form onSubmit={onSubmit} className="mt-carte overflow-hidden">

                        {/* ========== SECTION 1 : INFORMATIONS ========== */}
                        <div className="p-6 md:p-8 border-b border-gray-100 dark:border-gray-700">
                            <div className="flex items-center gap-3 mb-6">
                                <div className="w-12 h-12 bg-linear-to-br from-teal-500 to-teal-700 rounded-xl flex items-center justify-center shadow-lg">
                                    <User className="w-6 h-6 text-white" />
                                </div>
                                <div>
                                    <h2 className="text-xl font-bold text-gray-800 dark:text-white">
                                        {t("Vos informations")}
                                    </h2>
                                    <p className="text-sm text-gray-500 dark:text-gray-400">
                                        {t("Ces données restent confidentielles")}
                                    </p>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <div>
                                    <label htmlFor="nomClient" className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                                        {t("Nom complet *")}
                                    </label>
                                    <input
                                        id="nomClient"
                                        type="text"
                                        name="nomClient"
                                        autoComplete="name"
                                        maxLength={100}
                                        value={form.nomClient}
                                        onChange={onChange}
                                        required
                                        placeholder={t("Ex: Ahmed Benali")}
                                        className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-800 dark:text-white focus:border-teal-500 focus:outline-none transition"
                                    />
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label htmlFor="ageClient" className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                                            {t("Âge *")}
                                        </label>
                                        <input
                                            id="ageClient"
                                            type="number"
                                            inputMode="numeric"
                                            name="ageClient"
                                            value={form.ageClient}
                                            onChange={onChange}
                                            required
                                            min="0"
                                            max="120"
                                            placeholder="30"
                                            className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-800 dark:text-white focus:border-teal-500 focus:outline-none transition"
                                        />
                                    </div>

                                    <div>
                                        <label htmlFor="telephoneClient" className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                                            {t("Téléphone *")}
                                        </label>
                                        <div className="relative">
                                            <Phone className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                                            <input
                                                id="telephoneClient"
                                                type="tel"
                                                name="telephoneClient"
                                                value={form.telephoneClient}
                                                onChange={onChange}
                                                onBlur={() => setTelephoneTouche(true)}
                                                aria-invalid={telephoneTouche && form.telephoneClient !== '' && !isPlausiblePhone(form.telephoneClient)}
                                                aria-describedby="aide-telephone"
                                                required
                                                placeholder="034 12 345 67"
                                                inputMode="tel"
                                                autoComplete="tel"
                                                maxLength={20}
                                                className="w-full pl-10 pr-4 py-3 rounded-xl border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-800 dark:text-white focus:border-teal-500 focus:outline-none transition"
                                            />
                                        </div>
                                        {telephoneTouche && form.telephoneClient !== '' && !isPlausiblePhone(form.telephoneClient)
                                            ? <p id="aide-telephone" className="mt-1 text-xs font-medium text-red-600 dark:text-red-400">{t("Ce numéro ne semble pas valide. Exemple : 034 12 345 67")}</p>
                                            : <p id="aide-telephone" className="mt-1 text-xs text-gray-500 dark:text-gray-400">{t("Exemple : 034 12 345 67")}</p>}
                                    </div>
                                </div>

                                <div>
                                    <label htmlFor="serviceId" className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">{t("Service souhaité (facultatif)")}</label>
                                    <ServiceSelect services={services} statut={servicesStatut} value={form.serviceId} onChange={serviceId => setForm(current => ({ ...current, serviceId }))} onRetry={chargerServices} />
                                </div>

                                <div>
                                    <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                                        <label htmlFor="motif" className="block text-sm font-semibold text-gray-700 dark:text-gray-300">{t("Motif du rendez-vous")}</label>
                                        <button type="button" onClick={() => setAssistantOuvert(true)} className="inline-flex items-center gap-2 rounded-xl bg-linear-to-r from-teal-600 to-teal-700 px-4 py-2 text-sm font-bold text-white shadow-md transition hover:from-teal-700 hover:to-teal-800"><Bot className="h-4 w-4" />{t("Aidez-moi à préciser mon motif")}</button>
                                    </div>
                                    <p className="mb-2 text-sm text-gray-500">{t("Répondez à quelques questions : l’assistant prépare pour vous un motif précis, que vous pouvez modifier. Il ne pose pas de diagnostic ; en cas d’urgence, appelez le cabinet ou les urgences.")}</p>
                                    <textarea id="motif" name="motif" value={form.motif} onChange={onChange} maxLength={2000} rows={4} placeholder={t("Expliquez brièvement la raison de votre rendez-vous : suivi de grossesse, consultation prénatale, échographie, douleurs ou autre demande.")} className="w-full resize-y rounded-xl border-2 border-gray-200 bg-white px-4 py-3 text-gray-800 focus:border-teal-500 focus:outline-none dark:border-gray-700 dark:bg-gray-900 dark:text-white" />
                                    <p className="mt-1 text-right text-xs text-gray-500">{form.motif.length}/2000</p>
                                </div>
                            </div>
                        </div>

                        {/* ========== SECTION 2 : DATE ========== */}
                        <div className="p-6 md:p-8 border-b border-gray-100 dark:border-gray-700">
                            <div className="flex items-center gap-3 mb-6">
                                <div className="w-12 h-12 bg-linear-to-br from-teal-500 to-teal-700 rounded-xl flex items-center justify-center shadow-lg">
                                    <Calendar className="w-6 h-6 text-white" />
                                </div>
                                <div>
                                    <h2 className="text-xl font-bold text-gray-800 dark:text-white">
                                        {t("Choisissez une date")}
                                    </h2>
                                    <p className="text-sm text-gray-500 dark:text-gray-400">
                                        {libelleOuverture(planning?.horaires, t)}
                                    </p>
                                </div>
                            </div>

                            <div className="mb-4 grid grid-cols-3 gap-2 sm:grid-cols-6">
                                {jours.map((iso, i) => {
                                    const choisi = form.dateRdv === iso;
                                    return (
                                        <button
                                            key={iso}
                                            type="button"
                                            aria-pressed={choisi}
                                            onClick={() => setForm(current => ({ ...current, dateRdv: iso, heureRdv: '' }))}
                                            className={`rounded-xl border-2 px-2 py-2.5 text-center transition ${choisi ? 'border-teal-600 bg-teal-600 text-white shadow-md' : 'border-gray-200 bg-white text-gray-700 hover:border-teal-300 hover:bg-teal-50 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300 dark:hover:bg-gray-800'}`}
                                        >
                                            <span className="block text-[11px] font-semibold uppercase tracking-wide opacity-80">{i === 0 ? t("Aujourd’hui") : i === 1 ? t("Demain") : formaterJour(iso, lang, { weekday: 'short' })}</span>
                                            <span className="block text-xl font-bold leading-tight">{formaterJour(iso, lang, { day: 'numeric' })}</span>
                                            <span className="block text-xs opacity-80">{formaterJour(iso, lang, { month: 'short' })}</span>
                                        </button>
                                    );
                                })}
                            </div>
                            <label htmlFor="dateRdv" className="mb-2 block text-sm font-semibold text-gray-700 dark:text-gray-300">{t("Ou une autre date")}</label>
                            <input
                                id="dateRdv"
                                type="date"
                                name="dateRdv"
                                value={form.dateRdv}
                                onChange={onChange}
                                required
                                min={todayISO()}
                                className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-800 dark:text-white focus:border-teal-500 focus:outline-none transition"
                            />
                        </div>

                        {/* ========== SECTION 3 : HEURE ========== */}
                        {form.dateRdv && (
                            <div className="p-6 md:p-8 border-b border-gray-100 dark:border-gray-700">
                                <div className="flex items-center gap-3 mb-6">
                                    <div className="w-12 h-12 bg-linear-to-br from-teal-500 to-teal-700 rounded-xl flex items-center justify-center shadow-lg">
                                        <Clock className="w-6 h-6 text-white" />
                                    </div>
                                    <div>
                                        <h2 className="text-xl font-bold text-gray-800 dark:text-white">
                                            {t("Choisissez un créneau")}
                                        </h2>
                                        <p className="text-sm text-gray-500 dark:text-gray-400">
                                            {creneaux.length > 0 ? t(creneaux.length > 1 ? '{n} créneaux disponibles ce jour-là' : '{n} créneau disponible ce jour-là', { n: creneaux.length }) : t('Créneaux de {minutes} minutes', { minutes: planning?.dureeCreneauMinutes || 30 })}
                                        </p>
                                        {creneauPerdu && <p role="alert" className="mt-1 text-sm font-medium text-orange-700 dark:text-orange-300">{t("Le créneau que vous aviez choisi n’est plus disponible : choisissez-en un autre.")}</p>}
                                    </div>
                                </div>

                                {slotsLoading ? (
                                    <div className="text-center py-6">
                                        <Loader2 className="w-8 h-8 text-teal-600 animate-spin mx-auto mb-2" />
                                        <p className="text-gray-500 dark:text-gray-400 text-sm">
                                            {t("Chargement des créneaux...")}
                                        </p>
                                    </div>
                                ) : slotsError ? (
                                    <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-4 text-center">
                                        <p className="text-red-700 dark:text-red-300 text-sm">{t("Impossible de charger les créneaux.")} <button type="button" onClick={refreshSlots} className="font-semibold underline">{t("Réessayer")}</button></p>
                                    </div>
                                ) : creneaux.length === 0 ? (
                                    <div className="bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-xl p-4 text-center">
                                        <p className="text-orange-700 dark:text-orange-300 text-sm">
                                            {explainNoSlots(form.dateRdv, planning, todayISO(), t)} {t("Choisissez une autre date.")}
                                        </p>
                                    </div>
                                ) : (
                                    <div className="space-y-5">
                                        {[
                                            { cle: 'matin', titre: t("Matin"), Icone: Sunrise, liste: matin },
                                            { cle: 'apres-midi', titre: t("Après-midi"), Icone: Sunset, liste: apresMidi },
                                        ].filter(groupe => groupe.liste.length > 0).map(({ cle, titre, Icone, liste }) => (
                                            <div key={cle}>
                                                <p className="mb-2 flex items-center gap-2 text-sm font-semibold text-gray-600 dark:text-gray-400"><Icone className="h-4 w-4 text-teal-600" />{titre}</p>
                                                <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-6">
                                                    {liste.map(h => (
                                                        <button
                                                            key={h}
                                                            type="button"
                                                            aria-pressed={heureChoisie === h}
                                                            onClick={() => setForm({ ...form, heureRdv: h })}
                                                            className={`py-3 rounded-xl text-sm font-bold transition-all ${
                                                                heureChoisie === h
                                                                    ? 'bg-teal-600 text-white shadow-lg scale-105'
                                                                    : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-teal-100 dark:hover:bg-gray-600 hover:scale-105'
                                                            }`}
                                                        >
                                                            {h}
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}

                        {/* ========== BOUTON ========== */}
                        <div className="p-6 md:p-8 bg-gray-50 dark:bg-gray-800/50">
                            <button
                                type="submit"
                                disabled={loading}
                                className="mt-btn w-full py-4 text-lg disabled:cursor-wait disabled:opacity-60"
                            >
                                {loading ? (
                                    <>
                                        <Loader2 className="w-5 h-5 animate-spin" />
                                        {t("Envoi en cours...")}
                                    </>
                                ) : (
                                    <>
                                        <Calendar className="w-5 h-5" />
                                        {t("Confirmer le rendez-vous")}
                                    </>
                                )}
                            </button>
                            <p aria-live="polite" className={`mt-3 text-center text-sm ${heureChoisie ? 'font-medium text-teal-700 dark:text-teal-300' : 'text-gray-500 dark:text-gray-400'}`}>
                                {heureChoisie
                                    ? t("Rendez-vous le {date} à {heure}", { date: formaterJour(form.dateRdv, lang, { weekday: 'long', day: 'numeric', month: 'long' }), heure: heureChoisie })
                                    : form.dateRdv ? t("Choisissez un créneau pour continuer.") : t("Choisissez une date et un créneau pour continuer.")}
                            </p>
                            <p className="text-center text-xs text-gray-400 dark:text-gray-500 mt-2">
                                {t("Sans inscription · Confirmation par SMS · Annulation gratuite")}
                            </p>
                        </div>
                    </form>

                    <aside className="space-y-4 lg:sticky lg:top-28">
                        <div className="rounded-3xl border border-teal-100 bg-white p-6 shadow-lg dark:border-gray-700 dark:bg-gray-800">
                            <h2 className="mb-4 flex items-center gap-2 text-lg font-bold text-gray-800 dark:text-white"><CheckCircle className="h-5 w-5 text-teal-600" />{t("Votre rendez-vous")}</h2>
                            <dl className="space-y-3 text-sm">
                                {[
                                    [t("Patient"), form.nomClient.trim()],
                                    [t("Service"), serviceChoisi ? t(serviceChoisi.nom) : t("Je ne sais pas encore")],
                                    [t("Date"), form.dateRdv ? formaterJour(form.dateRdv, lang, { weekday: 'long', day: 'numeric', month: 'long' }) : ''],
                                    [t("Heure"), heureChoisie],
                                ].map(([libelle, valeur]) => (
                                    <div key={libelle} className="flex items-baseline justify-between gap-4 border-b border-gray-100 pb-2 last:border-0 last:pb-0 dark:border-gray-700">
                                        <dt className="text-gray-500 dark:text-gray-400">{libelle}</dt>
                                        <dd className={`text-right font-semibold first-letter:uppercase ${valeur ? 'text-gray-800 dark:text-white' : 'text-gray-300 dark:text-gray-600'}`}>{valeur || '—'}</dd>
                                    </div>
                                ))}
                            </dl>
                        </div>
                        <ul className="space-y-3 rounded-3xl bg-teal-50 p-6 text-sm text-gray-700 dark:bg-gray-800 dark:text-gray-300">
                            <li className="flex items-start gap-3"><Clock className="mt-0.5 h-4 w-4 shrink-0 text-teal-600" />{libelleOuverture(planning?.horaires, t)}</li>
                            <li className="flex items-start gap-3"><MessageSquare className="mt-0.5 h-4 w-4 shrink-0 text-teal-600" />{t("Confirmation par SMS")}</li>
                            <li className="flex items-start gap-3"><ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-teal-600" />{t("Annulation possible jusqu’à 2 heures avant le rendez-vous")}</li>
                        </ul>
                    </aside>
                    </div>
                </div>
            </section>
            {assistantOuvert && <MotifAssistant services={services} onApply={appliquerMotif} onClose={() => setAssistantOuvert(false)} />}
        </div>
    );
}

export default PrendreRdv;
