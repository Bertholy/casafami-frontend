import { useCallback, useEffect, useState } from 'react';
import axiosClient from '../api/axiosClient';

const REFRESH_MS = 20000;

/**
 * Créneaux encore libres d'une journée (et, si précisé, d'un praticien).
 * La liste est toujours « vivante » : elle se met à jour toutes les 20 secondes, quand l'onglet reprend le focus,
 * et à la demande (refresh) — par exemple juste après un refus « créneau déjà pris ». Un créneau réservé par quelqu'un
 * d'autre disparaît donc de l'affichage, il ne reste que ceux qui sont réellement libres.
 */
export function useAvailableSlots(date, praticienId = '') {
    const key = date ? `${date}|${praticienId || ''}` : '';
    const [state, setState] = useState({ key: '', slots: [], error: false });
    const [tick, setTick] = useState(0);

    useEffect(() => {
        if (!date) return undefined;
        let cancelled = false;
        const load = () => {
            axiosClient.get('/rdv/creneaux', { params: { date, ...(praticienId ? { praticienId } : {}) } })
                .then(({ data }) => { if (!cancelled) setState({ key, slots: data.map(value => String(value).slice(0, 5)), error: false }); })
                .catch(() => { if (!cancelled) setState({ key, slots: [], error: true }); });
        };
        const first = window.setTimeout(load, 0);
        const interval = window.setInterval(load, REFRESH_MS);
        const onVisible = () => { if (document.visibilityState === 'visible') load(); };
        window.addEventListener('focus', load);
        document.addEventListener('visibilitychange', onVisible);
        return () => {
            cancelled = true;
            window.clearTimeout(first); window.clearInterval(interval);
            window.removeEventListener('focus', load);
            document.removeEventListener('visibilitychange', onVisible);
        };
    }, [date, praticienId, key, tick]);

    const refresh = useCallback(() => setTick(value => value + 1), []);
    const ready = state.key === key;
    return { slots: ready ? state.slots : [], loading: Boolean(key) && !ready, error: ready && state.error, refresh };
}
