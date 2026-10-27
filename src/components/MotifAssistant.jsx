import { useEffect, useRef, useState } from 'react';
import { AlertTriangle, ArrowLeft, Bandage, Baby, Bot, Check, HeartPulse, Hospital, MessageCircle, Milk, Monitor, Pill, RotateCw, SendHorizonal, Sparkles, Search, Stethoscope, Syringe, TestTube, X } from 'lucide-react';

// Icône de chaque sujet (au trait fin, comme le reste du site) ; un sujet inconnu prend la bulle de discussion.
const ICONES = {
    grossesse: HeartPulse, echo: Monitor, planning: Pill, gyneco: Stethoscope, postpartum: Baby, accouchement: Hospital,
    vaccination: Syringe, bebe: Milk, general: Stethoscope, soins: Bandage, analyses: TestTube, autre: MessageCircle,
};
const IconeSujet = ({ id, className = 'h-4 w-4' }) => { const Icone = ICONES[id] || MessageCircle; return <Icone className={`shrink-0 ${className}`} aria-hidden="true" />; };
import { CATEGORIES, buildMotif, findRedFlags, getCategory, nextQuestion } from '../constants/motifFlows';
import { AIDE, analyserDemande, normaliser, propositions } from '../constants/motifRecherche';
import { useLang } from '../i18n/LangContext';
import { formatDateLongue } from '../i18n/traduire';

const bubbleBot = 'max-w-[85%] rounded-2xl rounded-tl-sm bg-slate-100 px-4 py-2.5 text-sm text-slate-800 dark:bg-gray-800 dark:text-gray-100';
const bubbleMe = 'ml-auto max-w-[85%] rounded-2xl rounded-tr-sm bg-teal-700 px-4 py-2.5 text-sm text-white';
const inputClass = 'w-full rounded-xl border-2 border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-800 outline-none focus:border-teal-500 dark:border-gray-700 dark:bg-gray-950 dark:text-white';

// Les réponses sont gardées en français (c'est ce que lit l'équipe soignante) ; seul l'affichage est traduit.
const display = (question, value, t, lang) => {
    if (value == null) return t('Je passe cette question');
    if (Array.isArray(value)) return value.map(v => t(v)).join(', ');
    if (question.type === 'date') return formatDateLongue(lang, value);
    return t(String(value));
};

/**
 * Assistant qui pose des questions adaptées au motif de la visite et prépare un motif précis (modifiable).
 * Fonctionne sans connexion à un service externe : les parcours sont définis dans constants/motifFlows.js.
 */
