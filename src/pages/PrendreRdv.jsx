import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axiosClient from '../api/axiosClient';
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
} from 'lucide-react';

function PrendreRdv() {
    const [form, setForm] = useState({
        nomClient: '',
        ageClient: '',
        telephoneClient: '',
        dateRdv: '',
        heureRdv: '',
    });
    const [creneaux, setCreneaux] = useState([]);
    const [loading, setLoading] = useState(false);
    const [erreur, setErreur] = useState(null);
    const [succes, setSucces] = useState(null);

    // Charger les créneaux quand la date change
    useEffect(() => {
        if (!form.dateRdv) return;

        setLoading(true);
        setErreur(null);
        setForm(prev => ({ ...prev, heureRdv: '' }));

        axiosClient.get(`/rdv/creneaux/${form.dateRdv}`)
            .then(res => {
                setCreneaux(res.data);
            })
            .catch(() => {
                setErreur('Impossible de charger les créneaux');
            })
            .finally(() => {
                setLoading(false);
            });
    }, [form.dateRdv]);

    const onChange = (e) => {
        setForm({ ...form, [e.target.name]: e.target.value });
    };

    const onSubmit = async (e) => {
        e.preventDefault();
        setErreur(null);
        setLoading(true);

        try {
            const res = await axiosClient.post('/rdv', {
                ...form,
                ageClient: parseInt(form.ageClient),
                heureRdv: form.heureRdv + ':00',
            });
            setSucces(res.data);
        } catch (err) {
            setErreur(err.response?.data?.message || 'Erreur lors de la réservation');
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
                            RDV confirmé !
                        </h2>
                        <p className="text-gray-600 dark:text-gray-400 mb-8">
                            Vous recevrez une confirmation par SMS.
                        </p>

                        <div className="bg-gradient-to-br from-teal-50 to-teal-100 dark:from-gray-700 dark:to-gray-700 rounded-2xl p-6 text-left space-y-3 mb-8">
                            <div className="flex justify-between items-center">
                                <span className="text-gray-500 dark:text-gray-400 text-sm">Nom</span>
                                <span className="font-bold text-gray-800 dark:text-white">{succes.nomClient}</span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-gray-500 dark:text-gray-400 text-sm">Date</span>
                                <span className="font-bold text-gray-800 dark:text-white">{succes.dateRdv}</span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-gray-500 dark:text-gray-400 text-sm">Heure</span>
                                <span className="font-bold text-teal-600 dark:text-teal-400 text-lg">{succes.heureRdv}</span>
                            </div>
                        </div>

                        <div className="flex gap-3">
                            <Link
                                to="/"
                                className="flex-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 py-3 rounded-xl font-semibold hover:bg-gray-200 dark:hover:bg-gray-600 transition flex items-center justify-center gap-2"
                            >
                                <Home className="w-4 h-4" />
                                Accueil
                            </Link>
                            <button
                                onClick={() => {
                                    setSucces(null);
                                    setForm({ nomClient: '', ageClient: '', telephoneClient: '', dateRdv: '', heureRdv: '' });
                                }}
                                className="flex-1 bg-teal-600 text-white py-3 rounded-xl font-semibold hover:bg-teal-700 transition"
                            >
                                Autre RDV
                            </button>
                        </div>
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
                        <Link to="/" className="hover:text-white transition">Accueil</Link>
                        <ChevronRight className="w-4 h-4" />
                        <span className="text-white font-medium">Prendre RDV</span>
                    </div>

                    <div className="text-center">
                        <span className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-sm text-white border border-white/30 px-4 py-2 rounded-full text-sm font-semibold mb-4">
                            <Calendar className="w-4 h-4" />
                            Réservation en ligne
                        </span>
                        <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
                            Prenez votre rendez-vous
                        </h1>
                        <p className="text-lg text-teal-100 max-w-2xl mx-auto">
                            Remplissez le formulaire en 2 minutes. Confirmation immédiate par SMS.
                        </p>
                    </div>
                </div>
            </section>

            {/* ========== ÉTAPES ========== */}
            <section className="py-8 bg-teal-50 dark:bg-gray-800">
                <div className="max-w-4xl mx-auto px-4">
                    <div className="grid grid-cols-3 gap-4 text-center">
                        {[
                            { num: '1', label: 'Vos infos', active: true },
                            { num: '2', label: 'Date', active: !!form.nomClient },
                            { num: '3', label: 'Heure', active: !!form.dateRdv },
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
                                <p className="font-semibold text-red-700 dark:text-red-400">Erreur</p>
                                <p className="text-sm text-red-600 dark:text-red-300">{erreur}</p>
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
                                        Vos informations
                                    </h2>
                                    <p className="text-sm text-gray-500 dark:text-gray-400">
                                        Ces données restent confidentielles
                                    </p>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                                        Nom complet *
                                    </label>
                                    <input
                                        type="text"
                                        name="nomClient"
                                        value={form.nomClient}
                                        onChange={onChange}
                                        required
                                        placeholder="Ex: Ahmed Benali"
                                        className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-800 dark:text-white focus:border-teal-500 focus:outline-none transition"
                                    />
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                                            Âge *
                                        </label>
                                        <input
                                            type="number"
                                            name="ageClient"
                                            value={form.ageClient}
                                            onChange={onChange}
                                            required
                                            min="1"
                                            max="120"
                                            placeholder="30"
                                            className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-800 dark:text-white focus:border-teal-500 focus:outline-none transition"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                                            Téléphone *
                                        </label>
                                        <div className="relative">
                                            <Phone className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                                            <input
                                                type="tel"
                                                name="telephoneClient"
                                                value={form.telephoneClient}
                                                onChange={onChange}
                                                required
                                                placeholder="+261 34 12 345 67"
                                                className="w-full pl-10 pr-4 py-3 rounded-xl border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-800 dark:text-white focus:border-teal-500 focus:outline-none transition"
                                            />
                                        </div>
                                    </div>
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
                                        Choisissez une date
                                    </h2>
                                    <p className="text-sm text-gray-500 dark:text-gray-400">
                                        Ouvert du lundi au vendredi
                                    </p>
                                </div>
                            </div>

                            <input
                                type="date"
                                name="dateRdv"
                                value={form.dateRdv}
                                onChange={onChange}
                                required
                                min={new Date().toISOString().split('T')[0]}
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
                                            Choisissez un créneau
                                        </h2>
                                        <p className="text-sm text-gray-500 dark:text-gray-400">
                                            Créneaux de 30 minutes
                                        </p>
                                    </div>
                                </div>

                                {loading ? (
                                    <div className="text-center py-6">
                                        <Loader2 className="w-8 h-8 text-teal-600 animate-spin mx-auto mb-2" />
                                        <p className="text-gray-500 dark:text-gray-400 text-sm">
                                            Chargement des créneaux...
                                        </p>
                                    </div>
                                ) : creneaux.length === 0 ? (
                                    <div className="bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-xl p-4 text-center">
                                        <p className="text-orange-700 dark:text-orange-300 text-sm">
                                            Aucun créneau disponible. Choisissez une autre date.
                                        </p>
                                    </div>
                                ) : (
                                    <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2">
                                        {creneaux.map(c => {
                                            const h = c.substring(0, 5);
                                            return (
                                                <button
                                                    key={c}
                                                    type="button"
                                                    onClick={() => setForm({ ...form, heureRdv: h })}
                                                    className={`py-3 rounded-xl text-sm font-bold transition-all ${
                                                        form.heureRdv === h
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
                                disabled={loading || !form.heureRdv}
                                className="w-full bg-gradient-to-r from-teal-600 to-teal-700 text-white py-4 rounded-xl font-bold text-lg hover:from-teal-700 hover:to-teal-800 transition-all shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                            >
                                {loading ? (
                                    <>
                                        <Loader2 className="w-5 h-5 animate-spin" />
                                        Envoi en cours...
                                    </>
                                ) : (
                                    <>
                                        <Calendar className="w-5 h-5" />
                                        Confirmer le rendez-vous
                                    </>
                                )}
                            </button>
                            <p className="text-center text-xs text-gray-400 dark:text-gray-500 mt-4">
                                Sans inscription · Confirmation par SMS · Annulation gratuite
                            </p>
                        </div>
                    </form>
                </div>
            </section>
        </div>
    );
}

export default PrendreRdv;