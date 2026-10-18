import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { estEspacePersonnel } from '../constants/routes';
import { useLang } from '../i18n/LangContext';

const TITRES = {
    '/': 'Accueil',
    '/services': 'Nos services',
    '/prendre-rdv': 'Prendre rendez-vous',
    '/mes-rdv': 'Mes rendez-vous',
};

/** Donne à chaque page un titre d'onglet clair (« Prendre rendez-vous — CASAFAMI »), traduit sur le site public. */
export default function TitrePage() {
    const { pathname } = useLocation();
    const { t } = useLang();
    useEffect(() => {
        const titre = TITRES[pathname] ? t(TITRES[pathname]) : (estEspacePersonnel(pathname) ? 'Espace du personnel' : null);
        document.title = titre ? `${titre} — CASAFAMI` : 'CASAFAMI';
    }, [pathname, t]);
    return null;
}
