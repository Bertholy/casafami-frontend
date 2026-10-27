import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { MessageSquare } from 'lucide-react';
import axiosClient from '../api/axiosClient';

const REFRESH_MS = 20000;

/** Icône de messagerie dans l'en-tête : nombre de messages non lus, mis à jour toutes les 20 secondes. */
export default function MessagerieBouton() {
    const [nonLus, setNonLus] = useState(0);

    useEffect(() => {
        const charger = () => { if (document.visibilityState === 'visible') axiosClient.get('/messagerie/non-lus').then(({ data }) => setNonLus(data.nonLus || 0)).catch(() => {}); };
        const premier = window.setTimeout(charger, 0);
        const intervalle = window.setInterval(charger, REFRESH_MS);
        window.addEventListener('focus', charger);
        window.addEventListener('casafami:messages', charger);
        return () => { window.clearTimeout(premier); window.clearInterval(intervalle); window.removeEventListener('focus', charger); window.removeEventListener('casafami:messages', charger); };
    }, []);

    return (
        <Link to="/messagerie" aria-label={nonLus ? `Messagerie : ${nonLus} message${nonLus > 1 ? 's' : ''} non lu${nonLus > 1 ? 's' : ''}` : 'Messagerie'} title="Messagerie"
            className={`relative inline-flex h-9 w-9 items-center justify-center rounded-lg border bg-(--st-panel) transition hover:bg-slate-100 dark:hover:bg-gray-800 ${nonLus ? 'border-teal-300 text-teal-700 dark:border-teal-500/40 dark:text-teal-300' : 'border-(--st-line) text-slate-600 dark:text-gray-300'}`}>
            <MessageSquare size={16} />
            {nonLus > 0 && <span className="absolute -right-1.5 -top-1.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-teal-600 px-1 text-[11px] font-bold text-white ring-2 ring-white dark:ring-gray-900">{nonLus > 9 ? '9+' : nonLus}</span>}
        </Link>
    );
}
