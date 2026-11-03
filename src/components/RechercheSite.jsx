import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CornerDownLeft, Search } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogTitle } from './ui/dialog';
import { useLang } from '../i18n/LangContext';
import { chercher, simplifier, useIndexSite } from '../utils/indexSite';

/**
 * Recherche de tout le site public : services (avec leur détail), questions fréquentes, informations pratiques (horaires, adresse,
 * téléphone) et pages. On tape quelques mots (accents et majuscules sans importance, tous les mots doivent se retrouver), flèches pour
 * choisir, Entrée pour y aller : chaque résultat mène à l'endroit précis (service ouvert, question dépliée, section de l'accueil).
 * La recherche se fait dans la langue affichée et en français, quelle que soit la langue choisie.
 */

/** Texte avec les mots trouvés surlignés (les positions sont retrouvées malgré les accents retirés pour comparer). */
function surligner(texte, mots) {
    if (!texte || mots.length === 0) return texte;
    let norme = '';
    const origine = [];
    for (let i = 0; i < texte.length; i += 1) {
        for (const lettre of simplifier(texte[i])) { norme += lettre; origine.push(i); }
    }
    const plages = [];
    for (const mot of mots) {
        for (let debut = norme.indexOf(mot); debut !== -1; debut = norme.indexOf(mot, debut + mot.length)) {
            plages.push([origine[debut], origine[debut + mot.length - 1] + 1]);
        }
    }
    if (plages.length === 0) return texte;
    plages.sort((a, b) => a[0] - b[0]);
    const fusion = [plages[0].slice()];
    for (const [debut, fin] of plages.slice(1)) {
        const derniere = fusion[fusion.length - 1];
        if (debut <= derniere[1]) derniere[1] = Math.max(derniere[1], fin); else fusion.push([debut, fin]);
    }
    const morceaux = [];
    let curseur = 0;
    fusion.forEach(([debut, fin], i) => {
        if (debut > curseur) morceaux.push(texte.slice(curseur, debut));
        morceaux.push(<mark key={i} className="rounded bg-yellow-200/80 px-0.5 text-inherit dark:bg-yellow-400/30">{texte.slice(debut, fin)}</mark>);
        curseur = fin;
    });
    if (curseur < texte.length) morceaux.push(texte.slice(curseur));
    return morceaux;
}

const ORDRE_GROUPES = ['services', 'faq', 'infos', 'pages'];
const PAR_GROUPE = 6;

