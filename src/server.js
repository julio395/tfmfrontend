import express from 'express';
import cors from 'cors';
import adminRoutes from './routes/adminRoutes.js';
import userRoutes from './routes/userRoutes.js';
import dotenv from 'dotenv';

// Cargar variables de entorno
dotenv.config();

// Verificar variables de entorno requeridas
const requiredEnvVars = ['REACT_APP_APPWRITE_ENDPOINT', 'REACT_APP_APPWRITE_PROJECT_ID'];
const missingEnvVars = requiredEnvVars.filter(envVar => !process.env[envVar]);

if (missingEnvVars.length > 0) {
  console.error('Error: Faltan las siguientes variables de entorno:', missingEnvVars.join(', '));
  process.exit(1);
}

const app = express();

// Configuración de CORS
app.use(cors({
  origin: process.env.NODE_ENV === 'production' 
    ? 'https://appwrite-tfm.julio.coolify.hgccarlos.es' 
    : 'http://localhost:3000',
  credentials: true
}));

app.use(express.json());

// Middleware para logging
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
  next();
});

// Rutas
app.use('/api/admin', adminRoutes);
app.use('/api/user', userRoutes);

// Manejador de errores
app.use((err, req, res, next) => {
  console.error('Error en el servidor:', err);
  res.status(500).json({ error: 'Error interno del servidor' });
});

// Puerto
const PORT = process.env.PORT || 5000;

// Iniciar servidor
const server = app.listen(PORT, () => {
  console.log(`Servidor corriendo en el puerto ${PORT}`);
  console.log('Configuración:', {
    endpoint: process.env.REACT_APP_APPWRITE_ENDPOINT,
    projectId: process.env.REACT_APP_APPWRITE_PROJECT_ID
  });
});

// Manejar señales de terminación
process.on('SIGTERM', () => {
  console.log('Recibida señal SIGTERM. Cerrando servidor...');
  server.close(() => {
    console.log('Servidor cerrado');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('Recibida señal SIGINT. Cerrando servidor...');
  server.close(() => {
    console.log('Servidor cerrado');
    process.exit(0);
  });
}); 