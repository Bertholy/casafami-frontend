import { Link } from 'react-router-dom';
import { ShieldCheck } from 'lucide-react';
import PageJuridique from '../components/PageJuridique';
import { MISE_A_JOUR_JURIDIQUE } from '../constants/juridique';
import { useLang } from '../i18n/LangContext';

const SECTIONS = [
    {
        cle: 'responsable', titre: 'Qui est responsable de vos données ?',
        blocs: ['Le Cabinet d’Accouchement Sainte Famille (CASAFAMI), Andongona - Antsohihy, Madagascar, est responsable des données collectées sur ce site. Pour toute question : contact@casafami.mg ou 034 06 759 28.'],
    },
    {
        cle: 'donnees', titre: 'Les données que nous collectons',
        blocs: [
            'Quand vous prenez un rendez-vous, nous vous demandons uniquement ce qui est nécessaire :',
            { liste: ['votre nom, votre âge et votre numéro de téléphone ;', 'le service souhaité, la date et l’heure choisies ;', 'le motif du rendez-vous que vous écrivez, qui peut concerner votre santé ;', 'une clé de suivi (et son QR code), créée automatiquement pour retrouver votre rendez-vous.'] },
            'Lors des soins, le personnel du cabinet peut tenir un dossier médical (fiche patient, consultations, ordonnances, suivi de grossesse). Ces données de santé sont couvertes par le secret médical.',
            'Pour le personnel, nous conservons aussi l’adresse électronique, le rôle, la photo de profil, les messages internes et un journal des connexions et des actions (avec l’adresse IP).',
        ],
    },
    {
        cle: 'finalites', titre: 'À quoi servent ces données ?',
        blocs: [
            { liste: ['enregistrer, confirmer, modifier ou annuler votre rendez-vous ;', 'vous prévenir par message (confirmation, annulation, rappel de la veille) lorsque cet envoi est activé ;', 'assurer votre suivi médical et la continuité des soins ;', 'protéger le site et les dossiers (journal des actions, détection des abus) ;', 'établir des statistiques internes de fréquentation du cabinet.'] },
            'Vos données ne sont ni vendues, ni utilisées pour de la publicité.',
        ],
    },
    {
        cle: 'acces', titre: 'Qui peut voir vos données ?',
        blocs: [
            'Seul le personnel du cabinet y a accès, selon son rôle : chacun ne voit que ce dont il a besoin pour son travail (secrétariat, sage-femme, médecin, administration). Les accès sont protégés par un compte personnel et un mot de passe.',
            'Pour fonctionner, le site s’appuie sur des prestataires techniques (hébergement du site, du serveur et de la base de données, et envoi des messages). Ils n’agissent que pour le compte du cabinet.',
        ],
    },
    {
        cle: 'conservation', titre: 'Combien de temps sont-elles conservées ?',
        blocs: ['Les données de rendez-vous sont conservées le temps nécessaire à la gestion du rendez-vous et du suivi. Les dossiers médicaux sont conservés aussi longtemps que l’exige la réglementation applicable aux établissements de santé. Vous pouvez demander la suppression de ce qui n’a plus lieu d’être conservé.'],
    },
    {
        cle: 'securite', titre: 'Comment sont-elles protégées ?',
        blocs: [{ liste: ['accès réservé au personnel, avec droits distincts selon le rôle ;', 'journal d’audit des actions importantes ;', 'sauvegardes régulières de la base de données ;', 'clé de suivi difficile à deviner : gardez-la pour vous, elle donne accès à votre rendez-vous.'] }],
    },
    {
        cle: 'cookies', titre: 'Cookies et stockage dans votre navigateur',
        blocs: [
            'Le site n’utilise aucun cookie publicitaire ni outil de suivi. Il enregistre seulement dans votre navigateur vos préférences d’affichage (langue, thème clair ou sombre) pour vous les rappeler à la prochaine visite. Pour le personnel, la session de connexion est conservée le temps de l’onglet ouvert.',
        ],
    },
    {
        cle: 'droits', titre: 'Vos droits',
        blocs: [
            'Vous pouvez demander à accéder à vos données, les faire corriger, les faire supprimer ou vous opposer à leur utilisation, dans le cadre de la loi malgache sur la protection des données à caractère personnel (loi n° 2014-038).',
            'Pour exercer ces droits, écrivez à contact@casafami.mg ou présentez-vous au cabinet avec une pièce d’identité. Nous répondrons dans les meilleurs délais.',
        ],
    },
    {
        cle: 'modifications', titre: 'Modifications de cette politique',
        blocs: ['Cette politique peut évoluer, par exemple lorsqu’une nouvelle fonction est ajoutée au site. La date de dernière mise à jour figure en haut de la page.'],
    },
];

export default function Confidentialite() {
    const { t } = useLang();
    return (
        <PageJuridique id="confidentialite" titre="Politique de confidentialité" Icone={ShieldCheck}
            intro="Votre santé est une donnée sensible. Voici, simplement, ce que le cabinet collecte lorsque vous utilisez ce site, pourquoi, et comment vous gardez la main."
            misAJour={MISE_A_JOUR_JURIDIQUE} sections={SECTIONS}
            autre={<>{t("Voir aussi")} <Link to="/mentions-legales" className="font-semibold text-teal-700 underline dark:text-teal-300">{t("Mentions légales")}</Link>.</>} />
    );
}
