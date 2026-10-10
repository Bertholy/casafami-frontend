import { AlertTriangle, BadgeCheck, CalendarClock, Check, UserCheck, X } from 'lucide-react';
import { STATUS, formatDateFr, hhmm } from '../../constants/app';
import { formatPhone } from '../../utils/phone';

const premiereMajuscule = texte => texte.charAt(0).toUpperCase() + texte.slice(1);

/**
 * « Demande à traiter » : ouverte par un clic sur une notification (?rdv=…). Elle met le rendez-vous concerné
 * en haut du tableau de bord, avec le bouton qui correspond à ce que la personne doit faire.
 */
export default function CarteDemande({ rdv, absent, estSuperAdmin, peutAccepter, peutConfirmer, onAccepter, onConfirmer, onAttribuer, onFermer }) {
    if (absent) {
        return (
            <div role="status" className="flex items-center justify-between gap-3 rounded-2xl border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-900 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-200">
                <span className="flex items-center gap-2"><AlertTriangle size={16} />Ce rendez-vous n’est plus disponible ou ne vous est plus attribué.</span>
                <button onClick={onFermer} aria-label="Fermer"><X size={16} /></button>
            </div>
        );
    }
    if (!rdv) return null;

    const statut = STATUS[rdv.statut] || STATUS.EN_ATTENTE;
    const enAttente = rdv.statut === 'EN_ATTENTE';
    let message; let action = null;
    if (estSuperAdmin) {
        if (enAttente && !rdv.praticienId) {
            message = 'Aucune personne n’est encore attribuée à ce rendez-vous.';
            action = <button onClick={onAttribuer} className="inline-flex items-center gap-2 rounded-xl bg-violet-700 px-4 py-2 text-sm font-semibold text-white hover:bg-violet-800"><UserCheck size={16} />Attribuer à une personne du personnel</button>;
        } else if (enAttente && !rdv.personnelConfirme) {
            message = `${rdv.praticienNom} n’a pas encore accepté ce rendez-vous.`;
            action = <button onClick={onAttribuer} className="inline-flex items-center gap-2 rounded-xl border border-slate-300 px-4 py-2 text-sm font-medium hover:bg-slate-50 dark:border-gray-600 dark:hover:bg-gray-800"><UserCheck size={16} />Changer de personne</button>;
        } else if (enAttente && peutConfirmer) {
            message = `${rdv.praticienNom || 'La personne attribuée'} a accepté ce rendez-vous : vous pouvez maintenant le confirmer (le patient recevra son SMS).`;
            action = <button onClick={onConfirmer} className="inline-flex items-center gap-2 rounded-xl bg-emerald-700 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-800"><BadgeCheck size={16} />Confirmer le rendez-vous</button>;
        } else if (rdv.statut === 'CONFIRME') message = `Rendez-vous confirmé${rdv.praticienNom ? `, pris par ${rdv.praticienNom}` : ''}.`;
        else message = `Ce rendez-vous est ${statut.label.toLowerCase()}.`;
    } else if (peutAccepter) {
        message = 'Ce rendez-vous vous est confié. Acceptez-le pour que le cabinet puisse le confirmer au patient.';
        action = <button onClick={onAccepter} className="inline-flex items-center gap-2 rounded-xl bg-emerald-700 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-800"><Check size={16} />Accepter ce rendez-vous</button>;
    } else if (rdv.personnelConfirme) {
        message = enAttente ? 'Vous avez accepté ce rendez-vous : le cabinet va le confirmer.' : `Rendez-vous ${statut.label.toLowerCase()}.`;
    } else {
        message = `Ce rendez-vous est ${statut.label.toLowerCase()}.`;
    }

    return (
        <section aria-label="Demande à traiter" className="rounded-2xl border-2 border-teal-400 bg-teal-50/60 p-5 shadow-sm dark:border-teal-500/50 dark:bg-teal-500/5">
            <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                    <p className="text-xs font-semibold uppercase tracking-wide text-teal-700 dark:text-teal-300">Demande à traiter</p>
                    <h2 className="mt-1 truncate text-lg font-bold">{rdv.nomClient}</h2>
                    <p className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-slate-600 dark:text-gray-300">
                        <span className="inline-flex items-center gap-1.5 font-medium"><CalendarClock size={15} />{premiereMajuscule(formatDateFr(rdv.dateRdv, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }))} à {hhmm(rdv.heureRdv)}</span>
                        <span>{formatPhone(rdv.telephoneClient)}</span>
                        {rdv.serviceNom && <span>{rdv.serviceNom}</span>}
                    </p>
                    {rdv.motif && <p className="mt-2 line-clamp-3 whitespace-pre-wrap text-sm text-slate-700 dark:text-gray-300">{rdv.motif}</p>}
                </div>
                <div className="flex shrink-0 items-center gap-2">
                    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${statut.badge}`}><span className={`h-1.5 w-1.5 rounded-full ${statut.dot}`} />{statut.label}</span>
                    <button onClick={onFermer} aria-label="Fermer cette demande" className="rounded-lg p-1.5 text-slate-500 hover:bg-white dark:hover:bg-gray-800"><X size={18} /></button>
                </div>
            </div>
            <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
                <p className="text-sm font-medium text-slate-800 dark:text-gray-100">{message}</p>
                {action}
            </div>
        </section>
    );
}
