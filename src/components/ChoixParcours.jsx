import { Bot, User } from 'lucide-react';
import Editable from './site/Editable';
import { useLang } from '../i18n/LangContext';

// Même gabarit de bouton, texte en capitales, pour les deux panneaux (les coins sont arrondis par la règle commune des boutons).
const bouton = 'inline-flex items-center justify-center px-8 py-3 text-xs font-extrabold uppercase tracking-[0.14em] transition focus-visible:outline-2 focus-visible:outline-offset-2';

/**
 * Choix du parcours de réservation : une carte à deux panneaux, blanc (je remplis moi-même) et coloré (avec l'assistant).
 * `onChoisir('moi' | 'ia')` ouvre la page choisie. Les couleurs suivent le thème du site (« Couleurs du site »).
 */
export default function ChoixParcours({ onChoisir }) {
    const { t } = useLang();

    return (
        <section id="reservation" className="relative pb-24 pt-8">
            <div className="relative mx-auto max-w-4xl px-4">
                <div className="mb-10 text-center">
                    <Editable id="rdv.choix.titre" as="h2" className="mb-3 text-3xl font-extrabold text-slate-800 md:text-4xl dark:text-white">Comment voulez-vous prendre rendez-vous ?</Editable>
                    <Editable id="rdv.choix.texte" as="p" className="text-lg text-slate-600 dark:text-gray-300">Choisissez la façon la plus simple pour vous.</Editable>
                </div>

                <div className="grid overflow-hidden rounded-[2rem] bg-white md:grid-cols-2 md:rounded-[3.5rem] dark:bg-gray-800">
                    <article className="flex flex-col items-center px-8 py-12 text-center sm:px-12 md:py-16">
                        <span className="mb-6 flex h-11 w-11 items-center justify-center rounded-full border-2 border-teal-600 text-teal-700 dark:border-teal-400 dark:text-teal-300"><User className="h-5 w-5" /></span>
                        <h3 className="font-titre mb-4 text-balance text-3xl font-extrabold text-slate-700 dark:text-white">{t("Prendre rendez-vous moi-même")}</h3>
                        <p className="mb-9 max-w-xs flex-1 text-sm leading-relaxed text-slate-500 dark:text-gray-300">{t("Vous remplissez vous-même le formulaire : service, motif, date et heure.")}</p>
                        <button type="button" onClick={() => onChoisir('moi')} className={`${bouton} focus-visible:outline-teal-700`} style={{ background: 'var(--mt-bouton)', color: 'var(--mt-sur-bouton)' }}>{t("Prendre moi-même")}</button>
                    </article>

                    <article className="flex flex-col items-center px-8 py-12 text-center text-white sm:px-12 md:py-16" style={{ background: 'var(--mt-main-fort)' }}>
                        <span className="mb-6 flex h-11 w-11 items-center justify-center rounded-full border-2 border-white/80"><Bot className="h-5 w-5" /></span>
                        <h3 className="font-titre mb-4 text-balance text-3xl font-extrabold">{t("Par l’assistant")}</h3>
                        <p className="mb-9 max-w-xs flex-1 text-sm leading-relaxed text-white/90">{t("L’assistant vous guide pas à pas.")}</p>
                        <button type="button" onClick={() => onChoisir('ia')} className={`${bouton} border-2 border-white text-white hover:bg-white hover:text-(--mt-main-fort) focus-visible:outline-white`}>{t("Prendre rendez-vous avec l’assistant")}</button>
                    </article>
                </div>

                <p className="mt-6 text-center text-sm text-slate-600 dark:text-gray-400">{t("Dans les deux cas, vous pouvez modifier le motif avant de confirmer.")}</p>
            </div>
        </section>
    );
}
