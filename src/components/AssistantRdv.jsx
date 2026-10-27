import { useMemo, useState } from 'react';
import { AlertTriangle, ArrowRight, Bot, Calendar, CheckCircle, Loader2 } from 'lucide-react';
import AutreDate from './AutreDate';
import { getCategory } from '../constants/motifFlows';
import { analyserDemande, normaliser, propositions } from '../constants/motifRecherche';
import { useLang } from '../i18n/LangContext';
import { explainNoSlots } from '../utils/horaires';
import { formaterJour } from '../utils/jours';
import { formatPhoneInput, isPlausiblePhone } from '../utils/phone';
import { cn } from '../lib/utils';
import { Input, Textarea } from './ui/input';

/**
 * Assistant de rendez-vous : c'est la page d'arrivée, il mène la prise de rendez-vous avec la personne.
 * Il pose, dans l'ordre, les questions du formulaire qui n'ont pas encore de réponse. Chaque réponse remplit le formulaire,
 * et ce qui est écrit directement dans le formulaire change la question suivante : le formulaire reste la seule source.
 * Fonctionne sans service externe (reconnaissance du motif par règles, comme l'ancien assistant de motif).
 */

// Ordre des questions ; une question n'est posée que si le formulaire n'a pas déjà la réponse.
const ORDRE = ['nom', 'age', 'telephone', 'motif', 'service', 'date', 'heure'];
const QUESTIONS = {
    nom: 'Quel est votre nom ?',
    age: 'Quel âge avez-vous ?',
    telephone: 'Votre numéro de téléphone ?',
    motif: 'Quelle est la raison de votre visite ?',
    service: 'Quel service ?',
    date: 'Quel jour ?',
    heure: 'Quelle heure ?',
    fin: 'Tout est prêt.',
};
const EXEMPLES = ['J’ai de la fièvre', 'Je suis enceinte', 'Vaccin pour mon bébé', 'J’ai mal au ventre'];

// Même gabarit que le choix de parcours d'origine : boutons en pilule, texte en capitales, couleurs du thème du site.
const pilule = 'inline-flex items-center justify-center gap-2 rounded-full px-7 py-3 text-xs font-extrabold uppercase tracking-[0.14em] transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-700 disabled:pointer-events-none disabled:opacity-50';
const primaire = cn(pilule, 'bg-(--mt-bouton) text-(--mt-sur-bouton) hover:brightness-95');
const discret = cn(pilule, 'border-2 border-teal-600 text-teal-700 hover:bg-teal-600 hover:text-white dark:text-teal-300');
const bulle = 'rounded-2xl bg-slate-100 px-4 py-3 text-sm font-medium text-slate-700 dark:bg-gray-700 dark:text-white';
const choix = 'flex items-center justify-start rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-left text-sm font-semibold text-slate-700 transition hover:border-teal-600 hover:bg-teal-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-700 dark:border-gray-600 dark:bg-gray-800 dark:text-white dark:hover:bg-gray-700';

// Service réel du cabinet qui correspond à un sujet reconnu (les noms viennent de la base : « Suivi de grossesse », « Vaccination »…).
function serviceDuSujet(id, services) {
    const mots = getCategory(id)?.service || [];
    return mots.length ? services.find(service => mots.some(mot => normaliser(service.nom).includes(mot))) || null : null;
}

