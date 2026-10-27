import { useEffect, useState } from 'react';
import { Download, Share, X } from 'lucide-react';
import { useLang } from '../i18n/LangContext';

const CLE = 'pwa-banniere-masquee';
const DELAI_MASQUAGE = 7 * 24 * 3600 * 1000;   // « Plus tard » : le message revient au bout de 7 jours

const dejaMasquee = () => {
    try { return Date.now() - Number(localStorage.getItem(CLE) || 0) < DELAI_MASQUAGE; }
    catch { return false; }
};
// déjà ouverte comme application installée : rien à proposer
const ouverteCommeApplication = () => window.matchMedia?.('(display-mode: standalone)').matches || window.navigator.standalone === true;
// iPhone / iPad dans Safari : pas d'invitation automatique, l'installation se fait par le bouton Partager
const estIos = () => /iphone|ipad|ipod/i.test(window.navigator.userAgent) && !/crios|fxios|edgios/i.test(window.navigator.userAgent);

/**
 * Message « Installer CASAFAMI » en bas de l'écran du site public, quelques secondes après l'arrivée.
 * Chrome / Edge / Android : bouton « Installer » (invitation du navigateur, gardée par main.jsx).
 * iPhone : explication « Partager → Sur l'écran d'accueil ». « Plus tard » le cache 7 jours.
 */
export default function BanniereInstallation() {
    const { t } = useLang();
    const [invite, setInvite] = useState(() => window.invitationInstallation || null);
    const [visible, setVisible] = useState(false);
    const ios = estIos();

    useEffect(() => {
        if (ouverteCommeApplication() || dejaMasquee()) return undefined;
        const garder = evenement => { evenement.preventDefault(); window.invitationInstallation = evenement; setInvite(evenement); };
        const installee = () => { window.invitationInstallation = null; setInvite(null); setVisible(false); };
        window.addEventListener('beforeinstallprompt', garder);
        window.addEventListener('appinstalled', installee);
        const minuteur = window.setTimeout(() => setVisible(true), 3000);
        return () => { window.removeEventListener('beforeinstallprompt', garder); window.removeEventListener('appinstalled', installee); window.clearTimeout(minuteur); };
    }, []);

    if (!visible || (!invite && !ios)) return null;

    const plusTard = () => {
        try { localStorage.setItem(CLE, String(Date.now())); } catch { /* le message reviendra à la prochaine visite */ }
        setVisible(false);
    };
    const installer = async () => {
        invite.prompt();
        await invite.userChoice.catch(() => null);
        window.invitationInstallation = null;
        setInvite(null);
        setVisible(false);
    };

    return (
        <div role="dialog" aria-labelledby="pwa-titre" className="fixed inset-x-4 bottom-4 z-[60] mx-auto max-w-md animate-fade-in-up rounded-2xl border border-slate-200 bg-white p-4 text-slate-800 shadow-2xl sm:inset-x-auto sm:right-6 sm:bottom-6 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100">
            <div className="flex items-start gap-3">
                <img src="/pwa-192.png" alt="" className="h-12 w-12 shrink-0 rounded-xl border border-slate-200 dark:border-gray-700" />
                <div className="min-w-0 flex-1">
                    <p id="pwa-titre" className="font-bold">{t("Installer CASAFAMI")}</p>
                    <p className="mt-0.5 text-sm text-slate-600 dark:text-gray-300">
                        {ios
                            ? <>{t("Appuyez sur")} <Share className="inline h-4 w-4 align-text-bottom" aria-label={t("Partager")} /> {t("puis « Sur l’écran d’accueil » pour l’avoir comme une application.")}</>
                            : t("Ajoutez le cabinet sur votre écran d’accueil : prise de rendez-vous en un geste, même avec une connexion faible.")}
                    </p>
                </div>
                <button type="button" onClick={plusTard} aria-label={t("Fermer")} className="rounded-full p-1 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-gray-800"><X className="h-5 w-5" /></button>
            </div>
            <div className="mt-3 flex justify-end gap-2">
                <button type="button" onClick={plusTard} className="rounded-xl px-4 py-2 text-sm font-semibold text-slate-600 transition hover:bg-slate-100 dark:text-gray-300 dark:hover:bg-gray-800">{t("Plus tard")}</button>
                {invite && <button type="button" onClick={installer} className="inline-flex items-center gap-2 rounded-xl bg-(--mt-main) px-4 py-2 text-sm font-bold text-white transition hover:opacity-90"><Download className="h-4 w-4" aria-hidden="true" />{t("Installer")}</button>}
            </div>
        </div>
    );
}
