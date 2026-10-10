import axiosClient from './axiosClient';

export async function downloadRendezVousPdf(rendezVous) {
    try {
        const accessToken = localStorage.getItem(`rdv-access-${rendezVous.id}`);
        const response = await axiosClient.get(`/rendez-vous/${rendezVous.id}/pdf`, {
            responseType: 'blob',
            headers: accessToken ? { 'X-RDV-Access-Token': accessToken } : {},
        });
        const url = URL.createObjectURL(new Blob([response.data], { type: 'application/pdf' }));
        const anchor = window.document.createElement('a');
        anchor.href = url;
        anchor.download = `rdv-${rendezVous.id}-${rendezVous.dateRdv}.pdf`;
        window.document.body.appendChild(anchor);
        anchor.click();
        anchor.remove();
        window.setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch (error) {
        console.error('Erreur lors du téléchargement du PDF', error);
        if (error.response?.status === 404) throw new Error('Ce rendez-vous est introuvable ou a été supprimé.', { cause: error });
        if (error.response?.status === 403) throw new Error('Vous ne pouvez pas télécharger le PDF de ce rendez-vous.', { cause: error });
        throw new Error('Le téléchargement du PDF a échoué. Réessayez plus tard.', { cause: error });
    }
}
