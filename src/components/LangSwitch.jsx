import { Globe } from 'lucide-react';
import { useLang } from '../i18n/LangContext';

const OPTIONS = [['fr', 'FR', 'Français'], ['mg', 'MG', 'Malagasy']];

/**
 * Sélecteur de langue du site public (français / malgache), mémorisé dans le navigateur.
 * variante « clair » : sur fond clair (design doux) ; « sombre » : sur barre colorée.
 */
export default function LangSwitch({ className = '', variante = 'clair' }) {
    const { lang, setLang } = useLang();
    const clair = variante === 'clair';
    return (
        <div role="group" aria-label="Langue / Fiteny" className={`inline-flex items-center gap-1.5 rounded-full py-0.5 pl-2.5 pr-0.5 ${clair ? 'bg-white text-slate-600 shadow-[0_0_0_1px_#dce9f0] dark:bg-gray-800 dark:text-gray-300 dark:shadow-none' : 'bg-white/15 text-white backdrop-blur-sm'} ${className}`}>
            <Globe className={`h-4 w-4 shrink-0 ${clair ? 'text-teal-600 dark:text-teal-300' : 'text-white/90'}`} aria-hidden="true" />
            <div className="flex items-center">
                {OPTIONS.map(([code, court, nom]) => {
                    const actif = lang === code;
                    const styleActif = clair ? 'bg-teal-600 text-white' : 'bg-white text-(--mt-main)';
                    const styleInactif = clair ? 'text-slate-500 hover:bg-slate-100 dark:text-gray-300 dark:hover:bg-gray-700' : 'text-white/90 hover:bg-white/20 hover:text-white';
                    return (
                        <button key={code} type="button" onClick={() => setLang(code)} aria-pressed={actif} lang={code} title={nom}
                            className={`rounded-full px-3 py-1.5 text-xs font-extrabold tracking-wide transition focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-teal-500 ${actif ? styleActif : styleInactif}`}>
                            {court}
                            <span className="sr-only"> : {nom}</span>
                        </button>
                    );
                })}
            </div>
        </div>
    );
}
