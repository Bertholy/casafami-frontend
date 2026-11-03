import { Settings, UserRound, X } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogTitle } from './ui/dialog';

/** Mon profil : l'identité du compte (photo, nom, rôle, e-mail, téléphone) et ce que la personne peut faire dans l'application. */
export default function ProfilDialog({ open, onOpenChange, avatar, profile, nom, role, onParametres }) {
    const droits = profile?.permissions?.length ?? 0;
    const lignes = [
        ['Nom', nom],
        ['Rôle', role],
        ['Adresse e-mail', profile?.email],
        ['Téléphone', profile?.telephone],
        ['Droits dans l’application', droits ? `${droits} droit${droits > 1 ? 's' : ''} accordé${droits > 1 ? 's' : ''}` : null],
    ].filter(([, valeur]) => valeur);
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="top-[8vh] max-h-[84vh] max-w-md overflow-y-auto p-0">
                <div className="flex items-start justify-between gap-3 border-b border-border px-5 py-4">
                    <div>
                        <DialogTitle className="flex items-center gap-2 text-base font-semibold text-foreground"><UserRound size={17} aria-hidden="true" />Mon profil</DialogTitle>
                        <DialogDescription className="mt-1 text-sm text-muted-foreground">Les informations de votre compte.</DialogDescription>
                    </div>
                    <button type="button" onClick={() => onOpenChange(false)} aria-label="Fermer" className="rounded-lg p-1.5 text-muted-foreground transition hover:bg-accent"><X size={18} /></button>
                </div>
                <div className="flex items-center gap-4 px-5 pt-5">
                    {avatar('h-16 w-16')}
                    <div className="min-w-0">
                        <p className="truncate text-base font-semibold text-foreground">{nom}</p>
                        <p className="truncate text-sm text-muted-foreground">{role}</p>
                    </div>
                </div>
                <dl className="divide-y divide-border px-5 py-3 text-sm">
                    {lignes.map(([libelle, valeur]) => (
                        <div key={libelle} className="flex items-baseline justify-between gap-4 py-2.5">
                            <dt className="shrink-0 text-muted-foreground">{libelle}</dt>
                            <dd className="min-w-0 truncate text-right font-medium text-foreground">{valeur}</dd>
                        </div>
                    ))}
                </dl>
                <div className="flex justify-end gap-2 border-t border-border px-5 py-4">
                    <button type="button" onClick={() => onOpenChange(false)} className="rounded-xl border border-border px-4 py-2 text-sm transition hover:bg-accent">Fermer</button>
                    <button type="button" onClick={onParametres} className="inline-flex items-center gap-2 rounded-xl bg-teal-700 px-4 py-2 text-sm font-semibold text-white transition hover:bg-teal-800"><Settings size={15} aria-hidden="true" />Modifier dans les paramètres</button>
                </div>
            </DialogContent>
        </Dialog>
    );
}
