import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { account, ID } from './appwrite/appwrite.js';
import './styles/Login.css';

const Register = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [name, setName] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [employees, setEmployees] = useState('');
  const [sector, setSector] = useState('Sector Inmobiliario');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    // Validar que las contraseñas coincidan
    if (password !== confirmPassword) {
      setError('Las contraseñas no coinciden');
      setLoading(false);
      return;
    }

    try {
      // Crear el usuario en Appwrite
      const user = await account.create(
        ID.unique(),
        email,
        password,
        name
      );

      // Iniciar sesión automáticamente
      await account.createEmailSession(email, password);

      // Esperar un momento para asegurar que la sesión esté establecida
      await new Promise(resolve => setTimeout(resolve, 1000));

      try {
        // Actualizar las preferencias del usuario
        await account.updatePrefs({
          companyName,
          employees,
          sector,
          role: 'user'
        });
      } catch (prefsError) {
        console.error('Error al actualizar preferencias:', prefsError);
        // Si falla la actualización de preferencias, redirigimos al login
        navigate('/login?message=Registro completado. Por favor, inicia sesión.');
        return;
      }

      // Redirigir al usuario a la página principal
      navigate('/home', { replace: true });
    } catch (error) {
      console.error('Error en registro:', error);
      if (error.code === 409) {
        setError('Este email ya está registrado');
      } else if (error.code === 400) {
        setError('Datos de registro inválidos');
      } else {
        // Si el usuario se creó pero hay un error al iniciar sesión, redirigimos al login
        navigate('/login?message=Registro completado. Por favor, inicia sesión.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-box">
        <h2>Registro</h2>
        {error && <div className="error-message">{error}</div>}
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Nombre:</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>
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
          <div className="form-group">
            <label>Confirmar Contraseña:</label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
            />
          </div>
          <div className="form-group">
            <label>Nombre de la Empresa:</label>
            <input
              type="text"
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
              required
            />
          </div>
          <div className="form-group">
            <label>Número de Empleados:</label>
            <input
              type="number"
              value={employees}
              onChange={(e) => setEmployees(e.target.value)}
              required
            />
          </div>
          <div className="form-group">
            <label>Sector:</label>
            <select
              value={sector}
              onChange={(e) => setSector(e.target.value)}
              required
              style={{
                width: '100%',
                padding: '0.75rem',
                border: '1px solid #ddd',
                borderRadius: '4px',
                fontSize: '1rem',
                backgroundColor: '#fff'
              }}
            >
              <option value="Sector Inmobiliario">Sector Inmobiliario</option>
            </select>
          </div>
          <button type="submit" disabled={loading}>
            {loading ? 'Registrando...' : 'Registrarse'}
          </button>
        </form>
        <p className="register-link">
          ¿Ya tienes una cuenta? <Link to="/login">Inicia sesión aquí</Link>
        </p>
      </div>
    </div>
  );
};

export default Register; 