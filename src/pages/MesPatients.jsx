import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { CalendarClock, Check, CheckCheck, ClipboardCheck, FolderOpen, Loader2, Phone, Search, UserCheck } from 'lucide-react';
import axiosClient from '../api/axiosClient';
import AdminLayout from '../components/AdminLayout';
import Notice from '../components/Notice';
import { STATUS, formatDateFr, hhmm, todayISO } from '../constants/app';
import { btnPrimary, btnSecondary, card, inputClass } from '../constants/ui';
import { apiErrorMessage, getRole, hasSession, homeForRole, LOGIN_PATH } from '../utils/auth';
import { formatPhone } from '../utils/phone';

const ROLES_PRATICIENS = ['MEDECIN', 'SAGE_FEMME', 'INFIRMIERE'];
const FILTRES = [['avenir', 'À venir'], ['passes', 'Passés'], ['tous', 'Tous']];
const premiereMajuscule = texte => texte.charAt(0).toUpperCase() + texte.slice(1);
const jourLong = iso => premiereMajuscule(formatDateFr(iso, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }));
const motifCourt = motif => (motif || '').split('\n').find(l => l.trim() && !l.startsWith('⚠')) || '';

/**
 * « Mes patients » : les rendez-vous que le super administrateur m'a confiés. En haut, ceux que je dois encore accepter ;
 * dessous, ceux que j'ai acceptés, avec la date et l'heure. Ouverte depuis une notification (?rdv=…), elle met ce rendez-vous en évidence.
 */
