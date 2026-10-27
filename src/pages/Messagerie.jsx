import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { SkeletonList } from '../components/ui/skeleton';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowLeft, Loader2, MessageSquare, Search, Send } from 'lucide-react';
import axiosClient, { assetUrl } from '../api/axiosClient';
import AdminLayout from '../components/AdminLayout';
import Notice from '../components/Notice';
import { getRoleLabel } from '../constants/app';
import { card, inputClass } from '../constants/ui';
import { apiErrorMessage, hasSession, LOGIN_PATH } from '../utils/auth';

const heure = iso => new Date(iso).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
const jour = iso => new Date(iso).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' });
const courte = iso => {
    const d = new Date(iso);
    return d.toDateString() === new Date().toDateString() ? heure(iso) : d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
};

function Avatar({ contact, taille = 'h-10 w-10' }) {
    const initiales = (contact.nom || '?').split(/\s+/).slice(0, 2).map(m => m[0]?.toUpperCase()).join('');
    return contact.photoUrl
        ? <img src={assetUrl(contact.photoUrl)} alt="" className={`${taille} shrink-0 rounded-full object-cover`} />
        : <span className={`${taille} flex shrink-0 items-center justify-center rounded-full bg-teal-100 text-sm font-semibold text-teal-800 dark:bg-teal-500/15 dark:text-teal-300`}>{initiales}</span>;
}

