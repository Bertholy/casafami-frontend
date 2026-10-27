// Détail de chaque service, affiché quand on déplie un service sur la page « Nos services ».
// Les services viennent de la base (nom et description modifiables par l'administration) : on retrouve ici le détail par un mot du nom,
// comme pour les images. Le contenu reprend ce que l'assistant de rendez-vous propose déjà pour chaque service (constants/motifFlows.js).
// `inclus` : ce que comprend le service ; `avant` : ce qu'il faut apporter ou savoir ; `urgence` : quand ne pas attendre un rendez-vous.

const DETAILS = [
    {
        mots: ['consultation'],
        resume: 'Une consultation avec le médecin ou la sage-femme pour un souci de santé, un bilan ou une ordonnance à renouveler.',
        inclus: ['Fièvre, douleurs, toux ou rhume', 'Troubles digestifs', 'Douleurs au ventre, règles, pertes (gynécologie)', 'Bilan de santé et certificat', 'Renouvellement d’ordonnance', 'Suivi de l’enfant : pesée et croissance'],
        avant: ['Apportez votre carnet de santé, vos anciennes ordonnances et vos résultats d’examens.', 'Notez depuis quand les symptômes ont commencé : cela aide l’équipe.'],
        urgence: 'Difficulté à respirer, douleur intense dans la poitrine, malaise : n’attendez pas un rendez-vous, appelez le cabinet.',
    },
    {
        mots: ['soin'],
        resume: 'Les soins courants réalisés par l’infirmier ou l’infirmière, sur prescription ou pour un contrôle simple.',
        inclus: ['Pansement et soin de plaie', 'Injection prescrite par un médecin', 'Perfusion', 'Prise de tension et de glycémie', 'Retrait de fils ou de points de suture'],
        avant: ['Apportez l’ordonnance pour une injection ou une perfusion.', 'Pour une plaie, signalez tout de suite une rougeur qui s’étend, du pus ou de la fièvre.'],
    },
    {
        mots: ['vaccin'],
        resume: 'La vaccination des adultes, des femmes enceintes et des enfants, selon le carnet de vaccination.',
        inclus: ['Tétanos', 'BCG', 'Polio', 'Pentavalent', 'Rougeole', 'Hépatite B', 'Vaccination de l’adulte, de la femme enceinte et de l’enfant'],
        avant: ['Apportez le carnet de vaccination : l’équipe y note chaque vaccin.', 'Signalez toute fièvre ou maladie en cours le jour du rendez-vous.'],
    },
    {
        mots: ['analyse'],
        resume: 'Les analyses de sang et les tests rapides, avec ou sans ordonnance.',
        inclus: ['Prise de sang (bilan complet)', 'Test de paludisme', 'Glycémie (sucre dans le sang)', 'Groupe sanguin', 'Test de grossesse'],
        avant: ['Apportez l’ordonnance si les analyses ont été prescrites.', 'Certains examens se font à jeun : demandez-le à l’équipe en prenant rendez-vous.'],
    },
    {
        mots: ['grossesse'],
        resume: 'Un accompagnement du début de la grossesse jusqu’après la naissance, avec une consultation chaque mois.',
        inclus: ['Première consultation prénatale', 'Consultation de suivi mensuelle', 'Calcul du terme à partir des dernières règles', 'Mesures et surveillance : tension, cœur du bébé', 'Lecture de vos résultats d’examens', 'Visite après l’accouchement'],
        avant: ['Apportez votre carnet de grossesse et vos résultats d’examens.', 'Retrouvez la date de vos dernières règles : elle sert à calculer le terme.'],
        urgence: 'Saignements, perte de liquide, maux de tête forts avec vision trouble, bébé qui bouge moins : appelez le cabinet sans attendre.',
    },
    {
        mots: ['accouchement'],
        resume: 'La préparation de la naissance, pour arriver à l’accouchement informée et sereine.',
        inclus: ['Visite de la maternité', 'Séance de préparation à la naissance', 'Organisation de l’accouchement (pré-admission)', 'Échange sur votre projet de naissance'],
        avant: ['Venez avec votre carnet de grossesse et vos questions : il n’y en a pas de petites.'],
        urgence: 'Contractions régulières ou signes de début de travail : appelez le cabinet ou venez directement, sans rendez-vous.',
    },
    {
        mots: ['échographie', 'echographie'],
        resume: 'Les échographies de la grossesse et les échographies pelviennes, réalisées au cabinet.',
        inclus: ['1re échographie : confirmer et dater la grossesse', 'Échographie morphologique (vers 5 mois)', 'Échographie de croissance (3e trimestre)', 'Échographie pelvienne ou gynécologique'],
        avant: ['Apportez l’ordonnance ou la demande d’un professionnel de santé.', 'Indiquez le terme de la grossesse, en mois ou en date prévue d’accouchement.'],
        urgence: 'Douleurs ou saignements en ce moment : appelez le cabinet avant de venir.',
    },
    {
        mots: ['planning'],
        resume: 'Des conseils et un suivi pour choisir la contraception qui vous convient, ou pour préparer une grossesse.',
        inclus: ['Commencer ou changer de contraception', 'Pilule, injection, implant, stérilet, préservatifs, méthodes naturelles', 'Suivi et renouvellement de votre méthode', 'Retrait d’un implant ou d’un stérilet', 'Conseils pour concevoir un enfant'],
        avant: ['Dites si vous allaitez ou si vous pensez être enceinte.', 'Parlez des effets qui vous gênent avec votre méthode actuelle.'],
    },
];

/** Détail du service dont le nom contient un des mots-clés ci-dessus, ou null (le service s'affiche alors sans détail). */
export function detailsDuService(nom) {
    const bas = String(nom || '').toLowerCase();
    return DETAILS.find(detail => detail.mots.some(mot => bas.includes(mot))) || null;
}
