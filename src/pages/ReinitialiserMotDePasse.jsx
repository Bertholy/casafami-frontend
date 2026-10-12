import { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { AlertCircle, CheckCircle2, Loader2, Lock } from 'lucide-react';
import axiosClient from '../api/axiosClient';
import AuthCard, { authButton, authInput } from '../components/AuthCard';
import { apiErrorMessage } from '../utils/auth';
import ChampMotDePasse from '../components/ChampMotDePasse';

/** Page ouverte depuis le lien reçu par e-mail : choix du nouveau mot de passe. */
export default function ReinitialiserMotDePasse() {
    const [params] = useSearchParams();
    const token = params.get('token') || '';
    const [motDePasse, setMotDePasse] = useState('');
    const [confirmation, setConfirmation] = useState('');
    const [loading, setLoading] = useState(false);
    const [erreur, setErreur] = useState('');
    const [fini, setFini] = useState(false);

    const valider = async event => {
        event.preventDefault();
        setErreur('');
        if (motDePasse !== confirmation) { setErreur('Les deux mots de passe ne sont pas identiques.'); return; }
        setLoading(true);
        try {
            await axiosClient.post('/auth/reinitialiser', { token, motDePasse });
            setFini(true);
        } catch (err) {
            setErreur(apiErrorMessage(err, 'Le changement a échoué. Réessayez dans un instant.'));
        } finally { setLoading(false); }
    };

    if (!token) {
        return (
            <AuthCard titre="Lien incomplet">
                <p className="text-sm text-gray-600 dark:text-gray-300">Ce lien est incomplet. Ouvrez-le depuis l’e-mail reçu, ou <Link to="/medecin/mot-de-passe-oublie" className="font-semibold text-teal-700 underline dark:text-teal-300">refaites une demande</Link>.</p>
            </AuthCard>
        );
    }

    return (
        <AuthCard titre="Nouveau mot de passe" sousTitre="Choisissez un mot de passe d’au moins 10 caractères.">
            {fini ? (
                <div role="status" className="space-y-4">
                    <div className="flex items-start gap-3 rounded-xl border-l-4 border-emerald-500 bg-emerald-50 p-4 text-sm text-emerald-800 dark:bg-emerald-900/20 dark:text-emerald-300">
                        <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0" />Votre mot de passe a été changé.
                    </div>
                    <Link to="/medecin/login" className={authButton}>Se connecter</Link>
                </div>
            ) : (
                <form onSubmit={valider}>
                    {erreur && (
                        <div role="alert" className="mb-6 flex items-center gap-3 rounded-xl border-l-4 border-red-500 bg-red-50 p-4 dark:bg-red-900/20">
                            <AlertCircle className="h-5 w-5 shrink-0 text-red-500" />
                            <div className="text-sm text-red-700 dark:text-red-400">
                                {erreur}
                                {/expiré|invalide/.test(erreur) && <> <Link to="/medecin/mot-de-passe-oublie" className="font-semibold underline">Refaire une demande</Link></>}
                            </div>
                        </div>
                    )}
                    <label htmlFor="mdp-nouveau" className="mb-2 block text-sm font-semibold text-gray-700 dark:text-gray-300">Nouveau mot de passe</label>
                    <div className="relative mb-5">
                        <Lock className="pointer-events-none absolute left-3 top-1/2 z-10 h-5 w-5 -translate-y-1/2 text-gray-400" />
                        <ChampMotDePasse id="mdp-nouveau" required minLength={10} maxLength={72} autoComplete="new-password" value={motDePasse} onChange={e => setMotDePasse(e.target.value)} className={authInput} />
                    </div>
                    <label htmlFor="mdp-confirmation" className="mb-2 block text-sm font-semibold text-gray-700 dark:text-gray-300">Confirmer le mot de passe</label>
                    <div className="relative mb-6">
                        <Lock className="pointer-events-none absolute left-3 top-1/2 z-10 h-5 w-5 -translate-y-1/2 text-gray-400" />
                        <ChampMotDePasse id="mdp-confirmation" required minLength={10} maxLength={72} autoComplete="new-password" value={confirmation} onChange={e => setConfirmation(e.target.value)} className={authInput} />
                    </div>
                    <button type="submit" disabled={loading} className={authButton}>
                        {loading ? <><Loader2 className="h-5 w-5 animate-spin" />Enregistrement…</> : 'Changer mon mot de passe'}
                    </button>
                </form>
            )}
        </AuthCard>
    );
}
