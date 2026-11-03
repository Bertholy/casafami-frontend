import { useEffect, useMemo, useState } from 'react';
import { ChevronDown, FileDown, Image as ImageIcon, Loader2, Plus, Search, Share2, Trash2 } from 'lucide-react';
import axiosClient from '../../api/axiosClient';
import { useSiteContent } from '../../context/SiteContentContext';
import { downloadProformaImage, downloadProformaPdf, enLettres, formaterMontant, numeroProforma, shareProformaImage, ticketProforma, totalLignes } from '../../utils/proforma';
import TicketPapier, { pilule } from '../TicketPapier';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '../ui/dropdown-menu';
import { nomAvecCivilite } from '../../utils/civilite';
import { formatPhone } from '../../utils/phone';
import { inputClass } from '../../constants/ui';

const CLE_TARIFS = 'proforma-tarifs';   // derniers prix saisis par désignation, gardés sur cet appareil pour ne pas les retaper
const lireTarifs = () => { try { return JSON.parse(localStorage.getItem(CLE_TARIFS) || '{}'); } catch { return {}; } };
const gardeTarif = (designation, prix) => {
    if (!designation || !(Number(prix) > 0)) return;
    try { localStorage.setItem(CLE_TARIFS, JSON.stringify({ ...lireTarifs(), [designation.trim().toLowerCase()]: Number(prix) })); } catch { /* stockage indisponible : le prix n'est pas gardé */ }
};
const sansAccent = texte => String(texte || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
const memeNom = (a, b) => String(a || '').trim().toLowerCase() === String(b || '').trim().toLowerCase();
const prixConnu = designation => lireTarifs()[String(designation || '').trim().toLowerCase()] ?? '';
/** Prix du service du même nom dans la liste des tarifs du cabinet (null s'il n'y en a pas). */
const prixDuService = (tarifs, designation) => tarifs.find(s => s.prix != null && String(s.nom).trim().toLowerCase() === String(designation || '').trim().toLowerCase())?.prix ?? null;

/**
 * Facture proforma d'un patient reçu sans rendez-vous, s'il la souhaite : la secrétaire saisit les lignes (désignation, quantité, prix en Ariary),
 * le total se calcule tout seul et le document se télécharge en PDF ou en image (utils/proforma.js). Rien n'est enregistré sur le serveur.
 * Si le patient est venu accompagné, la facture peut être établie au nom de l'accompagnant.
 * « numero » : numéro imposé (proforma d'un client sans rendez-vous, voir pages/ProformaLibre.jsx).
 */
export default function ProformaPanel({ rdv, numero }) {
    const { content } = useSiteContent();
    // une ligne par service demandé (le patient peut venir pour plusieurs) ; « » : une ligne vide au départ (proforma sans consultation)
    const designationsDepart = rdv.servicesNoms?.length ? rdv.servicesNoms : [rdv.serviceNom ?? 'Consultation'];
    const [lignes, setLignes] = useState(() => designationsDepart.map(designation => ({ designation, quantite: 1, prix: prixConnu(designation) })));
    const [auNomDe, setAuNomDe] = useState(rdv.ageClient < 18 && rdv.accompagnantNom ? 'accompagnant' : 'patient');   // pour un enfant, la facture est au nom du parent
    const [enCours, setEnCours] = useState('');
    const [erreur, setErreur] = useState('');
    const [info, setInfo] = useState('');
    const [somme, setSomme] = useState('');   // somme remise par le client, pour calculer la monnaie à rendre (rien n'est enregistré)
    const [tarifs, setTarifs] = useState([]);   // services du cabinet avec leur prix (liste réservée au personnel)
    // le prix d'un service vient d'abord de la liste des tarifs ; à défaut, du dernier prix saisi à la main pour cette désignation
    const prixPour = designation => prixDuService(tarifs, designation) ?? prixConnu(designation);
    useEffect(() => {
        let actif = true;
        axiosClient.get('/services/tarifs').then(({ data }) => {
            if (!actif) return;
            setTarifs(data);
            setLignes(liste => liste.map(ligne => ({ ...ligne, prix: prixDuService(data, ligne.designation) ?? ligne.prix })));   // le tarif du cabinet prime sur le dernier prix saisi à la main
        }).catch(() => { /* sans la liste des tarifs : les prix se saisissent à la main */ });
        return () => { actif = false; };
    }, []);
    const valide = lignes.some(l => l.designation.trim() && Number(l.quantite) > 0 && Number(l.prix) > 0);
    const accompagnant = Boolean(rdv.accompagnantNom);

    const miseAJour = (index, cle, valeur) => setLignes(liste => liste.map((l, i) => (i === index ? { ...l, [cle]: valeur } : l)));
    const changerDesignation = (index, valeur) => setLignes(liste => liste.map((l, i) => (i === index ? { ...l, designation: valeur, prix: l.prix === '' ? prixPour(valeur) : l.prix } : l)));
    const ajouterService = id => {
        const service = tarifs.find(s => String(s.id) === String(id));
        if (!service) return;
        const ligne = { designation: service.nom, quantite: 1, prix: service.prix ?? '' };
        setLignes(liste => {
            // déjà dans la facture : un clic de plus augmente la quantité
            const existante = liste.findIndex(l => memeNom(l.designation, service.nom));
            if (existante >= 0) return liste.map((l, i) => (i === existante ? { ...l, quantite: Math.min(999, (Number(l.quantite) || 0) + 1) } : l));
            // une ligne vide en dernière position est utilisée, sinon on en ajoute une
            return liste.length > 0 && !liste[liste.length - 1].designation.trim() ? [...liste.slice(0, -1), ligne] : liste.length >= 12 ? liste : [...liste, ligne];
        });
    };
    const quantiteDe = service => lignes.filter(l => memeNom(l.designation, service.nom)).reduce((somme, l) => somme + (Number(l.quantite) || 0), 0);
    const [rechercheService, setRechercheService] = useState('');
    const servicesAffiches = useMemo(() => {
        const q = sansAccent(rechercheService.trim());
        return tarifs.filter(s => !q || sansAccent(`${s.nom} ${s.description || ''}`).includes(q));
    }, [tarifs, rechercheService]);

    const donnees = useMemo(() => {
        const nomPatient = nomAvecCivilite(rdv.nomClient, rdv.ageClient, rdv.sexe);
        const surAccompagnant = auNomDe === 'accompagnant' && accompagnant;
        return {
            numero: numero || numeroProforma(rdv.id),
            date: new Date(),
            destinataire: surAccompagnant
                ? { nom: [rdv.accompagnantCivilite, rdv.accompagnantNom].filter(Boolean).join(' '), telephone: rdv.accompagnantTelephone ? formatPhone(rdv.accompagnantTelephone) : '', mention: rdv.accompagnantLien ? `${rdv.accompagnantLien} du patient` : 'Accompagnant du patient' }
                : { nom: nomPatient, telephone: rdv.telephoneClient ? formatPhone(rdv.telephoneClient) : '', mention: '' },
            patient: surAccompagnant ? { nom: nomPatient } : null,
            lignes: lignes.filter(l => l.designation.trim() && Number(l.quantite) > 0 && Number(l.prix) > 0),
            cabinet: {
                nom: 'CASAFAMI',
                sousTitre: 'Cabinet d’accouchement Sainte Famille',
                adresse: [content['accueil.adresse.ligne1']?.texte ?? 'Chez Rasazy VERO', content['accueil.adresse.ligne2']?.texte ?? 'Andongona - ANTSOHIHY', content['accueil.adresse.pays']?.texte ?? 'Madagascar'],
                telephones: [content['accueil.tel.numero1']?.texte ?? '034 06 759 28', content['accueil.tel.numero2']?.texte ?? '032 43 035 07'],
            },
        };
    }, [rdv, numero, lignes, auNomDe, accompagnant, content]);

    const total = totalLignes(donnees.lignes);
    // Monnaie à rendre : somme remise par le client moins le total à payer (aide de caisse, absente du document)
    const recu = Number(String(somme).replace(/\D/g, '')) || 0;
    const rendu = recu - total;
    // sommes rondes proposées en un clic : le montant exact, puis les coupures usuelles au-dessus du total
    const sommesRondes = total > 0 ? [...new Set([total, ...[1000, 5000, 10000, 20000, 50000, 100000].map(pas => Math.ceil(total / pas) * pas)])].slice(0, 4) : [];

    const telecharger = async (format) => {
        setErreur(''); setInfo(''); setEnCours(format);
        try {
            lignes.forEach(l => gardeTarif(l.designation, l.prix));
            await (format === 'pdf' ? downloadProformaPdf(donnees) : downloadProformaImage(donnees));
        } catch (err) { setErreur(err.message || 'Le téléchargement a échoué. Réessayez.'); }
        finally { setEnCours(''); }
    };
    const partager = async () => {
        setErreur(''); setInfo(''); setEnCours('partage');
        try {
            lignes.forEach(l => gardeTarif(l.designation, l.prix));
            const partage = await shareProformaImage(donnees);
            if (!partage) setInfo('Le partage n’est pas disponible sur cet appareil : l’image de la facture a été téléchargée, envoyez-la au client.');
        } catch (err) { setErreur(err.message || 'Le partage a échoué. Réessayez.'); }
        finally { setEnCours(''); }
    };

    const ticket = ticketProforma(donnees);   // le même contenu que l’image téléchargée ou partagée

    return (
        <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,1fr)_22rem]">
            <div className="min-w-0 space-y-4">
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                    <p className="text-sm text-slate-600 dark:text-gray-300">Numéro de la facture : <span className="font-mono font-bold text-slate-800 dark:text-gray-100">{donnees.numero}</span></p>
                    <p className="text-xs text-slate-500 dark:text-gray-400">Montants en Ariary (Ar). Document informatif, non contractuel.</p>
                </div>

                {accompagnant && (
                    <fieldset className="flex flex-wrap items-center gap-x-5 gap-y-2 text-sm">
                        <legend className="mb-1 font-medium">Établir la facture au nom de</legend>
                        {[['patient', `Patient : ${nomAvecCivilite(rdv.nomClient, rdv.ageClient, rdv.sexe)}`], ['accompagnant', `Accompagnant : ${[rdv.accompagnantCivilite, rdv.accompagnantNom].filter(Boolean).join(' ')}`]].map(([valeur, libelle]) => (
                            <label key={valeur} className="inline-flex cursor-pointer items-center gap-2"><input type="radio" name={`proforma-nom-${rdv.id}`} checked={auNomDe === valeur} onChange={() => setAuNomDe(valeur)} className="h-4 w-4 accent-teal-700" />{libelle}</label>
                        ))}
                    </fieldset>
                )}

                {/* les services du cabinet, comme dans « Services et tarifs » : un « + » à droite de chaque prix l'ajoute à la facture (un deuxième clic augmente la quantité) */}
                {tarifs.length > 0 && (
                    <section aria-label="Services du cabinet" className="rounded-xl border border-slate-200 dark:border-gray-700">
                        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 px-4 py-3 dark:border-gray-700">
                            <h3 className="text-sm font-semibold">Choisir les services</h3>
                            <label className="relative block w-full max-w-xs">
                                <span className="sr-only">Rechercher un service</span>
                                <Search size={15} aria-hidden="true" className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                                <input type="search" value={rechercheService} onChange={e => setRechercheService(e.target.value)} placeholder="Rechercher un service…" className={`${inputClass} pl-9`} />
                            </label>
                        </div>
                        <div className="max-h-96 overflow-auto">
                            <table className="w-full text-sm">
                                <thead className="sticky top-0 bg-white dark:bg-gray-900">
                                    <tr className="text-left text-xs uppercase tracking-wide text-slate-500 dark:text-gray-400">
                                        <th className="px-4 py-2 font-semibold">Service</th>
                                        <th className="hidden px-3 py-2 font-semibold sm:table-cell">Durée</th>
                                        <th className="px-4 py-2 text-right font-semibold">Prix</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-200 dark:divide-gray-800">
                                    {servicesAffiches.map(s => {
                                        const dejaLa = quantiteDe(s);
                                        return (
                                            <tr key={s.id} className="align-middle">
                                                <td className="px-4 py-3">
                                                    <p className="font-medium">{s.nom}{dejaLa > 0 && <span className="ml-2 rounded-full bg-teal-100 px-2 py-0.5 text-[10px] font-bold text-teal-800 dark:bg-teal-500/15 dark:text-teal-200" title="Déjà dans la facture">× {dejaLa}</span>}</p>
                                                    {s.description && <p className="mt-0.5 line-clamp-2 text-xs text-slate-500 dark:text-gray-400">{s.description}</p>}
                                                </td>
                                                <td className="hidden whitespace-nowrap px-3 py-3 text-slate-600 sm:table-cell dark:text-gray-300">{s.duree || '—'}</td>
                                                <td className="whitespace-nowrap px-4 py-3 text-right">
                                                    <span className="inline-flex items-center gap-3">
                                                        <span className={s.prix != null ? 'font-semibold tabular-nums' : 'text-slate-400 dark:text-gray-500'}>{s.prix != null ? `${formaterMontant(s.prix)} Ar` : 'Non défini'}</span>
                                                        <button type="button" onClick={() => ajouterService(s.id)} disabled={dejaLa === 0 && lignes.length >= 12} aria-label={`Ajouter ${s.nom} à la facture`} title="Ajouter à la facture"
                                                            className="flex h-8 w-8 items-center justify-center rounded-full bg-teal-700 text-white transition hover:bg-teal-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-700 disabled:opacity-40"><Plus size={16} aria-hidden="true" /></button>
                                                    </span>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                            {servicesAffiches.length === 0 && <p className="p-4 text-sm text-slate-500 dark:text-gray-400">Aucun service ne correspond à « {rechercheService.trim()} ».</p>}
                        </div>
                    </section>
                )}
                <div className="overflow-x-auto">
                    <table className="w-full min-w-[34rem] text-sm">
                        <thead><tr className="text-left text-xs uppercase tracking-wide text-slate-500 dark:text-gray-400">
                            <th className="pb-2 pr-2 font-semibold">Désignation</th><th className="w-20 pb-2 pr-2 font-semibold">Qté</th><th className="w-36 pb-2 pr-2 font-semibold">Prix unitaire (Ar)</th><th className="w-32 pb-2 pr-2 text-right font-semibold">Montant (Ar)</th><th className="w-10" />
                        </tr></thead>
                        <tbody>
                            {lignes.map((ligne, index) => (
                                <tr key={index} className="align-top">
                                    <td className="pb-2 pr-2"><input aria-label={`Désignation de la ligne ${index + 1}`} value={ligne.designation} maxLength={200} onChange={e => changerDesignation(index, e.target.value)} className={inputClass} placeholder="Consultation, injection, échographie…" /></td>
                                    <td className="pb-2 pr-2"><input aria-label={`Quantité de la ligne ${index + 1}`} type="number" min={1} max={999} value={ligne.quantite} onChange={e => miseAJour(index, 'quantite', e.target.value)} className={inputClass} /></td>
                                    <td className="pb-2 pr-2"><input aria-label={`Prix unitaire de la ligne ${index + 1}`} type="number" min={0} step={100} inputMode="numeric" value={ligne.prix} onChange={e => miseAJour(index, 'prix', e.target.value)} className={inputClass} placeholder="0" /></td>
                                    <td className="pb-2 pr-2 pt-2.5 text-right font-semibold tabular-nums">{formaterMontant((Number(ligne.quantite) || 0) * (Number(ligne.prix) || 0))}</td>
                                    <td className="pb-2 pt-1">{lignes.length > 1 && <button type="button" onClick={() => setLignes(liste => liste.filter((_, i) => i !== index))} aria-label={`Supprimer la ligne ${index + 1}`} className="rounded-lg p-2 text-slate-500 transition hover:bg-rose-50 hover:text-rose-700 dark:hover:bg-rose-500/10"><Trash2 size={16} /></button>}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                <button type="button" onClick={() => setLignes(liste => [...liste, { designation: '', quantite: 1, prix: '' }])} disabled={lignes.length >= 12} className="inline-flex items-center gap-1.5 text-sm font-medium text-teal-700 hover:underline disabled:opacity-50 dark:text-teal-300"><Plus size={15} />Ajouter une ligne</button>
                {/* caisse : la secrétaire saisit la somme remise par le client, la monnaie à rendre se calcule seule */}
                <section aria-label="Monnaie à rendre" className="space-y-3 rounded-xl border border-slate-200 p-4 dark:border-gray-700">
                    <div className="flex flex-wrap items-end gap-4">
                        <label className="text-sm font-medium">Somme remise par le client (Ar)
                            <input inputMode="numeric" maxLength={12} value={somme} onChange={e => setSomme(e.target.value.replace(/[^\d\s]/g, ''))} placeholder="Ex. 150 000" className={`${inputClass} mt-1.5 w-52`} /></label>
                        {sommesRondes.length > 0 && (
                            <div className="flex flex-wrap items-center gap-2" aria-label="Sommes proposées">
                                {sommesRondes.map(montant => (
                                    <button key={montant} type="button" onClick={() => setSomme(String(montant))} className="rounded-full border border-slate-300 px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:border-teal-600 hover:text-teal-700 dark:border-gray-600 dark:text-gray-200">{montant === total ? 'Montant exact' : formaterMontant(montant)}</button>
                                ))}
                            </div>
                        )}
                    </div>
                    {total <= 0 ? <p className="text-sm text-slate-500 dark:text-gray-400">Ajoutez d’abord un service : le total à payer sert de base au calcul.</p>
                        : recu <= 0 ? <p className="text-sm text-slate-500 dark:text-gray-400">Saisissez la somme remise pour voir la monnaie à rendre. Total à payer : <strong>{formaterMontant(total)} Ar</strong>.</p>
                            : rendu >= 0 ? (
                                <div role="status" className="rounded-lg bg-emerald-50 px-4 py-3 dark:bg-emerald-500/10">
                                    <p className="text-xs font-semibold uppercase tracking-wide text-emerald-700 dark:text-emerald-300">Monnaie à rendre au client</p>
                                    <p className="text-2xl font-extrabold tabular-nums text-emerald-800 dark:text-emerald-200">{formaterMontant(rendu)} Ar</p>
                                    {rendu > 0 && <p className="text-xs text-emerald-700/80 dark:text-emerald-300/80">{enLettres(rendu).replace(/^./, c => c.toUpperCase())} Ariary</p>}
                                    <p className="mt-1 text-xs text-slate-600 dark:text-gray-300">{formaterMontant(recu)} Ar reçus − {formaterMontant(total)} Ar à payer{rendu === 0 ? ' : le compte est bon.' : '.'}</p>
                                </div>
                            ) : (
                                <div role="status" className="rounded-lg bg-amber-50 px-4 py-3 dark:bg-amber-500/10">
                                    <p className="text-xs font-semibold uppercase tracking-wide text-amber-800 dark:text-amber-300">Somme insuffisante</p>
                                    <p className="text-2xl font-extrabold tabular-nums text-amber-900 dark:text-amber-200">Il manque {formaterMontant(-rendu)} Ar</p>
                                    <p className="mt-1 text-xs text-slate-600 dark:text-gray-300">{formaterMontant(recu)} Ar reçus pour {formaterMontant(total)} Ar à payer.</p>
                                </div>
                            )}
                </section>
                {!valide && <p className="text-xs text-slate-500 dark:text-gray-400">Renseignez au moins une ligne (désignation, quantité et prix) pour établir la facture.</p>}
                {info && <p role="status" className="rounded-lg bg-sky-50 px-3 py-2 text-sm text-sky-800 dark:bg-sky-500/10 dark:text-sky-200">{info}</p>}
                {erreur && <p role="alert" className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700 dark:bg-rose-500/10 dark:text-rose-300">{erreur}</p>}
            </div>

            {/* la facture présentée comme un ticket de papier ; le PDF et l'image téléchargés restent ceux de utils/proforma.js */}
            <TicketPapier className="xl:sticky xl:top-4" {...ticket}
                actions={<>
                    <DropdownMenu>
                        <DropdownMenuTrigger disabled={!valide || Boolean(enCours)} className={pilule}>
                            {enCours === 'pdf' || enCours === 'image' ? <Loader2 size={16} className="animate-spin" /> : <FileDown size={16} />}Télécharger<ChevronDown size={14} />
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="start" className="min-w-44">
                            <DropdownMenuItem onSelect={() => telecharger('pdf')}><FileDown className="h-4 w-4" />Document PDF</DropdownMenuItem>
                            <DropdownMenuItem onSelect={() => telecharger('image')}><ImageIcon className="h-4 w-4" />Image</DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                    <button type="button" disabled={!valide || Boolean(enCours)} onClick={partager} className={pilule}>{enCours === 'partage' ? <Loader2 size={16} className="animate-spin" /> : <Share2 size={16} />}Partager</button>
                </>} />
        </div>
    );
}
