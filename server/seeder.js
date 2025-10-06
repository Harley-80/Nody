// Importation des modules nécessaires
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import { faker } from '@faker-js/faker';
import { fileURLToPath } from 'url';
import path from 'path';

// Importation des modèles
import Utilisateur from './models/utilisateurModel.js';
import Categorie from './models/categorieModel.js';
import Produit from './models/produitModel.js';
import Commande from './models/commandeModel.js';
import Paiement from './models/paiementModel.js';

// Configuration du chemin pour le fichier .env
const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '.env') });

// Configuration de Faker en français
faker.locale = 'fr';

/**
 * Données complètes des catégories avec une structure hiérarchique
 * Chaque catégorie a un nom et un parent (null pour les catégories racines)
 */
const donneesCategories = [
    // Catégories racines 9
    { nom: 'Vêtements homme', parent: null },
    { nom: 'Vêtements femme', parent: null },
    { nom: 'Enfants', parent: null },
    { nom: 'Chaussures', parent: null },
    { nom: 'Accessoires', parent: null },
    { nom: 'Sacs, bagages', parent: null },
    { nom: 'Bijouterie', parent: null },
    { nom: 'Extensions, perruques', parent: null },
    { nom: 'Sous-vêtements, vêtements de détente', parent: null },

    // Sous-catégories pour "Vêtements homme" *************************
    { nom: 'Pantalons', parent: 'Vêtements homme' },
    { nom: 'Pulls', parent: 'Vêtements homme' },
    { nom: 'Blazers et costumes', parent: 'Vêtements homme' },
    { nom: 'Ensembles', parent: 'Vêtements homme' },
    { nom: 'Doudounes', parent: 'Vêtements homme' },
    { nom: 'Jeans', parent: 'Vêtements homme' },
    { nom: 'Vestes', parent: 'Vêtements homme' },
    { nom: 'Shorts', parent: 'Vêtements homme' },
    { nom: 'Chemises', parent: 'Vêtements homme' },
    { nom: 'Nouveautés', parent: 'Vêtements homme' },
    { nom: "Plus d'options d'achats", parent: 'Vêtements homme' },

    // Sous-sous-catégories pour "Pantalons"
    { nom: 'Pantalons en cuir', parent: 'Pantalons' },
    { nom: 'Pantalons crayon', parent: 'Pantalons' },
    { nom: 'Pantalons décontractés', parent: 'Pantalons' },
    { nom: 'Pantalons droits', parent: 'Pantalons' },
    { nom: 'Pantalons bouffants', parent: 'Pantalons' },
    { nom: 'Joggings', parent: 'Pantalons' },

    // Sous-sous-catégories pour "Pulls"
    { nom: 'Cols roulés', parent: 'Pulls' },
    { nom: 'Pulls imprimés', parent: 'Pulls' },
    { nom: 'Gilets', parent: 'Pulls' },
    { nom: 'Gilets sans manches', parent: 'Pulls' },
    { nom: 'Pulls rayés', parent: 'Pulls' },
    { nom: 'Pulls Classiques', parent: 'Pulls' },

    // Sous-sous-catégories pour "Blazers et costumes"
    { nom: 'Vestes de costume', parent: 'Blazers et costumes' },
    { nom: 'Costumes', parent: 'Blazers et costumes' },
    { nom: 'Costumes croisés', parent: 'Blazers et costumes' },
    { nom: 'Blazers', parent: 'Blazers et costumes' },
    { nom: 'Costumes simple boutonnage', parent: 'Blazers et costumes' },
    { nom: 'Pantalons de costume', parent: 'Blazers et costumes' },

    // Sous-sous-catégories pour "Doudounes"
    { nom: 'Doudounes longues', parent: 'Doudounes' },
    { nom: 'Doudounes courtes', parent: 'Doudounes' },
    { nom: 'Doudounes légères', parent: 'Doudounes' },
    { nom: 'Doudounes à capuche', parent: 'Doudounes' },

    // Sous-sous-catégories pour "Jeans"
    { nom: 'Jeans brossés', parent: 'Jeans' },
    { nom: 'Jeans déchirés', parent: 'Jeans' },
    { nom: 'jeans destroy', parent: 'Jeans' },
    { nom: 'Jeans effilés', parent: 'Jeans' },
    { nom: 'Jeans slim', parent: 'Jeans' },
    { nom: 'Jeans cargo/baggy', parent: 'Jeans' },
    { nom: 'Jeans délavés', parent: 'Jeans' },
    { nom: 'Jean', parent: 'Jeans' },

    // Sous-sous-catégories pour "Vestes"
    { nom: 'Vestes bomber', parent: 'Vestes' },
    { nom: 'Manteaux', parent: 'Vestes' },
    { nom: 'Vestes de baseball', parent: 'Vestes' },
    { nom: 'Gilet sans manches', parent: 'Vestes' },
    { nom: 'Vestes en jean', parent: 'Vestes' },

    // Sous-sous-catégories pour "Shorts"
    { nom: 'Shorts de gym', parent: 'Shorts' },
    { nom: 'Shorts de surf', parent: 'Shorts' },
    { nom: 'Shorts en lin', parent: 'Shorts' },
    { nom: 'Shorts en jean', parent: 'Shorts' },
    { nom: 'Shorts cargo', parent: 'Shorts' },
    { nom: 'Shorts', parent: 'Shorts' },

    // Sous-sous-catégories pour "Chemises"
    { nom: 'Chemises cargo', parent: 'Chemises' },
    { nom: 'Chemises en lin', parent: 'Chemises' },
    { nom: 'Chemises vestes', parent: 'Chemises' },
    { nom: 'Chemises imprimées ou motifs', parent: 'Chemises' },
    { nom: 'Chemises en jean', parent: 'Chemises' },
    { nom: 'Chemises unies', parent: 'Chemises' },

    // Sous-sous-catégories pour "Nouveautés"
    { nom: 'Nouveautés sweat ou pull-over', parent: 'Nouveautés' },
    { nom: 'Nouveautés pantalons', parent: 'Nouveautés' },
    { nom: 'Nouveautés shorts', parent: 'Nouveautés' },
    { nom: 'Nouveautés ensembles', parent: 'Nouveautés' },
    { nom: 'Nouveautés costumes', parent: 'Nouveautés' },
    { nom: 'Nouveautés t-shirts', parent: 'Nouveautés' },

    // Sous-sous-catégories pour "Plus d'options d'achats"
    { nom: 'Meilleures ventes', parent: "Plus d'options d'achats" },

    // Vêtements femme (et ses sous-catégories) *************************
    { nom: 'Bas', parent: 'Vêtements femme' },
    { nom: 'Robes', parent: 'Vêtements femme' },
    { nom: 'Robes occasion spéciale', parent: 'Vêtements femme' },
    { nom: 'Grande taille', parent: 'Vêtements femme' },
    { nom: "Vêtements d'extérieur", parent: 'Vêtements femme' },
    { nom: 'Ensembles assortis', parent: 'Vêtements femme' },
    { nom: 'Hauts', parent: 'Vêtements femme' },
    { nom: 'Maillots de bain', parent: 'Vêtements femme' },
    { nom: 'Nouveautés', parent: 'Vêtements femme' },
    { nom: "Plus d'options d'achats", parent: 'Vêtements femme' },

    // Sous-sous-catégories pour "Bas"
    { nom: 'Pantalons', parent: 'Bas' },
    { nom: 'Shorts', parent: 'Bas' },
    { nom: 'Jupes', parent: 'Bas' },
    { nom: 'Jeans', parent: 'Bas' },
    { nom: 'collant', parent: 'Bas' },
    { nom: 'Joggings', parent: 'Bas' },

    // Sous-sous-catégories pour "Robes"
    { nom: 'Robes tricotées', parent: 'Robes' },
    { nom: 'Robes longues', parent: 'Robes' },
    { nom: 'Robes à manches longues', parent: 'Robes' },
    { nom: 'Robes de soirée', parent: 'Robes' },
    { nom: 'Robes courtes', parent: 'Robes' },
    { nom: 'Robes', parent: 'Robes' },

    // Sous-sous-catégories pour "Robes occasion spéciale"
    { nom: 'Robes bal de promo', parent: 'Robes occasion spéciale' },
    { nom: 'Robes de soirée', parent: 'Robes occasion spéciale' },
    { nom: 'Robes africaines', parent: 'Robes occasion spéciale' },

    // Sous-sous-catégories pour "Grande taille"
    { nom: 'Maillots de bain grande taille', parent: 'Grande taille' },
    { nom: "Vêtements d'extérieur grande taille", parent: 'Grande taille' },
    { nom: 'Ensembles grande taille', parent: 'Grande taille' },
    { nom: 'Grandes tailles', parent: 'Grande taille' },
    { nom: 'Hauts grande taille', parent: 'Grande taille' },

    // Sous-sous-catégories pour "Vêtements d'extérieur"
    { nom: 'Doudounes', parent: "Vêtements d'extérieur" },
    {
        nom: 'Manteaux en laine et manches longues',
        parent: "Vêtements d'extérieur",
    },
    { nom: 'Doudounes longues', parent: "Vêtements d'extérieur" },
    { nom: 'Doudounes courtes', parent: "Vêtements d'extérieur" },
    { nom: 'Gilets', parent: "Vêtements d'extérieur" },

    // Sous-sous-catégories pour "Ensembles assortis"
    { nom: 'Ensembles pantalons', parent: 'Ensembles assortis' },
    { nom: 'Ensembles shorts', parent: 'Ensembles assortis' },
    { nom: 'Ensembles robes', parent: 'Ensembles assortis' },
    { nom: 'Ensembles pulls', parent: 'Ensembles assortis' },

    // Sous-sous-catégories pour "Hauts"
    { nom: 'Chemises et blouses', parent: 'Hauts' },
    { nom: 'Tricots', parent: 'Hauts' },
    { nom: 'Pulls chauds', parent: 'Hauts' },
    { nom: 'Pulls à col rond', parent: 'Hauts' },
    { nom: 'T-shirts à manches longues', parent: 'Hauts' },
    { nom: 'T-shirts à manches court', parent: 'Hauts' },
    { nom: 'Cols roulés', parent: 'Hauts' },

    // Sous-sous-catégories pour "Maillots de bain"
    { nom: 'Une pièce', parent: 'Maillots de bain' },
    { nom: 'Bikinis ou tring', parent: 'Maillots de bain' },
    { nom: 'Pareos ou pagne', parent: 'Maillots de bain' },

    // Sous-sous-catégories pour "Nouveautés"
    { nom: 'Nouveautés manteaux', parent: 'Nouveautés' },
    { nom: 'Nouveautés pantalons', parent: 'Nouveautés' },
    { nom: 'Nouveautés vêtements', parent: 'Nouveautés' },
    { nom: 'Nouveautés robes', parent: 'Nouveautés' },
    { nom: 'Nouveautés ensembles', parent: 'Nouveautés' },
    { nom: 'Nouveautés pulls', parent: 'Nouveautés' },

    // Sous-sous-catégories pour "Plus d'options d'achats"
    { nom: 'Meilleures ventes', parent: "Plus d'options d'achats" },

    // Enfants (et ses sous-catégories) *************************
    { nom: 'Accessoires enfants', parent: 'Enfants' },
    { nom: 'Vêtements enfant', parent: 'Enfants' },
    { nom: 'Chaussures enfant', parent: 'Enfants' },
    { nom: "Plus d'options d'achats", parent: 'Enfants' },

    // Sous-sous-catégories pour "Accessoires enfants"
    { nom: 'Chapeaux, écharpes, gants', parent: 'Accessoires enfants' },
    { nom: 'Sacs enfants', parent: 'Accessoires enfants' },

    // Sous-sous-catégories pour "Vêtements enfant"
    { nom: 'Chaussure enfant', parent: 'Vêtements enfant' },
    { nom: 'Polos', parent: 'Vêtements enfant' },
    { nom: 'T-short', parent: 'Vêtements enfant' },
    { nom: 'Shorts', parent: 'Vêtements enfant' },
    { nom: 'Ensembles enfant', parent: 'Vêtements enfant' },
    { nom: 'Chaussettes enfant', parent: 'Vêtements enfant' },
    { nom: "Vêtements d'extérieur enfant", parent: 'Vêtements enfant' },

    // Sous-sous-catégories pour "Chaussures enfant"
    { nom: 'Chaussures décontractées', parent: 'Chaussures enfant' },
    { nom: 'Bottes enfant', parent: 'Chaussures enfant' },
    { nom: 'Basket', parent: 'Chaussures enfant' },
    { nom: 'Mocassin', parent: 'Chaussures enfant' },
    { nom: 'Sandales', parent: 'Chaussures enfant' },

    // Sous-sous-catégories pour "Plus d'options d'achats"
    { nom: 'Meilleures ventes', parent: "Plus d'options d'achats" },

    // Chaussures (et ses sous-catégories) *************************
    { nom: 'Chaussures décontractées', parent: 'Chaussures' },
    { nom: 'Bottes femme', parent: 'Chaussures' },
    { nom: 'Chaussures plates', parent: 'Chaussures' },
    { nom: 'Sandales et chaussures homme', parent: 'Chaussures' },
    { nom: 'Chaussures à talons homme', parent: 'Chaussures' },
    { nom: "Plus d'options d'achats", parent: 'Chaussures' },
    { nom: 'Chaussures décontractées (bis)', parent: 'Chaussures' },
    { nom: 'Accessoires', parent: 'Chaussures' },
    { nom: 'Sandales et chaussons femme', parent: 'Chaussures' },
    { nom: 'Bottes homme', parent: 'Chaussures' },
    { nom: 'Chaussures professionnelles', parent: 'Chaussures' },

    // Sous-sous-catégories pour "Chaussures décontractées"
    { nom: 'Bottines à lacets femme', parent: 'Bottes femme' },
    { nom: 'Nouveautés bottes femme', parent: 'Bottes femme' },
    { nom: 'Bottes de pluie', parent: 'Bottes femme' },
    { nom: 'Bottes hautes', parent: 'Bottes femme' },

    // Sous-sous-catégories pour "Chaussures plates"
    { nom: 'Chaussures babies', parent: 'Chaussures plates' },
    { nom: 'Ballerines', parent: 'Chaussures plates' },
    { nom: 'Chaussures en cuir', parent: 'Chaussures plates' },
    { nom: 'Chaussures compensées', parent: 'Chaussures plates' },

    // Sous-sous-catégories pour "Sandales et chaussures homme"
    { nom: 'Tongs homme', parent: 'Sandales et chaussures homme' },
    { nom: 'Sandales en cuir', parent: 'Sandales et chaussures homme' },
    { nom: "Chaussons d'hiver homme", parent: 'Sandales et chaussures homme' },
    { nom: 'Claquettes en plastique', parent: 'Sandales et chaussures homme' },
    { nom: 'Sandales sport', parent: 'Sandales et chaussures homme' },

    // Sous-sous-catégories pour "Chaussures à talons homme"
    { nom: 'Chaussures à bout rond', parent: 'Chaussures à talons homme' },
    { nom: 'Talons compensés', parent: 'Chaussures à talons homme' },
    { nom: 'Chaussures à bout pointu', parent: 'Chaussures à talons homme' },
    { nom: 'Chaussures à bouts ouverts', parent: 'Chaussures à talons homme' },
    { nom: 'Talons très haut', parent: 'Chaussures à talons homme' },

    // Sous-sous-catégories pour "Plus d'options d'achats"
    { nom: 'Meilleures ventes', parent: "Plus d'options d'achats" },

    // Sous-sous-catégories pour "Chaussures décontractées (bis)"
    { nom: 'Mocassins homme', parent: 'Chaussures décontractées (bis)' },
    {
        nom: 'Chaussures en toile homme',
        parent: 'Chaussures décontractées (bis)',
    },
    { nom: 'Chaussures en cuir', parent: 'Chaussures décontractées (bis)' },
    { nom: 'Baskets décontractées', parent: 'Chaussures décontractées (bis)' },
    { nom: 'Chaussures sport', parent: 'Chaussures décontractées (bis)' },

    // Sous-sous-catégories pour "Accessoires" *************************
    { nom: 'Semelles intérieures', parent: 'Accessoires' },
    { nom: 'Housses de chaussures', parent: 'Accessoires' },
    { nom: 'Lacets', parent: 'Accessoires' },
    { nom: 'Cirage à chaussures', parent: 'Accessoires' },
    { nom: 'Kits soin chaussures', parent: 'Accessoires' },

    // Sous-sous-catégories pour "Sandales et chaussons femme"
    { nom: 'Sandales à talons', parent: 'Sandales et chaussons femme' },
    { nom: 'Mules', parent: 'Sandales et chaussons femme' },
    { nom: 'Sandales à lanières', parent: 'Sandales et chaussons femme' },
    { nom: 'Tongs femme', parent: 'Sandales et chaussons femme' },
    { nom: 'Sandales plates', parent: 'Sandales et chaussons femme' },
    { nom: "Chaussons d'hiver femme", parent: 'Sandales et chaussons femme' },

    // Sous-sous-catégories pour "Bottes homme"
    { nom: 'Bottines à lacets homme', parent: 'Bottes homme' },
    { nom: 'Chaussures travail et sécurité', parent: 'Bottes homme' },
    { nom: 'Bottes en cuir', parent: 'Bottes homme' },
    { nom: 'Bottines militaires homme', parent: 'Bottes homme' },

    // Sous-sous-catégories pour "Chaussures professionnelles"
    { nom: 'Chaussures derby', parent: 'Chaussures professionnelles' },
    { nom: 'Chaussures élégantes', parent: 'Chaussures professionnelles' },
    { nom: 'Mocassins', parent: 'Chaussures professionnelles' },
    { nom: 'Chaussures décontractées', parent: 'Chaussures professionnelles' },

    // Accessoires (et ses sous-catégories) *************************
    { nom: 'Écharpes et gants', parent: 'Accessoires' },
    { nom: 'Chapeaux', parent: 'Accessoires' },
    { nom: 'Ceintures', parent: 'Accessoires' },
    { nom: 'Lunettes de soleil', parent: 'Accessoires' },
    { nom: "Plus d'options d'achats", parent: 'Accessoires' },
    { nom: 'Autres accessoires', parent: 'Accessoires' },

    // Sous-sous-catégories pour "Écharpes et gants"
    { nom: 'Foulards en soie', parent: 'Écharpes et gants' },
    { nom: 'Gants tricotés', parent: 'Écharpes et gants' },
    { nom: 'Écharpes en soie', parent: 'Écharpes et gants' },
    { nom: 'Écharpes unies', parent: 'Écharpes et gants' },
    { nom: 'Écharpes cachemire', parent: 'Écharpes et gants' },
    { nom: 'Écharpes à carreaux', parent: 'Écharpes et gants' },

    // Sous-sous-catégories pour "Chapeaux"
    { nom: 'Chapeaux fantaisie', parent: 'Chapeaux' },
    { nom: 'Cagoules', parent: 'Chapeaux' },
    { nom: 'Chapeaux', parent: 'Chapeaux' },
    { nom: 'Chapeaux de soleil enfants', parent: 'Chapeaux' },
    { nom: 'Casquettes', parent: 'Chapeaux' },

    // Sous-sous-catégories pour "Ceintures"
    { nom: 'Chaînes de taille', parent: 'Ceintures' },
    { nom: 'Ceintures homme', parent: 'Ceintures' },
    { nom: 'Ceintures mode', parent: 'Ceintures' },
    { nom: 'Accessoires ceinture', parent: 'Ceintures' },
    { nom: 'Ceintures féminine', parent: 'Ceintures' },

    // Sous-sous-catégories pour "Lunettes de soleil"
    { nom: 'Lunettes de soleil femme', parent: 'Lunettes de soleil' },
    { nom: 'Lunettes de soleil enfants', parent: 'Lunettes de soleil' },
    { nom: 'Lunettes de soleil polarisées', parent: 'Lunettes de soleil' },
    { nom: 'Lunettes de soleil fantaisie', parent: 'Lunettes de soleil' },
    { nom: 'Lunettes de soleil tendance', parent: 'Lunettes de soleil' },
    { nom: 'Lunettes de soleil cycliste', parent: 'Lunettes de soleil' },

    // Sous-sous-catégories pour "Plus d'options d'achats"
    { nom: 'Meilleures ventes', parent: "Plus d'options d'achats" },

    // Sous-sous-catégories pour "Autres accessoires"
    { nom: 'Masques', parent: 'Autres accessoires' },
    { nom: 'Noeuds papillon', parent: 'Autres accessoires' },
    { nom: 'Mouchoirs en tissu', parent: 'Autres accessoires' },
    { nom: 'Cravates', parent: 'Autres accessoires' },
    { nom: 'Cannes tendances', parent: 'Autres accessoires' },
    { nom: 'Bretelles', parent: 'Autres accessoires' },
    { nom: 'Porte jarretelles', parent: 'Autres accessoires' },

    // Sous-sous-catégories pour "Accessoires de tête"
    { nom: 'Pinces à cheveux', parent: 'Accessoires de tête' },
    { nom: 'Bonnets de nuit', parent: 'Accessoires de tête' },
    { nom: 'Élastiques et chouchous', parent: 'Accessoires de tête' },
    { nom: 'Bandeaux', parent: 'Accessoires de tête' },
    { nom: 'Barrettes à cheveux', parent: 'Accessoires de tête' },

    // Sacs, bagages (et ses sous-catégories) *************************
    { nom: 'Sac à main', parent: 'Sacs, bagages' },
    { nom: 'Portefeuille, porte-monnaie', parent: 'Sacs, bagages' },
    { nom: 'Sacs à dos', parent: 'Sacs, bagages' },
    { nom: 'Sac banane', parent: 'Sacs, bagages' },
    { nom: "Plus d'options d'achats", parent: 'Sacs, bagages' },
    { nom: 'Nouveautés', parent: 'Sacs, bagages' },

    // Sous-sous-catégories pour "Sac à main"
    { nom: 'Sacs seau', parent: 'Sac à main' },
    { nom: 'Sacs Hobo', parent: 'Sac à main' },
    { nom: 'Sacs carré', parent: 'Sac à main' },
    { nom: 'Sacs boston', parent: 'Sac à main' },
    { nom: 'Sac baguette', parent: 'Sac à main' },
    { nom: 'Accessoires sacs', parent: 'Sac à main' },

    // Sous-sous-catégories pour "Portefeuille, porte-monnaie"
    { nom: 'Portefeuilles homme', parent: 'Portefeuille, porte-monnaie' },
    { nom: 'Portefeuilles de voyage', parent: 'Portefeuille, porte-monnaie' },
    { nom: 'Portefeuilles femme', parent: 'Portefeuille, porte-monnaie' },
    { nom: 'Porte-cartes de crédit', parent: 'Portefeuille, porte-monnaie' },
    { nom: 'Portefeuilles cuir homme', parent: 'Portefeuille, porte-monnaie' },

    // Sous-sous-catégories pour "Sacs à dos"
    { nom: "Sacs à dos d'affaires", parent: 'Sacs à dos' },
    { nom: 'Sacs à dos antivol', parent: 'Sacs à dos' },
    { nom: 'Sacs bandoulière', parent: 'Sacs à dos' },
    { nom: 'Sacoches', parent: 'Sacs à dos' },

    // Sous-sous-catégories pour "Sac banane"
    { nom: 'Sacs banane en cuir', parent: 'Sac banane' },
    { nom: 'Sacs banane à chaîne', parent: 'Sac banane' },
    { nom: 'Sacs banane sport', parent: 'Sac banane' },
    { nom: 'Sacs banane en toile', parent: 'Sac banane' },

    // Sous-sous-catégories pour "Plus d'options d'achats"
    { nom: 'Meilleures ventes', parent: "Plus d'options d'achats" },

    // Sous-sous-catégories pour "Nouveautés"
    { nom: 'Nouveautés sacs à main', parent: 'Nouveautés' },
    { nom: 'Nouveautés sacs à dos', parent: 'Nouveautés' },

    // Bijouterie (et ses sous-catégories) *************************
    { nom: 'Bijoux', parent: 'Bijouterie' },
    { nom: 'Bagues', parent: 'Bijouterie' },
    { nom: 'Autres bijoux', parent: 'Bijouterie' },
    { nom: 'Bracelets', parent: 'Bijouterie' },
    { nom: 'Bijoux de corps', parent: 'Bijouterie' },
    { nom: 'Matériel', parent: 'Bijouterie' },
    { nom: "Boucles d'oreilles", parent: 'Bijouterie' },
    { nom: 'Colliers', parent: 'Bijouterie' },
    { nom: 'Montres homme', parent: 'Bijouterie' },
    { nom: 'Montres femme', parent: 'Bijouterie' },
    { nom: 'Montres Connectées', parent: 'Bijouterie' },
    { nom: "Plus d'options d'achats", parent: 'Bijouterie' },
    { nom: 'Nouveautés', parent: 'Bijouterie' },

    // Sous-sous-catégories pour "Bijoux"
    { nom: 'Parures de bijoux', parent: 'Bijoux' },
    { nom: 'Emballages bijoux', parent: 'Bijoux' },
    { nom: 'Crochets bijoux', parent: 'Bijoux' },
    { nom: 'Médaillons', parent: 'Bijoux' },
    { nom: 'Chaînes', parent: 'Bijoux' },

    // Sous-sous-catégories pour "Bagues"
    { nom: 'Bague pour femme', parent: 'Bagues' },
    { nom: 'Bague pour homme', parent: 'Bagues' },
    { nom: 'Bague de mariage', parent: 'Bagues' },
    { nom: 'Bague de couple', parent: 'Bagues' },
    { nom: 'Bague connectée', parent: 'Bagues' },
    { nom: 'Bagues chevalières', parent: 'Bagues' },

    // Sous-sous-catégories pour "Autres bijoux"
    { nom: 'Pinces à cravate', parent: 'Autres bijoux' },
    { nom: 'Parures de bijoux', parent: 'Autres bijoux' },
    { nom: 'Porte-clés', parent: 'Autres bijoux' },
    { nom: 'Broches', parent: 'Autres bijoux' },
    { nom: 'Bijoux cheveux', parent: 'Autres bijoux' },

    // Sous-sous-catégories pour "Bracelets"
    { nom: 'Bracelets en argent', parent: 'Bracelets' },
    { nom: 'Bracelets moissanite', parent: 'Bracelets' },
    { nom: 'Bracelets pierre naturelle', parent: 'Bracelets' },
    { nom: 'Bracelets chaîne', parent: 'Bracelets' },
    { nom: 'Bracelets en fil', parent: 'Bracelets' },
    { nom: 'Bracelets plaqué or', parent: 'Bracelets' },

    // Sous-sous-catégories pour "Bijoux de corps"
    { nom: "Piercings d'oreille", parent: 'Bijoux de corps' },
    { nom: 'Grills dents', parent: 'Bijoux de corps' },
    { nom: 'Piercings nombril', parent: 'Bijoux de corps' },
    { nom: 'Chaînes de corps', parent: 'Bijoux de corps' },
    { nom: 'Piercings nez', parent: 'Bijoux de corps' },

    // Sous-sous-catégories pour "Matériel"
    { nom: 'Argent', parent: 'Matériel' },
    { nom: 'Argent 925', parent: 'Matériel' },
    { nom: 'Perles', parent: 'Matériel' },
    { nom: 'Or plaqué', parent: 'Matériel' },
    { nom: 'Pierres précieuses', parent: 'Matériel' },
    { nom: 'Moissanite', parent: 'Matériel' },

    // Sous-sous-catégories pour "Boucles d'oreilles"
    { nom: "Boucles d'oreilles plaqué or", parent: "Boucles d'oreilles" },
    { nom: "Sets boucles d'oreilles", parent: "Boucles d'oreilles" },
    { nom: "Boucles d'oreilles en argent", parent: "Boucles d'oreilles" },
    { nom: 'Créoles', parent: "Boucles d'oreilles" },
    { nom: "Boucles d'oreilles en perle", parent: "Boucles d'oreilles" },
    { nom: "Boucles d'oreilles pendantes", parent: "Boucles d'oreilles" },

    // Sous-sous-catégories pour "Colliers"
    { nom: 'Colliers femme', parent: 'Colliers' },
    { nom: 'Colliers en argent', parent: 'Colliers' },
    { nom: 'Colliers hip-hop', parent: 'Colliers' },
    { nom: 'Colliers de perles', parent: 'Colliers' },
    { nom: 'Colliers homme', parent: 'Colliers' },
    { nom: 'Collier superposé', parent: 'Colliers' },

    // Sous-sous-catégories pour "Montres homme"
    { nom: 'Montres mécaniques', parent: 'Montres homme' },
    { nom: 'Montres automatiques', parent: 'Montres homme' },
    { nom: 'Montres à quartz', parent: 'Montres homme' },
    { nom: 'Montres digitales', parent: 'Montres homme' },
    { nom: 'Montres de sport', parent: 'Montres homme' },
    { nom: 'Montres de luxe', parent: 'Montres homme' },
    { nom: 'Montres vintage', parent: 'Montres homme' },
    { nom: 'Montres en cuir', parent: 'Montres homme' },
    { nom: 'Bracelets de montres', parent: 'Montres homme' },
    { nom: 'Étuis montre homme', parent: 'Montres homme' },
    { nom: 'Enrouleurs de montre', parent: 'Montres homme' },

    // Sous-sous-catégories pour "Montres femme"
    { nom: 'Montres mécaniques', parent: 'Montres femme' },
    { nom: 'Montres à quartz', parent: 'Montres femme' },
    { nom: 'Montres automatiques', parent: 'Montres femme' },
    { nom: 'Montres bracelet', parent: 'Montres femme' },
    { nom: 'Montres en cuir', parent: 'Montres femme' },
    { nom: 'Montres de luxe', parent: 'Montres femme' },
    { nom: 'Montres vintage', parent: 'Montres femme' },
    { nom: 'Montres de sport', parent: 'Montres femme' },
    { nom: 'Bracelets de montres', parent: 'Montres femme' },
    { nom: 'Etuis montre femme', parent: 'Montres femme' },
    { nom: 'Enrouleurs de montre', parent: 'Montres femme' },

    // Sous-sous-catégories pour "Montres Connectées"
    { nom: 'Montres connectées GPS', parent: 'Montres Connectées' },
    { nom: 'Montres connectées de sport', parent: 'Montres Connectées' },
    { nom: 'Montres connectées pour enfants', parent: 'Montres Connectées' },
    {
        nom: 'Montres connectées avec appel et SMS',
        parent: 'Montres Connectées',
    },
    {
        nom: 'Montres connectées avec mesure de la fréquence cardiaque',
        parent: 'Montres Connectées',
    },

    // Sous-sous-catégories pour "Plus d'options d'achats"
    { nom: 'Meilleures ventes', parent: "Plus d'options d'achats" },

    // Sous-sous-catégories pour "Nouveautés"
    { nom: 'Nouveautés porte-clés', parent: 'Nouveautés' },
    { nom: 'Nouveautés montres homme', parent: 'Nouveautés' },
    { nom: 'Nouveautés colliers', parent: 'Nouveautés' },
    { nom: 'Nouveautés bracelets', parent: 'Nouveautés' },
    { nom: 'Nouveautés bagues', parent: 'Nouveautés' },
    { nom: 'Nouveautés fermoirs', parent: 'Nouveautés' },

    // Extensions, perruques (et ses sous-catégories) *************************
    { nom: 'Extensions cheveux', parent: 'Extensions, perruques' },
    { nom: 'Postiches', parent: 'Extensions, perruques' },
    { nom: 'Perruques tendances', parent: 'Extensions, perruques' },
    { nom: "Plus d'options d'achats", parent: 'Extensions, perruques' },
    { nom: 'Accessoires perruques', parent: 'Extensions, perruques' },
    { nom: 'Perruques en dentelle', parent: 'Extensions, perruques' },
    { nom: 'Perruques', parent: 'Extensions, perruques' },

    // Sous-sous-catégories pour "Extensions cheveux"
    { nom: 'Extensions à clip', parent: 'Extensions cheveux' },
    { nom: 'Mèches pour crochets', parent: 'Extensions cheveux' },
    { nom: 'Extensions cheveux humains', parent: 'Extensions cheveux' },
    { nom: 'Tissages', parent: 'Extensions cheveux' },
    { nom: 'Mèches avec closures', parent: 'Extensions cheveux' },
    { nom: 'Grosses tresses', parent: 'Extensions cheveux' },

    // Sous-sous-catégories pour "Postiches"
    { nom: 'Toupets', parent: 'Postiches' },
    { nom: 'Queues de cheval synthétiques', parent: 'Postiches' },
    { nom: 'Chignons synthétiques', parent: 'Postiches' },
    { nom: 'Volumateurs capillaires', parent: 'Postiches' },
    { nom: 'Franges', parent: 'Postiches' },
    { nom: 'Queues de cheval cheveux', parent: 'Postiches' },

    // Sous-sous-catégories pour "Perruques tendances"
    { nom: 'Perruques ondulées', parent: 'Perruques tendances' },
    { nom: 'Perruques bouclées', parent: 'Perruques tendances' },
    { nom: 'Perruques en dentelle', parent: 'Perruques tendances' },
    { nom: 'Perruques tressées en dentelle', parent: 'Perruques tendances' },

    // Sous-sous-catégories pour "Plus d'options d'achats"
    { nom: 'Meilleures ventes', parent: "Plus d'options d'achats" },

    // Sous-sous-catégories pour "Accessoires perruques"
    { nom: 'Filets à cheveux', parent: 'Accessoires perruques' },
    { nom: 'Supports pour perruque', parent: 'Accessoires perruques' },

    // Sous-sous-catégories pour "Perruques en dentelle"
    { nom: 'Perruques synthétiques', parent: 'Perruques en dentelle' },
    { nom: 'Perruques naturelles raides', parent: 'Perruques en dentelle' },
    { nom: 'Perruques naturelles', parent: 'Perruques en dentelle' },
    { nom: 'Perruques en soie à base', parent: 'Perruques en dentelle' },
    { nom: 'Perruques Dentelle Handmade', parent: 'Perruques en dentelle' },
    { nom: 'Perruques naturelles (bis)', parent: 'Perruques en dentelle' },

    // Sous-sous-catégories pour "Perruques"
    { nom: 'Perruques bandeau', parent: 'Perruques' },
    { nom: 'Perruques en U', parent: 'Perruques' },
    { nom: 'Perruques juives', parent: 'Perruques' },
    { nom: 'Perruques afro', parent: 'Perruques' },
    { nom: 'Perruques coupe Pixie', parent: 'Perruques' },

    // Sous-vêtements, vêtements de détente (et ses sous-catégories) *************************
    {
        nom: 'Sous-vêtements homme',
        parent: 'Sous-vêtements, vêtements de détente',
    },
    { nom: 'Chaussettes', parent: 'Sous-vêtements, vêtements de détente' },
    {
        nom: 'Lingerie sculptante',
        parent: 'Sous-vêtements, vêtements de détente',
    },
    { nom: 'Soutien-gorge', parent: 'Sous-vêtements, vêtements de détente' },
    { nom: 'Culottes', parent: 'Sous-vêtements, vêtements de détente' },
    {
        nom: 'Détente et sommeil',
        parent: 'Sous-vêtements, vêtements de détente',
    },
    { nom: 'Nouveautés', parent: 'Sous-vêtements, vêtements de détente' },
    {
        nom: "Plus d'options d'achats",
        parent: 'Sous-vêtements, vêtements de détente',
    },

    // Sous-sous-catégories pour "Sous-vêtements homme"
    { nom: 'Boxers', parent: 'Sous-vêtements homme' },
    { nom: 'Maillots de corps', parent: 'Sous-vêtements homme' },
    { nom: 'Chaussettes', parent: 'Sous-vêtements homme' },
    { nom: 'Corsets sport hommes', parent: 'Sous-vêtements homme' },
    { nom: 'Pyjamas', parent: 'Sous-vêtements homme' },
    { nom: 'Sous-vêtements thermiques', parent: 'Sous-vêtements homme' },

    // Sous-sous-catégories pour "Chaussettes"
    { nom: 'Bas', parent: 'Chaussettes' },
    { nom: "Chaussettes d'hiver", parent: 'Chaussettes' },
    { nom: 'Chaussettes chaudes', parent: 'Chaussettes' },
    { nom: 'Chaussettes basses', parent: 'Chaussettes' },
    { nom: 'Chaussettes JK', parent: 'Chaussettes' },
    { nom: 'Chaussettes (bis)', parent: 'Chaussettes' },

    // Sous-sous-catégories pour "Lingerie sculptante"
    { nom: 'Gaines', parent: 'Lingerie sculptante' },
    { nom: 'Corsets', parent: 'Lingerie sculptante' },
    { nom: 'Culottes sculptantes', parent: 'Lingerie sculptante' },
    { nom: 'Body', parent: 'Lingerie sculptante' },

    // Sous-sous-catégories pour "Soutien-gorge"
    { nom: 'Soutien-gorge adhésifs', parent: 'Soutien-gorge' },
    { nom: 'Brassières sport', parent: 'Soutien-gorge' },
    { nom: 'Soutien-gorge sans coutures', parent: 'Soutien-gorge' },
    { nom: 'Soutien-gorge sans bretelles', parent: 'Soutien-gorge' },
    { nom: 'Soutien-gorge sexy', parent: 'Soutien-gorge' },
    { nom: 'Soutien-gorge push-up', parent: 'Soutien-gorge' },

    // Sous-sous-catégories pour "Culottes"
    { nom: 'Culottes', parent: 'Culottes' },
    { nom: 'Culottes grande taille', parent: 'Culottes' },
    { nom: 'Strings', parent: 'Culottes' },
    { nom: 'Culottes sexy', parent: 'Culottes' },
    { nom: 'Culottes menstruelles', parent: 'Culottes' },

    // Sous-sous-catégories pour "Détente et sommeil"
    { nom: 'Chemises de nuit', parent: 'Détente et sommeil' },
    { nom: 'Ensembles pyjama', parent: 'Détente et sommeil' },
    { nom: "Pyjamas d'hiver", parent: 'Détente et sommeil' },

    // Sous-sous-catégories pour "Nouveautés"
    { nom: 'Nouveautés chaussettes', parent: 'Nouveautés' },
    { nom: 'Nouveautés sous-vêtements', parent: 'Nouveautés' },
    { nom: 'Nouveautés pyjamas femme', parent: 'Nouveautés' },
    { nom: 'Nouveautés pyjamas homme', parent: 'Nouveautés' },
    { nom: 'Nouveautés sous-vêtements femme', parent: 'Nouveautés' },
    { nom: 'Nouveautés chaussettes homme', parent: 'Nouveautés' },

    // Sous-sous-catégories pour "Plus d'options d'achats"
    { nom: 'Meilleures ventes', parent: "Plus d'options d'achats" },
];

