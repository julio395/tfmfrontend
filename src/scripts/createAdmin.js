const admin = require('firebase-admin');
const serviceAccount = require('../../BaseDatos/credenciales.json');

// Inicializar Firebase Admin
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

async function createAdminUser() {
  try {
    // Crear usuario en Authentication
    const userRecord = await admin.auth().createUser({
      email: 'admin@example.com',
      password: 'admin123',
      emailVerified: true
    });

    // Crear documento en Firestore con rol admin
    await admin.firestore()
      .collection('users')
      .doc(userRecord.uid)
      .set({
        email: 'admin@example.com',
        companyName: 'Admin Company',
        employees: 1,
        sector: 'Sector Inmobiliario',
        responsible: 'Admin User',
        role: 'admin'
      });

    console.log('Usuario administrador creado exitosamente:', userRecord.uid);
  } catch (error) {
    console.error('Error al crear usuario administrador:', error);
  } finally {
    process.exit();
  }
}

createAdminUser(); 