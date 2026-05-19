import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const fichier = '694cfcdbf174632de7ae4223.jpg';

const chemin = path.join(__dirname, 'uploads', 'produits', fichier);

console.log('📂 Chemin testé :', chemin);

if (fs.existsSync(chemin)) {
    const stats = fs.statSync(chemin);
    console.log('✅ FICHIER TROUVÉ');
    console.log('📦 Taille:', stats.size, 'octets');
} else {
    console.log('❌ FICHIER INTROUVABLE SUR LE DISQUE');
}