function Contenu({ onFermer }) {
    const { t } = useLang();
    const navigate = useNavigate();
    const { index } = useIndexSite();
    const [requete, setRequete] = useState('');
    const [actif, setActif] = useState(0);
    const liste = useRef(null);

    const { mots, resultats } = useMemo(() => chercher(index, requete), [index, requete]);

    // groupes affichés : résultats classés par type ; sans recherche, quelques suggestions
    const groupes = useMemo(() => {
        if (mots.length === 0) {
            const suggestions = ['p-rdv', 'p-mes-rdv', 'i-horaires', 'i-tel', 'i-urgence', 'p-faq', 'p-services'];
            return [{ cle: 'suggestions', titre: t("Suggestions"), items: suggestions.map(id => index.find(e => e.id === id)).filter(Boolean) }];
        }
        const titres = { services: t("Services"), faq: t("Questions fréquentes"), infos: t("Informations pratiques"), pages: t("Pages") };
        // le groupe qui contient la meilleure correspondance passe en premier (à égalité : services, questions, infos, pages)
        return ORDRE_GROUPES.map(cle => { const items = resultats.filter(r => r.groupe === cle); return { cle, titre: titres[cle], meilleur: items[0]?.score ?? 0, items: items.slice(0, PAR_GROUPE) }; })
            .filter(g => g.items.length > 0)
            .sort((a, b) => b.meilleur - a.meilleur || ORDRE_GROUPES.indexOf(a.cle) - ORDRE_GROUPES.indexOf(b.cle));
    }, [index, mots, resultats, t]);
    const plat = useMemo(() => groupes.flatMap(g => g.items), [groupes]);

    useEffect(() => { liste.current?.querySelector('[data-actif="true"]')?.scrollIntoView({ block: 'nearest' }); }, [actif]);

    const aller = entree => { if (!entree) return; onFermer(); navigate(entree.to); };
    const touche = event => {
        if (event.key === 'ArrowDown') { event.preventDefault(); setActif(i => Math.min(plat.length - 1, i + 1)); }
        else if (event.key === 'ArrowUp') { event.preventDefault(); setActif(i => Math.max(0, i - 1)); }
        else if (event.key === 'Enter') { event.preventDefault(); aller(plat[actif]); }
    };

    return (
        <>
            <DialogTitle className="sr-only">{t("Rechercher sur le site")}</DialogTitle>
            <DialogDescription id="recherche-desc" className="sr-only">{t("Tapez quelques mots, utilisez les flèches puis Entrée.")}</DialogDescription>
            <div className="flex items-center gap-2 border-b border-border px-4">
                <Search size={18} className="shrink-0 text-muted-foreground" aria-hidden="true" />
                <input autoFocus type="search" value={requete} onChange={event => { setRequete(event.target.value); setActif(0); }} onKeyDown={touche}
                    placeholder={t("Rechercher un service, une question, une information…")} aria-label={t("Rechercher sur le site")}
                    role="combobox" aria-expanded="true" aria-controls="recherche-liste" aria-activedescendant={plat[actif] ? `recherche-${plat[actif].id}` : undefined}
                    className="h-14 w-full bg-transparent text-base text-foreground outline-none placeholder:text-muted-foreground [&::-webkit-search-cancel-button]:hidden" />
                <kbd className="hidden shrink-0 rounded border border-border px-1.5 py-0.5 text-[10px] text-muted-foreground sm:block">{t("Échap")}</kbd>
            </div>

            <div ref={liste} id="recherche-liste" role="listbox" aria-label={t("Résultats de la recherche")} className="max-h-[60vh] overflow-y-auto p-2">
                {mots.length > 0 && plat.length === 0 && (
                    <div className="px-4 py-10 text-center">
                        <p className="text-sm font-semibold text-foreground">{t("Aucun résultat pour « {requete} ».", { requete: requete.trim() })}</p>
                        <p className="mt-1.5 text-sm text-muted-foreground">{t("Essayez un autre mot, ou appelez le cabinet : nous vous répondons avec plaisir.")}</p>
                    </div>
                )}
                {groupes.map(groupe => (
                    <div key={groupe.cle} role="group" aria-label={groupe.titre} className="mb-1">
                        <p className="px-3 pb-1 pt-2.5 text-[11px] font-extrabold uppercase tracking-[0.16em] text-muted-foreground">{groupe.titre}</p>
                        {groupe.items.map(entree => {
                            const position = plat.indexOf(entree);
                            const courant = position === actif;
                            const Icone = entree.Icone;
                            return (
                                <div key={entree.id} id={`recherche-${entree.id}`} role="option" aria-selected={courant} data-actif={courant}
                                    onMouseEnter={() => setActif(position)} onClick={() => aller(entree)}
                                    className={`flex cursor-pointer items-start gap-3 rounded-lg px-3 py-2.5 ${courant ? 'bg-accent text-accent-foreground' : ''}`}>
                                    <Icone size={17} className="mt-0.5 shrink-0 text-muted-foreground" aria-hidden="true" />
                                    <span className="min-w-0 flex-1">
                                        <span className="block text-sm font-semibold">{surligner(entree.titre, mots)}</span>
                                        {entree.extrait && <span className="mt-0.5 line-clamp-2 block text-[13px] leading-snug text-muted-foreground">{surligner(entree.extrait, mots)}</span>}
                                    </span>
                                    {courant && <CornerDownLeft size={14} className="mt-1 shrink-0 text-muted-foreground" aria-hidden="true" />}
                                </div>
                            );
                        })}
                    </div>
                ))}
            </div>
            <p className="sr-only" aria-live="polite">{mots.length > 0 ? t("{n} résultat(s)", { n: plat.length }) : ''}</p>
        </>
    );
}

/** Fenêtre de recherche du site public (ouverte par la loupe de la barre de navigation ou par Ctrl K). */
export default function RechercheSite({ open, onOpenChange }) {
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent aria-describedby="recherche-desc" className="top-[8vh] max-w-2xl">
                <Contenu onFermer={() => onOpenChange(false)} />
            </DialogContent>
        </Dialog>
    );
}
