import { useState } from 'react';
import { useLocation } from 'react-router-dom';
import { CheckCircle2, CircleHelp, Pencil, Plus, RotateCcw, TriangleAlert, Undo2, X } from 'lucide-react';
import { useSiteContent } from '../../context/SiteContentContext';
import { useLang } from '../../i18n/LangContext';
import { PAGES_EDITABLES, pagePublique } from '../../constants/routes';
import EditeurTexte from './EditeurTexte';

// Préfixe des clés d'éléments de chaque page (voir les composants Editable / Movable).
const PAGE_PREFIX = { '/': 'accueil.', '/services': 'services.', '/prendre-rdv': 'rdv.', '/mes-rdv': 'mesrdv.' };

const puce = 'inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold transition disabled:cursor-not-allowed disabled:opacity-40';

/**
 * Barre d'outils du super administrateur sur le site public : compacte, une seule ligne.
 * Terminer l'édition · langue modifiée · Ajouter un texte · Annuler · Remettre à l'origine · Aide.
 * La modification d'un texte se fait dans une fenêtre (EditeurTexte) qui s'ouvre au clic sur le texte.
 */
export default function SiteEditorBar() {
    const { canEdit, editMode, toggleEditMode, reset, status, annuler, peutAnnuler, ouvrirEditeur } = useSiteContent();
    const { pathname } = useLocation();
    const { lang } = useLang();
    const [aide, setAide] = useState(false);
    const [menu, setMenu] = useState(false);
    if (!canEdit) return null;
    const prefix = PAGE_PREFIX[pagePublique(pathname)];
    const page = PAGES_EDITABLES[pagePublique(pathname)];

    return (
        <>
            <div className="fixed bottom-3 left-1/2 z-[80] w-max max-w-[calc(100vw-1rem)] -translate-x-1/2" role="region" aria-label="Éditeur du site">
                {aide && editMode && (
                    <div role="dialog" aria-label="Aide de l’éditeur" className="mb-2 w-[min(26rem,calc(100vw-1rem))] rounded-2xl border border-amber-300 bg-slate-900/97 p-4 text-sm text-slate-200 shadow-2xl">
                        <div className="mb-2 flex items-center justify-between"><strong className="text-white">Comment modifier le site</strong><button onClick={() => setAide(false)} aria-label="Fermer l’aide"><X size={16} /></button></div>
                        <ul className="space-y-1.5 text-xs leading-relaxed">
                            <li>• <strong>Modifier un texte</strong> : cliquez dessus (entouré en pointillés). Une fenêtre s’ouvre : texte, gras, taille, couleur, aperçu.</li>
                            <li>• <strong>Ajouter un texte</strong> : bouton « Ajouter un texte » (annonce en haut ou en bas de la page).</li>
                            <li>• <strong>Déplacer un bouton</strong> : faites glisser la poignée <span className="rounded bg-amber-400 px-1 text-slate-900">✥</span> (double-clic = remettre à sa place).</li>
                            <li>• <strong>Se tromper ?</strong> « Annuler » revient en arrière ; « Remettre par défaut » restaure l’original.</li>
                            <li>• <strong>Malgache</strong> : changez la langue avec FR | MG en haut du site, puis modifiez : chaque langue a ses propres textes.</li>
                        </ul>
                    </div>
                )}
                {menu && editMode && (
                    <div role="menu" className="mb-2 ml-auto w-60 overflow-hidden rounded-2xl border border-amber-300 bg-slate-900/97 p-1 text-sm text-white shadow-2xl">
                        {prefix && <button role="menuitem" className="block w-full rounded-xl px-3 py-2 text-left hover:bg-white/10" onClick={() => { setMenu(false); if (window.confirm('Remettre les textes, mises en forme et positions de cette page à l’origine ? (les textes ajoutés sont supprimés)')) reset(prefix, `ajout.${page}.`); }}>Cette page</button>}
                        <button role="menuitem" className="block w-full rounded-xl px-3 py-2 text-left hover:bg-white/10" onClick={async () => { setMenu(false); if (window.confirm('Remettre le menu du haut et le pied de page à l’origine ?')) await reset('nav.', 'footer.'); }}>Menu et pied de page</button>
                        <button role="menuitem" className="block w-full rounded-xl px-3 py-2 text-left text-rose-300 hover:bg-white/10" onClick={() => { setMenu(false); if (window.confirm('Remettre TOUT le site à son apparence d’origine ? Cette action est définitive.')) reset(); }}>Tout le site</button>
                    </div>
                )}
                <div className="flex flex-wrap items-center justify-center gap-1.5 rounded-full border border-amber-300 bg-slate-900/95 px-2.5 py-2 text-white shadow-2xl backdrop-blur">
                    <button onClick={() => { toggleEditMode(); setAide(false); setMenu(false); }} aria-pressed={editMode}
                        className={`${puce} text-sm ${editMode ? 'bg-amber-400 text-slate-900 hover:bg-amber-300' : 'bg-white/10 hover:bg-white/20'}`}>
                        {editMode ? <X size={15} /> : <Pencil size={15} />}{editMode ? 'Terminer' : 'Modifier le site'}
                    </button>
                    {editMode && (
                        <>
                            <span className={`${puce} cursor-default ${lang === 'mg' ? 'bg-emerald-400 text-slate-900' : 'bg-sky-400 text-slate-900'}`} title="Changez de langue avec FR | MG en haut du site">{lang === 'mg' ? 'MG' : 'FR'}</span>
                            {page && <button onClick={() => ouvrirEditeur({ mode: 'ajouter', page, zone: 'bas', texte: '', style: null, defaut: '', supprimable: false })} className={`${puce} bg-white/10 hover:bg-white/20`}><Plus size={14} />Ajouter un texte</button>}
                            <button onClick={annuler} disabled={!peutAnnuler} className={`${puce} bg-white/10 hover:bg-white/20`} title="Annuler la dernière modification"><Undo2 size={14} />Annuler</button>
                            <button onClick={() => { setMenu(!menu); setAide(false); }} aria-expanded={menu} className={`${puce} bg-white/10 hover:bg-white/20`}><RotateCcw size={14} />Remettre par défaut</button>
                            <button onClick={() => { setAide(!aide); setMenu(false); }} aria-expanded={aide} aria-label="Aide" title="Aide" className={`${puce} bg-white/10 px-2 hover:bg-white/20`}><CircleHelp size={15} /></button>
                        </>
                    )}
                    <span role="status" aria-live="polite" className="flex items-center gap-1 px-1 text-xs">
                        {status.type === 'ok' && <><CheckCircle2 size={14} className="text-emerald-400" />{status.message}</>}
                        {status.type === 'error' && <><TriangleAlert size={14} className="text-rose-400" />{status.message}</>}
                    </span>
                </div>
            </div>
            <EditeurTexte />
        </>
    );
}
