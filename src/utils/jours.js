// Jours affichés en raccourcis (aujourd'hui et les suivants) : calcul sur des dates ISO, sans décalage d'heure d'été.
export const ajouterJours = (iso, n) => { const d = new Date(`${iso}T12:00:00Z`); d.setUTCDate(d.getUTCDate() + n); return d.toISOString().slice(0, 10); };

export const formaterJour = (iso, lang, options) => iso ? new Date(`${iso}T12:00:00Z`).toLocaleDateString(lang === 'mg' ? 'mg' : 'fr-FR', { timeZone: 'UTC', ...options }) : '';
