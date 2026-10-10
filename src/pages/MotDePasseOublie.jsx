import { useState } from 'react';
import { AlertCircle, CheckCircle2, Loader2, Mail } from 'lucide-react';
import axiosClient from '../api/axiosClient';
import AuthCard, { authButton, authInput } from '../components/AuthCard';
import { apiErrorMessage } from '../utils/auth';

/** Demande de lien pour choisir un nouveau mot de passe (personnel). La réponse est la même que le compte existe ou non. */
export default function MotDePasseOublie() {
    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState('');
    const [erreur, setErreur] = useState('');

    const envoyer = async event => {
        event.preventDefault();
        setLoading(true); setErreur(''); setMessage('');
        try {
            const { data } = await axiosClient.post('/auth/mot-de-passe-oublie', { email: email.trim() });
            setMessage(data.message);
        } catch (err) {
            setErreur(apiErrorMessage(err, 'La demande a échoué. Réessayez dans un instant.'));
        } finally { setLoading(false); }
    };

    return (
        <AuthCard titre="Mot de passe oublié" sousTitre="Saisissez l’adresse e-mail de votre compte : nous vous envoyons un lien pour en choisir un nouveau.">
            {message ? (
                <div role="status" className="flex items-start gap-3 rounded-xl border-l-4 border-emerald-500 bg-emerald-50 p-4 text-sm text-emerald-800 dark:bg-emerald-900/20 dark:text-emerald-300">
                    <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0" />
                    <div>
                        <p>{message}</p>
                        <p className="mt-2 text-xs opacity-80">Le lien est valable 30 minutes. Si rien n’arrive, demandez au super administrateur de réinitialiser votre mot de passe.</p>
                    </div>
                </div>
            ) : (
                <form onSubmit={envoyer}>
                    {erreur && (
                        <div role="alert" className="mb-6 flex items-center gap-3 rounded-xl border-l-4 border-red-500 bg-red-50 p-4 dark:bg-red-900/20">
                            <AlertCircle className="h-5 w-5 shrink-0 text-red-500" />
                            <p className="text-sm text-red-700 dark:text-red-400">{erreur}</p>
                        </div>
                    )}
                    <label className="mb-2 block text-sm font-semibold text-gray-700 dark:text-gray-300" htmlFor="email-oubli">Adresse e-mail</label>
                    <div className="relative mb-6">
                        <Mail className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
                        <input id="email-oubli" type="email" required value={email} onChange={e => setEmail(e.target.value)} placeholder="medecin@casafami.mg" autoComplete="email" className={authInput} />
                    </div>
                    <button type="submit" disabled={loading} className={authButton}>
                        {loading ? <><Loader2 className="h-5 w-5 animate-spin" />Envoi…</> : 'Envoyer le lien'}
                    </button>
                </form>
            )}
        </AuthCard>
    );
}
