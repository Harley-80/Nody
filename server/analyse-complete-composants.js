import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Couleurs
const colors = {
    reset: '\x1b[0m',
    bright: '\x1b[1m',
    red: '\x1b[31m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    cyan: '\x1b[36m',
};

console.log(`${colors.cyan}${colors.bright}
╔════════════════════════════════════════════════════════════════╗
║           ANALYSE COMPLÈTE - COMPOSANTS REACT                  ║
║           Recherche du problème d'affichage des images         ║
╚════════════════════════════════════════════════════════════════╝
${colors.reset}\n`);

// Chemins à analyser
const CLIENT_PATH = 'C:\\xampp\\htdocs\\Documents\\Nody\\client\\src';

const FICHIERS_A_ANALYSER = [
    'pages/vendeur/MesProduits.jsx',
    'components/vendeur/CarteProduitVendeur.jsx',
    'components/admin/dashboard/TableauProduitsPopulaires.jsx',
    'pages/admin/Dashboard.jsx',
    'pages/vendeur/DashboardVendeur.jsx',
];

// Patterns problématiques à chercher
const PATTERNS_PROBLEMATIQUES = [
    {
        name: 'Fallback image par défaut',
        pattern: /['"]\/images\/[^'"]+\.jpg['"]/g,
        description: "Utilise une image par défaut au lieu de l'URL API",
        severity: 'CRITIQUE',
    },
    {
        name: 'Accès incorrect aux images',
        pattern: /produit\.image[^s]/g,
        description: 'Utilise produit.image au lieu de produit.images[0]',
        severity: 'CRITIQUE',
    },
    {
        name: 'Construction URL relative',
        pattern: /`\$\{[^}]*\}\/uploads/g,
        description:
            "Construit des URLs relatives au lieu d'utiliser l'URL complète",
        severity: 'MOYEN',
    },
    {
        name: 'Import VITE_API_URL manquant',
        pattern: /import\.meta\.env\.VITE_API_URL/g,
        description: 'Utilise ou non VITE_API_URL',
        severity: 'INFO',
    },
    {
        name: "Gestion d'erreur onError",
        pattern: /onError\s*=\s*\{[^}]+\}/g,
        description: "Comment les erreurs d'images sont gérées",
        severity: 'INFO',
    },
    {
        name: 'Placeholder statique',
        pattern: /placeholder\.jpg|default-product\.jpg/g,
        description: 'Utilise un placeholder statique',
        severity: 'CRITIQUE',
    },
];

// Fonction pour analyser un fichier
function analyserFichier(cheminRelatif) {
    const cheminComplet = path.join(CLIENT_PATH, cheminRelatif);

    console.log(
        `\n${colors.blue}${colors.bright}📄 Analyse: ${cheminRelatif}${colors.reset}`
    );

    if (!fs.existsSync(cheminComplet)) {
        console.log(`${colors.red}❌ Fichier non trouvé!${colors.reset}`);
        return null;
    }

    const contenu = fs.readFileSync(cheminComplet, 'utf-8');
    const lignes = contenu.split('\n');

    const resultats = {
        fichier: cheminRelatif,
        problemes: [],
        lignesCode: [],
    };

    // Chercher les patterns problématiques
    PATTERNS_PROBLEMATIQUES.forEach(pattern => {
        const matches = contenu.match(pattern.pattern);

        if (matches) {
            matches.forEach(match => {
                // Trouver le numéro de ligne
                let numeroLigne = 0;
                let positionCourante = 0;

                for (let i = 0; i < lignes.length; i++) {
                    if (lignes[i].includes(match)) {
                        numeroLigne = i + 1;
                        break;
                    }
                }

                resultats.problemes.push({
                    pattern: pattern.name,
                    match: match,
                    ligne: numeroLigne,
                    description: pattern.description,
                    severity: pattern.severity,
                    codeContext: lignes[numeroLigne - 1]?.trim(),
                });
            });
        }
    });

    // Chercher spécifiquement les lignes avec 'src='
    lignes.forEach((ligne, index) => {
        if (ligne.includes('src=') && ligne.includes('produit')) {
            resultats.lignesCode.push({
                ligne: index + 1,
                code: ligne.trim(),
            });
        }
    });

    return resultats;
}

// Fonction pour afficher les résultats
function afficherResultats(resultats) {
    let problemesCritiques = 0;
    let problemesMoyens = 0;

    resultats.forEach(resultat => {
        if (!resultat) return;

        console.log(
            `\n${colors.cyan}═══════════════════════════════════════════════════════════════${colors.reset}`
        );
        console.log(`${colors.bright}📁 ${resultat.fichier}${colors.reset}`);

        if (
            resultat.problemes.length === 0 &&
            resultat.lignesCode.length === 0
        ) {
            console.log(
                `${colors.green}✅ Aucun problème détecté${colors.reset}`
            );
            return;
        }

        // Afficher les problèmes
        if (resultat.problemes.length > 0) {
            console.log(
                `\n${colors.yellow}⚠️  Problèmes détectés: ${resultat.problemes.length}${colors.reset}`
            );

            resultat.problemes.forEach((probleme, index) => {
                const severityColor =
                    probleme.severity === 'CRITIQUE'
                        ? colors.red
                        : probleme.severity === 'MOYEN'
                          ? colors.yellow
                          : colors.blue;

                console.log(
                    `\n  ${severityColor}${probleme.severity}${colors.reset} - ${probleme.pattern}`
                );
                console.log(`  📍 Ligne ${probleme.ligne}`);
                console.log(`  💬 ${probleme.description}`);
                console.log(
                    `  📝 Trouvé: ${colors.yellow}${probleme.match}${colors.reset}`
                );
                console.log(
                    `  📄 Contexte: ${colors.cyan}${probleme.codeContext}${colors.reset}`
                );

                if (probleme.severity === 'CRITIQUE') problemesCritiques++;
                if (probleme.severity === 'MOYEN') problemesMoyens++;
            });
        }

        // Afficher les lignes de code avec 'src='
        if (resultat.lignesCode.length > 0) {
            console.log(
                `\n${colors.blue}📝 Lignes avec 'src=' trouvées:${colors.reset}`
            );
            resultat.lignesCode.forEach(ligne => {
                console.log(
                    `  ${colors.cyan}Ligne ${ligne.ligne}:${colors.reset} ${ligne.code}`
                );
            });
        }
    });

    // Résumé final
    console.log(
        `\n${colors.cyan}═══════════════════════════════════════════════════════════════${colors.reset}`
    );
    console.log(`${colors.bright}📊 RÉSUMÉ${colors.reset}\n`);
    console.log(
        `  ${colors.red}🔴 Problèmes CRITIQUES: ${problemesCritiques}${colors.reset}`
    );
    console.log(
        `  ${colors.yellow}🟡 Problèmes MOYENS: ${problemesMoyens}${colors.reset}`
    );

    if (problemesCritiques > 0) {
        console.log(
            `\n${colors.red}${colors.bright}⚠️  ACTION REQUISE: ${problemesCritiques} problème(s) critique(s) détecté(s)!${colors.reset}`
        );
        console.log(
            `${colors.yellow}Ces problèmes empêchent l'affichage correct des images.${colors.reset}\n`
        );
    } else {
        console.log(
            `\n${colors.green}${colors.bright}✅ Aucun problème critique détecté!${colors.reset}\n`
        );
    }
}

// EXÉCUTION PRINCIPALE
console.log(`${colors.cyan}📂 Dossier client: ${CLIENT_PATH}${colors.reset}\n`);

const tousLesResultats = FICHIERS_A_ANALYSER.map(fichier =>
    analyserFichier(fichier)
);

afficherResultats(tousLesResultats);

console.log(`${colors.green}${colors.bright}
╔════════════════════════════════════════════════════════════════╗
║                    ANALYSE TERMINÉE                            ║
╚════════════════════════════════════════════════════════════════╝
${colors.reset}\n`);

console.log(`${colors.yellow}📋 PROCHAINES ÉTAPES:${colors.reset}
1. Corrige les problèmes CRITIQUES en priorité
2. Remplace les fallback d'images par défaut
3. Utilise produit.images[0] au lieu de produit.image
4. Vérifie que les URLs sont déjà complètes depuis l'API
5. Teste à nouveau l'affichage
`);