/**
 * Données des utilisateurs de test
 */
const donneesUtilisateurs = [
    {
        prenom: 'Admin',
        nom: 'Nody',
        email: 'admin@nody.com',
        motDePasse: 'password123',
        role: 'admin',
        emailVerifie: true,
        telephone: '+221780001211',
        genre: 'homme',
    },
    {
        prenom: 'Moderateur',
        nom: 'Pro',
        email: 'Moderateur@nody.com',
        motDePasse: 'password123',
        role: 'moderateur',
        emailVerifie: true,
        telephone: '+221780001212',
        genre: 'homme',
    },
    {
        prenom: 'Elo',
        nom: 'Fournisseur',
        email: 'fournisseur@nody.com',
        motDePasse: 'password123',
        role: 'vendeur',
        emailVerifie: true,
        telephone: '+221780001213',
        genre: 'femme',
    },
    {
        prenom: 'Lucas',
        nom: 'Client',
        email: 'lucas@nody.com',
        motDePasse: 'password123',
        role: 'client',
        emailVerifie: true,
        telephone: '+221760001214',
        genre: 'homme',
    },
];

/**
 * Classe Seeder pour peupler la base de données
 */
class Seeder {
    constructor() {
        this.utilisateurs = [];
        this.categories = [];
        this.produits = [];
        this.commandes = [];
        this.paiements = [];
    }

