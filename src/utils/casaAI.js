import { chercherEnPhrase, resume, simplifier } from './indexSite';

/**
 * Cerveau de CASA'AI, l'assistant IA du site public. Il n'utilise aucun modèle de langage externe : il reconnaît quelques demandes
 * courantes (rendez-vous, horaires, urgence…) et, pour le reste, cherche la meilleure réponse dans ce que le site contient déjà
 * (questions fréquentes, services et leur détail, informations pratiques). Il ne donne jamais d'avis médical et ne cherche jamais un
 * rendez-vous par nom ou numéro (on ne retrouve un rendez-vous qu'avec sa clé de suivi, dans « Mes rendez-vous »).
 *
 * repondre() renvoie { texte, actions } ; une action est { label, to } (lien du site) ou { label, href } (appel téléphonique).
 */

/** « Bonjour » le matin, « Bon après-midi » de midi à 18 h, « Bonsoir » ensuite (heure de l'appareil). */
export function salutation(t, date = new Date()) {
    const heure = date.getHours();
    if (heure >= 18 || heure < 4) return t("Bonsoir !");
    return heure >= 12 ? t("Bon après-midi !") : t("Bonjour !");
}

export const INTENTIONS = ['humain', 'rdv', 'mesRdv', 'horaires', 'urgence', 'services', 'adresse', 'tel'];

const contient = (s, mots) => mots.some(mot => s.includes(mot));
const chiffres = numero => String(numero || '').replace(/[^\d]/g, '');

// Les mots-clés sont donnés sans accents ni majuscules (voir simplifier) ; le malgache est reconnu pour les demandes courantes.
const MOTS = {
    urgence: ['urgence', 'urgent', 'saignement', 'saigne', 'hemorragie', 'perte des eaux', 'perdu les eaux', 'contraction', 'douleur forte', 'douleur intense', 'tres mal',
        'difficulte a respirer', 'bouge moins', 'bouge plus', 'convulsion', 'malaise', 'evanoui', 'vonjy maika', 'tranga maika'],
    avisMedical: ['diagnostic', 'medicament', 'traitement', 'dois je prendre', 'est ce grave', 'est-ce grave', 'suis je enceinte', 'posologie', 'dosage', 'antibiotique', 'paracetamol',
        'que dois je faire pour guerir', 'fanafody'],
    humain: ['une personne', 'un humain', 'une vraie personne', 'quelqu un', 'personne du cabinet', 'conseiller', 'secretaire', 'secretariat', 'mpiasa', 'olona', 'olombelona'],
    mesRdv: ['annuler', 'annulation', 'retrouver', 'cle de suivi', 'clef de suivi', 'mon rendez', 'mes rendez', 'recu', 'telecharger', 'qr', 'foano', 'fotoanako', 'lakilen'],
    rdv: ['rendez-vous', 'rendez vous', 'rdv', 'reserver', 'reservation', 'fotoana', 'haka fotoana'],
    horaires: ['horaire', 'ouvert', 'ouverture', 'ferme', 'heure d', 'ora fiasana', 'misokatra'],
    adresse: ['adresse', 'ou se trouve', 'ou etes', 'localisation', 'comment venir', 'comment arriver', 'aiza', 'adiresy', 'toerana'],
    tel: ['telephone', 'appeler', 'numero', 'contact', 'joindre', 'telefaona', 'laharana', 'antsoy'],
    services: ['service', 'prestation', 'que proposez', 'que faites', 'proposez vous', 'serivisy', 'tolotra'],
    salut: ['bonjour', 'bonsoir', 'salut', 'hello', 'coucou', 'salama', 'manao ahoana'],
    merci: ['merci', 'misaotra'],
};

/** Ce que veut la personne (rdv, horaires, urgence…), ou null si rien n'est reconnu. */
export function detecterIntention(saisie) {
    const s = simplifier(saisie);
    // « rendez-vous » seul dans une phrase longue (ex. : « Puis-je prendre plusieurs rendez-vous ? ») est mieux servi par la question fréquente correspondante
    const veutRdv = contient(s, ['prendre rendez', 'prendre un rendez', 'prendre rdv', 'prendre un rdv', 'reserver', 'reservation', 'haka fotoana']) || (s.length <= 30 && contient(s, MOTS.rdv));
    return (contient(s, MOTS.urgence) ? 'urgence'
            : contient(s, MOTS.humain) ? 'humain'
                : contient(s, MOTS.avisMedical) ? 'avisMedical'
                : contient(s, MOTS.mesRdv) ? 'mesRdv'
                    : veutRdv ? 'rdv'
                        : contient(s, MOTS.horaires) ? 'horaires'
                            : contient(s, MOTS.adresse) ? 'adresse'
                                : contient(s, MOTS.tel) ? 'tel'
                                    : contient(s, MOTS.services) ? 'services'
                                        : (s.length <= 25 && contient(s, MOTS.salut)) ? 'salut'
                                            : (s.length <= 25 && contient(s, MOTS.merci)) ? 'merci' : null);
}

