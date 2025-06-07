import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { account } from '../appwrite/appwrite.js';
import '../styles/Login.css';

const Login = ({ onLogin }) => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const checkSession = async () => {
      try {
        console.log('Verificando sesión existente...');
        const session = await account.getSession('current');
        if (session) {
          console.log('Sesión encontrada:', session);
          const user = await account.get();
          console.log('Usuario actual:', user);
          if (user.labels?.includes('admin')) {
            window.location.href = '/admin';
          } else {
            window.location.href = '/home';
          }
        } else {
          console.log('No se encontró sesión activa');
        }
      } catch (error) {
        console.log('Error al verificar sesión:', error);
      }
    };

    checkSession();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      console.log('Intentando iniciar sesión con:', { email });
      
      // Verificar si ya existe una sesión
      try {
        const existingSession = await account.getSession('current');
        if (existingSession) {
          console.log('Sesión existente encontrada:', existingSession);
          const user = await account.get();
          if (user.labels?.includes('admin')) {
            window.location.href = '/admin';
          } else {
            window.location.href = '/home';
          }
          return;
        }
      } catch (sessionError) {
        console.log('No hay sesión existente, procediendo con el login');
      }

      // Intentar crear la sesión
      console.log('Creando nueva sesión...');
      const session = await account.createEmailSession(email, password);
      console.log('Sesión creada:', session);

      // Obtener datos del usuario
      console.log('Obteniendo datos del usuario...');
      const user = await account.get();
      console.log('Usuario obtenido:', user);

      if (onLogin) {
        console.log('Ejecutando callback onLogin...');
        onLogin(user);
      }

      // Redirigir según el rol usando window.location
      if (user.labels?.includes('admin')) {
        console.log('Redirigiendo a panel de administrador...');
        window.location.href = '/admin';
      } else {
        console.log('Redirigiendo a página principal...');
        window.location.href = '/home';
      }
    } catch (error) {
      console.error('Error en login:', error);
      if (error.code === 401) {
        setError('Credenciales inválidas. Por favor, verifica tu email y contraseña.');
      } else if (error.code === 429) {
        setError('Demasiados intentos. Por favor, espera 30 segundos antes de intentar nuevamente.');
        // Deshabilitar el botón de inicio de sesión por 30 segundos
        setIsLoading(true);
        setTimeout(() => {
          setIsLoading(false);
        }, 30000);
      } else {
        setError(`Error al iniciar sesión: ${error.message}`);
      }
    } finally {
      if (error?.code !== 429) {
        setIsLoading(false);
      }
    }
  };

  return (
    <div className="login-container">
      <div className="login-box">
        <h2>Iniciar Sesión</h2>
        {error && <div className="error-message">{error}</div>}
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Email:</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div className="form-group">
            <label>Contraseña:</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          <button type="submit" disabled={isLoading}>
            {isLoading ? 'Iniciando sesión...' : 'Iniciar Sesión'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default Login; 