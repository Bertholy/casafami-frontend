// Photo d'un service d'après son nom (quand l'administrateur n'a pas envoyé de photo pour ce service).
// Les photos sont dans public/ (service-*.jpg). « position » règle le cadrage quand la photo est coupée dans une carte haute
// (object-position) : elle garde les visages et le sujet dans le cadre.
// Les mots sont cherchés dans le nom, sans accents ni majuscules ; le premier groupe qui correspond l'emporte.
const PHOTOS = [
    { mots: ['echograph', 'imagerie'], src: '/service-echographie.jpg', position: '30% 50%' },
    { mots: ['grossesse', 'prenatal', 'maternite'], src: '/service-grossesse.jpg', position: '38% 50%' },
    { mots: ['accouchement', 'naissance'], src: '/service-accouchement.jpg', position: '42% 50%' },
    { mots: ['post-natal', 'postnatal', 'post natal', 'apres l accouchement', 'nouveau-ne', 'nouveau ne', 'allaitement'], src: '/service-post-natal.jpg', position: '50% 50%' },
    { mots: ['planning', 'contracepti'], src: '/service-planning-familial.jpg', position: '50% 50%' },
    { mots: ['vaccin'], src: '/service-vaccination.jpg', position: '46% 50%' },
    { mots: ['mobile', 'campagne'], src: '/service-clinique-mobile.jpg', position: '30% 50%' },
    { mots: ['analyse', 'laboratoire', 'sang', 'depistage'], src: '/service-depistage.jpg', position: '50% 50%' },
    { mots: ['soin', 'pansement', 'injection'], src: '/service-soins.jpg', position: '40% 50%' },
    { mots: ['consultation'], src: '/service-clinique-mobile.jpg', position: '40% 50%' },
    { mots: ['pediatr', 'enfant', 'croissance', 'nutrition'], src: '/service-suivi-enfant.jpg', position: '50% 40%' },
];
const PAR_DEFAUT = { src: '/cabinet_1.jpg', position: '50% 50%' };

const simplifier = texte => String(texte || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/['’]/g, ' ');

/** Photo et cadrage d'un service d'après son nom : { src, position }. */
export function photoDuService(nom) {
    const texte = simplifier(nom);
    return PHOTOS.find(photo => photo.mots.some(mot => texte.includes(mot))) || PAR_DEFAUT;
}
