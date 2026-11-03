import { useEffect, useMemo, useState } from 'react';
import { CalendarDays, CalendarPlus, Clock, FileText, HelpCircle, House, Info, MapPin, Phone, ShieldCheck, Stethoscope, UserRound } from 'lucide-react';
import axiosClient from '../api/axiosClient';
import { useLang } from '../i18n/LangContext';
import { useSiteContent } from '../context/SiteContentContext';
import { GROUPES } from '../constants/faq';
import { detailsDuService } from '../constants/detailsServices';
import { summarizeHours, traduireJours, usePlanning } from './horaires';

/**
 * Index de tout le site public (services et leur détail, questions fréquentes, informations pratiques, pages) et moteurs de recherche
 * qui le parcourent. Utilisé par la recherche du site (RechercheSite) et par l'assistant CASA'AI.
 */

export const simplifier = texte => String(texte || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();

export const resume = (texte, taille = 140) => {
    const propre = String(texte || '').replace(/\s+/g, ' ').trim();
    return propre.length > taille ? `${propre.slice(0, taille).trimEnd()}…` : propre;
};

/** Recherche stricte (fenêtre de recherche) : tous les mots doivent être présents quelque part ; le titre compte plus que le reste. */
export function chercher(index, requete) {
    const mots = simplifier(requete).split(/\s+/).filter(Boolean);
    if (mots.length === 0) return { mots, resultats: [] };
    const resultats = index.flatMap(entree => {
        if (!mots.every(mot => entree.texte.includes(mot))) return [];
        let score = 0;
        for (const mot of mots) {
            if (entree.titreN.startsWith(mot)) score += 12;
            else if (entree.titreN.includes(mot)) score += 8;
            else if (entree.motsN.includes(mot)) score += 4;
            else score += 1;
        }
        return [{ ...entree, score }];
    }).sort((a, b) => b.score - a.score);
    return { mots, resultats };
}

// mots trop courants pour servir à chercher dans une phrase écrite comme une question
const MOTS_VIDES = new Set(('le la les l de du des d un une et ou je tu il elle on nous vous mon ma mes ton ta tes son sa ses ce cet cette ces est es suis sont a ai as ont avez avons '
    + 'que qui quoi quel quelle quels quelles dont ou pour par avec sans sur sous dans en au aux ne pas plus y se si comment puis peut peux pouvez faut faire fait dois doit '
    + 'est-ce quand combien pourquoi puis-je peut-on svp merci bonjour bonsoir salut aussi tres bien').split(' '));

/** Recherche « en phrase » (assistant) : les mots courants sont ignorés et il suffit qu'une bonne partie des mots restants se retrouve. */
export function chercherEnPhrase(index, phrase) {
    const mots = simplifier(phrase).split(/[^a-z0-9]+/).filter(mot => mot.length >= 3 && !MOTS_VIDES.has(mot));
    if (mots.length === 0) return [];
    const minimum = Math.max(1, Math.ceil(mots.length / 2));
    return index.flatMap(entree => {
        let trouves = 0;
        let score = 0;
        for (const mot of mots) {
            if (entree.titreN.includes(mot)) { trouves += 1; score += 8; }
            else if (entree.motsN.includes(mot)) { trouves += 1; score += 4; }
            else if (entree.texte.includes(mot)) { trouves += 1; score += 2; }
        }
        return trouves >= minimum ? [{ ...entree, score }] : [];
    }).sort((a, b) => b.score - a.score);
}

/**
 * Construit l'index dans la langue affichée (les recherches se font aussi sur le texte français d'origine).
 * Charge les services au premier affichage : à n'utiliser que dans un composant monté quand on en a besoin.
 * Renvoie { index, infos } ; infos = numéros, adresse et résumé des horaires, pour les réponses de l'assistant.
 */
export function useIndexSite() {
    const { t } = useLang();
    const { content } = useSiteContent();
    const planning = usePlanning();
    const [services, setServices] = useState(null);

    useEffect(() => {
        let annule = false;
        axiosClient.get('/services')
            .then(({ data }) => { if (!annule) setServices(Array.isArray(data) ? data : []); })
            .catch(() => { if (!annule) setServices([]); });   // sans les services, le reste fonctionne quand même
        return () => { annule = true; };
    }, []);

    return useMemo(() => {
        const index = [];
        const ajouter = (id, groupe, Icone, titre, extrait, mots, to, corps = extrait) => index.push({
            id, groupe, Icone, titre, extrait, corps, to, titreN: simplifier(titre), motsN: simplifier(mots), texte: simplifier(`${titre} ${extrait} ${corps} ${mots}`),
        });

        // services et leur détail
        (services || []).forEach(service => {
            const detail = detailsDuService(service.nom);
            const pieces = detail ? [detail.resume, ...detail.inclus, ...detail.avant, detail.urgence].filter(Boolean) : [];
            const mots = [service.nom, service.description, ...pieces, ...pieces.map(piece => t(piece))].filter(Boolean).join(' ');
            const extrait = service.description ? t(service.description) : (detail ? t(detail.resume) : '');
            const inclus = detail ? `${t("Ce que comprend ce service")} : ${detail.inclus.slice(0, 4).map(element => t(element)).join(', ')}.` : '';
            ajouter(`service-${service.id}`, 'services', Stethoscope, t(service.nom), resume(extrait), mots, `/services?service=${service.id}`, [extrait, inclus].filter(Boolean).join(' '));
        });

        // questions fréquentes
        GROUPES.forEach((groupe, g) => groupe.questions.forEach(({ q, r }, i) => {
            ajouter(`faq-${g}-${i}`, 'faq', HelpCircle, t(q), resume(t(r)), `${q} ${r} ${groupe.titre}`, `/faq#faq-q-${g}-${i}`, t(r));
        }));

        // informations pratiques
        const horaires = summarizeHours(planning?.horaires);
        const resumeHoraires = horaires.length ? horaires.slice(0, 2).map(h => `${traduireJours(h.label, t)} ${h.global}`).join(' · ') : t("Horaires disponibles bientôt.");
        const tel1 = content['accueil.tel.numero1']?.texte ?? '034 06 759 28';
        const tel2 = content['accueil.tel.numero2']?.texte ?? '032 43 035 07';
        const adresse = [content['accueil.adresse.ligne1']?.texte ?? 'Chez Rasazy VERO', content['accueil.adresse.ligne2']?.texte ?? 'Andongona - ANTSOHIHY', content['accueil.adresse.pays']?.texte ?? 'Madagascar'].join(', ');
        ajouter('i-horaires', 'infos', Clock, t("Horaires d’ouverture"), resumeHoraires, 'horaires ouverture ouvert fermé heures jours lundi samedi dimanche planning', '/#horaires');
        ajouter('i-adresse', 'infos', MapPin, t("Adresse du cabinet"), adresse, 'adresse où venir localisation lieu plan itinéraire Antsohihy Andongona Madagascar', '/#contact');
        ajouter('i-tel', 'infos', Phone, t("Téléphone et contact"), `${tel1} · ${tel2}`, 'téléphone appeler numéro contact joindre sms message', '/#contact');
        ajouter('i-urgence', 'infos', Info, t("Urgences 24h/24"), t("Le cabinet est ouvert 7j/7 et répond aux urgences 24h/24."), 'urgence urgences garde nuit 24h accouchement douleur saignement', '/#contact');

        // pages
        ajouter('p-accueil', 'pages', House, t("Accueil"), '', 'accueil cabinet casafami présentation', '/');
        ajouter('p-services', 'pages', Stethoscope, t("Nos services"), t("Des soins de qualité adaptés à vos besoins, assurés par une équipe expérimentée"), 'services soins prestations', '/services');
        ajouter('p-rdv', 'pages', CalendarPlus, t("Prendre rendez-vous"), t("Réservez en moins de 2 minutes"), 'rdv rendez-vous réserver réservation créneau consultation assistant en ligne', '/prendre-rdv');
        ajouter('p-mes-rdv', 'pages', CalendarDays, t("Retrouver mon rendez-vous"), t("Retrouvez votre rendez-vous"), 'mes rendez-vous clé de suivi code annuler annulation télécharger reçu qr', '/mes-rdv');
        ajouter('p-faq', 'pages', HelpCircle, t("Questions fréquentes"), '', 'faq aide questions réponses', '/faq');
        ajouter('p-mentions', 'pages', FileText, t("Mentions légales"), '', 'mentions légales éditeur hébergeur', '/mentions-legales');
        ajouter('p-confidentialite', 'pages', ShieldCheck, t("Politique de confidentialité"), '', 'confidentialité données personnelles vie privée protection', '/confidentialite');
        ajouter('p-personnel', 'pages', UserRound, t("Espace du personnel"), '', 'connexion personnel médecin sage-femme secrétariat administrateur login', '/medecin/login');

        return { index, infos: { tel1, tel2, adresse, horaires: resumeHoraires } };
    }, [services, planning, content, t]);
}
