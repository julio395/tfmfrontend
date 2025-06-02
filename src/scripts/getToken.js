const admin = require('firebase-admin');
const serviceAccount = require('../../BaseDatos/credenciales.json');

// Inicializar Firebase Admin
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

async function getAdminToken() {
  try {
    // Obtener el usuario admin por email
    const userRecord = await admin.auth().getUserByEmail('admin@example.com');
    
    // Crear un token personalizado
    const token = await admin.auth().createCustomToken(userRecord.uid);
    
    console.log("\nTOKEN JWT:");
    console.log("----------------------------------------");
    console.log(token);
    console.log("----------------------------------------");
    console.log("\nCopia este token y úsalo en el header de tus peticiones:");
    console.log("Authorization: Bearer <token>");
  } catch (error) {
    console.error('Error al obtener el token:', error.message);
  } finally {
    process.exit();
  }
}

getAdminToken(); 