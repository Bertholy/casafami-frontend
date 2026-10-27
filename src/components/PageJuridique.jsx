import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowUp, CalendarClock, ChevronRight, FileText } from 'lucide-react';
import Editable from './site/Editable';
import { useLang } from '../i18n/LangContext';

/**
 * Mise en page commune des pages juridiques (mentions légales, confidentialité).
 * `id` sert à rendre chaque texte modifiable par le super administrateur (mode édition) ; `sections` : [{ cle, titre, blocs }],
 * un bloc est un paragraphe (texte) ou une liste ({ liste: [texte, …] }). `Icone` : pictogramme du bandeau du haut.
 * Bandeau coloré (couleur du thème du site), sommaire collant à gauche qui suit la lecture, une carte par section.
 */
export default function PageJuridique({ id, titre, intro, misAJour, sections, autre, Icone = FileText }) {
    const { t } = useLang();
    const [active, setActive] = useState(sections[0]?.cle);

    // Le sommaire met en avant la section que la personne est en train de lire.
    useEffect(() => {
        const observateur = new IntersectionObserver(entrees => {
            const visible = entrees.filter(entree => entree.isIntersecting).sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)[0];
            if (visible) setActive(visible.target.id);
        }, { rootMargin: '-15% 0px -70% 0px' });
        sections.forEach(section => { const element = document.getElementById(section.cle); if (element) observateur.observe(element); });
        return () => observateur.disconnect();
    }, [sections]);

    return (
        <div className="px-4 pb-20 pt-10 sm:px-6 lg:px-8">
            <div className="mx-auto max-w-6xl">
                <nav aria-label={t("Fil d’Ariane")} className="mb-6 flex items-center gap-1.5 text-sm text-slate-500 dark:text-gray-400">
                    <Link to="/" className="hover:underline">{t("Accueil")}</Link><ChevronRight size={14} aria-hidden="true" /><span className="font-medium text-slate-800 dark:text-gray-100">{t(titre)}</span>
                </nav>

                {/* ========== BANDEAU ========== */}
                <header className="relative mb-10 overflow-hidden rounded-[2rem] px-7 py-10 text-white sm:px-12 sm:py-14 md:rounded-[2.5rem]" style={{ background: 'var(--mt-main-fort)' }}>
                    <div aria-hidden="true" className="pointer-events-none absolute -right-16 -top-16 h-64 w-64 rounded-full bg-white/10" />
                    <div aria-hidden="true" className="pointer-events-none absolute -bottom-24 right-24 h-48 w-48 rounded-full bg-white/5" />
                    <span className="relative mb-5 flex h-12 w-12 items-center justify-center rounded-full border-2 border-white/80"><Icone className="h-5 w-5" aria-hidden="true" /></span>
                    <Editable id={`legal.${id}.titre`} as="h1" className="relative mb-3 text-3xl font-extrabold md:text-5xl">{titre}</Editable>
                    <Editable id={`legal.${id}.intro`} as="p" className="relative max-w-3xl text-base leading-relaxed text-white/90 md:text-lg">{intro}</Editable>
                    <p className="relative mt-6 inline-flex items-center gap-2 rounded-full bg-white/15 px-4 py-1.5 text-xs font-bold uppercase tracking-wide"><CalendarClock className="h-4 w-4" aria-hidden="true" />{t("Dernière mise à jour")} : {misAJour}</p>
                </header>

                <div className="grid gap-8 lg:grid-cols-[17rem_minmax(0,1fr)] lg:items-start">
                    {/* ========== SOMMAIRE ========== */}
                    <nav aria-label={t("Sommaire")} className="rounded-2xl bg-white p-5 ring-1 ring-slate-200 lg:sticky lg:top-28 dark:bg-gray-800 dark:ring-gray-700">
                        <p className="mb-3 text-xs font-extrabold uppercase tracking-[0.18em] text-slate-500 dark:text-gray-400">{t("Sommaire")}</p>
                        <ol className="space-y-0.5 text-sm">
                            {sections.map((section, index) => {
                                const courante = active === section.cle;
                                return (
                                    <li key={section.cle}>
                                        <a href={`#${section.cle}`} aria-current={courante ? 'true' : undefined}
                                            className={`flex items-start gap-2.5 rounded-xl px-3 py-2 font-medium transition ${courante ? 'bg-teal-50 text-teal-800 dark:bg-gray-700 dark:text-teal-300' : 'text-slate-600 hover:bg-slate-50 hover:text-teal-700 dark:text-gray-300 dark:hover:bg-gray-700'}`}>
                                            <span className={`mt-px flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[11px] font-extrabold tabular-nums ${courante ? 'bg-teal-600 text-white' : 'bg-slate-100 text-slate-500 dark:bg-gray-700 dark:text-gray-400'}`}>{index + 1}</span>
                                            {t(section.titre)}
                                        </a>
                                    </li>
                                );
                            })}
                        </ol>
                    </nav>

                    {/* ========== SECTIONS ========== */}
                    <div className="space-y-5">
                        {sections.map((section, index) => (
                            <section key={section.cle} id={section.cle} className="scroll-mt-28 rounded-2xl bg-white p-6 ring-1 ring-slate-200 sm:p-8 dark:bg-gray-800 dark:ring-gray-700">
                                <h2 className="mb-4 flex items-center gap-3 text-xl font-extrabold md:text-2xl">
                                    <span aria-hidden="true" className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-teal-600 text-base font-extrabold text-white">{index + 1}</span>
                                    <Editable id={`legal.${id}.${section.cle}.titre`}>{section.titre}</Editable>
                                </h2>
                                <div className="space-y-3 text-[15px] leading-relaxed text-slate-700 dark:text-gray-300">
                                    {section.blocs.map((bloc, rang) => (typeof bloc === 'string'
                                        ? <Editable key={rang} id={`legal.${id}.${section.cle}.${rang}`} as="p">{bloc}</Editable>
                                        : (
                                            <ul key={rang} className="list-disc space-y-1.5 rounded-xl bg-slate-50 py-4 pl-9 pr-4 marker:text-teal-600 dark:bg-gray-900/50">
                                                {bloc.liste.map((element, i) => <Editable key={i} id={`legal.${id}.${section.cle}.${rang}.${i}`} as="li">{element}</Editable>)}
                                            </ul>
                                        )))}
                                </div>
                            </section>
                        ))}

                        <div className="flex flex-col items-start justify-between gap-4 rounded-2xl bg-slate-100 p-6 text-sm text-slate-700 sm:flex-row sm:items-center dark:bg-gray-800/70 dark:text-gray-300">
                            <p>{autre}</p>
                            <button type="button" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} className="inline-flex shrink-0 items-center gap-2 border-2 border-teal-600 px-4 py-2 text-xs font-extrabold uppercase tracking-wide text-teal-700 transition hover:bg-teal-600 hover:text-white dark:text-teal-300">
                                <ArrowUp className="h-4 w-4" aria-hidden="true" />{t("Haut de page")}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
