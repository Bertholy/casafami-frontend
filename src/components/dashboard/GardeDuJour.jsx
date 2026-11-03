import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Moon, ShieldPlus, Sun } from 'lucide-react';
import axiosClient from '../../api/axiosClient';
import { peut } from '../../utils/auth';

const PERIODES = [{ code: 'JOUR', libelle: 'Jour', icone: Sun }, { code: 'NUIT', libelle: 'Nuit', icone: Moon }];

/**
 * « De garde aujourd'hui » : qui est de garde ce jour et cette nuit (tour de garde réglé par l'administration).
 * Ne s'affiche que pour ceux qui ont le droit de voir le tour de garde ; discret quand personne n'est de garde.
 */
export default function GardeDuJour({ className = '' }) {
    const autorise = peut('GARDE_VOIR');
    const [gardes, setGardes] = useState(null);

    useEffect(() => {
        if (!autorise) return undefined;
        let actif = true;
        axiosClient.get('/gardes/aujourdhui').then(({ data }) => { if (actif) setGardes(data.gardes || []); }).catch(() => { if (actif) setGardes([]); });
        return () => { actif = false; };
    }, [autorise]);

    if (!autorise || gardes === null) return null;
    const nomsDe = code => gardes.filter(g => g.periode === code).map(g => g.utilisateurNom);
    const jour = nomsDe('JOUR'), nuit = nomsDe('NUIT');
    // la même personne de garde jour et nuit (tour automatique) : une seule mention
    const periodesAffichees = jour.length > 0 && jour.join('|') === nuit.join('|')
        ? [{ code: 'JOUR_NUIT', libelle: 'Jour et nuit', icone: Sun, noms: jour }]
        : PERIODES.map(p => ({ ...p, noms: p.code === 'JOUR' ? jour : nuit }));
    return (
        <div className={`flex flex-wrap items-center gap-x-5 gap-y-2 rounded-xl border border-slate-200 px-4 py-3 text-sm dark:border-gray-700 ${className}`}>
            <span className="flex items-center gap-1.5 font-semibold"><ShieldPlus size={16} aria-hidden="true" className="text-teal-700 dark:text-teal-300" />De garde aujourd’hui</span>
            {periodesAffichees.map(({ code, libelle, icone: Icone, noms }) => {
                return (
                    <span key={code} className="flex items-center gap-1.5">
                        <Icone size={14} aria-hidden="true" className="text-slate-500 dark:text-gray-400" />
                        <span className="text-slate-500 dark:text-gray-400">{libelle} :</span>
                        <span className={noms.length ? 'font-medium' : 'text-slate-400 dark:text-gray-500'}>{noms.length ? noms.join(', ') : 'personne'}</span>
                    </span>
                );
            })}
            <Link to="/garde" className="ml-auto text-xs font-medium text-teal-700 underline-offset-2 hover:underline dark:text-teal-300">Voir le tour de garde</Link>
        </div>
    );
}
