try {
    require('pngjs');
    console.log('pngjs instalado');
} catch (e) {
    console.log('pngjs NAO instalado: ' + e.message);
}
