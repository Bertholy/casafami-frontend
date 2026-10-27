import { useState, useEffect, useCallback, useRef } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import axiosClient from '../api/axiosClient';
import { apiErrorMessage } from '../utils/auth';
import Editable from '../components/site/Editable';
import AssistantRdv from '../components/AssistantRdv';
import ChoixParcours from '../components/ChoixParcours';
import { Button } from '../components/ui/button';
import { Input, Label, Textarea } from '../components/ui/input';
import AutreDate from '../components/AutreDate';
import { sonTransition } from '../utils/son';
import { ajouterJours, formaterJour } from '../utils/jours';
import { useAvailableSlots } from '../hooks/useAvailableSlots';
import { explainNoSlots, libelleOuverture, usePlanning } from '../utils/horaires';
import { formatPhoneInput, isPlausiblePhone } from '../utils/phone';
import { todayISO } from '../constants/app';
import BoutonTelecharger from '../components/BoutonTelecharger';
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
    MessageSquare,
    ShieldCheck,
    Sunrise,
    Sunset,
} from 'lucide-react';
import { useLang } from '../i18n/LangContext';

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
    // Trois pages, un seul composant (les réponses déjà données restent d'une page à l'autre) :
    // /prendre-rdv (choix), /prendre-rdv/assistant (l'assistant pose les questions), /prendre-rdv/formulaire (formulaire déjà rempli avec les réponses).
    const navigate = useNavigate();
    const { pathname } = useLocation();
    const mode = pathname.endsWith('/assistant') ? 'ia' : pathname.endsWith('/formulaire') ? 'moi' : 'choix';
    const assistantOuvert = mode === 'ia';
    const [autreDate, setAutreDate] = useState(false);               // « Une autre date ? » : Oui affiche les cases jour / mois / année
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
    const formulaireVisible = mode === 'moi';

    const onChange = (e) => {
        const { name } = e.target;
        const value = name === 'telephoneClient' ? formatPhoneInput(e.target.value) : e.target.value;
        setForm({ ...form, [name]: value });
    };

    // Passage du choix à l'assistant ou au formulaire, et de l'un à l'autre : tout ce qui a été saisi est dans `form`, rien n'est perdu.
    const changerMode = nouveau => {
        sonTransition();
        navigate(nouveau === 'ia' ? '/prendre-rdv/assistant' : '/prendre-rdv/formulaire');
    };

    // « Une autre date ? » : Oui efface la date choisie (les cases la remplacent) ; Non garde un des six jours proposés, sinon l'efface.
    const choisirAutreDate = oui => {
        setAutreDate(oui);
        setForm(current => ((oui || !jours.includes(current.dateRdv)) ? { ...current, dateRdv: '', heureRdv: '' } : current));
    };

    // Envoie la demande : depuis le bouton du formulaire, ou depuis la dernière réponse de l'assistant.
    const envoyer = async () => {
        setErreur(null);
        if (form.nomClient.trim().length < 2 || form.ageClient === '') { setErreur(t("Renseignez votre nom et votre âge pour continuer.")); return; }
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
                    ? "Une réservation existe déjà avec ce numéro de téléphone (rendez-vous du {date} à {heure}). Une nouvelle réservation sera possible à partir du {dispo}, ou dès que la première est annulée dans « Mes rendez-vous »."
                    : "Une réservation existe déjà à ce nom (rendez-vous du {date} à {heure}). Une nouvelle réservation sera possible à partir du {dispo}, ou dès que la première est annulée dans « Mes rendez-vous ».",
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
    const onSubmit = e => { e.preventDefault(); envoyer(); };

    // ========== PAGE DE SUCCÈS ==========
    if (succes) {
        return (
            <div className="min-h-screen py-16 px-4">
                <div className="max-w-lg mx-auto">
                    <div className="rounded-xl border border-border bg-card p-8 text-center text-card-foreground md:p-10">
                        <div className="w-20 h-20 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-6">
                            <CheckCircle className="w-12 h-12 text-green-600 dark:text-green-400" />
                        </div>
                        <h2 className="text-3xl font-bold text-gray-800 dark:text-white mb-3">
                            {t("Demande enregistrée !")}
                        </h2>
                        <p className="text-gray-600 dark:text-gray-400 mb-8">
                            {t("Votre rendez-vous est en cours de confirmation par le cabinet. Vous serez prévenu par message.")}
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
                                <div className="mt-4 flex justify-center"><QrCode value={lienSuivi(succes.cleSuivi)} size={150} label={t("Code à scanner de votre rendez-vous")} className="border border-slate-200" /></div>
                                <p className="mt-3 text-sm text-gray-600 dark:text-gray-400">{t("Conservez cette clé ou photographiez le code à scanner : c’est le seul moyen de retrouver, annuler ou télécharger le reçu de ce rendez-vous dans « Mes rendez-vous ».")}</p>
                            </div>
                        )}

                        <div className="grid gap-3 sm:grid-cols-2">
                            {/* le reçu n'est jamais téléchargé tout seul : le patient le demande, en PDF ou en image */}
                            <BoutonTelecharger rdv={succes} onDebut={() => setErreurPdf('')} onErreur={setErreurPdf} className="rounded-xl bg-teal-700 px-3 py-3 font-semibold text-white hover:bg-teal-800 sm:col-span-2" />
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
                                    setAutreDate(false);
                                    navigate('/prendre-rdv');
                                    setForm({ nomClient: '', ageClient: '', telephoneClient: '', motif: '', dateRdv: '', heureRdv: '', serviceId: '' });
                                }}
                                className="flex-1 bg-teal-600 text-white py-3 rounded-xl font-semibold hover:bg-teal-700 transition"
                            >
                                {t("Autre rendez-vous")}
                            </button>
                        </div>
                        {erreurPdf && <p role="alert" className="mt-4 rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700">{t(erreurPdf)}</p>}
                    </div>
                </div>
            </div>
        );
    }

    // L'assistant : page principale (mode « ia »), ou simple bouton « Continuer avec l'assistant » à côté du formulaire (mode « moi »).
    const assistant = (
        <AssistantRdv
            ouvert={assistantOuvert}
            onOuvrir={() => changerMode('ia')}
            form={form}
            setForm={setForm}
            services={services}
            jours={jours}
            aujourdhui={aujourdhui}
            planning={planning}
            creneaux={creneaux}
            heureChoisie={heureChoisie}
            slotsLoading={slotsLoading}
            slotsError={slotsError}
            onRafraichir={refreshSlots}
            envoiEnCours={loading}
            onConfirmer={envoyer}
        />
    );

    // Récapitulatif de ce qui a déjà été renseigné : en carte à côté du formulaire, en panneau coloré sur la page de l'assistant.
    const lignesResume = [
        [t("Patient"), form.nomClient.trim()],
        [t("Service"), serviceChoisi ? t(serviceChoisi.nom) : t("Je ne sais pas encore")],
        [t("Date"), form.dateRdv ? formaterJour(form.dateRdv, lang, { weekday: 'long', day: 'numeric', month: 'long' }) : ''],
        [t("Heure"), heureChoisie],
    ];
    const resume = (
        <div className="rounded-xl border border-border bg-card p-6 text-card-foreground">
            <h2 className="mb-4 flex items-center gap-2 text-lg font-bold text-gray-800 dark:text-white"><CheckCircle className="h-5 w-5 text-teal-600" />{t("Votre rendez-vous")}</h2>
            <dl className="space-y-3 text-sm">
                {lignesResume.map(([libelle, valeur]) => (
                    <div key={libelle} className="flex items-baseline justify-between gap-4 border-b border-gray-100 pb-2 last:border-0 last:pb-0 dark:border-gray-700">
                        <dt className="text-gray-500 dark:text-gray-400">{libelle}</dt>
                        <dd className={`text-right font-semibold first-letter:uppercase ${valeur ? 'text-gray-800 dark:text-white' : 'text-gray-300 dark:text-gray-600'}`}>{valeur || '—'}</dd>
                    </div>
                ))}
            </dl>
        </div>
    );

    // ========== PAGE : ASSISTANT, PUIS FORMULAIRE SI LA PERSONNE CONTINUE ELLE-MÊME ==========
    return (
        <div className="transition-colors">

            {/* ========== HERO ========== */}
            <section className="px-4 pb-6 pt-10 sm:px-6 lg:px-8">
                <div className="mx-auto max-w-7xl">
                    <div className="mb-6 flex items-center gap-2 text-sm text-slate-500 dark:text-gray-400">
                        <Link to="/" className="transition hover:text-teal-700">{t("Accueil")}</Link>
                        <ChevronRight className="h-4 w-4" />
                        <span className="font-medium text-slate-800 dark:text-white">{t("Prendre rendez-vous")}</span>
                    </div>

                    <div className="text-center">
                        <span className="mb-4 inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-semibold text-teal-700 shadow-[0_0_0_1px_#dce9f0] dark:bg-gray-800 dark:text-teal-300 dark:shadow-none">
                            <Calendar className="h-4 w-4" />
                            {t("Réservation en ligne")}
                        </span>
                        <Editable id="rdv.hero.titre" as="h1" className="mb-3 text-4xl font-extrabold md:text-5xl">Prenez votre rendez-vous</Editable>
                        <Editable id="rdv.hero.texte" as="p" className="mx-auto max-w-2xl text-lg text-slate-600 dark:text-gray-300">Réservez en quelques minutes. Confirmation par message.</Editable>
                    </div>
                </div>
            </section>

            {/* ========== PAGE DE CHOIX : avec l'assistant ou moi-même ========== */}
            {mode === 'choix' && <ChoixParcours onChoisir={changerMode} />}

            {/* ========== PAGE DE L'ASSISTANT : il pose les questions, la personne répond ========== */}
            {assistantOuvert && (
            <section id="reservation" className="px-4 pb-24 pt-4">
                {/* même présentation que le choix de parcours d'origine : une carte à deux panneaux, blanc (l'assistant) et coloré (le récapitulatif) */}
                <div className="mx-auto max-w-4xl space-y-4">
                    {erreur && (
                        <div ref={erreurRef} role="alert" className="flex items-start gap-3 rounded-xl border-l-4 border-red-500 bg-red-50 p-4 dark:bg-red-900/20">
                            <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-red-500" />
                            <div>
                                <p className="font-semibold text-red-700 dark:text-red-400">{t("Erreur")}</p>
                                <p className="text-sm text-red-600 dark:text-red-300">{t(erreur)}</p>
                            </div>
                        </div>
                    )}
                    <div className="grid overflow-hidden rounded-[2rem] bg-white md:grid-cols-2 md:rounded-[3.5rem] dark:bg-gray-800">
                        {assistant}

                        <article className="flex flex-col items-center px-8 py-12 text-center text-white sm:px-12 md:py-14" style={{ background: 'var(--mt-main-fort)' }}>
                            <span className="mb-5 flex h-11 w-11 items-center justify-center rounded-full border-2 border-white/80"><CheckCircle className="h-5 w-5" /></span>
                            <h3 className="font-titre mb-6 text-balance text-3xl font-extrabold">{t("Votre rendez-vous")}</h3>
                            <dl className="mb-8 w-full max-w-xs flex-1 space-y-3 text-sm">
                                {lignesResume.map(([libelle, valeur]) => (
                                    <div key={libelle} className="flex items-baseline justify-between gap-4 border-b border-white/25 pb-2 last:border-0">
                                        <dt className="text-white/80">{libelle}</dt>
                                        <dd className={`text-right font-semibold first-letter:uppercase ${valeur ? '' : 'text-white/40'}`}>{valeur || '—'}</dd>
                                    </div>
                                ))}
                            </dl>
                            <p className="mb-4 max-w-xs text-sm leading-relaxed text-white/90">{t("Ce que vous avez déjà répondu sera conservé.")}</p>
                            <button type="button" onClick={() => changerMode('moi')} className="rounded-full border-2 border-white px-7 py-3 text-xs font-extrabold uppercase tracking-[0.14em] text-white transition hover:bg-white hover:text-(--mt-main-fort) focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white">{t("Continuer moi-même")}</button>
                        </article>
                    </div>
                </div>
            </section>
            )}

            {/* ========== ÉTAPES ========== */}
            {formulaireVisible && (
            <section id="reservation" className="py-6">
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

            )}

            {/* ========== FORMULAIRE ========== */}
            {formulaireVisible && (
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
                        <div className="p-6 md:p-8 border-b border-border">
                            <div className="flex items-center gap-3 mb-6">
                                <div className="flex size-11 items-center justify-center rounded-md bg-primary text-primary-foreground">
                                    <User className="size-5" />
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
                                    <Label htmlFor="nomClient" className="mb-2 block">{t("Nom complet *")}</Label>
                                    <Input
                                        id="nomClient"
                                        type="text"
                                        name="nomClient"
                                        autoComplete="name"
                                        maxLength={100}
                                        value={form.nomClient}
                                        onChange={onChange}
                                        required
                                        placeholder={t("Ex: Ahmed Benali")}
                                    />
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <Label htmlFor="ageClient" className="mb-2 block">{t("Âge *")}</Label>
                                        <Input
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
                                        />
                                    </div>

                                    <div>
                                        <Label htmlFor="telephoneClient" className="mb-2 block">{t("Téléphone *")}</Label>
                                        <div className="relative">
                                            <Phone className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                                            <Input
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
                                                className="pl-10"
                                            />
                                        </div>
                                        {telephoneTouche && form.telephoneClient !== '' && !isPlausiblePhone(form.telephoneClient)
                                            ? <p id="aide-telephone" className="mt-1 text-xs font-medium text-red-600 dark:text-red-400">{t("Ce numéro ne semble pas valide. Exemple : 034 12 345 67")}</p>
                                            : <p id="aide-telephone" className="mt-1 text-xs text-gray-500 dark:text-gray-400">{t("Exemple : 034 12 345 67")}</p>}
                                    </div>
                                </div>

                                <div>
                                    <Label htmlFor="serviceId" className="mb-2 block">{t("Service souhaité (facultatif)")}</Label>
                                    <ServiceSelect services={services} statut={servicesStatut} value={form.serviceId} onChange={serviceId => setForm(current => ({ ...current, serviceId }))} onRetry={chargerServices} />
                                </div>

                                <div>
                                    <Label htmlFor="motif" className="mb-2 block">{t("Motif du rendez-vous")}</Label>
                                    <p className="mb-2 text-sm text-gray-500">{t("En cas d’urgence, appelez le cabinet.")}</p>
                                    <Textarea id="motif" name="motif" value={form.motif} onChange={onChange} maxLength={2000} rows={4} placeholder={t("Expliquez brièvement la raison de votre rendez-vous : suivi de grossesse, consultation prénatale, échographie, douleurs ou autre demande.")} className="resize-y" />
                                    <p className="mt-1 text-right text-xs text-gray-500">{form.motif.length}/2000</p>
                                </div>
                            </div>
                        </div>

                        {/* ========== SECTION 2 : DATE ========== */}
                        <div className="p-6 md:p-8 border-b border-border">
                            <div className="flex items-center gap-3 mb-6">
                                <div className="flex size-11 items-center justify-center rounded-md bg-primary text-primary-foreground">
                                    <Calendar className="size-5" />
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
                                            onClick={() => { setAutreDate(false); setForm(current => ({ ...current, dateRdv: iso, heureRdv: '' })); }}
                                            className={`rounded-md border px-2 py-2.5 text-center transition-colors ${choisi ? 'border-primary bg-primary text-primary-foreground' : 'border-input bg-background text-foreground hover:bg-accent'}`}
                                        >
                                            <span className="block text-[11px] font-semibold uppercase tracking-wide opacity-80">{i === 0 ? t("Aujourd’hui") : i === 1 ? t("Demain") : formaterJour(iso, lang, { weekday: 'short' })}</span>
                                            <span className="block text-xl font-bold leading-tight">{formaterJour(iso, lang, { day: 'numeric' })}</span>
                                            <span className="block text-xs opacity-80">{formaterJour(iso, lang, { month: 'short' })}</span>
                                        </button>
                                    );
                                })}
                            </div>
                            <AutreDate ouvert={autreDate || (Boolean(form.dateRdv) && !jours.includes(form.dateRdv))} onBascule={choisirAutreDate} valeur={form.dateRdv} min={aujourdhui} onChange={iso => setForm(current => ({ ...current, dateRdv: iso, heureRdv: '' }))} />
                        </div>

                        {/* ========== SECTION 3 : HEURE ========== */}
                        {form.dateRdv && (
                            <div className="p-6 md:p-8 border-b border-border">
                                <div className="flex items-center gap-3 mb-6">
                                    <div className="flex size-11 items-center justify-center rounded-md bg-primary text-primary-foreground">
                                        <Clock className="size-5" />
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
                                    <div className="border-l-2 border-red-500 py-1 pl-3">
                                        <p className="text-red-700 dark:text-red-300 text-sm">{t("Impossible de charger les créneaux.")} <button type="button" onClick={refreshSlots} className="font-semibold underline">{t("Réessayer")}</button></p>
                                    </div>
                                ) : creneaux.length === 0 ? (
                                    <div className="border-l-2 border-amber-500 py-1 pl-3">
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
                                                            className={`h-11 rounded-md border text-sm font-medium transition-colors ${
                                                                heureChoisie === h
                                                                    ? 'border-primary bg-primary text-primary-foreground'
                                                                    : 'border-input bg-background text-foreground hover:bg-accent'
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
                            <Button
                                type="submit"
                                size="lg"
                                disabled={loading}
                                className="w-full"
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
                            </Button>
                            <p className="mt-3 text-center text-xs text-gray-500 dark:text-gray-400">
                                {t("En confirmant, vous acceptez que le cabinet utilise ces informations pour gérer votre rendez-vous.")}{' '}
                                <Link to="/confidentialite" className="font-semibold text-teal-700 underline dark:text-teal-300">{t("Politique de confidentialité")}</Link>
                            </p>
                            <p aria-live="polite" className={`mt-3 text-center text-sm ${heureChoisie ? 'font-medium text-teal-700 dark:text-teal-300' : 'text-gray-500 dark:text-gray-400'}`}>
                                {heureChoisie
                                    ? t("Rendez-vous le {date} à {heure}", { date: formaterJour(form.dateRdv, lang, { weekday: 'long', day: 'numeric', month: 'long' }), heure: heureChoisie })
                                    : form.dateRdv ? t("Choisissez un créneau pour continuer.") : t("Choisissez une date et un créneau pour continuer.")}
                            </p>
                            <p className="text-center text-xs text-gray-400 dark:text-gray-500 mt-2">
                                {t("Sans inscription · Confirmation par message · Annulation gratuite")}
                            </p>
                        </div>
                    </form>

                    <aside className="space-y-4 lg:sticky lg:top-24 lg:max-h-[calc(100vh-7rem)] lg:overflow-y-auto">
                        {assistant}
                        {resume}
                        <ul className="space-y-3 rounded-xl bg-muted p-6 text-sm text-muted-foreground">
                            <li className="flex items-start gap-3"><Clock className="mt-0.5 h-4 w-4 shrink-0 text-teal-600" />{libelleOuverture(planning?.horaires, t)}</li>
                            <li className="flex items-start gap-3"><MessageSquare className="mt-0.5 h-4 w-4 shrink-0 text-teal-600" />{t("Confirmation par message")}</li>
                            <li className="flex items-start gap-3"><ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-teal-600" />{t("Annulation possible jusqu’à 2 heures avant le rendez-vous")}</li>
                        </ul>
                    </aside>
                    </div>
                </div>
            </section>
            )}
        </div>
    );
}

export default PrendreRdv;
