import { useEffect, useRef, useState } from 'react';
import { AlertTriangle, ArrowLeft, Bot, Check, RotateCcw, SendHorizonal, Sparkles, X } from 'lucide-react';
import { CATEGORIES, buildMotif, findRedFlags, getCategory, nextQuestion } from '../constants/motifFlows';

const bubbleBot = 'max-w-[85%] rounded-2xl rounded-tl-sm bg-slate-100 px-4 py-2.5 text-sm text-slate-800 dark:bg-gray-800 dark:text-gray-100';
const bubbleMe = 'ml-auto max-w-[85%] rounded-2xl rounded-tr-sm bg-teal-700 px-4 py-2.5 text-sm text-white';
const inputClass = 'w-full rounded-xl border-2 border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-800 outline-none focus:border-teal-500 dark:border-gray-700 dark:bg-gray-950 dark:text-white';

const display = (question, value) => {
    if (value == null) return 'Je passe cette question';
    if (Array.isArray(value)) return value.join(', ');
    if (question.type === 'date') return new Date(`${value}T12:00:00`).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });
    return String(value);
};

/**
 * Assistant qui pose des questions adaptées au motif de la visite et prépare un motif précis (modifiable).
 * Fonctionne sans connexion à un service externe : les parcours sont définis dans constants/motifFlows.js.
 */
