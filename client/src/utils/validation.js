export const validerEmail = email => {
    const regexEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return regexEmail.test(email);
};

export const validerMotDePasse = motDePasse => {
    if (motDePasse.length < 6) {
        return {
            valide: false,
            erreur: 'Le mot de passe doit contenir au moins 6 caractères',
        };
    }

    return {
        valide: true,
        erreur: '',
    };
};

export const validerNom = nom => {
    if (!nom || nom.trim().length < 2) {
        return {
            valide: false,
            erreur: 'Le nom doit contenir au moins 2 caractères',
        };
    }

    if (!/^[a-zA-ZÀ-ÿ\s\-']+$/.test(nom)) {
        return {
            valide: false,
            erreur: 'Le nom contient des caractères non autorisés',
        };
    }

    return {
        valide: true,
        erreur: '',
    };
};

export const validerPrenom = prenom => {
    if (!prenom || prenom.trim().length < 2) {
        return {
            valide: false,
            erreur: 'Le prénom doit contenir au moins 2 caractères',
        };
    }

    if (!/^[a-zA-ZÀ-ÿ\s\-']+$/.test(prenom)) {
        return {
            valide: false,
            erreur: 'Le prénom contient des caractères non autorisés',
        };
    }

    return {
        valide: true,
        erreur: '',
    };
};

export const validerGenre = genre => {
    if (!genre) {
        return {
            valide: false,
            erreur: 'Le genre est obligatoire',
        };
    }

    if (!['Homme', 'Femme'].includes(genre)) {
        return {
            valide: false,
            erreur: 'Le genre doit être Homme ou Femme',
        };
    }

    return {
        valide: true,
        erreur: '',
    };
};

export const validerTelephone = telephone => {
    if (!telephone) {
        return {
            valide: false,
            erreur: 'Le téléphone est obligatoire',
        };
    }

    // Format E.164 basique
    if (!/^\+\d{10,15}$/.test(telephone)) {
        return {
            valide: false,
            erreur: 'Format de téléphone invalide',
        };
    }

    return {
        valide: true,
        erreur: '',
    };
};
