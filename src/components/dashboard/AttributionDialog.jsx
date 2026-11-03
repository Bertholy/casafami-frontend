import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Loader2, UserCheck, X } from 'lucide-react';
import axiosClient from '../../api/axiosClient';
import { formatDateFr, hhmm } from '../../constants/app';
import { apiErrorMessage, peut } from '../../utils/auth';
import { cn } from '../../lib/utils';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogTitle } from '../ui/dialog';
import { Tooltip, TooltipProvider } from '../ui/tooltip';
import OccupationGrid from './OccupationGrid';

const prenomDe = nom => String(nom || '').trim().split(/\s+/)[0];
/** « dimanche 1 novembre » → « Dimanche 1 Novembre » (jour et mois en majuscule initiale, comme dans la maquette). */
const jourLong = date => formatDateFr(date, { weekday: 'long', day: 'numeric', month: 'long' }).replace(/\p{L}+/gu, mot => mot.charAt(0).toUpperCase() + mot.slice(1));

/**
 * Le super administrateur (ou la secrétaire, réceptionniste) décide qui prend le rendez-vous : il attribue (ou change, ou retire) la personne.
 * Celle-ci est prévenue par notification, doit accepter le rendez-vous ; le rendez-vous est ensuite confirmé.
 * Chaque personne est affichée libre ou occupée à ce créneau (pastilles), avec le détail de la journée entière (grille) ; les deux lisent
 * la même donnée : l'agenda de chaque personne renvoyé par /admin/occupation.
 */
