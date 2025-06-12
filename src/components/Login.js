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
        const session = await account.getSession('current');
        if (session) {
          const user = await account.get();
          if (user.labels?.includes('admin')) {
            navigate('/admin', { replace: true });
          } else {
            navigate('/home', { replace: true });
          }
        }
      } catch (error) {
        console.log('No hay sesión activa');
      }
    };

    checkSession();
  }, [navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      // Verificar si ya existe una sesión
      try {
        const existingSession = await account.getSession('current');
        if (existingSession) {
          const user = await account.get();
          if (user.labels?.includes('admin')) {
            navigate('/admin', { replace: true });
          } else {
            navigate('/home', { replace: true });
          }
          return;
        }
      } catch (sessionError) {
        console.log('No hay sesión existente, procediendo con el login');
      }

      // Intentar crear la sesión
      const session = await account.createEmailSession(email, password);
      const user = await account.get();

      if (onLogin) {
        onLogin(user);
      }

      // Redirigir según el rol
      if (user.labels?.includes('admin')) {
        navigate('/admin', { replace: true });
      } else {
        navigate('/home', { replace: true });
      }
    } catch (error) {
      console.error('Error en login:', error);
      if (error.code === 401) {
        setError('Credenciales inválidas. Por favor, verifica tu email y contraseña.');
      } else if (error.code === 429) {
        setError('Demasiados intentos. Por favor, espera 30 segundos antes de intentar nuevamente.');
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
        <p className="register-link">
          ¿No tienes una cuenta? <a href="/register">Regístrate aquí</a>
        </p>
      </div>
    </div>
  );
};

export default Login; 