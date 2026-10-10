// Assistant d'ordonnance — logique pure, sans service externe.
//
// Principe : le MÉDECIN (ou la sage-femme) enregistre ses protocoles dans « Maladies et traitements ». L'assistant
//  1. propose les fiches qui correspondent aux symptômes saisis (mots-clés, pas un diagnostic),
//  2. pré-remplit l'ordonnance avec les traitements de la fiche choisie,
//  3. contrôle l'ordonnance (allergies déclarées, grossesse, enfant, doublons, posologie manquante),
//  4. produit un document à imprimer, qui doit être relu, corrigé et signé par le prescripteur.
// Les listes ci-dessous sont des garde-fous : elles ne remplacent ni le jugement du prescripteur ni un dictionnaire des médicaments.

const ACCENTS = 'àâäáãåéèêëíìîïóòôöõúùûüçñœ';
const PLAIN = 'aaaaaaeeeeiiiiooooouuuucno';

/** minuscules, sans accents : « Pénicilline » → « penicilline ». */
export function fold(value) {
    return String(value ?? '').toLowerCase().split('').map(c => { const i = ACCENTS.indexOf(c); return i >= 0 ? PLAIN[i] : c; }).join('');
}

const tokens = value => fold(value).split(/[^a-z0-9]+/).filter(word => word.length >= 3);

// ----------------------------------------------------------------------------- suggestion de maladies par symptômes

const STOP_WORDS = new Set(['avec', 'dans', 'pour', 'sans', 'depuis', 'elle', 'les', 'des', 'une', 'son', 'sur', 'par', 'mal', 'tres', 'plus', 'beaucoup', 'aussi', 'etre', 'suis', 'est', 'ont', 'que', 'qui', 'pas']);

/** Fiches maladies classées selon le nombre de mots-clés communs avec le texte saisi. */
export function suggestMaladies(maladies, texte) {
    const wanted = [...new Set(tokens(texte).filter(word => !STOP_WORDS.has(word)))];
    if (!wanted.length) return [];
    return maladies.map(maladie => {
        const haystack = new Set(tokens(`${maladie.nom} ${maladie.symptomes || ''} ${maladie.description || ''}`));
        const matched = wanted.filter(word => [...haystack].some(h => h === word || (word.length >= 5 && (h.startsWith(word) || word.startsWith(h) && h.length >= 5))));
        return { maladie, matched, score: matched.length };
    }).filter(item => item.score > 0).sort((a, b) => b.score - a.score || a.maladie.nom.localeCompare(b.maladie.nom)).slice(0, 5);
}

// ----------------------------------------------------------------------------- contrôles de sécurité

// Familles de médicaments citées par les patients (« allergique aux pénicillines ») → noms à surveiller.
const FAMILLES_ALLERGIE = [
    { motsCles: ['penicilline', 'penicillines', 'beta-lactamine', 'betalactamine'], nom: 'pénicillines', molecules: ['penicilline', 'amoxicilline', 'ampicilline', 'cloxacilline', 'oxacilline', 'flucloxacilline', 'augmentin', 'clamoxyl', 'amoxiclav'] },
    { motsCles: ['sulfamide', 'sulfamides', 'sulfa', 'bactrim', 'cotrimoxazole'], nom: 'sulfamides', molecules: ['sulfamide', 'sulfamethoxazole', 'cotrimoxazole', 'bactrim', 'sulfadoxine', 'fansidar'] },
    { motsCles: ['aspirine', 'ains', 'ibuprofene', 'anti-inflammatoire', 'anti-inflammatoires', 'antiinflammatoire'], nom: 'aspirine / anti-inflammatoires', molecules: ['aspirine', 'acide acetylsalicylique', 'ibuprofene', 'diclofenac', 'ketoprofene', 'naproxene', 'indometacine', 'piroxicam', 'nimesulide'] },
    { motsCles: ['paracetamol', 'doliprane', 'efferalgan'], nom: 'paracétamol', molecules: ['paracetamol', 'doliprane', 'efferalgan', 'acetaminophene'] },
    { motsCles: ['chloroquine', 'quinine'], nom: 'chloroquine / quinine', molecules: ['chloroquine', 'quinine', 'hydroxychloroquine'] },
];

