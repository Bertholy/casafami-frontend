import { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import axiosClient from '../api/axiosClient';
import { toast } from '../lib/toast';
import { apiErrorMessage, peut } from '../utils/auth';

/**
 * Ouvre le patient correspondant à une clé de suivi lue dans un QR code (personnel connecté) :
 * son dossier si on a le droit de le lire, sinon la page « Mes RDV » de ce rendez-vous.
 */
export default function useOuvrirParCle() {
    const navigate = useNavigate();
    return useCallback(async cle => {
        try {
            const { data } = await axiosClient.get(`/rdv/suivi/${encodeURIComponent(cle)}`);
            toast.success(`QR code lu : ${data.nomClient}`);
            navigate(peut('DOSSIERS_LIRE')
                ? `/patients/dossier?telephone=${encodeURIComponent(data.telephoneClient)}`
                : `/mes-rdv?cle=${encodeURIComponent(cle)}`);
        } catch (erreur) {
            toast.error(apiErrorMessage(erreur, 'Aucun rendez-vous ne correspond à ce QR code.'));
        }
    }, [navigate]);
}
