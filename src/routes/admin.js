const express = require('express');
const router = express.Router();
const admin = require('firebase-admin');
const { verifyToken, isAdmin } = require('../middleware/auth');

// Aplicar middleware de autenticación y verificación de admin a todas las rutas
router.use(verifyToken, isAdmin);

// Obtener todos los usuarios
router.get('/users', async (req, res) => {
  try {
    const usersSnapshot = await admin.firestore().collection('users').get();
    const users = [];
    usersSnapshot.forEach(doc => {
      users.push({ id: doc.id, ...doc.data() });
    });
    res.json(users);
  } catch (error) {
    console.error('Error al obtener usuarios:', error);
    res.status(500).json({ error: 'Error al obtener usuarios' });
  }
});

// Obtener un usuario específico
router.get('/users/:userId', async (req, res) => {
  try {
    const userDoc = await admin.firestore()
      .collection('users')
      .doc(req.params.userId)
      .get();

    if (!userDoc.exists) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    res.json({ id: userDoc.id, ...userDoc.data() });
  } catch (error) {
    console.error('Error al obtener usuario:', error);
    res.status(500).json({ error: 'Error al obtener usuario' });
  }
});

// Crear un nuevo usuario
router.post('/users', async (req, res) => {
  try {
    const { email, password, ...userData } = req.body;
    
    // Crear usuario en Authentication
    const userRecord = await admin.auth().createUser({
      email,
      password
    });

    // Crear documento en Firestore
    await admin.firestore()
      .collection('users')
      .doc(userRecord.uid)
      .set({
        ...userData,
        email,
        role: 'user' // Por defecto, los usuarios nuevos son 'user'
      });

    res.status(201).json({ id: userRecord.uid, email, ...userData });
  } catch (error) {
    console.error('Error al crear usuario:', error);
    res.status(500).json({ error: 'Error al crear usuario' });
  }
});

// Actualizar un usuario
router.put('/users/:userId', async (req, res) => {
  try {
    const { email, password, ...userData } = req.body;
    const userId = req.params.userId;

    // Actualizar datos en Authentication si se proporciona email o password
    if (email || password) {
      const updateData = {};
      if (email) updateData.email = email;
      if (password) updateData.password = password;
      await admin.auth().updateUser(userId, updateData);
    }

    // Actualizar documento en Firestore
    await admin.firestore()
      .collection('users')
      .doc(userId)
      .update(userData);

    res.json({ id: userId, ...userData });
  } catch (error) {
    console.error('Error al actualizar usuario:', error);
    res.status(500).json({ error: 'Error al actualizar usuario' });
  }
});

// Eliminar un usuario
router.delete('/users/:userId', async (req, res) => {
  try {
    const userId = req.params.userId;

    // Eliminar usuario de Authentication
    await admin.auth().deleteUser(userId);

    // Eliminar documento de Firestore
    await admin.firestore()
      .collection('users')
      .doc(userId)
      .delete();

    res.json({ message: 'Usuario eliminado correctamente' });
  } catch (error) {
    console.error('Error al eliminar usuario:', error);
    res.status(500).json({ error: 'Error al eliminar usuario' });
  }
});

module.exports = router; 