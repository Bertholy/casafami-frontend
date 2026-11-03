import { CIVILITES, SEXES, civilitePourSexe, civiliteSelonAge, sexePourCivilite } from '../../utils/civilite';

/** Liste « Mr / Mme » : choisir une civilité choisit aussi le sexe (et inversement, le sexe choisi la sélectionne). */
export function SelectCivilite({ sexe, onChange, className }) {
    return (
        <select aria-label="Civilité" value={civilitePourSexe(sexe)} onChange={e => onChange(sexePourCivilite(e.target.value))} className={className}>
            <option value="">Choisir</option>
            {CIVILITES.map(c => <option key={c.valeur} value={c.valeur}>{c.valeur}</option>)}
        </select>
    );
}

/**
 * Choix du sexe (Homme / Femme) et catégorie calculée toute seule dès que l'âge est saisi : « Enfant » avant 12 ans, « Adolescent » de 12 à 17 ans, « Adulte » ensuite, avec « Mr » ou « Mme » selon le sexe.
 * Elle change dès que l'âge ou le sexe change ; il n'y a rien à saisir. `obligatoire` : pas de « Non précisé ».
 */
export default function ChoixSexe({ sexe, age, onChange, obligatoire = false, etiquette = 'Sexe', idEtiquette = 'choix-sexe', avecCivilite = true }) {
    const civilite = civiliteSelonAge(age, sexe);
    return (
        <div>
            <div className="text-sm font-medium" id={idEtiquette}>{etiquette}{obligatoire ? ' *' : ''}</div>
            <div className="mt-1.5 flex flex-wrap items-center gap-2">
                <div role="radiogroup" aria-labelledby={idEtiquette} className="inline-flex overflow-hidden rounded-xl border border-slate-200 dark:border-gray-700">
                    {SEXES.map(option => (
                        <button key={option.valeur} type="button" role="radio" aria-checked={sexe === option.valeur} onClick={() => onChange(sexe === option.valeur && !obligatoire ? '' : option.valeur)}
                            className={`px-4 py-2 text-sm font-medium transition ${sexe === option.valeur ? 'bg-teal-700 text-white' : 'bg-white hover:bg-slate-50 dark:bg-gray-950 dark:hover:bg-gray-800'}`}>{option.libelle}</button>
                    ))}
                </div>
                {avecCivilite && (<span aria-live="polite" title="Civilité calculée selon l’âge et le sexe" className={`inline-flex min-h-8 items-center rounded-full px-3 text-xs font-semibold ${civilite ? 'bg-teal-50 text-teal-800 dark:bg-teal-500/15 dark:text-teal-200' : 'bg-slate-100 text-slate-500 dark:bg-gray-800 dark:text-gray-400'}`}>
                    {civilite || 'Selon l’âge'}
                </span>)}
            </div>
        </div>
    );
}