    /**
     * Connexion à la base de données MongoDB
     */
    async connecterBaseDeDonnees() {
        try {
            await mongoose.connect(
                process.env.MONGODB_URI || 'mongodb://localhost:27017/nody_db'
            );
            console.log('✅ MongoDB connecté');
        } catch (erreur) {
            console.error('❌ Erreur connexion MongoDB:', erreur);
            process.exit(1);
        }
    }

    /**
     * Nettoyage de la base de données
     */
    async nettoyer() {
        try {
            await Utilisateur.deleteMany({});
            await Categorie.deleteMany({});
            await Produit.deleteMany({});
            await Commande.deleteMany({});
            await Paiement.deleteMany({});
            console.log('✅ Base de données nettoyée');
        } catch (erreur) {
            console.error('❌ Erreur nettoyage:', erreur);
        }
    }

    /**
     * Peuplement des utilisateurs
     */
    async peuplerUtilisateurs() {
        try {
            // Création des utilisateurs de base
            for (const donneesUtilisateur of donneesUtilisateurs) {
                const motDePasseHache = await bcrypt.hash(
                    donneesUtilisateur.motDePasse,
                    12
                );
                const utilisateur = await Utilisateur.create({
                    ...donneesUtilisateur,
                    motDePasse: motDePasseHache,
                    adresses: [
                        {
                            type: 'domicile',
                            rue: faker.location.streetAddress(),
                            ville: faker.location.city(),
                            etat: faker.location.state(),
                            pays: 'Sénégal',
                            codePostal: faker.location.zipCode(),
                            estParDefaut: true,
                        },
                    ],
                });
                this.utilisateurs.push(utilisateur);
                console.log(`✅ Utilisateur créé: ${utilisateur.email}`);
            }

            // Création d'utilisateurs supplémentaires
            for (let i = 0; i < 15; i++) {
                const utilisateur = await Utilisateur.create({
                    prenom: faker.person.firstName(),
                    nom: faker.person.lastName(),
                    email: faker.internet.email().toLowerCase(),
                    motDePasse: await bcrypt.hash('password123', 12),
                    role: 'client',
                    emailVerifie: faker.datatype.boolean(0.8),
                    telephone: `+2217${faker.string.numeric(8)}`,
                    adresses: [
                        {
                            type: 'domicile',
                            rue: faker.location.streetAddress(),
                            ville: faker.location.city(),
                            etat: faker.location.state(),
                            pays: 'Sénégal',
                            codePostal: faker.location.zipCode(),
                            estParDefaut: true,
                        },
                    ],
                    dateNaissance: faker.date.birthdate({
                        min: 18,
                        max: 65,
                        mode: 'age',
                    }),
                    genre: faker.helpers.arrayElement([
                        'homme',
                        'femme',
                    ]),
                });
                this.utilisateurs.push(utilisateur);
            }
            console.log(`✅ ${this.utilisateurs.length} utilisateurs créés`);
        } catch (erreur) {
            console.error('❌ Erreur création utilisateurs:', erreur);
        }
    }

