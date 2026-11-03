import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CircleChevronLeft, CircleChevronRight, Loader2, Moon, Plus, Repeat, RotateCcw, Sparkles, Sun, X } from 'lucide-react';
import axiosClient from '../api/axiosClient';
import AdminLayout from '../components/AdminLayout';
import Notice from '../components/Notice';
import { formatDateFr, todayISO } from '../constants/app';
import { btnDanger, btnPrimary, btnSecondary, card, inputClass } from '../constants/ui';
import { apiErrorMessage, hasSession, LOGIN_PATH, peut } from '../utils/auth';

const ENTETES = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];
const PERIODES = [{ code: 'JOUR', libelle: 'Jour', icone: Sun }, { code: 'NUIT', libelle: 'Nuit', icone: Moon }];
// Une couleur par personne (toujours la même pour une même personne), pour repérer d'un coup d'œil qui est de garde.
const COULEURS = [
    'bg-teal-100 text-teal-900 dark:bg-teal-500/20 dark:text-teal-100',
    'bg-sky-100 text-sky-900 dark:bg-sky-500/20 dark:text-sky-100',
    'bg-violet-100 text-violet-900 dark:bg-violet-500/20 dark:text-violet-100',
    'bg-amber-100 text-amber-900 dark:bg-amber-500/20 dark:text-amber-100',
    'bg-rose-100 text-rose-900 dark:bg-rose-500/20 dark:text-rose-100',
    'bg-emerald-100 text-emerald-900 dark:bg-emerald-500/20 dark:text-emerald-100',
];
const LIBELLE_PERIODE = { JOUR: 'jour', NUIT: 'nuit', TOUT: 'jour et nuit' };
/** Pictogramme d'une garde : soleil (jour), lune (nuit), les deux (jour et nuit). */
function IconesPeriode({ periode, taille = 10 }) {
    return (
        <span className="flex shrink-0 items-center gap-px" aria-hidden="true">
            {periode !== 'NUIT' && <Sun size={taille} strokeWidth={2.4} />}
            {periode !== 'JOUR' && <Moon size={taille} strokeWidth={2.4} />}
        </span>
    );
}
const couleurDe = utilisateurId => COULEURS[Math.abs(Number(utilisateurId)) % COULEURS.length];

const iso = date => date.toLocaleDateString('en-CA');
const premierDuMois = jourISO => new Date(`${jourISO.slice(0, 7)}-01T12:00:00`);

/**
 * Tour de garde de l'équipe (toutes des sages-femmes), présenté comme le calendrier : un mois à la fois, chaque case montre qui est de garde ce jour-là,
 * et le détail du jour choisi s'affiche à droite. Une seule personne est de garde par jour, jour et nuit, à tour de rôle selon le nombre de personnes.
 * Tout le personnel le consulte (GARDE_VOIR) ; celui qui a GARDE_GERER (l'administration par défaut) met une personne de garde, retire une garde,
 * propose un tour (l'ordre des personnes), puis lance la « génération auto » qui le suit pour remplir le mois affiché.
 */
