import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axiosClient from '../api/axiosClient';
import { APP_NAME } from '../constants/app';
import { apiErrorMessage, homeForRole, saveSession } from '../utils/auth';
import { Lock, Mail, Loader2, AlertCircle, Stethoscope, ArrowLeft } from 'lucide-react';

function Login() {
    const navigate = useNavigate();
    const [email, setEmail] = useState('');
    const [motDePasse, setMotDePasse] = useState('');
    const [loading, setLoading] = useState(false);
    const [erreur, setErreur] = useState(null);

    const onSubmit = async (e) => {
        e.preventDefault();
        setErreur(null);
        setLoading(true);

        try {
            const res = await axiosClient.post('/auth/login', { email: email.trim(), motDePasse });

            // Sauvegarder le token et les infos
            saveSession(res.data);
            navigate(homeForRole(res.data.role));
        } catch (err) {
            setErreur(err.response?.status === 401 ? 'Email ou mot de passe incorrect' : apiErrorMessage(err, 'Connexion impossible. Réessayez dans un instant.'));
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-teal-50 via-white to-teal-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 py-12 px-4">
            <div className="w-full max-w-md">

                {/* Logo + Titre */}
                <div className="text-center mb-8">
                    <div className="w-20 h-20 bg-gradient-to-br from-teal-500 to-teal-700 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-xl">
                        <Stethoscope className="w-10 h-10 text-white" />
                    </div>
                    <h1 className="text-3xl font-bold text-gray-800 dark:text-white mb-2">
                        Espace du personnel {APP_NAME}
                    </h1>
                    <p className="text-gray-600 dark:text-gray-400">
                        Connectez-vous pour gérer vos rendez-vous
                    </p>
                </div>

                {/* Formulaire */}
                <form
                    onSubmit={onSubmit}
                    className="bg-white dark:bg-gray-800 rounded-3xl shadow-2xl p-8 border border-gray-100 dark:border-gray-700"
                >
                    {erreur && (
                        <div className="bg-red-50 dark:bg-red-900/20 border-l-4 border-red-500 rounded-xl p-4 mb-6 flex items-center gap-3">
                            <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
                            <p className="text-sm text-red-700 dark:text-red-400">{erreur}</p>
                        </div>
                    )}

                    {/* Email */}
                    <div className="mb-5">
                        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                            Adresse email
                        </label>
                        <div className="relative">
                            <Mail className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                                placeholder="medecin@casafami.mg"
                                className="w-full pl-11 pr-4 py-3 rounded-xl border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-800 dark:text-white focus:border-teal-500 focus:outline-none transition"
                            />
                        </div>
                    </div>

                    {/* Mot de passe */}
                    <div className="mb-6">
                        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                            Mot de passe
                        </label>
                        <div className="relative">
                            <Lock className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                            <input
                                type="password"
                                value={motDePasse}
                                onChange={(e) => setMotDePasse(e.target.value)}
                                required
                                placeholder="••••••••"
                                className="w-full pl-11 pr-4 py-3 rounded-xl border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-800 dark:text-white focus:border-teal-500 focus:outline-none transition"
                            />
                        </div>
                    </div>

                    <div className="-mt-3 mb-6 text-right">
                        <Link to="/medecin/mot-de-passe-oublie" className="text-sm font-medium text-teal-700 hover:underline dark:text-teal-300">Mot de passe oublié ?</Link>
                    </div>

                    {/* Bouton */}
                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-gradient-to-r from-teal-600 to-teal-700 text-white py-4 rounded-xl font-bold hover:from-teal-700 hover:to-teal-800 transition shadow-lg disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                        {loading ? (
                            <>
                                <Loader2 className="w-5 h-5 animate-spin" />
                                Connexion...
                            </>
                        ) : (
                            'Se connecter'
                        )}
                    </button>
                </form>

                <div className="mt-4 text-center">
                    <Link to="/" className="inline-flex items-center gap-2 text-sm text-teal-700 hover:underline dark:text-teal-300"><ArrowLeft className="w-4 h-4" />Retour au site</Link>
                </div>

                {/* Note */}
                <p className="text-center text-xs text-gray-400 dark:text-gray-500 mt-6">
                    Accès réservé au personnel autorisé
                </p>
            </div>
        </div>
    );
}

export default Login;
