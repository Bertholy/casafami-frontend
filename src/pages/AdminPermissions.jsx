import { useCallback, useEffect, useMemo, useState } from 'react';
import { SkeletonPage } from '../components/ui/skeleton';
import { useNavigate } from 'react-router-dom';
import { CheckCircle2, Lock, RotateCcw, ShieldCheck, UserRound, UsersRound } from 'lucide-react';
import axiosClient from '../api/axiosClient';
import AdminLayout from '../components/AdminLayout';
import { Switch } from '../components/ui/switch';
import Notice from '../components/Notice';
import { btnSecondary, card } from '../constants/ui';
import { getRoleLabel } from '../constants/app';
import { apiErrorMessage, getRole, hasSession, homeForRole, LOGIN_PATH, peut } from '../utils/auth';

const onglets = [['roles', 'Par rôle', UsersRound], ['personnes', 'Par personne', UserRound]];

/** Regroupe le catalogue par thème (Rendez-vous, Patients…) en gardant l'ordre du serveur. */
function parGroupe(catalogue) {
    const groupes = [];
    catalogue.forEach(permission => {
        let groupe = groupes.find(g => g.nom === permission.groupe);
        if (!groupe) { groupe = { nom: permission.groupe, permissions: [] }; groupes.push(groupe); }
        groupe.permissions.push(permission);
    });
    return groupes;
}

/**
 * « Rôles et permissions » (super administrateur) : qui a le droit de faire quoi.
 * Les droits d'un rôle valent pour toutes les personnes de ce rôle ; une exception personnelle accorde ou retire un droit à une seule personne.
 * Chaque changement est enregistré tout de suite, appliqué par le serveur et inscrit au journal d'audit.
 */
