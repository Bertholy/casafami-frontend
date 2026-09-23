import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axiosClient from '../api/axiosClient';
import {
    Plus,
    Trash2,
    Pill,
    Loader2,
    AlertCircle,
    ArrowLeft,
    Stethoscope,
    Activity,
} from 'lucide-react';

function MaladiesMedecin() {
    const navigate = useNavigate();
    const [maladies, setMaladies] = useState([]);
    const [loading, setLoading] = useState(true);
    const [erreur, setErreur] = useState(null);
    const [showForm, setShowForm] = useState(false);
    const [submitting, setSubmitting] = useState(false);

    // Nouveau formulaire
    const [form, setForm] = useState({
        nom: '',
        description: '',
        symptomes: '',
    });

    // Vérifier auth + charger
    useEffect(() => {
        if (!localStorage.getItem('token')) {
            navigate('/medecin/login');
            return;
        }
        chargerMaladies();
    }, [navigate]);

    const chargerMaladies = async () => {
        setLoading(true);
        try {
            const res = await axiosClient.get('/maladies');
            setMaladies(res.data);
        } catch {
            setErreur('Erreur lors du chargement');
        } finally {
            setLoading(false);
        }
    };

    // Ajouter une maladie
    const ajouter = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        setErreur(null);

        try {
            const res = await axiosClient.post('/maladies', form);
            setMaladies([...maladies, res.data]);
            setForm({ nom: '', description: '', symptomes: '' });
            setShowForm(false);
        } catch {
            setErreur('Impossible d\'ajouter la maladie');
        } finally {
            setSubmitting(false);
        }
    };

    // Supprimer
    const supprimer = async (id) => {
        if (!confirm('Supprimer cette maladie ?')) return;
        try {
            await axiosClient.delete(`/maladies/${id}`);
            setMaladies(maladies.filter(m => m.id !== id));
        } catch {
            setErreur('Impossible de supprimer');
        }
    };

    const onChange = (e) => {
        setForm({ ...form, [e.target.name]: e.target.value });
    };

    return (
        <div className="bg-gray-50 dark:bg-gray-900 min-h-screen">

            {/* ========== HEADER ========== */}
            <div className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-100 dark:border-gray-700">
                <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
                    <div className="flex items-center gap-3">
                        <Link
                            to="/medecin/dashboard"
                            className="w-10 h-10 bg-gray-100 dark:bg-gray-700 rounded-lg flex items-center justify-center hover:bg-gray-200 dark:hover:bg-gray-600 transition"
                        >
                            <ArrowLeft className="w-5 h-5 text-gray-600 dark:text-gray-300" />
                        </Link>
                        <div className="w-12 h-12 bg-gradient-to-br from-teal-500 to-teal-700 rounded-xl flex items-center justify-center shadow-lg">
                            <Activity className="w-6 h-6 text-white" />
                        </div>
                        <div>
                            <h1 className="text-xl font-bold text-gray-800 dark:text-white">
                                Gestion des maladies
                            </h1>
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                                {maladies.length} maladie{maladies.length > 1 ? 's' : ''} enregistrée{maladies.length > 1 ? 's' : ''}
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={() => setShowForm(!showForm)}
                        className="flex items-center gap-2 bg-teal-600 text-white px-4 py-2 rounded-xl font-semibold hover:bg-teal-700 transition shadow-md"
                    >
                        <Plus className="w-4 h-4" />
                        Nouvelle maladie
                    </button>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-4 py-8">

                {/* ========== FORMULAIRE ========== */}
                {showForm && (
                    <form
                        onSubmit={ajouter}
                        className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-md border border-gray-100 dark:border-gray-700 mb-6"
                    >
                        <h2 className="text-lg font-bold text-gray-800 dark:text-white mb-4 flex items-center gap-2">
                            <Plus className="w-5 h-5 text-teal-600" />
                            Ajouter une maladie
                        </h2>

                        <div className="space-y-4">
                            <input
                                type="text"
                                name="nom"
                                value={form.nom}
                                onChange={onChange}
                                required
                                placeholder="Nom de la maladie (ex: Grippe)"
                                className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-800 dark:text-white focus:border-teal-500 focus:outline-none"
                            />
                            <textarea
                                name="description"
                                value={form.description}
                                onChange={onChange}
                                placeholder="Description (ex: Infection virale)"
                                rows="2"
                                className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-800 dark:text-white focus:border-teal-500 focus:outline-none"
                            />
                            <textarea
                                name="symptomes"
                                value={form.symptomes}
                                onChange={onChange}
                                placeholder="Symptômes (ex: Fièvre, toux, fatigue)"
                                rows="2"
                                className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-800 dark:text-white focus:border-teal-500 focus:outline-none"
                            />
                            <div className="flex gap-2">
                                <button
                                    type="submit"
                                    disabled={submitting}
                                    className="flex-1 bg-teal-600 text-white py-3 rounded-xl font-bold hover:bg-teal-700 transition disabled:opacity-50 flex items-center justify-center gap-2"
                                >
                                    {submitting ? (
                                        <><Loader2 className="w-5 h-5 animate-spin" /> Ajout...</>
                                    ) : (
                                        'Ajouter'
                                    )}
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setShowForm(false)}
                                    className="px-6 py-3 rounded-xl font-bold bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 transition"
                                >
                                    Annuler
                                </button>
                            </div>
                        </div>
                    </form>
                )}

                {/* ========== ERREUR ========== */}
                {erreur && (
                    <div className="bg-red-50 dark:bg-red-900/20 border-l-4 border-red-500 rounded-xl p-4 mb-6 flex items-center gap-3">
                        <AlertCircle className="w-5 h-5 text-red-500" />
                        <p className="text-red-700 dark:text-red-400 text-sm">{erreur}</p>
                    </div>
                )}

                {/* ========== LISTE ========== */}
                {loading ? (
                    <div className="text-center py-16">
                        <Loader2 className="w-10 h-10 text-teal-600 animate-spin mx-auto mb-3" />
                        <p className="text-gray-500">Chargement...</p>
                    </div>
                ) : maladies.length === 0 ? (
                    <div className="bg-white dark:bg-gray-800 rounded-2xl p-12 text-center border border-gray-100 dark:border-gray-700">
                        <Activity className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                        <p className="text-gray-500 dark:text-gray-400 mb-4">
                            Aucune maladie enregistrée
                        </p>
                        <button
                            onClick={() => setShowForm(true)}
                            className="inline-flex items-center gap-2 bg-teal-600 text-white px-6 py-3 rounded-xl font-semibold hover:bg-teal-700 transition"
                        >
                            <Plus className="w-4 h-4" />
                            Ajouter la première maladie
                        </button>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {maladies.map(maladie => (
                            <div
                                key={maladie.id}
                                className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-gray-700"
                            >
                                <div className="flex justify-between items-start mb-4">
                                    <div className="flex items-start gap-3">
                                        <div className="w-10 h-10 bg-teal-100 dark:bg-teal-900/40 rounded-lg flex items-center justify-center flex-shrink-0">
                                            <Stethoscope className="w-5 h-5 text-teal-600 dark:text-teal-400" />
                                        </div>
                                        <div>
                                            <h3 className="font-bold text-lg text-gray-800 dark:text-white">
                                                {maladie.nom}
                                            </h3>
                                            {maladie.description && (
                                                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                                                    {maladie.description}
                                                </p>
                                            )}
                                            {maladie.symptomes && (
                                                <p className="text-xs text-gray-500 dark:text-gray-500 mt-2">
                                                    Symptômes : {maladie.symptomes}
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => supprimer(maladie.id)}
                                        className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition"
                                        title="Supprimer"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>

                                {/* Traitements */}
                                {maladie.traitements && maladie.traitements.length > 0 && (
                                    <div className="ml-13 bg-teal-50 dark:bg-gray-700/50 rounded-xl p-4">
                                        <p className="text-xs font-bold text-teal-700 dark:text-teal-400 mb-2 flex items-center gap-1">
                                            <Pill className="w-3 h-3" />
                                            Traitements ({maladie.traitements.length})
                                        </p>
                                        <div className="space-y-1">
                                            {maladie.traitements.map(t => (
                                                <div key={t.id} className="text-sm text-gray-700 dark:text-gray-300 flex items-start gap-2">
                                                    <span className="text-teal-600 font-bold">•</span>
                                                    <span>
                                                        <strong>{t.medicament}</strong>
                                                        {t.posologie && ` — ${t.posologie}`}
                                                    </span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}

export default MaladiesMedecin;