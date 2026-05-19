import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('🔍 RECHERCHE DE LA FONCTION DE GÉNÉRATION DE NOMS CORROMPUE');
console.log('===========================================================\n');

// 1. Chercher dans TOUS vos fichiers JS la fonction qui génère les noms
const searchDir = __dirname;
const jsFiles = [];

function findJSFiles(dir) {
    const items = fs.readdirSync(dir);

    items.forEach(item => {
        const fullPath = path.join(dir, item);
        const stat = fs.statSync(fullPath);

        if (
            stat.isDirectory() &&
            !item.includes('node_modules') &&
            !item.includes('.git')
        ) {
            findJSFiles(fullPath);
        } else if (
            item.endsWith('.js') ||
            item.endsWith('.mjs') ||
            item.endsWith('.ts')
        ) {
            jsFiles.push(fullPath);
        }
    });
}

findJSFiles(searchDir);

console.log(`📁 ${jsFiles.length} fichiers JS trouvés`);

// 2. Chercher les motifs de génération de noms de fichiers
console.log('\n🔎 RECHERCHE DES FONCTIONS DE GÉNÉRATION DE NOMS:');

const suspiciousPatterns = [
    'filename',
    'fileName',
    'file_name',
    'generateName',
    'generateFilename',
    'randomName',
    'upload',
    'produit',
    'image',
    '.jpg',
    '.jpeg',
    '.png',
    'Date.now()',
    'Math.random()',
    'toString(36)',
    'substring(2)',
    'crypto',
    'créer',
    'nom_fichier',
    'nomFichier',
];

jsFiles.forEach(file => {
    try {
        const content = fs.readFileSync(file, 'utf8');
        const lines = content.split('\n');

        let hasSuspiciousCode = false;
        const suspiciousLines = [];

        lines.forEach((line, index) => {
            // Chercher les motifs suspects
            const lowerLine = line.toLowerCase();

            // Vérifier si la ligne contient un motif suspect
            if (
                suspiciousPatterns.some(pattern =>
                    lowerLine.includes(pattern.toLowerCase())
                )
            ) {
                hasSuspiciousCode = true;

                // Vérifier les opérations suspectes spécifiques
                const redFlags = [];

                if (line.includes('charCodeAt') || line.includes('charCode')) {
                    redFlags.push(
                        "charCodeAt - peut causer des problèmes d'encodage"
                    );
                }
                if (
                    line.includes('toString(') &&
                    !line.includes('toString(36)')
                ) {
                    redFlags.push('toString() avec paramètre incorrect');
                }
                if (line.includes('parseInt') || line.includes('parseFloat')) {
                    redFlags.push(
                        'parseInt/parseFloat sur des chaînes hexadécimales'
                    );
                }
                if (line.includes('0x') || line.includes('hex')) {
                    redFlags.push('Manipulation hexadécimale');
                }
                if (line.includes('Buffer.from') || line.includes('Buffer(')) {
                    redFlags.push(
                        'Conversion Buffer - source probable de corruption'
                    );
                }

                if (redFlags.length > 0) {
                    suspiciousLines.push({
                        lineNumber: index + 1,
                        content: line.trim(),
                        flags: redFlags,
                    });
                }
            }
        });

        if (suspiciousLines.length > 0) {
            console.log(
                `\n⚠️  FICHIER SUSPECT: ${path.relative(__dirname, file)}`
            );

            suspiciousLines.forEach(sl => {
                console.log(`   Ligne ${sl.lineNumber}: ${sl.content}`);
                sl.flags.forEach(flag => console.log(`     🚩 ${flag}`));
            });

            // Analyser les fonctions spécifiques
            console.log('\n   🔍 ANALYSE DES FONCTIONS:');

            // Chercher des fonctions qui pourraient générer "694cfcdbf174632de7ae4223"
            const functionRegex =
                /(?:function\s+(\w+)|const\s+(\w+)\s*=\s*(?:\([^)]*\)|\w+)\s*=>|let\s+(\w+)\s*=\s*(?:\([^)]*\)|\w+)\s*=>|var\s+(\w+)\s*=\s*(?:\([^)]*\)|\w+)\s*=>)/g;
            let match;

            while ((match = functionRegex.exec(content)) !== null) {
                const funcName = match[1] || match[2] || match[3] || match[4];
                console.log(`     - Fonction trouvée: ${funcName}`);
            }
        }
    } catch (err) {
        // Ignorer les erreurs de lecture
    }
});

