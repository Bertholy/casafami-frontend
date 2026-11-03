import { useState } from 'react';
import { Bell, Camera, Globe, KeyRound, Loader2, Monitor, Settings, ShieldCheck, UserRound, Volume2, X } from 'lucide-react';
import axiosClient from '../api/axiosClient';
import ChampMotDePasse from './ChampMotDePasse';
import { Dialog, DialogContent, DialogDescription, DialogTitle } from './ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Switch } from './ui/switch';
import { useTheme } from '../context/ThemeContext';
import { STYLES_PROPOSES } from '../utils/stylePersonnel';
import { apiErrorMessage, getEmail, peut } from '../utils/auth';
import { DUREES_INACTIVITE, definirInactiviteMinutes, definirSonNotifications, reafficherMessageDeGarde, sonNotificationsActif } from '../utils/preferences';
import { sonNotification } from '../utils/son';
import { toast } from '../lib/toast';

const champ = 'mt-1.5 w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm font-normal text-foreground outline-none transition focus:border-teal-600 focus:ring-2 focus:ring-teal-600/20';
const bouton = 'inline-flex items-center gap-2 rounded-lg border border-border px-3 py-1.5 text-sm font-medium transition hover:bg-accent disabled:opacity-60';
const principal = 'inline-flex items-center gap-2 rounded-xl bg-teal-700 px-4 py-2 text-sm font-semibold text-white transition hover:bg-teal-800 disabled:opacity-50';

/** Une ligne de réglage : le titre et son explication à gauche, le réglage à droite. */
function Ligne({ titre, aide, children }) {
    return (
        <div className="flex items-center justify-between gap-4 py-3">
            <div className="min-w-0"><p className="text-sm font-medium text-foreground">{titre}</p>{aide && <p className="mt-0.5 text-xs text-muted-foreground">{aide}</p>}</div>
            <div className="shrink-0">{children}</div>
        </div>
    );
}

/** Un groupe de boutons exclusifs (un seul choix à la fois), comme des onglets. */
function Choix({ valeur, options, onChoisir, label }) {
    return (
        <div role="group" aria-label={label} className="inline-flex rounded-lg border border-border bg-card p-0.5">
            {options.map(([code, nom]) => (
                <button key={code} type="button" aria-pressed={valeur === code} onClick={() => onChoisir(code)}
                    className="rounded-md px-3 py-1 text-xs font-semibold text-muted-foreground outline-none transition hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring aria-pressed:bg-primary aria-pressed:text-primary-foreground">{nom}</button>
            ))}
        </div>
    );
}

