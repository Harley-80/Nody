import vision from '@google-cloud/vision';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Initialiser le client Google Vision
 * Vous devez avoir un fichier de clé JSON de Google Cloud
 */
let client;

try {
    // Option 1 : Avec fichier de clé JSON
    const keyFilePath = path.join(__dirname, '../google-vision-key.json');
    client = new vision.ImageAnnotatorClient({
        keyFilename: keyFilePath,
    });
} catch (error) {
    console.warn('Google Vision non configuré, utilisation du mode fallback');
    client = null;
}

/**
 * Analyser une image et extraire des labels/tags
 * @param {Buffer} imageBuffer - Buffer de l'image
 * @returns {Array} - Liste de labels détectés
 */
export async function analyserImage(imageBuffer) {
    if (!client) {
        console.warn('Google Vision non disponible');
        return [];
    }

    try {
        // Détection de labels (objets, couleurs, contexte)
        const [labelResult] = await client.labelDetection({
            image: { content: imageBuffer },
        });
        const labels = labelResult.labelAnnotations.map(label => ({
            description: label.description.toLowerCase(),
            score: label.score,
        }));

        // Détection de couleurs dominantes
        const [colorResult] = await client.imageProperties({
            image: { content: imageBuffer },
        });
        const colors =
            colorResult.imagePropertiesAnnotation.dominantColors.colors
                .slice(0, 3)
                .map(c => ({
                    color: rgbToHex(c.color.red, c.color.green, c.color.blue),
                    score: c.score,
                }));

        // Détection de texte (pour les logos/marques)
        const [textResult] = await client.textDetection({
            image: { content: imageBuffer },
        });
        const texts = textResult.textAnnotations
            ? textResult.textAnnotations
                  .slice(0, 5)
                  .map(t => t.description.toLowerCase())
            : [];

        return {
            labels: labels,
            colors: colors,
            texts: texts,
        };
    } catch (error) {
        console.error('Erreur analyse Google Vision:', error);
        return { labels: [], colors: [], texts: [] };
    }
}

/**
 * Convertir RGB en hexadécimal
 */
function rgbToHex(r, g, b) {
    return (
        '#' +
        [r, g, b]
            .map(x => {
                const hex = Math.round(x).toString(16);
                return hex.length === 1 ? '0' + hex : hex;
            })
            .join('')
    );
}

export default client;