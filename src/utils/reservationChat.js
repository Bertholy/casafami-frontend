import axiosClient from '../api/axiosClient';
import { apiErrorMessage } from './auth';
import { todayISO } from '../constants/app';
import { ajouterJours, formaterJour } from './jours';
import { explainNoSlots } from './horaires';
import { formatPhoneInput, isPlausiblePhone } from './phone';
import { civilite } from './civilite';

/**
 * Prise de rendez-vous dans la discussion avec CASA'AI. Même règles et même serveur que la page « Prendre rendez-vous » : mêmes créneaux libres
 * (GET /rdv/creneaux), même envoi (POST /rdv), mêmes refus (un rendez-vous par nom ou numéro sur 7 jours, créneau déjà pris).
 *
 * Le moteur est une suite d'étapes : civilité (Mr / Mme, facultative) → service → date → heure → nom → âge → téléphone → motif (facultatif) → récapitulatif → confirmation.
 * demarrer() et avancer() renvoient { etat, messages } : etat est null quand la réservation est terminée ou abandonnée ; chaque message peut
 * porter des réponses rapides (choix), des liens (actions) et le type du champ de saisie attendu (champ : texte, age, tel ou date).
 */

const heureCourte = heure => String(heure || '').slice(0, 5);
const jourFr = iso => String(iso).slice(0, 10).split('-').reverse().join('/');
const MOTS_ANNULER = ['annuler', 'stop', 'laisser tomber', 'tsy tiako', 'foano'];

const bot = (texte, extra = {}) => ({ texte, ...extra });

/** Réponses rapides de la date : les six prochains jours + « Une autre date ». */
function choixDates(t, lang) {
    const aujourdhui = todayISO();
    const jours = [0, 1, 2, 3, 4, 5].map(n => {
        const iso = ajouterJours(aujourdhui, n);
        const libelle = n === 0 ? t("Aujourd’hui") : n === 1 ? t("Demain") : formaterJour(iso, lang, { weekday: 'short', day: 'numeric', month: 'short' });
        return { label: libelle, valeur: iso };
    });
    return [...jours, { label: t("Une autre date"), valeur: '__autre' }];
}

const dateLisible = (iso, lang) => formaterJour(iso, lang, { weekday: 'long', day: 'numeric', month: 'long' });

/** Charge les créneaux libres d'une date et prépare la question « à quelle heure ? » (ou explique pourquoi il n'y en a pas). */
async function questionHeure(etat, ctx) {
    const { t, lang, planning } = ctx;
    const { dateRdv } = etat.donnees;
    try {
        const { data } = await axiosClient.get('/rdv/creneaux', { params: { date: dateRdv } });
        const creneaux = data.map(heureCourte);
        if (creneaux.length === 0) {
            return { etat: { ...etat, etape: 'date', creneaux: [] }, messages: [bot(explainNoSlots(dateRdv, planning, todayISO(), t), { choix: choixDates(t, lang) })] };
        }
        return {
            etat: { ...etat, etape: 'heure', creneaux },
            messages: [bot(t("Voici les créneaux libres le {date} : choisissez une heure.", { date: dateLisible(dateRdv, lang) }), { choix: [...creneaux.map(h => ({ label: h, valeur: h })), { label: t("Changer de date"), valeur: '__date' }] })],
        };
    } catch {
        return { etat: { ...etat, etape: 'date' }, messages: [bot(t("Je n’arrive pas à charger les créneaux pour le moment. Choisissez une autre date ou réessayez dans un instant."), { choix: choixDates(t, lang) })] };
    }
}

function recapitulatif(etat, ctx) {
    const { t, lang } = ctx;
    const d = etat.donnees;
    const lignes = [
        `${t("Voici votre demande")} :`,
        d.serviceNom ? `• ${t("Service")} : ${d.serviceNom}` : null,
        `• ${t("Date")} : ${dateLisible(d.dateRdv, lang)}`,
        `• ${t("Heure")} : ${d.heureRdv}`,
        civilite(d.ageClient, d.sexe) ? `• ${t("Civilité")} : ${civilite(d.ageClient, d.sexe)}` : null,
        `• ${t("Nom")} : ${d.nomClient}`,
        d.sexe ? `• ${t("Sexe")} : ${t(d.sexe === 'HOMME' ? 'Homme' : 'Femme')}` : null,
        `• ${t("Âge")} : ${d.ageClient} ${t(Number(d.ageClient) > 1 ? "ans" : "an")}`,
        `• ${t("Téléphone")} : ${d.telephoneClient}`,
        d.motif ? `• ${t("Motif")} : ${d.motif}` : null,
    ].filter(Boolean);
    return bot(lignes.join('\n'), { choix: [{ label: t("Confirmer"), valeur: '__confirmer' }, { label: t("Recommencer"), valeur: '__recommencer' }] });
}

