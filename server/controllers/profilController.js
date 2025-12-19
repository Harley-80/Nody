import asyncHandler from 'express-async-handler';
import Utilisateur from '../models/utilisateurModel.js';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Obtenir toutes les adresses de l'utilisateur
export const obtenirAdresses = asyncHandler(async (req, res) => {
    const utilisateur = await Utilisateur.findById(req.utilisateur._id);

    if (!utilisateur) {
        res.status(404);
        throw new Error('Utilisateur non trouvé');
    }

    res.json({
        succes: true,
        adresses: utilisateur.adresses || [],
    });
});

// Ajouter une nouvelle adresse
export const ajouterAdresse = asyncHandler(async (req, res) => {
    const {
        type,
        nomComplet,
        telephone,
        adresse,
        ville,
        codePostal,
        pays,
        instructions,
        parDefaut,
    } = req.body;

    // Validation des champs obligatoires
    if (!type || !nomComplet || !telephone || !adresse || !ville || !pays) {
        res.status(400);
        throw new Error('Tous les champs obligatoires doivent être renseignés');
    }

    const utilisateur = await Utilisateur.findById(req.utilisateur._id);

    if (!utilisateur) {
        res.status(404);
        throw new Error('Utilisateur non trouvé');
    }

    // Si c'est la première adresse ou si parDefaut est true, définir comme adresse par défaut
    const estPremiereAdresse =
        !utilisateur.adresses || utilisateur.adresses.length === 0;
    const nouvelleAdresseParDefaut = estPremiereAdresse || parDefaut;

    // Si la nouvelle adresse est définie par défaut, retirer le statut des autres
    if (nouvelleAdresseParDefaut && utilisateur.adresses) {
        utilisateur.adresses.forEach(addr => {
            addr.parDefaut = false;
        });
    }

    // Créer la nouvelle adresse
    const nouvelleAdresse = {
        type,
        nomComplet,
        telephone,
        adresse,
        ville,
        codePostal: codePostal || '',
        pays,
        instructions: instructions || '',
        parDefaut: nouvelleAdresseParDefaut,
    };

    // Initialiser le tableau si nécessaire
    if (!utilisateur.adresses) {
        utilisateur.adresses = [];
    }

    utilisateur.adresses.push(nouvelleAdresse);
    await utilisateur.save();

    res.status(201).json({
        succes: true,
        message: 'Adresse ajoutée avec succès',
        adresses: utilisateur.adresses,
    });
});

// Modifier une adresse existante
export const modifierAdresse = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const {
        type,
        nomComplet,
        telephone,
        adresse,
        ville,
        codePostal,
        pays,
        instructions,
    } = req.body;

    const utilisateur = await Utilisateur.findById(req.utilisateur._id);

    if (!utilisateur) {
        res.status(404);
        throw new Error('Utilisateur non trouvé');
    }

    // Trouver l'adresse à modifier
    const adresseIndex = utilisateur.adresses.findIndex(
        addr => addr._id.toString() === id
    );

    if (adresseIndex === -1) {
        res.status(404);
        throw new Error('Adresse non trouvée');
    }

    // Mettre à jour les champs
    if (type) utilisateur.adresses[adresseIndex].type = type;
    if (nomComplet) utilisateur.adresses[adresseIndex].nomComplet = nomComplet;
    if (telephone) utilisateur.adresses[adresseIndex].telephone = telephone;
    if (adresse) utilisateur.adresses[adresseIndex].adresse = adresse;
    if (ville) utilisateur.adresses[adresseIndex].ville = ville;
    if (codePostal !== undefined)
        utilisateur.adresses[adresseIndex].codePostal = codePostal;
    if (pays) utilisateur.adresses[adresseIndex].pays = pays;
    if (instructions !== undefined)
        utilisateur.adresses[adresseIndex].instructions = instructions;

    await utilisateur.save();

    res.json({
        succes: true,
        message: 'Adresse modifiée avec succès',
        adresses: utilisateur.adresses,
    });
});

// Supprimer une adresse
export const supprimerAdresse = asyncHandler(async (req, res) => {
    const { id } = req.params;

    const utilisateur = await Utilisateur.findById(req.utilisateur._id);

    if (!utilisateur) {
        res.status(404);
        throw new Error('Utilisateur non trouvé');
    }

    // Trouver l'adresse à supprimer
    const adresseIndex = utilisateur.adresses.findIndex(
        addr => addr._id.toString() === id
    );

    if (adresseIndex === -1) {
        res.status(404);
        throw new Error('Adresse non trouvée');
    }

    // Vérifier si c'est l'adresse par défaut
    const etaitParDefaut = utilisateur.adresses[adresseIndex].parDefaut;

    // Supprimer l'adresse
    utilisateur.adresses.splice(adresseIndex, 1);

    // Si c'était l'adresse par défaut et qu'il reste des adresses, définir la première comme défaut
    if (etaitParDefaut && utilisateur.adresses.length > 0) {
        utilisateur.adresses[0].parDefaut = true;
    }

    await utilisateur.save();

    res.json({
        succes: true,
        message: 'Adresse supprimée avec succès',
        adresses: utilisateur.adresses,
    });
});

// Définir une adresse comme adresse par défaut
export const definirAdresseParDefaut = asyncHandler(async (req, res) => {
    const { id } = req.params;

    const utilisateur = await Utilisateur.findById(req.utilisateur._id);

    if (!utilisateur) {
        res.status(404);
        throw new Error('Utilisateur non trouvé');
    }

    // Trouver l'adresse
    const adresseIndex = utilisateur.adresses.findIndex(
        addr => addr._id.toString() === id
    );

    if (adresseIndex === -1) {
        res.status(404);
        throw new Error('Adresse non trouvée');
    }

    // Retirer le statut par défaut de toutes les adresses
    utilisateur.adresses.forEach(addr => {
        addr.parDefaut = false;
    });

    // Définir la nouvelle adresse par défaut
    utilisateur.adresses[adresseIndex].parDefaut = true;

    await utilisateur.save();

    res.json({
        succes: true,
        message: 'Adresse définie comme adresse par défaut',
        adresses: utilisateur.adresses,
    });
});

// Upload de l'avatar
export const uploadAvatar = asyncHandler(async (req, res) => {
    if (!req.file) {
        res.status(400);
        throw new Error('Aucun fichier fourni');
    }

    const utilisateur = await Utilisateur.findById(req.utilisateur._id);

    if (!utilisateur) {
        res.status(404);
        throw new Error('Utilisateur non trouvé');
    }

    // Supprimer l'ancien avatar s'il existe
    if (utilisateur.avatar) {
        const ancienAvatarPath = path.join(
            __dirname,
            '..',
            'uploads',
            'avatars',
            path.basename(utilisateur.avatar)
        );
        if (fs.existsSync(ancienAvatarPath)) {
            fs.unlinkSync(ancienAvatarPath);
        }
    }

    // Sauvegarder le chemin du nouvel avatar
    utilisateur.avatar = `/uploads/avatars/${req.file.filename}`;
    await utilisateur.save();

    res.json({
        succes: true,
        message: 'Avatar mis à jour avec succès',
        avatar: utilisateur.avatar,
    });
});