// Reconnaissance du service adapté à partir d'une phrase libre du patient (français ou malgache).
// Ce n'est pas un diagnostic : on repère des mots-clés pour orienter vers le bon service du cabinet.
// Fonctionne sans connexion à un service externe ; les mots-clés sont comparés sans accents ni majuscules.
// Un mot terminé par « * » correspond à tous les mots qui commencent ainsi (« vaccin* » : vaccin, vaccination, vacciner…).

/** À quoi sert chaque service : affiché au patient, qui ne connaît pas forcément le nom des services. */
export const AIDE = {
    grossesse: 'Consultations prénatales et suivi de la mère et du bébé pendant la grossesse.',
    echo: 'Image du bébé ou du ventre (échographie), sur ordonnance ou pour suivre la grossesse.',
    planning: 'Contraception, conseils pour espacer les naissances ou pour avoir un enfant.',
    gyneco: 'Problèmes de règles, douleurs du bas-ventre, pertes, frottis, ménopause.',
    postpartum: 'Suivi de la maman après la naissance : cicatrice, allaitement, contrôle à 6 semaines.',
    accouchement: 'Préparer et organiser votre accouchement, visite de la maternité.',
    vaccination: 'Vaccins des adultes, des femmes enceintes et des enfants.',
    bebe: 'Consultation du nourrisson et de l’enfant : pesée, fièvre, toux, alimentation.',
    general: 'Consultation médicale pour une maladie courante : fièvre, toux, douleurs, certificat.',
    soins: 'Soins faits par l’infirmière : pansement, injection, perfusion, prise de tension.',
    analyses: 'Prise de sang et tests de laboratoire : paludisme, glycémie, groupe sanguin.',
    autre: 'Une autre demande : décrivez-la en quelques mots.',
};