export function repondre(saisie, { index, infos, t }, intention = null) {
    const appel = infos?.tel1 ? { label: `${t("Appeler")} ${infos.tel1}`, href: `tel:${chiffres(infos.tel1)}` } : null;
    const lien = (label, to) => ({ label, to });
    const choix = intention || detecterIntention(saisie);

    switch (choix) {
        case 'urgence':
            return {
                texte: t("Cela peut être urgent : n’attendez pas un rendez-vous. Appelez le cabinet tout de suite (urgences 24h/24) ou rendez-vous directement sur place."),
                actions: [appel, lien(t("Voir l’adresse"), '/#contact')].filter(Boolean),
            };
        case 'humain':
            return {
                texte: `${t("Bien sûr, une personne du cabinet peut vous répondre. Le plus simple est de l’appeler")} (${infos?.tel1 || ''}). ${infos?.horaires || ''} ${t("Le cabinet est ouvert 7j/7 et répond aux urgences 24h/24.")}`.replace(/\s+/g, ' ').trim(),
                actions: [appel, lien(t("Voir le contact"), '/#contact')].filter(Boolean),
            };
        case 'avisMedical':
            return {
                texte: t("Je ne suis pas un soignant : je ne peux pas donner d’avis médical ni de diagnostic. Le mieux est de prendre rendez-vous pour une consultation avec l’équipe du cabinet."),
                actions: [lien(t("Prendre rendez-vous"), '/prendre-rdv'), appel].filter(Boolean),
            };
        case 'mesRdv':
            return {
                texte: t("Pour retrouver, annuler ou télécharger le reçu de votre rendez-vous, ouvrez « Mes rendez-vous » et saisissez votre clé de suivi (par exemple CF-7K3M-9QX2). L’annulation est possible jusqu’à 2 heures avant l’heure prévue."),
                actions: [lien(t("Retrouver mon rendez-vous"), '/mes-rdv')],
            };
        case 'rdv':
            return {
                texte: t("Vous pouvez réserver en ligne en moins de 2 minutes, sans inscription : un assistant vous guide, ou vous remplissez vous-même le formulaire. Vous êtes prévenu par message dès que le cabinet confirme."),
                actions: [lien(t("Prendre rendez-vous"), '/prendre-rdv'), lien(t("Retrouver mon rendez-vous"), '/mes-rdv')],
            };
        case 'horaires':
            return { texte: `${infos?.horaires || ''} ${t("Le cabinet est ouvert 7j/7 et répond aux urgences 24h/24.")}`.trim(), actions: [lien(t("Voir les horaires"), '/#horaires')] };
        case 'adresse':
            return { texte: infos?.adresse || '', actions: [lien(t("Voir l’adresse"), '/#contact')] };
        case 'tel':
            return { texte: `${infos?.tel1 || ''} · ${infos?.tel2 || ''}`, actions: [appel, lien(t("Voir le contact"), '/#contact')].filter(Boolean) };
        case 'services': {
            const noms = index.filter(e => e.groupe === 'services').map(e => e.titre);
            return {
                texte: noms.length ? `${t("Voici nos services")} : ${noms.join(', ')}. ${t("Dites-moi lequel vous intéresse pour en savoir plus.")}` : t("Le cabinet propose le suivi de grossesse, l’accouchement, l’échographie, le planning familial, la vaccination et les consultations."),
                actions: [lien(t("Nos services"), '/services')],
            };
        }
        case 'salut':
            return { texte: t("Bonjour ! Posez-moi votre question sur le cabinet, les services, les rendez-vous ou les horaires."), actions: [] };
        case 'merci':
            return { texte: t("Avec plaisir ! Je reste là si vous avez une autre question."), actions: [] };
        default:
            break;
    }

    // sinon : la meilleure réponse trouvée dans le contenu du site
    const trouves = chercherEnPhrase(index, saisie);
    const meilleur = trouves[0];
    if (!meilleur) {
        return {
            texte: t("Je n’ai pas trouvé de réponse précise. Essayez avec d’autres mots, parcourez les questions fréquentes, ou appelez le cabinet : l’équipe vous répond avec plaisir."),
            actions: [lien(t("Questions fréquentes"), '/faq'), appel].filter(Boolean),
        };
    }
    // autres pistes : seulement celles presque aussi pertinentes que la meilleure
    const autres = trouves.slice(1).filter(e => e.score >= meilleur.score * 0.6 && (e.groupe !== 'pages' || e.id === 'p-faq')).slice(0, 2);
    return {
        texte: resume(meilleur.corps || meilleur.extrait || meilleur.titre, 520),
        actions: [lien(`${t("Voir")} : ${meilleur.titre}`, meilleur.to), ...autres.map(e => lien(e.titre, e.to))],
    };
}