// Une réponse écrite (nom, âge, téléphone, raison). `valider` renvoie le message d'erreur, ou une chaîne vide si la réponse convient.
function SaisieTexte({ libelle, multiligne = false, type = 'text', mode, placeholder, maxLength, autoComplete, formater, valider, onValider, exemples = [], onPasser }) {
    const { t } = useLang();
    const [valeur, setValeur] = useState('');
    const [message, setMessage] = useState('');

    const envoyer = event => {
        event.preventDefault();
        const texte = valeur.trim();
        const probleme = valider(texte);
        if (probleme) { setMessage(probleme); return; }
        onValider(texte);
    };
    const changer = event => {
        const brut = event.target.value;
        setValeur(formater ? formater(brut) : brut);
        setMessage('');
    };

    return (
        <form onSubmit={envoyer} className="space-y-2">
            {multiligne
                ? <Textarea value={valeur} onChange={changer} rows={3} maxLength={maxLength} placeholder={placeholder} aria-label={libelle} aria-invalid={Boolean(message)} autoFocus />
                : <Input value={valeur} onChange={changer} type={type} inputMode={mode} maxLength={maxLength} autoComplete={autoComplete} placeholder={placeholder} aria-label={libelle} aria-invalid={Boolean(message)} autoFocus />}
            {message && <p role="alert" className="text-xs font-medium text-destructive">{message}</p>}
            {exemples.length > 0 && (
                <div className="flex flex-wrap gap-2">
                    {exemples.map(exemple => (
                        <button key={exemple} type="button" onClick={() => onValider(t(exemple))} className="rounded-full border border-input bg-background px-3 py-1 text-xs font-medium text-foreground transition-colors hover:bg-accent">{t(exemple)}</button>
                    ))}
                </div>
            )}
            <div className="flex flex-wrap gap-2">
                <button type="submit" disabled={!valeur.trim()} className={primaire}>{t("Valider")}<ArrowRight size={16} /></button>
                {onPasser && <button type="button" onClick={onPasser} className={discret}>{t("Passer")}</button>}
            </div>
        </form>
    );
}

function ChoixService({ services, conseil, onChoisir, onRefuser, onPasser }) {
    const { t } = useLang();
    if (conseil) {
        return (
            <div className="flex flex-wrap gap-2">
                <button type="button" onClick={() => onChoisir(conseil)} className={primaire}>{t("Oui, ce service")}</button>
                <button type="button" onClick={onRefuser} className={discret}>{t("Un autre")}</button>
            </div>
        );
    }
    return (
        <div className="space-y-2">
            <div className="flex flex-wrap gap-2">
                {services.map(service => <button key={service.id} type="button" onClick={() => onChoisir(service)} className={choix}>{t(service.nom)}</button>)}
            </div>
            <button type="button" onClick={onPasser} className={discret}>{t("Je ne sais pas encore")}</button>
        </div>
    );
}

// Les six jours proposés, ou une autre date écrite en cases (pas de calendrier du navigateur).
function ChoixDate({ jours, aujourdhui, onChoisir }) {
    const { t, lang } = useLang();
    const [autre, setAutre] = useState(false);
    return (
        <div className="space-y-3">
            <div className="grid grid-cols-3 gap-2">
                {jours.map((iso, i) => (
                    <button key={iso} type="button" onClick={() => onChoisir(iso)} className={cn(choix, 'flex-col justify-center gap-0 px-1 text-center')}>
                        <span className="block text-[10px] font-semibold uppercase tracking-wide opacity-80">{i === 0 ? t("Aujourd’hui") : i === 1 ? t("Demain") : formaterJour(iso, lang, { weekday: 'short' })}</span>
                        <span className="block text-lg font-bold leading-tight">{formaterJour(iso, lang, { day: 'numeric' })}</span>
                        <span className="block text-[11px] opacity-80">{formaterJour(iso, lang, { month: 'short' })}</span>
                    </button>
                ))}
            </div>
            <AutreDate prefixe="ia-date" ouvert={autre} onBascule={setAutre} valeur="" min={aujourdhui} onChange={iso => { if (iso) onChoisir(iso); }} />
        </div>
    );
}

function ChoixHeure({ creneaux, chargement, erreur, messageVide, onRafraichir, onChoisir, onAutreDate }) {
    const { t } = useLang();
    if (chargement) return <p className="flex items-center gap-2 text-sm text-slate-500 dark:text-gray-400"><Loader2 className="h-4 w-4 animate-spin" />{t("Chargement des créneaux...")}</p>;
    if (erreur) return <p className="text-sm text-red-700 dark:text-red-300">{t("Impossible de charger les créneaux.")} <button type="button" onClick={onRafraichir} className="font-semibold underline">{t("Réessayer")}</button></p>;
    if (creneaux.length === 0) {
        return (
            <div className="space-y-2">
                <p className="text-sm text-orange-700 dark:text-orange-300">{messageVide}</p>
                <button type="button" onClick={onAutreDate} className={choix}>{t("Autre date")}</button>
            </div>
        );
    }
    return (
        <div className="grid grid-cols-3 gap-2">
            {creneaux.map(heure => <button key={heure} type="button" onClick={() => onChoisir(heure)} className={cn(choix, 'justify-center text-center tabular-nums')}>{heure}</button>)}
        </div>
    );
}