export default function MesPatients() {
    const navigate = useNavigate();
    const [params] = useSearchParams();
    const rdvFocus = Number(params.get('rdv')) || null;
    const [liste, setListe] = useState([]);
    const [filtre, setFiltre] = useState(null); // null = automatique (« À venir », ou « Passés » si le rendez-vous ciblé est passé)
    const [recherche, setRecherche] = useState('');
    const [loading, setLoading] = useState(true);
    const [enCours, setEnCours] = useState(null);
    const [error, setError] = useState('');
    const [notice, setNotice] = useState('');
    const aujourdhui = todayISO();

    const charger = useCallback(async () => {
        try { const { data } = await axiosClient.get('/rdv/mes-patients'); setListe(data); }
        catch (err) { setError(apiErrorMessage(err, 'Impossible de charger vos patients.')); }
        finally { setLoading(false); }
    }, []);

    useEffect(() => {
        const role = getRole();
        if (!hasSession()) { navigate(LOGIN_PATH); return undefined; }
        if (!ROLES_PRATICIENS.includes(role)) { navigate(homeForRole(role)); return undefined; }
        const premier = window.setTimeout(charger, 0);
        const intervalle = window.setInterval(() => { if (document.visibilityState === 'visible') charger(); }, 20000);
        return () => { window.clearTimeout(premier); window.clearInterval(intervalle); };
    }, [charger, navigate]);

    const actif = r => r.statut === 'EN_ATTENTE' || r.statut === 'CONFIRME';
    const aAccepter = useMemo(() => liste.filter(r => !r.personnelConfirme && actif(r)), [liste]);
    const acceptes = useMemo(() => liste.filter(r => r.personnelConfirme), [liste]);
    const cible = rdvFocus ? liste.find(r => r.id === rdvFocus) : null;
    const filtreEffectif = filtre || (cible && cible.personnelConfirme && (cible.dateRdv < aujourdhui || cible.statut === 'TERMINE') ? 'passes' : 'avenir');

    const visibles = useMemo(() => {
        const q = recherche.trim().toLocaleLowerCase('fr');
        return acceptes.filter(r => {
            const passe = r.dateRdv < aujourdhui || r.statut === 'TERMINE' || r.statut === 'ANNULE';
            if (filtreEffectif === 'avenir' && passe) return false;
            if (filtreEffectif === 'passes' && !passe) return false;
            return !q || [r.nomClient, r.telephoneClient, r.serviceNom, r.motif].some(v => String(v ?? '').toLocaleLowerCase('fr').includes(q));
        }).sort((a, b) => (filtreEffectif === 'passes' ? -1 : 1) * `${a.dateRdv}${a.heureRdv}`.localeCompare(`${b.dateRdv}${b.heureRdv}`));
    }, [acceptes, filtreEffectif, recherche, aujourdhui]);

    useEffect(() => {
        if (!rdvFocus) return;
        const timer = window.setTimeout(() => document.getElementById(`rdv-${rdvFocus}`)?.scrollIntoView({ block: 'center', behavior: 'smooth' }), 150);
        return () => window.clearTimeout(timer);
    }, [rdvFocus, liste.length, filtreEffectif]);

    const agir = async (rdv, requete, message) => {
        setEnCours(rdv.id); setError(''); setNotice('');
        try { await requete(); setNotice(message); await charger(); }
        catch (err) { setError(apiErrorMessage(err, 'Action impossible. Réessayez.')); }
        finally { setEnCours(null); }
    };
    const accepter = rdv => agir(rdv, () => axiosClient.put(`/rdv/${rdv.id}/accepter`), `Vous avez accepté le rendez-vous de ${rdv.nomClient}. Le super administrateur en est informé et va le confirmer.`);
    const terminer = rdv => agir(rdv, () => axiosClient.put(`/rdv/${rdv.id}/terminer`), `Consultation de ${rdv.nomClient} terminée.`);

    const mise = id => (id === rdvFocus ? 'ring-2 ring-teal-500 ring-offset-2 dark:ring-offset-gray-900' : '');
    const dossier = tel => `/patients/dossier?telephone=${encodeURIComponent(tel)}`;

    // regroupement par jour
    const parJour = useMemo(() => {
        const groupes = [];
        for (const r of visibles) {
            const dernier = groupes[groupes.length - 1];
            if (dernier && dernier.date === r.dateRdv) dernier.items.push(r);
            else groupes.push({ date: r.dateRdv, items: [r] });
        }
        return groupes;
    }, [visibles]);

    return (
        <AdminLayout title="Mes patients" subtitle="Les rendez-vous qui vous sont confiés, avec leur date et leur heure">
            <Notice tone="success" onClose={() => setNotice('')}>{notice}</Notice>
            <Notice tone="error" onClose={() => setError('')}>{error}</Notice>
            {rdvFocus && !loading && !cible && <Notice tone="warning">Ce rendez-vous ne vous est plus attribué (le super administrateur l’a peut-être confié à quelqu’un d’autre ou annulé).</Notice>}
            {loading && <div className="flex justify-center p-10"><Loader2 className="animate-spin text-slate-400" size={20} /></div>}

            {/* ---------- à accepter ---------- */}
            {aAccepter.length > 0 && (
                <section className="rounded-2xl border-2 border-amber-300 bg-amber-50/60 p-5 dark:border-amber-500/40 dark:bg-amber-500/5" aria-label="Rendez-vous à accepter">
                    <h2 className="mb-1 flex items-center gap-2 font-semibold text-amber-900 dark:text-amber-200"><UserCheck size={18} />À accepter <span className="rounded-full bg-amber-200 px-2 py-0.5 text-xs dark:bg-amber-500/20">{aAccepter.length}</span></h2>
                    <p className="mb-3 text-sm text-amber-900/80 dark:text-amber-200/80">Ces rendez-vous vous ont été confiés par le super administrateur. Acceptez-les pour qu’il puisse les confirmer aux patients.</p>
                    <ul className="space-y-2">
                        {aAccepter.map(r => (
                            <li key={r.id} id={`rdv-${r.id}`} className={`flex flex-wrap items-center gap-3 rounded-xl border border-amber-200 bg-white p-3 dark:border-amber-500/20 dark:bg-gray-900 ${mise(r.id)}`}>
                                <div className="min-w-0 flex-1">
                                    <p className="font-semibold">{r.nomClient} <span className="ml-1 text-xs font-normal text-slate-500">{formatPhone(r.telephoneClient)}</span></p>
                                    <p className="flex flex-wrap items-center gap-x-3 text-sm text-slate-600 dark:text-gray-300"><span className="inline-flex items-center gap-1.5 font-medium"><CalendarClock size={14} />{jourLong(r.dateRdv)} à {hhmm(r.heureRdv)}</span>{r.serviceNom && <span>{r.serviceNom}</span>}</p>
                                    {motifCourt(r.motif) && <p className="mt-1 truncate text-xs text-slate-500">{motifCourt(r.motif)}</p>}
                                </div>
                                <button disabled={enCours === r.id} onClick={() => accepter(r)} className={btnPrimary}>{enCours === r.id ? <Loader2 size={15} className="animate-spin" /> : <Check size={16} />}Accepter</button>
                            </li>
                        ))}
                    </ul>
                </section>
            )}

            {/* ---------- mes patients acceptés ---------- */}
            <section className={`${card} p-5`}>
                <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                    <h2 className="flex items-center gap-2 font-semibold"><ClipboardCheck size={18} className="text-teal-700" />Patients que j’ai acceptés <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs dark:bg-gray-800">{acceptes.length}</span></h2>
                    <div className="flex flex-wrap items-center gap-2">
                        <div className="relative"><Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" /><input value={recherche} onChange={e => setRecherche(e.target.value)} placeholder="Chercher un patient" aria-label="Chercher un patient" className={`${inputClass} w-52 pl-9`} /></div>
                        <div className="inline-flex rounded-xl bg-slate-100 p-1 dark:bg-gray-800" role="group" aria-label="Période">
                            {FILTRES.map(([cle, libelle]) => <button key={cle} onClick={() => setFiltre(cle)} aria-pressed={filtreEffectif === cle} className={`rounded-lg px-3 py-1.5 text-sm font-medium transition ${filtreEffectif === cle ? 'bg-white text-teal-800 shadow-sm dark:bg-gray-700 dark:text-teal-300' : 'text-slate-600 dark:text-gray-300'}`}>{libelle}</button>)}
                        </div>
                    </div>
                </div>

                {!loading && parJour.length === 0 && (
                    <p className="py-10 text-center text-sm text-slate-500">{acceptes.length === 0 ? 'Aucun patient accepté pour le moment. Les rendez-vous que le super administrateur vous confie apparaissent ici.' : 'Aucun rendez-vous pour ce filtre.'}</p>
                )}
                <div className="space-y-5">
                    {parJour.map(groupe => (
                        <div key={groupe.date}>
                            <h3 className="mb-2 text-sm font-semibold text-slate-600 dark:text-gray-300">{jourLong(groupe.date)}{groupe.date === aujourdhui ? ' · aujourd’hui' : ''}</h3>
                            <ul className="divide-y divide-slate-100 rounded-xl border border-slate-200 dark:divide-gray-800 dark:border-gray-800">
                                {groupe.items.map(r => {
                                    const st = STATUS[r.statut] || STATUS.EN_ATTENTE;
                                    return (
                                        <li key={r.id} id={`rdv-${r.id}`} className={`flex flex-wrap items-center gap-3 px-4 py-3 ${mise(r.id)}`}>
                                            <span className="w-14 text-lg font-bold tabular-nums text-teal-800 dark:text-teal-300">{hhmm(r.heureRdv)}</span>
                                            <div className="min-w-0 flex-1">
                                                <p className="font-semibold">{r.nomClient}</p>
                                                <p className="flex flex-wrap items-center gap-x-3 text-xs text-slate-500 dark:text-gray-400"><span className="inline-flex items-center gap-1"><Phone size={12} />{formatPhone(r.telephoneClient)}</span>{r.serviceNom && <span>{r.serviceNom}</span>}</p>
                                                {motifCourt(r.motif) && <p className="mt-0.5 truncate text-xs text-slate-500">{motifCourt(r.motif)}</p>}
                                            </div>
                                            <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${st.badge}`}><span className={`h-1.5 w-1.5 rounded-full ${st.dot}`} />{r.statut === 'EN_ATTENTE' ? 'Accepté · à confirmer par le cabinet' : st.label}</span>
                                            <div className="flex gap-2">
                                                <Link to={dossier(r.telephoneClient)} className={btnSecondary}><FolderOpen size={15} />Dossier</Link>
                                                {r.statut === 'CONFIRME' && <button disabled={enCours === r.id} onClick={() => terminer(r)} className={btnSecondary}>{enCours === r.id ? <Loader2 size={15} className="animate-spin" /> : <CheckCheck size={15} />}Terminé</button>}
                                            </div>
                                        </li>
                                    );
                                })}
                            </ul>
                        </div>
                    ))}
                </div>
            </section>
        </AdminLayout>
    );
}
