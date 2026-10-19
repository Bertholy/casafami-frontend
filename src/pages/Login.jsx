import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axiosClient from '../api/axiosClient';
import { apiErrorMessage, homeForRole, saveSession } from '../utils/auth';
import { Lock, Mail, Loader2, AlertCircle, ArrowLeft } from 'lucide-react';
import ChampMotDePasse from '../components/ChampMotDePasse';
import { AuthFond, AuthEntete, AuthCarte, authInput, authButton } from '../components/AuthCard';

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
        <AuthFond>
            <AuthEntete titre="Espace du personnel" sousTitre="Connectez-vous pour gérer vos rendez-vous" />

            <AuthCarte>
                <form onSubmit={onSubmit}>
                    {erreur && (
                        <div role="alert" className="mb-6 flex items-center gap-3 rounded-2xl border-l-4 border-red-500 bg-red-50 p-4 dark:bg-red-900/20">
                            <AlertCircle className="h-5 w-5 shrink-0 text-red-500" />
                            <p className="text-sm text-red-700 dark:text-red-400">{erreur}</p>
                        </div>
                    )}

                    <div className="mb-5">
                        <label htmlFor="login-email" className="mb-2 block text-sm font-semibold text-gray-700 dark:text-gray-300">Adresse email</label>
                        <div className="relative">
                            <Mail className="absolute left-3.5 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
                            <input id="login-email" type="email" autoComplete="username" value={email} onChange={(e) => setEmail(e.target.value)} required placeholder="medecin@casafami.mg" className={authInput} />
                        </div>
                    </div>

                    <div className="mb-6">
                        <label htmlFor="login-mdp" className="mb-2 block text-sm font-semibold text-gray-700 dark:text-gray-300">Mot de passe</label>
                        <div className="relative">
                            <Lock className="pointer-events-none absolute left-3.5 top-1/2 z-10 h-5 w-5 -translate-y-1/2 text-gray-400" />
                            <ChampMotDePasse id="login-mdp" autoComplete="current-password" value={motDePasse} onChange={(e) => setMotDePasse(e.target.value)} required placeholder="••••••••" className={authInput} />
                        </div>
                    </div>

                    <div className="-mt-3 mb-6 text-right">
                        <Link to="/medecin/mot-de-passe-oublie" className="text-sm font-semibold text-teal-700 hover:underline dark:text-teal-300">Mot de passe oublié ?</Link>
                    </div>

                    <button type="submit" disabled={loading} className={authButton}>
                        {loading ? (<><Loader2 className="h-5 w-5 animate-spin" />Connexion...</>) : 'Se connecter'}
                    </button>
                </form>
            </AuthCarte>

            <div className="mt-5 text-center">
                <Link to="/" className="inline-flex items-center gap-2 text-sm font-semibold text-white/90 hover:text-white hover:underline"><ArrowLeft className="h-4 w-4" />Retour au site</Link>
            </div>
            <p className="mt-6 text-center text-xs text-white/70">Accès réservé au personnel autorisé</p>
        </AuthFond>
    );
}

export default Login;
