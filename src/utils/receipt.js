const escapeHtml = value => String(value ?? '').replace(/[&<>"']/g, character => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[character]);

export function printReceipt(rdv) {
    const popup = window.open('', '_blank', 'width=850,height=900');
    if (!popup) { window.alert('Autorisez les fenêtres contextuelles pour imprimer le reçu.'); return; }
    const date = escapeHtml(rdv.dateRdv);
    const html = `<!doctype html><html lang="fr"><head><meta charset="UTF-8"><title>Reçu rendez-vous ${escapeHtml(rdv.id)}</title><style>@page{size:A4;margin:20mm}body{font:16px Arial,sans-serif;color:#1f2937;max-width:760px;margin:40px auto}.head{display:flex;align-items:center;gap:16px;border-bottom:3px solid #0f766e;padding-bottom:18px}.head img{width:70px;height:70px;object-fit:contain}.title{margin:32px 0;color:#0f766e;text-align:center;letter-spacing:1px}.row{display:flex;justify-content:space-between;gap:20px;border-bottom:1px solid #d1d5db;padding:14px 4px}.label{color:#64748b}.motif{white-space:pre-wrap}.foot{margin-top:40px;color:#64748b;font-size:13px}@media print{body{margin:0}}</style></head><body><header class="head"><img src="${location.origin}/logo_casafami.png" alt="Logo Casafami"><div><h1>Casafami</h1><div>Cabinet médical</div></div></header><h2 class="title">REÇU DE RENDEZ-VOUS</h2><div class="row"><span class="label">Numéro du rendez-vous</span><strong>${escapeHtml(rdv.id)}</strong></div><div class="row"><span class="label">Date du reçu</span><strong>${escapeHtml(rdv.dateCreation ? new Date(rdv.dateCreation).toLocaleDateString('fr-FR') : new Date().toLocaleDateString('fr-FR'))}</strong></div><div class="row"><span class="label">Client</span><strong>${escapeHtml(rdv.nomClient)}</strong></div><div class="row"><span class="label">Téléphone</span><strong>${escapeHtml(rdv.telephoneClient)}</strong></div><div class="row"><span class="label">Rendez-vous</span><strong>${date} à ${escapeHtml(String(rdv.heureRdv || '').slice(0,5))}</strong></div><div class="row"><span class="label">Statut</span><strong>${escapeHtml(({EN_ATTENTE:'En attente',CONFIRME:'Confirmé',ANNULE:'Annulé',TERMINE:'Terminé'})[rdv.statut] || rdv.statut)}</strong></div>${rdv.motif ? `<div class="row"><span class="label">Motif</span><strong class="motif">${escapeHtml(rdv.motif)}</strong></div>` : ''}<p class="foot">Ce document confirme l'enregistrement du rendez-vous. Veuillez le présenter au cabinet si nécessaire.</p><script>window.addEventListener('load',()=>setTimeout(()=>window.print(),300))</script></body></html>`;
    popup.document.open(); popup.document.write(html); popup.document.close();
}

const cp1252Special = { 0x20ac: 0x80, 0x201a: 0x82, 0x0192: 0x83, 0x201e: 0x84, 0x2026: 0x85, 0x2020: 0x86, 0x2021: 0x87, 0x02c6: 0x88, 0x2030: 0x89, 0x0160: 0x8a, 0x2039: 0x8b, 0x0152: 0x8c, 0x017d: 0x8e, 0x2018: 0x91, 0x2019: 0x92, 0x201c: 0x93, 0x201d: 0x94, 0x2022: 0x95, 0x2013: 0x96, 0x2014: 0x97, 0x02dc: 0x98, 0x2122: 0x99, 0x0161: 0x9a, 0x203a: 0x9b, 0x0153: 0x9c, 0x017e: 0x9e, 0x0178: 0x9f };

function pdfText(value) {
    return [...String(value ?? '')].map(character => {
        const code = character.codePointAt(0);
        const byte = cp1252Special[code] ?? (code <= 255 ? code : 63);
        if (byte < 32 || byte > 126) return `\\${byte.toString(8).padStart(3, '0')}`;
        return String.fromCharCode(byte).replace(/[()\\]/g, match => `\\${match}`);
    }).join('');
}

export function downloadReceiptPdf(rdv) {
    const status = ({ EN_ATTENTE: 'En attente', CONFIRME: 'Confirmé', ANNULE: 'Annulé', TERMINE: 'Terminé' })[rdv.statut] || rdv.statut;
    const lines = [
        { text: 'CASAFAMI', size: 24, color: '0.06 0.46 0.43' },
        { text: 'Cabinet médical', size: 11 },
        { text: 'REÇU DE RENDEZ-VOUS', size: 18, color: '0.06 0.46 0.43', gap: 28 },
        { text: `Numéro du rendez-vous : ${rdv.id}`, gap: 8 },
        { text: `Date du reçu : ${rdv.dateCreation ? new Date(rdv.dateCreation).toLocaleDateString('fr-FR') : new Date().toLocaleDateString('fr-FR')}` },
        { text: `Client : ${rdv.nomClient}`, gap: 8 },
        { text: `Telephone : ${rdv.telephoneClient}` },
        { text: `Rendez-vous : ${rdv.dateRdv} à ${String(rdv.heureRdv || '').slice(0, 5)}` },
        { text: `Statut : ${status}`, gap: 8 },
        ...(rdv.motif ? [{ text: 'Motif :', gap: 8 }, ...String(rdv.motif).split(/\r?\n/).flatMap(paragraph => {
            const words = paragraph.split(/\s+/); const wrapped = []; let current = '';
            for (const word of words) { if (current && `${current} ${word}`.length > 100) { wrapped.push(current); current = word; } else current = current ? `${current} ${word}` : word; }
            if (current) wrapped.push(current);
            return wrapped.map(text => ({ text, size: 10, gap: 14, indent: 12 }));
        })] : []),
        { text: 'Ce document confirme l’enregistrement du rendez-vous.', size: 9, color: '0.35 0.39 0.44', gap: 24 },
    ];
    let y = 780;
    const commands = ['0.88 0.91 0.92 RG 70 710 m 525 710 l S'];
    for (const line of lines) {
        y -= line.gap || 22;
        commands.push(`${line.color || '0.12 0.16 0.20'} rg BT /F1 ${line.size || 12} Tf ${70 + (line.indent || 0)} ${y} Td (${pdfText(line.text)}) Tj ET`);
    }
    const stream = commands.join('\n');
    const objects = [
        '<< /Type /Catalog /Pages 2 0 R >>',
        '<< /Type /Pages /Kids [3 0 R] /Count 1 >>',
        '<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >>',
        '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>',
        `<< /Length ${stream.length} >>\nstream\n${stream}\nendstream`,
    ];
    let document = '%PDF-1.4\n';
    const offsets = [0];
    objects.forEach((object, index) => { offsets.push(document.length); document += `${index + 1} 0 obj\n${object}\nendobj\n`; });
    const xrefOffset = document.length;
    document += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
    offsets.slice(1).forEach(offset => { document += `${String(offset).padStart(10, '0')} 00000 n \n`; });
    document += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`;
    const url = URL.createObjectURL(new Blob([document], { type: 'application/pdf' }));
    const anchor = window.document.createElement('a');
    anchor.href = url; anchor.download = `casafami-recu-rdv-${rdv.id}.pdf`;
    window.document.body.appendChild(anchor); anchor.click(); anchor.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}
