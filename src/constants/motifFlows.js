// Assistant de motif : parcours de questions adaptés à la demande du patient.
// Ce n'est pas un diagnostic : les réponses servent à préparer la consultation (le motif est ensuite pré-rempli,
// modifiable) et à repérer les signes qui demandent une prise en charge rapide (option « urgent »).
//
// Types de question : choice (un choix), multi (plusieurs choix), yesno, text, number, date.
// « resume » est le libellé court utilisé dans le motif final ; « showIf(reponses) » masque une question selon les réponses précédentes.

const DUREES = ['Moins de 48 heures', 'Quelques jours', 'Plusieurs semaines', 'Plus de 3 mois'];
const choix = labels => labels.map(label => ({ label }));
const aucun = label => ({ label, exclusive: true });

const COMMENTAIRE = {
    id: 'commentaire', type: 'text', optional: true, resume: 'Précisions du patient', multiline: true,
    text: 'Souhaitez-vous ajouter une précision utile pour la sage-femme ou le médecin ? (facultatif)',
    placeholder: 'Ex. : j’ai un autre enfant en bas âge, je viens de loin, je préfère le matin…',
};

export const CATEGORIES = [
    {
        id: 'grossesse', label: 'Suivi de grossesse', emoji: '🤰', service: ['grossesse'],
        questions: [
            { id: 'etape', type: 'choice', resume: 'Étape de la grossesse', text: 'Où en êtes-vous de votre grossesse ?',
                options: choix(['Je pense être enceinte / test positif', '1er trimestre (jusqu’à 3 mois)', '2e trimestre (4 à 6 mois)', '3e trimestre (7 à 9 mois)', 'Je ne sais pas']) },
            { id: 'regles', type: 'date', optional: true, resume: 'Date des dernières règles', text: 'Connaissez-vous la date de vos dernières règles ? Elle permet de calculer le terme.', showIf: r => r.etape !== '3e trimestre (7 à 9 mois)' },
            { id: 'type', type: 'choice', resume: 'Type de consultation', text: 'Quel type de consultation souhaitez-vous ?',
                options: choix(['Première consultation prénatale', 'Consultation de suivi (mensuelle)', 'Montrer des résultats d’examens / d’analyses', 'Un symptôme m’inquiète']) },
            { id: 'symptomes', type: 'multi', resume: 'Symptômes signalés', text: 'Quels symptômes avez-vous ? (plusieurs choix possibles)', showIf: r => r.type === 'Un symptôme m’inquiète',
                options: [
                    { label: 'Saignements vaginaux', urgent: true },
                    { label: 'Perte de liquide (« perte des eaux »)', urgent: true },
                    { label: 'Maux de tête forts, vision trouble ou gonflement du visage / des mains', urgent: true },
                    { label: 'Le bébé bouge moins que d’habitude', urgent: true },
                    { label: 'Douleurs au ventre ou contractions régulières', urgent: true },
                    { label: 'Fièvre' },
                    { label: 'Nausées ou vomissements importants' },
                    { label: 'Brûlures urinaires' },
                    { label: 'Autre' },
                ] },
            { id: 'parite', type: 'choice', resume: 'Grossesses précédentes', text: 'Est-ce votre première grossesse ?', options: choix(['Oui, c’est la première', 'Non, j’ai déjà eu une ou plusieurs grossesses']) },
            { id: 'enfants', type: 'number', min: 0, max: 20, optional: true, resume: 'Nombre d’enfants', text: 'Combien d’enfants avez-vous déjà ?', showIf: r => r.parite && r.parite.startsWith('Non') },
            { id: 'antecedents', type: 'multi', resume: 'Antécédents', text: 'Avez-vous un de ces antécédents ?',
                options: [{ label: 'Césarienne précédente' }, { label: 'Fausse couche' }, { label: 'Accouchement prématuré' }, { label: 'Diabète' }, { label: 'Hypertension' }, aucun('Aucun / je ne sais pas')] },
            { id: 'allergies', type: 'text', optional: true, resume: 'Allergies / traitements en cours', text: 'Avez-vous des allergies ou prenez-vous des médicaments actuellement ? (facultatif)', placeholder: 'Ex. : allergie à la pénicilline, fer, paracétamol…' },
            COMMENTAIRE,
        ],
    },
    {
        id: 'echo', label: 'Échographie', emoji: '🖥️', service: ['échographie', 'echographie'],
        questions: [
            { id: 'type', type: 'choice', resume: 'Type d’échographie', text: 'Quelle échographie souhaitez-vous ?',
                options: choix(['1re échographie (confirmer et dater la grossesse)', 'Échographie morphologique (vers 5 mois)', 'Échographie de croissance (3e trimestre)', 'Échographie pelvienne / gynécologique', 'Je ne sais pas, c’est sur ordonnance']) },
            { id: 'ordonnance', type: 'yesno', resume: 'Ordonnance d’échographie', text: 'Avez-vous une ordonnance ou une demande d’un professionnel de santé ?' },
            { id: 'terme', type: 'text', optional: true, resume: 'Terme de la grossesse', text: 'Où en est la grossesse (en mois, ou date prévue d’accouchement) ? (facultatif)', showIf: r => !String(r.type || '').includes('pelvienne') },
            { id: 'douleur', type: 'yesno', resume: 'Douleurs ou saignements', text: 'Avez-vous actuellement des douleurs ou des saignements ?', urgentIf: v => v === 'Oui' },
            COMMENTAIRE,
        ],
    },
    {
        id: 'planning', label: 'Planning familial / contraception', emoji: '💊', service: ['planning'],
        questions: [
            { id: 'demande', type: 'choice', resume: 'Demande', text: 'Que souhaitez-vous ?',
                options: choix(['Commencer une contraception', 'Changer de méthode', 'Suivi / renouvellement de ma méthode', 'Retrait d’un implant ou d’un stérilet', 'Avoir des conseils pour concevoir un enfant', 'Autre']) },
            { id: 'methode', type: 'multi', resume: 'Méthode actuelle ou envisagée', text: 'Quelle méthode utilisez-vous ou envisagez-vous ?',
                options: [{ label: 'Pilule' }, { label: 'Injection' }, { label: 'Implant' }, { label: 'Stérilet' }, { label: 'Préservatifs' }, { label: 'Méthode naturelle' }, aucun('Aucune / je ne sais pas encore')] },
            { id: 'effets', type: 'multi', resume: 'Effets gênants', text: 'Avez-vous des effets gênants avec votre méthode actuelle ?',
                options: [{ label: 'Saignements irréguliers' }, { label: 'Douleurs' }, { label: 'Maux de tête' }, { label: 'Prise de poids' }, { label: 'Baisse de moral' }, aucun('Aucun')] },
            { id: 'allaitement', type: 'yesno', resume: 'Allaitement en cours', text: 'Allaitez-vous actuellement ?' },
            { id: 'grossesse', type: 'yesno', resume: 'Possibilité de grossesse', text: 'Pensez-vous pouvoir être enceinte en ce moment ? (retard de règles, rapport récent non protégé…)', options: ['Oui', 'Non', 'Je ne sais pas'] },
            COMMENTAIRE,
        ],
    },
    {
        id: 'gyneco', label: 'Douleurs, règles, pertes (gynécologie)', emoji: '🩺', service: ['consultation'],
        questions: [
            { id: 'probleme', type: 'choice', resume: 'Problème principal', text: 'Quel est votre problème principal ?',
                options: choix(['Douleurs au bas-ventre / pelviennes', 'Règles irrégulières ou absentes', 'Règles très douloureuses ou très abondantes', 'Pertes ou démangeaisons', 'Saignements en dehors des règles', 'Difficulté à avoir un enfant', 'Contrôle / frottis', 'Ménopause', 'Autre']) },
            { id: 'depuis', type: 'choice', resume: 'Depuis', text: 'Depuis quand cela dure-t-il ?', options: choix(DUREES) },
            { id: 'intensite', type: 'number', min: 0, max: 10, resume: 'Intensité de la douleur (0 à 10)', text: 'Si vous avez mal, quelle est l’intensité de la douleur de 0 (aucune) à 10 (insupportable) ?', optional: true, urgentIf: v => Number(v) >= 8,
                showIf: r => String(r.probleme || '').toLowerCase().includes('douleur') },
            { id: 'fievre', type: 'yesno', resume: 'Fièvre', text: 'Avez-vous de la fièvre (ou des frissons) ?', urgentIf: (v, r) => v === 'Oui' && String(r.probleme || '').includes('Douleurs') },
            { id: 'saignement', type: 'choice', resume: 'Saignements', text: 'Les saignements sont-ils abondants (plus d’une serviette complète par heure) ?', showIf: r => String(r.probleme || '').includes('Saignements') || String(r.probleme || '').includes('abondantes'),
                options: [{ label: 'Oui, très abondants', urgent: true }, { label: 'Non, modérés' }] },
            { id: 'grossesse', type: 'yesno', resume: 'Possibilité de grossesse', text: 'Pensez-vous pouvoir être enceinte ?', options: ['Oui', 'Non', 'Je ne sais pas'] },
            COMMENTAIRE,
        ],
    },
    {
        id: 'postpartum', label: 'Après l’accouchement', emoji: '👶', service: ['grossesse', 'consultation'],
        questions: [
            { id: 'quand', type: 'choice', resume: 'Date de l’accouchement', text: 'Quand avez-vous accouché ?', options: choix(['Il y a moins d’une semaine', 'Il y a 1 à 6 semaines', 'Il y a plus de 6 semaines']) },
            { id: 'voie', type: 'choice', resume: 'Type d’accouchement', text: 'Comment s’est passé l’accouchement ?', options: choix(['Voie basse (naturel)', 'Césarienne', 'Je préfère l’expliquer plus tard']) },
            { id: 'motif', type: 'multi', resume: 'Motif', text: 'Pourquoi souhaitez-vous consulter ?',
                options: [
                    { label: 'Visite post-natale (contrôle à 6 semaines)' },
                    { label: 'Difficultés d’allaitement' },
                    { label: 'Douleur ou problème de cicatrice' },
                    { label: 'Saignements abondants', urgent: true },
                    { label: 'Fièvre ou écoulement malodorant', urgent: true },
                    { label: 'Grande fatigue / tristesse persistante' },
                    { label: 'Contraception' },
                    { label: 'Question sur mon bébé' },
                ] },
            COMMENTAIRE,
        ],
    },
    {
        id: 'accouchement', label: 'Préparer mon accouchement', emoji: '🏥', service: ['accouchement'],
        questions: [
            { id: 'terme', type: 'date', optional: true, resume: 'Date prévue d’accouchement', text: 'Quelle est la date prévue de votre accouchement ? (facultatif)' },
            { id: 'demande', type: 'choice', resume: 'Demande', text: 'Que souhaitez-vous ?',
                options: [{ label: 'Visiter la maternité' }, { label: 'Séance de préparation à la naissance' }, { label: 'Organiser mon accouchement (pré-admission)' }, { label: 'Parler de mon projet de naissance' },
                    { label: 'J’ai des contractions régulières ou des signes de début de travail', urgent: true }] },
            { id: 'cesarienne', type: 'yesno', resume: 'Césarienne précédente', text: 'Avez-vous déjà accouché par césarienne ?' },
            COMMENTAIRE,
        ],
    },
    {
        id: 'vaccination', label: 'Vaccination', emoji: '💉', service: ['vaccin'],
        questions: [
            { id: 'pour', type: 'choice', resume: 'Pour', text: 'Pour qui est la vaccination ?', options: choix(['Moi (adulte)', 'Moi, je suis enceinte', 'Mon enfant / mon bébé']) },
            { id: 'age', type: 'text', optional: true, resume: 'Âge de l’enfant', text: 'Quel est l’âge de l’enfant ?', placeholder: 'Ex. : 2 mois', showIf: r => r.pour === 'Mon enfant / mon bébé' },
            { id: 'vaccin', type: 'multi', resume: 'Vaccin(s) souhaité(s)', text: 'Quel(s) vaccin(s) ?',
                options: [{ label: 'Tétanos' }, { label: 'BCG' }, { label: 'Polio' }, { label: 'Pentavalent' }, { label: 'Rougeole' }, { label: 'Hépatite B' }, { label: 'Autre' }, aucun('Je ne sais pas, je suivrai le carnet')] },
            { id: 'carnet', type: 'yesno', resume: 'Carnet de vaccination apporté', text: 'Pourrez-vous apporter le carnet de vaccination ?' },
            COMMENTAIRE,
        ],
    },
    {
        id: 'bebe', label: 'Mon bébé / mon enfant', emoji: '🍼', service: ['consultation', 'soin'],
        questions: [
            { id: 'age', type: 'choice', resume: 'Âge', text: 'Quel est l’âge de l’enfant ?', options: choix(['Moins de 1 mois', '1 à 6 mois', '6 à 12 mois', 'Plus de 1 an']) },
            { id: 'motif', type: 'multi', resume: 'Motif', text: 'Pourquoi souhaitez-vous consulter ?',
                options: [
                    { label: 'Pesée et suivi de croissance' },
                    { label: 'Fièvre' },
                    { label: 'Diarrhée ou vomissements' },
                    { label: 'Toux, rhume' },
                    { label: 'Difficultés pour respirer', urgent: true },
                    { label: 'Refuse de s’alimenter / très somnolent', urgent: true },
                    { label: 'Alimentation / allaitement' },
                    { label: 'Vaccins' },
                    { label: 'Autre' },
                ] },
            { id: 'fievre', type: 'yesno', resume: 'Bébé de moins de 3 mois avec fièvre', text: 'Votre bébé a-t-il moins de 3 mois ET de la fièvre ?', showIf: r => r.age === 'Moins de 1 mois' && (r.motif || []).includes('Fièvre'), urgentIf: v => v === 'Oui' },
            { id: 'depuis', type: 'choice', resume: 'Depuis', text: 'Depuis quand ?', options: choix(DUREES), showIf: r => (r.motif || []).some(m => ['Fièvre', 'Diarrhée ou vomissements', 'Toux, rhume'].includes(m)) },
            COMMENTAIRE,
        ],
    },
    {
        id: 'general', label: 'Consultation générale', emoji: '🩺', service: ['consultation'],
        questions: [
            { id: 'motif', type: 'choice', resume: 'Motif principal', text: 'Quel est le motif principal ?',
                options: choix(['Fièvre', 'Douleurs', 'Toux / rhume', 'Problème digestif', 'Bilan de santé / certificat', 'Renouvellement d’ordonnance', 'Autre']) },
            { id: 'depuis', type: 'choice', resume: 'Depuis', text: 'Depuis quand ?', options: choix(DUREES), showIf: r => !['Bilan de santé / certificat', 'Renouvellement d’ordonnance'].includes(r.motif) },
            { id: 'grave', type: 'multi', resume: 'Signes d’alerte', text: 'Avez-vous un de ces signes ?',
                options: [{ label: 'Difficulté à respirer', urgent: true }, { label: 'Douleur intense dans la poitrine', urgent: true }, { label: 'Malaise ou perte de connaissance', urgent: true }, aucun('Aucun de ces signes')] },
            { id: 'traitement', type: 'text', optional: true, resume: 'Traitements en cours / allergies', text: 'Prenez-vous des médicaments ou avez-vous des allergies ? (facultatif)' },
            COMMENTAIRE,
        ],
    },
    {
        id: 'autre', label: 'Autre demande', emoji: '💬', service: [],
        questions: [
            { id: 'demande', type: 'text', multiline: true, resume: 'Demande', text: 'Décrivez en quelques mots votre demande.', placeholder: 'Ex. : certificat, avis sur un résultat d’analyse…' },
            { id: 'depuis', type: 'choice', resume: 'Depuis', text: 'Si c’est un problème de santé, depuis quand ?', options: [...choix(DUREES), { label: 'Ce n’est pas un problème de santé' }], optional: true },
            COMMENTAIRE,
        ],
    },
];

