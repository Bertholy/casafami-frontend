import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { Send, Trash2, X } from 'lucide-react';
import { useLang } from '../../i18n/LangContext';
import { useIndexSite } from '../../utils/indexSite';
import { usePlanning } from '../../utils/horaires';
import { detecterIntention, repondre, salutation } from '../../utils/casaAI';
import { avancer, demarrer } from '../../utils/reservationChat';
import { formatPhoneInput } from '../../utils/phone';
import { todayISO } from '../../constants/app';
import MascotteCasaAI from './MascotteCasaAI';

/**
 * Fenêtre de discussion de CASA'AI, l'assistant IA de casafami. Les réponses viennent de utils/casaAI.js (règles + contenu du site) : aucun service externe.
 * La personne peut aussi y prendre un rendez-vous (utils/reservationChat.js : mêmes créneaux et mêmes règles que la page « Prendre rendez-vous »).
 * Le composant reste monté une fois ouvert, la conversation est donc gardée quand on ferme le panneau ou qu'on change de page ; elle n'est jamais
 * enregistrée, et l'icône corbeille l'efface (y compris le nom et le téléphone saisis pour un rendez-vous).
 * Transparence : l'en-tête annonce « Assistant IA » (badge IA) et un message dit que c'est une IA qui peut se tromper.
 */
