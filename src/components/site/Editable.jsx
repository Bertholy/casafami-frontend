import { createElement } from 'react';
import { useSiteContent } from '../../context/SiteContentContext';
import { useLang } from '../../i18n/LangContext';
import { cssDuStyle } from '../../utils/styleTexte';

/**
 * Texte du site modifiable par le super administrateur.
 * Hors mode édition : affiche le texte personnalisé (avec sa mise en forme), sinon le texte d'origine (children, une simple chaîne).
 * En mode édition : un clic sur le texte ouvre la fenêtre de modification (texte, mise en forme, retour au texte d'origine).
 * En malgache : texte malgache personnalisé (identifiant « .mg »), sinon texte personnalisé en français, sinon traduction d'origine.
 */
export default function Editable({ id, as = 'span', children, className, style, ...rest }) {
    const { content, editMode, ouvrirEditeur } = useSiteContent();
    const { lang, t } = useLang();
    const francais = typeof children === 'string' ? children : '';
    const original = lang === 'mg' && francais ? t(francais) : francais;   // texte d'origine dans la langue affichée
    const cle = lang === 'mg' ? `${id}.mg` : id;
    const personnalise = lang === 'mg' ? (content[cle]?.texte ?? content[id]?.texte) : content[id]?.texte;
    const text = personnalise ?? original;
    const miseEnForme = content[cle]?.style ?? content[id]?.style;
    // un texte saisi par le super administrateur garde ses retours à la ligne ; le texte d'origine n'est pas touché
    const styleFinal = { ...style, ...(personnalise ? { whiteSpace: 'pre-line' } : {}), ...cssDuStyle(miseEnForme) };

    if (!editMode) return createElement(as, { className, style: styleFinal, ...rest }, text);

    const ouvrir = event => {
        event.preventDefault(); event.stopPropagation();
        ouvrirEditeur({
            mode: 'modifier', cleBase: id, cleLangue: cle, defaut: original, texte: text, style: miseEnForme || null,
            modifie: Boolean(content[cle] || (lang === 'mg' && content[id])), supprimable: false,
        });
    };

    return createElement(as, {
        ...rest,
        style: styleFinal,
        className: `${className || ''} cursor-pointer rounded outline-dashed outline-2 outline-offset-2 outline-amber-400 transition hover:bg-amber-300/20 hover:outline-solid`,
        role: 'button',
        tabIndex: 0,
        title: 'Cliquer pour modifier ce texte',
        'aria-label': `Modifier le texte : ${original || id}`,
        onClick: ouvrir,
        onKeyDown: event => { event.stopPropagation(); if (event.key === 'Enter' || event.key === ' ') ouvrir(event); },
    }, text);
}