export default function AdminPermissions() {
    const navigate = useNavigate();
    const [vue, setVue] = useState(null);
    const [onglet, setOnglet] = useState('roles');
    const [personneId, setPersonneId] = useState(null);
    const [occupe, setOccupe] = useState('');
    const [error, setError] = useState('');
    const [notice, setNotice] = useState('');

    const load = useCallback(async () => {
        try { const { data } = await axiosClient.get('/admin/permissions'); setVue(data); }
        catch (err) { setError(apiErrorMessage(err, 'Impossible de charger les droits.')); }
    }, []);

    useEffect(() => {
        const role = getRole();
        if (!hasSession()) { navigate(LOGIN_PATH); return undefined; }
        if (!peut('PERMISSIONS_GERER')) { navigate(homeForRole(role)); return undefined; }
        const timer = window.setTimeout(load, 0);
        return () => window.clearTimeout(timer);
    }, [load, navigate]);

    const groupes = useMemo(() => parGroupe(vue?.catalogue || []), [vue]);
    const personnes = vue?.personnes || [];
    const personne = personnes.find(p => p.id === personneId) || personnes.find(p => p.role !== 'SUPER_ADMIN') || null;

    const appliquer = async (cle, requete, message) => {
        setOccupe(cle); setError(''); setNotice('');
        try { const { data } = await requete(); setVue(data); setNotice(message); }
        catch (err) { setError(apiErrorMessage(err, 'Le changement n’a pas pu être enregistré.')); }
        finally { setOccupe(''); }
    };

    const basculerRole = (role, code) => {
        const droits = new Set(role.permissions);
        if (droits.has(code)) droits.delete(code); else droits.add(code);
        appliquer(`${role.role}:${code}`, () => axiosClient.put(`/admin/permissions/roles/${role.role}`, { permissions: [...droits] }), `Droits des ${getRoleLabel(role.role).toLowerCase()}s enregistrés.`);
    };

    const retablirRole = role => {
        if (!window.confirm(`Rétablir les droits d’origine pour tous les ${getRoleLabel(role.role).toLowerCase()}s ?`)) return;
        appliquer(`reset:${role.role}`, () => axiosClient.post(`/admin/permissions/roles/${role.role}/defauts`), `Droits d’origine rétablis pour les ${getRoleLabel(role.role).toLowerCase()}s.`);
    };

    const changerException = (cible, code, valeur) => {
        const accorde = valeur === 'oui' ? true : valeur === 'non' ? false : null;
        appliquer(`${cible.id}:${code}`, () => axiosClient.put(`/admin/permissions/utilisateurs/${cible.id}`, { code, accorde }), `Droits de ${cible.nom} enregistrés.`);
    };

    const retablirPersonne = cible => {
        if (!window.confirm(`Supprimer toutes les exceptions de ${cible.nom} ? Elle aura de nouveau les droits de son rôle.`)) return;
        appliquer(`reset:${cible.id}`, () => axiosClient.post(`/admin/permissions/utilisateurs/${cible.id}/defauts`), `${cible.nom} a de nouveau les droits de son rôle.`);
    };

    const roles = vue?.roles || [];

    return (
        <AdminLayout title="Rôles et permissions" subtitle="Décidez qui peut faire quoi dans le cabinet">
            <Notice tone="success" onClose={() => setNotice('')}>{notice}</Notice>
            <Notice tone="error" onClose={() => setError('')}>{error}</Notice>
            <Notice tone="info">
                <strong>Le super administrateur a toujours tous les droits.</strong> Les droits cochés pour un rôle s’appliquent à toutes les personnes de ce rôle ; l’onglet « Par personne » permet une exception pour une seule personne. Chaque changement est enregistré tout de suite et inscrit au journal d’audit ; la personne le voit dès qu’elle change de page.
            </Notice>

            <div role="tablist" aria-label="Type de réglage" className="inline-flex rounded-xl bg-slate-100 p-1 dark:bg-gray-800">
                {onglets.map(([cle, libelle, Icone]) => (
                    <button key={cle} role="tab" aria-selected={onglet === cle} onClick={() => setOnglet(cle)}
                        className={`inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition ${onglet === cle ? 'bg-white text-teal-800 shadow-sm dark:bg-gray-950 dark:text-teal-300' : 'text-slate-600 hover:text-slate-900 dark:text-gray-400'}`}>
                        <Icone size={16} />{libelle}
                    </button>
                ))}
            </div>

            {!vue && !error && <SkeletonPage />}

            {vue && onglet === 'roles' && (
                <section className={`${card} overflow-x-auto`} aria-label="Droits par rôle">
                    <table className="w-full min-w-[44rem] text-sm">
                        <thead>
                            <tr className="border-b border-slate-200 bg-slate-50/80 text-left dark:border-gray-800 dark:bg-gray-900">
                                <th scope="col" className="px-4 py-3 font-semibold">Droit</th>
                                <th scope="col" className="w-28 px-2 py-3 text-center font-semibold"><span className="flex flex-col items-center gap-0.5"><ShieldCheck size={16} className="text-teal-700" />Super admin</span></th>
                                {roles.map(role => (
                                    <th key={role.role} scope="col" className="w-28 px-2 py-3 text-center font-semibold">
                                        <div>{getRoleLabel(role.role)}</div>
                                        <div className="text-[11px] font-normal text-slate-500 dark:text-gray-400">{role.personnes} personne{role.personnes > 1 ? 's' : ''}</div>
                                        {role.modifie && (
                                            <button onClick={() => retablirRole(role)} disabled={Boolean(occupe)} title="Rétablir les droits d’origine de ce rôle"
                                                className="mt-1 inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-semibold text-amber-800 transition hover:bg-amber-200 disabled:opacity-50 dark:bg-amber-500/15 dark:text-amber-300">
                                                <RotateCcw size={11} />Modifié · rétablir
                                            </button>
                                        )}
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {groupes.map(groupe => (
                                <GroupeRoles key={groupe.nom} groupe={groupe} roles={roles} occupe={occupe} onBasculer={basculerRole} />
                            ))}
                        </tbody>
                    </table>
                </section>
            )}

            {vue && onglet === 'personnes' && (
                <div className="grid gap-6 lg:grid-cols-[18rem_1fr]">
                    <section className={`${card} h-fit overflow-hidden`} aria-label="Personnes">
                        <h2 className="border-b border-slate-200 px-4 py-3 text-sm font-semibold dark:border-gray-800">Personnes</h2>
                        <ul className="max-h-[32rem] divide-y divide-slate-100 overflow-y-auto dark:divide-gray-800">
                            {personnes.map(p => {
                                const nbExceptions = Object.keys(p.exceptions || {}).length;
                                return (
                                    <li key={p.id}>
                                        <button onClick={() => setPersonneId(p.id)} aria-current={personne?.id === p.id}
                                            className={`flex w-full items-center gap-3 px-4 py-3 text-left transition hover:bg-slate-50 dark:hover:bg-gray-800 ${personne?.id === p.id ? 'bg-teal-50 dark:bg-teal-500/10' : ''}`}>
                                            <span className="min-w-0 flex-1">
                                                <span className="block truncate text-sm font-medium">{p.nom}</span>
                                                <span className="block truncate text-xs text-slate-500 dark:text-gray-400">{getRoleLabel(p.role)}</span>
                                            </span>
                                            {nbExceptions > 0 && <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-semibold text-amber-800 dark:bg-amber-500/15 dark:text-amber-300">{nbExceptions} exception{nbExceptions > 1 ? 's' : ''}</span>}
                                        </button>
                                    </li>
                                );
                            })}
                        </ul>
                    </section>

                    {personne ? (
                        <section className={`${card} overflow-hidden`} aria-label={`Droits de ${personne.nom}`}>
                            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 px-5 py-4 dark:border-gray-800">
                                <div>
                                    <h2 className="font-semibold">{personne.nom}</h2>
                                    <p className="text-sm text-slate-500 dark:text-gray-400">{personne.email} · {getRoleLabel(personne.role)}</p>
                                </div>
                                {personne.role !== 'SUPER_ADMIN' && Object.keys(personne.exceptions || {}).length > 0 && (
                                    <button onClick={() => retablirPersonne(personne)} disabled={Boolean(occupe)} className={btnSecondary}><RotateCcw size={15} />Supprimer les exceptions</button>
                                )}
                            </div>
                            {personne.role === 'SUPER_ADMIN' ? (
                                <p className="flex items-center gap-2 p-6 text-sm text-slate-600 dark:text-gray-300"><ShieldCheck size={18} className="text-teal-700" />Le super administrateur a toujours tous les droits : rien à régler ici.</p>
                            ) : (
                                <div>
                                    {groupes.map(groupe => (
                                        <div key={groupe.nom}>
                                            <h3 className="bg-slate-50 px-5 py-2 text-xs font-semibold uppercase tracking-widest text-slate-500 dark:bg-gray-900 dark:text-gray-400">{groupe.nom}</h3>
                                            <ul className="divide-y divide-slate-100 dark:divide-gray-800">
                                                {groupe.permissions.map(permission => {
                                                    const role = roles.find(r => r.role === personne.role);
                                                    const duRole = Boolean(role?.permissions.includes(permission.code));
                                                    const exception = personne.exceptions?.[permission.code];
                                                    const valeur = exception === undefined ? 'role' : exception ? 'oui' : 'non';
                                                    const effectif = personne.effectives.includes(permission.code);
                                                    return (
                                                        <li key={permission.code} className="flex flex-wrap items-center gap-3 px-5 py-3">
                                                            <div className="min-w-0 flex-1">
                                                                <p className="flex items-center gap-2 text-sm font-medium">{permission.libelle}
                                                                    <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${effectif ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-500/15 dark:text-emerald-300' : 'bg-slate-100 text-slate-600 dark:bg-gray-800 dark:text-gray-400'}`}>{effectif ? 'Autorisé' : 'Non autorisé'}</span>
                                                                </p>
                                                                <p className="text-xs text-slate-500 dark:text-gray-400">{permission.description}</p>
                                                            </div>
                                                            {permission.verrouille ? (
                                                                <span className="inline-flex items-center gap-1 text-xs text-slate-500" title="Réservé au super administrateur"><Lock size={13} />Réservé au super admin</span>
                                                            ) : (
                                                                <div className="flex items-center gap-3">
                                                                    <span className={`text-right text-xs ${valeur === 'role' ? 'text-slate-500 dark:text-gray-400' : 'font-semibold text-amber-700 dark:text-amber-300'}`}>
                                                                        {valeur === 'role' ? 'Selon le rôle' : valeur === 'oui' ? 'Accordé en plus' : 'Retiré'}
                                                                    </span>
                                                                    {/* l'interrupteur montre le droit réel ; s'il redevient celui du rôle, l'exception disparaît */}
                                                                    <Switch checked={effectif} disabled={Boolean(occupe)} signale={valeur !== 'role'} label={`${permission.libelle} pour ${personne.nom}`}
                                                                        onCheckedChange={nouveau => changerException(personne, permission.code, nouveau === duRole ? 'role' : nouveau ? 'oui' : 'non')} />
                                                                </div>
                                                            )}
                                                        </li>
                                                    );
                                                })}
                                            </ul>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </section>
                    ) : <p className="p-8 text-center text-sm text-slate-500">Aucune personne à régler.</p>}
                </div>
            )}
            {occupe && <p className="sr-only" role="status">Enregistrement…</p>}
        </AdminLayout>
    );
}

function GroupeRoles({ groupe, roles, occupe, onBasculer }) {
    return (
        <>
            <tr className="bg-slate-50 dark:bg-gray-900"><th colSpan={2 + roles.length} scope="colgroup" className="px-4 py-2 text-left text-xs font-semibold uppercase tracking-widest text-slate-500 dark:text-gray-400">{groupe.nom}</th></tr>
            {groupe.permissions.map(permission => (
                <tr key={permission.code} className="border-b border-slate-100 dark:border-gray-800">
                    <th scope="row" className="px-4 py-3 text-left font-normal">
                        <span className="block font-medium">{permission.libelle}</span>
                        <span className="block text-xs text-slate-500 dark:text-gray-400">{permission.description}</span>
                    </th>
                    <td className="px-2 py-3 text-center"><CheckCircle2 size={18} className="mx-auto text-teal-600" aria-label="Toujours autorisé" /></td>
                    {roles.map(role => (
                        <td key={role.role} className="px-2 py-3 text-center">
                            {permission.verrouille
                                ? <span title="Réservé au super administrateur" className="inline-flex text-slate-400"><Lock size={15} aria-label="Réservé au super administrateur" /></span>
                                : <input type="checkbox" className="h-4 w-4 accent-teal-700" checked={role.permissions.includes(permission.code)} disabled={Boolean(occupe)}
                                    onChange={() => onBasculer(role, permission.code)} aria-label={`${permission.libelle} — ${getRoleLabel(role.role)}`} />}
                        </td>
                    ))}
                </tr>
            ))}
        </>
    );
}