    /**
     * Peuplement des catégories
     */
    async peuplerCategories() {
        try {
            console.log('🏷️ Création des catégories...');

            // Création d'une carte pour stocker les IDs des catégories par nom
            const carteCategories = new Map();

            // Fonction récursive pour créer les catégories
            const creerNiveauCategorie = async (
                categories,
                parentNom = null
            ) => {
                for (const donneesCategorie of categories) {
                    // Trouver l'ID du parent si nécessaire
                    const parentId = parentNom
                        ? carteCategories.get(parentNom)
                        : null;

                    if (
                        (parentNom === null &&
                            donneesCategorie.parent === null) ||
                        (parentNom !== null &&
                            donneesCategorie.parent === parentNom)
                    ) {
                        const categorie = await Categorie.create({
                            nom: donneesCategorie.nom,
                            parent: parentId,
                            description: `Catégorie ${donneesCategorie.nom} - Nody Mode`,
                            estActif: true,
                            ordre: faker.number.int({ min: 0, max: 100 }),
                        });

                        carteCategories.set(
                            donneesCategorie.nom,
                            categorie._id
                        );
                        this.categories.push(categorie);
                        console.log(`   ✅ Catégorie: ${donneesCategorie.nom}`);

                        // Continuer récursivement pour les sous-catégories
                        await creerNiveauCategorie(
                            categories,
                            donneesCategorie.nom
                        );
                    }
                }
            };

            // Commencer avec les catégories racines
            await creerNiveauCategorie(donneesCategories);
            console.log(`✅ ${this.categories.length} catégories créées`);
        } catch (erreur) {
            console.error('❌ Erreur création catégories:', erreur);
        }
    }