// `ouvert` faux : il ne reste que le bouton qui ramène à l'assistant (quand la personne remplit le formulaire elle-même).
export default function AssistantRdv({ ouvert, onOuvrir, form, setForm, services, jours, aujourdhui, planning, creneaux, heureChoisie, slotsLoading, slotsError, onRafraichir, envoiEnCours, onConfirmer }) {
    const { t } = useLang();
    const [passes, setPasses] = useState([]);              // questions facultatives que la personne a passées
    const [conseilRefuse, setConseilRefuse] = useState(null);

    // Reconnaissance de la raison de la visite : signes d'urgence, et service conseillé parmi ceux du cabinet.
    const analyse = useMemo(() => (form.motif.trim().length >= 2 ? analyserDemande(form.motif) : null), [form.motif]);
    const urgences = analyse ? [...new Set(analyse.urgences)] : [];
    const conseil = useMemo(() => {
        const principal = analyse ? propositions(analyse).principal : null;
        return principal ? serviceDuSujet(principal.id, services) : null;
    }, [analyse, services]);
    const conseilAffiche = conseil && String(conseil.id) !== String(conseilRefuse) ? conseil : null;

    const faites = {
        nom: form.nomClient.trim().length >= 2,
        age: form.ageClient !== '' && Number(form.ageClient) >= 0 && Number(form.ageClient) <= 120,
        telephone: isPlausiblePhone(form.telephoneClient),
        motif: form.motif.trim() !== '' || passes.includes('motif'),
        service: form.serviceId !== '' || passes.includes('service') || services.length === 0,
        date: form.dateRdv !== '',
        heure: heureChoisie !== '',
    };
    const nbFaites = ORDRE.filter(cle => faites[cle]).length;
    const etape = ORDRE.find(cle => !faites[cle]) || 'fin';
    const remplir = champs => setForm(current => ({ ...current, ...champs }));
    const passer = cle => setPasses(courant => [...courant, cle]);

    // La raison est gardée telle quelle ; si elle décrit des signes graves, la demande est marquée comme prioritaire pour l'équipe.
    const repondreMotif = texte => {
        const signes = [...new Set(analyserDemande(texte).urgences)];
        remplir({ motif: signes.length ? `⚠ À TRAITER EN PRIORITÉ — signes signalés : ${signes.join(' ; ')}\n${texte}` : texte });
    };

    if (!ouvert) {
        return (
            <button type="button" onClick={onOuvrir} className={cn(primaire, 'w-full')}>
                <Bot className="h-5 w-5" />{t("Continuer avec l’assistant")}
            </button>
        );
    }

    const question = etape === 'service' && conseilAffiche
        ? <>{t("Je vous conseille :")} <strong className="font-semibold">{t(conseilAffiche.nom)}</strong></>
        : t(QUESTIONS[etape]);
    const libelle = t(QUESTIONS[etape]);

    return (
        <section aria-label={t("Assistant de rendez-vous")} className="animate-fade-in-up flex flex-col px-8 py-12 sm:px-12 md:py-14">
            <header className="mb-6 flex flex-col items-center text-center">
                <span className="mb-5 flex h-11 w-11 items-center justify-center rounded-full border-2 border-teal-600 text-teal-700 dark:border-teal-400 dark:text-teal-300"><Bot className="h-5 w-5" /></span>
                <h2 className="font-titre text-balance text-3xl font-extrabold text-slate-700 dark:text-white">{t("Assistant de rendez-vous")}</h2>
            </header>
            <div aria-hidden="true" className="mb-6 h-1.5 overflow-hidden rounded-full bg-slate-100 dark:bg-gray-700"><div className="h-full rounded-full bg-(--mt-bouton) transition-all" style={{ width: `${(nbFaites / ORDRE.length) * 100}%` }} /></div>

            <div className="space-y-4" aria-live="polite">
                {urgences.length > 0 && (
                    <div role="alert" className="flex gap-2 rounded-lg border border-destructive/50 bg-destructive/10 p-3 text-xs text-foreground">
                        <AlertTriangle className="mt-0.5 shrink-0 text-destructive" size={16} />
                        <div>
                            <p className="font-bold">{t("Ces signes demandent une prise en charge rapide")}</p>
                            <ul className="mt-1 list-disc pl-4">{urgences.map(signe => <li key={signe}>{t(signe)}</li>)}</ul>
                            <p className="mt-1 font-bold first-letter:uppercase">{t("appelez le cabinet maintenant (urgences 24h/24)")}</p>
                        </div>
                    </div>
                )}

                <div className={bulle}>{question}</div>

                <div key={etape}>
                    {etape === 'nom' && (
                        <SaisieTexte libelle={libelle} placeholder={t("Ex: Ahmed Benali")} autoComplete="name" maxLength={100}
                            valider={texte => (texte.length >= 2 ? '' : t("Nom trop court"))}
                            onValider={texte => remplir({ nomClient: texte })} />
                    )}
                    {etape === 'age' && (
                        <SaisieTexte libelle={libelle} placeholder="30" mode="numeric" maxLength={3}
                            formater={brut => brut.replace(/\D/g, '')}
                            valider={texte => (texte !== '' && Number(texte) <= 120 ? '' : t("Âge invalide"))}
                            onValider={texte => remplir({ ageClient: String(Number(texte)) })} />
                    )}
                    {etape === 'telephone' && (
                        <SaisieTexte libelle={libelle} type="tel" mode="tel" placeholder="034 12 345 67" autoComplete="tel" maxLength={20}
                            formater={formatPhoneInput}
                            valider={texte => (isPlausiblePhone(texte) ? '' : t("Ce numéro ne semble pas valide. Exemple : 034 12 345 67"))}
                            onValider={texte => remplir({ telephoneClient: formatPhoneInput(texte) })} />
                    )}
                    {etape === 'motif' && (
                        <SaisieTexte libelle={libelle} multiligne placeholder={t("Décrivez ce qui vous amène")} maxLength={500} exemples={EXEMPLES}
                            valider={texte => (texte.length >= 2 ? '' : t("Texte trop court"))}
                            onValider={repondreMotif}
                            onPasser={() => passer('motif')} />
                    )}
                    {etape === 'service' && (
                        <ChoixService services={services} conseil={conseilAffiche}
                            onChoisir={service => remplir({ serviceId: String(service.id) })}
                            onRefuser={() => setConseilRefuse(conseilAffiche.id)}
                            onPasser={() => passer('service')} />
                    )}
                    {etape === 'date' && (
                        <ChoixDate jours={jours} aujourdhui={aujourdhui} onChoisir={iso => remplir({ dateRdv: iso, heureRdv: '' })} />
                    )}
                    {etape === 'heure' && (
                        <ChoixHeure creneaux={creneaux} chargement={slotsLoading} erreur={slotsError} onRafraichir={onRafraichir}
                            messageVide={`${explainNoSlots(form.dateRdv, planning, aujourdhui, t)} ${t("Choisissez une autre date.")}`}
                            onChoisir={heure => remplir({ heureRdv: heure })}
                            onAutreDate={() => remplir({ dateRdv: '', heureRdv: '' })} />
                    )}
                    {etape === 'fin' && (
                        <div className="space-y-3">
                            <p className="flex items-center gap-2 text-sm font-medium text-slate-500 dark:text-gray-300"><CheckCircle size={18} className="text-teal-600" />{t("Confirmation par message")}</p>
                            <button type="button" onClick={onConfirmer} disabled={envoiEnCours} className={cn(primaire, 'w-full')}>
                                {envoiEnCours
                                    ? <><Loader2 className="h-4 w-4 animate-spin" />{t("Envoi en cours...")}</>
                                    : <><Calendar className="h-4 w-4" />{t("Confirmer le rendez-vous")}</>}
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </section>
    );
}