// Mots-clés par service : [poids 3 = très caractéristique, 2 = probable, 1 = indice faible].
const MOTS = {
    grossesse: {
        3: ['enceinte*', 'grossesse*', 'bevohoka', 'vohoka', 'prenatal*', 'cpn', 'trimestre*', 'fitondrana vohoka', 'retard de regles', 'regles en retard', 'tara ny nenina', 'nenina tara', 'suivi de grossesse', 'mitondra vohoka', 'bebe dans le ventre'],
        2: ['nausees du matin', 'je attends un bebe', 'j attends un bebe', 'attends un bebe', 'mois de grossesse', 'semaines de grossesse', 'bebe bouge', 'mon bebe bouge', 'ventre qui grossit', 'dpa', 'terme'],
        1: ['sage femme', 'mpampivelona'],
    },
    echo: {
        3: ['echographie*', 'echo', 'echos', 'ultrason*', 'echo morphologique', 'sexe du bebe', 'voir le bebe', 'sary ny zaza'],
        2: ['image du bebe', 'imagerie', 'scanner le ventre', 'morphologique'],
    },
    planning: {
        3: ['contracepti*', 'pilule*', 'implant*', 'sterilet*', 'planning familial', 'preservatif*', 'kapoty', 'fisorohana ny fitondrana vohoka', 'fisorohana', 'espacer les naissances', 'eviter une grossesse', 'ne pas tomber enceinte', 'ne pas etre enceinte', 'dispositif intra uterin', 'diu', 'tsindrona fisorohana'],
        2: ['injection trimestrielle', 'depo provera', 'conseils pour concevoir', 'avoir un enfant', 'avoir un bebe', 'difficile d avoir un enfant', 'infertil*', 'sterilite', 'concevoir', 'manan janaka', 'maro ny zaza', 'pas d enfant'],
        1: ['tsindrona'],
    },
    gyneco: {
        3: ['regles douloureuses', 'regles irregulieres', 'regles abondantes', 'regles tres', 'regles qui', 'menstruation*', 'nenina', 'frottis', 'menopause*', 'pertes blanches', 'pertes vaginales', 'demangeaison*', 'mangidihidy', 'saignements hors des regles', 'saignement entre les regles', 'bas ventre', 'ambany kibo', 'fanaintainan ny ambany kibo', 'gynecolog*', 'ginekolojia', 'infection vaginale', 'fivoahana'],
        2: ['pertes', 'regles', 'kyste', 'fibrome', 'douleur pelvienne', 'pelvien*', 'brulures en urinant', 'mal en urinant'],
    },
    postpartum: {
        3: ['apres l accouchement', 'apres accouchement', 'post partum', 'postpartum', 'post natal*', 'postnatal*', 'j ai accouche', 'je viens d accoucher', 'ma cesarienne', 'cicatrice de cesarienne', 'aorian ny fiterahana', 'vao niteraka', 'niteraka aho', 'six semaines apres', 'apres la naissance', 'visite post natale'],
        2: ['allaitement', 'allaiter', 'mampinono', 'fampinonoana', 'lochies', 'mes seins', 'montee de lait', 'cicatrice', 'depuis mon accouchement', 'depuis la naissance'],
    },
    accouchement: {
        3: ['accoucher', 'accouchement', 'travail', 'contractions*', 'maternite', 'salle d accouchement', 'perte des eaux', 'poche des eaux', 'hiteraka', 'fiterahana', 'trano fiterahana', 'date prevue d accouchement', 'cesarienne programmee', 'preparation a la naissance', 'projet de naissance', 'pre admission'],
        2: ['naissance', 'terme proche', 'bientot accoucher', 'rano mivoaka'],
    },
    vaccination: {
        3: ['vaccin*', 'vaksiny', 'bcg', 'polio*', 'pentavalent*', 'tetanos', 'rougeole*', 'hepatite b', 'carnet de vaccination', 'carnet de sante', 'rappel de vaccin', 'rotavirus', 'pneumocoque', 'fanaovana vaksiny', 'mivaksiny'],
        2: ['piqure du bebe', 'injection du bebe', 'immunisation'],
    },
    bebe: {
        3: ['nourrisson*', 'mon enfant', 'mon fils', 'ma fille', 'mon petit', 'ma petite', 'zanako', 'zazako', 'zaza kely', 'bebe de', 'mon bebe', 'pesee', 'fandanjana', 'croissance', 'fitomboana', 'ankizy', 'tout petit', 'jeune enfant', 'bebe a'],
        2: ['bebe', 'zaza', 'enfant*', 'garcon', 'fillette', 'bambin'],
    },
    general: {
        3: ['fievre*', 'tazo', 'toux', 'kohaka', 'rhume*', 'sery', 'mal de tete', 'aretin doha', 'marary loha', 'paludisme', 'palu', 'diarrhee*', 'fivalanana', 'vomissement*', 'mandoa', 'mal de gorge', 'mal a la gorge', 'mal au ventre', 'kibo marary', 'marary kibo', 'certificat*', 'taratasy fanamarinana', 'ordonnance', 'renouveler', 'bilan de sante', 'fanaraha pahasalamana'],
        2: ['malade', 'marary', 'aretina', 'douleur*', 'fanaintainana', 'mal au dos', 'mal aux', 'fatigue*', 'reraka', 'courbatures', 'vertiges', 'tension', 'tosidra', 'toux grasse', 'grippe', 'fanafody', 'medicament*'],
        1: ['consulter', 'docteur', 'dokotera', 'medecin', 'inquiet', 'mal'],
    },
    soins: {
        3: ['pansement*', 'fehy', 'plaie*', 'ratra', 'perfusion*', 'point de suture', 'points de suture', 'fils de suture', 'retirer les fils', 'soins infirmiers', 'infirmier*', 'prise de tension', 'fakana tosidra', 'brulure*', 'abces', 'panser', 'desinfecter', 'blessure*', 'coupure*', 'mpitsabo', 'fitsaboana ratra'],
        2: ['injection*', 'piqure*', 'tsindrona', 'soin a domicile', 'glycemie', 'sirop'],
    },
    analyses: {
        4: ['test de paludisme', 'test paludisme', 'test du paludisme'],
        3: ['analyse*', 'prise de sang', 'fakana ra', 'fitiliana', 'bilan sanguin', 'groupe sanguin', 'vondrona ra', 'goutte epaisse', 'glycemie', 'taux de sucre', 'diabete', 'hemoglobine', 'numeration', 'nfs', 'laboratoire', 'urine', 'test de grossesse', 'test vih', 'depistage', 'selles', 'prelevement*'],
        2: ['resultats d examen', 'examens', 'bilan', 'anemie', 'sucre'],
    },
};

/** Signes qui demandent une prise en charge rapide, repérés dans la phrase (libellés français). */
const URGENCES = [
    { re: /(saign\w*.*(beaucoup|abondan|fort|trop|flot|inonde))|((beaucoup|abondan|trop).*saign)|(fivoahan.? ?dra.*(be|maro))/, label: 'Saignement abondant' },
    { re: /(perte de connaissance|evanoui\w*|inconscient|syncope|tombee? dans les pommes|very saina|tsy mahatsiaro tena)/, label: 'Perte de connaissance' },
    { re: /(difficult\w* (a|pour) respirer|respire (mal|difficilement)|etouff\w*|souffle court|sarotra ny miaina|tsy afaka miaina|tsy mahazaka miaina)/, label: 'Difficulté à respirer' },
    { re: /(convulsion\w*|crise (d.?epilepsie|convulsive)|fanintona|manintona)/, label: 'Convulsions' },
    { re: /(contractions?.*(regulier|rapproch|fort|toutes les)|(debut|signes?) (du|de) travail|perte des eaux|poche des eaux (rompue|percee)|rano mivoaka|rano nivoaka|manomboka ny fiterahana)/, label: 'Signes de début de travail ou perte des eaux' },
    { re: /((bebe|zaza|fetus).*(ne bouge (plus|pas)|bouge plus|tsy mihetsika)|(ne bouge plus|tsy mihetsika).*(bebe|zaza))/, label: 'Le bébé ne bouge plus' },
    { re: /((enceinte|grossesse|bevohoka).*(maux de tete (forts?|violents?|terribles?)|vue trouble|voit trouble|visage gonfle|mains gonflees|aretin doha mafy))|((maux de tete (forts?|violents?)|vue trouble|visage gonfle).*(enceinte|grossesse|bevohoka))/, label: 'Signes possibles de pré-éclampsie (maux de tête forts, vue trouble, gonflements)' },
    { re: /(douleur\w* (intense|violente|atroce) (dans|a) la poitrine|mal (intense|violent) (dans|a) la poitrine|fanaintainana mafy (ao|amin) ny tratra)/, label: 'Douleur intense dans la poitrine' },
];

