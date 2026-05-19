import fs from 'fs';
import path from 'path';
import http from 'http';
import { fileURLToPath } from 'url';

// Pour obtenir __dirname en ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const uploadsDir = path.join(__dirname, 'uploads/produits');

// 1. Vérification complète des fichiers
function checkAllFiles() {
    console.log('🔍 ANALYSE COMPLÈTE DES FICHIERS');
    console.log('================================');

    if (!fs.existsSync(uploadsDir)) {
        console.log("❌ Le dossier uploads/produits n'existe pas");
        return;
    }

    const files = fs.readdirSync(uploadsDir);
    console.log(`📁 Nombre de fichiers trouvés : ${files.length}`);

    files.forEach((file, index) => {
        const filePath = path.join(uploadsDir, file);
        const stats = fs.statSync(filePath);

        console.log(`\n${index + 1}. ${file}`);
        console.log(`   Chemin complet : ${filePath}`);
        console.log(`   Taille : ${stats.size} octets`);
        console.log(`   Modifié le : ${stats.mtime.toLocaleString()}`);
        console.log(`   Est un fichier : ${stats.isFile()}`);

        // Vérifier si le fichier est lisible
        try {
            fs.accessSync(filePath, fs.constants.R_OK);
            console.log(`   ✓ Lecture : OK`);
        } catch (err) {
            console.log(`   ❌ Lecture : ${err.message}`);
        }

        // Vérifier l'encodage du nom
        console.log(`   Encodage du nom :`);
        console.log(`     - Hex : ${Buffer.from(file).toString('hex')}`);
        console.log(
            `     - Char codes : ${Array.from(file)
                .map(c => c.charCodeAt(0))
                .join(', ')}`
        );

        // Vérifier les caractères spéciaux
        const hasSpecialChars = /[^\w\.\-]/g.test(file);
        console.log(
            `   Caractères spéciaux : ${hasSpecialChars ? 'OUI ⚠️' : 'non'}`
        );

        // Vérifier la normalisation Unicode
        const normalized = file.normalize('NFC');
        if (normalized !== file) {
            console.log(`   ⚠️  Normalisation différente : ${normalized}`);
        }
    });
}

