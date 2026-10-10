import { useEffect, useState } from 'react';
import axiosClient from '../api/axiosClient';

const DAYS = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];
const FULL_DAYS = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche'];

/** « 08:30:00 » → « 8h30 », « 14:00 » → « 14h ». */
export function formatHour(value) {
    if (!value) return '';
    const [h, m] = String(value).split(':');
    return `${Number(h)}h${m && m !== '00' ? m : ''}`;
}

const range = (start, end) => (start && end ? `${formatHour(start)} - ${formatHour(end)}` : null);

/**
 * Regroupe les jours consécutifs qui ont les mêmes horaires : « Lun - Ven : 8h - 11h / 14h - 17h ».
 * Les horaires viennent de la configuration du planning (page « Horaires et congés » du super administrateur).
 */
export function summarizeHours(horaires = []) {
    const open = [...horaires].sort((a, b) => a.jourSemaine - b.jourSemaine).filter(h => h.ouvert);
    const groups = [];
    for (const day of open) {
        const matin = range(day.matinDebut, day.matinFin);
        const apresMidi = range(day.apresMidiDebut, day.apresMidiFin);
        const last = groups[groups.length - 1];
        if (last && last.matin === matin && last.apresMidi === apresMidi && last.to === day.jourSemaine - 1) last.to = day.jourSemaine;
        else groups.push({ from: day.jourSemaine, to: day.jourSemaine, matin, apresMidi });
    }
    return groups.map(g => ({
        label: g.from === g.to ? FULL_DAYS[g.from - 1] : `${DAYS[g.from - 1]} - ${DAYS[g.to - 1]}`,
        matin: g.matin,
        apresMidi: g.apresMidi,
        global: g.matin && g.apresMidi ? `${g.matin.split(' - ')[0]} - ${g.apresMidi.split(' - ')[1]}` : (g.matin || g.apresMidi),
    }));
}

let cache = null;
/** Planning public (horaires + jours fermés), chargé une seule fois par visite. */
export function usePlanning() {
    const [planning, setPlanning] = useState(cache);
    useEffect(() => {
        if (cache) return undefined;
        let cancelled = false;
        axiosClient.get('/planning').then(({ data }) => { cache = data; if (!cancelled) setPlanning(data); }).catch(() => {});
        return () => { cancelled = true; };
    }, []);
    return planning;
}

export const resetPlanningCache = () => { cache = null; };

/** Explique à l'utilisateur pourquoi une journée n'a aucun créneau à proposer. */
export function explainNoSlots(dateIso, planning, today) {
    if (!dateIso) return '';
    const ferme = planning?.joursFermes?.find(j => j.date === dateIso);
    if (ferme) return `Le cabinet est fermé ce jour-là${ferme.motif ? ` (${ferme.motif})` : ''}.`;
    const jour = ((new Date(`${dateIso}T12:00:00`).getDay() + 6) % 7) + 1;
    const horaire = planning?.horaires?.find(h => h.jourSemaine === jour);
    if (horaire && !horaire.ouvert) return `Le cabinet est fermé le ${FULL_DAYS[jour - 1].toLowerCase()}.`;
    if (dateIso === today) return 'Il ne reste plus de créneau disponible aujourd’hui.';
    return 'Tous les créneaux de ce jour sont déjà pris.';
}

/** « Ouvert tous les jours », « Ouvert du lundi au vendredi »… d'après le planning réel du cabinet. */
export function libelleOuverture(horaires) {
    if (!horaires?.length) return 'Choisissez la date de votre rendez-vous';
    const ouverts = horaires.filter(h => h.ouvert).sort((a, b) => a.jourSemaine - b.jourSemaine).map(h => h.jourSemaine);
    if (ouverts.length === 7) return 'Ouvert tous les jours';
    if (ouverts.length === 0) return 'Cabinet actuellement fermé';
    const consecutifs = ouverts.every((jour, i) => i === 0 || jour === ouverts[i - 1] + 1);
    if (consecutifs && ouverts.length > 1) return `Ouvert du ${FULL_DAYS[ouverts[0] - 1].toLowerCase()} au ${FULL_DAYS[ouverts[ouverts.length - 1] - 1].toLowerCase()}`;
    return `Ouvert : ${ouverts.map(jour => FULL_DAYS[jour - 1].toLowerCase()).join(', ')}`;
}
