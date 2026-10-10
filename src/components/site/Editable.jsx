import { createElement } from 'react';
import { useSiteContent } from '../../context/SiteContentContext';
import { useLang } from '../../i18n/LangContext';

const NBSP = String.fromCharCode(160);

/**
 * Texte du site modifiable par le super administrateur.
 * Hors mode édition : affiche le texte personnalisé, sinon le texte d'origine (children, une simple chaîne).
 * En mode édition : cliquer sur le texte permet de le modifier ; la modification est enregistrée en quittant le champ.
 * Entrée valide, Échap annule. Un champ vidé revient au texte d'origine.
 * En malgache : texte malgache personnalisé (identifiant « .mg »), sinon texte personnalisé en français, sinon traduction d'origine.
 */
export default function Editable({ id, as = 'span', children, className, ...rest }) {
    const { content, editMode, save } = useSiteContent();
    const { lang, t } = useLang();
    const francais = typeof children === 'string' ? children : '';
    const original = lang === 'mg' && francais ? t(francais) : francais;   // texte d'origine dans la langue affichée
    const cle = lang === 'mg' ? `${id}.mg` : id;
    const text = lang === 'mg' ? (content[cle]?.texte ?? content[id]?.texte ?? original) : (content[id]?.texte ?? original);

    if (!editMode) return createElement(as, { className, ...rest }, text);

    const commit = event => {
        const element = event.currentTarget;
        const value = element.innerText.split(NBSP).join(' ').trim();
        if (value === text) return;
        // Un texte identique à l'original ou vide supprime la personnalisation.
        save(cle, { texte: value === original ? '' : value });
        if (!value) element.innerText = original;
    };

    return createElement(as, {
        ...rest,
        className: `${className || ''} cursor-text rounded outline-dashed outline-2 outline-offset-2 outline-amber-400 hover:bg-amber-300/20 focus:bg-amber-300/30 focus:outline-solid`,
        contentEditable: true,
        suppressContentEditableWarning: true,
        spellCheck: true,
        role: 'textbox',
        'aria-label': `Modifier le texte : ${original || id}`,
        onClick: event => { event.preventDefault(); event.stopPropagation(); },
        onKeyDown: event => {
            event.stopPropagation();
            if (event.key === 'Enter') { event.preventDefault(); event.currentTarget.blur(); }
            if (event.key === 'Escape') { event.currentTarget.innerText = text; event.currentTarget.blur(); }
        },
        onBlur: commit,
    }, text);
}
