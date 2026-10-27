import { useEffect, useMemo, useRef, useState } from 'react';
import { CornerDownLeft, Search } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogTitle } from './ui/dialog';

const normaliser = texte => String(texte || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();

/**
 * Recherche d'une page (Ctrl K) : on tape quelques lettres, flèches pour choisir, Entrée pour y aller.
 * items : [{ id, label, groupe, icon, onSelect }]
 */
export default function CommandPalette({ open, onOpenChange, items }) {
    const [requete, setRequete] = useState('');
    const [actif, setActif] = useState(0);
    const liste = useRef(null);

    const resultats = useMemo(() => {
        const q = normaliser(requete).trim();
        return q ? items.filter(item => normaliser(`${item.label} ${item.groupe}`).includes(q)) : items;
    }, [items, requete]);

    useEffect(() => {
        if (!open) return;
        const reinit = window.setTimeout(() => { setRequete(''); setActif(0); }, 0);
        return () => window.clearTimeout(reinit);
    }, [open]);
    useEffect(() => { liste.current?.querySelector('[data-actif="true"]')?.scrollIntoView({ block: 'nearest' }); }, [actif]);

    const choisir = item => { if (!item) return; onOpenChange(false); item.onSelect(); };
    const touche = event => {
        if (event.key === 'ArrowDown') { event.preventDefault(); setActif(i => Math.min(resultats.length - 1, i + 1)); }
        else if (event.key === 'ArrowUp') { event.preventDefault(); setActif(i => Math.max(0, i - 1)); }
        else if (event.key === 'Enter') { event.preventDefault(); choisir(resultats[actif]); }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent aria-describedby="palette-desc" className="max-w-lg">
                <DialogTitle className="sr-only">Rechercher une page</DialogTitle>
                <DialogDescription id="palette-desc" className="sr-only">Tapez le nom d’une page, utilisez les flèches puis Entrée.</DialogDescription>
                <div className="flex items-center gap-2 border-b border-border px-3.5">
                    <Search size={16} className="shrink-0 text-muted-foreground" aria-hidden="true" />
                    <input autoFocus value={requete} onChange={event => { setRequete(event.target.value); setActif(0); }} onKeyDown={touche}
                        placeholder="Rechercher une page…" aria-label="Rechercher une page" role="combobox" aria-expanded="true" aria-controls="palette-liste"
                        className="h-12 w-full bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground" />
                    <kbd className="hidden shrink-0 rounded border border-border px-1.5 py-0.5 text-[10px] text-muted-foreground sm:block">Échap</kbd>
                </div>
                <ul id="palette-liste" ref={liste} role="listbox" className="max-h-80 overflow-y-auto p-1.5">
                    {resultats.length === 0 && <li className="px-3 py-8 text-center text-sm text-muted-foreground">Aucune page ne correspond.</li>}
                    {resultats.map((item, index) => {
                        const Icone = item.icon;
                        const courant = index === actif;
                        return (
                            <li key={item.id} role="option" aria-selected={courant} data-actif={courant}
                                onMouseEnter={() => setActif(index)} onClick={() => choisir(item)}
                                className={`flex cursor-pointer items-center gap-3 rounded-md px-2.5 py-2 text-sm ${courant ? 'bg-accent text-accent-foreground' : ''}`}>
                                {Icone && <Icone size={16} className="shrink-0 text-muted-foreground" aria-hidden="true" />}
                                <span className="min-w-0 flex-1 truncate">{item.label}</span>
                                <span className="shrink-0 text-xs text-muted-foreground">{item.groupe}</span>
                                {courant && <CornerDownLeft size={13} className="shrink-0 text-muted-foreground" aria-hidden="true" />}
                            </li>
                        );
                    })}
                </ul>
            </DialogContent>
        </Dialog>
    );
}