export default function MotifAssistant({ services = [], onApply, onClose }) {
    const { t, lang } = useLang();
    const [categoryId, setCategoryId] = useState(null);
    const [answers, setAnswers] = useState({});
    const [order, setOrder] = useState([]); // ids des questions déjà répondues, dans l'ordre
    const [draft, setDraft] = useState('');
    const [multi, setMulti] = useState([]);
    const [description, setDescription] = useState('');   // phrase libre du patient
    const [listeOuverte, setListeOuverte] = useState(false);  // liste complète des services, repliée quand un service est proposé
    const [analyse, setAnalyse] = useState(null);         // { texte, urgences, principal, alternatives, comprise }
    const bottom = useRef(null);

    const category = categoryId ? getCategory(categoryId) : null;
    const question = category ? nextQuestion(category, answers) : null;
    const finished = category && !question;
    const urgencesDecrites = analyse?.urgences || [];
    const flags = [...(category ? findRedFlags(category, answers) : []), ...urgencesDecrites];
    const motif = finished ? buildMotif(category, answers, analyse?.texte, urgencesDecrites) : '';

    // Service réel du cabinet qui correspond à un sujet (les noms viennent de la base : « Suivi de grossesse », « Vaccination »…)
    const serviceDe = id => {
        const mots = getCategory(id)?.service || [];
        return mots.length ? services.find(service => mots.some(mot => normaliser(service.nom).includes(mot))) || null : null;
    };
    const nomDuService = id => { const reel = serviceDe(id); return reel ? t(reel.nom) : t(getCategory(id)?.label || ''); };

    const chercher = texte => {
        const phrase = (texte ?? description).trim();
        if (phrase.length < 2) return;
        const resultat = analyserDemande(phrase);
        const { principal, alternatives } = propositions(resultat);
        setListeOuverte(false);
        setAnalyse({ texte: phrase, urgences: resultat.urgences, principal, alternatives, comprise: resultat.comprise });
    };
    const choisir = id => { setCategoryId(id); setAnswers({}); setOrder([]); setDraft(''); setMulti([]); };

    useEffect(() => { bottom.current?.scrollIntoView({ behavior: 'smooth', block: 'end' }); }, [order.length, categoryId, finished]);
    useEffect(() => {
        const onKey = event => { if (event.key === 'Escape') onClose(); };
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, [onClose]);

    const answer = value => {
        setAnswers(current => ({ ...current, [question.id]: value }));
        setOrder(current => [...current, question.id]);
        setDraft(''); setMulti([]);
    };
    const back = () => {
        if (!order.length) { setCategoryId(null); setAnswers({}); return; }
        const last = order[order.length - 1];
        setAnswers(current => { const { [last]: _removed, ...rest } = current; return rest; }); // eslint-disable-line no-unused-vars
        setOrder(current => current.slice(0, -1));
        setDraft(''); setMulti([]);
    };
    const restart = () => { setCategoryId(null); setAnswers({}); setOrder([]); setDraft(''); setMulti([]); setAnalyse(null); setDescription(''); };

    const toggleMulti = option => setMulti(current => {
        if (option.exclusive) return current.includes(option.label) ? [] : [option.label];
        const exclusive = category && question.options.filter(o => o.exclusive).map(o => o.label);
        const without = current.filter(label => !exclusive.includes(label));
        return without.includes(option.label) ? without.filter(label => label !== option.label) : [...without, option.label];
    });

    const suggestedService = category && category.service.length
        ? services.find(service => category.service.some(word => service.nom.toLocaleLowerCase('fr').includes(word))) || null
        : null;

    return (
        <div className="fixed inset-0 z-[90] flex items-end justify-center bg-slate-950/60 p-0 backdrop-blur-sm sm:items-center sm:p-4" onMouseDown={e => { if (e.target === e.currentTarget) onClose(); }}>
            <section role="dialog" aria-modal="true" aria-label={t("Assistant pour préciser votre motif")} className="flex max-h-[92vh] w-full max-w-xl flex-col overflow-hidden rounded-t-3xl bg-white shadow-2xl dark:bg-gray-900 sm:rounded-3xl">
                <header className="flex items-center gap-3 border-b border-slate-200 bg-linear-to-r from-teal-600 to-teal-700 px-5 py-4 text-white dark:border-gray-800">
                    <span className="flex h-10 w-10 items-center justify-center rounded-full bg-white/20"><Bot size={22} /></span>
                    <div className="min-w-0 flex-1">
                        <h2 className="font-bold leading-tight">{t("Assistant de rendez-vous")}</h2>
                        <p className="text-xs text-teal-100">{t("Quelques questions pour préparer votre consultation")}</p>
                    </div>
                    <button onClick={onClose} aria-label={t("Fermer l’assistant")} className="rounded-lg p-2 hover:bg-white/15"><X size={20} /></button>
                </header>

                <div className="flex-1 space-y-3 overflow-y-auto px-4 py-4" aria-live="polite">
                    <div className={bubbleBot}>
                        {t("Bonjour. Je vais vous poser quelques questions simples pour que la sage-femme ou le médecin prépare votre visite.")}
                        <span className="mt-1 block text-xs text-slate-500 dark:text-gray-400">{t("Je ne pose pas de diagnostic. En cas d’urgence, appelez le cabinet ou rendez-vous aux urgences sans attendre.")}</span>
                    </div>
                    <div className={bubbleBot}>{t("Quelle est la raison de votre visite ?")}</div>
                    {!analyse && <div className={bubbleBot}>{t("Décrivez-moi avec vos mots ce qui vous amène : je vous dirai quel service du cabinet vous convient.")}</div>}

                    {!category && !analyse && (
                        <div className="space-y-2">
                            <form onSubmit={e => { e.preventDefault(); chercher(); }} className="space-y-2">
                                <textarea value={description} onChange={e => setDescription(e.target.value)} rows={3} maxLength={500} autoFocus
                                    onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); chercher(); } }}
                                    aria-label={t("Décrivez ce qui vous amène")}
                                    placeholder={t("Ex. : j’ai de la fièvre et mal à la tête depuis hier / je suis enceinte de 3 mois / je veux faire vacciner mon bébé")} className={inputClass} />
                                <button disabled={description.trim().length < 2} className="inline-flex items-center gap-2 rounded-xl bg-teal-700 px-4 py-2 text-sm font-semibold text-white transition hover:bg-teal-800 disabled:opacity-40"><Search size={16} />{t("Trouver le bon service")}</button>
                            </form>
                            <div className="flex flex-wrap gap-2">
                                {["J’ai de la fièvre", "Je suis enceinte", "Vaccin pour mon bébé", "J’ai mal au ventre"].map(exemple => (
                                    <button key={exemple} type="button" onClick={() => { const phrase = t(exemple); setDescription(phrase); chercher(phrase); }}
                                        className="rounded-full border border-teal-300 bg-teal-50 px-3 py-1 text-xs font-medium text-teal-900 transition hover:bg-teal-100 dark:border-teal-700 dark:bg-teal-500/10 dark:text-teal-100">{t(exemple)}</button>
                                ))}
                            </div>
                        </div>
                    )}

                    {analyse && <div className={bubbleMe}>{analyse.texte}</div>}

                    {analyse && !category && analyse.urgences.length > 0 && (
                        <div role="alert" className="flex gap-3 rounded-2xl border-2 border-rose-300 bg-rose-50 p-4 text-sm text-rose-900 dark:border-rose-500/40 dark:bg-rose-500/10 dark:text-rose-100">
                            <AlertTriangle className="mt-0.5 shrink-0" size={20} />
                            <div>
                                <p className="font-bold">{t("Ces signes demandent une prise en charge rapide")}</p>
                                <ul className="mt-1 list-disc pl-5">{analyse.urgences.map(flag => <li key={flag}>{t(flag)}</li>)}</ul>
                                <p className="mt-2">{t("N’attendez pas un rendez-vous :")} <strong>{t("appelez le cabinet maintenant (urgences 24h/24)")}</strong> {t("ou rendez-vous au centre de santé / aux urgences le plus proche. Vous pouvez tout de même réserver ci-dessous : votre demande sera marquée comme prioritaire.")}</p>
                            </div>
                        </div>
                    )}

                    {analyse && !category && (analyse.principal ? (
                        <div className="space-y-3">
                            <div className={bubbleBot}>
                                {t("D’après ce que vous décrivez, le service le plus adapté est :")}
                                <strong className="mt-1 flex items-center gap-2 text-base text-teal-800 dark:text-teal-300"><IconeSujet id={analyse.principal.id} className="h-5 w-5" />{nomDuService(analyse.principal.id)}</strong>
                                <span className="mt-1 block text-xs text-slate-600 dark:text-gray-300">{t(AIDE[analyse.principal.id])}</span>
                                <span className="mt-2 block text-xs text-slate-500 dark:text-gray-400">{t("Ce choix ne remplace pas l’avis d’un soignant : l’équipe confirmera le service lors de la confirmation de votre rendez-vous.")}</span>
                            </div>
                            <div className="flex flex-wrap gap-2">
                                <button onClick={() => choisir(analyse.principal.id)} className="inline-flex items-center gap-2 rounded-xl bg-teal-700 px-4 py-2 text-sm font-semibold text-white transition hover:bg-teal-800"><Check size={16} />{t("Oui, c’est bien ça : continuer")}</button>
                                <button onClick={() => setAnalyse(null)} className="rounded-xl border border-slate-300 px-4 py-2 text-sm text-slate-600 hover:bg-slate-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800">{t("Reformuler")}</button>
                            </div>
                            {analyse.alternatives.length > 0 && (
                                <div className="space-y-2">
                                    <div className={bubbleBot}>{t("Cela pourrait aussi correspondre à :")}</div>
                                    <div className="flex flex-wrap gap-2">
                                        {analyse.alternatives.map(a => (
                                            <button key={a.id} onClick={() => choisir(a.id)} className="rounded-xl border-2 border-teal-200 bg-white px-3 py-2 text-left text-sm font-medium text-teal-900 transition hover:border-teal-500 hover:bg-teal-50 dark:border-teal-800 dark:bg-gray-950 dark:text-teal-100 dark:hover:bg-gray-800">
                                                <span className="flex items-center gap-1.5"><IconeSujet id={a.id} />{nomDuService(a.id)}</span><span className="block text-xs font-normal text-slate-500 dark:text-gray-400">{t(AIDE[a.id])}</span>
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="space-y-3">
                            <div className={bubbleBot}>{t("Je n’ai pas bien compris. Choisissez le sujet le plus proche dans la liste ci-dessous : je vous poserai quelques questions.")}</div>
                            <button onClick={() => setAnalyse(null)} className="rounded-xl border border-slate-300 px-4 py-2 text-sm text-slate-600 hover:bg-slate-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800">{t("Reformuler")}</button>
                        </div>
                    ))}

                    {!category && analyse?.principal && !listeOuverte && (
                        <button onClick={() => setListeOuverte(true)} className="text-sm font-medium text-teal-700 underline-offset-2 hover:underline dark:text-teal-300">{t("Voir tous les services et à quoi ils servent")}</button>
                    )}

                    {!category && (!analyse?.principal || listeOuverte) && (
                        <div className="space-y-2">
                            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-gray-400">{t("Ou choisissez directement un sujet :")}</p>
                            <div className="grid gap-2 sm:grid-cols-2">
                            {CATEGORIES.map(c => (
                                <button key={c.id} onClick={() => choisir(c.id)} className="flex items-center gap-2 rounded-xl border-2 border-slate-200 bg-white px-3 py-2.5 text-left text-sm font-medium transition hover:border-teal-500 hover:bg-teal-50 dark:border-gray-700 dark:bg-gray-950 dark:text-white dark:hover:bg-gray-800">
                                    <span className="flex h-9 w-9 shrink-0 items-center justify-center text-teal-700 dark:text-teal-300"><IconeSujet id={c.id} className="h-5 w-5" /></span><span className="min-w-0"><span className="block">{t(c.label)}</span><span className="block text-xs font-normal text-slate-500 dark:text-gray-400">{t(AIDE[c.id])}</span></span>
                                </button>
                            ))}
                            </div>
                        </div>
                    )}

                    {category && <div className={`${bubbleMe} inline-flex items-center gap-2`}><IconeSujet id={category.id} />{t(category.label)}</div>}

                    {category && order.map(id => {
                        const q = category.questions.find(item => item.id === id);
                        return (
                            <div key={id} className="space-y-3">
                                <div className={bubbleBot}>{t(q.text)}</div>
                                <div className={bubbleMe}>{display(q, answers[id], t, lang)}</div>
                            </div>
                        );
                    })}

                    {question && (
                        <div className="space-y-3">
                            <div className={bubbleBot}>{t(question.text)}</div>

                            {question.type === 'choice' && (
                                <div className="flex flex-wrap gap-2">
                                    {question.options.map(option => (
                                        <button key={option.label} onClick={() => answer(option.label)} className="rounded-xl border-2 border-teal-200 bg-white px-3 py-2 text-left text-sm font-medium text-teal-900 transition hover:border-teal-500 hover:bg-teal-50 dark:border-teal-800 dark:bg-gray-950 dark:text-teal-100 dark:hover:bg-gray-800">{t(option.label)}</button>
                                    ))}
                                </div>
                            )}

                            {question.type === 'yesno' && (
                                <div className="flex flex-wrap gap-2">
                                    {(question.options || ['Oui', 'Non']).map(label => (
                                        <button key={label} onClick={() => answer(label)} className="rounded-xl border-2 border-teal-200 bg-white px-5 py-2 text-sm font-semibold text-teal-900 transition hover:border-teal-500 hover:bg-teal-50 dark:border-teal-800 dark:bg-gray-950 dark:text-teal-100 dark:hover:bg-gray-800">{t(label)}</button>
                                    ))}
                                </div>
                            )}

                            {question.type === 'multi' && (
                                <div className="space-y-2">
                                    {question.options.map(option => (
                                        <label key={option.label} className={`flex cursor-pointer items-start gap-3 rounded-xl border-2 px-3 py-2 text-sm transition ${multi.includes(option.label) ? 'border-teal-500 bg-teal-50 dark:bg-teal-500/10' : 'border-slate-200 dark:border-gray-700'}`}>
                                            <input type="checkbox" checked={multi.includes(option.label)} onChange={() => toggleMulti(option)} className="mt-0.5 h-4 w-4 accent-teal-700" />
                                            <span className="text-slate-800 dark:text-gray-100">{t(option.label)}</span>
                                        </label>
                                    ))}
                                    <button onClick={() => answer(multi)} disabled={!multi.length} className="inline-flex items-center gap-2 rounded-xl bg-teal-700 px-4 py-2 text-sm font-semibold text-white transition hover:bg-teal-800 disabled:opacity-40"><Check size={16} />{t("Valider")}</button>
                                </div>
                            )}

                            {(question.type === 'text' || question.type === 'number' || question.type === 'date') && (
                                <form onSubmit={e => { e.preventDefault(); if (draft.trim()) answer(draft.trim()); }} className="space-y-2">
                                    {question.multiline
                                        ? <textarea value={draft} onChange={e => setDraft(e.target.value)} maxLength={500} rows={3} placeholder={question.placeholder ? t(question.placeholder) : undefined} className={inputClass} />
                                        : <input value={draft} onChange={e => setDraft(e.target.value)} type={question.type === 'text' ? 'text' : question.type} min={question.min} max={question.max}
                                            maxLength={question.type === 'text' ? 200 : undefined} placeholder={question.placeholder ? t(question.placeholder) : undefined} className={inputClass} />}
                                    <div className="flex flex-wrap gap-2">
                                        <button disabled={!draft.trim()} className="inline-flex items-center gap-2 rounded-xl bg-teal-700 px-4 py-2 text-sm font-semibold text-white transition hover:bg-teal-800 disabled:opacity-40"><SendHorizonal size={16} />{t("Valider")}</button>
                                        {question.optional && <button type="button" onClick={() => answer(null)} className="rounded-xl border border-slate-300 px-4 py-2 text-sm text-slate-600 hover:bg-slate-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800">{t("Passer")}</button>}
                                    </div>
                                </form>
                            )}
                            {question.type === 'choice' && question.optional && (
                                <button onClick={() => answer(null)} className="rounded-xl border border-slate-300 px-4 py-2 text-sm text-slate-600 hover:bg-slate-50 dark:border-gray-700 dark:text-gray-300">{t("Passer")}</button>
                            )}
                        </div>
                    )}

                    {finished && (
                        <div className="space-y-3">
                            {flags.length > 0 && (
                                <div role="alert" className="flex gap-3 rounded-2xl border-2 border-rose-300 bg-rose-50 p-4 text-sm text-rose-900 dark:border-rose-500/40 dark:bg-rose-500/10 dark:text-rose-100">
                                    <AlertTriangle className="mt-0.5 shrink-0" size={20} />
                                    <div>
                                        <p className="font-bold">{t("Ces signes demandent une prise en charge rapide")}</p>
                                        <ul className="mt-1 list-disc pl-5">{[...new Set(flags)].map(flag => <li key={flag}>{t(flag)}</li>)}</ul>
                                        <p className="mt-2">{t("N’attendez pas un rendez-vous :")} <strong>{t("appelez le cabinet maintenant (urgences 24h/24)")}</strong> {t("ou rendez-vous au centre de santé / aux urgences le plus proche. Vous pouvez tout de même réserver ci-dessous : votre demande sera marquée comme prioritaire.")}</p>
                                    </div>
                                </div>
                            )}
                            <div className={bubbleBot}>{t("Merci ! Voici le motif préparé pour votre rendez-vous. Vous pourrez le modifier avant de confirmer.")}</div>
                            <pre className="whitespace-pre-wrap rounded-2xl border border-slate-200 bg-slate-50 p-4 font-sans text-sm text-slate-800 dark:border-gray-700 dark:bg-gray-950 dark:text-gray-100">{motif}</pre>
                            {suggestedService && <p className="flex items-center gap-2 text-sm text-teal-800 dark:text-teal-300"><Sparkles size={16} />{t("Service suggéré :")} <strong>{suggestedService.nom}</strong></p>}
                            <div className="flex flex-wrap gap-2">
                                <button onClick={() => onApply({ motif, serviceId: suggestedService?.id ?? null })} className="inline-flex items-center gap-2 rounded-xl bg-teal-700 px-5 py-2.5 text-sm font-bold text-white transition hover:bg-teal-800"><Check size={17} />{t("Utiliser ce motif")}</button>
                                <button onClick={restart} className="inline-flex items-center gap-2 rounded-xl border border-slate-300 px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50 dark:border-gray-700 dark:text-gray-200 dark:hover:bg-gray-800"><RotateCw size={16} />{t("Recommencer")}</button>
                            </div>
                        </div>
                    )}
                    <div ref={bottom} />
                </div>

                {category && (
                    <footer className="flex items-center justify-between border-t border-slate-200 px-4 py-3 text-sm dark:border-gray-800">
                        <button onClick={back} className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-slate-600 hover:bg-slate-100 dark:text-gray-300 dark:hover:bg-gray-800"><ArrowLeft size={16} />{t("Retour")}</button>
                        <span className="text-xs text-slate-400">{order.length} {order.length > 1 ? t("réponses") : t("réponse")}</span>
                    </footer>
                )}
            </section>
        </div>
    );
}
