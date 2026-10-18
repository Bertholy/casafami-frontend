import { useEffect, useRef, useState } from 'react';
import { Check, ChevronDown, Loader2 } from 'lucide-react';
import { useLang } from '../i18n/LangContext';

// Choix du service : un champ qui affiche « Je ne sais pas encore » ; un clic déroule la liste des services.
export default function ServiceSelect({ services, statut, value, onChange, onRetry }) {
    const { t } = useLang();
    const [ouvert, setOuvert] = useState(false);
    const racine = useRef(null);

    useEffect(() => {
        if (!ouvert) return undefined;
        const fermerSiDehors = e => { if (racine.current && !racine.current.contains(e.target)) setOuvert(false); };
        const fermerAvecEchap = e => { if (e.key === 'Escape') setOuvert(false); };
        document.addEventListener('mousedown', fermerSiDehors);
        document.addEventListener('keydown', fermerAvecEchap);
        return () => { document.removeEventListener('mousedown', fermerSiDehors); document.removeEventListener('keydown', fermerAvecEchap); };
    }, [ouvert]);

    const options = [{ id: '', nom: 'Je ne sais pas encore' }, ...services];
    const choisi = options.find(o => String(o.id) === String(value)) || options[0];
    const choisir = id => { onChange(String(id)); setOuvert(false); };

    return (
        <div ref={racine} className="relative">
            <button
                type="button"
                id="serviceId"
                aria-haspopup="listbox"
                aria-expanded={ouvert}
                onClick={() => setOuvert(o => !o)}
                className="flex w-full items-center justify-between gap-3 rounded-xl border-2 border-gray-200 bg-white px-4 py-3 text-left text-gray-800 transition focus:border-teal-500 focus:outline-none dark:border-gray-700 dark:bg-gray-900 dark:text-white"
            >
                <span className="truncate">{t(choisi.nom)}</span>
                <ChevronDown className={`h-5 w-5 shrink-0 text-teal-600 transition ${ouvert ? 'rotate-180' : ''}`} />
            </button>

            {ouvert && (
                <ul role="listbox" aria-labelledby="serviceId" className="absolute z-20 mt-1 max-h-72 w-full overflow-auto rounded-xl border border-gray-200 bg-white py-1 shadow-xl dark:border-gray-700 dark:bg-gray-900">
                    {statut === 'chargement' && (
                        <li className="flex items-center gap-2 px-4 py-3 text-sm text-gray-500 dark:text-gray-400"><Loader2 className="h-4 w-4 animate-spin" />{t("Chargement des services...")}</li>
                    )}
                    {statut === 'erreur' && (
                        <li className="px-4 py-3 text-sm text-red-700 dark:text-red-300">{t("Impossible de charger les services")}. <button type="button" onClick={onRetry} className="font-semibold underline">{t("Réessayer")}</button></li>
                    )}
                    {options.map(option => {
                        const actif = String(option.id) === String(value);
                        return (
                            <li key={option.id || 'aucun'} role="option" aria-selected={actif}>
                                <button
                                    type="button"
                                    onClick={() => choisir(option.id)}
                                    className={`flex w-full items-center justify-between gap-3 px-4 py-2.5 text-left text-sm transition hover:bg-teal-50 dark:hover:bg-gray-800 ${actif ? 'font-semibold text-teal-700 dark:text-teal-300' : 'text-gray-700 dark:text-gray-300'}`}
                                >
                                    {t(option.nom)}
                                    {actif && <Check className="h-4 w-4 shrink-0" />}
                                </button>
                            </li>
                        );
                    })}
                </ul>
            )}
        </div>
    );
}