// Médicaments à éviter ou contre-indiqués pendant la grossesse (liste volontairement prudente et non exhaustive).
const GROSSESSE = [
    { molecules: ['ibuprofene', 'diclofenac', 'ketoprofene', 'naproxene', 'nimesulide', 'indometacine', 'piroxicam'], message: 'Anti-inflammatoire : à éviter pendant la grossesse, contre-indiqué à partir du 6e mois.' },
    { molecules: ['aspirine', 'acide acetylsalicylique'], message: 'Aspirine : usage à doses antalgiques déconseillé pendant la grossesse (contre-indiqué à partir du 6e mois).' },
    { molecules: ['enalapril', 'captopril', 'lisinopril', 'perindopril', 'ramipril', 'losartan', 'valsartan', 'irbesartan', 'candesartan'], message: 'Antihypertenseur IEC / sartan : contre-indiqué pendant la grossesse.' },
    { molecules: ['doxycycline', 'tetracycline', 'minocycline'], message: 'Cycline : contre-indiquée à partir du 2e trimestre (atteinte des dents et des os du fœtus).' },
    { molecules: ['warfarine', 'acenocoumarol', 'fluindione'], message: 'Anticoagulant oral (AVK) : contre-indiqué ou très encadré pendant la grossesse.' },
    { molecules: ['isotretinoine', 'acitretine', 'methotrexate', 'thalidomide', 'misoprostol'], message: 'Médicament tératogène ou abortif : contre-indiqué pendant la grossesse.' },
    { molecules: ['ciprofloxacine', 'ofloxacine', 'levofloxacine', 'norfloxacine'], message: 'Fluoroquinolone : à éviter pendant la grossesse sauf nécessité.' },
    { molecules: ['simvastatine', 'atorvastatine', 'pravastatine', 'rosuvastatine'], message: 'Statine : contre-indiquée pendant la grossesse.' },
    { molecules: ['cotrimoxazole', 'bactrim', 'sulfamethoxazole'], message: 'Cotrimoxazole : à éviter au 1er trimestre et en fin de grossesse.' },
];

const contient = (medicament, molecules) => { const m = fold(medicament); return molecules.find(molecule => m.includes(molecule)); };

/**
 * Contrôle une ordonnance. `lignes` : [{ medicament, posologie, duree }] ; `patient` : { age, enceinte: 'oui'|'non'|'inconnu', allergies }.
 * Retourne une liste d'alertes : { niveau: 'danger'|'attention'|'info', message }.
 */
export function checkSafety(lignes, patient) {
    const alertes = [];
    const actives = lignes.filter(l => l.medicament?.trim());
    const allergies = fold(patient.allergies || '');
    const allergyTokens = tokens(patient.allergies || '');

    for (const ligne of actives) {
        const nom = fold(ligne.medicament);
        // 1. allergie citée directement (ex. « amoxicilline ») ou par famille (ex. « pénicillines »)
        for (const token of allergyTokens) {
            if (token.length >= 5 && nom.includes(token)) alertes.push({ niveau: 'danger', message: `Allergie déclarée (« ${token} ») : vérifier ${ligne.medicament}.` });
        }
        for (const famille of FAMILLES_ALLERGIE) {
            const declaree = famille.motsCles.some(mot => allergies.includes(mot));
            const molecule = contient(ligne.medicament, famille.molecules);
            if (declaree && molecule) alertes.push({ niveau: 'danger', message: `Allergie déclarée aux ${famille.nom} : ${ligne.medicament} appartient à cette famille.` });
        }
        // 2. grossesse
        if (patient.enceinte === 'oui') {
            const trouve = GROSSESSE.find(item => contient(ligne.medicament, item.molecules));
            if (trouve) alertes.push({ niveau: 'danger', message: `${ligne.medicament} — ${trouve.message}` });
        }
        // 3. enfant
        const age = Number(patient.age);
        if (Number.isFinite(age) && age > 0 && age < 16 && contient(ligne.medicament, ['aspirine', 'acide acetylsalicylique'])) {
            alertes.push({ niveau: 'danger', message: `${ligne.medicament} : l’aspirine est déconseillée avant 16 ans (risque de syndrome de Reye).` });
        }
        // 4. posologie manquante
        if (!ligne.posologie?.trim()) alertes.push({ niveau: 'attention', message: `Posologie à préciser pour ${ligne.medicament}.` });
    }

    if (patient.enceinte === 'inconnu') alertes.push({ niveau: 'info', message: 'Grossesse non précisée : vérifiez-la avant de prescrire (certains médicaments sont contre-indiqués).' });
    const age = Number(patient.age);
    if (Number.isFinite(age) && age > 0 && age < 15) alertes.push({ niveau: 'attention', message: `Patient de ${age} ans : adaptez les doses au poids de l’enfant.` });
    if (Number.isFinite(age) && age >= 65) alertes.push({ niveau: 'info', message: `Patient de ${age} ans : pensez à adapter les doses (fonction rénale, interactions).` });

    const vus = new Set();
    for (const ligne of actives) {
        const cle = fold(ligne.medicament).trim();
        if (vus.has(cle)) alertes.push({ niveau: 'attention', message: `${ligne.medicament} apparaît deux fois sur l’ordonnance.` });
        vus.add(cle);
    }
    if (actives.length === 0) alertes.push({ niveau: 'info', message: 'Aucun médicament sélectionné.' });
    // un message identique n'est affiché qu'une fois
    return alertes.filter((a, i) => alertes.findIndex(b => b.message === a.message) === i);
}