    /**
     * Peuplement des produits
     */
    async peuplerProduits() {
        try {
            console.log('🛍️ Création des produits...');

            // Récupérer les catégories feuilles (sans enfants)
            const categoriesFeuilles = this.categories.filter(
                categorie =>
                    !this.categories.some(
                        subCategorie =>
                            subCategorie.parent &&
                            subCategorie.parent.toString() ===
                                categorie._id.toString()
                    )
            );

            let nombreProduits = 0;

            for (const categorie of categoriesFeuilles) {
                // Générer 2-5 produits par catégorie feuille
                const nombreProduitsParCategorie = faker.number.int({
                    min: 2,
                    max: 5,
                });

                for (let i = 0; i < nombreProduitsParCategorie; i++) {
                    const nomProduit = this.genererNomProduit(categorie.nom);
                    const descriptionProduit = this.genererDescriptionProduit(
                        categorie.nom
                    );

                    const produit = await Produit.create({
                        nom: nomProduit,
                        description: descriptionProduit,
                        prix: faker.commerce.price({
                            min: 15,
                            max: 300,
                            dec: 2,
                        }),
                        prixComparaison: faker.commerce.price({
                            min: 20,
                            max: 400,
                            dec: 2,
                        }),
                        quantite: faker.number.int({ min: 0, max: 100 }),
                        seuilStockFaible: 5,
                        sku: `SKU-${faker.string
                            .alphanumeric(8)
                            .toUpperCase()}`,
                        codeBarres: faker.string.numeric(13),
                        categorie: categorie._id,
                        marque: this.genererNomMarque(categorie.nom),
                        couleurs: this.genererCouleurs(categorie.nom),
                        tailles: this.genererTailles(categorie.nom),
                        materiaux: this.genererMateriaux(categorie.nom),
                        etiquettes: this.genererEtiquettes(categorie.nom),
                        images: this.genererImages(categorie.nom),
                        caracteristiques: this.genererCaracteristiques(
                            categorie.nom
                        ),
                        estActif: true,
                        estEnVedette: faker.datatype.boolean(0.2),
                        estNouveau: faker.datatype.boolean(0.3),
                        estMeilleureVente: faker.datatype.boolean(0.1),
                        vendeur: this.utilisateurs.find(
                            utilisateur => utilisateur.role === 'vendeur'
                        )?._id,
                        evaluations: {
                            moyenne: faker.number.float({
                                min: 3,
                                max: 5,
                                fractionDigits: 1,
                            }),
                            nombre: faker.number.int({ min: 0, max: 50 }),
                        },
                        poids: faker.number.float({
                            min: 0.1,
                            max: 2,
                            fractionDigits: 2,
                        }),
                        dimensions: {
                            longueur: faker.number.float({
                                min: 10,
                                max: 100,
                                fractionDigits: 1,
                            }),
                            largeur: faker.number.float({
                                min: 5,
                                max: 50,
                                fractionDigits: 1,
                            }),
                            hauteur: faker.number.float({
                                min: 1,
                                max: 30,
                                fractionDigits: 1,
                            }),
                        },
                    });

                    this.produits.push(produit);
                    nombreProduits++;
                    console.log(`   ✅ Produit: ${produit.nom}`);
                }
            }
            console.log(`✅ ${nombreProduits} produits créés`);
        } catch (erreur) {
            console.error('❌ Erreur création produits:', erreur);
        }
    }

