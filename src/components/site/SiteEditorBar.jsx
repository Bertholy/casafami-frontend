import { useLocation } from 'react-router-dom';
import { CheckCircle2, Pencil, RotateCcw, TriangleAlert, X } from 'lucide-react';
import { useSiteContent } from '../../context/SiteContentContext';

// Préfixe des clés d'éléments de chaque page (voir les composants Editable / Movable).
const PAGE_PREFIX = { '/': 'accueil.', '/services': 'services.', '/prendre-rdv': 'rdv.', '/mes-rdv': 'mesrdv.' };

/** Barre flottante du super administrateur sur le site public : activer l'édition, remettre une page à l'origine. */
export default function SiteEditorBar() {
    const { canEdit, editMode, toggleEditMode, reset, status } = useSiteContent();
    const { pathname } = useLocation();
    if (!canEdit) return null;
    const prefix = PAGE_PREFIX[pathname];

    return (
        <div className="fixed bottom-4 left-1/2 z-[80] w-[calc(100%-2rem)] max-w-3xl -translate-x-1/2" role="region" aria-label="Éditeur du site">
            <div className="flex flex-wrap items-center gap-2 rounded-2xl border border-amber-300 bg-slate-900/95 px-4 py-3 text-sm text-white shadow-2xl backdrop-blur">
                <button onClick={toggleEditMode} aria-pressed={editMode}
                    className={`inline-flex items-center gap-2 rounded-xl px-3 py-2 font-semibold transition ${editMode ? 'bg-amber-400 text-slate-900' : 'bg-white/10 hover:bg-white/20'}`}>
                    {editMode ? <X size={16} /> : <Pencil size={16} />}{editMode ? 'Terminer l’édition' : 'Modifier le site'}
                </button>
                {editMode ? (
                    <>
                        <p className="min-w-0 flex-1 text-xs text-slate-300">
                            Cliquez sur un texte pour le modifier (Entrée pour valider). Faites glisser la poignée <span className="rounded bg-amber-400 px-1 text-slate-900">✥</span> pour placer un bouton où vous voulez ; double-clic sur la poignée pour le remettre à sa place.
                            <span className="md:hidden"> Utilisez un écran large pour déplacer les éléments.</span>
                        </p>
                        {prefix && <button onClick={() => { if (window.confirm('Remettre les textes et positions de cette page à l’origine ?')) reset(prefix); }}
                            className="inline-flex items-center gap-1.5 rounded-xl bg-white/10 px-3 py-2 text-xs hover:bg-white/20"><RotateCcw size={14} />Cette page</button>}
                        <button onClick={async () => { if (window.confirm('Remettre le menu du haut et le pied de page à l’origine ?')) { await reset('nav.'); await reset('footer.'); } }}
                            className="inline-flex items-center gap-1.5 rounded-xl bg-white/10 px-3 py-2 text-xs hover:bg-white/20"><RotateCcw size={14} />Menu et pied de page</button>
                        <button onClick={() => { if (window.confirm('Remettre TOUT le site à son apparence d’origine ?')) reset(); }}
                            className="inline-flex items-center gap-1.5 rounded-xl bg-white/10 px-3 py-2 text-xs hover:bg-white/20"><RotateCcw size={14} />Tout le site</button>
                    </>
                ) : <p className="text-xs text-slate-400">Vous êtes connecté en super administrateur.</p>}
                <span role="status" aria-live="polite" className="ml-auto flex items-center gap-1 text-xs">
                    {status.type === 'ok' && <><CheckCircle2 size={14} className="text-emerald-400" />{status.message}</>}
                    {status.type === 'error' && <><TriangleAlert size={14} className="text-rose-400" />{status.message}</>}
                </span>
            </div>
        </div>
    );
}