export const getCategory = id => CATEGORIES.find(category => category.id === id);

/** Question suivante à poser (première question visible sans réponse), ou null si le parcours est terminé. */
export function nextQuestion(category, answers) {
    return category.questions.find(question =>
        !(question.id in answers) && (!question.showIf || question.showIf(answers))) || null;
}

/** Signes d'urgence repérés dans les réponses (libellés), pour avertir le patient. */
export function findRedFlags(category, answers) {
    const flags = [];
    for (const question of category.questions) {
        if (!(question.id in answers) || answers[question.id] == null) continue;
        const value = answers[question.id];
        const selected = Array.isArray(value) ? value : [value];
        for (const label of selected) {
            if (question.options?.some(option => option.urgent && option.label === label)) flags.push(label);
        }
        if (question.urgentIf?.(value, answers)) flags.push(question.resume);
    }
    return flags;
}

const formatValue = (question, value) => {
    if (Array.isArray(value)) return value.join(', ');
    if (question.type === 'date') return new Date(`${value}T12:00:00`).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });
    return String(value);
};

/** Texte du motif construit à partir des réponses (modifiable ensuite par le patient). */
export function buildMotif(category, answers) {
    const flags = findRedFlags(category, answers);
    const lines = [`Motif : ${category.label}`];
    for (const question of category.questions) {
        const value = answers[question.id];
        if (value == null || value === '' || (Array.isArray(value) && value.length === 0)) continue;
        lines.push(`${question.resume} : ${formatValue(question, value)}`);
    }
    if (flags.length) lines.unshift(`⚠ À TRAITER EN PRIORITÉ — signes signalés : ${[...new Set(flags)].join(' ; ')}`);
    return lines.join('\n').slice(0, 2000);
}
