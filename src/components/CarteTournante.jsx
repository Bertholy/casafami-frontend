import { useState } from 'react';

/**
 * Carte qui se retourne : la face avant (photo et titre) donne la taille de la carte, le dos montre la description.
 * Elle tourne au survol (ordinateur), au toucher (téléphone, tablette : un second toucher la remet à l'endroit) et dès qu'on y arrive
 * au clavier. Le style est dans index.css (.carte-tourne). Avec « plate », les deux faces s'affichent l'une sous l'autre, sans rotation
 * (utilisé pendant la modification du site, pour que chaque texte reste facile à atteindre).
 * « focusable » : mettre false quand le dos contient déjà un bouton ou un lien (c'est lui qu'on atteint alors au clavier).
 */
export default function CarteTournante({ avant, arriere, label, className = '', plate = false, focusable = true }) {
    const [retourne, setRetourne] = useState(false);
    // sur un appareil qui sait « survoler », la carte tourne toute seule ; sinon un toucher la retourne
    const basculer = () => { if (!window.matchMedia?.('(hover: hover)').matches) setRetourne(valeur => !valeur); };

    if (plate) return <div className={className}>{avant}{arriere}</div>;
    return (
        <div role="group" aria-label={label} tabIndex={focusable ? 0 : undefined} className={`carte-tourne ${retourne ? 'est-retournee' : ''} ${className}`}
            onClick={event => { if (!event.target.closest('button, a')) basculer(); }}
            onKeyDown={event => { if (event.target === event.currentTarget && (event.key === 'Enter' || event.key === ' ')) { event.preventDefault(); basculer(); } }}>
            <div className="carte-tourne__inner">
                <div className="carte-tourne__face carte-tourne__avant">{avant}</div>
                <div className="carte-tourne__face carte-tourne__dos">{arriere}</div>
            </div>
        </div>
    );
}