const sansAccents = texte => String(texte ?? '').normalize('NFD').replace(/[̀-ͯ]/g, '');

/** Minuscules, sans accents ni ponctuation : « J’ai mal à la tête ! » → « j ai mal a la tete ». */
export const normaliser = texte => sansAccents(texte).toLowerCase().replace(/[’'`´]/g, ' ').replace(/[^a-z0-9\s]/g, ' ').replace(/\s+/g, ' ').trim();

const motEnRegex = mot => {
    const joker = mot.endsWith('*');
    const base = (joker ? mot.slice(0, -1) : mot).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    return new RegExp(`(?:^| )${base}${joker ? '\\w*' : ''}(?= |$)`);
};
const COMPILE = Object.fromEntries(Object.entries(MOTS).map(([id, poids]) => [id, Object.entries(poids).flatMap(([p, mots]) => mots.map(mot => ({ poids: Number(p), mot, re: motEnRegex(normaliser(mot).replace(/\*$/, '') + (mot.endsWith('*') ? '*' : '')) })))]));
const ENFANT = /(?:^| )(bebe|bebes|nourrisson|zaza|zanako|zazako|enfant|enfants|fils|fille|petit|petite)(?= |$)/;
const SYMPTOMES = /(?:^| )(fievre\w*|tazo|toux|kohaka|rhume|sery|diarrhee\w*|fivalanana|vomi\w*|mandoa|boutons?|eruption|malade|marary|douleur\w*|mal)(?= |$)/;

/**
 * Analyse la phrase du patient. Retourne les services possibles du plus probable au moins probable
 * (avec les mots qui ont servi à choisir) et les signes d'urgence éventuels.
 * { classement: [{ id, score, motsTrouves }], urgences: [libellés], comprise: boolean }
 */
export function analyserDemande(phrase) {
    const texte = normaliser(phrase);
    if (!texte) return { classement: [], urgences: [], comprise: false };
    const scores = {};
    for (const [id, motsCompiles] of Object.entries(COMPILE)) {
        const trouves = [];
        let score = 0;
        for (const { poids, mot, re } of motsCompiles) {
            if (re.test(texte)) { score += poids; trouves.push(mot.replace(/\*$/, '')); }
        }
        scores[id] = { id, score, motsTrouves: trouves };
    }
    // Un enfant avec des symptômes : consultation du nourrisson plutôt que consultation générale.
    if (ENFANT.test(texte) && SYMPTOMES.test(texte)) scores.bebe.score += 3;
    // Une femme enceinte qui décrit un symptôme : le suivi de grossesse prime sur la consultation générale.
    if (scores.grossesse.score >= 3 && scores.general.score > 0) scores.general.score = Math.max(0, scores.general.score - 2);
    // « Vacciner mon bébé » : la vaccination prime sur la consultation du nourrisson.
    if (scores.vaccination.score >= 3) scores.bebe.score = Math.max(0, scores.bebe.score - 2);
    // « Accouché » + douleur/cicatrice : suite de couches ; « accoucher » : accouchement.
    if (scores.postpartum.score >= 3) scores.accouchement.score = Math.max(0, scores.accouchement.score - 3);
    // Test de grossesse / prise de sang : analyses, pas suivi de grossesse.
    if (/test de grossesse/.test(texte) && !/(enceinte|bevohoka|echographie|suivi)/.test(texte)) scores.grossesse.score = Math.max(0, scores.grossesse.score - 3);

    const classement = Object.values(scores).filter(s => s.score > 0).sort((a, b) => b.score - a.score);
    const urgences = [...new Set(URGENCES.filter(u => u.re.test(texte)).map(u => u.label))];
    return { classement, urgences, comprise: classement.length > 0 };
}

/**
 * Services à proposer : le plus probable, plus un ou deux autres s'ils sont presque aussi probables.
 * Un résultat faible (un seul indice léger) reste proposé mais signalé comme incertain.
 */
export function propositions(analyse) {
    const [premier, ...autres] = analyse.classement;
    if (!premier) return { principal: null, alternatives: [], incertain: true };
    const alternatives = autres.filter(s => s.score >= Math.max(2, premier.score - 1)).slice(0, 2);
    return { principal: premier, alternatives, incertain: premier.score < 3 || alternatives.length > 0 };
}
