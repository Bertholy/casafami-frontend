import { Fragment, useRef, useState } from 'react';
import { useLang } from '../i18n/LangContext';

// Une case par élément de la date : le téléphone ouvre le clavier des chiffres, et on passe tout seul à la case suivante.
// Les trois cases restent sur une seule ligne, même sur un petit écran (`part` : place relative de chaque case).
const CASES = [
    { nom: 'jour', libelle: 'Jour', exemple: 'JJ', longueur: 2, part: 'flex-1' },
    { nom: 'mois', libelle: 'Mois', exemple: 'MM', longueur: 2, part: 'flex-1' },
    { nom: 'annee', libelle: 'Année', exemple: 'AAAA', longueur: 4, part: 'flex-[1.7]' },
];

const bouton = actif => `min-h-11 rounded-md border px-6 py-2 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background ${actif
    ? 'border-primary bg-primary text-primary-foreground'
    : 'border-input bg-background text-foreground hover:bg-accent'}`;

// Cases à partir d'une date ISO : au retour de l'assistant, la date déjà choisie réapparaît dans les cases.
const depuisISO = iso => (/^\d{4}-\d{2}-\d{2}$/.test(iso || '')
    ? { jour: iso.slice(8, 10), mois: iso.slice(5, 7), annee: iso.slice(0, 4) }
    : { jour: '', mois: '', annee: '' });

// Date ISO (aaaa-mm-jj) si les trois cases donnent un jour qui existe (ni 31/02, ni mois 13), sinon null.
function enDateISO({ jour, mois, annee }) {
    if (!jour || !mois || annee.length !== 4) return null;
    const j = Number(jour);
    const m = Number(mois);
    const a = Number(annee);
    const date = new Date(Date.UTC(a, m - 1, j));
    if (date.getUTCFullYear() !== a || date.getUTCMonth() !== m - 1 || date.getUTCDate() !== j) return null;
    return date.toISOString().slice(0, 10);
}

function CasesDate({ prefixe, valeur, min, onChange }) {
    const { t } = useLang();
    const [valeurs, setValeurs] = useState(() => depuisISO(valeur));
    const cases = useRef({});

    const complet = Boolean(valeurs.jour && valeurs.mois && valeurs.annee.length === 4);
    const date = enDateISO(valeurs);
    const erreur = complet ? (!date ? t("Date invalide") : date < min ? t("Date passée") : '') : '';

    const saisir = (index, brut) => {
        const { nom, longueur } = CASES[index];
        let chiffres = brut.replace(/\D/g, '').slice(0, longueur);
        // Un 5 ne peut être que le jour (ou le mois) 05 : on complète et on passe à la case suivante.
        if (chiffres.length === 1 && ((nom === 'jour' && Number(chiffres) > 3) || (nom === 'mois' && Number(chiffres) > 1))) chiffres = `0${chiffres}`;
        const suivantes = { ...valeurs, [nom]: chiffres };
        setValeurs(suivantes);
        const saisie = enDateISO(suivantes);
        onChange(saisie && saisie >= min ? saisie : '');
        if (chiffres.length === longueur && index < CASES.length - 1) cases.current[CASES[index + 1].nom]?.focus();
    };

    // Effacer dans une case vide ramène à la case d'avant.
    const reculer = (index, event) => {
        if (event.key === 'Backspace' && !valeurs[CASES[index].nom] && index > 0) cases.current[CASES[index - 1].nom]?.focus();
    };

    return (
        <div className="mt-4 rounded-lg border border-border bg-muted p-4">
            <div className="flex w-full max-w-xs items-end gap-2">
                {CASES.map((c, i) => (
                    <Fragment key={c.nom}>
                        {i > 0 && <span aria-hidden="true" className="pb-3 text-2xl font-semibold text-muted-foreground">/</span>}
                        <div className={`min-w-0 ${c.part}`}>
                            <label htmlFor={`${prefixe}-${c.nom}`} className="mb-1 block text-xs font-medium text-muted-foreground">{t(c.libelle)}</label>
                            <input
                                id={`${prefixe}-${c.nom}`}
                                ref={element => { cases.current[c.nom] = element; }}
                                type="text"
                                inputMode="numeric"
                                autoComplete="off"
                                maxLength={c.longueur}
                                value={valeurs[c.nom]}
                                onChange={event => saisir(i, event.target.value)}
                                onKeyDown={event => reculer(i, event)}
                                placeholder={c.exemple}
                                aria-invalid={Boolean(erreur)}
                                autoFocus={i === 0 && !valeur}
                                className="w-full rounded-md border border-input bg-background px-1 py-3 text-center text-xl font-semibold tabular-nums text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background aria-invalid:border-destructive"
                            />
                        </div>
                    </Fragment>
                ))}
            </div>
            {erreur && <p role="alert" className="mt-3 text-sm font-medium text-destructive">{erreur}</p>}
        </div>
    );
}

/**
 * « Une autre date ? » : Oui ou Non. Avec Oui, une barre de cases jour / mois / année remplace le calendrier du navigateur.
 * `onChange(iso)` reçoit la date complète et valable (jamais avant `min`), sinon une chaîne vide.
 * `prefixe` distingue les identifiants quand deux saisies sont affichées en même temps (formulaire et petite IA).
 */
export default function AutreDate({ ouvert, onBascule, valeur, min, onChange, prefixe = 'date' }) {
    const { t } = useLang();

    return (
        <div>
            <div className="flex flex-wrap items-center gap-3">
                <span id={`question-${prefixe}`} className="text-sm font-medium text-foreground">{t("Une autre date ?")}</span>
                <div role="group" aria-labelledby={`question-${prefixe}`} className="flex gap-2">
                    <button type="button" aria-pressed={ouvert} onClick={() => { if (!ouvert) onBascule(true); }} className={bouton(ouvert)}>{t("Oui")}</button>
                    <button type="button" aria-pressed={!ouvert} onClick={() => { if (ouvert) onBascule(false); }} className={bouton(!ouvert)}>{t("Non")}</button>
                </div>
            </div>
            {ouvert && <CasesDate prefixe={prefixe} valeur={valeur} min={min} onChange={onChange} />}
        </div>
    );
}
