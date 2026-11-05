import { useState } from 'react';
import { UserX } from 'lucide-react';
import { Button } from '../ui/button';
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '../ui/dialog';
import { Textarea } from '../ui/input';
import { formatDateFr, hhmm } from '../../constants/app';

/**
 * Fenêtre « Décliner ce rendez-vous » : la personne à qui il est attribué dit qu'elle ne peut pas le prendre (raison facultative). Le rendez-vous n'est plus attribué à personne,
 * son créneau est libéré pour elle, et la réception (la secrétaire) est prévenue pour le confier à quelqu'un d'autre.
 * `rdv` : le rendez-vous concerné (null = fenêtre fermée) ; `onConfirmer(motif)` ; `onClose()`.
 */
export default function DialogDecliner({ rdv, enCours = false, onConfirmer, onClose }) {
    // le contenu n'est monté que fenêtre ouverte : la raison saisie repart de zéro à chaque ouverture
    return (
        <Dialog open={Boolean(rdv)} onOpenChange={ouvert => { if (!ouvert) onClose(); }}>
            <DialogContent className="top-[16vh] max-w-md p-5">
                {rdv && <Contenu rdv={rdv} enCours={enCours} onConfirmer={onConfirmer} onClose={onClose} />}
            </DialogContent>
        </Dialog>
    );
}

function Contenu({ rdv, enCours, onConfirmer, onClose }) {
    const [motif, setMotif] = useState('');
    return (
        <>
            <DialogTitle className="flex items-center gap-2 text-base font-semibold text-foreground"><UserX size={18} aria-hidden="true" />Décliner ce rendez-vous ?</DialogTitle>
            <DialogDescription className="mt-2 text-sm leading-relaxed text-muted-foreground">
                Le rendez-vous de <strong className="text-foreground">{rdv.nomClient}</strong> du {formatDateFr(rdv.dateRdv, { weekday: 'long', day: 'numeric', month: 'long' })} à {hhmm(rdv.heureRdv)} ne vous sera plus attribué.
                La secrétaire est prévenue pour le confier à quelqu’un d’autre ; le patient, lui, n’est pas dérangé.
            </DialogDescription>
            <label className="mt-4 block text-sm font-medium text-foreground">Raison (facultatif)
                <Textarea rows={2} maxLength={300} value={motif} onChange={e => setMotif(e.target.value)} placeholder="Ex. : en congé ce jour-là, déjà un autre patient…" className="mt-1.5" autoFocus />
            </label>
            <div className="mt-5 flex flex-wrap justify-end gap-2">
                <Button variant="outline" size="md" onClick={onClose}>Retour</Button>
                <Button variant="destructive" size="md" disabled={enCours} onClick={() => onConfirmer(motif.trim())}><UserX />Décliner le rendez-vous</Button>
            </div>
        </>
    );
}
