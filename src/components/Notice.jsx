import { useEffect, useRef } from 'react';
import { X } from 'lucide-react';
import { toast } from '../lib/toast';

// Bandeaux discrets : pas de fond ni de cadre coloré, seulement un trait à gauche dont la couleur indique le type de message.
const TONES = {
    success: 'border-emerald-500',
    error: 'border-rose-500',
    warning: 'border-amber-500',
    info: 'border-slate-300 dark:border-gray-600',
};

/**
 * Message (succès, erreur, avertissement, information). Un texte simple s'affiche en notification (toast) en bas à droite ;
 * `onClose` est appelé quand elle se ferme (la page peut ainsi vider son message). Un contenu plus riche (liens, listes)
 * reste un bandeau dans la page, avec un bouton de fermeture si `onClose` est fourni.
 */
export default function Notice({ tone = 'info', onClose, children }) {
    const message = typeof children === 'string' ? children : '';
    const fermeture = useRef(onClose);
    useEffect(() => { fermeture.current = onClose; });
    useEffect(() => {
        if (!message) return;
        toast[tone]?.(message, { onClose: () => fermeture.current?.() });
    }, [message, tone]);

    if (!children || message) return null;
    return (
        <div role={tone === 'error' ? 'alert' : 'status'} className={`flex items-start justify-between gap-3 border-l-2 py-1 pl-3 text-sm text-slate-600 dark:text-gray-300 ${TONES[tone]}`}>
            <div className="min-w-0">{children}</div>
            {onClose && <button onClick={onClose} aria-label="Fermer" className="shrink-0 text-slate-400 hover:text-slate-700 dark:hover:text-gray-200"><X size={16} /></button>}
        </div>
    );
}
