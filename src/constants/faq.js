/**
 * Questions fréquentes des patients. Les réponses reprennent les règles réelles du site (annulation jusqu'à 2 heures avant,
 * un rendez-vous par nom ou numéro sur 7 jours, retrouver son rendez-vous avec la clé de suivi…) : à mettre à jour si elles changent.
 */
export const GROUPES = [
    {
        titre: 'Prendre rendez-vous',
        questions: [
            { q: 'Comment prendre rendez-vous ?', r: 'Ouvrez « Prendre rendez-vous » et choisissez : l’assistant vous pose les questions une à une, ou vous remplissez vous-même le formulaire (service, motif, date et heure). Dans les deux cas, vous pouvez passer de l’un à l’autre sans perdre vos réponses.' },
            { q: 'Faut-il créer un compte ?', r: 'Non. Il suffit d’indiquer votre nom, votre âge et votre numéro de téléphone. Pas d’inscription, pas de mot de passe.' },
            { q: 'Que signifie « En cours » sur mon rendez-vous ?', r: 'Votre demande est enregistrée, mais le cabinet ne l’a pas encore confirmée. Vous êtes prévenu par message dès qu’elle l’est.' },
            { q: 'Puis-je prendre plusieurs rendez-vous ?', r: 'Un même nom ou un même numéro de téléphone ne peut avoir qu’une réservation sur 7 jours. Si vous essayez d’en faire une seconde, le site vous indique le rendez-vous existant et la date à partir de laquelle vous pourrez en reprendre un, ou dès que le premier est annulé.' },
            { q: 'L’assistant peut-il me donner un avis médical ?', r: 'Non. L’assistant vous aide à remplir le formulaire et à choisir le bon service. Il n’établit aucun diagnostic et ne donne aucun conseil médical.' },
        ],
    },
    {
        titre: 'Mon rendez-vous',
        questions: [
            { q: 'Comment retrouver mon rendez-vous ?', r: 'Dans « Mes rendez-vous », saisissez votre clé de suivi (par exemple CF-7K3M-9QX2) ou scannez le code qui figure sur votre reçu. La clé s’affiche à la fin de la réservation.' },
            { q: 'J’ai perdu ma clé de suivi, que faire ?', r: 'Contactez le cabinet par téléphone : l’équipe pourra retrouver votre rendez-vous.' },
            { q: 'Comment annuler mon rendez-vous ?', r: 'Retrouvez-le dans « Mes rendez-vous » et choisissez « Annuler ». L’annulation est possible jusqu’à 2 heures avant l’heure prévue ; passé ce délai, appelez le cabinet.' },
            { q: 'Où télécharger mon reçu ?', r: 'Sur la page de confirmation après la réservation, ou plus tard dans « Mes rendez-vous », avec le bouton « Télécharger » : au choix en document PDF ou en image.' },
        ],
    },
    {
        titre: 'Le cabinet',
        questions: [
            { q: 'Que faire en cas d’urgence ?', r: 'N’attendez pas un rendez-vous : appelez le cabinet (urgences 24h/24) ou rendez-vous directement sur place. C’est le cas pour des saignements, des douleurs intenses, une perte des eaux ou un bébé qui bouge moins.' },
            { q: 'Quels sont les horaires et l’adresse ?', r: 'Les horaires et l’adresse du cabinet, à Andongona - Antsohihy, sont en bas de chaque page. Un clic sur l’adresse ouvre la carte, un clic sur un numéro lance l’appel.' },
            { q: 'Le site existe-t-il en malgache ?', r: 'Oui. Le choix de la langue (français ou malgache) se trouve dans la barre du haut.' },
            { q: 'Comment mes données sont-elles protégées ?', r: 'Seul le personnel du cabinet y a accès, selon son rôle, et elles ne sont ni vendues ni utilisées pour de la publicité. Le détail est dans la politique de confidentialité.' },
        ],
    },
];
