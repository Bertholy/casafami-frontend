import Editable from './Editable';
import { useSiteContent } from '../../context/SiteContentContext';
import { useLang } from '../../i18n/LangContext';
import { LIEN_CARTE } from '../../constants/app';

/**
 * Numéro de téléphone du cabinet : un clic lance l'appel (tel:). Le texte reste modifiable par le super administrateur,
 * et le numéro appelé suit le texte affiché. `id` et `children` (le numéro d'origine) sont ceux de l'Editable.
 */
export function LienTelephone({ id, className, children }) {
    const { content } = useSiteContent();
    const { t } = useLang();
    const numero = (content[id]?.texte ?? children).replace(/[^\d+]/g, '');
    return (
        <a href={`tel:${numero}`} title={t("Appeler ce numéro")} className="block w-fit transition hover:opacity-80">
            <Editable id={id} as="p" className={className}>{children}</Editable>
        </a>
    );
}

/** Adresse du cabinet : un clic ouvre Google Maps sur le lieu précis, dans un nouvel onglet. */
export function LienAdresse({ children }) {
    const { t } = useLang();
    return (
        <a href={LIEN_CARTE} target="_blank" rel="noopener noreferrer" title={t("Voir l’adresse sur Google Maps")} className="block w-fit transition hover:underline hover:underline-offset-4">
            {children}
        </a>
    );
}
