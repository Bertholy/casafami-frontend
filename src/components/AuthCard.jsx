import { Link } from 'react-router-dom';
import { ArrowLeft, Stethoscope } from 'lucide-react';
import { APP_NAME } from '../constants/app';

export const authInput = 'w-full rounded-2xl border border-slate-200 bg-slate-50 py-3 pl-11 pr-4 text-slate-800 outline-none transition focus:border-teal-500 focus:bg-white focus:ring-4 focus:ring-teal-500/15 dark:border-gray-700 dark:bg-gray-900 dark:text-white';
export const authButton = 'flex w-full items-center justify-center gap-2 rounded-full bg-(--mt-bouton) py-4 font-bold text-(--mt-sur-bouton) shadow-[0_14px_30px_rgba(3,204,230,.35)] transition hover:brightness-95 disabled:opacity-50';

/** Fond des pages de connexion du personnel : photo du cabinet sous un voile bleu nuit, la carte du formulaire flotte dessus. */
export function AuthFond({ children }) {
    return (
        <div className="relative isolate flex min-h-screen items-center justify-center px-4 py-12">
            <img src="/cabinet_1.jpg" alt="" aria-hidden="true" className="absolute inset-0 -z-20 h-full w-full object-cover" />
            <div aria-hidden="true" className="absolute inset-0 -z-10 bg-linear-to-br from-[#0e2a38]/90 via-[#0e2a38]/70 to-[#0e2a38]/50" />
            <div className="w-full max-w-md">{children}</div>
        </div>
    );
}

/** En-tête (logo, titre, sous-titre) écrit en clair sur la photo. */
export function AuthEntete({ titre, sousTitre }) {
    return (
        <div className="mb-7 text-center">
            <div className="mx-auto mb-5 flex h-20 w-20 items-center justify-center rounded-3xl bg-white/95 shadow-[0_20px_44px_rgba(0,0,0,.3)]">
                <img src="/logo_casafami.png" alt="" className="h-14 w-14 object-contain" onError={e => { e.currentTarget.style.display = 'none'; }} />
                <Stethoscope className="hidden h-10 w-10 text-teal-600" />
            </div>
            <h1 className="mb-2 text-3xl font-extrabold text-white drop-shadow">{titre}</h1>
            {sousTitre && <p className="text-sm text-white/85">{sousTitre}</p>}
        </div>
    );
}

/** Carte blanche très arrondie du formulaire. */
export function AuthCarte({ children, ...props }) {
    return <div {...props} className="rounded-[2rem] bg-white/95 p-8 shadow-[0_30px_70px_rgba(0,0,0,.35)] backdrop-blur dark:bg-gray-800/95">{children}</div>;
}

/** Carte centrée des pages de connexion du personnel (mot de passe oublié, nouveau mot de passe). */
export default function AuthCard({ titre, sousTitre, children }) {
    return (
        <AuthFond>
            <AuthEntete titre={titre} sousTitre={sousTitre} />
            <AuthCarte>{children}</AuthCarte>
            <div className="mt-5 text-center">
                <Link to="/medecin/login" className="inline-flex items-center gap-2 text-sm font-semibold text-white/90 hover:text-white hover:underline"><ArrowLeft className="h-4 w-4" />Retour à la connexion {APP_NAME}</Link>
            </div>
        </AuthFond>
    );
}
