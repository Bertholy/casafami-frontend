/** Coordonnées du portfolio de VONJIARIMANANA Alpha Bertholy (page /portfolio). Tout se règle ici. */
const PUBLICATION_FACEBOOK = 'https://web.facebook.com/photo/?fbid=1092835360380395&set=a.154786947518579';

export const CONTACT_PORTFOLIO = Object.freeze({
    // `international` : numéro pour WhatsApp, sans « + » ni espace (indicatif de Madagascar 261, sans le 0 du début).
    whatsapp: [
        { affiche: '034 34 98 888', international: '261343498888' },
        { affiche: '032 11 076 78', international: '261321107678' },
    ],
    // Pas d'adresse de profil connue : le bouton ouvre la publication Facebook, qui mène au profil. `integration` : la même publication, affichée dans la page.
    facebook: {
        nom: 'Bër Thøly',
        lien: PUBLICATION_FACEBOOK,
        integration: `https://www.facebook.com/plugins/post.php?href=${encodeURIComponent(PUBLICATION_FACEBOOK)}&show_text=true&width=500`,
    },
    github: 'https://github.com/Bertholy/casafami',
    // Photo de profil : le fichier « photo-bertholy.jpg » du dossier « public ». Tant qu'il n'y est pas, une silhouette s'affiche à sa place.
    photo: '/photo-bertholy.jpg',
    // Seconde photo, en portrait (4:5), pour la section « À propos » : le fichier « photo-bertholy-apropos.jpg » du dossier « public ».
    photoApropos: '/photo-bertholy-apropos.jpg',
    // true si la photo est détourée (PNG sans fond) : elle passe alors devant le disque orange et dépasse sur l'anneau, comme sur le modèle.
    // false pour une photo normale : elle remplit le disque orange.
    photoDetouree: false,
});
