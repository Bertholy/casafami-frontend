import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import axiosClient from '../api/axiosClient';
import { apiErrorMessage } from '../utils/auth';
import Editable from '../components/site/Editable';
import MotifAssistant from '../components/MotifAssistant';
import { useAvailableSlots } from '../hooks/useAvailableSlots';
import { explainNoSlots, libelleOuverture, usePlanning } from '../utils/horaires';
import { formatPhoneInput, isPlausiblePhone } from '../utils/phone';
import { todayISO } from '../constants/app';
import { printReceipt } from '../utils/receipt';
import { downloadRendezVousPdf } from '../api/rendezVousPdf';
import {
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
} from 'lucide-react';
import { useLang } from '../i18n/LangContext';

function PrendreRdv() {
    const { t } = useLang();
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
    const planning = usePlanning();
    const { slots: creneaux, loading: slotsLoading, error: slotsError, refresh: refreshSlots } = useAvailableSlots(form.dateRdv);
    const [loading, setLoading] = useState(false);
    const [erreur, setErreur] = useState(null);
    const [succes, setSucces] = useState(null);
    const [assistantOuvert, setAssistantOuvert] = useState(false);
    const [erreurPdf, setErreurPdf] = useState('');
    const pdfAutomatique = useRef(null);

    const telechargerPdf = async () => {
        try { await downloadRendezVousPdf(succes); setErreurPdf(''); }
        catch (err) { console.error('Téléchargement du PDF impossible', err); setErreurPdf(err.message || t("Le téléchargement du PDF a échoué.")); }
    };

    useEffect(() => {
        if (!succes?.id || pdfAutomatique.current === succes.id) return;
        pdfAutomatique.current = succes.id;
        if (succes.clientAccessToken) localStorage.setItem(`rdv-access-${succes.id}`, succes.clientAccessToken);
        telechargerPdf();
    // Une seule tentative automatique après la création du rendez-vous.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [succes?.id]);

    useEffect(() => {
        axiosClient.get('/rdv/form-options').then(res => setServices(res.data.services || [])).catch(() => {
            axiosClient.get('/services').then(res => setServices(res.data)).catch(() => {});
        });
    }, []);

    // Le créneau choisi n'est conservé que s'il est encore libre : si quelqu'un d'autre le réserve entre-temps, il disparaît.
    const heureChoisie = creneaux.includes(form.heureRdv) ? form.heureRdv : '';
    const creneauPerdu = Boolean(form.heureRdv) && !heureChoisie && !slotsLoading && Boolean(form.dateRdv);

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
                // Même nom déjà réservé il y a moins de 3 jours : on indique le rendez-vous existant et la date de la prochaine réservation possible.
                const jourFr = iso => String(iso).slice(0, 10).split('-').reverse().join('/');
                setErreur(t("Une réservation existe déjà à ce nom (rendez-vous du {date} à {heure}). Une nouvelle réservation sera possible à partir du {dispo}, ou dès que la première est annulée dans « Mes RDV ».",
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
            <div className="min-h-screen bg-gradient-to-br from-teal-50 via-white to-teal-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 py-16 px-4">
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

                        <div className="bg-gradient-to-br from-teal-50 to-teal-100 dark:from-gray-700 dark:to-gray-700 rounded-2xl p-6 text-left space-y-3 mb-8">
                            <div className="flex justify-between items-center">
                                <span className="text-gray-500 dark:text-gray-400 text-sm">{t("Nom")}</span>
                                <span className="font-bold text-gray-800 dark:text-white">{succes.nomClient}</span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-gray-500 dark:text-gray-400 text-sm">{t("Date")}</span>
                                <span className="font-bold text-gray-800 dark:text-white">{succes.dateRdv}</span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-gray-500 dark:text-gray-400 text-sm">{t("Heure")}</span>
                                <span className="font-bold text-teal-600 dark:text-teal-400 text-lg">{succes.heureRdv}</span>
                            </div>
                        </div>

                        <div className="grid gap-3 md:grid-cols-3">
                            <button onClick={telechargerPdf} className="flex-1 rounded-xl bg-teal-700 py-3 font-semibold text-white hover:bg-teal-800">{t("Télécharger le PDF")}</button>
                            <button onClick={() => printReceipt(succes)} className="flex-1 rounded-xl border border-teal-200 py-3 font-semibold text-teal-800 hover:bg-teal-50">{t("Imprimer le reçu")}</button>
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
        <div className="bg-white dark:bg-gray-900 transition-colors">

            {/* ========== HERO ========== */}
            <section className="relative bg-gradient-to-br from-teal-600 via-teal-700 to-teal-800 dark:from-teal-700 dark:to-teal-900 py-16 overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-white rounded-full mix-blend-overlay filter blur-3xl opacity-10"></div>
                <div className="absolute bottom-0 left-0 w-64 h-64 bg-white rounded-full mix-blend-overlay filter blur-3xl opacity-10"></div>

                <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center gap-2 text-sm text-teal-100 mb-6">
                        <Link to="/" className="hover:text-white transition">{t("Accueil")}</Link>
                        <ChevronRight className="w-4 h-4" />
                        <span className="text-white font-medium">{t("Prendre RDV")}</span>
                    </div>

                    <div className="text-center">
                        <span className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-sm text-white border border-white/30 px-4 py-2 rounded-full text-sm font-semibold mb-4">
                            <Calendar className="w-4 h-4" />
                            {t("Réservation en ligne")}
                        </span>
                        <Editable id="rdv.hero.titre" as="h1" className="text-4xl md:text-5xl font-bold text-white mb-4">Prenez votre rendez-vous</Editable>
                        <Editable id="rdv.hero.texte" as="p" className="text-lg text-teal-100 max-w-2xl mx-auto">Remplissez le formulaire en 2 minutes. Confirmation par SMS.</Editable>
                    </div>
                </div>
            </section>

            {/* ========== ÉTAPES ========== */}
            <section className="py-8 bg-teal-50 dark:bg-gray-800">
                <div className="max-w-4xl mx-auto px-4">
                    <div className="grid grid-cols-3 gap-4 text-center">
                        {[
                            { num: '1', label: t("Vos infos"), active: true },
                            { num: '2', label: t("Date"), active: !!form.nomClient },
                            { num: '3', label: t("Heure"), active: !!form.dateRdv },
                        ].map((etape, i) => (
                            <div key={i} className="flex flex-col items-center">
                                <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold mb-2 transition ${
                                    etape.active
                                        ? 'bg-teal-600 text-white'
                                        : 'bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-400'
                                }`}>
                                    {etape.num}
                                </div>
                                <span className={`text-sm font-medium ${
                                    etape.active ? 'text-teal-700 dark:text-teal-400' : 'text-gray-500'
                                }`}>
                                    {etape.label}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ========== FORMULAIRE ========== */}
            <section className="py-12 bg-white dark:bg-gray-900">
                <div className="max-w-3xl mx-auto px-4">

                    {erreur && (
                        <div className="bg-red-50 dark:bg-red-900/20 border-l-4 border-red-500 rounded-xl p-4 mb-6 flex items-start gap-3">
                            <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                            <div>
                                <p className="font-semibold text-red-700 dark:text-red-400">{t("Erreur")}</p>
                                <p className="text-sm text-red-600 dark:text-red-300">{t(erreur)}</p>
                            </div>
                        </div>
                    )}

                    <form onSubmit={onSubmit} className="bg-white dark:bg-gray-800 rounded-3xl shadow-xl border border-gray-100 dark:border-gray-700 overflow-hidden">

                        {/* ========== SECTION 1 : INFORMATIONS ========== */}
                        <div className="p-6 md:p-8 border-b border-gray-100 dark:border-gray-700">
                            <div className="flex items-center gap-3 mb-6">
                                <div className="w-12 h-12 bg-gradient-to-br from-teal-500 to-teal-700 rounded-xl flex items-center justify-center shadow-lg">
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
                                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                                        {t("Nom complet *")}
                                    </label>
                                    <input
                                        type="text"
                                        name="nomClient"
                                        value={form.nomClient}
                                        onChange={onChange}
                                        required
                                        placeholder={t("Ex: Ahmed Benali")}
                                        className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-800 dark:text-white focus:border-teal-500 focus:outline-none transition"
                                    />
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                                            {t("Âge *")}
                                        </label>
                                        <input
                                            type="number"
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
                                        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                                            {t("Téléphone *")}
                                        </label>
                                        <div className="relative">
                                            <Phone className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                                            <input
                                                type="tel"
                                                name="telephoneClient"
                                                value={form.telephoneClient}
                                                onChange={onChange}
                                                required
                                                placeholder="034 12 345 67"
                                                inputMode="tel"
                                                autoComplete="tel"
                                                maxLength={20}
                                                className="w-full pl-10 pr-4 py-3 rounded-xl border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-800 dark:text-white focus:border-teal-500 focus:outline-none transition"
                                            />
                                        </div>
                                        <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">{t("Exemple : 034 12 345 67")}</p>
                                    </div>
                                </div>

                                {services.length > 0 && (
                                    <div>
                                        <label htmlFor="serviceId" className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">{t("Service souhaité (facultatif)")}</label>
                                        <select id="serviceId" name="serviceId" value={form.serviceId} onChange={onChange} className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-800 dark:text-white focus:border-teal-500 focus:outline-none transition">
                                            <option value="">{t("Je ne sais pas encore")}</option>
                                            {services.map(service => <option key={service.id} value={service.id}>{t(service.nom)}</option>)}
                                        </select>
                                    </div>
                                )}

                                <div>
                                    <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                                        <label htmlFor="motif" className="block text-sm font-semibold text-gray-700 dark:text-gray-300">{t("Motif du rendez-vous")}</label>
                                        <button type="button" onClick={() => setAssistantOuvert(true)} className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-teal-600 to-teal-700 px-4 py-2 text-sm font-bold text-white shadow-md transition hover:from-teal-700 hover:to-teal-800"><Bot className="h-4 w-4" />{t("Aidez-moi à préciser mon motif")}</button>
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
                                <div className="w-12 h-12 bg-gradient-to-br from-teal-500 to-teal-700 rounded-xl flex items-center justify-center shadow-lg">
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

                            <input
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
                                    <div className="w-12 h-12 bg-gradient-to-br from-teal-500 to-teal-700 rounded-xl flex items-center justify-center shadow-lg">
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
                                    <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2">
                                        {creneaux.map(h => {
                                            return (
                                                <button
                                                    key={h}
                                                    type="button"
                                                    onClick={() => setForm({ ...form, heureRdv: h })}
                                                    className={`py-3 rounded-xl text-sm font-bold transition-all ${
                                                        heureChoisie === h
                                                            ? 'bg-teal-600 text-white shadow-lg scale-105'
                                                            : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-teal-100 dark:hover:bg-gray-600 hover:scale-105'
                                                    }`}
                                                >
                                                    {h}
                                                </button>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>
                        )}

                        {/* ========== BOUTON ========== */}
                        <div className="p-6 md:p-8 bg-gray-50 dark:bg-gray-800/50">
                            <button
                                type="submit"
                                disabled={loading || !heureChoisie}
                                className="w-full bg-gradient-to-r from-teal-600 to-teal-700 text-white py-4 rounded-xl font-bold text-lg hover:from-teal-700 hover:to-teal-800 transition-all shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
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
                            <p className="text-center text-xs text-gray-400 dark:text-gray-500 mt-4">
                                {t("Sans inscription · Confirmation par SMS · Annulation gratuite")}
                            </p>
                        </div>
                    </form>
                </div>
            </section>
            {assistantOuvert && <MotifAssistant services={services} onApply={appliquerMotif} onClose={() => setAssistantOuvert(false)} />}
        </div>
    );
}

export default PrendreRdv;