    /**
     * Peuplement des commandes
     */
    async peuplerCommandes() {
        try {
            console.log('📦 Création des commandes...');

            const clients = this.utilisateurs.filter(
                utilisateur => utilisateur.role === 'client'
            );
            const statuts = [
                'en_attente',
                'confirme',
                'en_cours',
                'expédie',
                'livré',
            ];
            const methodesPaiement = [
                'carte_credit',
                'paypal',
                'stripe',
                'virement_bancaire',
                'paiement_livraison',
                'wave',
                'orange_money',
                'airtel_money',
                'mobicash',
            ];

            for (let i = 0; i < 30; i++) {
                const client = faker.helpers.arrayElement(clients);
                const articles = [];

                // Sélectionner 1-5 produits aléatoires
                const nombreProduits = faker.number.int({ min: 1, max: 5 });
                const produitsSelectionnes = faker.helpers.arrayElements(
                    this.produits,
                    nombreProduits
                );
                let sousTotal = 0;

                for (const produit of produitsSelectionnes) {
                    const quantite = faker.number.int({ min: 1, max: 3 });
                    const totalArticle = produit.prix * quantite;
                    sousTotal += totalArticle;

                    articles.push({
                        produit: produit._id,
                        nom: produit.nom,
                        prix: produit.prix,
                        quantite,
                        variante: {
                            couleur: faker.helpers.arrayElement(
                                produit.couleurs
                            ),
                            taille: faker.helpers.arrayElement(produit.tailles),
                        },
                        image: produit.images[0]?.url || '',
                        sku: produit.sku,
                    });
                }

                const taxe = sousTotal * 0.2;
                const livraison = faker.number.float({
                    min: 5,
                    max: 15,
                    fractionDigits: 2,
                });
                const total = sousTotal + taxe + livraison;

                const commande = await Commande.create({
                    client: client._id,
                    articles,
                    sousTotal,
                    taxe,
                    livraison,
                    total,
                    devise: 'XOF',
                    adresseLivraison: {
                        prenom: client.prenom,
                        nom: client.nom,
                        rue: faker.location.streetAddress(),
                        ville: faker.location.city(),
                        etat: faker.location.state(),
                        pays: 'Sénégal',
                        codePostal: faker.location.zipCode(),
                        telephone: client.telephone,
                    },
                    adresseFacturation: {
                        prenom: client.prenom,
                        nom: client.nom,
                        rue: faker.location.streetAddress(),
                        ville: faker.location.city(),
                        etat: faker.location.state(),
                        pays: 'Sénégal',
                        codePostal: faker.location.zipCode(),
                        telephone: client.telephone,
                    },
                    methodeLivraison: {
                        nom: 'Livraison standard',
                        transporteur: 'La Poste',
                        numeroSuivi: faker.string
                            .alphanumeric(12)
                            .toUpperCase(),
                        dateLivraisonEstimee: faker.date.soon({ days: 7 }),
                        cout: livraison,
                    },
                    paiement: {
                        methode: faker.helpers.arrayElement(methodesPaiement),
                        statut: 'paye',
                        idTransaction: `txn_${faker.string.alphanumeric(10)}`,
                        datePaiement: faker.date.recent(),
                    },
                    statut: faker.helpers.arrayElement(statuts),
                    notesClient: faker.datatype.boolean(0.3)
                        ? faker.lorem.sentence()
                        : undefined,
                });

                this.commandes.push(commande);
                console.log(`   ✅ Commande: ${commande.numeroCommande}`);
            }
            console.log(`✅ ${this.commandes.length} commandes créées`);
        } catch (erreur) {
            console.error('❌ Erreur création commandes:', erreur);
        }
    }

