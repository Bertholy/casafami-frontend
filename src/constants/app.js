export const APP_NAME = 'CASAFAMI';

const ROLE_LABELS = Object.freeze({
    SUPER_ADMIN: 'Super administrateur',
    SECRETAIRE: 'Secrétaire',
    MEDECIN: 'Médecin',
    SAGE_FEMME: 'Sage-femme',
    INFIRMIERE: 'Infirmière',
});

export const getRoleLabel = role => ROLE_LABELS[role] || 'Compte interne';

export const getRoleSpaceTitle = role => `Espace ${getRoleLabel(role).toLocaleLowerCase('fr-FR')}`;

// Libellés et couleurs des statuts : la couleur n'est jamais seule, le libellé est toujours affiché.
export const STATUS = Object.freeze({
    EN_ATTENTE: { label: 'En attente', badge: 'bg-amber-100 text-amber-800 dark:bg-amber-500/15 dark:text-amber-300', dot: 'bg-amber-500' },
    CONFIRME: { label: 'Confirmé', badge: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-500/15 dark:text-emerald-300', dot: 'bg-emerald-500' },
    TERMINE: { label: 'Terminé', badge: 'bg-sky-100 text-sky-800 dark:bg-sky-500/15 dark:text-sky-300', dot: 'bg-sky-500' },
    ANNULE: { label: 'Annulé', badge: 'bg-rose-100 text-rose-800 dark:bg-rose-500/15 dark:text-rose-300', dot: 'bg-rose-500' },
});

const CABINET_TIMEZONE = 'Indian/Antananarivo';

/** Date du jour (AAAA-MM-JJ) à l'heure du cabinet, indépendamment du fuseau de l'ordinateur. */
export const todayISO = () => new Date().toLocaleDateString('en-CA', { timeZone: CABINET_TIMEZONE });

export const formatDateFr = (iso, options = { weekday: 'short', day: 'numeric', month: 'short' }) =>
    iso ? new Date(`${iso}T12:00:00`).toLocaleDateString('fr-FR', options) : '—';

export const hhmm = value => String(value ?? '').slice(0, 5);
