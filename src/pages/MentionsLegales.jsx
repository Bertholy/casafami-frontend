import { Link } from 'react-router-dom';
import { Scale } from 'lucide-react';
import PageJuridique from '../components/PageJuridique';
import { MISE_A_JOUR_JURIDIQUE } from '../constants/juridique';
import { useLang } from '../i18n/LangContext';

const SECTIONS = [
    {
        cle: 'editeur', titre: 'Éditeur du site',
        blocs: [
            'Le site est édité par le Cabinet d’Accouchement Sainte Famille (CASAFAMI), situé chez Rasazy VERO, Andongona - Antsohihy, Madagascar.',
            { liste: ['Téléphone : 034 06 759 28 et 032 43 035 07', 'Adresse électronique : contact@casafami.mg', 'Responsable de la publication : la direction du cabinet', 'Informations d’immatriculation de l’établissement : communiquées sur demande auprès du cabinet.'] },
        ],
    },
    {
        cle: 'conception', titre: 'Conception et réalisation',
        blocs: ['Site conçu et réalisé par VONJIARIMANANA Alpha Bertholy.'],
    },
    {
        cle: 'hebergement', titre: 'Hébergement',
        blocs: ['Le site, le serveur de l’application et la base de données sont hébergés chez des prestataires techniques choisis par le cabinet. Pour connaître leur identité et leurs coordonnées, vous pouvez en faire la demande au cabinet.'],
    },
    {
        cle: 'propriete', titre: 'Propriété intellectuelle',
        blocs: [
            'Les textes, photographies, logo, illustrations et la présentation du site appartiennent au cabinet ou sont utilisés avec l’accord de leurs auteurs. Toute reproduction, représentation ou adaptation, totale ou partielle, sans autorisation écrite préalable du cabinet est interdite.',
        ],
    },
    {
        cle: 'information', titre: 'Informations de santé',
        blocs: [
            'Les informations présentées sur ce site sont données à titre indicatif. Elles ne remplacent ni une consultation, ni l’avis d’un professionnel de santé.',
            'L’assistant de prise de rendez-vous aide à remplir le formulaire et à orienter vers le bon service. Il n’établit aucun diagnostic et ne donne aucun conseil médical.',
            'En cas d’urgence (saignement, douleurs intenses, perte des eaux, diminution des mouvements du bébé…), n’attendez pas un rendez-vous : appelez le cabinet ou rendez-vous directement sur place.',
        ],
    },
    {
        cle: 'responsabilite', titre: 'Responsabilité',
        blocs: [
            'Le cabinet s’efforce de maintenir le site accessible et ses informations à jour (horaires, services, coordonnées), sans pouvoir garantir une disponibilité permanente ni l’absence d’erreur. Un rendez-vous demandé en ligne n’est définitif qu’une fois confirmé par le cabinet.',
            'Le site peut contenir des liens vers d’autres sites : le cabinet n’est pas responsable de leur contenu.',
        ],
    },
    {
        cle: 'donnees', titre: 'Données personnelles',
        blocs: ['Les données collectées lors de la prise de rendez-vous et leur protection sont expliquées dans la politique de confidentialité du site.'],
    },
    {
        cle: 'droit', titre: 'Droit applicable',
        blocs: ['Les présentes mentions sont régies par le droit malgache. En cas de litige, et à défaut d’accord amiable, les tribunaux malgaches compétents seront saisis.'],
    },
];

export default function MentionsLegales() {
    const { t } = useLang();
    return (
        <PageJuridique id="mentions" titre="Mentions légales" Icone={Scale}
            intro="Les informations légales du site du Cabinet d’Accouchement Sainte Famille."
            misAJour={MISE_A_JOUR_JURIDIQUE} sections={SECTIONS}
            autre={<>{t("Voir aussi")} <Link to="/confidentialite" className="font-semibold text-teal-700 underline dark:text-teal-300">{t("Politique de confidentialité")}</Link>.</>} />
    );
}
