import { useEffect, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import axiosClient from '../api/axiosClient';
import { apiErrorMessage, hasSession } from '../utils/auth';
import { formatPhone } from '../utils/phone';
import Editable from '../components/site/Editable';
import QrCode from '../components/QrCode';
import ConfirmDialog from '../components/ConfirmDialog';
import BoutonScanQr from '../components/BoutonScanQr';
import BoutonTelecharger from '../components/BoutonTelecharger';
import { estUneCleComplete, formaterCle, lienSuivi } from '../utils/suivi';
import {
    Calendar,
    Loader2,
    XCircle,
    ClipboardList,
    Clock,
    CheckCircle,
    KeyRound,
    FileDown,
    Search,
    ScanLine,
    CalendarCheck,
    Copy,
    Check,
    CalendarDays,
    User,
    Phone,
    Stethoscope,
    MessageSquareText,
} from 'lucide-react';
import { useLang } from '../i18n/LangContext';

// Un patient retrouve son rendez-vous avec sa clé de suivi, jamais avec son nom ni son numéro.
// Le personnel connecté peut encore chercher par nom ou numéro (même recherche que dans le dossier patient).
const trouver = (terme, personnel) => {
    if (personnel && !estUneCleComplete(terme)) return axiosClient.get('/rdv/recherche', { params: { q: terme } }).then(({ data }) => data);
    return axiosClient.get(`/rdv/suivi/${encodeURIComponent(terme)}`).then(({ data }) => [data]);
};

// Un patient ne peut plus annuler son rendez-vous dans les 2 dernières heures (le serveur applique la même règle ; le personnel n'est pas concerné).
const DELAI_ANNULATION_HEURES = 2;
const annulationTropTardive = rdv => {
    const debut = new Date(`${rdv.dateRdv}T${String(rdv.heureRdv).slice(0, 5)}:00+03:00`); // heure du cabinet (Antananarivo)
    return Date.now() >= debut.getTime() - DELAI_ANNULATION_HEURES * 3600 * 1000;
};

function MesRdv() {
    const { t, lang } = useLang();
    const [searchParams, setSearchParams] = useSearchParams();
    const personnel = hasSession();
    const [saisie, setSaisie] = useState('');
    const [rdvs, setRdvs] = useState(null);
    const [loading, setLoading] = useState(false);
    const [erreur, setErreur] = useState(null);
    const [aAnnuler, setAAnnuler] = useState(null);
    const [annulationEnCours, setAnnulationEnCours] = useState(false);
    const [cleCopiee, setCleCopiee] = useState(null);
    const resultatsRef = useRef(null);

    // Les résultats (ou l'erreur) apparaissent sous le formulaire : on y amène la personne, surtout sur téléphone.
    useEffect(() => {
        if (rdvs || erreur) resultatsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, [rdvs, erreur]);

    useEffect(() => {
        // ?cle= vient du QR code ; ?q= vient de la recherche de patients du personnel.
        const terme = searchParams.get('cle') || searchParams.get('q');
        if (!terme) return undefined;
        let cancelled = false;
        const timer = setTimeout(() => {
            setSaisie(searchParams.get('cle') ? formaterCle(terme) : terme);
            setLoading(true);
            trouver(terme, personnel)
                .then(data => { if (!cancelled) setRdvs(data); })
                .catch(err => { if (!cancelled) setErreur(apiErrorMessage(err, 'Impossible de retrouver ce rendez-vous.')); })
                .finally(() => { if (!cancelled) setLoading(false); });
        }, 0);
        return () => { cancelled = true; clearTimeout(timer); };
    }, [searchParams, personnel]);

    const rechercher = async (e) => {
        e.preventDefault();
        setErreur(null);
        const terme = saisie.trim();
        if (terme.length < 3) {
            setRdvs(null);
            setErreur(t("Saisissez votre clé de suivi, par exemple CF-7K3M-9QX2."));
            return;
        }
        setLoading(true);
        setRdvs(null);

        try {
            setRdvs(await trouver(terme, personnel));
        } catch (err) {
            console.error('Recherche du rendez-vous impossible', err);
            setErreur(apiErrorMessage(err, t("Impossible de retrouver ce rendez-vous. Vérifiez votre connexion et réessayez.")));
        } finally {
            setLoading(false);
        }
    };

    const annuler = async (rdv) => {
        setErreur(null);
        setAnnulationEnCours(true);
        try {
            // La clé de suivi prouve que le rendez-vous est bien celui de ce visiteur (le personnel connecté en est dispensé).
            const res = await axiosClient.put(`/rdv/${rdv.id}/annuler`, null, { headers: rdv.cleSuivi ? { 'X-RDV-Access-Token': rdv.cleSuivi } : {} });
            setRdvs(current => current.map(r => r.id === rdv.id ? { ...r, ...res.data, motif: r.motif } : r));
        } catch (err) {
            setErreur(err.response?.status === 403
                ? t("Annulation impossible. Contactez le cabinet pour annuler ce rendez-vous.")
                : apiErrorMessage(err, t("Impossible d'annuler")));
        } finally {
            setAnnulationEnCours(false);
            setAAnnuler(null);
        }
    };

    const copierCle = async (cle) => {
        try { await navigator.clipboard.writeText(cle); setCleCopiee(cle); window.setTimeout(() => setCleCopiee(null), 2000); }
        catch { setCleCopiee(null); }
    };

    // Revient à la recherche : on efface le résultat affiché (et la clé de l'adresse, qui le ferait revenir).
    const autreRecherche = () => {
        setRdvs(null);
        setErreur(null);
        setSaisie('');
        setSearchParams({});
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    // Un rendez-vous retrouvé : on n'affiche plus que lui (carte, reçu, annulation), sans le formulaire de recherche.
    const resultat = Boolean(rdvs && rdvs.length > 0);

    // Couleur + libellé selon statut
    const statutInfo = (statut) => {
        switch (statut) {
            case 'EN_ATTENTE':
                return {
                    label: t("En cours"),
                    classes: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
                    border: 'border-t-yellow-500',
                    Icon: Clock,
                };
            case 'CONFIRME':
                return {
                    label: t("Confirmé"),
                    classes: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
                    border: 'border-t-green-500',
                    Icon: CheckCircle,
                };
            case 'ANNULE':
                return {
                    label: t("Annulé"),
                    classes: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
                    border: 'border-t-red-500',
                    Icon: XCircle,
                };
            case 'TERMINE':
                return {
                    label: t("Terminé"),
                    classes: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300',
                    border: 'border-t-gray-500',
                    Icon: CheckCircle,
                };
            default:
                return {
                    label: statut,
                    classes: 'bg-gray-100 text-gray-800',
                    border: 'border-t-gray-500',
                    Icon: Clock,
                };
        }
    };

    // « vendredi 23 octobre 2026 » plutôt que « 2026-10-23 »
    const dateLisible = iso => {
        const jour = new Date(`${iso}T12:00:00`);
        if (Number.isNaN(jour.getTime())) return iso;
        return jour.toLocaleDateString(lang === 'mg' ? 'mg' : 'fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
    };

    const detail = (Icone, libelle, valeur) => (
        <div className="flex items-start gap-3">
            <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-500 dark:bg-gray-700 dark:text-gray-300"><Icone className="h-4 w-4" aria-hidden="true" /></span>
            <div className="min-w-0">
                <dt className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-gray-400">{libelle}</dt>
                <dd className="truncate font-semibold text-slate-800 dark:text-gray-100">{valeur}</dd>
            </div>
        </div>
    );

    return (
        <div className="min-h-screen">

            {/* ========== HERO ========== */}
            {!resultat && (
            <section className="px-4 pb-2 pt-12">
                <div className="mx-auto max-w-2xl text-center">
                    <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-3xl bg-teal-50 text-teal-600 shadow-[0_0_0_1px_#dce9f0] dark:bg-gray-800 dark:text-teal-300 dark:shadow-none">
                        <Calendar className="h-8 w-8" />
                    </div>
                    <h1 className="mb-3 text-3xl font-extrabold md:text-5xl">
                        {t("Mes rendez-vous")}
                    </h1>
                    <p className="text-lg text-slate-600 dark:text-gray-300">
                        <Editable id="mesrdv.hero.cle">Entrez la clé de suivi reçue lors de votre prise de rendez-vous, ou scannez votre QR code</Editable>
                    </p>
                </div>
            </section>
            )}

            <div className={`max-w-4xl mx-auto px-4 py-8 ${resultat ? 'pt-14' : ''}`}>

                {/* ========== MESSAGE : voici le rendez-vous retrouvé ========== */}
                {resultat && (
                    <div className="mb-8 text-center">
                        <span className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-teal-50 text-teal-600 shadow-[0_0_0_1px_#dce9f0] dark:bg-gray-800 dark:text-teal-300 dark:shadow-none"><CheckCircle className="h-7 w-7" /></span>
                        <h1 className="text-3xl font-extrabold md:text-4xl">{rdvs.length > 1 ? t("Voici vos rendez-vous") : t("Voici votre rendez-vous")}</h1>
                    </div>
                )}

                {/* ========== RECHERCHE PAR CLÉ ========== */}
                {!resultat && (
                <form
                    onSubmit={rechercher}
                    className="mx-auto mb-6 max-w-2xl rounded-2xl border border-teal-100 bg-white p-6 dark:border-gray-700 dark:bg-gray-800"
                >
                    <div className="flex flex-col gap-3 sm:flex-row">
                        <div className="relative flex-1">
                            <KeyRound className="w-5 h-5 text-teal-500 absolute left-4 top-1/2 -translate-y-1/2" />
                            <input
                                type="text"
                                value={saisie}
                                onChange={(e) => setSaisie(personnel ? e.target.value : formaterCle(e.target.value))}
                                required
                                minLength={3}
                                maxLength={100}
                                autoComplete="off"
                                autoCapitalize="characters"
                                spellCheck={false}
                                aria-label={t("Clé de suivi de votre rendez-vous")}
                                placeholder={personnel ? t("Clé de suivi, nom ou numéro (personnel)") : "CF-7K3M-9QX2"}
                                className="w-full pl-12 pr-4 py-3 rounded-xl border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-800 dark:text-white font-mono tracking-wider focus:border-teal-500 focus:outline-none transition"
                            />
                        </div>
                        <button
                            type="submit"
                            disabled={loading}
                            className="mt-btn disabled:opacity-50"
                        >
                            {loading ? (
                                <Loader2 className="w-5 h-5 animate-spin" />
                            ) : (
                                <ClipboardList className="w-5 h-5" />
                            )}
                            {t("Chercher")}
                        </button>
                    </div>
                    <BoutonScanQr onCle={cle => setSearchParams({ cle })} label={t("Scanner le QR code")} className="mt-4 inline-flex items-center gap-2 border-2 border-(--mt-main) px-4 py-2.5 text-sm font-extrabold uppercase tracking-wide text-(--mt-main) transition hover:bg-(--mt-main) hover:text-white">{t("Scanner le QR code")}</BoutonScanQr>
                    <p className="mt-3 text-xs text-gray-500 dark:text-gray-400">{t("Votre clé de suivi figure sur la page de confirmation et sur le reçu. Scannez le QR code avec votre téléphone pour ouvrir directement votre rendez-vous. Clé perdue ? Contactez le cabinet.")}</p>
                </form>
                )}

                <div ref={resultatsRef} className="scroll-mt-28" />
                <p className="sr-only" role="status" aria-live="polite">{rdvs ? (rdvs.length === 0 ? t("Aucun rendez-vous trouvé") : `${rdvs.length} ${rdvs.length > 1 ? t("rendez-vous trouvés") : t("rendez-vous trouvé")}`) : ''}</p>

                {/* ========== ERREUR ========== */}
                {erreur && (
                    <div role="alert" className="bg-red-50 dark:bg-red-900/20 border-l-4 border-red-500 rounded-xl p-4 mb-6 text-red-700 dark:text-red-400 text-sm">
                        {t(erreur)}
                    </div>
                )}

                {/* ========== AIDE : où trouver la clé ========== */}
                {!rdvs && !erreur && !loading && (
                    <section aria-labelledby="aide-cle" className="mx-auto max-w-2xl">
                        <h2 id="aide-cle" className="mb-4 text-center text-lg font-bold text-gray-800 dark:text-white">{t("Où trouver ma clé de suivi ?")}</h2>
                        <ul className="grid gap-3 sm:grid-cols-3">
                            {[
                                [CalendarCheck, t("À la fin de la réservation"), t("Elle s’affiche sur la page de confirmation, avec un QR code.")],
                                [FileDown, t("Sur votre reçu"), t("Elle est écrite en gros sur le reçu PDF ou image que vous avez téléchargé.")],
                                [ScanLine, t("Avec le QR code"), t("Scannez-le avec votre téléphone : votre rendez-vous s’ouvre tout seul.")],
                            ].map(([Icone, titre, texte]) => (
                                <li key={titre} className="rounded-2xl border border-teal-100 bg-white p-4 text-center dark:border-gray-700 dark:bg-gray-800">
                                    <span className="mx-auto mb-3 flex h-11 w-11 items-center justify-center rounded-xl bg-teal-50 text-teal-700 dark:bg-gray-700 dark:text-teal-300"><Icone className="h-5 w-5" /></span>
                                    <p className="text-sm font-semibold text-gray-800 dark:text-white">{titre}</p>
                                    <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">{texte}</p>
                                </li>
                            ))}
                        </ul>
                        <p className="mt-5 text-center text-sm text-gray-500 dark:text-gray-400">{t("Pas encore de rendez-vous ?")} <Link to="/prendre-rdv" className="font-semibold text-teal-700 underline dark:text-teal-300">{t("Prendre un rendez-vous")}</Link></p>
                    </section>
                )}

                {/* ========== RÉSULTATS ========== */}
                {rdvs && (
                    <div>
                        {rdvs.length === 0 ? (
                            <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 text-center border border-gray-100 dark:border-gray-700">
                                <div className="w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <ClipboardList className="w-8 h-8 text-gray-400" />
                                </div>
                                <p className="text-gray-600 dark:text-gray-400 mb-4 font-semibold">
                                    {t("Aucun rendez-vous trouvé")}
                                </p>
                                <Link
                                    to="/prendre-rdv"
                                    className="inline-flex items-center gap-2 bg-linear-to-r from-teal-600 to-teal-700 text-white px-5 py-2 rounded-xl font-semibold hover:from-teal-700 hover:to-teal-800 transition"
                                >
                                    <Calendar className="w-4 h-4" />
                                    {t("Prendre un rendez-vous")}
                                </Link>
                            </div>
                        ) : (
                            <div>
                                {rdvs.length > 1 && (
                                    <p className="text-sm font-semibold text-gray-600 dark:text-gray-400 mb-3">
                                        {rdvs.length} {t("rendez-vous trouvés")}
                                    </p>
                                )}

                                <div className="space-y-4">
                                    {rdvs.map(rdv => {
                                        const statut = statutInfo(rdv.statut);
                                        const StatusIcon = statut.Icon;
                                        const annulable = rdv.statut === 'EN_ATTENTE' || rdv.statut === 'CONFIRME';
                                        const tropTard = annulable && !personnel && annulationTropTardive(rdv);
                                        const peutAnnuler = annulable && !tropTard;
                                        return (
                                            <article key={rdv.id} className={`overflow-hidden rounded-2xl border border-t-4 border-x-slate-200 border-b-slate-200 bg-white shadow-sm dark:border-x-gray-700 dark:border-b-gray-700 dark:bg-gray-800 ${statut.border}`}>
                                                <div className="flex flex-col gap-6 p-5 sm:flex-row sm:items-start sm:justify-between sm:p-6">
                                                    <div className="min-w-0 flex-1">
                                                        <div className="mb-5 flex flex-wrap items-center gap-3">
                                                            <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold ${statut.classes}`}><StatusIcon className="h-3.5 w-3.5" />{statut.label}</span>
                                                            {rdv.cleSuivi && (
                                                                <span className="inline-flex items-center gap-1 rounded-lg bg-teal-50 py-0.5 pl-3 pr-1 dark:bg-gray-700">
                                                                    <span className="select-all font-mono text-sm font-bold tracking-widest text-teal-800 dark:text-teal-300">{rdv.cleSuivi}</span>
                                                                    <button type="button" onClick={() => copierCle(rdv.cleSuivi)} aria-label={t("Copier la clé")} className="rounded-md p-1.5 text-teal-700 transition hover:bg-white dark:text-teal-300 dark:hover:bg-gray-600">{cleCopiee === rdv.cleSuivi ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}</button>
                                                                </span>
                                                            )}
                                                        </div>
                                                        <div className="mb-5 grid gap-3 sm:grid-cols-[1fr_auto]">
                                                            <div className="flex items-center gap-3 rounded-xl bg-teal-50/70 px-4 py-3 dark:bg-gray-700/50">
                                                                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white text-teal-700 shadow-sm dark:bg-gray-800 dark:text-teal-300"><CalendarDays className="h-5 w-5" aria-hidden="true" /></span>
                                                                <div className="min-w-0">
                                                                    <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-gray-400">{t("Date")}</p>
                                                                    <p className="font-bold leading-snug text-slate-900 first-letter:uppercase dark:text-white">{dateLisible(rdv.dateRdv)}</p>
                                                                </div>
                                                            </div>
                                                            <div className="flex items-center gap-3 rounded-xl bg-teal-50/70 px-4 py-3 dark:bg-gray-700/50">
                                                                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white text-teal-700 shadow-sm dark:bg-gray-800 dark:text-teal-300"><Clock className="h-5 w-5" aria-hidden="true" /></span>
                                                                <div>
                                                                    <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-gray-400">{t("Heure")}</p>
                                                                    <p className="text-xl font-extrabold leading-none tabular-nums text-slate-900 dark:text-white">{rdv.heureRdv?.slice(0, 5)}</p>
                                                                </div>
                                                            </div>
                                                        </div>
                                                        <dl className="grid gap-x-6 gap-y-4 text-sm sm:grid-cols-2">
                                                            {detail(User, t("Patient"), rdv.nomClient)}
                                                            {detail(Phone, t("Téléphone"), formatPhone(rdv.telephoneClient))}
                                                            {detail(Stethoscope, t("Avec"), rdv.praticienNom || <span className="font-normal text-slate-400">{t("À préciser")}</span>)}
                                                            {personnel && detail(MessageSquareText, t("Motif"), rdv.motif || '—')}
                                                        </dl>
                                                    </div>
                                                    {rdv.cleSuivi && (
                                                        <div className="flex flex-col items-center gap-2 self-center rounded-2xl bg-slate-50 p-4 dark:bg-gray-700/40 sm:self-start">
                                                            <QrCode value={lienSuivi(rdv.cleSuivi)} size={128} label={t("Code à scanner de votre rendez-vous")} className="rounded-lg border border-slate-200" />
                                                            <p className="max-w-36 text-center text-xs text-slate-500 dark:text-gray-400">{t("Scannez pour ouvrir ce rendez-vous sur votre téléphone")}</p>
                                                        </div>
                                                    )}
                                                </div>
                                                <div className="flex flex-wrap items-center gap-2 border-t border-slate-100 bg-slate-50/60 px-5 py-3.5 dark:border-gray-700 dark:bg-gray-900/20 sm:px-6">
                                                    <BoutonTelecharger rdv={rdv} onDebut={() => setErreur(null)} onErreur={setErreur} className="rounded-lg bg-teal-700 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-teal-800" />
                                                    {peutAnnuler && <button type="button" onClick={() => setAAnnuler(rdv)} className="inline-flex items-center gap-2 rounded-lg border border-rose-200 bg-white px-4 py-2.5 text-sm font-semibold text-rose-700 transition hover:bg-rose-50 dark:border-rose-500/40 dark:bg-transparent dark:text-rose-300 dark:hover:bg-rose-500/10"><XCircle className="h-4 w-4" aria-hidden="true" />{t("Annuler")}</button>}
                                                    {tropTard && <p className="basis-full text-xs text-amber-700 dark:text-amber-300 sm:basis-auto sm:flex-1 sm:text-right">{t("L’annulation n’est plus possible à moins de 2 heures du rendez-vous. Contactez le cabinet.")}</p>}
                                                </div>
                                            </article>
                                        );
                                    })}
                                </div>

                                {/* bas de page : chercher un autre rendez-vous à gauche, en prendre un nouveau à droite */}
                                <div className="mt-8 flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between">
                                    <button type="button" onClick={autreRecherche} className="mt-btn-ligne justify-center">
                                        <Search className="h-4 w-4" />
                                        {t("Rechercher un autre rendez-vous")}
                                    </button>
                                    <Link to="/prendre-rdv" className="mt-btn justify-center">
                                        <Calendar className="h-4 w-4" />
                                        {t("Prendre un nouveau rendez-vous")}
                                    </Link>
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>

            {aAnnuler && (
                <ConfirmDialog
                    titre={t("Annuler ce rendez-vous ?")}
                    message={t("Votre rendez-vous du {date} à {heure} sera annulé. Cette action est définitive.", { date: String(aAnnuler.dateRdv).split('-').reverse().join('/'), heure: String(aAnnuler.heureRdv).slice(0, 5) })}
                    confirmer={t("Oui, annuler")}
                    retour={t("Non, le garder")}
                    enCours={annulationEnCours}
                    onConfirm={() => annuler(aAnnuler)}
                    onCancel={() => setAAnnuler(null)}
                />
            )}
        </div>
    );
}

export default MesRdv;