// 2. Test de serveur HTTP pour vérifier l'accès
function createTestServer() {
    const server = http.createServer((req, res) => {
        console.log(`\n🌐 REQUÊTE HTTP: ${req.url}`);

        if (req.url.startsWith('/produits/')) {
            const fileName = decodeURIComponent(req.url.split('/').pop());
            const filePath = path.join(uploadsDir, fileName);

            console.log(`   Fichier demandé : ${fileName}`);
            console.log(`   Chemin sur disque : ${filePath}`);

            if (fs.existsSync(filePath)) {
                const stats = fs.statSync(filePath);
                console.log(`   ✓ Fichier trouvé (${stats.size} octets)`);

                // Servir l'image
                fs.readFile(filePath, (err, data) => {
                    if (err) {
                        console.log(`   ❌ Erreur lecture: ${err.message}`);
                        res.writeHead(500);
                        res.end('Erreur serveur');
                    } else {
                        console.log(`   ✓ Données lues: ${data.length} octets`);
                        res.writeHead(200, {
                            'Content-Type': 'image/jpeg',
                            'Content-Length': data.length,
                            'Cache-Control': 'no-cache',
                        });
                        res.end(data);
                    }
                });
            } else {
                console.log(`   ❌ Fichier introuvable sur le disque`);
                console.log(
                    `   Fichiers disponibles: ${fs.readdirSync(uploadsDir).join(', ')}`
                );
                res.writeHead(404);
                res.end('Fichier non trouvé');
            }
        } else {
            // Page de test
            const files = fs.readdirSync(uploadsDir);
            const html = `
            <!DOCTYPE html>
            <html>
            <head>
                <title>Test Images</title>
                <style>
                    img { max-width: 200px; margin: 10px; border: 2px solid #ccc; }
                    .container { display: flex; flex-wrap: wrap; }
                    .error { border-color: red !important; }
                    .success { border-color: green !important; }
                </style>
            </head>
            <body>
                <h1>Test des images (${files.length} fichiers)</h1>
                <div><button onclick="location.reload()">Rafraîchir</button></div>
                <div class="container" id="images-container"></div>
                <script>
                    const files = ${JSON.stringify(files)};
                    const container = document.getElementById('images-container');
                    
                    files.forEach(file => {
                        const encodedFile = encodeURIComponent(file);
                        const div = document.createElement('div');
                        div.style.margin = '20px';
                        div.style.padding = '10px';
                        div.style.border = '1px solid #ddd';
                        div.innerHTML = \`
                            <div style="margin-bottom: 10px;">
                                <strong>\${file}</strong><br>
                                <small>Encoded: \${encodedFile}</small>
                            </div>
                            <div>
                                <img src="/produits/\${encodedFile}" 
                                     style="max-width: 200px; border: 2px solid #ccc;"
                                     onerror="this.classList.add('error'); console.error('Erreur chargement:', '\${file}')"
                                     onload="this.classList.add('success')">
                            </div>
                            <div style="margin-top: 10px;">
                                <a href="/produits/\${encodedFile}" target="_blank">Ouvrir dans nouvel onglet</a><br>
                                <button onclick="testImageLoad('\${file}')">Tester avec fetch</button>
                            </div>
                            <div id="status-\${encodedFile}" style="font-size: 12px; color: #666;"></div>
                        \`;
                        container.appendChild(div);
                    });
                    
                    function testImageLoad(filename) {
                        const encoded = encodeURIComponent(filename);
                        const statusEl = document.getElementById('status-' + encoded);
                        statusEl.innerHTML = 'Test en cours...';
                        
                        fetch('/produits/' + encoded)
                            .then(response => {
                                statusEl.innerHTML = 'Status: ' + response.status + ' ' + response.statusText;
                                if (!response.ok) {
                                    throw new Error('HTTP ' + response.status);
                                }
                                return response.blob();
                            })
                            .then(blob => {
                                statusEl.innerHTML += '<br>Taille: ' + blob.size + ' octets';
                                statusEl.style.color = 'green';
                            })
                            .catch(err => {
                                statusEl.innerHTML += '<br>Erreur: ' + err.message;
                                statusEl.style.color = 'red';
                            });
                    }
                </script>
            </body>
            </html>
            `;

            res.writeHead(200, {
                'Content-Type': 'text/html',
                'Cache-Control': 'no-cache',
            });
            res.end(html);
        }
    });

    server.listen(3001, () => {
        console.log('\n🚀 Serveur de test démarré sur http://localhost:3001');
        console.log(
            'Ouvrez cette URL dans votre navigateur pour tester les images'
        );
    });
}

// 3. Vérification des permissions
function checkPermissions() {
    console.log('\n🔐 VÉRIFICATION DES PERMISSIONS');
    console.log('==============================');

    const files = fs.readdirSync(uploadsDir);
    if (files.length === 0) {
        console.log('Aucun fichier à tester');
        return;
    }

    const testFile = path.join(uploadsDir, files[0]);

    try {
        // Tester la lecture
        fs.accessSync(testFile, fs.constants.R_OK);
        console.log('✓ Permission de lecture : OK');

        // Tester l'exécution (pour les dossiers)
        fs.accessSync(uploadsDir, fs.constants.R_OK);
        console.log('✓ Accès au dossier : OK');
    } catch (err) {
        console.log(`❌ Problème de permissions : ${err.message}`);
    }
}

