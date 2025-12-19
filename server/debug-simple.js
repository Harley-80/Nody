
console.log('=== 🚨 DIAGNOSTIC DÉMARRAGE ===\n');

async function test() {
    // 1. Test config
    console.log('1. 📋 Test config/env.js...');
    try {
        const config = await import('./config/env.js');
        console.log('   ✅ Chargé');
        console.log('   📍 mongoUri:', config.default.mongoUri ? '✅ Définie' : '❌ Indéfinie');
        if (config.default.mongoUri) {
            console.log('   🔗 URI (début):', config.default.mongoUri.substring(0, 60) + '...');
        }
    } catch (error) {
        console.error('   ❌ Erreur:', error.message);
        if (error.message.includes('emitNotification')) {
            console.error('   💡 Problème probable avec emitNotification import');
        }
    }

    // 2. Test websocketService
    console.log('\n2. 📡 Test websocketService.js...');
    try {
        const ws = await import('./services/websocketService.js');
        console.log('   ✅ Chargé');
        console.log('   🔌 emitNotification existe?', 'emitNotification' in ws ? '✅ OUI' : '❌ NON');
        console.log('   📦 Exports:', Object.keys(ws).join(', '));
    } catch (error) {
        console.error('   ❌ Erreur:', error.message);
        console.error('   📍 Fichier probablement corrompu');
    }

    // 3. Test moderateurController
    console.log('\n3. 🛡️ Test moderateurController.js...');
    try {
        await import('./controllers/moderateurController.js');
        console.log('   ✅ Chargé sans erreur');
    } catch (error) {
        console.error('   ❌ Erreur:', error.message);
        console.error('   🔍 Première ligne stack:', error.stack.split('\n')[1]);
    }

    // 4. Test database
    console.log('\n4. 🗄️ Test database.js...');
    try {
        const db = await import('./config/database.js');
        console.log('   ✅ Chargé');
    } catch (error) {
        console.error('   ❌ Erreur:', error.message);
    }

    console.log('\n=== ✅ DIAGNOSTIC TERMINÉ ===');
    process.exit(0);
}

test().catch(console.error);