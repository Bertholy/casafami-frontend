import { useEffect, useState } from 'react';
import { AlignCenter, AlignLeft, AlignRight, Bold, Italic, Loader2, RotateCcw, Trash2, X } from 'lucide-react';
import { useSiteContent } from '../../context/SiteContentContext';
import { useLang } from '../../i18n/LangContext';
import { COULEURS, TAILLE_MAX, TAILLE_MIN, cssDuStyle, nouvelleCleAjout, styleAEnvoyer } from '../../utils/styleTexte';

const ZONES = [['haut', 'En haut de la page (bandeau d’annonce)'], ['bas', 'En bas de la page']];
const bouton = 'inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition disabled:opacity-50';

/**
 * Fenêtre de modification d'un texte du site : le texte, sa mise en forme (gras, italique, alignement, taille, couleur),
 * un aperçu en direct, et les actions Enregistrer / Annuler / Remettre le texte d'origine (ou Supprimer pour un texte ajouté).
 */
function Formulaire({ editeur, onFermer }) {
    const { save, supprimer } = useSiteContent();
    const { lang } = useLang();
    const ajout = editeur.mode === 'ajouter';
    const [texte, setTexte] = useState(editeur.texte || '');
    const [gras, setGras] = useState(Boolean(editeur.style?.gras));
    const [italique, setItalique] = useState(Boolean(editeur.style?.italique));
    const [taille, setTaille] = useState(editeur.style?.taille || null);
    const [couleur, setCouleur] = useState(editeur.style?.couleur || null);
    const [alignement, setAlignement] = useState(editeur.style?.alignement || null);
    const [zone, setZone] = useState(editeur.zone || 'bas');
    const [enCours, setEnCours] = useState(false);
    const [erreur, setErreur] = useState('');

    const style = styleAEnvoyer({ gras, italique, taille, couleur, alignement });
    const modifie = texte !== (editeur.texte || '') || JSON.stringify(style) !== JSON.stringify(styleAEnvoyer(editeur.style || {}));

    const enregistrer = async () => {
        const valeur = texte.trim();
        if (ajout && !valeur) { setErreur('Écrivez le texte à ajouter.'); return; }
        setEnCours(true); setErreur('');
        let ok;
        if (!ajout && !valeur) ok = await supprimer(editeur.cleLangue);                      // texte vidé = texte d'origine
        else {
            const cle = ajout ? nouvelleCleAjout(editeur.page, zone) : editeur.cleLangue;
            ok = await save(cle, { texte: !ajout && valeur === editeur.defaut ? '' : valeur, style });
        }
        setEnCours(false);
        if (ok) onFermer(); else setErreur('L’enregistrement a échoué. Réessayez.');
    };
    const remettre = async () => {
        if (!window.confirm(ajout ? 'Supprimer ce texte ?' : 'Remettre le texte et sa mise en forme à l’origine ?')) return;
        setEnCours(true);
        const ok = editeur.supprimable ? await supprimer(editeur.cleBase, `${editeur.cleBase}.mg`) : await supprimer(editeur.cleLangue);
        setEnCours(false);
        if (ok) onFermer();
    };

    useEffect(() => {
        const touche = event => { if (event.key === 'Escape') onFermer(); };
        window.addEventListener('keydown', touche);
        return () => window.removeEventListener('keydown', touche);
    }, [onFermer]);

    const options = 'rounded-lg border p-2 transition';
    const actif = 'border-teal-600 bg-teal-600 text-white';
    const inactif = 'border-slate-300 text-slate-700 hover:border-teal-500 dark:border-gray-600 dark:text-gray-200';

    return (
        <div className="fixed inset-0 z-[100] flex items-end justify-center bg-slate-950/60 p-0 backdrop-blur-sm sm:items-center sm:p-4" onMouseDown={event => { if (event.target === event.currentTarget) onFermer(); }}>
            <form role="dialog" aria-modal="true" aria-label={ajout ? 'Ajouter un texte' : 'Modifier le texte'} onSubmit={event => { event.preventDefault(); enregistrer(); }}
                onKeyDown={event => { if (event.key === 'Enter' && (event.ctrlKey || event.metaKey)) { event.preventDefault(); enregistrer(); } }}
                className="flex max-h-[94vh] w-full max-w-2xl flex-col overflow-hidden rounded-t-3xl bg-white text-slate-900 shadow-2xl dark:bg-gray-900 dark:text-gray-100 sm:rounded-3xl">
                <header className="flex items-start justify-between gap-3 border-b border-slate-200 px-5 py-4 dark:border-gray-800">
                    <div className="min-w-0">
                        <h2 className="text-lg font-bold">{ajout ? 'Ajouter un texte' : 'Modifier le texte'}</h2>
                        <p className="mt-0.5 flex flex-wrap items-center gap-2 text-xs text-slate-500 dark:text-gray-400">
                            <span className={`rounded-full px-2 py-0.5 font-semibold ${lang === 'mg' ? 'bg-emerald-100 text-emerald-800' : 'bg-sky-100 text-sky-800'}`}>{lang === 'mg' ? 'Version malgache' : 'Version française'}</span>
                            {!ajout && <span className="truncate">Élément : {editeur.cleBase}</span>}
                        </p>
                    </div>
                    <button type="button" onClick={onFermer} aria-label="Fermer" className="rounded-lg p-1.5 hover:bg-slate-100 dark:hover:bg-gray-800"><X size={20} /></button>
                </header>

                <div className="min-h-0 flex-1 space-y-4 overflow-y-auto px-5 py-4">
                    {ajout && (
                        <label className="block text-sm font-medium">Emplacement
                            <select value={zone} onChange={event => setZone(event.target.value)} className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm dark:border-gray-600 dark:bg-gray-950">
                                {ZONES.map(([cle, libelle]) => <option key={cle} value={cle}>{libelle}</option>)}
                            </select>
                        </label>
                    )}

                    <label className="block text-sm font-medium">Texte
                        <textarea autoFocus value={texte} onChange={event => setTexte(event.target.value)} rows={4} maxLength={2000}
                            placeholder={ajout ? 'Ex. : Le cabinet est fermé le 25 décembre. Joyeuses fêtes !' : ''}
                            className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-teal-600 focus:ring-2 focus:ring-teal-600/20 dark:border-gray-600 dark:bg-gray-950" />
                        <span className="mt-1 flex justify-between text-xs font-normal text-slate-500 dark:text-gray-400">
                            <span>Entrée pour passer à la ligne · Ctrl + Entrée pour enregistrer</span><span>{texte.length} / 2000</span>
                        </span>
                    </label>

                    {!ajout && (
                        <div className="rounded-xl bg-slate-50 p-3 text-sm dark:bg-gray-800/60">
                            <div className="flex items-center justify-between gap-2">
                                <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Texte d’origine</span>
                                <button type="button" onClick={() => setTexte(editeur.defaut)} className="text-xs font-medium text-teal-700 hover:underline dark:text-teal-300">Utiliser ce texte</button>
                            </div>
                            <p className="mt-1 whitespace-pre-line text-slate-700 dark:text-gray-300">{editeur.defaut || '—'}</p>
                        </div>
                    )}

                    <fieldset className="space-y-3 rounded-xl border border-slate-200 p-3 dark:border-gray-700">
                        <legend className="px-1 text-xs font-semibold uppercase tracking-wide text-slate-500">Mise en forme</legend>
                        <div className="flex flex-wrap items-center gap-2">
                            <button type="button" onClick={() => setGras(!gras)} aria-pressed={gras} aria-label="Gras" title="Gras" className={`${options} ${gras ? actif : inactif}`}><Bold size={16} /></button>
                            <button type="button" onClick={() => setItalique(!italique)} aria-pressed={italique} aria-label="Italique" title="Italique" className={`${options} ${italique ? actif : inactif}`}><Italic size={16} /></button>
                            <span className="mx-1 h-6 w-px bg-slate-200 dark:bg-gray-700" />
                            {[['left', AlignLeft, 'À gauche'], ['center', AlignCenter, 'Centré'], ['right', AlignRight, 'À droite']].map(([valeur, Icone, nom]) => (
                                <button key={valeur} type="button" onClick={() => setAlignement(alignement === valeur ? null : valeur)} aria-pressed={alignement === valeur} aria-label={nom} title={nom} className={`${options} ${alignement === valeur ? actif : inactif}`}><Icone size={16} /></button>
                            ))}
                        </div>
                        <div className="flex flex-wrap items-center gap-3 text-sm">
                            <label className="flex flex-1 items-center gap-3 min-w-56">
                                <span className="w-14 shrink-0 font-medium">Taille</span>
                                <input type="range" min={TAILLE_MIN} max={TAILLE_MAX} value={taille || 16} onChange={event => setTaille(Number(event.target.value))} aria-label="Taille du texte" className="w-full accent-teal-700" />
                                <span className="w-12 shrink-0 text-right tabular-nums text-xs text-slate-500">{taille ? `${taille} px` : 'auto'}</span>
                            </label>
                            {taille && <button type="button" onClick={() => setTaille(null)} className="text-xs font-medium text-teal-700 hover:underline dark:text-teal-300">Taille d’origine</button>}
                        </div>
                        <div className="flex flex-wrap items-center gap-2">
                            <span className="w-14 shrink-0 text-sm font-medium">Couleur</span>
                            <button type="button" onClick={() => setCouleur(null)} aria-pressed={!couleur} aria-label="Couleur d’origine" title="Couleur d’origine"
                                className={`flex h-7 w-7 items-center justify-center rounded-full border-2 text-[10px] font-bold ${!couleur ? 'border-teal-600 text-teal-700' : 'border-slate-300 text-slate-400'}`}>A</button>
                            {COULEURS.map(c => (
                                <button key={c} type="button" onClick={() => setCouleur(c)} aria-pressed={couleur === c} aria-label={`Couleur ${c}`} style={{ background: c }}
                                    className={`h-7 w-7 rounded-full border-2 ${couleur === c ? 'border-teal-600 ring-2 ring-teal-300' : 'border-slate-300'}`} />
                            ))}
                            <input type="color" value={couleur || '#0f766e'} onChange={event => setCouleur(event.target.value)} aria-label="Choisir une autre couleur" className="h-7 w-9 cursor-pointer rounded border border-slate-300 bg-transparent p-0" />
                        </div>
                    </fieldset>

                    <div>
                        <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-slate-500">Aperçu</p>
                        <div className="rounded-xl bg-slate-300 p-4 dark:bg-slate-600">
                            <p className="whitespace-pre-line break-words text-base text-slate-900 dark:text-white" style={cssDuStyle(style)}>{texte.trim() || (editeur.defaut ? editeur.defaut : 'Votre texte apparaîtra ici')}</p>
                        </div>
                    </div>
                    {erreur && <p role="alert" className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700 dark:bg-rose-500/10 dark:text-rose-300">{erreur}</p>}
                </div>

                <footer className="flex flex-wrap items-center gap-2 border-t border-slate-200 px-5 py-3 dark:border-gray-800">
                    {(editeur.supprimable || (!ajout && (editeur.modifie))) && (
                        <button type="button" onClick={remettre} disabled={enCours} className={`${bouton} border border-slate-300 text-slate-700 hover:bg-slate-50 dark:border-gray-600 dark:text-gray-200 dark:hover:bg-gray-800 sm:mr-auto`}>
                            {editeur.supprimable ? <><Trash2 size={16} />Supprimer ce texte</> : <><RotateCcw size={16} />Remettre par défaut</>}
                        </button>
                    )}
                    <button type="button" onClick={onFermer} className={`${bouton} border border-slate-300 hover:bg-slate-50 dark:border-gray-600 dark:hover:bg-gray-800 ${editeur.supprimable || editeur.modifie ? '' : 'sm:ml-auto'}`}>Annuler</button>
                    <button disabled={enCours || (!ajout && !modifie)} className={`${bouton} bg-teal-700 text-white hover:bg-teal-800`}>{enCours && <Loader2 size={16} className="animate-spin" />}Enregistrer</button>
                </footer>
            </form>
        </div>
    );
}

export default function EditeurTexte() {
    const { editeur, fermerEditeur } = useSiteContent();
    if (!editeur) return null;
    return <Formulaire key={`${editeur.mode}-${editeur.cleLangue || 'nouveau'}`} editeur={editeur} onFermer={fermerEditeur} />;
}
