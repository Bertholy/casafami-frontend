// Pages qui ont leur propre barre latérale (AdminLayout) : ni barre de navigation publique ni pied de page.
// Ces espaces du personnel restent toujours en français.
export const STAFF_PREFIXES = ['/medecin/dashboard', '/medecin/maladies', '/espace/', '/admin', '/corbeille', '/calendrier', '/statistiques', '/patients', '/assistant', '/messagerie'];

export const estEspacePersonnel = pathname => pathname.startsWith('/medecin') || STAFF_PREFIXES.some(prefixe => pathname.startsWith(prefixe));
