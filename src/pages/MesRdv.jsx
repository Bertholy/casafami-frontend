import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import axiosClient from '../api/axiosClient';
import { apiErrorMessage, hasSession } from '../utils/auth';
import { formatPhone } from '../utils/phone';
import Editable from '../components/site/Editable';
import QrCode from '../components/QrCode';
import { downloadReceiptImage } from '../utils/receipt';
import { downloadRendezVousPdf } from '../api/rendezVousPdf';
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
    Image as ImageIcon,
    ScanLine,
    CalendarCheck,
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
    const { t } = useLang();
    const [searchParams] = useSearchParams();
    const personnel = hasSession();
    const [saisie, setSaisie] = useState('');
    const [rdvs, setRdvs] = useState(null);
    const [loading, setLoading] = useState(false);
    const [erreur, setErreur] = useState(null);

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
        if (!window.confirm(t("Annuler ce RDV ?"))) return;
        setErreur(null);
        try {
            // La clé de suivi prouve que le rendez-vous est bien celui de ce visiteur (le personnel connecté en est dispensé).
            const res = await axiosClient.put(`/rdv/${rdv.id}/annuler`, null, { headers: rdv.cleSuivi ? { 'X-RDV-Access-Token': rdv.cleSuivi } : {} });
            setRdvs(current => current.map(r => r.id === rdv.id ? { ...r, ...res.data, motif: r.motif } : r));
        } catch (err) {
            setErreur(err.response?.status === 403
                ? t("Annulation impossible. Contactez le cabinet pour annuler ce rendez-vous.")
                : apiErrorMessage(err, t("Impossible d'annuler")));
        }
    };

    // Le reçu n'est jamais téléchargé automatiquement : le patient le demande lui-même.
    const telecharger = async (rdv) => {
        setErreur(null);
        try { await downloadRendezVousPdf(rdv); }
        catch (err) { setErreur(err.message || t("Le téléchargement du PDF a échoué.")); }
    };

    const telechargerImage = async (rdv) => {
        setErreur(null);
        try { await downloadReceiptImage(rdv); }
        catch (err) { console.error('Création de l’image impossible', err); setErreur(t("Le téléchargement de l’image a échoué.")); }
    };

    // Couleur + libellé selon statut
    const statutInfo = (statut) => {
        switch (statut) {
            case 'EN_ATTENTE':
                return {
                    label: t("En attente"),
                    classes: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
                    border: 'border-l-yellow-500',
                    Icon: Clock,
                };
            case 'CONFIRME':
                return {
                    label: t("Confirmé"),
                    classes: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
                    border: 'border-l-green-500',
                    Icon: CheckCircle,
                };
            case 'ANNULE':
                return {
                    label: t("Annulé"),
                    classes: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
                    border: 'border-l-red-500',
                    Icon: XCircle,
                };
            case 'TERMINE':
                return {
                    label: t("Terminé"),
                    classes: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300',
                    border: 'border-l-gray-500',
                    Icon: CheckCircle,
                };
            default:
                return {
                    label: statut,
                    classes: 'bg-gray-100 text-gray-800',
                    border: 'border-l-gray-500',
                    Icon: Clock,
                };
        }
    };

    const champ = (libelle, valeur) => (
        <div>
            <dt className="text-xs uppercase tracking-wide text-slate-500 dark:text-gray-400">{libelle}</dt>
            <dd className="font-semibold text-slate-800 dark:text-gray-100">{valeur}</dd>
        </div>
    );

    return (
        <div className="bg-linear-to-br from-teal-50 via-white to-blue-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 min-h-screen">

            {/* ========== HERO ========== */}
            <section className="bg-linear-to-r from-teal-600 to-teal-700 dark:from-teal-700 dark:to-teal-800 py-12">
                <div className="max-w-2xl mx-auto px-4 text-center">
                    <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center mx-auto mb-4 border border-white/30 shadow-lg">
                        <Calendar className="w-8 h-8 text-white" />
                    </div>
                    <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">
                        {t("Mes rendez-vous")}
                    </h1>
                    <p className="text-teal-100">
                        <Editable id="mesrdv.hero.cle">Entrez la clé de suivi reçue lors de votre prise de rendez-vous, ou scannez votre QR code</Editable>
                    </p>
                </div>
            </section>

            <div className="max-w-4xl mx-auto px-4 py-8">

                {/* ========== RECHERCHE PAR CLÉ ========== */}
                <form
                    onSubmit={rechercher}
                    className="mx-auto mb-6 max-w-2xl rounded-2xl border border-teal-100 bg-white p-6 shadow-lg dark:border-gray-700 dark:bg-gray-800"
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
                            className="bg-linear-to-r from-teal-600 to-teal-700 text-white px-6 py-3 rounded-xl font-bold hover:from-teal-700 hover:to-teal-800 transition disabled:opacity-50 flex items-center justify-center gap-2 shadow-md"
                        >
                            {loading ? (
                                <Loader2 className="w-5 h-5 animate-spin" />
                            ) : (
                                <ClipboardList className="w-5 h-5" />
                            )}
                            {t("Chercher")}
                        </button>
                    </div>
                    <p className="mt-3 text-xs text-gray-500 dark:text-gray-400">{t("Votre clé de suivi figure sur la page de confirmation et sur le reçu. Scannez le QR code avec votre téléphone pour ouvrir directement votre rendez-vous. Clé perdue ? Contactez le cabinet.")}</p>
                </form>

                {/* ========== ERREUR ========== */}
                {erreur && (
                    <div role="alert" className="bg-red-50 dark:bg-red-900/20 border-l-4 border-red-500 rounded-xl p-4 mb-6 text-red-700 dark:text-red-400 text-sm shadow-sm">
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
                                <li key={titre} className="rounded-2xl border border-teal-100 bg-white p-4 text-center shadow-sm dark:border-gray-700 dark:bg-gray-800">
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
                            <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 text-center border border-gray-100 dark:border-gray-700 shadow-sm">
                                <div className="w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <ClipboardList className="w-8 h-8 text-gray-400" />
                                </div>
                                <p className="text-gray-600 dark:text-gray-400 mb-4 font-semibold">
                                    {t("Aucun RDV trouvé")}
                                </p>
                                <Link
                                    to="/prendre-rdv"
                                    className="inline-flex items-center gap-2 bg-linear-to-r from-teal-600 to-teal-700 text-white px-5 py-2 rounded-xl font-semibold hover:from-teal-700 hover:to-teal-800 transition shadow-md"
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
                                            <article key={rdv.id} className={`rounded-2xl border border-l-4 border-slate-200 bg-white p-5 shadow-sm dark:border-gray-700 dark:bg-gray-800 ${statut.border}`}>
                                                <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
                                                    <div className="min-w-0 flex-1">
                                                        <div className="mb-4 flex flex-wrap items-center gap-3">
                                                            <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold ${statut.classes}`}><StatusIcon className="h-3 w-3" />{statut.label}</span>
                                                            {rdv.cleSuivi && <span className="select-all font-mono text-sm font-bold tracking-widest text-teal-800 dark:text-teal-300">{rdv.cleSuivi}</span>}
                                                        </div>
                                                        <dl className="grid grid-cols-2 gap-x-6 gap-y-3 text-sm">
                                                            {champ(t("Patient"), rdv.nomClient)}
                                                            {champ(t("Téléphone"), formatPhone(rdv.telephoneClient))}
                                                            {champ(t("Date"), rdv.dateRdv)}
                                                            {champ(t("Heure"), rdv.heureRdv?.slice(0, 5))}
                                                            {champ(t("Avec"), rdv.praticienNom || <span className="font-normal text-slate-400">{t("À préciser")}</span>)}
                                                            {personnel && champ(t("Motif"), rdv.motif || '—')}
                                                        </dl>
                                                    </div>
                                                    {rdv.cleSuivi && (
                                                        <div className="flex flex-col items-center gap-1 self-center sm:self-start">
                                                            <QrCode value={lienSuivi(rdv.cleSuivi)} size={110} label={t("QR code de votre rendez-vous")} className="border border-slate-200" />
                                                            <p className="max-w-36 text-center text-xs text-slate-500 dark:text-gray-400">{t("Scannez pour ouvrir ce rendez-vous sur votre téléphone")}</p>
                                                        </div>
                                                    )}
                                                </div>
                                                <div className="mt-5 flex flex-wrap gap-2 border-t border-slate-100 pt-4 dark:border-gray-700">
                                                    <button type="button" onClick={() => telecharger(rdv)} className="inline-flex items-center gap-2 rounded-lg bg-teal-700 px-3 py-2 text-xs font-semibold text-white hover:bg-teal-800"><FileDown className="h-4 w-4" />{t("Télécharger en PDF")}</button>
                                                    <button type="button" onClick={() => telechargerImage(rdv)} className="inline-flex items-center gap-2 rounded-lg border border-teal-200 px-3 py-2 text-xs font-semibold text-teal-800 hover:bg-teal-50 dark:border-gray-600 dark:text-teal-300 dark:hover:bg-gray-700"><ImageIcon className="h-4 w-4" />{t("Télécharger en image")}</button>
                                                    {peutAnnuler && <button type="button" onClick={() => annuler(rdv)} className="rounded-lg bg-rose-600 px-3 py-2 text-xs font-semibold text-white hover:bg-rose-700">{t("Annuler")}</button>}
                                                </div>
                                                {tropTard && <p className="mt-3 text-xs text-amber-700 dark:text-amber-300">{t("L’annulation n’est plus possible à moins de 2 heures du rendez-vous. Contactez le cabinet.")}</p>}
                                            </article>
                                        );
                                    })}
                                </div>

                                {/* CTA bas de page */}
                                <div className="text-center mt-8">
                                    <Link
                                        to="/prendre-rdv"
                                        className="inline-flex items-center gap-2 bg-linear-to-r from-teal-600 to-teal-700 text-white px-6 py-3 rounded-xl font-bold hover:from-teal-700 hover:to-teal-800 transition shadow-lg"
                                    >
                                        <Calendar className="w-5 h-5" />
                                        {t("Prendre un nouveau rendez-vous")}
                                    </Link>
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}

export default MesRdv;
