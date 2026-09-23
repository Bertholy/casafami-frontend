import { useState } from 'react';
import { Link } from 'react-router-dom';
import axiosClient from '../api/axiosClient';
import {
    Search,
    Calendar,
    User,
    Loader2,
    XCircle,
    Phone,
    ClipboardList,
    Clock,
    CheckCircle,
} from 'lucide-react';

function MesRdv() {
    const [telephone, setTelephone] = useState('');
    const [rdvs, setRdvs] = useState(null);
    const [loading, setLoading] = useState(false);
    const [erreur, setErreur] = useState(null);

    const rechercher = async (e) => {
        e.preventDefault();
        setErreur(null);
        setLoading(true);
        setRdvs(null);

        try {
            const res = await axiosClient.get(`/rdv/telephone/${encodeURIComponent(telephone)}`);
            setRdvs(res.data);
        } catch {
            setErreur('Erreur lors de la recherche');
        } finally {
            setLoading(false);
        }
    };

    const annuler = async (id) => {
        if (!confirm('Annuler ce RDV ?')) return;
        try {
            const res = await axiosClient.put(`/rdv/${id}/annuler`);
            setRdvs(rdvs.map(r => r.id === id ? res.data : r));
        } catch {
            setErreur("Impossible d'annuler");
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
                        Entrez votre numéro pour retrouver vos RDV
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
                            <Phone className="w-5 h-5 text-teal-500 absolute left-4 top-1/2 -translate-y-1/2" />
                            <input
                                type="tel"
                                value={telephone}
                                onChange={(e) => setTelephone(e.target.value)}
                                required
                                placeholder="+261 34 12 345 67"
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
                                <Search className="w-5 h-5" />
                            )}
                            Chercher
                        </button>
                    </div>
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

                                <div className="space-y-4">
                                    {rdvs.map((rdv) => {
                                        const statut = statutInfo(rdv.statut);
                                        const StatutIcon = statut.Icon;
                                        const peutAnnuler = rdv.statut === 'EN_ATTENTE' || rdv.statut === 'CONFIRME';

                                        return (
                                            <div
                                                key={rdv.id}
                                                className={`bg-white dark:bg-gray-800 rounded-2xl shadow-md border-l-4 ${statut.border} border-t border-r border-b border-gray-100 dark:border-gray-700 p-6 hover:shadow-lg transition-shadow`}
                                            >
                                                <div className="flex justify-between items-start mb-4">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-11 h-11 bg-gradient-to-br from-teal-500 to-teal-700 rounded-xl flex items-center justify-center shadow-md">
                                                            <User className="w-5 h-5 text-white" />
                                                        </div>
                                                        <div>
                                                            <p className="font-bold text-gray-800 dark:text-white">
                                                                {rdv.nomClient}
                                                            </p>
                                                            <p className="text-sm text-gray-500 dark:text-gray-400">
                                                                {rdv.ageClient} ans
                                                            </p>
                                                        </div>
                                                    </div>
                                                    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${statut.classes}`}>
                                                        <StatutIcon className="w-3 h-3" />
                                                        {statut.label}
                                                    </span>
                                                </div>

                                                {/* Détails du RDV */}
                                                <div className={`${statut.bg} rounded-xl p-3 mb-4 flex items-center gap-6 text-sm`}>
                                                    <span className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
                                                        <div className="w-6 h-6 bg-white dark:bg-gray-800 rounded-md flex items-center justify-center">
                                                            <Calendar className="w-3.5 h-3.5 text-teal-600" />
                                                        </div>
                                                        <span className="font-semibold">{rdv.dateRdv}</span>
                                                    </span>
                                                    <span className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
                                                        <div className="w-6 h-6 bg-white dark:bg-gray-800 rounded-md flex items-center justify-center">
                                                            <Clock className="w-3.5 h-3.5 text-teal-600" />
                                                        </div>
                                                        <span className="font-semibold">{rdv.heureRdv}</span>
                                                    </span>
                                                </div>

                                                {/* Bouton Annuler */}
                                                {peutAnnuler && (
                                                    <button
                                                        onClick={() => annuler(rdv.id)}
                                                        className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-red-500 to-red-600 text-white py-2.5 rounded-xl font-semibold hover:from-red-600 hover:to-red-700 transition shadow-md"
                                                    >
                                                        <XCircle className="w-4 h-4" />
                                                        Annuler ce rendez-vous
                                                    </button>
                                                )}
                                            </div>
                                        );
                                    })}
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