    /**
     * Peuplement des paiements
     */
    async peuplerPaiements() {
        try {
            console.log('💳 Création des paiements...');

            for (const commande of this.commandes) {
                if (commande.paiement.statut === 'paye') {
                    const paiement = await Paiement.create({
                        commande: commande._id,
                        client: commande.client,
                        montant: commande.total,
                        devise: commande.devise,
                        methodePaiement: commande.paiement.methode,
                        passerellePaiement: 'stripe',
                        statut: 'termine',
                        idTransaction: commande.paiement.idTransaction,
                        detailsFacturation: {
                            prenom: commande.adresseFacturation.prenom,
                            nom: commande.adresseFacturation.nom,
                            email: this.utilisateurs.find(u =>
                                u._id.equals(commande.client)
                            )?.email,
                            telephone: commande.adresseFacturation.telephone,
                            adresse: {
                                rue: commande.adresseFacturation.rue,
                                ville: commande.adresseFacturation.ville,
                                etat: commande.adresseFacturation.etat,
                                pays: commande.adresseFacturation.pays,
                                codePostal:
                                    commande.adresseFacturation.codePostal,
                            },
                        },
                    });
                    this.paiements.push(paiement);
                }
            }
            console.log(`✅ ${this.paiements.length} paiements créés`);
        } catch (erreur) {
            console.error('❌ Erreur création paiements:', erreur);
        }
    }

    /**
     * Méthodes utilitaires pour générer des données réalistes
     */

    /**
     * Génère un nom de produit réaliste
     * @param {string} nomCategorie - Nom de la catégorie
     * @returns {string} - Nom du produit généré
     */
    genererNomProduit(nomCategorie) {
        const adjectifs = [
            'Élégant',
            'Moderne',
            'Confortable',
            'Stylé',
            'Tendance',
            'Classique',
            'Sport',
            'Design',
        ];
        const materiaux = [
            'Coton',
            'Laine',
            'Lin',
            'Denim',
            'Cuir',
            'Soie',
            'Polyester',
        ];
        const types = {
            Vêtements: ['Chemise', 'Pantalon', 'Pull', 'Veste', 'Costume'],
            Chaussures: [
                'Baskets',
                'Bottes',
                'Sandales',
                'Escarpins',
                'Mocassins',
            ],
            Accessoires: ['Sac', 'Ceinture', 'Écharpe', 'Chapeau', 'Lunettes'],
        };

        let type = 'Article';
        for (const [cle, valeurs] of Object.entries(types)) {
            if (nomCategorie.includes(cle)) {
                type = faker.helpers.arrayElement(valeurs);
                break;
            }
        }

        return `${faker.helpers.arrayElement(
            adjectifs
        )} ${type} ${faker.helpers.arrayElement(materiaux)} ${nomCategorie}`;
    }

    /**
     * Génère une description de produit réaliste
     * @param {string} nomCategorie - Nom de la catégorie
     * @returns {string} - Description du produit générée
     */
    genererDescriptionProduit(nomCategorie) {
        const descriptions = {
            Vêtements: `Ce produit exceptionnel allie confort et style. Fabriqué avec des matériaux de haute qualité, il offre un ajustement parfait pour toutes les occasions. Idéal pour votre garde-robe quotidienne.`,
            Chaussures: `Chaussures confortables et durables, conçues pour vous accompagner toute la journée. Semelle antidérapante et design moderne pour un look tendance.`,
            Accessoires: `Accessoire élégant qui complète parfaitement votre tenue. Fabrication soignée et attention aux détails pour un résultat exceptionnel.`,
            Bijouterie: `Pièce unique et raffinée, créée avec des matériaux précieux. Parfait pour ajouter une touche d'élégance à votre style.`,
        };

        let descriptionBase = descriptions['Accessoires'];
        for (const [cle, desc] of Object.entries(descriptions)) {
            if (nomCategorie.includes(cle)) {
                descriptionBase = desc;
                break;
            }
        }

        return `${descriptionBase} Disponible en plusieurs tailles et couleurs. Livraison rapide et gratuite possible.`;
    }

