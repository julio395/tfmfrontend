const admin = require('firebase-admin');
const serviceAccount = require('../BaseDatos/credenciales.json');

// Inicializar Firebase Admin
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

// Middleware para verificar el token JWT
const verifyToken = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split('Bearer ')[1];
    
    if (!token) {
      return res.status(401).json({ error: 'No se proporcionó token de autenticación' });
    }

    const decodedToken = await admin.auth().verifyIdToken(token);
    req.user = decodedToken;
    next();
  } catch (error) {
    console.error('Error al verificar token:', error);
    res.status(401).json({ error: 'Token inválido' });
  }
};

// Middleware para verificar si el usuario es admin
const isAdmin = async (req, res, next) => {
  try {
    const userDoc = await admin.firestore()
      .collection('users')
      .doc(req.user.uid)
      .get();

    if (!userDoc.exists) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    const userData = userDoc.data();
    if (userData.role !== 'admin') {
      return res.status(403).json({ error: 'No tienes permisos de administrador' });
    }

    next();
  } catch (error) {
    console.error('Error al verificar rol de admin:', error);
    res.status(500).json({ error: 'Error al verificar permisos' });
  }
};

module.exports = {
  verifyToken,
  isAdmin
}; 