/** Début de la réservation : charge les services puis pose la première question. */
export async function demarrer(ctx) {
    const { t } = ctx;
    let services;
    try {
        const reponse = await axiosClient.get('/rdv/form-options').then(res => res.data.services || []).catch(() => axiosClient.get('/services').then(res => res.data));
        services = Array.isArray(reponse) ? reponse : [];
    } catch {
        return { etat: null, messages: [bot(t("Je n’arrive pas à joindre le cabinet pour le moment. Vous pouvez aussi utiliser le formulaire de rendez-vous."), { actions: [{ label: t("Prendre rendez-vous"), to: '/prendre-rdv' }] })] };
    }
    // la première question est la civilité (Mr / Mme), comme dans le formulaire et avec l'assistant de la page
    const etat = { etape: 'civilite', donnees: {}, services };
    return {
        etat,
        messages: [
            bot(t("Avec plaisir ! Je vous guide pas à pas : cela prend moins de 2 minutes, sans inscription."), { actions: [{ label: t("Utiliser le formulaire"), to: '/prendre-rdv' }] }),
            questionCivilite(t),
        ],
    };
}

/** « Quelle est votre civilité ? » : Mr, Mme ou Passer (la réponse remplit aussi le sexe). */
function questionCivilite(t, prefixe = '') {
    return bot(`${prefixe ? `${prefixe} ` : ''}${t("Quelle est votre civilité ?")}`, {
        choix: [{ label: 'Mr', valeur: 'HOMME' }, { label: 'Mme', valeur: 'FEMME' }, { label: t("Passer"), valeur: '__passer' }],
    });
}

/** « Pour quel service ? » avec les services du cabinet. */
function questionService(services, t) {
    return bot(t("Pour quel service souhaitez-vous un rendez-vous ?"), {
        choix: [...services.map(s => ({ label: s.nom, valeur: String(s.id) })), { label: t("Je ne sais pas encore"), valeur: '__aucun' }],
    });
}

/** Message affiché au refus d'une réservation (règle des 7 jours, créneau pris, autre erreur). */
async function envoyerDemande(etat, ctx) {
    const { t } = ctx;
    const d = etat.donnees;
    try {
        const { data } = await axiosClient.post('/rdv', {
            nomClient: d.nomClient, sexe: d.sexe || '', ageClient: parseInt(d.ageClient, 10), telephoneClient: d.telephoneClient, motif: d.motif || '',
            dateRdv: d.dateRdv, heureRdv: `${d.heureRdv}:00`, serviceId: d.serviceId ? Number(d.serviceId) : null,
        });
        return {
            etat: null,
            messages: [
                bot(`${t("C’est fait ! Votre demande est enregistrée : le cabinet va la confirmer et vous serez prévenu par message.")}\n${t("Votre clé de suivi")} : ${data.cleSuivi}\n${t("Gardez-la : elle permet de retrouver, annuler ou télécharger le reçu de votre rendez-vous.")}`,
                    { actions: [{ label: t("Voir mon rendez-vous"), to: `/mes-rdv?cle=${encodeURIComponent(data.cleSuivi)}` }] }),
            ],
        };
    } catch (err) {
        const reponse = err.response?.data;
        if (reponse?.code === 'RESERVATION_RECENTE') {
            const dispo = `${jourFr(reponse.disponibleLe)} ${t('à')} ${String(reponse.disponibleLe).slice(11, 16)}`;
            const modele = reponse.critere === 'TELEPHONE'
                ? "Une réservation existe déjà avec ce numéro de téléphone (rendez-vous du {date} à {heure}). Une nouvelle réservation sera possible à partir du {dispo}, ou dès que la première est annulée dans « Mes rendez-vous »."
                : "Une réservation existe déjà à ce nom (rendez-vous du {date} à {heure}). Une nouvelle réservation sera possible à partir du {dispo}, ou dès que la première est annulée dans « Mes rendez-vous ».";
            return { etat: null, messages: [bot(t(modele, { date: jourFr(reponse.dateRdvExistant), heure: String(reponse.heureRdvExistant).slice(0, 5), dispo }), { actions: [{ label: t("Retrouver mon rendez-vous"), to: '/mes-rdv' }] })] };
        }
        if (err.response?.status === 409) {
            // créneau pris entre-temps : on repropose ceux qui restent libres
            const suite = await questionHeure({ ...etat, donnees: { ...etat.donnees, heureRdv: '' } }, ctx);
            return { etat: suite.etat, messages: [bot(t("Ce créneau vient d’être réservé par quelqu’un d’autre."), {}), ...suite.messages] };
        }
        return { etat, messages: [bot(apiErrorMessage(err, t("Impossible d’enregistrer ce rendez-vous. Vérifiez les informations et le créneau, puis réessayez.")), { choix: [{ label: t("Confirmer"), valeur: '__confirmer' }, { label: t("Recommencer"), valeur: '__recommencer' }] })] };
    }
}

