import { Client, Account } from 'appwrite';
import dotenv from 'dotenv';
dotenv.config();

const client = new Client();
client
  .setEndpoint(process.env.REACT_APP_APPWRITE_ENDPOINT)
  .setProject(process.env.REACT_APP_APPWRITE_PROJECT_ID);

const account = new Account(client);

// Middleware para verificar el token de sesión de Appwrite
export const verifyToken = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split('Bearer ')[1];
    if (!token) {
      return res.status(401).json({ error: 'No se proporcionó token de autenticación' });
    }

    // Validar la sesión con Appwrite
    const session = await account.getSession(token);
    req.user = session.userId;
    next();
  } catch (error) {
    console.error('Error al verificar token:', error.message);
    res.status(401).json({ error: 'Token inválido o sesión expirada' });
  }
};

// Middleware para verificar si el usuario es admin
export const isAdmin = async (req, res, next) => {
  try {
    // Obtener datos del usuario desde Appwrite
    const user = await account.get();
    if (user.prefs?.role === 'admin') {
      next();
    } else {
      res.status(403).json({ error: 'No tienes permisos de administrador' });
    }
  } catch (error) {
    console.error('Error al verificar rol de admin:', error.message);
    res.status(500).json({ error: 'Error al verificar permisos' });
  }
}; 