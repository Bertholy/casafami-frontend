import { Plus } from 'lucide-react';
import { useSiteContent } from '../../context/SiteContentContext';
import { useLang } from '../../i18n/LangContext';
import { cssDuStyle } from '../../utils/styleTexte';

/**
 * Textes ajoutés par le super administrateur sur une page : « haut » = bandeau d'annonce sous le menu, « bas » = bloc de texte
 * avant le pied de page (ex. fermeture exceptionnelle, annonce). En mode édition, un clic ouvre la fenêtre de modification.
 */
export default function TextesAjoutes({ page, zone }) {
    const { content, editMode, ouvrirEditeur } = useSiteContent();
    const { lang } = useLang();
    const prefixe = `ajout.${page}.${zone}.`;
    const cles = Object.keys(content).filter(cle => cle.startsWith(prefixe) && !cle.endsWith('.mg')).sort();
    const haut = zone === 'haut';

    const elements = cles.map(cleBase => {
        const cleLangue = lang === 'mg' ? `${cleBase}.mg` : cleBase;
        const texte = lang === 'mg' ? (content[cleLangue]?.texte ?? content[cleBase]?.texte) : content[cleBase]?.texte;
        const style = content[cleLangue]?.style ?? content[cleBase]?.style;
        return { cleBase, cleLangue, texte, style };
    }).filter(e => e.texte);

    const ajouter = () => ouvrirEditeur({ mode: 'ajouter', page, zone, texte: '', style: null, defaut: '', supprimable: false });
    if (!elements.length && !editMode) return null;

    return (
        <section aria-label={haut ? 'Annonces' : 'Informations'} className={haut ? 'border-b border-teal-200 bg-teal-50 dark:border-teal-900 dark:bg-teal-950/40' : 'bg-white dark:bg-gray-900'}>
            <div className={`mx-auto max-w-4xl space-y-3 px-4 sm:px-6 ${haut ? 'py-3' : 'py-8'}`}>
                {elements.map(e => {
                    const classes = `whitespace-pre-line break-words ${haut ? 'text-center text-sm font-medium text-teal-900 dark:text-teal-100' : 'text-base text-gray-700 dark:text-gray-200'}`;
                    if (!editMode) return <p key={e.cleBase} className={classes} style={cssDuStyle(e.style)}>{e.texte}</p>;
                    return (
                        <p key={e.cleBase} role="button" tabIndex={0} title="Cliquer pour modifier ou supprimer ce texte"
                            className={`${classes} cursor-pointer rounded outline-dashed outline-2 outline-offset-2 outline-amber-400 hover:bg-amber-300/20 hover:outline-solid`} style={cssDuStyle(e.style)}
                            onClick={() => ouvrirEditeur({ mode: 'modifier', cleBase: e.cleBase, cleLangue: e.cleLangue, defaut: '', texte: e.texte, style: e.style || null, supprimable: true, modifie: true })}
                            onKeyDown={ev => { if (ev.key === 'Enter' || ev.key === ' ') { ev.preventDefault(); ev.currentTarget.click(); } }}>{e.texte}</p>
                    );
                })}
                {editMode && (
                    <button type="button" onClick={ajouter}
                        className="mx-auto flex items-center gap-2 rounded-xl border-2 border-dashed border-amber-400 px-4 py-2 text-sm font-medium text-amber-700 transition hover:bg-amber-50 dark:text-amber-300 dark:hover:bg-amber-500/10">
                        <Plus size={16} />Ajouter un texte {haut ? 'en haut de la page' : 'en bas de la page'}
                    </button>
                )}
            </div>
        </section>
    );
}
