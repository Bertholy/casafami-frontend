import { Languages } from 'lucide-react';
import { useLang } from '../i18n/LangContext';

const OPTIONS = [['fr', 'FR', 'Français'], ['mg', 'MG', 'Malagasy']];

/** Sélecteur de langue du site public (français / malgache), mémorisé dans le navigateur. */
export default function LangSwitch({ className = '' }) {
    const { lang, setLang } = useLang();
    return (
        <div role="group" aria-label="Langue / Fiteny" className={`inline-flex items-center gap-1 rounded-lg bg-gray-100 p-1 dark:bg-gray-800 ${className}`}>
            <Languages className="ml-1 h-4 w-4 text-gray-500 dark:text-gray-400" aria-hidden="true" />
            {OPTIONS.map(([code, court, nom]) => (
                <button key={code} type="button" onClick={() => setLang(code)} aria-pressed={lang === code} title={nom} lang={code}
                    className={`rounded-md px-2.5 py-1 text-xs font-bold transition ${lang === code ? 'bg-teal-600 text-white shadow-sm' : 'text-gray-600 hover:bg-gray-200 dark:text-gray-300 dark:hover:bg-gray-700'}`}>
                    {court}
                </button>
            ))}
        </div>
    );
}
