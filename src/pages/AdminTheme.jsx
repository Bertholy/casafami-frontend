import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Save, RotateCcw } from 'lucide-react';
import axiosClient from '../api/axiosClient';
import AdminLayout from '../components/AdminLayout';
import { useTheme } from '../context/ThemeContext';
import { apiErrorMessage, getRole, hasSession, homeForRole, LOGIN_PATH, peut } from '../utils/auth';

const labels = { primaryColor: 'Couleur principale', secondaryColor: 'Couleur secondaire', buttonColor: 'Boutons', linkColor: 'Liens', backgroundColor: 'Fond', panelColor: 'Cartes et panneaux', textColor: 'Texte', navColor: 'Barre de navigation', sidebarColor: 'Barre latérale', borderColor: 'Bordures et éléments interactifs' };
const palettes = [
    { name: 'Casafami', values: { primaryColor: '#0f766e', secondaryColor: '#14b8a6', buttonColor: '#0f766e', linkColor: '#0f766e', backgroundColor: '#ffffff', panelColor: '#f8fafc', textColor: '#1f2937', navColor: '#0f172a', sidebarColor: '#0f172a', borderColor: '#e2e8f0' } },
    { name: 'Bleu santé', values: { primaryColor: '#1d4ed8', secondaryColor: '#38bdf8', buttonColor: '#1d4ed8', linkColor: '#1d4ed8', backgroundColor: '#ffffff', panelColor: '#eff6ff', textColor: '#172554', navColor: '#172554', sidebarColor: '#172554', borderColor: '#bfdbfe' } },
    { name: 'Sauge', values: { primaryColor: '#4d7c0f', secondaryColor: '#84cc16', buttonColor: '#4d7c0f', linkColor: '#4d7c0f', backgroundColor: '#ffffff', panelColor: '#f7fee7', textColor: '#1a2e05', navColor: '#1a2e05', sidebarColor: '#1a2e05', borderColor: '#d9f99d' } },
];
const HEX = /^#[0-9a-fA-F]{6}$/;

export default function AdminTheme() {
    const navigate = useNavigate();
    const { siteTheme, setSiteTheme, defaultSiteTheme } = useTheme();
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        const role = getRole();
        if (!hasSession()) navigate(LOGIN_PATH);
        else if (!peut('SITE_MODIFIER')) navigate(homeForRole(role));
    }, [navigate]);

    const update = (key, value) => setSiteTheme(current => ({ ...current, [key]: value }));
    const invalid = Object.keys(labels).filter(key => !HEX.test(siteTheme[key] || ''));

    const save = async () => {
        if (invalid.length) { setError('Chaque couleur doit être un code HEX complet, par exemple #0f766e.'); return; }
        setSaving(true); setMessage(''); setError('');
        try { const { data } = await axiosClient.put('/theme', siteTheme); setSiteTheme(data); setMessage('Thème enregistré pour tous les visiteurs.'); }
        catch (e) { setError(apiErrorMessage(e, 'Enregistrement impossible.')); }
        finally { setSaving(false); }
    };
    const restore = async () => {
        setSiteTheme(defaultSiteTheme); setSaving(true); setError(''); setMessage('');
        try { const { data } = await axiosClient.put('/theme', defaultSiteTheme); setSiteTheme(data); setMessage('Thème par défaut restauré.'); }
        catch (e) { setError(apiErrorMessage(e, 'Restauration impossible.')); }
        finally { setSaving(false); }
    };
    const card = 'rounded-2xl border border-slate-200/80 bg-white shadow-sm dark:border-gray-800 dark:bg-gray-900';

    return (
        <AdminLayout title="Personnalisation du site" subtitle="Les couleurs s’appliquent en direct ; enregistrez pour les publier">
            {message && <div role="status" className="rounded-xl bg-emerald-50 p-3 text-sm text-emerald-800 dark:bg-emerald-500/10 dark:text-emerald-200">{message}</div>}
            {error && <div role="alert" className="rounded-xl bg-rose-50 p-3 text-sm text-rose-800 dark:bg-rose-500/10 dark:text-rose-200">{error}</div>}
            <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
                <section className={`${card} grid gap-4 p-5 sm:grid-cols-2`}>
                    {Object.entries(labels).map(([key, label]) => (
                        <label key={key} className="text-sm font-medium">{label}
                            <div className="mt-1 flex gap-2">
                                <input aria-label={`${label} sélecteur`} type="color" value={HEX.test(siteTheme[key] || '') ? siteTheme[key] : '#ffffff'} onChange={e => update(key, e.target.value)} className="h-11 w-14 cursor-pointer rounded-lg border p-1" />
                                <input aria-label={`${label} code HEX`} value={siteTheme[key] || ''} maxLength={7} onChange={e => update(key, e.target.value)}
                                    className={`min-w-0 flex-1 rounded-xl border px-3 py-2 dark:bg-gray-950 ${HEX.test(siteTheme[key] || '') ? 'dark:border-gray-700' : 'border-rose-400'}`} />
                            </div>
                        </label>
                    ))}
                    <div className="sm:col-span-2"><h2 className="mb-2 font-semibold">Palettes prédéfinies</h2><div className="flex flex-wrap gap-2">{palettes.map(p => <button key={p.name} onClick={() => setSiteTheme(p.values)} className="rounded-xl border px-3 py-2 text-sm transition hover:border-teal-600 dark:border-gray-700">{p.name}</button>)}</div></div>
                    <div className="flex flex-wrap gap-3 sm:col-span-2">
                        <button disabled={saving} onClick={save} className="inline-flex items-center gap-2 rounded-xl bg-teal-700 px-4 py-2.5 font-semibold text-white transition hover:bg-teal-800 disabled:opacity-50"><Save size={17} />Enregistrer les modifications</button>
                        <button disabled={saving} onClick={restore} className="inline-flex items-center gap-2 rounded-xl border px-4 py-2.5 dark:border-gray-700"><RotateCcw size={17} />Restaurer le thème par défaut</button>
                    </div>
                </section>
                <aside className="space-y-3 rounded-2xl border p-5" style={{ background: siteTheme.panelColor, color: siteTheme.textColor, borderColor: siteTheme.borderColor }}>
                    <h2 className="text-lg font-bold">Aperçu en temps réel</h2>
                    <p style={{ color: siteTheme.linkColor }}>Liens et couleurs du site</p>
                    <button className="rounded-xl px-4 py-2 font-semibold text-white" style={{ background: siteTheme.buttonColor }}>Bouton</button>
                    <div className="rounded-xl p-4" style={{ background: siteTheme.backgroundColor, border: `1px solid ${siteTheme.borderColor}` }}>Carte Casafami<br /><span style={{ color: siteTheme.secondaryColor }}>Couleur secondaire</span></div>
                </aside>
            </div>
        </AdminLayout>
    );
}
