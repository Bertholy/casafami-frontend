// Pages qui ont leur propre barre latérale (AdminLayout) : ni barre de navigation publique ni pied de page.
// Ces espaces du personnel restent toujours en français.
export const STAFF_PREFIXES = ['/medecin/dashboard', '/medecin/maladies', '/espace/', '/admin', '/corbeille', '/calendrier', '/statistiques', '/patients', '/assistant', '/messagerie'];

export const estEspacePersonnel = pathname => pathname.startsWith('/medecin') || STAFF_PREFIXES.some(prefixe => pathname.startsWith(prefixe));

/** Pages du site public qui acceptent des textes ajoutés, et leur identifiant. */
export const PAGES_EDITABLES = { '/': 'accueil', '/services': 'services', '/prendre-rdv': 'rdv', '/mes-rdv': 'mesrdv' };

/** Les pages de réservation (/prendre-rdv, /prendre-rdv/assistant, /prendre-rdv/formulaire) forment une seule page pour les titres et les textes modifiables. */
export const pagePublique = pathname => (pathname.startsWith('/prendre-rdv') ? '/prendre-rdv' : pathname);
