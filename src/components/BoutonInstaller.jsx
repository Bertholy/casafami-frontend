import { useEffect, useState } from 'react';
import { Download } from 'lucide-react';
import { useLang } from '../i18n/LangContext';

/**
 * « Installer l'application » : n'apparaît que lorsque le navigateur propose l'installation (Chrome, Edge, Android)
 * et que le site n'est pas déjà ouvert comme application. Sur iPhone, l'installation passe par « Partager → Sur l'écran d'accueil ».
 */
export default function BoutonInstaller({ className = '' }) {
    const { t } = useLang();
    // invitation déjà reçue au démarrage (gardée par main.jsx), ou reçue plus tard
    const [invite, setInvite] = useState(() => window.invitationInstallation || null);

    useEffect(() => {
        const garder = evenement => { evenement.preventDefault(); setInvite(evenement); };
        const installee = () => { window.invitationInstallation = null; setInvite(null); };
        window.addEventListener('beforeinstallprompt', garder);
        window.addEventListener('appinstalled', installee);
        return () => { window.removeEventListener('beforeinstallprompt', garder); window.removeEventListener('appinstalled', installee); };
    }, []);

    if (!invite) return null;
    const installer = async () => {
        invite.prompt();
        await invite.userChoice.catch(() => null);
        window.invitationInstallation = null;   // une invitation ne sert qu'une fois
        setInvite(null);
    };
    return (
        <button type="button" onClick={installer} className={`inline-flex items-center gap-2 ${className}`}>
            <Download className="h-4 w-4" aria-hidden="true" />{t("Installer l’application")}
        </button>
    );
}
