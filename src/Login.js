import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { account } from './appwrite/appwrite.js';
import './styles/Login.css';

const Login = ({ onLogin }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const checkSession = async () => {
      try {
        const session = await account.getSession('current');
        if (session) {
          const user = await account.get();
          const isAdmin = user.labels.includes('admin');
          navigate(isAdmin ? '/admin' : '/home', { replace: true });
        }
      } catch (error) {
        console.log('No hay sesión activa');
      }
    };

    checkSession();
  }, [navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const session = await account.createEmailSession(email, password);
      console.log('Sesión creada:', session);

      const user = await account.get();
      console.log('Usuario obtenido:', user);

      const isAdmin = user.labels.includes('admin');
      console.log('¿Es admin?:', isAdmin);

      if (onLogin) {
        await onLogin(user);
      }

      navigate(isAdmin ? '/admin' : '/home', { replace: true });
    } catch (error) {
      console.error('Error en login:', error);
      if (error.code === 401) {
        setError('Credenciales inválidas');
      } else if (error.code === 429) {
        setError('Demasiados intentos. Por favor, espera un momento');
      } else {
        setError('Error al iniciar sesión. Por favor, intenta de nuevo');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-box">
        <h1>Iniciar Sesión</h1>
        {error && <div className="error-message">{error}</div>}
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="email">Email</label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={isLoading}
            />
          </div>
          <div className="form-group">
            <label htmlFor="password">Contraseña</label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              disabled={isLoading}
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