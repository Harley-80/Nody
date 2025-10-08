//Importation des modules
import mongoose from 'mongoose';
import { faker } from '@faker-js/faker';

// Importation des modèles
import Utilisateur from './models/utilisateurModel.js';
import Categorie from './models/categorieModel.js';
import Produit from './models/produitModel.js';
import Commande from './models/commandeModel.js';
import Paiement from './models/paiementModel.js';

// Importation des données de test
import utilisateurs from './data/utilisateurs.js';
import produits from './data/produits.js';

// Données brutes des catégories

const rawCategories = [
    // Catégories racines
    { name: 'Vêtements homme', parent: null },
    { name: 'Vêtements femme', parent: null },
    { name: 'Enfants', parent: null },
    { name: 'Chaussures', parent: null },
    { name: 'Accessoires', parent: null },
    { name: 'Sacs, bagages', parent: null },
    { name: 'Bijouterie', parent: null },
    { name: 'Extensions, perruques', parent: null },
    { name: 'Sous-vêtements, vêtements de détente', parent: null },

    // Vêtements homme
    { name: 'Pantalons', parent: 'Vêtements homme' },
    { name: 'Pulls', parent: 'Vêtements homme' },
    { name: 'Blazers et costumes', parent: 'Vêtements homme' },
    { name: 'Ensembles', parent: 'Vêtements homme' },
    { name: 'Doudounes', parent: 'Vêtements homme' },
    { name: 'Jeans', parent: 'Vêtements homme' },
    { name: 'Vestes', parent: 'Vêtements homme' },
    { name: 'Shorts', parent: 'Vêtements homme' },
    { name: 'Chemises', parent: 'Vêtements homme' },
    { name: 'Nouveautés', parent: 'Vêtements homme' },
    { name: "Plus d'options d'achats", parent: 'Vêtements homme' },

    { name: 'Pantalons en cuir', parent: 'Pantalons' },
    { name: 'Pantalons crayon', parent: 'Pantalons' },
    { name: 'Pantalons décontractés', parent: 'Pantalons' },
    { name: 'Pantalons droits', parent: 'Pantalons' },
    { name: 'Pantalons bouffants', parent: 'Pantalons' },
    { name: 'Joggings', parent: 'Pantalons' },

    { name: 'Cols roulés', parent: 'Pulls' },
    { name: 'Pulls imprimés', parent: 'Pulls' },
    { name: 'Gilets', parent: 'Pulls' },
    { name: 'Gilets sans manches', parent: 'Pulls' },
    { name: 'Pulls rayés', parent: 'Pulls' },
    { name: 'Pulls', parent: 'Pulls' },

    { name: 'Vestes de costume', parent: 'Blazers et costumes' },
    { name: 'Costumes', parent: 'Blazers et costumes' },
    { name: 'Costumes croisés', parent: 'Blazers et costumes' },
    { name: 'Blazers', parent: 'Blazers et costumes' },
    { name: 'Costumes simple boutonnage', parent: 'Blazers et costumes' },
    { name: 'Pantalons de costume', parent: 'Blazers et costumes' },

    { name: 'Ensembles de sport', parent: 'Ensembles' },
    { name: 'Costumes tendances', parent: 'Ensembles' },

    { name: 'Doudounes longues', parent: 'Doudounes' },
    { name: 'Doudounes courtes', parent: 'Doudounes' },
    { name: 'Doudounes légères', parent: 'Doudounes' },
    { name: 'Doudounes à capuche', parent: 'Doudounes' },

    { name: 'Jeans brossés', parent: 'Jeans' },
    { name: 'Jeans déchirés', parent: 'Jeans' },
    { name: 'jeans destroy', parent: 'Jeans' },
    { name: 'Jeans effilés', parent: 'Jeans' },
    { name: 'Jeans slim', parent: 'Jeans' },
    { name: 'Jeans cargo/baggy', parent: 'Jeans' },
    { name: 'Jeans délavés', parent: 'Jeans' },
    { name: 'Jean', parent: 'Jeans' },

    { name: 'Vestes bomber', parent: 'Vestes' },
    { name: 'Manteaux', parent: 'Vestes' },
    { name: 'Vestes de baseball', parent: 'Vestes' },
    { name: 'Gilet sans manches', parent: 'Vestes' },
    { name: 'Vestes en jean', parent: 'Vestes' },

    { name: 'Shorts de gym', parent: 'Shorts' },
    { name: 'Shorts de surf', parent: 'Shorts' },
    { name: 'Shorts en lin', parent: 'Shorts' },
    { name: 'Shorts en jean', parent: 'Shorts' },
    { name: 'Shorts cargo', parent: 'Shorts' },
    { name: 'Shorts', parent: 'Shorts' },

    { name: 'Chemises cargo', parent: 'Chemises' },
    { name: 'Chemises en lin', parent: 'Chemises' },
    { name: 'Chemises vestes', parent: 'Chemises' },
    { name: 'Chemises imprimées ou motifs', parent: 'Chemises' },
    { name: 'Chemises en jean', parent: 'Chemises' },
    { name: 'Chemises unies', parent: 'Chemises' },

    { name: 'Nouveautés sweat ou pull-over', parent: 'Nouveautés' },
    { name: 'Nouveautés pantalons', parent: 'Nouveautés' },
    { name: 'Nouveautés shorts', parent: 'Nouveautés' },
    { name: 'Nouveautés ensembles', parent: 'Nouveautés' },
    { name: 'Nouveautés costumes', parent: 'Nouveautés' },
    { name: 'Nouveautés t-shirts', parent: 'Nouveautés' },

    { name: 'Meilleures ventes', parent: "Plus d'options d'achats" },

    // Vêtements femme
    { name: 'Bas', parent: 'Vêtements femme' },
    { name: 'Robes', parent: 'Vêtements femme' },
    { name: 'Robes occasion spéciale', parent: 'Vêtements femme' },
    { name: 'Grande taille', parent: 'Vêtements femme' },
    { name: "Vêtements d'extérieur", parent: 'Vêtements femme' },
    { name: 'Ensembles assortis', parent: 'Vêtements femme' },
    { name: 'Hauts', parent: 'Vêtements femme' },
    { name: 'Maillots de bain', parent: 'Vêtements femme' },
    { name: 'Nouveautés', parent: 'Vêtements femme' },
    { name: "Plus d'options d'achats", parent: 'Vêtements femme' },

    { name: 'Pantalons', parent: 'Bas' },
    { name: 'Shorts', parent: 'Bas' },
    { name: 'Jupes', parent: 'Bas' },
    { name: 'Jeans', parent: 'Bas' },
    { name: 'collant', parent: 'Bas' },
    { name: 'Joggings', parent: 'Bas' },

    { name: 'Robes tricotées', parent: 'Robes' },
    { name: 'Robes longues', parent: 'Robes' },
    { name: 'Robes à manches longues', parent: 'Robes' },
    { name: 'Robes de soirée', parent: 'Robes' },
    { name: 'Robes courtes', parent: 'Robes' },
    { name: 'Robes', parent: 'Robes' },

    { name: 'Robes bal de promo', parent: 'Robes occasion spéciale' },
    { name: 'Robes de soirée', parent: 'Robes occasion spéciale' },
    { name: 'Robes africaines', parent: 'Robes occasion spéciale' },

    { name: 'Maillots de bain grande taille', parent: 'Grande taille' },
    { name: "Vêtements d'extérieur grande taille", parent: 'Grande taille' },
    { name: 'Ensembles grande taille', parent: 'Grande taille' },
    { name: 'Grandes tailles', parent: 'Grande taille' },
    { name: 'Hauts grande taille', parent: 'Grande taille' },

    { name: 'Doudounes', parent: "Vêtements d'extérieur" },
    {
        name: 'Manteaux en laine et manches longues',
        parent: "Vêtements d'extérieur",
    },
    { name: 'Doudounes longues', parent: "Vêtements d'extérieur" },
    { name: 'Doudounes courtes', parent: "Vêtements d'extérieur" },
    { name: 'Gilets', parent: "Vêtements d'extérieur" },

    { name: 'Ensembles pantalons', parent: 'Ensembles assortis' },
    { name: 'Ensembles shorts', parent: 'Ensembles assortis' },
    { name: 'Ensembles robes', parent: 'Ensembles assortis' },
    { name: 'Ensembles pulls', parent: 'Ensembles assortis' },

    { name: 'Chemises et blouses', parent: 'Hauts' },
    { name: 'Tricots', parent: 'Hauts' },
    { name: 'Pulls chauds', parent: 'Hauts' },
    { name: 'Pulls à col rond', parent: 'Hauts' },
    { name: 'T-shirts à manches longues', parent: 'Hauts' },
    { name: 'T-shirts à manches court', parent: 'Hauts' },
    { name: 'Cols roulés', parent: 'Hauts' },

    { name: 'Une pièce', parent: 'Maillots de bain' },
    { name: 'Bikinis ou tring', parent: 'Maillots de bain' },
    { name: 'Pareos ou pagne', parent: 'Maillots de bain' },

    { name: 'Nouveautés manteaux', parent: 'Nouveautés' },
    { name: 'Nouveautés pantalons', parent: 'Nouveautés' },
    { name: 'Nouveautés vêtements', parent: 'Nouveautés' },
    { name: 'Nouveautés robes', parent: 'Nouveautés' },
    { name: 'Nouveautés ensembles', parent: 'Nouveautés' },
    { name: 'Nouveautés pulls', parent: 'Nouveautés' },

    { name: 'Meilleures ventes', parent: "Plus d'options d'achats" },

    // Enfants
    { name: 'Accessoires enfants', parent: 'Enfants' },
    { name: 'Vêtements enfant', parent: 'Enfants' },
    { name: 'Chaussures enfant', parent: 'Enfants' },
    { name: "Plus d'options d'achats", parent: 'Enfants' },

    { name: 'Chapeaux, écharpes, gants', parent: 'Accessoires enfants' },
    { name: 'Sacs enfants', parent: 'Accessoires enfants' },

    { name: 'Chaussure enfant', parent: 'Vêtements enfant' },
    { name: 'Polos', parent: 'Vêtements enfant' },
    { name: 'T-short', parent: 'Vêtements enfant' },
    { name: 'Shorts', parent: 'Vêtements enfant' },
    { name: 'Ensembles enfant', parent: 'Vêtements enfant' },
    { name: 'Chaussettes enfant', parent: 'Vêtements enfant' },
    { name: "Vêtements d'extérieur enfant", parent: 'Vêtements enfant' },

    { name: 'Chaussures décontractées', parent: 'Chaussures enfant' },
    { name: 'Bottes enfant', parent: 'Chaussures enfant' },
    { name: 'Basket', parent: 'Chaussures enfant' },
    { name: 'Mocassin', parent: 'Chaussures enfant' },
    { name: 'Sandales', parent: 'Chaussures enfant' },

    { name: 'Meilleures ventes', parent: "Plus d'options d'achats" },

    // Chaussures
    { name: 'Chaussures décontractées', parent: 'Chaussures' },
    { name: 'Bottes femme', parent: 'Chaussures' },
    { name: 'Chaussures plates', parent: 'Chaussures' },
    { name: 'Sandales et chaussures homme', parent: 'Chaussures' },
    { name: 'Chaussures à talons homme', parent: 'Chaussures' },
    { name: "Plus d'options d'achats", parent: 'Chaussures' },
    { name: 'Chaussures décontractées (bis)', parent: 'Chaussures' },
    { name: 'Accessoires', parent: 'Chaussures' },
    { name: 'Sandales et chaussons femme', parent: 'Chaussures' },
    { name: 'Bottes homme', parent: 'Chaussures' },
    { name: 'Chaussures professionnelles', parent: 'Chaussures' },

    { name: 'Bottines femme', parent: 'Chaussures décontractées' },
    { name: 'Baskets femme', parent: 'Chaussures décontractées' },
    { name: 'Chaussures en toile femme', parent: 'Chaussures décontractées' },
    { name: 'Chaussures de skate femme', parent: 'Chaussures décontractées' },
    { name: 'Chaussures mocassins femme', parent: 'Chaussures décontractées' },

    { name: 'Bottines à lacets femme', parent: 'Bottes femme' },
    { name: 'Nouveautés bottes femme', parent: 'Bottes femme' },
    { name: 'Bottes de pluie', parent: 'Bottes femme' },
    { name: 'Bottes hautes', parent: 'Bottes femme' },

    { name: 'Chaussures babies', parent: 'Chaussures plates' },
    { name: 'Ballerines', parent: 'Chaussures plates' },
    { name: 'Chaussures en cuir', parent: 'Chaussures plates' },
    { name: 'Chaussures compensées', parent: 'Chaussures plates' },

    { name: 'Tongs homme', parent: 'Sandales et chaussures homme' },
    { name: 'Sandales en cuir', parent: 'Sandales et chaussures homme' },
    { name: "Chaussons d'hiver homme", parent: 'Sandales et chaussures homme' },
    { name: 'Claquettes en plastique', parent: 'Sandales et chaussures homme' },
    { name: 'Sandales sport', parent: 'Sandales et chaussures homme' },

    { name: 'Chaussures à bout rond', parent: 'Chaussures à talons homme' },
    { name: 'Talons compensés', parent: 'Chaussures à talons homme' },
    { name: 'Chaussures à bout pointu', parent: 'Chaussures à talons homme' },
    { name: 'Chaussures à bouts ouverts', parent: 'Chaussures à talons homme' },
    { name: 'Talons très haut', parent: 'Chaussures à talons homme' },

    { name: 'Meilleures ventes', parent: "Plus d'options d'achats" },

    { name: 'Mocassins homme', parent: 'Chaussures décontractées (bis)' },
    {
        name: 'Chaussures en toile homme',
        parent: 'Chaussures décontractées (bis)',
    },
    { name: 'Chaussures en cuir', parent: 'Chaussures décontractées (bis)' },
    { name: 'Baskets décontractées', parent: 'Chaussures décontractées (bis)' },
    { name: 'Chaussures sport', parent: 'Chaussures décontractées (bis)' },

    { name: 'Semelles intérieures', parent: 'Accessoires' },
    { name: 'Housses de chaussures', parent: 'Accessoires' },
    { name: 'Lacets', parent: 'Accessoires' },
    { name: 'Cirage à chaussures', parent: 'Accessoires' },
    { name: 'Kits soin chaussures', parent: 'Accessoires' },

    { name: 'Sandales à talons', parent: 'Sandales et chaussons femme' },
    { name: 'Mules', parent: 'Sandales et chaussons femme' },
    { name: 'Sandales à lanières', parent: 'Sandales et chaussons femme' },
    { name: 'Tongs femme', parent: 'Sandales et chaussons femme' },
    { name: 'Sandales plates', parent: 'Sandales et chaussons femme' },
    { name: "Chaussons d'hiver femme", parent: 'Sandales et chaussons femme' },

    { name: 'Bottines à lacets homme', parent: 'Bottes homme' },
    { name: 'Chaussures travail et sécurité', parent: 'Bottes homme' },
    { name: 'Bottes en cuir', parent: 'Bottes homme' },
    { name: 'Bottines militaires homme', parent: 'Bottes homme' },

    { name: 'Chaussures derby', parent: 'Chaussures professionnelles' },
    { name: 'Chaussures élégantes', parent: 'Chaussures professionnelles' },
    { name: 'Mocassins', parent: 'Chaussures professionnelles' },
    { name: 'Chaussures décontractées', parent: 'Chaussures professionnelles' },

    // Accessoires
    { name: 'Écharpes et gants', parent: 'Accessoires' },
    { name: 'Chapeaux', parent: 'Accessoires' },
    { name: 'Ceintures', parent: 'Accessoires' },
    { name: 'Lunettes de soleil', parent: 'Accessoires' },
    { name: "Plus d'options d'achats", parent: 'Accessoires' },
    { name: 'Autres accessoires', parent: 'Accessoires' },
    { name: 'Accessoires de tête', parent: 'Accessoires' },

    { name: 'Foulards en soie', parent: 'Écharpes et gants' },
    { name: 'Gants tricotés', parent: 'Écharpes et gants' },
    { name: 'Écharpes en soie', parent: 'Écharpes et gants' },
    { name: 'Écharpes unies', parent: 'Écharpes et gants' },
    { name: 'Écharpes cachemire', parent: 'Écharpes et gants' },
    { name: 'Écharpes à carreaux', parent: 'Écharpes et gants' },

    { name: 'Chapeaux fantaisie', parent: 'Chapeaux' },
    { name: 'Cagoules', parent: 'Chapeaux' },
    { name: 'Chapeaux', parent: 'Chapeaux' },
    { name: 'Chapeaux de soleil enfants', parent: 'Chapeaux' },
    { name: 'Casquettes', parent: 'Chapeaux' },

    { name: 'Chaînes de taille', parent: 'Ceintures' },
    { name: 'Ceintures homme', parent: 'Ceintures' },
    { name: 'Ceintures mode', parent: 'Ceintures' },
    { name: 'Accessoires ceinture', parent: 'Ceintures' },
    { name: 'Ceintures féminine', parent: 'Ceintures' },

    { name: 'Lunettes de soleil femme', parent: 'Lunettes de soleil' },
    { name: 'Lunettes de soleil enfants', parent: 'Lunettes de soleil' },
    { name: 'Lunettes de soleil polarisées', parent: 'Lunettes de soleil' },
    { name: 'Lunettes de soleil fantaisie', parent: 'Lunettes de soleil' },
    { name: 'Lunettes de soleil tendance', parent: 'Lunettes de soleil' },
    { name: 'Lunettes de soleil cycliste', parent: 'Lunettes de soleil' },

    { name: 'Meilleures ventes', parent: "Plus d'options d'achats" },

    { name: 'Masques', parent: 'Autres accessoires' },
    { name: 'Noeuds papillon', parent: 'Autres accessoires' },
    { name: 'Mouchoirs en tissu', parent: 'Autres accessoires' },
    { name: 'Cravates', parent: 'Autres accessoires' },
    { name: 'Cannes tendances', parent: 'Autres accessoires' },
    { name: 'Bretelles', parent: 'Autres accessoires' },
    { name: 'Porte jarretelles', parent: 'Autres accessoires' },

    { name: 'Pinces à cheveux', parent: 'Accessoires de tête' },
    { name: 'Bonnets de nuit', parent: 'Accessoires de tête' },
    { name: 'Élastiques et chouchous', parent: 'Accessoires de tête' },
    { name: 'Bandeaux', parent: 'Accessoires de tête' },
    { name: 'Barrettes à cheveux', parent: 'Accessoires de tête' },

    // Sacs, bagages
    { name: 'Sac à main', parent: 'Sacs, bagages' },
    { name: 'Portefeuille, porte-monnaie', parent: 'Sacs, bagages' },
    { name: 'Sacs à dos', parent: 'Sacs, bagages' },
    { name: 'Sac banane', parent: 'Sacs, bagages' },
    { name: "Plus d'options d'achats", parent: 'Sacs, bagages' },
    { name: 'Nouveautés', parent: 'Sacs, bagages' },

    { name: 'Sacs seau', parent: 'Sac à main' },
    { name: 'Sacs Hobo', parent: 'Sac à main' },
    { name: 'Sacs carré', parent: 'Sac à main' },
    { name: 'Sacs boston', parent: 'Sac à main' },
    { name: 'Sac baguette', parent: 'Sac à main' },
    { name: 'Accessoires sacs', parent: 'Sac à main' },

    { name: 'Portefeuilles homme', parent: 'Portefeuille, porte-monnaie' },
    { name: 'Portefeuilles de voyage', parent: 'Portefeuille, porte-monnaie' },
    { name: 'Portefeuilles femme', parent: 'Portefeuille, porte-monnaie' },
    { name: 'Porte-cartes de crédit', parent: 'Portefeuille, porte-monnaie' },
    { name: 'Portefeuilles cuir homme', parent: 'Portefeuille, porte-monnaie' },

    { name: "Sacs à dos d'affaires", parent: 'Sacs à dos' },
    { name: 'Sacs à dos antivol', parent: 'Sacs à dos' },
    { name: 'Sacs bandoulière', parent: 'Sacs à dos' },
    { name: 'Sacoches', parent: 'Sacs à dos' },

    { name: 'Sacs banane en cuir', parent: 'Sac banane' },
    { name: 'Sacs banane à chaîne', parent: 'Sac banane' },
    { name: 'Sacs banane sport', parent: 'Sac banane' },
    { name: 'Sacs banane en toile', parent: 'Sac banane' },

    { name: 'Meilleures ventes', parent: "Plus d'options d'achats" },

    { name: 'Nouveautés sacs à main', parent: 'Nouveautés' },
    { name: 'Nouveautés sacs à dos', parent: 'Nouveautés' },

    // Bijouterie
    { name: 'Bijoux', parent: 'Bijouterie' },
    { name: 'Bagues', parent: 'Bijouterie' },
    { name: 'Autres bijoux', parent: 'Bijouterie' },
    { name: 'Bracelets', parent: 'Bijouterie' },
    { name: 'Bijoux de corps', parent: 'Bijouterie' },
    { name: 'Matériel', parent: 'Bijouterie' },
    { name: "Boucles d'oreilles", parent: 'Bijouterie' },
    { name: 'Colliers', parent: 'Bijouterie' },
    { name: 'Montres homme', parent: 'Bijouterie' },
    { name: 'Montres femme', parent: 'Bijouterie' },
    { name: 'Montres Connectées', parent: 'Bijouterie' },
    { name: "Plus d'options d'achats", parent: 'Bijouterie' },
    { name: 'Nouveautés', parent: 'Bijouterie' },

    { name: 'Parures de bijoux', parent: 'Bijoux' },
    { name: 'Emballages bijoux', parent: 'Bijoux' },
    { name: 'Crochets bijoux', parent: 'Bijoux' },
    { name: 'Médaillons', parent: 'Bijoux' },
    { name: 'Chaînes', parent: 'Bijoux' },

    { name: 'Bague pour femme', parent: 'Bagues' },
    { name: 'Bague pour homme', parent: 'Bagues' },
    { name: 'Bague de mariage', parent: 'Bagues' },
    { name: 'Bague de couple', parent: 'Bagues' },
    { name: 'Bague connectée', parent: 'Bagues' },
    { name: 'Bagues chevalières', parent: 'Bagues' },

    { name: 'Pinces à cravate', parent: 'Autres bijoux' },
    { name: 'Parures de bijoux', parent: 'Autres bijoux' },
    { name: 'Porte-clés', parent: 'Autres bijoux' },
    { name: 'Broches', parent: 'Autres bijoux' },
    { name: 'Bijoux cheveux', parent: 'Autres bijoux' },

    { name: 'Bracelets en argent', parent: 'Bracelets' },
    { name: 'Bracelets moissanite', parent: 'Bracelets' },
    { name: 'Bracelets pierre naturelle', parent: 'Bracelets' },
    { name: 'Bracelets chaîne', parent: 'Bracelets' },
    { name: 'Bracelets en fil', parent: 'Bracelets' },
    { name: 'Bracelets plaqué or', parent: 'Bracelets' },

    { name: "Piercings d'oreille", parent: 'Bijoux de corps' },
    { name: 'Grills dents', parent: 'Bijoux de corps' },
    { name: 'Piercings nombril', parent: 'Bijoux de corps' },
    { name: 'Chaînes de corps', parent: 'Bijoux de corps' },
    { name: 'Piercings nez', parent: 'Bijoux de corps' },

    { name: 'Argent', parent: 'Matériel' },
    { name: 'Argent 925', parent: 'Matériel' },
    { name: 'Perles', parent: 'Matériel' },
    { name: 'Or plaqué', parent: 'Matériel' },
    { name: 'Pierres précieuses', parent: 'Matériel' },
    { name: 'Moissanite', parent: 'Matériel' },

    { name: "Boucles d'oreilles plaqué or", parent: "Boucles d'oreilles" },
    { name: "Sets boucles d'oreilles", parent: "Boucles d'oreilles" },
    { name: "Boucles d'oreilles en argent", parent: "Boucles d'oreilles" },
    { name: 'Créoles', parent: "Boucles d'oreilles" },
    { name: "Boucles d'oreilles en perle", parent: "Boucles d'oreilles" },
    { name: "Boucles d'oreilles pendantes", parent: "Boucles d'oreilles" },

    { name: 'Colliers femme', parent: 'Colliers' },
    { name: 'Colliers en argent', parent: 'Colliers' },
    { name: 'Colliers hip-hop', parent: 'Colliers' },
    { name: 'Colliers de perles', parent: 'Colliers' },
    { name: 'Colliers homme', parent: 'Colliers' },
    { name: 'Collier superposé', parent: 'Colliers' },

    { name: 'Montres mécaniques', parent: 'Montres homme' },
    { name: 'Montres automatiques', parent: 'Montres homme' },
    { name: 'Montres à quartz', parent: 'Montres homme' },
    { name: 'Montres digitales', parent: 'Montres homme' },
    { name: 'Montres de sport', parent: 'Montres homme' },
    { name: 'Montres de luxe', parent: 'Montres homme' },
    { name: 'Montres vintage', parent: 'Montres homme' },
    { name: 'Montres en cuir', parent: 'Montres homme' },
    { name: 'Bracelets de montres', parent: 'Montres homme' },
    { name: 'Étuis montre homme', parent: 'Montres homme' },
    { name: 'Enrouleurs de montre', parent: 'Montres homme' },

    { name: 'Montres mécaniques', parent: 'Montres femme' },
    { name: 'Montres à quartz', parent: 'Montres femme' },
    { name: 'Montres automatiques', parent: 'Montres femme' },
    { name: 'Montres bracelet', parent: 'Montres femme' },
    { name: 'Montres en cuir', parent: 'Montres femme' },
    { name: 'Montres de luxe', parent: 'Montres femme' },
    { name: 'Montres vintage', parent: 'Montres femme' },
    { name: 'Montres de sport', parent: 'Montres femme' },
    { name: 'Bracelets de montres', parent: 'Montres femme' },
    { name: 'Etuis montre femme', parent: 'Montres femme' },
    { name: 'Enrouleurs de montre', parent: 'Montres femme' },

    { name: 'Montres connectées GPS', parent: 'Montres Connectées' },
    { name: 'Montres connectées de sport', parent: 'Montres Connectées' },
    { name: 'Montres connectées pour enfants', parent: 'Montres Connectées' },
    {
        name: 'Montres connectées avec appel et SMS',
        parent: 'Montres Connectées',
    },
    {
        name: 'Montres connectées avec mesure de la fréquence cardiaque',
        parent: 'Montres Connectées',
    },

    { name: 'Meilleures ventes', parent: "Plus d'options d'achats" },

    { name: 'Nouveautés porte-clés', parent: 'Nouveautés' },
    { name: 'Nouveautés montres homme', parent: 'Nouveautés' },
    { name: 'Nouveautés colliers', parent: 'Nouveautés' },
    { name: 'Nouveautés bracelets', parent: 'Nouveautés' },
    { name: 'Nouveautés bagues', parent: 'Nouveautés' },
    { name: 'Nouveautés fermoirs', parent: 'Nouveautés' },

    // Extensions, perruques
    { name: 'Extensions cheveux', parent: 'Extensions, perruques' },
    { name: 'Postiches', parent: 'Extensions, perruques' },
    { name: 'Perruques tendances', parent: 'Extensions, perruques' },
    { name: "Plus d'options d'achats", parent: 'Extensions, perruques' },
    { name: 'Accessoires perruques', parent: 'Extensions, perruques' },
    { name: 'Perruques en dentelle', parent: 'Extensions, perruques' },
    { name: 'Perruques', parent: 'Extensions, perruques' },

    { name: 'Extensions à clip', parent: 'Extensions cheveux' },
    { name: 'Mèches pour crochets', parent: 'Extensions cheveux' },
    { name: 'Extensions cheveux humains', parent: 'Extensions cheveux' },
    { name: 'Tissages', parent: 'Extensions cheveux' },
    { name: 'Mèches avec closures', parent: 'Extensions cheveux' },
    { name: 'Grosses tresses', parent: 'Extensions cheveux' },

    { name: 'Toupets', parent: 'Postiches' },
    { name: 'Queues de cheval synthétiques', parent: 'Postiches' },
    { name: 'Chignons synthétiques', parent: 'Postiches' },
    { name: 'Volumateurs capillaires', parent: 'Postiches' },
    { name: 'Franges', parent: 'Postiches' },
    { name: 'Queues de cheval cheveux', parent: 'Postiches' },

    { name: 'Perruques ondulées', parent: 'Perruques tendances' },
    { name: 'Perruques bouclées', parent: 'Perruques tendances' },
    { name: 'Perruques en dentelle', parent: 'Perruques tendances' },
    { name: 'Perruques tressées en dentelle', parent: 'Perruques tendances' },

    { name: 'Meilleures ventes', parent: "Plus d'options d'achats" },

    { name: 'Filets à cheveux', parent: 'Accessoires perruques' },
    { name: 'Supports pour perruque', parent: 'Accessoires perruques' },

    { name: 'Perruques synthétiques', parent: 'Perruques en dentelle' },
    { name: 'Perruques naturelles raides', parent: 'Perruques en dentelle' },
    { name: 'Perruques naturelles', parent: 'Perruques en dentelle' },
    { name: 'Perruques en soie à base', parent: 'Perruques en dentelle' },
    { name: 'Perruques Dentelle Handmade', parent: 'Perruques en dentelle' },
    { name: 'Perruques naturelles (bis)', parent: 'Perruques en dentelle' },

    { name: 'Perruques bandeau', parent: 'Perruques' },
    { name: 'Perruques en U', parent: 'Perruques' },
    { name: 'Perruques juives', parent: 'Perruques' },
    { name: 'Perruques afro', parent: 'Perruques' },
    { name: 'Perruques coupe Pixie', parent: 'Perruques' },

    // Sous-vêtements, vêtements de détente
    {
        name: 'Sous-vêtements homme',
        parent: 'Sous-vêtements, vêtements de détente',
    },
    { name: 'Chaussettes', parent: 'Sous-vêtements, vêtements de détente' },
    {
        name: 'Lingerie sculptante',
        parent: 'Sous-vêtements, vêtements de détente',
    },
    { name: 'Soutien-gorge', parent: 'Sous-vêtements, vêtements de détente' },
    { name: 'Culottes', parent: 'Sous-vêtements, vêtements de détente' },
    {
        name: 'Détente et sommeil',
        parent: 'Sous-vêtements, vêtements de détente',
    },
    { name: 'Nouveautés', parent: 'Sous-vêtements, vêtements de détente' },
    {
        name: "Plus d'options d'achats",
        parent: 'Sous-vêtements, vêtements de détente',
    },

    { name: 'Boxers', parent: 'Sous-vêtements homme' },
    { name: 'Maillots de corps', parent: 'Sous-vêtements homme' },
    { name: 'Chaussettes', parent: 'Sous-vêtements homme' },
    { name: 'Corsets sport hommes', parent: 'Sous-vêtements homme' },
    { name: 'Pyjamas', parent: 'Sous-vêtements homme' },
    { name: 'Sous-vêtements thermiques', parent: 'Sous-vêtements homme' },

    { name: 'Bas', parent: 'Chaussettes' },
    { name: "Chaussettes d'hiver", parent: 'Chaussettes' },
    { name: 'Chaussettes chaudes', parent: 'Chaussettes' },
    { name: 'Chaussettes basses', parent: 'Chaussettes' },
    { name: 'Chaussettes JK', parent: 'Chaussettes' },
    { name: 'Chaussettes (bis)', parent: 'Chaussettes' },

    { name: 'Gaines', parent: 'Lingerie sculptante' },
    { name: 'Corsets', parent: 'Lingerie sculptante' },
    { name: 'Culottes sculptantes', parent: 'Lingerie sculptante' },
    { name: 'Body', parent: 'Lingerie sculptante' },

    { name: 'Soutien-gorge adhésifs', parent: 'Soutien-gorge' },
    { name: 'Brassières sport', parent: 'Soutien-gorge' },
    { name: 'Soutien-gorge sans coutures', parent: 'Soutien-gorge' },
    { name: 'Soutien-gorge sans bretelles', parent: 'Soutien-gorge' },
    { name: 'Soutien-gorge sexy', parent: 'Soutien-gorge' },
    { name: 'Soutien-gorge push-up', parent: 'Soutien-gorge' },

    { name: 'Culottes', parent: 'Culottes' },
    { name: 'Culottes grande taille', parent: 'Culottes' },
    { name: 'Strings', parent: 'Culottes' },
    { name: 'Culottes sexy', parent: 'Culottes' },
    { name: 'Culottes menstruelles', parent: 'Culottes' },

    { name: 'Chemises de nuit', parent: 'Détente et sommeil' },
    { name: 'Ensembles pyjama', parent: 'Détente et sommeil' },
    { name: "Pyjamas d'hiver", parent: 'Détente et sommeil' },

    { name: 'Nouveautés chaussettes', parent: 'Nouveautés' },
    { name: 'Nouveautés sous-vêtements', parent: 'Nouveautés' },
    { name: 'Nouveautés pyjamas femme', parent: 'Nouveautés' },
    { name: 'Nouveautés pyjamas homme', parent: 'Nouveautés' },
    { name: 'Nouveautés sous-vêtements femme', parent: 'Nouveautés' },
    { name: 'Nouveautés chaussettes homme', parent: 'Nouveautés' },

    { name: 'Meilleures ventes', parent: "Plus d'options d'achats" },
];