// ----------------------------------------------------------------------------- texte et impression

export function ordonnanceTexte({ diagnostic, lignes }) {
    const actives = lignes.filter(l => l.medicament?.trim());
    const rows = actives.map((l, i) => `${i + 1}. ${l.medicament.trim()}${l.posologie ? ` — ${l.posologie.trim()}` : ''}${l.duree ? ` — pendant ${l.duree.trim()}` : ''}${l.remarques ? `\n   ${l.remarques.trim()}` : ''}`);
    return [diagnostic ? `Motif / diagnostic : ${diagnostic}` : null, ...rows].filter(Boolean).join('\n');
}

const escapeHtml = value => String(value ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);

/** Ouvre une fenêtre d'impression : en-tête du cabinet, identité du patient, lignes de prescription, zone de signature. */
export function printOrdonnance({ patient, diagnostic, lignes, prescripteur, date = new Date() }) {
    const popup = window.open('', '_blank', 'width=850,height=950');
    if (!popup) { window.alert('Autorisez les fenêtres contextuelles pour imprimer l’ordonnance.'); return; }
    const actives = lignes.filter(l => l.medicament?.trim());
    const lignesHtml = actives.map(l => `<li><strong>${escapeHtml(l.medicament)}</strong>${l.posologie ? `<div>${escapeHtml(l.posologie)}${l.duree ? ` — pendant ${escapeHtml(l.duree)}` : ''}</div>` : (l.duree ? `<div>Pendant ${escapeHtml(l.duree)}</div>` : '')}${l.remarques ? `<div class="note">${escapeHtml(l.remarques)}</div>` : ''}</li>`).join('');
    const html = `<!doctype html><html lang="fr"><head><meta charset="UTF-8"><title>Ordonnance — ${escapeHtml(patient.nom)}</title><style>@page{size:A4;margin:18mm}body{font:15px Arial,sans-serif;color:#1f2937;max-width:760px;margin:30px auto}header{display:flex;align-items:center;gap:16px;border-bottom:3px solid #0f766e;padding-bottom:14px}header img{width:64px;height:64px;object-fit:contain}h1{margin:0;font-size:22px;color:#0f766e}.sub{color:#64748b;font-size:13px}.meta{display:flex;justify-content:space-between;gap:20px;margin:22px 0 8px}.titre{text-align:center;letter-spacing:2px;color:#0f766e;margin:26px 0}.diag{margin:0 0 18px;color:#475569}ol{padding-left:22px}li{margin:0 0 16px;line-height:1.45}.note{color:#64748b;font-size:13px}.sign{margin-top:70px;display:flex;justify-content:flex-end}.sign div{width:260px;text-align:center;border-top:1px solid #94a3b8;padding-top:6px;color:#64748b;font-size:13px}.foot{margin-top:40px;color:#94a3b8;font-size:11px;text-align:center}@media print{body{margin:0}}</style></head><body><header><img src="${location.origin}/logo_casafami.png" alt=""><div><h1>CASAFAMI</h1><div class="sub">Cabinet d’accouchement — Andongona, Antsohihy</div></div></header><div class="meta"><div><strong>Patient :</strong> ${escapeHtml(patient.nom)}${patient.age ? `, ${escapeHtml(patient.age)} ans` : ''}</div><div><strong>Date :</strong> ${date.toLocaleDateString('fr-FR')}</div></div><h2 class="titre">ORDONNANCE</h2>${diagnostic ? `<p class="diag"><strong>Motif / diagnostic :</strong> ${escapeHtml(diagnostic)}</p>` : ''}<ol>${lignesHtml}</ol><div class="sign"><div>${prescripteur ? `${escapeHtml(prescripteur)}<br>` : ''}Cachet et signature du prescripteur</div></div><p class="foot">Document établi avec l’aide d’un assistant de rédaction : il n’est valable qu’après relecture et signature du prescripteur.</p><script>window.addEventListener('load',()=>setTimeout(()=>window.print(),300))</script></body></html>`;
    popup.document.open(); popup.document.write(html); popup.document.close();
}