export default function TourDeGarde() {
    const navigate = useNavigate();
    const gere = peut('GARDE_GERER');
    const today = todayISO();
    const [mois, setMois] = useState(() => premierDuMois(today));
    const [selection, setSelection] = useState(today);
    const [gardes, setGardes] = useState([]);
    const [personnel, setPersonnel] = useState([]);
    const [chargement, setChargement] = useState(true);
    const [erreur, setErreur] = useState('');
    const [info, setInfo] = useState('');
    const [ajout, setAjout] = useState({ periode: 'JOUR_NUIT', utilisateurId: '' });
    const [tour, setTour] = useState({ ouvert: false, debut: today, nombreJours: 28, periode: 'JOUR_NUIT', ids: [], remplacer: false });
    const [modele, setModele] = useState(null);               // le tour proposé par l'administration (ordre, départ), suivi par la génération auto
    const [generationAuto, setGenerationAuto] = useState(false);   // demande de confirmation avant la génération auto
    const [remiseAZero, setRemiseAZero] = useState(false);   // demande de confirmation avant d'effacer tout le tour de garde
    const [envoi, setEnvoi] = useState(false);

    // Grille : semaines complètes (lundi → dimanche) qui couvrent le mois, comme dans le calendrier.
    const cases = useMemo(() => {
        const premier = new Date(mois.getFullYear(), mois.getMonth(), 1, 12);
        const decalage = (premier.getDay() + 6) % 7;
        const total = Math.ceil((decalage + new Date(mois.getFullYear(), mois.getMonth() + 1, 0).getDate()) / 7) * 7;
        return Array.from({ length: total }, (_, i) => new Date(mois.getFullYear(), mois.getMonth(), 1 - decalage + i, 12));
    }, [mois]);
    const du = iso(cases[0]);
    const au = iso(cases[cases.length - 1]);

    const charger = useCallback(async () => {
        try {
            const { data } = await axiosClient.get('/gardes', { params: { du, au } });
            setGardes(data); setErreur('');
        } catch (err) { setErreur(apiErrorMessage(err, 'Impossible de charger le tour de garde.')); }
        finally { setChargement(false); }
    }, [du, au]);

    useEffect(() => {
        if (!hasSession()) { navigate(LOGIN_PATH); return undefined; }
        const timer = window.setTimeout(charger, 0);
        return () => window.clearTimeout(timer);
    }, [charger, navigate]);

    const chargerModele = useCallback(() => {
        axiosClient.get('/gardes/modele').then(({ data }) => setModele(data && data.ids ? data : null)).catch(() => setModele(null));
    }, []);
    useEffect(() => {
        if (!gere) return;
        chargerModele();
        axiosClient.get('/gardes/personnel').then(({ data }) => {
            // seule l'équipe soignante est de garde : ni le super administrateur ni la secrétaire (le serveur les écarte aussi)
            const equipe = data.filter(p => p.role !== 'SUPER_ADMIN' && p.role !== 'SECRETAIRE');
            setPersonnel(equipe); setTour(courant => (courant.ids.length === 0 ? { ...courant, ids: equipe.map(p => p.id) } : courant));
        }).catch(() => {});
    }, [gere, chargerModele]);

    const parJour = useMemo(() => {
        const map = {};
        for (const garde of gardes) (map[garde.date] ||= []).push(garde);
        return map;
    }, [gardes]);

    /** Ce que montre une case : une seule mention quand la même personne est de garde jour et nuit, sinon une par période. */
    const mentions = liste => {
        const jour = liste.filter(g => g.periode === 'JOUR'), nuit = liste.filter(g => g.periode === 'NUIT');
        if (jour.length > 0 && jour.map(g => g.utilisateurId).join() === nuit.map(g => g.utilisateurId).join()) return jour.map(g => ({ cle: `${g.id}-24`, nom: g.utilisateurNom, utilisateurId: g.utilisateurId, periode: 'TOUT' }));
        return [...jour.map(g => ({ cle: String(g.id), nom: g.utilisateurNom, utilisateurId: g.utilisateurId, periode: 'JOUR' })), ...nuit.map(g => ({ cle: String(g.id), nom: g.utilisateurNom, utilisateurId: g.utilisateurId, periode: 'NUIT' }))];
    };

    const changerMois = delta => setMois(courant => new Date(courant.getFullYear(), courant.getMonth() + delta, 1, 12));

    const ajouter = async () => {
        if (!ajout.utilisateurId) { setErreur('Choisissez la personne de garde.'); return; }
        setEnvoi(true); setErreur(''); setInfo('');
        try {
            for (const periode of ajout.periode === 'JOUR_NUIT' ? ['JOUR', 'NUIT'] : [ajout.periode]) {
                await axiosClient.post('/gardes', { date: selection, periode, utilisateurId: Number(ajout.utilisateurId) });
            }
            setAjout(courant => ({ ...courant, utilisateurId: '' })); await charger();
        } catch (err) { setErreur(apiErrorMessage(err, 'Impossible d’ajouter cette garde.')); await charger(); }
        finally { setEnvoi(false); }
    };
    const retirer = async garde => {
        setErreur(''); setInfo('');
        try { await axiosClient.delete(`/gardes/${garde.id}`); await charger(); }
        catch (err) { setErreur(apiErrorMessage(err, 'Impossible de retirer cette garde.')); }
    };
    const genererTour = async evenement => {
        evenement.preventDefault(); setErreur(''); setInfo('');
        if (tour.ids.length === 0) { setErreur('Cochez au moins une personne pour le tour de garde.'); return; }
        setEnvoi(true);
        try {
            const { data } = await axiosClient.post('/gardes/tour', { debut: tour.debut, nombreJours: Number(tour.nombreJours), periode: tour.periode, utilisateurIds: tour.ids, remplacer: tour.remplacer });
            setInfo(`${data.jours} jour${data.jours > 1 ? 's' : ''} de garde ajouté${data.jours > 1 ? 's' : ''} du ${formatDateFr(data.du, { day: 'numeric', month: 'long' })} au ${formatDateFr(data.au, { day: 'numeric', month: 'long' })}${data.remplacees ? ` (${data.remplacees} remplacée${data.remplacees > 1 ? 's' : ''})` : ''}. Les personnes concernées sont prévenues.`);
            setTour(courant => ({ ...courant, ouvert: false })); setMois(premierDuMois(tour.debut)); chargerModele(); await charger();
        } catch (err) { setErreur(apiErrorMessage(err, 'Impossible de générer le tour de garde.')); }
        finally { setEnvoi(false); }
    };
    const basculerPersonne = id => setTour(courant => ({ ...courant, ids: courant.ids.includes(id) ? courant.ids.filter(x => x !== id) : [...courant.ids, id] }));

    // « Génération auto » : remplit tout le mois affiché en suivant le tour proposé par l'administration (ou, sans tour proposé, la rotation de toute l'équipe).
    const debutMois = iso(new Date(mois.getFullYear(), mois.getMonth(), 1, 12));
    const joursDuMois = new Date(mois.getFullYear(), mois.getMonth() + 1, 0).getDate();
    const finMois = iso(new Date(mois.getFullYear(), mois.getMonth(), joursDuMois, 12));
    const lancerGenerationAuto = async () => {
        setErreur(''); setInfo(''); setEnvoi(true);
        try {
            const { data } = await axiosClient.post('/gardes/automatique', { debut: debutMois, nombreJours: joursDuMois });
            setInfo(`Génération auto terminée du ${formatDateFr(data.du, { day: 'numeric', month: 'long' })} au ${formatDateFr(data.au, { day: 'numeric', month: 'long' })} : ${data.source === 'tour' ? 'le tour proposé par l’administration a été suivi' : 'une sage-femme de garde par jour, à tour de rôle sur toute l’équipe'}. Les personnes concernées sont prévenues.`);
            setGenerationAuto(false); await charger();
        } catch (err) {
            // 404 ou 405 : le serveur tourne encore avec une ancienne version, sans la génération automatique
            setErreur([404, 405].includes(err.response?.status) ? 'Le serveur n’est pas à jour : redémarrez le backend pour activer la génération auto.' : apiErrorMessage(err, 'Impossible de générer le tour de garde automatiquement.'));
        }
        finally { setEnvoi(false); }
    };

    // « Remise à zéro » : efface toutes les gardes et le tour proposé, comme à l'installation.
    const remettreAZero = async () => {
        setErreur(''); setInfo(''); setEnvoi(true);
        try {
            const { data } = await axiosClient.delete('/gardes');
            setInfo(`Tour de garde remis à zéro : ${data.supprimees} garde${data.supprimees > 1 ? 's' : ''} effacée${data.supprimees > 1 ? 's' : ''}${data.tourEfface ? ' et tour proposé supprimé' : ''}.`);
            setRemiseAZero(false); setModele(null); setTour(courant => ({ ...courant, ouvert: false })); await charger();
        } catch (err) {
            setErreur([404, 405].includes(err.response?.status) ? 'Le serveur n’est pas à jour : redémarrez le backend pour activer la remise à zéro.' : apiErrorMessage(err, 'Impossible de remettre le tour de garde à zéro.'));
        } finally { setEnvoi(false); }
    };

    const dujour = parJour[selection] || [];
    const nomMois = mois.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });
    return (
        <AdminLayout title="Tour de garde" subtitle="Une sage-femme de garde par jour, à tour de rôle">
            {() => <>
                {erreur && <Notice tone="error" onClose={() => setErreur('')}>{erreur}</Notice>}
                {info && <Notice tone="success" onClose={() => setInfo('')}>{info}</Notice>}

                <div className="grid gap-6 xl:grid-cols-[1fr_360px]">
                    <section className={`${card} p-4 sm:p-5`}>
                        <div className="mb-4 flex items-center justify-between">
                            <h2 className="text-lg font-semibold capitalize">{nomMois}</h2>
                            <div className="flex items-center gap-2">
                                {chargement && <Loader2 size={16} className="animate-spin text-slate-400" />}
                                <button onClick={() => { setMois(premierDuMois(today)); setSelection(today); }} className={btnSecondary}>Aujourd’hui</button>
                                <button onClick={() => changerMois(-1)} aria-label="Mois précédent" className="rounded-full text-slate-500 transition hover:text-(--mt-main) dark:text-gray-300"><CircleChevronLeft size={30} /></button>
                                <button onClick={() => changerMois(1)} aria-label="Mois suivant" className="rounded-full text-slate-500 transition hover:text-(--mt-main) dark:text-gray-300"><CircleChevronRight size={30} /></button>
                            </div>
                        </div>

                        {gere && generationAuto && (
                            <div role="alertdialog" aria-label="Génération auto du tour de garde" className="mb-4 rounded-xl border border-amber-300 bg-amber-50 p-4 text-sm text-amber-900 dark:border-amber-500/40 dark:bg-amber-500/10 dark:text-amber-100">
                                <p className="font-semibold">Générer automatiquement le tour de garde de {nomMois} ?</p>
                                {modele ? (
                                    <p className="mt-1 leading-relaxed">Le tour proposé par l’administration est suivi : <strong>{modele.noms.join(' → ')}</strong>, une personne par jour, en boucle, à partir du {formatDateFr(modele.debut, { day: 'numeric', month: 'long', year: 'numeric' })}.</p>
                                ) : (
                                    <p className="mt-1 leading-relaxed">Aucun tour n’a encore été proposé : une sage-femme de garde par jour, à tour de rôle sur toute l’équipe. Pour fixer votre propre ordre, utilisez d’abord « Proposer un tour de garde ».</p>
                                )}
                                <p className="mt-1 leading-relaxed">Du {formatDateFr(debutMois, { day: 'numeric', month: 'long' })} au {formatDateFr(finMois, { day: 'numeric', month: 'long' })} ; les gardes déjà modifiées sur ces jours seront remplacées.</p>
                                <div className="mt-3 flex flex-wrap gap-2">
                                    <button type="button" onClick={lancerGenerationAuto} disabled={envoi} className={btnPrimary}>{envoi && <Loader2 size={15} className="animate-spin" />}Générer</button>
                                    <button type="button" onClick={() => setGenerationAuto(false)} className={btnSecondary}>Annuler</button>
                                </div>
                            </div>
                        )}

                        {gere && remiseAZero && (
                            <div role="alertdialog" aria-label="Remise à zéro du tour de garde" className="mb-4 rounded-xl border border-rose-300 bg-rose-50 p-4 text-sm text-rose-900 dark:border-rose-500/40 dark:bg-rose-500/10 dark:text-rose-100">
                                <p className="font-semibold">Remettre le tour de garde à zéro ?</p>
                                <p className="mt-1 leading-relaxed">Toutes les gardes enregistrées (tous les mois) et le tour proposé par l’administration seront effacés : le tour de garde redevient vide, comme au départ. Les sages-femmes ne sont pas prévenues. Cette action est définitive.</p>
                                <div className="mt-3 flex flex-wrap gap-2">
                                    <button type="button" onClick={remettreAZero} disabled={envoi} className={btnDanger}>{envoi && <Loader2 size={15} className="animate-spin" />}Tout effacer</button>
                                    <button type="button" onClick={() => setRemiseAZero(false)} className={btnSecondary}>Annuler</button>
                                </div>
                            </div>
                        )}

                        <div className="grid grid-cols-7 gap-1 text-center text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-gray-400">
                            {ENTETES.map(e => <div key={e} className="py-2">{e}</div>)}
                        </div>
                        <div className="grid grid-cols-7 gap-1">
                            {cases.map(date => {
                                const d = iso(date);
                                const dansLeMois = date.getMonth() === mois.getMonth();
                                const estSelection = d === selection;
                                const resume = mentions(parJour[d] || []);
                                return (
                                    <button key={d} onClick={() => setSelection(d)} aria-pressed={estSelection}
                                        aria-label={`${formatDateFr(d, { weekday: 'long', day: 'numeric', month: 'long' })} : ${resume.length ? resume.map(m => `${m.nom} (${LIBELLE_PERIODE[m.periode]})`).join(', ') : 'personne de garde'}`}
                                        className={`relative flex min-h-16 flex-col items-start gap-1 rounded-xl border p-1.5 text-left transition sm:min-h-24 sm:p-2 ${estSelection ? 'border-teal-600 ring-2 ring-teal-600/30' : 'border-slate-200 hover:border-teal-400 dark:border-gray-800'} ${dansLeMois ? 'bg-white dark:bg-gray-900' : 'bg-slate-50 opacity-50 dark:bg-gray-950'}`}>
                                        <span className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-semibold tabular-nums ${d === today ? 'bg-teal-700 text-white' : ''}`}>{date.getDate()}</span>
                                        <span className="mt-auto flex w-full flex-col gap-0.5">
                                            {resume.map(m => <span key={m.cle} title={`${m.nom} (${LIBELLE_PERIODE[m.periode]})`} className={`flex max-w-full items-center gap-0.5 rounded-md px-1 py-0.5 text-[10px] font-semibold sm:text-[11px] ${couleurDe(m.utilisateurId)}`}><IconesPeriode periode={m.periode} /><span className="min-w-0 truncate">{m.nom}</span></span>)}
                                        </span>
                                    </button>
                                );
                            })}
                        </div>
                        <p className="mt-3 text-xs text-slate-500 dark:text-gray-400">Chaque couleur est une personne de l’équipe. Soleil : garde de jour ; lune : garde de nuit ; les deux : la personne est de garde jour et nuit.{!gere && ' Le tour de garde est réglé par l’administration du cabinet.'}</p>
                    </section>

                    <aside className={`${card} h-fit p-5`} aria-live="polite">
                        <h2 className="font-semibold capitalize">{formatDateFr(selection, { weekday: 'long', day: 'numeric', month: 'long' })}</h2>
                        {dujour.length === 0 ? <p className="mt-4 text-sm text-slate-500 dark:text-gray-400">Personne n’est de garde ce jour-là.</p> : (
                            <ul className="mt-4 space-y-2">
                                {PERIODES.flatMap(({ code, libelle, icone: Icone }) => dujour.filter(g => g.periode === code).map(g => (
                                    <li key={g.id} className="flex items-center gap-3 rounded-xl border border-slate-200 p-3 dark:border-gray-800">
                                        <span className="flex w-16 items-center gap-1.5 text-sm font-semibold"><Icone size={15} aria-hidden="true" />{libelle}</span>
                                        <div className="min-w-0 flex-1"><div className="truncate text-sm font-medium">{g.utilisateurNom}</div><div className="truncate text-xs text-slate-500 dark:text-gray-400">{g.roleLibelle}{g.telephone ? ` · ${g.telephone}` : ''}</div></div>
                                        <span className={`h-3 w-3 shrink-0 rounded-full ${couleurDe(g.utilisateurId).split(' ')[0]}`} aria-hidden="true" />
                                        {gere && <button type="button" onClick={() => retirer(g)} aria-label={`Retirer ${g.utilisateurNom} de la garde du ${formatDateFr(g.date)} (${libelle.toLowerCase()})`} className="rounded p-1 text-slate-400 hover:bg-rose-100 hover:text-rose-700 dark:hover:bg-rose-500/15"><X size={15} /></button>}
                                    </li>
                                )))}
                            </ul>
                        )}

                        {gere && (
                            <div className="mt-5 space-y-3 border-t border-slate-200 pt-4 dark:border-gray-800">
                                <h3 className="text-sm font-semibold">Mettre quelqu’un de garde ce jour</h3>
                                <select aria-label="Personne de garde" value={ajout.utilisateurId} onChange={e => setAjout(courant => ({ ...courant, utilisateurId: e.target.value }))} className={inputClass}>
                                    <option value="">Choisir une sage-femme…</option>
                                    {personnel.map(p => <option key={p.id} value={p.id}>{p.nom}</option>)}
                                </select>
                                <select aria-label="Période de garde" value={ajout.periode} onChange={e => setAjout(courant => ({ ...courant, periode: e.target.value }))} className={inputClass}>
                                    <option value="JOUR_NUIT">Jour et nuit (24 h)</option><option value="JOUR">Jour seulement</option><option value="NUIT">Nuit seulement</option>
                                </select>
                                <button type="button" onClick={ajouter} disabled={envoi} className={`${btnPrimary} w-full`}>{envoi ? <Loader2 size={16} className="animate-spin" /> : <Plus size={16} />}Ajouter</button>
                            </div>
                        )}

                        {gere && (
                            <div className="mt-5 space-y-2 border-t border-slate-200 pt-4 dark:border-gray-800">
                                <button type="button" onClick={() => setGenerationAuto(ouverte => !ouverte)} aria-expanded={generationAuto} className={`${btnPrimary} w-full`}><Sparkles size={16} />Génération auto</button>
                                <p className="text-xs leading-relaxed text-slate-500 dark:text-gray-400">{modele ? <>Suit le tour proposé : {modele.noms.join(' → ')}.</> : 'Suit le tour proposé par l’administration (à défaut, toute l’équipe à tour de rôle).'}</p>
                                <button type="button" onClick={() => setTour(courant => ({ ...courant, ouvert: !courant.ouvert, debut: debutMois, nombreJours: joursDuMois, ids: modele ? modele.ids : courant.ids, periode: modele ? modele.periode : courant.periode }))} aria-expanded={tour.ouvert} className={`${btnSecondary} w-full`}><Repeat size={16} />Proposer un tour de garde</button>
                                <button type="button" onClick={() => setRemiseAZero(ouverte => !ouverte)} aria-expanded={remiseAZero} className={`${btnSecondary} w-full text-rose-700 dark:text-rose-300`}><RotateCcw size={16} />Remise à zéro</button>
                            </div>
                        )}
                    </aside>
                </div>

                {gere && tour.ouvert && (
                    <form onSubmit={genererTour} className={`${card} space-y-4 p-5 sm:p-6`}>
                        <div>
                            <h2 className="text-base font-semibold">Proposer un tour de garde</h2>
                            <p className="mt-1 text-sm text-slate-600 dark:text-gray-300">Les personnes cochées se relaient à tour de rôle, une par jour, dans l’ordre de la liste. Elles sont prévenues par une notification. <strong>Ce tour devient le tour de référence</strong> que suit le bouton « Génération auto » pour les mois suivants.</p>
                        </div>
                        <div className="grid gap-4 sm:grid-cols-3">
                            <label className="text-sm font-medium">À partir du
                                <input required type="date" value={tour.debut} onChange={e => setTour(courant => ({ ...courant, debut: e.target.value }))} className={`${inputClass} mt-1.5`} /></label>
                            <label className="text-sm font-medium">Nombre de jours
                                <input required type="number" min={1} max={93} value={tour.nombreJours} onChange={e => setTour(courant => ({ ...courant, nombreJours: e.target.value }))} className={`${inputClass} mt-1.5`} /></label>
                            <label className="text-sm font-medium">Garde de
                                <select value={tour.periode} onChange={e => setTour(courant => ({ ...courant, periode: e.target.value }))} className={`${inputClass} mt-1.5`}>
                                    <option value="JOUR_NUIT">Jour et nuit (24 h)</option><option value="JOUR">Jour seulement</option><option value="NUIT">Nuit seulement</option>
                                </select></label>
                        </div>
                        <fieldset>
                            <legend className="mb-2 text-sm font-medium">Les sages-femmes du tour <span className="font-normal text-slate-500 dark:text-gray-400">· toute l’équipe est cochée ; l’ordre est celui où vous les cochez</span></legend>
                            <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
                                {personnel.map(p => {
                                    const rang = tour.ids.indexOf(p.id);
                                    return (
                                        <label key={p.id} className={`flex cursor-pointer items-center gap-3 rounded-xl border px-3 py-2.5 text-sm transition ${rang >= 0 ? 'border-teal-600 bg-teal-50 dark:bg-teal-500/10' : 'border-slate-200 dark:border-gray-700'}`}>
                                            <input type="checkbox" checked={rang >= 0} onChange={() => basculerPersonne(p.id)} className="h-4 w-4 accent-teal-700" />
                                            <span className="min-w-0 flex-1"><span className="block truncate font-medium">{p.nom}</span><span className="block truncate text-xs text-slate-500 dark:text-gray-400">{p.roleLibelle}</span></span>
                                            {rang >= 0 && <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-teal-700 text-xs font-bold text-white" aria-label={`Position ${rang + 1}`}>{rang + 1}</span>}
                                        </label>
                                    );
                                })}
                            </div>
                        </fieldset>
                        <label className="flex cursor-pointer items-center gap-3 text-sm">
                            <input type="checkbox" checked={tour.remplacer} onChange={e => setTour(courant => ({ ...courant, remplacer: e.target.checked }))} className="h-4 w-4 accent-teal-700" />
                            <span><span className="font-medium">Remplacer les gardes déjà prévues</span><span className="text-slate-500 dark:text-gray-400"> · sur ces jours et cette période</span></span>
                        </label>
                        <div className="flex flex-wrap items-center justify-end gap-2 border-t border-slate-200 pt-4 dark:border-gray-800">
                            <button type="button" onClick={() => setTour(courant => ({ ...courant, ouvert: false }))} className={btnSecondary}>Annuler</button>
                            <button disabled={envoi} className={btnPrimary}>{envoi && <Loader2 size={15} className="animate-spin" />}Proposer et générer</button>
                        </div>
                    </form>
                )}
            </>}
        </AdminLayout>
    );
}
