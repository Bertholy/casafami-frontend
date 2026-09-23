import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axiosClient from '../api/axiosClient';
import { Lock, Mail, Loader2, AlertCircle, Stethoscope } from 'lucide-react';

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
            const res = await axiosClient.post('/auth/login', { email, motDePasse });

            // Sauvegarder le token et les infos
            localStorage.setItem('token', res.data.token);
            localStorage.setItem('email', res.data.email);
            localStorage.setItem('role', res.data.role);

            // Rediriger vers le dashboard
            navigate('/medecin/dashboard');
        } catch {
            setErreur('Email ou mot de passe incorrect');
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
                        Espace médecin
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

                {/* Note */}
                <p className="text-center text-xs text-gray-400 dark:text-gray-500 mt-6">
                    Accès réservé au personnel médical
                </p>
            </div>
        </div>
    );
}

export default Login;