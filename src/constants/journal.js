// Libellés lisibles des actions enregistrées par le serveur.
export const ACTIONS = {
    CONNEXION: 'Connexion', CONNEXION_ECHEC: 'Échec de connexion', RDV_CREE: 'Rendez-vous créé', RDV_MODIFIE: 'Rendez-vous modifié',
    RDV_CONFIRME: 'Rendez-vous confirmé', RDV_TERMINE: 'Rendez-vous terminé', RDV_ANNULE: 'Rendez-vous annulé', RDV_CORBEILLE: 'Mis en corbeille',
    RDV_RESTAURE: 'Restauré de la corbeille', RDV_SUPPRIME_DEFINITIVEMENT: 'Supprimé définitivement', CORBEILLE_VIDEE: 'Corbeille vidée',
    COMPTE_CREE: 'Compte créé', COMPTE_MODIFIE: 'Compte modifié', COMPTE_SUPPRIME: 'Compte supprimé', ROLE_MODIFIE: 'Rôle modifié',
    MOT_DE_PASSE_REINITIALISE: 'Mot de passe réinitialisé', MOT_DE_PASSE_CHANGE: 'Mot de passe changé',
    SERVICE_CREE: 'Service ajouté', SERVICE_SUPPRIME: 'Service supprimé', THEME_MODIFIE: 'Thème modifié',
    SITE_MODIFIE: 'Site modifié', SITE_REINITIALISE: 'Site réinitialisé', PLANNING_MODIFIE: 'Planning modifié', JOUR_FERME: 'Jour fermé', JOUR_ROUVERT: 'Jour rouvert',
    DOSSIER_MODIFIE: 'Dossier patient modifié', CONSULTATION_CREEE: 'Consultation enregistrée', CONSULTATION_MODIFIEE: 'Consultation modifiée', CONSULTATION_SUPPRIMEE: 'Consultation supprimée',
    MALADIE_CREEE: 'Maladie ajoutée', MALADIE_MODIFIEE: 'Maladie modifiée', MALADIE_SUPPRIMEE: 'Maladie supprimée',
    TRAITEMENT_AJOUTE: 'Traitement ajouté', TRAITEMENT_MODIFIE: 'Traitement modifié', TRAITEMENT_SUPPRIME: 'Traitement supprimé',
    EXPORT: 'Export', ENCODAGE_REPARE: 'Textes cassés réparés', RAPPELS_ENVOYES: 'Rappels envoyés', RAPPELS_MANUELS: 'Rappels envoyés (manuel)',
    RDV_ATTRIBUE: 'Rendez-vous attribué', RDV_ATTRIBUTION_RETIREE: 'Attribution retirée', RDV_ACCEPTE_PAR_PERSONNEL: 'Rendez-vous accepté',
    GROSSESSE_CREEE: 'Grossesse ouverte', GROSSESSE_MODIFIEE: 'Grossesse modifiée', GROSSESSE_TERMINEE: 'Grossesse clôturée', GROSSESSE_SUPPRIMEE: 'Grossesse supprimée',
    CPN_AJOUTEE: 'Consultation prénatale ajoutée', CPN_SUPPRIMEE: 'Consultation prénatale supprimée', ENFANT_AJOUTE: 'Enfant ajouté', ENFANT_SUPPRIME: 'Enfant supprimé',
    VACCIN_ENREGISTRE: 'Vaccin enregistré', VACCIN_ANNULE: 'Vaccin annulé', SERVICE_MODIFIE: 'Service modifié', SAUVEGARDE: 'Sauvegarde',
    PERMISSIONS_ROLE: 'Droits d’un rôle modifiés', PERMISSIONS_PERSONNE: 'Droits d’une personne modifiés',
};
export const GRAVES = ['CONNEXION_ECHEC', 'RDV_SUPPRIME_DEFINITIVEMENT', 'CORBEILLE_VIDEE', 'COMPTE_SUPPRIME', 'ROLE_MODIFIE', 'MOT_DE_PASSE_REINITIALISE', 'CONSULTATION_SUPPRIMEE'];
