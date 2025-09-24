export function generateUniqueID(cmd) {
    return 'CMD-' + Date.now().toString(36) + '-' + Math.floor(Math.random() * 10000).toString(36);
}