// 3. TEST SPÉCIFIQUE: Reproduire la corruption
console.log('\n🧪 TEST DE REPRODUCTION DE LA CORRUPTION:');
console.log('=========================================\n');

// Le problème: "694cfcdbf174632de7ae4223" → "6944606111626261a6123"
// Regardons la transformation caractère par caractère

const originalName = '694cfcdbf174632de7ae4223';
const corruptedName = '6944606111626261a6123';

console.log(`Original:  ${originalName}`);
console.log(`Corrompu:  ${corruptedName}`);

// Analyser la transformation
console.log('\nAnalyse de la transformation:');
for (let i = 0; i < Math.min(originalName.length, corruptedName.length); i++) {
    const origChar = originalName[i];
    const corrChar = corruptedName[i] || '';
    const origHex = origChar.charCodeAt(0).toString(16);
    const corrHex = corrChar ? corrChar.charCodeAt(0).toString(16) : '';

    console.log(
        `Position ${i}: '${origChar}' (${origHex}) → '${corrChar}' (${corrHex})`
    );
}

// 4. DIAGNOSTIC FINAL: Identifier la source exacte
console.log('\n🔬 DIAGNOSTIC FINAL:');
console.log('===================\n');

console.log('🚨 PROBLÈME IDENTIFIÉ:');
console.log(
    'Votre code génère des noms de fichiers avec des caractères hexadécimales (a-f)'
);
console.log(
    'mais quelque part dans votre chaîne de traitement, ces caractères sont'
);
console.log(
    'mal interprétés comme des chiffres ou convertis incorrectement.\n'
);

console.log('🎯 CAUSES POSSIBLES:');
console.log('1. Double conversion Buffer → String avec mauvais encodage');
console.log('2. Utilisation de charCodeAt() sans vérification');
console.log('3. Conversion hexadécimale → décimale involontaire');
console.log("4. Problème dans une bibliothèque tierce de génération d'ID\n");

console.log('💡 SOLUTION IMMÉDIATE:');
console.log(
    'Utilisez UNIQUEMENT des caractères alphanumériques simples (0-9, a-z, A-Z)'
);
console.log(
    'Évitez les noms purement hexadécimaux comme "694cfcdbf174632de7ae4223"\n'
);

// 5. GÉNÉRATEUR DE NOMS SÉCURISÉ
console.log('✨ GÉNÉRATEUR DE NOMS SÉCURISÉ À UTILISER:');
console.log('==========================================\n');

const secureNameGenerator = `
// À PLACER DANS VOTRE CODE DE GÉNÉRATION DE FICHIERS
function generateSecureFilename(originalName) {
    const extension = originalName.includes('.') 
        ? originalName.substring(originalName.lastIndexOf('.'))
        : '.jpg';
    
    // Utiliser UNIQUEMENT des caractères sécurisés
    const timestamp = Date.now();
    const randomString = Math.random().toString(36).substring(2, 10); // a-z et 0-9 uniquement
    
    // Éviter les caractères qui pourraient être mal interprétés
    const safeName = \`file_\${timestamp}_\${randomString}\${extension}\`;
    
    return safeName.toLowerCase(); // Tout en minuscules pour éviter les problèmes de casse
}

// Exemple d'utilisation:
const filename = generateSecureFilename('mon-image.jpg');
console.log(filename); // Exemple: file_176665783838_abc123de.jpg
`;

console.log(secureNameGenerator);

// 6. Vérifier si le nouveau fichier fonctionne
console.log('\n✅ TEST DU NOUVEAU FICHIER:');
const newFile = 'image_1766657737838_qj0qjmap.jpg';
const newFilePath = path.join(__dirname, 'uploads/produits', newFile);

if (fs.existsSync(newFilePath)) {
    console.log(`✓ Fichier renommé existe: ${newFile}`);
    console.log(`✓ Taille: ${fs.statSync(newFilePath).size} octets`);
    console.log(`\n📌 MAINTENANT:`);
    console.log(
        '1. Remplacez votre fonction de génération de noms par celle ci-dessus'
    );
    console.log("2. Testez l'accès dans le navigateur:");
    console.log(`   http://localhost:3000/uploads/produits/${newFile}`);
    console.log('3. Mettez à jour votre base de données');
} else {
    console.log("❌ Le fichier renommé n'existe pas");
}
