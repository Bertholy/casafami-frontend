import { X } from 'lucide-react';

const TONES = {
    success: 'border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-200',
    error: 'border-rose-200 bg-rose-50 text-rose-800 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-200',
    warning: 'border-amber-200 bg-amber-50 text-amber-900 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-200',
    info: 'border-sky-200 bg-sky-50 text-sky-900 dark:border-sky-500/30 dark:bg-sky-500/10 dark:text-sky-200',
};

/** Bandeau de message (succès, erreur, avertissement, information) ; `onClose` ajoute un bouton de fermeture. */
export default function Notice({ tone = 'info', onClose, children }) {
    if (!children) return null;
    return (
        <div role={tone === 'error' ? 'alert' : 'status'} className={`flex items-start justify-between gap-3 rounded-xl border px-4 py-3 text-sm ${TONES[tone]}`}>
            <div className="min-w-0">{children}</div>
            {onClose && <button onClick={onClose} aria-label="Fermer" className="shrink-0"><X size={16} /></button>}
        </div>
    );
}
