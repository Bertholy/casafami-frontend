import { useEffect, useState } from 'react';
import axiosClient from '../api/axiosClient';
import { peut } from '../utils/auth';
import { formatPhone } from '../utils/phone';

const jourCourt = iso => (iso ? new Date(`${iso}T12:00:00`).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' }) : '');
const passages = n => `${n} passage${n > 1 ? 's' : ''}`;

// Une couleur et un texte par état : vert = patient existant, rouge = nouveau patient, ambre = ressemble à un patient connu, gris = pas encore assez tapé.
const ETATS = {
    EXISTANT: { led: 'bg-emerald-500', halo: 'bg-emerald-400', anneau: 'animate-ping', texte: 'text-emerald-700 dark:text-emerald-300', fond: 'bg-emerald-50 dark:bg-emerald-500/10', titre: 'Patient existant' },
    NOUVEAU: { led: 'bg-rose-500', halo: 'bg-rose-400', anneau: 'animate-ping', texte: 'text-rose-700 dark:text-rose-300', fond: 'bg-rose-50 dark:bg-rose-500/10', titre: 'Nouveau patient' },
    PROCHE: { led: 'bg-amber-500', halo: 'bg-amber-400', anneau: 'animate-pulse', texte: 'text-amber-800 dark:text-amber-300', fond: 'bg-amber-50 dark:bg-amber-500/10', titre: 'Ressemble à un patient connu' },
    INCONNU: { led: 'bg-slate-300 dark:bg-gray-600', halo: '', anneau: '', texte: 'text-slate-500 dark:text-gray-400', fond: '', titre: 'Tapez le nom du patient' },
};

/**
 * Voyant « patient existant ou nouveau ? », réservé au personnel (jamais montré au patient) : pendant que la secrétaire tape le nom (et le numéro),
 * une petite lumière s'allume. Verte et qui palpite : le patient est déjà venu. Rouge : personne ne porte ce nom, c'est un nouveau patient.
 * Ambre : un nom ou un numéro ressemble, avec la liste des patients proches (un clic remplit le formulaire avec eux).
 * `onChoisir({ nom, telephone })` : appelé quand on choisit un patient proche ; sans lui, la liste est seulement informative.
 * Ne s'affiche que pour qui a le droit de rechercher un patient.
 */
export default function VoyantPatient({ nom, telephone, onChoisir, className = '' }) {
    const autorise = peut('PATIENTS_RECHERCHER');
    const [resultat, setResultat] = useState(null);
    const terme = (nom || '').trim();
    const chiffres = String(telephone || '').replace(/\D/g, '');
    const assez = terme.length >= 3 || chiffres.length >= 9;

    useEffect(() => {
        if (!autorise || !assez) return undefined;
        let actif = true;
        const minuteur = window.setTimeout(() => {
            axiosClient.get('/patients/verification', { params: { nom: terme, telephone: chiffres.length >= 9 ? telephone : undefined } })
                .then(({ data }) => { if (actif) setResultat(data); })
                .catch(() => { if (actif) setResultat(null); });
        }, 350);
        return () => { actif = false; window.clearTimeout(minuteur); };
    }, [autorise, assez, terme, chiffres, telephone]);

    if (!autorise) return null;
    const statut = assez && resultat ? resultat.statut : 'INCONNU';
    const etat = ETATS[statut] || ETATS.INCONNU;
    const liste = assez && resultat ? resultat.correspondances : [];
    const premier = liste[0];

    let detail = '';
    if (statut === 'EXISTANT' && premier) detail = `${passages(premier.passages)}${premier.dernierPassage ? ` · dernier le ${jourCourt(premier.dernierPassage)}` : ''}`;
    else if (statut === 'NOUVEAU') detail = 'Aucun patient de ce nom n’est encore venu au cabinet.';
    else if (statut === 'PROCHE') detail = 'Vérifiez s’il s’agit d’une de ces personnes :';

    return (
        <div className={`${className}`} aria-live="polite">
            <p className={`flex flex-wrap items-center gap-x-2 gap-y-0.5 rounded-lg px-2.5 py-1.5 text-xs ${etat.fond} ${etat.texte}`} data-statut={statut}>
                <span className="relative flex h-2.5 w-2.5 shrink-0" aria-hidden="true">
                    {etat.anneau && <span className={`absolute inline-flex h-full w-full rounded-full opacity-60 motion-reduce:animate-none ${etat.halo} ${etat.anneau}`} />}
                    <span className={`relative inline-flex h-2.5 w-2.5 rounded-full ${etat.led}`} />
                </span>
                <strong className="font-semibold">{etat.titre}</strong>
                {detail && <span className="opacity-90">{detail}</span>}
            </p>
            {statut === 'PROCHE' && liste.length > 0 && (
                <ul className="mt-1.5 space-y-1">
                    {liste.map((patient, i) => (
                        <li key={`${patient.nom}-${patient.telephone}-${i}`}>
                            <button type="button" disabled={!onChoisir} onClick={() => onChoisir?.({ nom: patient.nom, telephone: patient.telephone })}
                                className="flex w-full items-center justify-between gap-3 rounded-md border border-amber-200 bg-white px-2.5 py-1.5 text-left text-xs transition enabled:hover:bg-amber-50 dark:border-amber-500/30 dark:bg-gray-900 dark:enabled:hover:bg-amber-500/10">
                                <span className="min-w-0 truncate font-medium text-slate-800 dark:text-gray-100">{patient.nom}</span>
                                <span className="shrink-0 tabular-nums text-slate-500 dark:text-gray-400">{formatPhone(patient.telephone)} · {passages(patient.passages)}</span>
                            </button>
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
}
