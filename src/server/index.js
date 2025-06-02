const express = require('express');
const cors = require('cors');
const admin = require('firebase-admin');
const serviceAccount = require('../../BaseDatos/credenciales.json');

// Inicializar Firebase Admin
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const app = express();

// Middleware
app.use(cors({
  origin: 'http://localhost:3000', // Ajusta esto según tu URL de frontend
  credentials: true
}));
app.use(express.json());

// Endpoint para validar tokens
app.post('/api/auth/validate', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Token no proporcionado' });
    }

    const token = authHeader.split('Bearer ')[1];
    
    try {
      const decodedToken = await admin.auth().verifyIdToken(token);
      
      // Verificar si el usuario es admin
      const userDoc = await admin.firestore()
        .collection('users')
        .doc(decodedToken.uid)
        .get();

      if (!userDoc.exists) {
        return res.status(404).json({ error: 'Usuario no encontrado' });
      }

      const userData = userDoc.data();
      if (userData.role !== 'admin') {
        return res.status(403).json({ error: 'No tienes permisos de administrador' });
      }

      res.json({ 
        valid: true, 
        user: {
          uid: decodedToken.uid,
          email: decodedToken.email,
          role: userData.role
        }
      });
    } catch (error) {
      console.error('Error al verificar token:', error);
      return res.status(401).json({ error: 'Token inválido o expirado' });
    }
  } catch (error) {
    console.error('Error en la validación:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Servidor corriendo en el puerto ${PORT}`);
}); 