export default function AttributionDialog({ rdv, onClose, onDone }) {
    const heure = hhmm(rdv.heureRdv);
    const [occupation, setOccupation] = useState(null);
    const [choix, setChoix] = useState(rdv.praticienId ? String(rdv.praticienId) : '');
    const [loadError, setLoadError] = useState('');
    const [error, setError] = useState('');
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        let cancelled = false;
        axiosClient.get('/admin/occupation', { params: { date: rdv.dateRdv } })
            .then(({ data }) => { if (!cancelled) setOccupation(data); })
            .catch(err => { if (!cancelled) setLoadError(apiErrorMessage(err, 'Impossible de charger l’occupation du personnel.')); });
        return () => { cancelled = true; };
    }, [rdv.dateRdv]);

    // État de chaque personne à CE créneau (hors le rendez-vous lui-même)
    const personnel = useMemo(() => (occupation?.personnel || []).map(p => {
        const cellule = p.occupations[heure];
        const occupe = Boolean(cellule) && cellule.rdvId !== rdv.id;
        return { ...p, occupe, par: occupe ? cellule.patient : null };
    }), [occupation, heure, rdv.id]);
    const libres = personnel.filter(p => !p.occupe);
    const suggere = [...libres].sort((a, b) => a.total - b.total)[0];

    // Pré-sélection : la personne déjà attribuée, sinon la personne libre la moins chargée ce jour-là
    const choixEffectif = choix || (rdv.praticienId ? '' : String(suggere?.id || ''));
    const selection = personnel.find(p => String(p.id) === choixEffectif);

    const valider = async retirer => {
        setSaving(true); setError('');
        try {
            await axiosClient.put(`/rdv/${rdv.id}/praticien`, { praticienId: retirer ? null : Number(choixEffectif) });
            await onDone(retirer ? 'Attribution retirée.' : `Rendez-vous attribué à ${selection?.nom}. La personne a été prévenue : vous serez notifié(e) quand elle l’aura accepté, puis vous pourrez le confirmer.`);
        } catch (err) {
            setError(apiErrorMessage(err, 'Action impossible. Réessayez.'));
            axiosClient.get('/admin/occupation', { params: { date: rdv.dateRdv } }).then(({ data }) => setOccupation(data)).catch(() => {});
        } finally { setSaving(false); }
    };

    const peuDePersonnes = occupation && occupation.capaciteParCreneau < personnel.length;
    const lienHoraires = peut('PLANNING_GERER');
    return (
        <TooltipProvider delayDuration={200}>
            <Dialog open onOpenChange={ouvert => { if (!ouvert) onClose(); }}>
                <DialogContent className="top-[5vh] max-h-[90vh] max-w-3xl overflow-y-auto p-0">
                    {/* ---------- en-tête ---------- */}
                    <div className="flex items-start justify-between gap-3 border-b border-border px-5 py-4">
                        <div className="min-w-0">
                            <DialogTitle className="text-base font-semibold text-foreground">Attribuer le rendez-vous</DialogTitle>
                            <DialogDescription asChild>
                                <p className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-muted-foreground">
                                    <Badge variant="secondary" className="whitespace-nowrap text-sm font-semibold">{rdv.nomClient}</Badge>
                                    <span className="whitespace-nowrap">{jourLong(rdv.dateRdv)} à {heure}</span>
                                    {rdv.serviceNom && <span className="whitespace-nowrap">· {rdv.serviceNom}</span>}
                                </p>
                            </DialogDescription>
                        </div>
                        <DialogClose asChild>
                            <Button variant="ghost" size="icon" aria-label="Fermer" className="-mr-2 -mt-1 shrink-0"><X /></Button>
                        </DialogClose>
                    </div>

                    <div className="space-y-5 p-5">
                        {loadError && <p role="alert" className="rounded-xl bg-destructive-soft p-3 text-sm text-destructive-soft-foreground">{loadError}</p>}
                        {!occupation && !loadError && <p className="flex items-center justify-center gap-2 p-6 text-sm text-muted-foreground"><Loader2 size={18} className="animate-spin" />Chargement de l’occupation du personnel…</p>}

                        {occupation && (
                            <>
                                {/* ---------- choix de la personne : pastilles compactes ---------- */}
                                <div>
                                    <h3 id="attribution-legende" className="mb-2 text-sm font-semibold text-foreground">Qui prend ce rendez-vous à {heure} ?</h3>
                                    {personnel.length === 0 ? <p className="rounded-xl bg-muted p-4 text-sm text-muted-foreground">Aucun médecin ni sage-femme n’est enregistré. Créez d’abord leurs comptes dans « Comptes et accès ».</p> : (
                                        <div role="radiogroup" aria-labelledby="attribution-legende" className="flex flex-wrap gap-2">
                                            {personnel.map(p => {
                                                const actif = String(p.id) === choixEffectif;
                                                const pastille = (
                                                    <label className={cn('inline-flex min-h-10 cursor-pointer items-center gap-2 rounded-full border px-3 py-1.5 text-sm transition-colors has-focus-visible:ring-2 has-focus-visible:ring-ring has-focus-visible:ring-offset-2 has-focus-visible:ring-offset-background',
                                                        actif ? 'border-primary bg-primary/10' : 'border-border bg-card hover:bg-accent')}>
                                                        <input type="radio" name="praticien" value={p.id} checked={actif} onChange={() => setChoix(String(p.id))} className="size-4 accent-primary" aria-label={`${p.nom}, ${p.total} rendez-vous, ${p.occupe ? `occupé(e) à ${heure}` : `libre à ${heure}`}`} />
                                                        <span className="font-semibold text-foreground">{prenomDe(p.nom)}</span>
                                                        <span className="text-muted-foreground">{p.total} RDV</span>
                                                        {p.occupe ? <Badge variant="destructive">Occupé(e)</Badge> : <Badge variant="success">Libre</Badge>}
                                                        {!p.occupe && suggere?.id === p.id && libres.length > 1 && <span className="text-xs text-muted-foreground">moins chargé(e)</span>}
                                                    </label>
                                                );
                                                return p.occupe
                                                    ? <Tooltip key={p.id} label={`Déjà un rendez-vous à ${heure}`} side="top">{pastille}</Tooltip>
                                                    : <span key={p.id}>{pastille}</span>;
                                            })}
                                        </div>
                                    )}
                                    {personnel.length > 0 && (
                                        <p className="mt-2 flex flex-wrap items-center gap-x-5 gap-y-1 text-xs text-muted-foreground">
                                            <span className="inline-flex items-center gap-1.5"><span aria-hidden="true" className="size-2 rounded-full bg-success" />Libre à {heure}</span>
                                            <span className="inline-flex items-center gap-1.5"><span aria-hidden="true" className="size-2 rounded-full bg-destructive" />Occupé(e) : déjà un rendez-vous à {heure}</span>
                                        </p>
                                    )}
                                    {selection?.occupe && <p role="status" className="mt-2 rounded-lg bg-warning-soft px-3 py-2 text-sm text-warning-soft-foreground">{prenomDe(selection.nom)} a déjà un rendez-vous à {heure} ({selection.par}) : choisissez une personne libre pour pouvoir attribuer.</p>}
                                    {personnel.length > 0 && libres.length === 0 && <p role="alert" className="mt-2 text-sm text-destructive-soft-foreground">Tout le personnel est déjà occupé à {heure}. Déplacez ce rendez-vous à un autre créneau, ou libérez une personne.</p>}
                                </div>

                                {/* ---------- grille d'occupation ---------- */}
                                <div>
                                    <h3 className="mb-2 text-sm font-semibold text-foreground">Occupation du personnel — {jourLong(rdv.dateRdv)}</h3>
                                    <OccupationGrid data={occupation} surligne={heure} rdvId={rdv.id} />
                                    {peuDePersonnes && (
                                        <p className="mt-3 rounded-lg bg-muted px-3 py-2 text-xs leading-relaxed text-muted-foreground">
                                            Le cabinet accepte {occupation.capaciteParCreneau} rendez-vous à la fois alors qu’il compte {personnel.length} personnes : augmentez « Rendez-vous simultanés » dans{' '}
                                            {lienHoraires ? <Link to="/admin/planning" className="font-medium italic text-foreground underline underline-offset-2 hover:text-primary">Horaires et congés</Link> : <em>Horaires et congés</em>}{' '}
                                            pour que plusieurs personnes reçoivent en même temps.
                                        </p>
                                    )}
                                </div>
                            </>
                        )}

                        {error && <p role="alert" className="rounded-xl bg-destructive-soft px-3 py-2 text-sm text-destructive-soft-foreground">{error}</p>}

                        {/* ---------- pied ---------- */}
                        <div className="flex flex-wrap items-center justify-end gap-2">
                            {rdv.praticienId && <Button variant="ghost" size="md" onClick={() => valider(true)} disabled={saving} className="mr-auto text-muted-foreground">Ne plus attribuer</Button>}
                            <Button variant="outline" size="md" onClick={onClose}>Annuler</Button>
                            <Button size="md" onClick={() => valider(false)} disabled={saving || !selection || selection.occupe}>
                                {saving ? <Loader2 className="animate-spin" /> : <UserCheck />}
                                {selection ? `Attribuer à ${prenomDe(selection.nom)}` : 'Attribuer'}
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        </TooltipProvider>
    );
}