// Connexion à MongoDB
const connectDB = async () => {
    try {
        // Les options useNewUrlParser et useUnifiedTopology sont obsolètes.
        await mongoose.connect(process.env.MONGO_URI);
        console.log('✅ MongoDB connecté avec succès.');
    } catch (error) {
        console.error('❌ Erreur de connexion MongoDB :', error.message);
        process.exit(1);
    }
};

/**
 * Construit l'arbre hiérarchique des catégories de manière récursive.
 * @param {Array} categories - Le tableau de toutes les catégories créées.
 * @param {Map} categoryMap - Une map des catégories par leur ID.
 */
const buildCategoryTree = async (categories, categoryMap) => {
    for (const category of categories) {
        if (category.parent) {
            const parentCategory = categoryMap.get(category.parent.toString());
            if (parentCategory) {
                category.niveau = parentCategory.niveau + 1;
                category.ancetres = [
                    ...parentCategory.ancetres,
                    {
                        _id: parentCategory._id,
                        nom: parentCategory.nom,
                        slug: parentCategory.slug,
                    },
                ];
                await category.save();
            }
        }
    }
};

/**
 * Fonction principale pour importer toutes les données.
 */
const importData = async () => {
    try {
        // 1. Nettoyage de la base de données
        await Commande.deleteMany();
        await Paiement.deleteMany();
        await Produit.deleteMany();
        await Utilisateur.deleteMany();
        await Categorie.deleteMany();
        console.log('🧹 Anciennes données supprimées.');

        // 2. Insertion des utilisateurs
        const createdUsers = await Utilisateur.insertMany(utilisateurs);
        const adminUser = createdUsers.find(user => user.role === 'admin');
        console.log('✅ Utilisateurs insérés.');

        // 3. Création et liaison des catégories
        const categoriesMap = new Map(); // Stocke les catégories créées par leur nom

        // Créer d'abord toutes les catégories racines
        for (const catData of rawCategories) {
            if (!catData.parent) {
                const newCat = await Categorie.create({ nom: catData.name });
                categoriesMap.set(catData.name, newCat);
            }
        }

        // Créer ensuite les catégories enfants et les lier à leur parent
        for (const catData of rawCategories) {
            if (catData.parent) {
                const parentCategory = categoriesMap.get(catData.parent);
                if (parentCategory) {
                    // On vérifie si une catégorie avec le même nom et le même parent existe déjà
                    // pour éviter les doublons causés par la structure de rawCategories
                    const existingCat = await Categorie.findOne({
                        nom: catData.name,
                        parent: parentCategory._id,
                    });
                    if (!existingCat) {
                        const newCat = await Categorie.create({
                            nom: catData.name,
                            parent: parentCategory._id,
                        });
                        // On ne stocke pas les enfants dans la map pour éviter les conflits de noms
                    }
                } else {
                    console.warn(
                        `⚠️ Parent '${catData.parent}' non trouvé pour la catégorie '${catData.name}'.`
                    );
                }
            }
        }

        // 5. Construction de l'arbre hiérarchique (ancêtres et niveau)
        const allCategories = await Categorie.find();
        const categoryIdMap = new Map(
            allCategories.map(cat => [cat._id.toString(), cat])
        );
        await buildCategoryTree(allCategories, categoryIdMap);
        console.log('🌳 Arbre des catégories construit.');

        // 6. Préparation et insertion des produits
        const sampleProducts = produits.map(product => {
            // Attribue une catégorie aléatoire au produit
            const randomCategory =
                allCategories[Math.floor(Math.random() * allCategories.length)];
            return {
                ...product,
                vendeur: adminUser._id,
                categorie: randomCategory._id,
            };
        });

        await Produit.insertMany(sampleProducts);
        console.log('📦 Produits insérés.');

        console.log(
            '\n🎉 Peuplement de la base de données terminé avec succès !'
        );
        process.exit(0);
    } catch (error) {
        console.error('❌ Erreur lors du peuplement des données :', error);
        process.exit(1);
    }
};

/**
 * Fonction pour détruire toutes les données.
 */
const destroyData = async () => {
    try {
        await Commande.deleteMany();
        await Paiement.deleteMany();
        await Produit.deleteMany();
        await Utilisateur.deleteMany();
        await Categorie.deleteMany();

        console.log('🗑️ Toutes les données ont été détruites.');
        process.exit(0);
    } catch (error) {
        console.error('❌ Erreur lors de la destruction des données :', error);
        process.exit(1);
    }
};

// 🚀 Exécution du script
const run = async () => {
    await connectDB();

    if (process.argv.includes('--destroy')) {
        await destroyData();
    } else if (process.argv.includes('--import')) {
        await importData();
    } else {
        console.log('Veuillez spécifier une action : --import ou --destroy');
        process.exit(1);
    }
};

run();
