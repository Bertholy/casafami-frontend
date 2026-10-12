import { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';

/**
 * Champ « mot de passe » avec un œil pour afficher / masquer ce qui est saisi (pour vérifier qu'on n'a pas fait de faute).
 * Il reçoit les mêmes propriétés qu'un <input> ; les marges (mt-*, mb-*…) vont sur l'enveloppe pour que l'œil reste centré.
 */
export default function ChampMotDePasse({ className = '', ...props }) {
    const [visible, setVisible] = useState(false);
    const classes = className.split(/\s+/).filter(Boolean);
    const marges = classes.filter(c => /^m[tbxy]?-/.test(c) || /^-m/.test(c));
    const champ = classes.filter(c => !marges.includes(c) && !/^pr-/.test(c));
    if (!champ.some(c => /^w-/.test(c))) champ.push('w-full');   // le champ remplit toujours son enveloppe : l'œil reste dans la case
    return (
        <span className={`relative block ${marges.join(' ')}`}>
            <input {...props} type={visible ? 'text' : 'password'} className={`${champ.join(' ')} pr-11`} />
            <button type="button" onClick={() => setVisible(v => !v)} aria-pressed={visible} tabIndex={0}
                aria-label={visible ? 'Masquer le mot de passe' : 'Afficher le mot de passe'} title={visible ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
                className="absolute inset-y-0 right-0 flex w-11 items-center justify-center text-slate-400 transition hover:text-slate-700 focus-visible:text-slate-700 dark:text-gray-400 dark:hover:text-gray-200">
                {visible ? <EyeOff size={18} aria-hidden="true" /> : <Eye size={18} aria-hidden="true" />}
            </button>
        </span>
    );
}
