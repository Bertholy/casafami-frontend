import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { DatabaseBackup, Download, FolderOpen, ImageDown, Loader2, ShieldAlert, ShieldCheck } from 'lucide-react';
import axiosClient from '../api/axiosClient';
import AdminLayout from '../components/AdminLayout';
import Notice from '../components/Notice';
import { btnPrimary, btnSecondary, card } from '../constants/ui';
import { apiErrorMessage, getRole, hasSession, homeForRole, LOGIN_PATH } from '../utils/auth';

const taille = octets => (octets >= 1048576 ? `${(octets / 1048576).toFixed(1)} Mo` : `${Math.max(1, Math.round(octets / 1024))} Ko`);
const quand = iso => new Date(iso).toLocaleString('fr-FR', { weekday: 'short', day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' });

/** Sauvegardes de la base de données et des photos : automatiques, avec lancement manuel et téléchargement (super administrateur). */
export default function AdminSauvegardes() {
    const navigate = useNavigate();
    const [etat, setEtat] = useState(null);
    const [loading, setLoading] = useState(true);
    const [enCours, setEnCours] = useState(false);
    const [telechargement, setTelechargement] = useState('');
    const [error, setError] = useState('');
    const [notice, setNotice] = useState('');

    const load = useCallback(async () => {
        try { const { data } = await axiosClient.get('/admin/sauvegardes'); setEtat(data); }
        catch (err) { setError(apiErrorMessage(err, 'Impossible de charger les sauvegardes.')); }
        finally { setLoading(false); }
    }, []);

    useEffect(() => {
        const role = getRole();
        if (!hasSession()) { navigate(LOGIN_PATH); return undefined; }
        if (role !== 'SUPER_ADMIN') { navigate(homeForRole(role)); return undefined; }
        const timer = window.setTimeout(load, 0);
        return () => window.clearTimeout(timer);
    }, [load, navigate]);

    const sauvegarder = async () => {
        setEnCours(true); setError(''); setNotice('');
        try {
            const { data } = await axiosClient.post('/admin/sauvegardes', null, { timeout: 15 * 60 * 1000 });
            await load();
            setNotice(`Sauvegarde terminée : ${data.map(f => f.nom).join(', ')}.`);
        } catch (err) { setError(apiErrorMessage(err, 'La sauvegarde a échoué. Vérifiez que PostgreSQL est installé (pg_dump).')); }
        finally { setEnCours(false); }
    };

    const telecharger = async fichier => {
        setTelechargement(fichier.nom); setError('');
        try {
            const { data } = await axiosClient.get(`/admin/sauvegardes/${fichier.nom}`, { responseType: 'blob', timeout: 15 * 60 * 1000 });
            const url = URL.createObjectURL(data);
            const lien = document.createElement('a');
            lien.href = url; lien.download = fichier.nom; document.body.appendChild(lien); lien.click(); lien.remove();
            window.setTimeout(() => URL.revokeObjectURL(url), 10000);
        } catch (err) { setError(apiErrorMessage(err, 'Le téléchargement a échoué.')); }
        finally { setTelechargement(''); }
    };

    const fichiers = etat?.fichiers || [];
    const derniere = fichiers.find(f => f.type === 'base');

    return (
        <AdminLayout title="Sauvegardes" subtitle="Protégez les données du cabinet : base de données et photos">
            <Notice tone="success" onClose={() => setNotice('')}>{notice}</Notice>
            <Notice tone="error" onClose={() => setError('')}>{error}</Notice>
            {etat && !etat.pgDumpDisponible && <Notice tone="error">L’outil de sauvegarde de PostgreSQL (<strong>pg_dump</strong>) est introuvable sur ce serveur : aucune sauvegarde n’est possible. Installez les outils PostgreSQL ou indiquez leur emplacement (variable <code>CASAFAMI_PG_DUMP</code>).</Notice>}

            <section className={`${card} p-5`}>
                <div className="flex flex-wrap items-center justify-between gap-4">
                    <div className="flex items-start gap-3">
                        <span className={`mt-0.5 flex h-11 w-11 items-center justify-center rounded-xl ${etat && !etat.enRetard ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300' : 'bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300'}`}>
                            {etat && !etat.enRetard ? <ShieldCheck size={22} /> : <ShieldAlert size={22} />}
                        </span>
                        <div>
                            <h2 className="font-semibold">{loading ? 'Chargement…' : derniere ? (etat.enRetard ? 'La dernière sauvegarde est ancienne' : 'Vos données sont sauvegardées') : 'Aucune sauvegarde pour le moment'}</h2>
                            <p className="text-sm text-slate-500 dark:text-gray-400">
                                {derniere ? <>Dernière sauvegarde : <strong>{quand(derniere.date)}</strong></> : 'Lancez une première sauvegarde maintenant.'}
                            </p>
                            {etat && <p className="mt-1 text-xs text-slate-500 dark:text-gray-400">{etat.automatique ? `Sauvegarde automatique chaque jour (dès que l’ordinateur est allumé), les ${etat.conservees} dernières sont conservées.` : 'La sauvegarde automatique est désactivée.'}</p>}
                        </div>
                    </div>
                    <button onClick={sauvegarder} disabled={enCours || !etat?.pgDumpDisponible} className={btnPrimary}>
                        {enCours ? <Loader2 size={16} className="animate-spin" /> : <DatabaseBackup size={16} />}{enCours ? 'Sauvegarde en cours…' : 'Sauvegarder maintenant'}
                    </button>
                </div>
                {etat && <p className="mt-4 flex items-center gap-2 text-xs text-slate-500 dark:text-gray-400"><FolderOpen size={14} />Dossier : <code className="break-all">{etat.dossier}</code></p>}
            </section>

            <section className={`${card} overflow-hidden`}>
                <div className="border-b border-slate-200 px-5 py-4 dark:border-gray-800"><h2 className="font-semibold">Sauvegardes disponibles <span className="ml-1 rounded-full bg-slate-100 px-2 py-0.5 text-xs dark:bg-gray-800">{fichiers.length}</span></h2></div>
                {fichiers.length === 0 ? <p className="p-8 text-center text-sm text-slate-500">Aucune sauvegarde.</p> : (
                    <ul className="divide-y divide-slate-100 dark:divide-gray-800">
                        {fichiers.map(f => (
                            <li key={f.nom} className="flex flex-wrap items-center gap-3 px-5 py-3">
                                <span className={`flex h-9 w-9 items-center justify-center rounded-lg ${f.type === 'base' ? 'bg-teal-100 text-teal-700 dark:bg-teal-500/15 dark:text-teal-300' : 'bg-sky-100 text-sky-700 dark:bg-sky-500/15 dark:text-sky-300'}`}>
                                    {f.type === 'base' ? <DatabaseBackup size={17} /> : <ImageDown size={17} />}
                                </span>
                                <div className="min-w-0 flex-1">
                                    <p className="truncate text-sm font-medium">{f.type === 'base' ? 'Base de données' : 'Photos (services et profils)'} <span className="font-normal text-slate-400">· {f.nom}</span></p>
                                    <p className="text-xs text-slate-500 dark:text-gray-400">{quand(f.date)} · {taille(f.taille)}</p>
                                </div>
                                <button onClick={() => telecharger(f)} disabled={telechargement === f.nom} className={btnSecondary}>
                                    {telechargement === f.nom ? <Loader2 size={15} className="animate-spin" /> : <Download size={15} />}Télécharger
                                </button>
                            </li>
                        ))}
                    </ul>
                )}
            </section>

            <Notice tone="warning">
                <strong>Une sauvegarde sur le même ordinateur ne protège pas d’une panne ou d’un vol.</strong> Copiez régulièrement les fichiers téléchargés sur une clé USB, un disque externe ou un espace en ligne (Google Drive). La restauration se fait avec le script <code>scripts/restore-db.ps1</code> (voir DEPLOY.md) ; ne restaurez qu’avec l’aide de la personne responsable de l’informatique.
            </Notice>
        </AdminLayout>
    );
}