export default function PanneauChat({ visible, onFermer }) {
    const { t, lang } = useLang();
    const cerveau = useIndexSite();
    const planning = usePlanning();
    const contexte = useRef(null);
    const fil = useRef(null);
    const champ = useRef(null);
    const minuteries = useRef([]);
    const compteur = useRef(4);
    const [saisie, setSaisie] = useState('');
    const [ecrit, setEcrit] = useState(false);
    const [occupe, setOccupe] = useState(false);
    const [messages, setMessages] = useState([]);
    const [rdv, setRdv] = useState(null);                       // réservation en cours (null = aucune)
    const [interaction, setInteraction] = useState({ choix: [], champ: 'texte' });
    const [epoque, setEpoque] = useState(0);                    // change quand on efface la conversation : la présentation est rejouée
    const [confirmerEffacer, setConfirmerEffacer] = useState(false);

    // le « cerveau » (services chargés, horaires, langue) est relu au moment de répondre
    useEffect(() => { contexte.current = { ...cerveau, t, lang, planning }; });
    useEffect(() => () => minuteries.current.forEach(window.clearTimeout), []);

    // Présentation : plusieurs bulles qui arrivent l'une après l'autre (avec les trois points « écrit… » entre chaque) :
    // salutation de l'heure, présentation, transparence sur l'IA (elle peut se tromper ; on peut demander une personne), puis la question.
    useEffect(() => {
        const accueil = [
            { id: 1, texte: salutation(t), grand: true },
            { id: 2, texte: t("Je suis CASA'AI, l’assistant IA de casafami. Je connais tout ce qui concerne le site : services, rendez-vous, horaires, questions fréquentes…") },
            { id: 3, texte: t("Je suis un assistant virtuel (intelligence artificielle). Mes réponses peuvent contenir des erreurs. Pour parler à une personne du cabinet, demandez-le-moi.") },
            { id: 4, texte: t("Comment puis-je vous aider ?") },
        ];
        const ajouter = message => setMessages(liste => (liste.some(m => m.id === message.id) ? liste : [...liste, { role: 'bot', actions: [], ...message }]));
        const ids = [];
        accueil.forEach((message, i) => {
            const arrivee = 700 + i * 1500;
            ids.push(window.setTimeout(() => setEcrit(true), arrivee - 650));
            ids.push(window.setTimeout(() => { ajouter(message); setEcrit(false); }, arrivee));
        });
        return () => ids.forEach(window.clearTimeout);
        // la présentation n'est rejouée que quand la conversation est effacée
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [epoque]);
    useEffect(() => { if (fil.current) fil.current.scrollTop = fil.current.scrollHeight; }, [messages, ecrit, interaction]);
    useEffect(() => {
        if (!visible) return undefined;
        const m = window.setTimeout(() => champ.current?.focus(), 60);
        return () => window.clearTimeout(m);
    }, [visible]);

    const ajouterBot = liste => liste.forEach((message, i) => {
        const minuterie = window.setTimeout(() => {
            compteur.current += 1;
            setMessages(courant => [...courant, { id: compteur.current, role: 'bot', actions: [], ...message }]);
            if (i === liste.length - 1) {
                setInteraction({ choix: message.choix || [], champ: message.champ || 'texte' });
                setEcrit(false);
            }
        }, i * 450);
        minuteries.current.push(minuterie);
    });

    // Une étape de la réservation (ou son début) : on attend la réponse du serveur, puis les bulles du moteur arrivent.
    const executerReservation = async travail => {
        setOccupe(true); setEcrit(true);
        try {
            const resultat = await travail();
            setRdv(resultat.etat);
            if (resultat.messages.length === 0) { setEcrit(false); setInteraction({ choix: [], champ: 'texte' }); }
            else ajouterBot(resultat.messages);
            if (!resultat.etat) setInteraction({ choix: [], champ: 'texte' });
        } catch {
            setEcrit(false);
            ajouterBot([{ texte: t("Une erreur est survenue. Réessayez dans un instant, ou utilisez le formulaire de rendez-vous."), actions: [{ label: t("Prendre rendez-vous"), to: '/prendre-rdv' }] }]);
            setRdv(null);
        } finally { setOccupe(false); }
    };

    const envoyer = (texte, intention = null, valeur) => {
        const propre = String(texte).trim().slice(0, 2000);
        if (!propre || occupe) return;
        compteur.current += 1;
        setMessages(liste => [...liste, { id: compteur.current, role: 'user', texte: propre.length > 300 ? `${propre.slice(0, 300)}…` : propre }]);
        setSaisie('');
        setInteraction({ choix: [], champ: 'texte' });
        const ctx = contexte.current;
        if (rdv) { executerReservation(() => avancer(rdv, propre, valeur, ctx)); return; }
        if (intention === 'rdv' || (!intention && detecterIntention(propre) === 'rdv')) { executerReservation(() => demarrer(ctx)); return; }
        setEcrit(true);
        // petit délai : l'assistant « écrit » avant de répondre
        const minuterie = window.setTimeout(() => {
            const reponse = repondre(propre, contexte.current, intention);
            compteur.current += 1;
            setMessages(liste => [...liste, { id: compteur.current, role: 'bot', ...reponse }]);
            setEcrit(false);
        }, 450 + Math.min(650, propre.length * 8));
        minuteries.current.push(minuterie);
    };

    // Efface toute la conversation (et la réservation en cours), puis rejoue la présentation.
    const effacer = () => {
        minuteries.current.forEach(window.clearTimeout);
        minuteries.current = [];
        compteur.current = 4;
        setMessages([]); setRdv(null); setSaisie(''); setEcrit(false); setOccupe(false); setInteraction({ choix: [], champ: 'texte' });
        setConfirmerEffacer(false);
        setEpoque(valeur => valeur + 1);
    };

    const raccourcis = [['rdv', t("Prendre rendez-vous")], ['mesRdv', t("Retrouver mon rendez-vous")], ['horaires', t("Horaires")], ['urgence', t("Urgences")], ['services', t("Nos services")], ['humain', t("Parler à une personne")]];
    const surTelephone = () => { if (window.innerWidth < 640) onFermer(); };   // sur téléphone, le panneau cache la page : on le ferme quand un lien est suivi
    const type = interaction.champ;
    const onSaisie = event => {
        const valeur = event.target.value;
        setSaisie(type === 'tel' ? formatPhoneInput(valeur) : type === 'age' ? valeur.replace(/\D/g, '').slice(0, 3) : valeur);
    };

    return (
        <section role="dialog" aria-label="CASA'AI" onKeyDown={event => { if (event.key === 'Escape') onFermer(); }}
            className={`casaai-panneau ${visible ? 'flex' : 'hidden'} flex-col overflow-hidden rounded-3xl bg-white shadow-2xl ring-1 ring-slate-200 dark:bg-gray-900 dark:text-gray-100 dark:ring-gray-700`}>
            <header className="flex items-center gap-3 bg-[#1F5FBF] px-4 py-3 text-white">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white"><MascotteCasaAI fixe className="h-9 w-9" /></span>
                <div className="min-w-0 flex-1 leading-tight">
                    <p className="flex items-center gap-1.5 whitespace-nowrap text-sm font-extrabold">
                        <span className="truncate">CASA'AI · {t("Assistant IA")}</span>
                        <span className="rounded-md bg-white px-1.5 py-0.5 text-[10px] font-black tracking-wider text-[#1F5FBF]" title={t("Intelligence artificielle")}>{t("IA")}</span>
                    </p>
                    <p className="truncate text-xs opacity-90">{t("Un robot, pas une personne")}</p>
                </div>
                <button type="button" onClick={() => setConfirmerEffacer(valeur => !valeur)} aria-label={t("Effacer la conversation")} title={t("Effacer la conversation")} aria-expanded={confirmerEffacer}
                    className="rounded-full p-1.5 transition hover:bg-white/20 focus-visible:outline-2 focus-visible:outline-white"><Trash2 size={18} aria-hidden="true" /></button>
                <button type="button" onClick={onFermer} aria-label={t("Fermer")} className="rounded-full p-1.5 transition hover:bg-white/20 focus-visible:outline-2 focus-visible:outline-white"><X size={18} aria-hidden="true" /></button>
            </header>

            {confirmerEffacer && (
                <div role="alertdialog" aria-label={t("Effacer la conversation")} className="flex items-center gap-2 border-b border-[#D7E3F5] bg-[#EAF2FC] px-4 py-2.5 text-sm text-[#0F2D5C]">
                    <span className="flex-1 font-bold leading-snug">{t("Effacer toute la conversation ?")}</span>
                    <button type="button" onClick={effacer} className="casaai-puce casaai-puce-plein">{t("Effacer")}</button>
                    <button type="button" onClick={() => setConfirmerEffacer(false)} className="casaai-puce">{t("Garder")}</button>
                </div>
            )}

            <div ref={fil} role="log" aria-live="polite" aria-label={t("Discussion avec CASA'AI")} className="min-h-24 flex-1 space-y-3 overflow-y-auto bg-[#F3F7FD] px-4 py-4 dark:bg-gray-950/40">
                {messages.map(message => (
                    <div key={message.id} className={message.role === 'user' ? 'flex justify-end' : 'flex justify-start'}>
                        <div className={`casaai-pop-msg ${message.role === 'user' ? 'origin-bottom-right' : 'origin-bottom-left'} max-w-[86%] whitespace-pre-line rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed ${message.role === 'user'
                            ? 'rounded-br-md bg-[#1F5FBF] text-white'
                            : 'rounded-bl-md bg-white text-[#0F2D5C] shadow-sm ring-1 ring-[#D7E3F5] dark:bg-gray-800 dark:text-gray-100 dark:ring-gray-700'}`}>
                            {message.grand ? <span className="text-2xl font-black leading-tight text-[#1F5FBF]">{message.texte}</span> : message.texte}
                            {message.actions?.length > 0 && (
                                <span className="mt-2.5 flex flex-wrap gap-1.5">
                                    {message.actions.map(action => (action.href
                                        ? <a key={action.label} href={action.href} className="casaai-action">{action.label}</a>
                                        : <Link key={action.label} to={action.to} onClick={surTelephone} className="casaai-action">{action.label}</Link>))}
                                </span>
                            )}
                        </div>
                    </div>
                ))}
                {ecrit && (
                    <div className="flex justify-start" aria-label={t("CASA'AI écrit…")}>
                        <div className="casaai-pop-msg origin-bottom-left flex gap-1 rounded-2xl rounded-bl-md bg-white px-4 py-3 shadow-sm ring-1 ring-[#D7E3F5] dark:bg-gray-800 dark:ring-gray-700">
                            {[0, 1, 2].map(i => <span key={i} className="h-2 w-2 animate-pulse rounded-full bg-[#4FA8F0]" style={{ animationDelay: `${i * 160}ms` }} />)}
                        </div>
                    </div>
                )}
            </div>

            {/* réponses rapides : les choix de la réservation en cours (avec « Annuler la réservation »), sinon les raccourcis habituels */}
            {rdv ? (
                <div className="flex max-h-[5.6rem] shrink-0 flex-wrap gap-1 overflow-y-auto border-t border-[#D7E3F5] bg-white px-3 py-2 dark:border-gray-700 dark:bg-gray-900" aria-label={t("Réponses rapides")}>
                    {interaction.choix.map(choix => <button key={choix.valeur} type="button" disabled={occupe} onClick={() => envoyer(choix.label, null, choix.valeur)} className="casaai-puce">{choix.label}</button>)}
                    <button type="button" disabled={occupe} onClick={() => envoyer(t("Annuler la réservation"), null, '__annuler')} className="casaai-puce casaai-puce-danger">{t("Annuler la réservation")}</button>
                </div>
            ) : (
                <div className="flex max-h-[5.6rem] shrink-0 flex-wrap gap-1 overflow-y-auto border-t border-[#D7E3F5] bg-white px-3 py-2 dark:border-gray-700 dark:bg-gray-900">
                    {raccourcis.map(([intention, libelle]) => (
                        <button key={intention} type="button" disabled={occupe} onClick={() => envoyer(libelle, intention)} className="casaai-puce">{libelle}</button>
                    ))}
                </div>
            )}

            <form onSubmit={event => { event.preventDefault(); envoyer(saisie); }} className="flex items-center gap-2 border-t border-[#D7E3F5] bg-white px-3 py-2.5 dark:border-gray-700 dark:bg-gray-900">
                <input ref={champ} value={saisie} onChange={onSaisie} maxLength={type === 'date' ? 10 : 2000} autoComplete="off" disabled={occupe}
                    type={type === 'date' ? 'date' : 'text'} min={type === 'date' ? todayISO() : undefined} inputMode={type === 'tel' ? 'tel' : type === 'age' ? 'numeric' : undefined}
                    placeholder={rdv ? t("Votre réponse…") : t("Écrivez votre question…")} aria-label={rdv ? t("Votre réponse…") : t("Écrivez votre question…")}
                    className="h-10 min-w-0 flex-1 rounded-full border border-[#D7E3F5] bg-[#F3F7FD] px-4 text-sm text-[#0F2D5C] outline-none transition focus:border-[#1F5FBF] focus:ring-2 focus:ring-[#1F5FBF]/25 disabled:opacity-60 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100" />
                <button type="submit" disabled={!saisie.trim() || occupe} aria-label={t("Envoyer")}
                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#1F5FBF] text-white transition hover:brightness-110 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1F5FBF] disabled:opacity-40"><Send size={17} aria-hidden="true" /></button>
            </form>
            <p className="casaai-aide shrink-0 bg-white px-4 pb-2.5 text-[11px] leading-snug text-slate-500 dark:bg-gray-900 dark:text-gray-400">{t("Assistant IA : il peut se tromper et ne donne pas d’avis médical. En cas d’urgence, appelez le cabinet.")}</p>
        </section>
    );
}
