import { Globe } from 'lucide-react';
import { useLang } from '../i18n/LangContext';

const OPTIONS = [['fr', 'FR', 'Français'], ['mg', 'MG', 'Malagasy']];

/** Sélecteur de langue du site public (français / malgache), mémorisé dans le navigateur. Conçu pour la barre de navigation colorée. */
export default function LangSwitch({ className = '' }) {
    const { lang, setLang } = useLang();
    return (
        <div role="group" aria-label="Langue / Fiteny" className={`inline-flex items-center gap-1.5 rounded-full bg-white/15 py-0.5 pl-2.5 pr-0.5 text-white backdrop-blur-sm ${className}`}>
            <Globe className="h-4 w-4 shrink-0 text-white/90" aria-hidden="true" />
            <div className="flex items-center">
                {OPTIONS.map(([code, court, nom]) => {
                    const actif = lang === code;
                    return (
                        <button key={code} type="button" onClick={() => setLang(code)} aria-pressed={actif} lang={code} title={nom}
                            className={`rounded-full px-3 py-1.5 text-xs font-extrabold tracking-wide transition focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-white ${actif ? 'bg-white text-(--mt-main) shadow-sm' : 'text-white/90 hover:bg-white/20 hover:text-white'}`}>
                            {court}
                            <span className="sr-only"> — {nom}</span>
                        </button>
                    );
                })}
            </div>
        </div>
    );
}