    /**
     * Génère un nom de marque réaliste
     * @param {string} nomCategorie - Nom de la catégorie
     * @returns {string} - Nom de la marque généré
     */
    genererNomMarque(nomCategorie) {
        const marques = {
            Vêtements: [
                'Nody Collection',
                'Dakar Style',
                '6 Point 9',
                'Urban Chic',
            ],
            Chaussures: [
                'Step Comfort',
                'City Walk',
                'Elite Shoes',
                'Sport Life',
            ],
            Accessoires: [
                'Luxe Accents',
                'Style Addict',
                'Chic Details',
                'Mode Touch',
            ],
            Bijouterie: [
                'Precious Stones',
                'Golden Touch',
                'Silver Line',
                'Elegant Gems',
            ],
        };

        let listeMarques = marques['Accessoires'];
        for (const [cle, nomsMarques] of Object.entries(marques)) {
            if (nomCategorie.includes(cle)) {
                listeMarques = nomsMarques;
                break;
            }
        }

        return faker.helpers.arrayElement(listeMarques);
    }

    /**
     * Génère une liste de couleurs réalistes
     * @param {string} nomCategorie - Nom de la catégorie
     * @returns {Array} - Liste de couleurs
     */
    genererCouleurs(nomCategorie) {
        const palettesCouleurs = {
            Vêtements: [
                'Noir',
                'Blanc',
                'Bleu marine',
                'Gris',
                'Beige',
                'Bordeaux',
            ],
            Chaussures: ['Noir', 'Marron', 'Blanc', 'Bleu', 'Rouge', 'Vert'],
            Accessoires: ['Noir', 'Brun', 'Camel', 'Bleu roi', 'Rose poudré'],
            Bijouterie: ['Or', 'Argent', 'Rose gold', 'Noir', 'Blanc'],
        };

        let couleurs = palettesCouleurs['Accessoires'];
        for (const [cle, listeCouleurs] of Object.entries(palettesCouleurs)) {
            if (nomCategorie.includes(cle)) {
                couleurs = listeCouleurs;
                break;
            }
        }

        return faker.helpers.arrayElements(
            couleurs,
            faker.number.int({ min: 1, max: 3 })
        );
    }

    /**
     * Génère une liste de tailles réalistes
     * @param {string} nomCategorie - Nom de la catégorie
     * @returns {Array} - Liste de tailles
     */
    genererTailles(nomCategorie) {
        if (nomCategorie.includes('Chaussures')) {
            return ['36', '37', '38', '39', '40', '41', '42', '43'];
        } else if (nomCategorie.includes('Enfant')) {
            return ['2 ans', '4 ans', '6 ans', '8 ans', '10 ans', '12 ans'];
        } else {
            return ['XS', 'S', 'M', 'L', 'XL', 'XXL'];
        }
    }

    /**
     * Génère une liste de matériaux réalistes
     * @param {string} nomCategorie - Nom de la catégorie
     * @returns {Array} - Liste de matériaux
     */
    genererMateriaux(nomCategorie) {
        const materiaux = {
            Vêtements: ['Coton', 'Polyester', 'Laine', 'Lin', 'Denim'],
            Chaussures: ['Cuir', 'Toile', 'Synthétique', 'Nubuck'],
            Accessoires: ['Cuir', 'Tissu', 'Métal', 'Plastique'],
            Bijouterie: ['Argent 925', 'Or 18k', 'Acier inoxydable', 'Cuivre'],
        };

        let listeMateriaux = materiaux['Accessoires'];
        for (const [cle, listeMat] of Object.entries(materiaux)) {
            if (nomCategorie.includes(cle)) {
                listeMateriaux = listeMat;
                break;
            }
        }

        return [faker.helpers.arrayElement(listeMateriaux)];
    }

    /**
     * Génère une liste d'étiquettes réalistes
     * @param {string} nomCategorie - Nom de la catégorie
     * @returns {Array} - Liste d'étiquettes
     */
    genererEtiquettes(nomCategorie) {
        const etiquettesBase = [
            'nouveau',
            'tendance',
            'qualité',
            'livraison rapide',
        ];

        if (nomCategorie.includes('Nouveautés')) {
            etiquettesBase.push('nouvelle collection');
        }
        if (nomCategorie.includes('Meilleures ventes')) {
            etiquettesBase.push('populaire', 'best-seller');
        }

        return faker.helpers.arrayElements(
            etiquettesBase,
            faker.number.int({ min: 2, max: 4 })
        );
    }

    /**
     * Génère une liste d'images réalistes
     * @param {string} nomCategorie - Nom de la catégorie
     * @returns {Array} - Liste d'images
     */
    genererImages(nomCategorie) {
        const nombreImages = faker.number.int({ min: 1, max: 4 });
        const images = [];

        for (let i = 0; i < nombreImages; i++) {
            images.push({
                url: `https://picsum.photos/800/1000?random=${faker.number.int({
                    min: 1,
                    max: 1000,
                })}`,
                alt: `Image ${i + 1} du produit`,
                estPrincipale: i === 0,
            });
        }

        return images;
    }

    /**
     * Génère une liste de caractéristiques réalistes
     * @param {string} nomCategorie - Nom de la catégorie
     * @returns {Array} - Liste de caractéristiques
     */
    genererCaracteristiques(nomCategorie) {
        const caracteristiques = [];
        const nombreCaracteristiques = faker.number.int({ min: 3, max: 6 });

        const caracteristiquesPossibles = [
            { nom: 'Matériau', valeur: 'Haute qualité' },
            { nom: 'Entretien', valeur: 'Lavage en machine' },
            { nom: 'Origine', valeur: 'Conçu en Sénégal' },
            { nom: 'Style', valeur: 'Moderne et élégant' },
            { nom: 'Confort', valeur: 'Exceptionnel' },
            { nom: 'Durabilité', valeur: 'Longue durée' },
            { nom: 'Éco-responsable', valeur: 'Matériaux durables' },
        ];

        const caracteristiquesSelectionnees = faker.helpers.arrayElements(
            caracteristiquesPossibles,
            nombreCaracteristiques
        );
        return caracteristiquesSelectionnees;
    }

    /**
     * Exécution complète du seeder
     */
    async executer() {
        console.log('🚀 Démarrage du seeder Nody...');

        await this.connecterBaseDeDonnees();
        await this.nettoyer();

        console.log('\n👥 Création des utilisateurs...');
        await this.peuplerUtilisateurs();

        console.log('\n🏷️ Création des catégories...');
        await this.peuplerCategories();

        console.log('\n🛍️ Création des produits...');
        await this.peuplerProduits();

        console.log('\n📦 Création des commandes...');
        await this.peuplerCommandes();

        console.log('\n💳 Création des paiements...');
        await this.peuplerPaiements();

        console.log('\n🎉 Seeder terminé avec succès!');
        console.log(`\n📊 Statistiques finales:`);
        console.log(`   👥 Utilisateurs: ${this.utilisateurs.length}`);
        console.log(`   🏷️ Catégories: ${this.categories.length}`);
        console.log(`   🛍️ Produits: ${this.produits.length}`);
        console.log(`   📦 Commandes: ${this.commandes.length}`);
        console.log(`   💳 Paiements: ${this.paiements.length}`);

        // Afficher les identifiants de test
        console.log('\n🔐 Identifiants de test:');
        console.log('   Admin: admin@nody.com / password123');
        console.log('   Moderateur: Moderateur@nody.com / password123');
        console.log('   Client: jean@nody.com / password123');
        console.log('   Client: marie@nody.com / password123');

        console.log("\n🌐 L'application est maintenant prête!");
        console.log('   Démarrez le serveur avec: npm run dev');

        process.exit(0);
    }
}

// Gestion des arguments de ligne de commande
// Pour des scénarios plus complexes, envisagez d'utiliser une bibliothèque comme yargs ou commander.
const args = process.argv.slice(2);
const doitNettoyer = args.includes('--clean');
const seeder = new Seeder();

if (doitNettoyer) {
    seeder.connecterBaseDeDonnees().then(() =>
        seeder.nettoyer().then(() => {
            console.log('✅ Base de données nettoyée');
            process.exit(0);
        })
    );
} else {
    seeder.executer();
}
