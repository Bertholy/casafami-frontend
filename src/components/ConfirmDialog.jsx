import { useEffect, useRef } from 'react';

/**
 * Fenêtre de confirmation accessible (remplace window.confirm) : le focus part sur « Retour » pour éviter une action
 * destructrice par un appui sur Entrée, Échap ou un clic à côté referme la fenêtre.
 */
export default function ConfirmDialog({ titre, message, confirmer, retour, enCours = false, onConfirm, onCancel }) {
    const boutonRetour = useRef(null);

    useEffect(() => {
        boutonRetour.current?.focus();
        const surTouche = e => { if (e.key === 'Escape') onCancel(); };
        document.addEventListener('keydown', surTouche);
        return () => document.removeEventListener('keydown', surTouche);
    }, [onCancel]);

    return (
        <div className="fixed inset-0 z-[90] flex items-center justify-center bg-black/50 px-4" onMouseDown={e => { if (e.target === e.currentTarget) onCancel(); }}>
            <section role="alertdialog" aria-modal="true" aria-labelledby="confirm-titre" aria-describedby="confirm-message" className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl dark:bg-gray-900">
                <h2 id="confirm-titre" className="text-lg font-bold text-gray-900 dark:text-white">{titre}</h2>
                <p id="confirm-message" className="mt-3 text-sm text-gray-600 dark:text-gray-300">{message}</p>
                <div className="mt-6 flex justify-end gap-3">
                    <button ref={boutonRetour} type="button" onClick={onCancel} className="rounded-xl border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-200 dark:hover:bg-gray-800">{retour}</button>
                    <button type="button" onClick={onConfirm} disabled={enCours} className="rounded-xl bg-rose-600 px-4 py-2 text-sm font-semibold text-white hover:bg-rose-700 disabled:opacity-60">{confirmer}</button>
                </div>
            </section>
        </div>
    );
}
