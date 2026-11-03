import { useCallback, useEffect, useRef, useState } from 'react';
import { Moon, ShieldPlus, Sun } from 'lucide-react';
import axiosClient from '../../api/axiosClient';
import { formatDateFr } from '../../constants/app';
import { getEmail, peut } from '../../utils/auth';

// « Ne me rappelez pas » : mémorisé sur l'appareil pour toute la journée de garde.
const cleRappel = (email, jour) => `garde-message-${email}-${jour}`;
const refuseLeRappel = cle => { try { return localStorage.getItem(cle) === '1'; } catch { return false; } };
const memoriserRefus = cle => { try { localStorage.setItem(cle, '1'); } catch { /* stockage indisponible : le message pourra réapparaître */ } };
// « OK » : ferme le message pour cette ouverture du compte seulement (onglet en cours) ; il revient à la prochaine connexion. La clé est effacée à la déconnexion et à la connexion.
const CLE_OK = 'garde-message-ok';
const okDonne = jour => { try { return sessionStorage.getItem(CLE_OK) === jour; } catch { return false; } };
const memoriserOk = jour => { try { sessionStorage.setItem(CLE_OK, jour); } catch { /* stockage indisponible : le message pourra réapparaître d'une page à l'autre */ } };

const MOTS = ['Vous', 'êtes', 'de', 'garde', 'aujourd’hui !'];

/**
 * Message en plein écran pour la personne de garde : le jour où elle est de garde, il s'affiche à l'ouverture de son espace,
 * avec une animation et les polices de l'accueil du site (Luckiest Guy pour le titre, Montserrat pour le reste). Il revient à chaque ouverture du compte :
 * « OK » le ferme jusqu'à la prochaine connexion, « Ne me rappelez pas » le supprime pour le reste de la journée de garde.
 * Il ne s'affiche que si le serveur dit que la personne connectée est de garde (réponse « moi » de /gardes/aujourdhui).
 */
export default function MessageDeGarde({ nom }) {
    const autorise = peut('GARDE_VOIR');
    const [garde, setGarde] = useState(null);      // { jour, periodes } quand la personne est de garde et n'a pas encore fermé le message
    const bouton = useRef(null);

    useEffect(() => {
        if (!autorise) return undefined;
        let actif = true;
        axiosClient.get('/gardes/aujourdhui').then(({ data }) => {
            if (!actif || !Array.isArray(data.moi) || data.moi.length === 0) return;
            if (refuseLeRappel(cleRappel(getEmail(), data.date)) || okDonne(data.date)) return;
            setGarde({ jour: data.date, periodes: data.moi });
        }).catch(() => {});
        return () => { actif = false; };
    }, [autorise]);

    const ok = useCallback(() => {
        if (garde) memoriserOk(garde.jour);
        setGarde(null);
    }, [garde]);
    const nePlusRappeler = () => {
        if (garde) memoriserRefus(cleRappel(getEmail(), garde.jour));
        setGarde(null);
    };

    useEffect(() => {
        if (!garde) return undefined;
        const touche = event => { if (event.key === 'Escape') ok(); };
        window.addEventListener('keydown', touche);
        const focus = window.setTimeout(() => bouton.current?.focus(), 900);
        return () => { window.removeEventListener('keydown', touche); window.clearTimeout(focus); };
    }, [garde, ok]);

    if (!garde) return null;
    const jour = garde.periodes.includes('JOUR'), nuit = garde.periodes.includes('NUIT');
    const periode = jour && nuit ? 'Jour et nuit · 24 h' : nuit ? 'De nuit' : 'De jour';
    const prenom = (nom || '').trim().split(/\s+/)[0];
    return (
        <div className="garde-ecran" role="dialog" aria-modal="true" aria-labelledby="garde-titre">
            <span className="garde-bulle garde-bulle-1" aria-hidden="true" />
            <span className="garde-bulle garde-bulle-2" aria-hidden="true" />
            <span className="garde-bulle garde-bulle-3" aria-hidden="true" />
            <div className="garde-contenu">
                <div className="garde-icone" aria-hidden="true">
                    <span className="garde-anneau" /><span className="garde-anneau garde-anneau-2" />
                    <ShieldPlus size={58} strokeWidth={1.8} />
                </div>
                <p className="garde-surtitre" style={{ '--i': 0 }}>{prenom ? `Bonjour ${prenom}` : 'Bonjour'} · {formatDateFr(garde.jour, { weekday: 'long', day: 'numeric', month: 'long' })}</p>
                <h2 id="garde-titre" className="garde-titre">
                    {MOTS.map((mot, i) => <span key={mot} className="garde-mot" style={{ '--i': i + 1 }}>{mot}</span>)}
                </h2>
                <p className="garde-periode" style={{ '--i': MOTS.length + 2 }}>
                    {jour && <Sun size={22} className="garde-soleil" aria-hidden="true" />}
                    {nuit && <Moon size={22} className="garde-lune" aria-hidden="true" />}
                    <span>{periode}</span>
                </p>
                <p className="garde-texte" style={{ '--i': MOTS.length + 3 }}>Merci pour votre engagement. Gardez votre téléphone près de vous et soyez joignable par le cabinet pendant toute votre garde.</p>
                <div className="garde-actions" style={{ '--i': MOTS.length + 4 }}>
                    <button ref={bouton} type="button" onClick={ok} className="garde-bouton">OK</button>
                    <button type="button" onClick={nePlusRappeler} className="garde-bouton garde-bouton-discret" title="Le message ne s’affichera plus aujourd’hui">Ne me rappelez pas</button>
                </div>
            </div>
        </div>
    );
}
