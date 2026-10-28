import { Link } from 'react-router-dom';
import { ArrowLeft, Clock, Heart, MapPin } from 'lucide-react';
import { APP_NAME } from '../constants/app';

// Le panneau du formulaire est toujours sombre (classe « dark » sur son conteneur) : les textes des pages qui s'y trouvent
// prennent automatiquement leurs variantes sombres ; les champs ont leur propre style clair sur sombre.
export const authInput = 'w-full rounded-2xl border border-white/15 bg-white/5 py-3 pl-11 pr-4 text-white outline-none transition placeholder:text-white/40 focus:border-(--mt-main) focus:bg-white/10 focus:ring-4 focus:ring-(--mt-main)/20';
export const authButton = 'flex w-full items-center justify-center gap-2 rounded-full bg-(--mt-bouton) py-4 font-bold text-(--mt-sur-bouton) shadow-[0_14px_30px_rgba(3,204,230,.35)] transition hover:brightness-95 disabled:opacity-50';

/**
 * Page de connexion du personnel en deux moitiés : la photo du cabinet à gauche (une bande en haut sur téléphone),
 * le formulaire sur un panneau bleu nuit à droite.
 */
export function AuthFond({ children }) {
    return (
        <div className="auth-vagues flex min-h-screen items-center justify-center p-4 pb-24 sm:p-8 sm:pb-28">
            <div className="relative z-10 grid w-full max-w-5xl overflow-hidden rounded-[2.5rem] shadow-[0_30px_70px_-20px_rgba(6,48,58,.45)] ring-1 ring-white/10 lg:min-h-[640px] lg:grid-cols-2">

                {/* Photo (téléphone : bande en haut) */}
                <div className="relative h-44 lg:hidden">
                    <img src="/cabinet_1.jpg" alt="" aria-hidden="true" className="absolute inset-0 h-full w-full object-cover" />
                    <div aria-hidden="true" className="absolute inset-0 bg-linear-to-t from-[#0e2a38] via-[#0e2a38]/30 to-transparent" />
                </div>

                {/* Photo (ordinateur : moitié gauche) */}
                <div className="relative hidden lg:block">
                    <img src="/cabinet_1.jpg" alt="Le cabinet CASAFAMI" className="absolute inset-0 h-full w-full object-cover" />
                    <div aria-hidden="true" className="absolute inset-0 bg-linear-to-t from-[#0e2a38]/90 via-[#0e2a38]/10 to-[#0e2a38]/30" />
                    <div className="relative flex h-full flex-col justify-between p-8">
                        <Link to="/" aria-label="Retour à l’accueil du site" className="flex w-fit items-center gap-3">
                            <img src="/logo_casafami.png" alt="" className="h-11 w-11 rounded-2xl bg-white object-contain p-1" />
                            <span className="text-sm font-extrabold uppercase tracking-[0.16em] text-white drop-shadow">{APP_NAME}</span>
                        </Link>
                        <div className="rounded-3xl border border-white/20 bg-white/10 p-5 text-white backdrop-blur-md">
                            <p className="text-lg font-extrabold leading-snug">Cabinet d'accouchement Sainte Famille</p>
                            <p className="mt-1 flex items-center gap-2 text-sm text-white/80"><MapPin className="h-4 w-4 shrink-0" />Andongona, Antsohihy</p>
                            <div className="mt-4 flex flex-wrap gap-2 text-xs font-bold">
                                <span className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1.5"><Clock className="h-3.5 w-3.5" />Ouvert 7j/7</span>
                                <span className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1.5"><Heart className="h-3.5 w-3.5 text-[#ff9a7a]" />Urgences 24h/24</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Formulaire */}
                <div className="dark flex flex-col justify-center bg-[#0e2a38] px-6 py-10 text-white sm:px-12">
                    <div className="mx-auto w-full max-w-sm">{children}</div>
                </div>
            </div>
        </div>
    );
}

/** En-tête du formulaire : titre et sous-titre, centrés. */
export function AuthEntete({ titre, sousTitre }) {
    return (
        <div className="mb-8 text-center">
            <h1 className="mb-2 text-3xl font-extrabold text-white">{titre}</h1>
            {sousTitre && <p className="text-sm text-white/70">{sousTitre}</p>}
        </div>
    );
}

/** Contenu du formulaire (le panneau sombre fait office de carte). */
export function AuthCarte({ children, ...props }) {
    return <div {...props}>{children}</div>;
}

/** Page centrée des écrans de connexion du personnel (mot de passe oublié, nouveau mot de passe). */
export default function AuthCard({ titre, sousTitre, children }) {
    return (
        <AuthFond>
            <AuthEntete titre={titre} sousTitre={sousTitre} />
            <AuthCarte>{children}</AuthCarte>
            <div className="mt-6 text-center">
                <Link to="/medecin/login" className="inline-flex items-center gap-2 text-sm font-semibold text-white/80 hover:text-white hover:underline"><ArrowLeft className="h-4 w-4" />Retour à la connexion {APP_NAME}</Link>
            </div>
        </AuthFond>
    );
}