/** Messagerie interne : conversations privées entre membres du personnel. */
export default function Messagerie() {
    const navigate = useNavigate();
    const [params, setParams] = useSearchParams();
    const avec = params.get('avec');
    const [contacts, setContacts] = useState([]);
    const [recherche, setRecherche] = useState('');
    const [conv, setConv] = useState(null);
    const [texte, setTexte] = useState('');
    const [envoi, setEnvoi] = useState(false);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(true);
    const fin = useRef(null);

    const chargerContacts = useCallback(async () => {
        try { const { data } = await axiosClient.get('/messagerie/contacts'); setContacts(data.contacts || []); }
        catch (err) { setError(apiErrorMessage(err, 'Impossible de charger la messagerie.')); }
        finally { setLoading(false); }
    }, []);

    const chargerConversation = useCallback(async () => {
        if (!avec) return;
        try {
            const { data } = await axiosClient.get(`/messagerie/conversation/${avec}`);
            setConv(data);
            window.dispatchEvent(new Event('casafami:messages'));
        } catch (err) { setError(apiErrorMessage(err, 'Impossible d’ouvrir cette conversation.')); }
    }, [avec]);

    useEffect(() => {
        if (!hasSession()) { navigate(LOGIN_PATH); return undefined; }
        const premier = window.setTimeout(chargerContacts, 0);
        const intervalle = window.setInterval(() => { if (document.visibilityState === 'visible') chargerContacts(); }, 10000);
        return () => { window.clearTimeout(premier); window.clearInterval(intervalle); };
    }, [chargerContacts, navigate]);

    useEffect(() => {
        if (!avec) return undefined;
        const premier = window.setTimeout(chargerConversation, 0);
        const intervalle = window.setInterval(() => { if (document.visibilityState === 'visible') chargerConversation(); }, 5000);
        return () => { window.clearTimeout(premier); window.clearInterval(intervalle); };
    }, [avec, chargerConversation]);

    const nombre = conv && String(conv.contact.id) === avec ? conv.messages.length : 0;
    useEffect(() => { fin.current?.scrollIntoView({ block: 'end' }); }, [nombre, avec]);

    const envoyer = async () => {
        const contenu = texte.trim();
        if (!contenu || envoi || !avec) return;
        setEnvoi(true); setError('');
        try {
            const { data } = await axiosClient.post(`/messagerie/conversation/${avec}`, { contenu });
            setConv(c => (c && String(c.contact.id) === avec ? { ...c, messages: [...c.messages, data] } : c));
            setTexte('');
            chargerContacts();
        } catch (err) { setError(apiErrorMessage(err, 'Le message n’a pas pu être envoyé.')); }
        finally { setEnvoi(false); }
    };

    const filtres = useMemo(() => {
        const q = recherche.trim().toLocaleLowerCase('fr');
        return q ? contacts.filter(c => c.nom.toLocaleLowerCase('fr').includes(q)) : contacts;
    }, [contacts, recherche]);
    const courant = contacts.find(c => String(c.id) === avec) || (conv && String(conv.contact.id) === avec ? conv.contact : null);
    const messages = conv && String(conv.contact.id) === avec ? conv.messages : null;

    return (
        <AdminLayout title="Messagerie" subtitle="Échangez en privé avec vos collègues">
            <Notice tone="error" onClose={() => setError('')}>{error}</Notice>
            <div className={`${card} grid min-h-[34rem] overflow-hidden md:grid-cols-[19rem_1fr]`} style={{ height: 'calc(100vh - 14rem)' }}>
                {/* Liste des collègues */}
                <aside className={`${avec ? 'hidden md:flex' : 'flex'} min-h-0 flex-col border-b border-slate-200 md:border-b-0 md:border-r dark:border-gray-800`}>
                    <div className="border-b border-slate-200 p-3 dark:border-gray-800">
                        <div className="relative">
                            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                            <input value={recherche} onChange={e => setRecherche(e.target.value)} placeholder="Chercher un collègue" aria-label="Chercher un collègue" className={`${inputClass} pl-9`} />
                        </div>
                    </div>
                    <ul className="min-h-0 flex-1 overflow-y-auto">
                        {loading && <li><SkeletonList rows={5} /></li>}
                        {!loading && filtres.length === 0 && <li className="p-6 text-center text-sm text-slate-500">Aucun collègue trouvé.</li>}
                        {filtres.map(c => (
                            <li key={c.id}>
                                <button onClick={() => setParams({ avec: String(c.id) })} aria-label={`Conversation avec ${c.nom}`}
                                    className={`flex w-full items-center gap-3 px-3 py-3 text-left transition hover:bg-slate-50 dark:hover:bg-gray-800 ${String(c.id) === avec ? 'bg-teal-50 dark:bg-teal-500/10' : ''}`}>
                                    <Avatar contact={c} />
                                    <span className="min-w-0 flex-1">
                                        <span className="flex items-baseline justify-between gap-2">
                                            <span className={`truncate text-sm ${c.nonLus ? 'font-bold' : 'font-medium'}`}>{c.nom}</span>
                                            {c.dernier && <span className="shrink-0 text-[11px] text-slate-400">{courte(c.dernier.date)}</span>}
                                        </span>
                                        <span className="flex items-center justify-between gap-2">
                                            <span className={`truncate text-xs ${c.nonLus ? 'font-semibold text-slate-700 dark:text-gray-200' : 'text-slate-500 dark:text-gray-400'}`}>
                                                {c.dernier ? `${c.dernier.moi ? 'Vous : ' : ''}${c.dernier.extrait}` : getRoleLabel(c.role)}
                                            </span>
                                            {c.nonLus > 0 && <span className="flex h-5 min-w-5 shrink-0 items-center justify-center rounded-full bg-teal-600 px-1 text-[11px] font-bold text-white">{c.nonLus}</span>}
                                        </span>
                                    </span>
                                </button>
                            </li>
                        ))}
                    </ul>
                </aside>

                {/* Conversation */}
                <section className={`${avec ? 'flex' : 'hidden md:flex'} min-h-0 flex-col`}>
                    {!avec || !courant ? (
                        <div className="flex flex-1 flex-col items-center justify-center gap-3 p-8 text-center text-slate-500 dark:text-gray-400">
                            <MessageSquare size={34} className="text-slate-300" />
                            <p className="text-sm">Choisissez un collègue pour commencer une conversation.</p>
                        </div>
                    ) : (
                        <>
                            <header className="flex items-center gap-3 border-b border-slate-200 px-4 py-3 dark:border-gray-800">
                                <button onClick={() => setParams({})} aria-label="Retour aux conversations" className="rounded-lg p-1.5 hover:bg-slate-100 md:hidden dark:hover:bg-gray-800"><ArrowLeft size={18} /></button>
                                <Avatar contact={courant} />
                                <div className="min-w-0"><p className="truncate text-sm font-semibold">{courant.nom}</p><p className="text-xs text-slate-500 dark:text-gray-400">{getRoleLabel(courant.role)}</p></div>
                            </header>
                            <div className="min-h-0 flex-1 space-y-1 overflow-y-auto bg-slate-50/60 px-4 py-4 dark:bg-gray-950/40" aria-live="polite">
                                {!messages && <SkeletonList rows={4} />}
                                {messages && messages.length === 0 && <p className="p-6 text-center text-sm text-slate-500">Aucun message. Écrivez le premier ci-dessous.</p>}
                                {messages && messages.map((m, i) => (
                                    <div key={m.id}>
                                        {(i === 0 || jour(messages[i - 1].creeLe) !== jour(m.creeLe)) && <p className="my-3 text-center text-[11px] font-medium capitalize text-slate-400">{jour(m.creeLe)}</p>}
                                        <div className={`flex ${m.deMoi ? 'justify-end' : 'justify-start'}`}>
                                            <div className={`max-w-[80%] whitespace-pre-wrap break-words rounded-2xl px-3.5 py-2 text-sm shadow-sm ${m.deMoi ? 'rounded-br-md bg-teal-700 text-white' : 'rounded-bl-md border border-slate-200 bg-white dark:border-gray-700 dark:bg-gray-800'}`}>
                                                {m.contenu}
                                                <span className={`mt-0.5 block text-right text-[10px] ${m.deMoi ? 'text-teal-100' : 'text-slate-400'}`}>{heure(m.creeLe)}{m.deMoi && (m.lu ? ' · lu' : '')}</span>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                                <div ref={fin} />
                            </div>
                            <form onSubmit={e => { e.preventDefault(); envoyer(); }} className="flex items-end gap-2 border-t border-slate-200 p-3 dark:border-gray-800">
                                <textarea value={texte} onChange={e => setTexte(e.target.value)} rows={1} maxLength={2000} placeholder="Écrire un message…" aria-label="Votre message"
                                    onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); envoyer(); } }}
                                    className={`${inputClass} max-h-32 min-h-[2.75rem] resize-none`} />
                                <button type="submit" disabled={envoi || !texte.trim()} aria-label="Envoyer"
                                    className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-teal-700 text-white transition hover:bg-teal-800 disabled:opacity-50">
                                    {envoi ? <Loader2 size={17} className="animate-spin" /> : <Send size={17} />}
                                </button>
                            </form>
                        </>
                    )}
                </section>
            </div>
        </AdminLayout>
    );
}
