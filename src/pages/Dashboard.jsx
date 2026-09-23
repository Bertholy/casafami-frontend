import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axiosClient from '../api/axiosClient';
import {
    LogOut,
    Users,
    Clock,
    CheckCircle,
    XCircle,
    Calendar,
    Phone,
    Loader2,
    RefreshCw,
    Stethoscope,
    Activity,
} from 'lucide-react';

function Dashboard() {
    const navigate = useNavigate();
    const [rdvs, setRdvs] = useState([]);
    const [filtre, setFiltre] = useState('TOUS');
    const [loading, setLoading] = useState(true);
    const [actionId, setActionId] = useState(null);
    const [erreur, setErreur] = useState(null);

    useEffect(() => {
        const token = localStorage.getItem('token');
        if (!token) {
            navigate('/medecin/login');
            return;
        }
        chargerRdvs();
    }, [navigate]);

    const chargerRdvs = async () => {
        setLoading(true);
        setErreur(null);
        try {
            const res = await axiosClient.get('/rdv');
            setRdvs(res.data);
        } catch {
            setErreur('Erreur lors du chargement');
        } finally {
            setLoading(false);
        }
    };

    const confirmer = async (id) => {
        setActionId(id);
        try {
            const res = await axiosClient.put(`/rdv/${id}/confirmer`);
            setRdvs(rdvs.map(r => r.id === id ? res.data : r));
        } catch {
            setErreur('Impossible de confirmer');
        } finally {
            setActionId(null);
        }
    };

    const annuler = async (id) => {
        if (!confirm('Annuler ce rendez-vous ?')) return;
        setActionId(id);
        try {
            const res = await axiosClient.put(`/rdv/${id}/annuler`);
            setRdvs(rdvs.map(r => r.id === id ? res.data : r));
        } catch {
            setErreur("Impossible d'annuler");
        } finally {
            setActionId(null);
        }
    };

    const deconnexion = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('email');
        localStorage.removeItem('role');
        navigate('/medecin/login');
    };

    const rdvsFiltres = rdvs.filter(r => {
        if (filtre === 'TOUS') return true;
        return r.statut === filtre;
    });

    const stats = {
        total: rdvs.length,
        enAttente: rdvs.filter(r => r.statut === 'EN_ATTENTE').length,
        confirmes: rdvs.filter(r => r.statut === 'CONFIRME').length,
        annules: rdvs.filter(r => r.statut === 'ANNULE').length,
    };

    // Couleur + libellé selon statut
    const statutInfo = (statut) => {
        switch (statut) {
            case 'EN_ATTENTE':
                return { 
                    label: 'En attente', 
                    classes: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
                    border: 'border-l-yellow-500',
                    Icon: Clock,
                };
            case 'CONFIRME':
                return { 
                    label: 'Confirmé', 
                    classes: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
                    border: 'border-l-green-500',
                    Icon: CheckCircle,
                };
            case 'ANNULE':
                return { 
                    label: 'Annulé', 
                    classes: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
                    border: 'border-l-red-500',
                    Icon: XCircle,
                };
            case 'TERMINE':
                return { 
                    label: 'Terminé', 
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

    return (
        <div className="bg-gradient-to-br from-teal-50 via-white to-blue-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 min-h-screen">

            {/* ========== HEADER ========== */}
            <div className="bg-gradient-to-r from-teal-600 to-teal-700 dark:from-teal-700 dark:to-teal-800 shadow-lg">
                <div className="max-w-7xl mx-auto px-4 py-5 flex justify-between items-center flex-wrap gap-3">
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center shadow-lg border border-white/30">
                            <Stethoscope className="w-6 h-6 text-white" />
                        </div>
                        <div>
                            <h1 className="text-xl font-bold text-white">
                                Tableau de bord médecin
                            </h1>
                            <p className="text-sm text-teal-100">
                                {localStorage.getItem('email')}
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        <Link
                            to="/medecin/maladies"
                            className="flex items-center gap-2 bg-white/20 backdrop-blur-sm text-white border border-white/30 px-4 py-2 rounded-xl font-semibold hover:bg-white/30 transition"
                        >
                            <Activity className="w-4 h-4" />
                            Maladies
                        </Link>
                        <button
                            onClick={deconnexion}
                            className="flex items-center gap-2 bg-red-500 text-white px-4 py-2 rounded-xl font-semibold hover:bg-red-600 transition shadow-md"
                        >
                            <LogOut className="w-4 h-4" />
                            Déconnexion
                        </button>
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-4 py-8">

                {/* ========== STATISTIQUES ========== */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                    {[
                        { label: 'Total', value: stats.total, Icon: Users, gradient: 'from-blue-500 to-blue-700', bg: 'bg-blue-50 dark:bg-blue-900/20' },
                        { label: 'En attente', value: stats.enAttente, Icon: Clock, gradient: 'from-yellow-500 to-orange-600', bg: 'bg-yellow-50 dark:bg-yellow-900/20' },
                        { label: 'Confirmés', value: stats.confirmes, Icon: CheckCircle, gradient: 'from-green-500 to-emerald-700', bg: 'bg-green-50 dark:bg-green-900/20' },
                        { label: 'Annulés', value: stats.annules, Icon: XCircle, gradient: 'from-red-500 to-pink-700', bg: 'bg-red-50 dark:bg-red-900/20' },
                    ].map((stat, i) => {
                        const IconComponent = stat.Icon;
                        return (
                            <div
                                key={i}
                                className={`${stat.bg} rounded-2xl p-5 shadow-md border border-white/50 dark:border-gray-700 hover:scale-105 transition-transform`}
                            >
                                <div className={`w-12 h-12 bg-gradient-to-br ${stat.gradient} rounded-xl flex items-center justify-center mb-3 shadow-lg`}>
                                    <IconComponent className="w-6 h-6 text-white" />
                                </div>
                                <p className="text-3xl font-bold text-gray-800 dark:text-white">{stat.value}</p>
                                <p className="text-sm text-gray-600 dark:text-gray-400">{stat.label}</p>
                            </div>
                        );
                    })}
                </div>

                {/* ========== FILTRES ========== */}
                <div className="flex flex-wrap gap-2 mb-6">
                    {['TOUS', 'EN_ATTENTE', 'CONFIRME', 'ANNULE'].map(f => {
                        const isActive = filtre === f;
                        const colors = {
                            'TOUS': isActive ? 'bg-teal-600 text-white' : 'bg-white dark:bg-gray-800 text-teal-700 dark:text-teal-400 hover:bg-teal-50 dark:hover:bg-gray-700',
                            'EN_ATTENTE': isActive ? 'bg-yellow-500 text-white' : 'bg-white dark:bg-gray-800 text-yellow-700 dark:text-yellow-400 hover:bg-yellow-50 dark:hover:bg-gray-700',
                            'CONFIRME': isActive ? 'bg-green-600 text-white' : 'bg-white dark:bg-gray-800 text-green-700 dark:text-green-400 hover:bg-green-50 dark:hover:bg-gray-700',
                            'ANNULE': isActive ? 'bg-red-600 text-white' : 'bg-white dark:bg-gray-800 text-red-700 dark:text-red-400 hover:bg-red-50 dark:hover:bg-gray-700',
                        };
                        return (
                            <button
                                key={f}
                                onClick={() => setFiltre(f)}
                                className={`px-4 py-2 rounded-xl text-sm font-semibold transition shadow-sm ${colors[f]}`}
                            >
                                {f === 'TOUS' ? 'Tous' : f === 'EN_ATTENTE' ? 'En attente' : f === 'CONFIRME' ? 'Confirmés' : 'Annulés'}
                            </button>
                        );
                    })}
                    <button
                        onClick={chargerRdvs}
                        className="ml-auto flex items-center gap-2 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 px-4 py-2 rounded-xl font-semibold hover:bg-gray-100 dark:hover:bg-gray-700 transition shadow-sm border border-gray-200 dark:border-gray-700"
                    >
                        <RefreshCw className="w-4 h-4" />
                        Actualiser
                    </button>
                </div>

                {/* ========== ERREUR ========== */}
                {erreur && (
                    <div className="bg-red-50 dark:bg-red-900/20 border-l-4 border-red-500 rounded-xl p-4 mb-6 text-red-700 dark:text-red-400 text-sm shadow-sm">
                        {erreur}
                    </div>
                )}

                {/* ========== LISTE ========== */}
                {loading ? (
                    <div className="text-center py-16">
                        <Loader2 className="w-10 h-10 text-teal-600 animate-spin mx-auto mb-3" />
                        <p className="text-gray-500 dark:text-gray-400">Chargement...</p>
                    </div>
                ) : rdvsFiltres.length === 0 ? (
                    <div className="bg-white dark:bg-gray-800 rounded-2xl p-12 text-center border border-gray-100 dark:border-gray-700 shadow-sm">
                        <Calendar className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                        <p className="text-gray-500 dark:text-gray-400">
                            Aucun rendez-vous {filtre !== 'TOUS' ? 'dans cette catégorie' : ''}
                        </p>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {rdvsFiltres.map(rdv => {
                            const statut = statutInfo(rdv.statut);
                            const StatutIcon = statut.Icon;

                            return (
                                <div
                                    key={rdv.id}
                                    className={`bg-white dark:bg-gray-800 rounded-2xl p-5 shadow-md border-l-4 ${statut.border} border-t border-r border-b border-gray-100 dark:border-gray-700 flex flex-col md:flex-row md:items-center gap-4 hover:shadow-lg transition-shadow`}
                                >
                                    <div className="flex-1">
                                        <div className="flex items-center gap-3 mb-2">
                                            <div className="w-10 h-10 bg-gradient-to-br from-teal-500 to-teal-700 rounded-lg flex items-center justify-center shadow-md">
                                                <Users className="w-5 h-5 text-white" />
                                            </div>
                                            <div>
                                                <p className="font-bold text-gray-800 dark:text-white">
                                                    {rdv.nomClient}
                                                </p>
                                                <p className="text-sm text-gray-500 dark:text-gray-400 flex items-center gap-1">
                                                    <Phone className="w-3 h-3" />
                                                    {rdv.telephoneClient} · {rdv.ageClient} ans
                                                </p>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-4 text-sm">
                                        <div className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
                                            <div className="w-6 h-6 bg-teal-100 dark:bg-teal-900/40 rounded-md flex items-center justify-center">
                                                <Calendar className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400" />
                                            </div>
                                            <span className="font-semibold">{rdv.dateRdv}</span>
                                        </div>
                                        <div className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
                                            <div className="w-6 h-6 bg-teal-100 dark:bg-teal-900/40 rounded-md flex items-center justify-center">
                                                <Clock className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400" />
                                            </div>
                                            <span className="font-semibold">{rdv.heureRdv}</span>
                                        </div>
                                    </div>

                                    {/* Badge statut */}
                                    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${statut.classes} self-start md:self-auto`}>
                                        <StatutIcon className="w-3 h-3" />
                                        {statut.label}
                                    </span>

                                    <div className="flex items-center gap-2 self-start md:self-auto">
                                        {rdv.statut === 'EN_ATTENTE' && (
                                            <button
                                                onClick={() => confirmer(rdv.id)}
                                                disabled={actionId === rdv.id}
                                                className="flex items-center gap-1 bg-gradient-to-r from-green-500 to-green-600 text-white px-3 py-2 rounded-lg text-sm font-semibold hover:from-green-600 hover:to-green-700 transition disabled:opacity-50 shadow-md"
                                            >
                                                {actionId === rdv.id ? (
                                                    <Loader2 className="w-4 h-4 animate-spin" />
                                                ) : (
                                                    <CheckCircle className="w-4 h-4" />
                                                )}
                                                Confirmer
                                            </button>
                                        )}

                                        {(rdv.statut === 'EN_ATTENTE' || rdv.statut === 'CONFIRME') && (
                                            <button
                                                onClick={() => annuler(rdv.id)}
                                                disabled={actionId === rdv.id}
                                                className="flex items-center gap-1 bg-gradient-to-r from-red-500 to-red-600 text-white px-3 py-2 rounded-lg text-sm font-semibold hover:from-red-600 hover:to-red-700 transition disabled:opacity-50 shadow-md"
                                            >
                                                <XCircle className="w-4 h-4" />
                                                Annuler
                                            </button>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
}

export default Dashboard;