import { useSyncExternalStore } from 'react';

/**
 * Notifications (toasts) de l'espace du personnel : on les lance de n'importe où, sans composant à brancher.
 *   toast.success('Rendez-vous confirmé.');
 *   toast.error('Impossible d’enregistrer.');
 *   toast.info('…', { action: { label: 'Annuler', onClick: () => … }, duration: 8000, onClose: () => … });
 * Le composant <Toaster /> (components/ui/toaster.jsx), monté une fois dans AdminLayout, les affiche.
 */
let liste = [];
let compteur = 0;
const ecouteurs = new Set();
const emettre = () => ecouteurs.forEach(ecouteur => ecouteur());

const DUREES = { success: 5000, info: 6000, warning: 8000, error: 9000 };

function ajouter(type, message, options = {}) {
    if (!message) return null;
    // Même message déjà affiché : on ne l'empile pas une deuxième fois.
    const doublon = liste.find(item => item.type === type && item.message === message && !options.action);
    if (doublon) return doublon.id;
    const id = ++compteur;
    liste = [...liste, { id, type, message, duree: options.duration ?? DUREES[type], action: options.action, onClose: options.onClose }].slice(-4);
    emettre();
    return id;
}

function retirer(id) {
    const item = liste.find(element => element.id === id);
    if (!item) return;
    liste = liste.filter(element => element.id !== id);
    emettre();
    item.onClose?.();
}

export const toast = {
    success: (message, options) => ajouter('success', message, options),
    error: (message, options) => ajouter('error', message, options),
    warning: (message, options) => ajouter('warning', message, options),
    info: (message, options) => ajouter('info', message, options),
    dismiss: retirer,
};

export function useToasts() {
    return useSyncExternalStore(
        ecouteur => { ecouteurs.add(ecouteur); return () => ecouteurs.delete(ecouteur); },
        () => liste,
    );
}
