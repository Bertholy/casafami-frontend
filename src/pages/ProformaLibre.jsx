import { useState } from 'react';
import { Link } from 'react-router-dom';
import { FilePlus2, UserRoundPlus } from 'lucide-react';
import AdminLayout from '../components/AdminLayout';
import ProformaPanel from '../components/dashboard/ProformaPanel';
import VoyantPatient from '../components/VoyantPatient';
import { SelectCivilite } from '../components/dashboard/ChoixSexe';
import { btnPrimary, btnSecondary, card, inputClass } from '../constants/ui';
import { formatPhone, formatPhoneInput } from '../utils/phone';

const CLE_COMPTEUR = 'proforma-compteur';

/** Numéro d'une proforma sans rendez-vous : PF-AAAA-MMJJ-NN, le NN repart de 01 chaque jour sur cet appareil. */
function nouveauNumero() {
    const maintenant = new Date();
    const jour = `${maintenant.getFullYear()}${String(maintenant.getMonth() + 1).padStart(2, '0')}${String(maintenant.getDate()).padStart(2, '0')}`;
    let n = 1;
    try {
        const brut = JSON.parse(localStorage.getItem(CLE_COMPTEUR) || '{}');
        n = brut.jour === jour ? Number(brut.n) + 1 : 1;
        localStorage.setItem(CLE_COMPTEUR, JSON.stringify({ jour, n }));
    } catch { /* stockage indisponible : le numéro repart de 01 */ }
    return `PF-${jour.slice(0, 4)}-${jour.slice(4)}-${String(n).padStart(2, '0')}`;
}

/**
 * Facture proforma pour un client qui la demande sans venir consulter (« je voudrais le prix de tel et tel service ») : on ne crée ni patient ni rendez-vous,
 * donc rien n'apparaît dans l'activité, les statistiques ni le planning, et personne n'est prévenu. On saisit seulement le nom du client, puis on choisit
 * les services dans la liste des tarifs ; le document se télécharge en PDF ou en image (rien n'est enregistré sur le serveur).
 */
export default function ProformaLibre() {
    const [form, setForm] = useState({ sexe: '', nom: '', telephone: '' });
    const [client, setClient] = useState(null);   // { numero, rdv } une fois la facture ouverte

    const ouvrir = evenement => {
        evenement.preventDefault();
        const numero = nouveauNumero();
        // même forme qu'un patient reçu, pour réutiliser le panneau de facture : civilité « Mr » / « Mme » si elle est choisie, aucun accompagnant
        setClient({ numero, rdv: { id: numero, nomClient: form.nom.trim(), ageClient: form.sexe ? 30 : '', sexe: form.sexe, telephoneClient: form.telephone.replace(/\s/g, ''), serviceNom: '' } });
    };
    const autreClient = () => { setClient(null); setForm({ sexe: '', nom: '', telephone: '' }); };

    return (
        <AdminLayout title="Facture proforma" subtitle="Pour un client qui demande le prix de services, sans consultation">
            {() => <>
                {!client ? (
                    <form onSubmit={ouvrir} className={`${card} space-y-5 p-5 sm:p-6`}>
                        <div>
                            <h2 className="flex items-center gap-2 text-base font-semibold"><FilePlus2 size={18} aria-hidden="true" />Le client</h2>
                            <p className="mt-1 text-sm text-slate-600 dark:text-gray-300">Aucun patient ni rendez-vous n’est créé : rien n’apparaît dans l’activité, les statistiques ni le planning, et personne n’est prévenu. On choisit ensuite les services dans la liste des tarifs.</p>
                        </div>
                        <div className="flex flex-wrap items-start gap-4">
                            <label className="text-sm font-medium">Civilité
                                <SelectCivilite sexe={form.sexe} onChange={valeur => setForm(c => ({ ...c, sexe: valeur }))} className={`${inputClass} mt-1.5 block w-32! min-w-0`} /></label>
                            <label className="min-w-[14rem] flex-1 text-sm font-medium">Nom du client *
                                <input required minLength={2} maxLength={100} value={form.nom} onChange={e => setForm(c => ({ ...c, nom: e.target.value }))} className={`${inputClass} mt-1.5`} autoFocus />
                                <VoyantPatient className="mt-2 font-normal" nom={form.nom} telephone={form.telephone}
                                    onChoisir={patient => setForm(c => ({ ...c, nom: patient.nom, telephone: formatPhone(patient.telephone) }))} /></label>
                            <label className="min-w-[12rem] text-sm font-medium">Téléphone <span className="font-normal text-slate-500 dark:text-gray-400">(facultatif)</span>
                                <input type="tel" inputMode="tel" maxLength={20} placeholder="034 12 345 67" value={form.telephone} onChange={e => setForm(c => ({ ...c, telephone: formatPhoneInput(e.target.value) }))} className={`${inputClass} mt-1.5`} /></label>
                        </div>
                        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 pt-4 dark:border-gray-800">
                            <p className="text-xs text-slate-500 dark:text-gray-400">Le client veut aussi être reçu ? Utilisez plutôt <Link to="/patients/sans-rendez-vous" className="font-medium text-teal-700 underline-offset-2 hover:underline dark:text-teal-300">Patient sans rendez-vous</Link> : la facture s’y propose aussi.</p>
                            <button disabled={form.nom.trim().length < 2} className={btnPrimary}>Établir la facture</button>
                        </div>
                    </form>
                ) : (
                    <section className={`${card} p-5 sm:p-6`}>
                        <div className="mb-5 flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 pb-4 dark:border-gray-800">
                            <h2 className="text-base font-semibold">Facture proforma de {client.rdv.sexe ? `${client.rdv.sexe === 'FEMME' ? 'Mme' : 'Mr'} ` : ''}{client.rdv.nomClient}</h2>
                            <button type="button" onClick={autreClient} className={btnSecondary}><UserRoundPlus size={16} />Autre client</button>
                        </div>
                        <ProformaPanel rdv={client.rdv} numero={client.numero} />
                    </section>
                )}
            </>}
        </AdminLayout>
    );
}