// 4. Analyse comparative des noms de fichiers
function compareFilenames() {
    console.log('\n🔄 COMPARAISON DES NOMS DE FICHIERS');
    console.log('==================================');

    const files = fs.readdirSync(uploadsDir);

    if (files.length >= 2) {
        const file1 = files[0];
        const file2 = files[1];

        console.log(`Fichier 1: ${file1}`);
        console.log(`Fichier 2: ${file2}`);
        console.log(`\nComparaison binaire:`);
        console.log(`File1 hex: ${Buffer.from(file1).toString('hex')}`);
        console.log(`File2 hex: ${Buffer.from(file2).toString('hex')}`);

        // Vérifier la longueur
        console.log(`\nLongueurs:`);
        console.log(`File1: ${file1.length} caractères`);
        console.log(`File2: ${file2.length} caractères`);

        // Vérifier caractère par caractère
        console.log(`\nAnalyse caractère par caractère:`);
        const maxLength = Math.max(file1.length, file2.length);
        for (let i = 0; i < maxLength; i++) {
            const char1 = file1[i] || '';
            const char2 = file2[i] || '';
            if (char1 !== char2) {
                console.log(
                    `Position ${i}: '${char1}' (${char1.charCodeAt(0)}) vs '${char2}' (${char2.charCodeAt(0)})`
                );
            }
        }
    }
}

// 5. Vérifier les problèmes courants
function checkCommonIssues() {
    console.log('\n🔎 VÉRIFICATION DES PROBLÈMES COURANTS');
    console.log('=====================================');

    const files = fs.readdirSync(uploadsDir);

    files.forEach(file => {
        const issues = [];

        // Vérifier les espaces
        if (file.includes(' ')) {
            issues.push('Contient des espaces');
        }

        // Vérifier les caractères non-ASCII
        if (/[^\x00-\x7F]/.test(file)) {
            issues.push('Contient des caractères non-ASCII');
        }

        // Vérifier les caractères de contrôle
        if (/[\x00-\x1F\x7F]/.test(file)) {
            issues.push('Contient des caractères de contrôle');
        }

        // Vérifier la casse
        const lowerFile = file.toLowerCase();
        if (file !== lowerFile) {
            issues.push('Contient des majuscules');
        }

        // Vérifier la longueur
        if (file.length > 100) {
            issues.push('Nom trop long');
        }

        if (issues.length > 0) {
            console.log(`⚠️  ${file}: ${issues.join(', ')}`);
        }
    });
}

// 6. Test de lecture des fichiers
function testFileRead() {
    console.log('\n📖 TEST DE LECTURE DES FICHIERS');
    console.log('==============================');

    const files = fs.readdirSync(uploadsDir);

    files.slice(0, 3).forEach(file => {
        const filePath = path.join(uploadsDir, file);
        try {
            const buffer = fs.readFileSync(filePath);
            console.log(`✓ ${file}: ${buffer.length} octets lus`);

            // Vérifier si c'est une image valide
            if (buffer.length > 0) {
                // Vérifier les premiers bytes pour le type MIME
                const header = buffer.slice(0, 4).toString('hex');
                console.log(`  Header hex: ${header}`);

                if (header.startsWith('ffd8')) {
                    console.log(`  Type: JPEG`);
                } else if (header.startsWith('89504e47')) {
                    console.log(`  Type: PNG`);
                } else {
                    console.log(`  Type: Inconnu (peut-être corrompu)`);
                }
            }
        } catch (err) {
            console.log(`❌ ${file}: Erreur de lecture - ${err.message}`);
        }
    });
}

// Exécution principale
async function main() {
    console.log("🛠️  DIAGNOSTIC COMPLET DU PROBLÈME D'IMAGES");
    console.log('============================================\n');

    // Vérifier que le dossier existe
    if (!fs.existsSync(uploadsDir)) {
        console.log("❌ Le dossier uploads/produits n'existe pas");
        console.log(`Chemin recherché: ${uploadsDir}`);
        console.log(
            `Dossier parent existe: ${fs.existsSync(path.dirname(uploadsDir))}`
        );
        return;
    }

    // Exécuter toutes les vérifications
    checkAllFiles();
    checkPermissions();
    compareFilenames();
    checkCommonIssues();
    testFileRead();

    // Démarrer le serveur de test
    createTestServer();
}

// Gestion des erreurs
process.on('uncaughtException', err => {
    console.error('\n💥 ERREUR NON GÉRÉE:', err.message);
    console.error('Stack:', err.stack);
});

process.on('unhandledRejection', err => {
    console.error('\n💥 PROMESSE REJETÉE NON GÉRÉE:', err.message);
});

// Lancer le diagnostic
main().catch(console.error);
