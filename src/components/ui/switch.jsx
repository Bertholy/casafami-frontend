import { cn } from '../../lib/utils';

/**
 * Interrupteur (toggle) accessible : un bouton role="switch" qui annonce « activé » ou « désactivé ».
 * `signale` entoure l'interrupteur d'un anneau ambre (valeur qui s'écarte de la valeur par défaut).
 */
export function Switch({ checked, onCheckedChange, disabled = false, label, signale = false, className }) {
    return (
        <button type="button" role="switch" aria-checked={checked} aria-label={label} disabled={disabled} onClick={() => onCheckedChange(!checked)}
            className={cn('relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--mt-main) disabled:cursor-not-allowed disabled:opacity-50',
                checked ? 'bg-(--mt-main)' : 'bg-slate-300 dark:bg-gray-600', signale && 'ring-2 ring-amber-400 ring-offset-1 ring-offset-white dark:ring-offset-gray-900', className)}>
            <span aria-hidden="true" className={cn('inline-block h-5 w-5 rounded-full bg-white shadow-sm transition-transform duration-200', checked ? 'translate-x-[22px]' : 'translate-x-0.5')} />
        </button>
    );
}