/**
 * Traite une réponse. `entree` est le texte tapé ; `valeur` celui d'une réponse rapide (ou undefined).
 * Renvoie { etat, messages } (etat null = réservation terminée ou abandonnée).
 */
export async function avancer(etat, entree, valeur, ctx) {
    const { t, lang } = ctx;
    const texte = String(valeur ?? entree ?? '').trim();
    const d = etat.donnees;

    if (valeur === '__annuler' || (valeur === undefined && MOTS_ANNULER.some(mot => texte.toLowerCase() === mot))) {
        return { etat: null, messages: [bot(t("D’accord, j’annule la réservation. Je reste là si vous avez besoin."))] };
    }
    if (valeur === '__recommencer') return demarrer(ctx);

    switch (etat.etape) {
        case 'civilite': {
            // première question, comme dans le formulaire : Mr / Mme (ou « Passer ») ; elle remplit aussi le sexe
            const sexe = valeur === '__passer' ? '' : sexeReconnu(valeur ?? texte);
            if (valeur !== '__passer' && sexe === null) return { etat, messages: [questionCivilite(t, t("Je n’ai pas compris : choisissez une des réponses."))] };
            return { etat: { ...etat, etape: 'service', donnees: { ...d, sexe } }, messages: [questionService(etat.services, t)] };
        }
        case 'service': {
            if (valeur === '__aucun') {
                return { etat: { ...etat, etape: 'date', donnees: { ...d, serviceId: '', serviceNom: '' } }, messages: [bot(t("Pas de souci, vous pourrez préciser le motif plus loin. Pour quel jour ?"), { choix: choixDates(t, lang) })] };
            }
            const service = etat.services.find(s => String(s.id) === texte || s.nom.toLowerCase() === texte.toLowerCase());
            if (!service) return { etat, messages: [bot(t("Je n’ai pas reconnu ce service. Choisissez-en un dans la liste."), { choix: [...etat.services.map(s => ({ label: s.nom, valeur: String(s.id) })), { label: t("Je ne sais pas encore"), valeur: '__aucun' }] })] };
            return { etat: { ...etat, etape: 'date', donnees: { ...d, serviceId: String(service.id), serviceNom: service.nom } }, messages: [bot(t("Très bien. Pour quel jour ?"), { choix: choixDates(t, lang) })] };
        }
        case 'date': {
            if (valeur === '__autre') return { etat: { ...etat, etape: 'autreDate' }, messages: [bot(t("Choisissez la date de votre rendez-vous."), { champ: 'date' })] };
            if (!/^\d{4}-\d{2}-\d{2}$/.test(texte) || texte < todayISO()) return { etat, messages: [bot(t("Choisissez un jour dans la liste, ou « Une autre date »."), { choix: choixDates(t, lang) })] };
            return questionHeure({ ...etat, donnees: { ...d, dateRdv: texte } }, ctx);
        }
        case 'autreDate': {
            if (!/^\d{4}-\d{2}-\d{2}$/.test(texte) || texte < todayISO()) return { etat, messages: [bot(t("Cette date n’est pas valable : choisissez aujourd’hui ou un jour à venir."), { champ: 'date' })] };
            return questionHeure({ ...etat, etape: 'date', donnees: { ...d, dateRdv: texte } }, ctx);
        }
        case 'heure': {
            if (valeur === '__date') return { etat: { ...etat, etape: 'date' }, messages: [bot(t("Pour quel jour ?"), { choix: choixDates(t, lang) })] };
            // « 8h », « 08:30 », « 14h30 » : on retrouve le créneau correspondant
            const saisie = /^(\d{1,2})\s*(?:h|:)\s*(\d{2})?$/i.exec(texte);
            const heure = creneauCorrespondant(etat.creneaux, texte, saisie);
            if (!heure) return { etat, messages: [bot(t("Cette heure n’est pas disponible. Choisissez un des créneaux libres."), { choix: [...etat.creneaux.map(h => ({ label: h, valeur: h })), { label: t("Changer de date"), valeur: '__date' }] })] };
            return { etat: { ...etat, etape: 'nom', donnees: { ...d, heureRdv: heure } }, messages: [bot(t("Parfait. Quel est votre nom ?"), { champ: 'texte' })] };
        }
        case 'nom': {
            if (texte.length < 2) return { etat, messages: [bot(t("Merci d’indiquer votre nom (2 lettres au moins)."), { champ: 'texte' })] };
            return { etat: { ...etat, etape: 'age', donnees: { ...d, nomClient: texte.slice(0, 120) } }, messages: [bot(t("Merci. Quel est votre âge ?"), { champ: 'age' })] };
        }
        case 'age': {
            const age = Number.parseInt(texte, 10);
            if (!/^\d{1,3}$/.test(texte) || age < 0 || age > 120) return { etat, messages: [bot(t("Indiquez votre âge en chiffres, par exemple 28."), { champ: 'age' })] };
            return { etat: { ...etat, etape: 'tel', donnees: { ...d, ageClient: String(age) } }, messages: [bot(t("Quel est votre numéro de téléphone ? (par exemple 034 12 345 67)"), { champ: 'tel' })] };
        }
        case 'tel': {
            const numero = formatPhoneInput(texte);
            if (!isPlausiblePhone(numero)) return { etat, messages: [bot(t("Saisissez un numéro de téléphone valide, par exemple 034 12 345 67."), { champ: 'tel' })] };
            return { etat: { ...etat, etape: 'motif', donnees: { ...d, telephoneClient: numero } }, messages: [bot(t("Voulez-vous préciser la raison du rendez-vous ? (facultatif)"), { champ: 'texte', choix: [{ label: t("Passer"), valeur: '__passer' }] })] };
        }
        case 'motif': {
            const motif = valeur === '__passer' ? '' : texte.slice(0, 2000);
            const suivant = { ...etat, etape: 'confirme', donnees: { ...d, motif } };
            return { etat: suivant, messages: [recapitulatif(suivant, ctx)] };
        }
        case 'confirme': {
            if (valeur === '__confirmer') return envoyerDemande(etat, ctx);
            return { etat, messages: [bot(t("Appuyez sur « Confirmer » pour envoyer votre demande, ou « Recommencer »."), { choix: [{ label: t("Confirmer"), valeur: '__confirmer' }, { label: t("Recommencer"), valeur: '__recommencer' }] })] };
        }
        default:
            return { etat: null, messages: [] };
    }
}

/** « HOMME » ou « FEMME » d'après une réponse (touche rapide ou texte libre : homme, mr, garçon, lahy / femme, mme, fille, vavy), sinon null. */
function sexeReconnu(texte) {
    const mot = String(texte || '').trim().toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
    if (['homme', 'mr', 'm', 'monsieur', 'garcon', 'masculin', 'lahy', 'zazalahy', 'andriamatoa'].includes(mot)) return 'HOMME';
    if (['femme', 'mme', 'madame', 'f', 'fille', 'feminin', 'vavy', 'zazavavy', 'ramatoa'].includes(mot)) return 'FEMME';
    return null;
}

function creneauCorrespondant(creneaux, texte, saisie) {
    if (creneaux.includes(texte)) return texte;
    if (!saisie) return '';
    const hh = String(Number(saisie[1])).padStart(2, '0');
    const mm = saisie[2] ?? '00';
    const candidat = `${hh}:${mm}`;
    return creneaux.includes(candidat) ? candidat : '';
}
