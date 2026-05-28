/**
 * Expone Flask (puerto 5000) en Internet para Expo Go con --tunnel (sin misma WiFi).
 * Uso: node scripts/tunnel-backend.js
 * Copia la URL https que imprime → móvil Red → Backend Flask.
 */
const localtunnel = require('localtunnel');

const PORT = Number(process.env.SMARTROOTS_API_PORT || 5000);

(async () => {
  console.log(`\nSmartRoots — túnel público hacia 127.0.0.1:${PORT}`);
  console.log('Asegúrate de tener Flask activo: cd SmartRoots/backend && python app.py\n');

  const tunnel = await localtunnel({ port: PORT });

  const print = () => {
    console.log('══════════════════════════════════════════════════');
    console.log('  Pega en el móvil → Red → Backend Flask:');
    console.log(`  ${tunnel.url}`);
    console.log('══════════════════════════════════════════════════');
    console.log('  Expo (otra terminal): cd mobile && npm run start:tunnel');
    console.log('  Web empaquetada: activada por defecto (no hace falta Vite)\n');
  };

  print();

  tunnel.on('close', () => {
    console.error('\nTúnel cerrado. Vuelve a ejecutar: npm run tunnel:backend\n');
    process.exit(1);
  });
})().catch((err) => {
  console.error('No se pudo abrir el túnel:', err.message || err);
  process.exit(1);
});