export default function MotifAssistant({ services = [], onApply, onClose }) {
    const [categoryId, setCategoryId] = useState(null);
    const [answers, setAnswers] = useState({});
    const [order, setOrder] = useState([]); // ids des questions déjà répondues, dans l'ordre
    const [draft, setDraft] = useState('');
    const [multi, setMulti] = useState([]);
    const bottom = useRef(null);

    const category = categoryId ? getCategory(categoryId) : null;
    const question = category ? nextQuestion(category, answers) : null;
    const finished = category && !question;
    const flags = category ? findRedFlags(category, answers) : [];
    const motif = finished ? buildMotif(category, answers) : '';

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
    const restart = () => { setCategoryId(null); setAnswers({}); setOrder([]); setDraft(''); setMulti([]); };

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
            <section role="dialog" aria-modal="true" aria-label="Assistant pour préciser votre motif" className="flex max-h-[92vh] w-full max-w-xl flex-col overflow-hidden rounded-t-3xl bg-white shadow-2xl dark:bg-gray-900 sm:rounded-3xl">
                <header className="flex items-center gap-3 border-b border-slate-200 bg-gradient-to-r from-teal-600 to-teal-700 px-5 py-4 text-white dark:border-gray-800">
                    <span className="flex h-10 w-10 items-center justify-center rounded-full bg-white/20"><Bot size={22} /></span>
                    <div className="min-w-0 flex-1">
                        <h2 className="font-bold leading-tight">Assistant de rendez-vous</h2>
                        <p className="text-xs text-teal-100">Quelques questions pour préparer votre consultation</p>
                    </div>
                    <button onClick={onClose} aria-label="Fermer l’assistant" className="rounded-lg p-2 hover:bg-white/15"><X size={20} /></button>
                </header>

                <div className="flex-1 space-y-3 overflow-y-auto px-4 py-4" aria-live="polite">
                    <div className={bubbleBot}>
                        Bonjour 👋 Je vais vous poser quelques questions simples pour que la sage-femme ou le médecin prépare votre visite.
                        <span className="mt-1 block text-xs text-slate-500 dark:text-gray-400">Je ne pose pas de diagnostic. En cas d’urgence, appelez le cabinet ou rendez-vous aux urgences sans attendre.</span>
                    </div>
                    <div className={bubbleBot}>Quelle est la raison de votre visite ?</div>

                    {!category && (
                        <div className="grid gap-2 sm:grid-cols-2">
                            {CATEGORIES.map(c => (
                                <button key={c.id} onClick={() => setCategoryId(c.id)} className="flex items-center gap-2 rounded-xl border-2 border-slate-200 bg-white px-3 py-2.5 text-left text-sm font-medium transition hover:border-teal-500 hover:bg-teal-50 dark:border-gray-700 dark:bg-gray-950 dark:text-white dark:hover:bg-gray-800">
                                    <span aria-hidden="true" className="text-lg">{c.emoji}</span>{c.label}
                                </button>
                            ))}
                        </div>
                    )}

                    {category && <div className={bubbleMe}>{category.emoji} {category.label}</div>}

                    {category && order.map(id => {
                        const q = category.questions.find(item => item.id === id);
                        return (
                            <div key={id} className="space-y-3">
                                <div className={bubbleBot}>{q.text}</div>
                                <div className={bubbleMe}>{display(q, answers[id])}</div>
                            </div>
                        );
                    })}

                    {question && (
                        <div className="space-y-3">
                            <div className={bubbleBot}>{question.text}</div>

                            {question.type === 'choice' && (
                                <div className="flex flex-wrap gap-2">
                                    {question.options.map(option => (
                                        <button key={option.label} onClick={() => answer(option.label)} className="rounded-xl border-2 border-teal-200 bg-white px-3 py-2 text-left text-sm font-medium text-teal-900 transition hover:border-teal-500 hover:bg-teal-50 dark:border-teal-800 dark:bg-gray-950 dark:text-teal-100 dark:hover:bg-gray-800">{option.label}</button>
                                    ))}
                                </div>
                            )}

                            {question.type === 'yesno' && (
                                <div className="flex flex-wrap gap-2">
                                    {(question.options || ['Oui', 'Non']).map(label => (
                                        <button key={label} onClick={() => answer(label)} className="rounded-xl border-2 border-teal-200 bg-white px-5 py-2 text-sm font-semibold text-teal-900 transition hover:border-teal-500 hover:bg-teal-50 dark:border-teal-800 dark:bg-gray-950 dark:text-teal-100 dark:hover:bg-gray-800">{label}</button>
                                    ))}
                                </div>
                            )}

                            {question.type === 'multi' && (
                                <div className="space-y-2">
                                    {question.options.map(option => (
                                        <label key={option.label} className={`flex cursor-pointer items-start gap-3 rounded-xl border-2 px-3 py-2 text-sm transition ${multi.includes(option.label) ? 'border-teal-500 bg-teal-50 dark:bg-teal-500/10' : 'border-slate-200 dark:border-gray-700'}`}>
                                            <input type="checkbox" checked={multi.includes(option.label)} onChange={() => toggleMulti(option)} className="mt-0.5 h-4 w-4 accent-teal-700" />
                                            <span className="text-slate-800 dark:text-gray-100">{option.label}</span>
                                        </label>
                                    ))}
                                    <button onClick={() => answer(multi)} disabled={!multi.length} className="inline-flex items-center gap-2 rounded-xl bg-teal-700 px-4 py-2 text-sm font-semibold text-white transition hover:bg-teal-800 disabled:opacity-40"><Check size={16} />Valider</button>
                                </div>
                            )}

                            {(question.type === 'text' || question.type === 'number' || question.type === 'date') && (
                                <form onSubmit={e => { e.preventDefault(); if (draft.trim()) answer(draft.trim()); }} className="space-y-2">
                                    {question.multiline
                                        ? <textarea value={draft} onChange={e => setDraft(e.target.value)} maxLength={500} rows={3} placeholder={question.placeholder} className={inputClass} />
                                        : <input value={draft} onChange={e => setDraft(e.target.value)} type={question.type === 'text' ? 'text' : question.type} min={question.min} max={question.max}
                                            maxLength={question.type === 'text' ? 200 : undefined} placeholder={question.placeholder} className={inputClass} />}
                                    <div className="flex flex-wrap gap-2">
                                        <button disabled={!draft.trim()} className="inline-flex items-center gap-2 rounded-xl bg-teal-700 px-4 py-2 text-sm font-semibold text-white transition hover:bg-teal-800 disabled:opacity-40"><SendHorizonal size={16} />Valider</button>
                                        {question.optional && <button type="button" onClick={() => answer(null)} className="rounded-xl border border-slate-300 px-4 py-2 text-sm text-slate-600 hover:bg-slate-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800">Passer</button>}
                                    </div>
                                </form>
                            )}
                            {question.type === 'choice' && question.optional && (
                                <button onClick={() => answer(null)} className="rounded-xl border border-slate-300 px-4 py-2 text-sm text-slate-600 hover:bg-slate-50 dark:border-gray-700 dark:text-gray-300">Passer</button>
                            )}
                        </div>
                    )}

                    {finished && (
                        <div className="space-y-3">
                            {flags.length > 0 && (
                                <div role="alert" className="flex gap-3 rounded-2xl border-2 border-rose-300 bg-rose-50 p-4 text-sm text-rose-900 dark:border-rose-500/40 dark:bg-rose-500/10 dark:text-rose-100">
                                    <AlertTriangle className="mt-0.5 shrink-0" size={20} />
                                    <div>
                                        <p className="font-bold">Ces signes demandent une prise en charge rapide</p>
                                        <ul className="mt-1 list-disc pl-5">{[...new Set(flags)].map(flag => <li key={flag}>{flag}</li>)}</ul>
                                        <p className="mt-2">N’attendez pas un rendez-vous : <strong>appelez le cabinet maintenant (urgences 24h/24)</strong> ou rendez-vous au centre de santé / aux urgences le plus proche. Vous pouvez tout de même réserver ci-dessous : votre demande sera marquée comme prioritaire.</p>
                                    </div>
                                </div>
                            )}
                            <div className={bubbleBot}>Merci ! Voici le motif préparé pour votre rendez-vous. Vous pourrez le modifier avant de confirmer.</div>
                            <pre className="whitespace-pre-wrap rounded-2xl border border-slate-200 bg-slate-50 p-4 font-sans text-sm text-slate-800 dark:border-gray-700 dark:bg-gray-950 dark:text-gray-100">{motif}</pre>
                            {suggestedService && <p className="flex items-center gap-2 text-sm text-teal-800 dark:text-teal-300"><Sparkles size={16} />Service suggéré : <strong>{suggestedService.nom}</strong></p>}
                            <div className="flex flex-wrap gap-2">
                                <button onClick={() => onApply({ motif, serviceId: suggestedService?.id ?? null })} className="inline-flex items-center gap-2 rounded-xl bg-teal-700 px-5 py-2.5 text-sm font-bold text-white transition hover:bg-teal-800"><Check size={17} />Utiliser ce motif</button>
                                <button onClick={restart} className="inline-flex items-center gap-2 rounded-xl border border-slate-300 px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50 dark:border-gray-700 dark:text-gray-200 dark:hover:bg-gray-800"><RotateCcw size={16} />Recommencer</button>
                            </div>
                        </div>
                    )}
                    <div ref={bottom} />
                </div>

                {category && (
                    <footer className="flex items-center justify-between border-t border-slate-200 px-4 py-3 text-sm dark:border-gray-800">
                        <button onClick={back} className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-slate-600 hover:bg-slate-100 dark:text-gray-300 dark:hover:bg-gray-800"><ArrowLeft size={16} />Retour</button>
                        <span className="text-xs text-slate-400">{order.length} réponse{order.length > 1 ? 's' : ''}</span>
                    </footer>
                )}
            </section>
        </div>
    );
}
