// Données des utilisateurs pour le peuplement
import bcrypt from 'bcryptjs';

// Hasher les mots de passe ici pour des raisons de sécurité
const motDePasseHashe = await bcrypt.hash('password123', 12);

const utilisateursData = [
    {
        nom: 'Admin',
        email: 'admin@nody.com',
        motDePasse: motDePasseHashe,
        role: 'admin',
        adresse: {
            rue: '123 Rue Admin',
            ville: 'Dakar',
            codePostal: '75001',
            pays: 'Sénégal',
        },
        telephone: '+22178001211',
        dateInscription: new Date(),
    },
    {
        nom: 'Franck',
        email: 'franck@email.com',
        motDePasse: motDePasseHashe,
        role: 'client',
        adresse: {
            rue: 'rue de Franck',
            ville: 'Dakar',
            codePostal: '69001',
            pays: 'Sénégal',
        },
        telephone: '+22178001212',
        dateInscription: new Date(),
    },
    // ... ajouter plus d'utilisateurs si nécessaire pour les tests
];

export default utilisateursData;
