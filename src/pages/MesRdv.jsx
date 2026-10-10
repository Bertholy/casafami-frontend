import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import axiosClient from '../api/axiosClient';
import { apiErrorMessage, hasSession } from '../utils/auth';
import { formatPhone } from '../utils/phone';
import Editable from '../components/site/Editable';
import { downloadReceiptPdf, printReceipt } from '../utils/receipt';
import {
    Search,
    Calendar,
    Loader2,
    XCircle,
    ClipboardList,
    Clock,
    CheckCircle,
} from 'lucide-react';

function MesRdv() {
    const [searchParams] = useSearchParams();
    const [recherche, setRecherche] = useState('');
    const [rdvs, setRdvs] = useState(null);
    const [loading, setLoading] = useState(false);
    const [erreur, setErreur] = useState(null);

    useEffect(() => {
        const numero = searchParams.get('q') || searchParams.get('telephone');
        if (!numero) return undefined;
        let cancelled = false;
        const timer = setTimeout(() => {
            setRecherche(numero);
            setLoading(true);
            axiosClient.get('/rdv/recherche', { params: { q: numero } })
                .then(({ data }) => { if (!cancelled) setRdvs(data); })
                .catch(err => { if (!cancelled) setErreur(apiErrorMessage(err, 'Impossible d’afficher les rendez-vous de ce patient.')); })
                .finally(() => { if (!cancelled) setLoading(false); });
        }, 0);
        return () => { cancelled = true; clearTimeout(timer); };
    }, [searchParams]);

    const rechercher = async (e) => {
        e.preventDefault();
        setErreur(null);
        const terme = recherche.trim();
        if (terme.length < 3) {
            setRdvs(null);
            setErreur('Saisissez votre numéro de téléphone ou votre nom complet.');
            return;
        }
        setLoading(true);
        setRdvs(null);

        try {
            const res = await axiosClient.get('/rdv/recherche', { params: { q: terme } });
            setRdvs(res.data);
        } catch (err) {
            console.error('Recherche des rendez-vous impossible', err);
            setErreur(apiErrorMessage(err, 'Impossible de rechercher les rendez-vous. Vérifiez votre connexion et réessayez.'));
        } finally {
            setLoading(false);
        }
    };

    const annuler = async (id) => {
        if (!window.confirm('Annuler ce RDV ?')) return;
        setErreur(null);
        try {
            // Le jeton remis à la création prouve que le rendez-vous est bien celui de ce visiteur (le personnel connecté en est dispensé).
            const token = localStorage.getItem(`rdv-access-${id}`);
            const res = await axiosClient.put(`/rdv/${id}/annuler`, null, { headers: token ? { 'X-RDV-Access-Token': token } : {} });
            setRdvs(current => current.map(r => r.id === id ? { ...r, ...res.data, motif: r.motif } : r));
        } catch (err) {
            setErreur(err.response?.status === 403
                ? 'Annulation impossible depuis cet appareil. Contactez le cabinet pour annuler ce rendez-vous.'
                : apiErrorMessage(err, "Impossible d'annuler"));
        }
    };

    // Couleur + libellé selon statut
    const statutInfo = (statut) => {
        switch (statut) {
            case 'EN_ATTENTE':
                return {
                    label: 'En attente',
                    classes: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
                    border: 'border-l-yellow-500',
                    bg: 'bg-yellow-50 dark:bg-yellow-900/10',
                    Icon: Clock,
                };
            case 'CONFIRME':
                return {
                    label: 'Confirmé',
                    classes: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
                    border: 'border-l-green-500',
                    bg: 'bg-green-50 dark:bg-green-900/10',
                    Icon: CheckCircle,
                };
            case 'ANNULE':
                return {
                    label: 'Annulé',
                    classes: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
                    border: 'border-l-red-500',
                    bg: 'bg-red-50 dark:bg-red-900/10',
                    Icon: XCircle,
                };
            case 'TERMINE':
                return {
                    label: 'Terminé',
                    classes: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300',
                    border: 'border-l-gray-500',
                    bg: 'bg-gray-50 dark:bg-gray-900/10',
                    Icon: CheckCircle,
                };
            default:
                return {
                    label: statut,
                    classes: 'bg-gray-100 text-gray-800',
                    border: 'border-l-gray-500',
                    bg: 'bg-gray-50',
                    Icon: Clock,
                };
        }
    };

    return (
        <div className="bg-gradient-to-br from-teal-50 via-white to-blue-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 min-h-screen">

            {/* ========== HERO ========== */}
            <section className="bg-gradient-to-r from-teal-600 to-teal-700 dark:from-teal-700 dark:to-teal-800 py-12">
                <div className="max-w-2xl mx-auto px-4 text-center">
                    <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center mx-auto mb-4 border border-white/30 shadow-lg">
                        <Calendar className="w-8 h-8 text-white" />
                    </div>
                    <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">
                        Mes rendez-vous
                    </h1>
                    <p className="text-teal-100">
                        <Editable id="mesrdv.hero.texte">Entrez votre numéro de téléphone ou votre nom pour retrouver vos rendez-vous</Editable>
                    </p>
                </div>
            </section>

            <div className="max-w-2xl mx-auto px-4 py-8">

                {/* ========== RECHERCHE ========== */}
                <form
                    onSubmit={rechercher}
                    className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 mb-6 border border-teal-100 dark:border-gray-700"
                >
                    <div className="flex gap-3">
                        <div className="relative flex-1">
                            <Search className="w-5 h-5 text-teal-500 absolute left-4 top-1/2 -translate-y-1/2" />
                            <input
                                type="search"
                                value={recherche}
                                onChange={(e) => setRecherche(e.target.value)}
                                required
                                minLength={3}
                                maxLength={100}
                                aria-label="Votre numéro de téléphone ou votre nom complet"
                                placeholder="034 12 345 67 ou votre nom"
                                className="w-full pl-12 pr-4 py-3 rounded-xl border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-800 dark:text-white focus:border-teal-500 focus:outline-none transition"
                            />
                        </div>
                        <button
                            type="submit"
                            disabled={loading}
                            className="bg-gradient-to-r from-teal-600 to-teal-700 text-white px-6 py-3 rounded-xl font-bold hover:from-teal-700 hover:to-teal-800 transition disabled:opacity-50 flex items-center gap-2 shadow-md"
                        >
                            {loading ? (
                                <Loader2 className="w-5 h-5 animate-spin" />
                            ) : (
                                <ClipboardList className="w-5 h-5" />
                            )}
                            Chercher
                        </button>
                    </div>
                    <p className="mt-3 text-xs text-gray-500 dark:text-gray-400">Par nom : vos rendez-vous à venir et ceux des 30 derniers jours. Avec votre numéro de téléphone : tout votre historique.</p>
                </form>

                {/* ========== ERREUR ========== */}
                {erreur && (
                    <div className="bg-red-50 dark:bg-red-900/20 border-l-4 border-red-500 rounded-xl p-4 mb-6 text-red-700 dark:text-red-400 text-sm shadow-sm">
                        {erreur}
                    </div>
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
                                    Aucun RDV trouvé
                                </p>
                                <Link
                                    to="/prendre-rdv"
                                    className="inline-flex items-center gap-2 bg-gradient-to-r from-teal-600 to-teal-700 text-white px-5 py-2 rounded-xl font-semibold hover:from-teal-700 hover:to-teal-800 transition shadow-md"
                                >
                                    <Calendar className="w-4 h-4" />
                                    Prendre un rendez-vous
                                </Link>
                            </div>
                        ) : (
                            <div>
                                {/* Compteur */}
                                <p className="text-sm font-semibold text-gray-600 dark:text-gray-400 mb-3">
                                    {rdvs.length} rendez-vous trouvé{rdvs.length > 1 ? 's' : ''}
                                </p>

                                <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-800">
                                    <table className="w-full min-w-[760px] text-left text-sm">
                                        <thead className="bg-slate-50 text-xs uppercase text-slate-600 dark:bg-gray-700 dark:text-slate-200"><tr>{['Patient', 'Téléphone', 'Date', 'Heure', 'Avec', ...(hasSession() ? ['Motif'] : []), 'Statut', 'Actions'].map(h => <th key={h} className="px-4 py-3 font-semibold">{h}</th>)}</tr></thead>
                                        <tbody>{rdvs.map(rdv => { const statut = statutInfo(rdv.statut); const StatusIcon = statut.Icon; const peutAnnuler = (rdv.statut === 'EN_ATTENTE' || rdv.statut === 'CONFIRME') && (hasSession() || Boolean(localStorage.getItem(`rdv-access-${rdv.id}`))); return <tr key={rdv.id} className="border-t border-slate-100 dark:border-gray-700"><td className="px-4 py-3 font-semibold">{rdv.nomClient}</td><td className="px-4 py-3 whitespace-nowrap">{formatPhone(rdv.telephoneClient)}</td><td className="px-4 py-3">{rdv.dateRdv}</td><td className="px-4 py-3">{rdv.heureRdv?.slice(0, 5)}</td><td className="px-4 py-3 whitespace-nowrap">{rdv.praticienNom || <span className="text-slate-400">À préciser</span>}</td>{hasSession() && <td className="max-w-48 truncate px-4 py-3" title={rdv.motif || ''}>{rdv.motif || '—'}</td>}<td className="px-4 py-3"><span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold ${statut.classes}`}><StatusIcon className="h-3 w-3" />{statut.label}</span></td><td className="px-4 py-3"><div className="flex flex-wrap gap-2"><button type="button" onClick={() => downloadReceiptPdf(rdv)} className="rounded-lg bg-teal-700 px-3 py-2 text-xs font-semibold text-white">Télécharger le reçu PDF</button><button type="button" onClick={() => printReceipt(rdv)} className="rounded-lg border border-teal-200 px-3 py-2 text-xs font-semibold text-teal-800">Imprimer</button>{peutAnnuler && <button onClick={() => annuler(rdv.id)} className="rounded-lg bg-rose-600 px-3 py-2 text-xs font-semibold text-white">Annuler</button>}</div></td></tr>; })}</tbody>
                                    </table>
                                </div>
                                {/* CTA bas de page */}
                                <div className="text-center mt-8">
                                    <Link
                                        to="/prendre-rdv"
                                        className="inline-flex items-center gap-2 bg-gradient-to-r from-teal-600 to-teal-700 text-white px-6 py-3 rounded-xl font-bold hover:from-teal-700 hover:to-teal-800 transition shadow-lg"
                                    >
                                        <Calendar className="w-5 h-5" />
                                        Prendre un nouveau rendez-vous
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