/** Nom et téléphone : chacun corrige les siens (l'e-mail et le rôle sont gérés par l'administration). */
function Informations({ profile, onProfil }) {
    const [nom, setNom] = useState(profile?.nom || '');
    const [telephone, setTelephone] = useState(profile?.telephone || '');
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');
    const submit = async event => {
        event.preventDefault(); setError(''); setSaving(true);
        try {
            const { data } = await axiosClient.put('/profile', { nom, telephone });
            onProfil(data);
            toast.success('Vos informations sont enregistrées.');
        } catch (err) { setError(apiErrorMessage(err, 'Enregistrement impossible.')); }
        finally { setSaving(false); }
    };
    return (
        <form onSubmit={submit} className="space-y-3 border-t border-border px-5 py-4" aria-labelledby="param-infos">
            <h3 id="param-infos" className="flex items-center gap-2 text-sm font-semibold text-foreground"><UserRound size={15} aria-hidden="true" />Mes informations</h3>
            <label className="block text-sm font-medium">Nom complet<input required maxLength={100} value={nom} onChange={e => setNom(e.target.value)} className={champ} /></label>
            <label className="block text-sm font-medium">Téléphone (facultatif)<input type="tel" maxLength={20} value={telephone} onChange={e => setTelephone(e.target.value)} className={champ} /></label>
            <p className="text-xs text-muted-foreground">Adresse e-mail : <strong className="font-medium text-foreground">{profile?.email}</strong>. Elle et votre rôle sont modifiés par l’administration.</p>
            {error && <p role="alert" className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700 dark:bg-rose-500/10 dark:text-rose-300">{error}</p>}
            <div className="flex justify-end"><button disabled={saving} className={principal}>{saving && <Loader2 size={15} className="animate-spin" />}Enregistrer</button></div>
        </form>
    );
}

/** Changement de son propre mot de passe (l'ancien est demandé). */
function MotDePasse() {
    const VIDE = { ancienMotDePasse: '', nouveauMotDePasse: '', confirmation: '' };
    const [form, setForm] = useState(VIDE);
    const [error, setError] = useState('');
    const [saving, setSaving] = useState(false);
    const submit = async event => {
        event.preventDefault(); setError('');
        if (form.nouveauMotDePasse !== form.confirmation) { setError('La confirmation ne correspond pas au nouveau mot de passe.'); return; }
        setSaving(true);
        try {
            await axiosClient.put('/profile/password', { ancienMotDePasse: form.ancienMotDePasse, nouveauMotDePasse: form.nouveauMotDePasse });
            toast.success('Mot de passe modifié.');
            setForm(VIDE);
        } catch (err) { setError(apiErrorMessage(err, 'Changement impossible.')); }
        finally { setSaving(false); }
    };
    return (
        <form onSubmit={submit} className="space-y-3 border-t border-border px-5 py-4" aria-labelledby="param-mdp">
            <h3 id="param-mdp" className="flex items-center gap-2 text-sm font-semibold text-foreground"><KeyRound size={15} aria-hidden="true" />Mon mot de passe</h3>
            <label className="block text-sm font-medium">Mot de passe actuel<ChampMotDePasse required autoComplete="current-password" value={form.ancienMotDePasse} onChange={e => setForm({ ...form, ancienMotDePasse: e.target.value })} className={champ} /></label>
            <label className="block text-sm font-medium">Nouveau mot de passe (10 caractères minimum)<ChampMotDePasse required minLength={10} maxLength={72} autoComplete="new-password" value={form.nouveauMotDePasse} onChange={e => setForm({ ...form, nouveauMotDePasse: e.target.value })} className={champ} /></label>
            <label className="block text-sm font-medium">Confirmer le nouveau mot de passe<ChampMotDePasse required minLength={10} maxLength={72} autoComplete="new-password" value={form.confirmation} onChange={e => setForm({ ...form, confirmation: e.target.value })} className={champ} /></label>
            {error && <p role="alert" className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700 dark:bg-rose-500/10 dark:text-rose-300">{error}</p>}
            <div className="flex justify-end"><button disabled={saving} className={principal}>{saving && <Loader2 size={15} className="animate-spin" />}Changer le mot de passe</button></div>
        </form>
    );
}

/** Thème, style et menu : ils s'appliquent tout de suite et sont gardés sur cet appareil. */
function Affichage({ style, choisirStyle, menuFixe, basculerMenu }) {
    const { theme, toggleTheme } = useTheme();
    return (
        <div className="divide-y divide-border px-5 py-2">
            <Ligne titre="Thème" aide="Clair ou sombre."><Choix label="Thème" valeur={theme} options={[['light', 'Clair'], ['dark', 'Sombre']]} onChoisir={voulu => { if (voulu !== theme) toggleTheme(); }} /></Ligne>
            <Ligne titre="Style de l’espace" aide="L’aspect des cartes et du menu."><Choix label="Style" valeur={style} options={STYLES_PROPOSES} onChoisir={choisirStyle} /></Ligne>
            <Ligne titre="Garder le menu ouvert" aide="Sinon il se réduit aux icônes et s’élargit au survol."><Switch label="Garder le menu latéral ouvert" checked={menuFixe} onCheckedChange={basculerMenu} /></Ligne>
        </div>
    );
}

function Notifications() {
    const [son, setSon] = useState(sonNotificationsActif);
    const changerSon = actif => { setSon(actif); definirSonNotifications(actif); if (actif) sonNotification(); };
    const peutGarde = peut('GARDE_VOIR');
    return (
        <div className="divide-y divide-border px-5 py-2">
            <Ligne titre="Son des nouvelles notifications" aide="Un petit son quand une nouvelle demande ou une attribution arrive.">
                <div className="flex items-center gap-3">
                    <button type="button" onClick={sonNotification} aria-label="Écouter le son" title="Écouter le son" className="rounded-lg p-1.5 text-muted-foreground transition hover:bg-accent"><Volume2 size={17} aria-hidden="true" /></button>
                    <Switch label="Son des nouvelles notifications" checked={son} onCheckedChange={changerSon} />
                </div>
            </Ligne>
            {peutGarde && (
                <Ligne titre="Message « Vous êtes de garde »" aide="Fermé avec « OK » ou « Ne me rappelez pas » ? Il revient à votre prochaine ouverture.">
                    <button type="button" className={bouton} onClick={() => {
                        reafficherMessageDeGarde(getEmail());
                        toast.success('Le message de garde s’affichera de nouveau à la prochaine ouverture de votre espace, les jours où vous êtes de garde.');
                    }}>Le réafficher</button>
                </Ligne>
            )}
        </div>
    );
}

function Securite({ inactivite, onInactivite }) {
    return (
        <div className="px-5 py-2">
            <Ligne titre="Déconnexion automatique" aide="Après ce temps sans toucher à l’écran, votre session se ferme : utile sur un ordinateur partagé à l’accueil.">
                <select aria-label="Déconnexion automatique après" value={inactivite} onChange={e => { const minutes = Number(e.target.value); definirInactiviteMinutes(minutes); onInactivite(minutes); }}
                    className="rounded-lg border border-border bg-background px-2.5 py-1.5 text-sm text-foreground outline-none focus:border-teal-600 focus:ring-2 focus:ring-teal-600/20">
                    {DUREES_INACTIVITE.map(([minutes, nom]) => <option key={minutes} value={minutes}>{nom}</option>)}
                </select>
            </Ligne>
        </div>
    );
}

/**
 * Paramètres du compte, en quatre onglets : Compte (photo, informations, mot de passe), Affichage, Notifications, Sécurité.
 * Compte est enregistré sur le serveur ; les trois autres sont gardés sur cet appareil.
 */
export default function ParametresDialog({ open, onOpenChange, avatar, profile, nom, role, uploading, onChoisirPhoto, onProfil, style, choisirStyle, menuFixe, basculerMenu, inactivite, onInactivite }) {
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="top-[6vh] max-h-[88vh] max-w-lg overflow-y-auto p-0">
                <div className="flex items-start justify-between gap-3 px-5 pb-3 pt-4">
                    <div>
                        <DialogTitle className="flex items-center gap-2 text-base font-semibold text-foreground"><Settings size={17} aria-hidden="true" />Paramètres</DialogTitle>
                        <DialogDescription className="mt-1 text-sm text-muted-foreground">Votre compte, l’affichage, les notifications et la sécurité.</DialogDescription>
                    </div>
                    <button type="button" onClick={() => onOpenChange(false)} aria-label="Fermer" className="rounded-lg p-1.5 text-muted-foreground transition hover:bg-accent"><X size={18} /></button>
                </div>
                <Tabs defaultValue="compte">
                    <div className="px-5"><TabsList aria-label="Rubriques des paramètres" className="w-full">
                        <TabsTrigger value="compte" className="flex-1"><UserRound size={13} className="mr-1 inline" aria-hidden="true" />Compte</TabsTrigger>
                        <TabsTrigger value="affichage" className="flex-1"><Monitor size={13} className="mr-1 inline" aria-hidden="true" />Affichage</TabsTrigger>
                        <TabsTrigger value="notifications" className="flex-1"><Bell size={13} className="mr-1 inline" aria-hidden="true" />Notifications</TabsTrigger>
                        <TabsTrigger value="securite" className="flex-1"><ShieldCheck size={13} className="mr-1 inline" aria-hidden="true" />Sécurité</TabsTrigger>
                    </TabsList></div>
                    <TabsContent value="compte" className="mt-3 outline-none">
                        <section className="px-5 pb-4" aria-labelledby="param-photo">
                            <h3 id="param-photo" className="flex items-center gap-2 text-sm font-semibold text-foreground"><Camera size={15} aria-hidden="true" />Ma photo</h3>
                            <div className="mt-3 flex items-center gap-4">
                                {uploading ? <span className="flex h-16 w-16 items-center justify-center"><Loader2 size={20} className="animate-spin" /></span> : avatar('h-16 w-16')}
                                <div className="min-w-0 flex-1">
                                    <p className="truncate text-sm font-medium text-foreground">{nom}</p>
                                    <p className="truncate text-xs text-muted-foreground">{role}</p>
                                    <button type="button" onClick={onChoisirPhoto} disabled={uploading} className={`${bouton} mt-2`}><Camera size={15} aria-hidden="true" />Changer ma photo</button>
                                </div>
                            </div>
                        </section>
                        <Informations profile={profile} onProfil={onProfil} />
                        <MotDePasse />
                    </TabsContent>
                    <TabsContent value="affichage" className="mt-2 outline-none"><Affichage style={style} choisirStyle={choisirStyle} menuFixe={menuFixe} basculerMenu={basculerMenu} /></TabsContent>
                    <TabsContent value="notifications" className="mt-2 outline-none"><Notifications /></TabsContent>
                    <TabsContent value="securite" className="mt-2 outline-none"><Securite inactivite={inactivite} onInactivite={onInactivite} /></TabsContent>
                </Tabs>
                <p className="flex items-center gap-1.5 border-t border-border px-5 py-3 text-xs text-muted-foreground"><Globe size={12} aria-hidden="true" />L’affichage, les notifications et la sécurité sont gardés sur cet appareil ; le compte l’est sur le serveur.</p>
            </DialogContent>
        </Dialog>
    );
}
