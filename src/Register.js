import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { account, ID } from './appwrite/appwrite.js';

const Register = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [name, setName] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [employees, setEmployees] = useState('');
  const [sector, setSector] = useState('Sector Inmobiliario');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const [lastAttempt, setLastAttempt] = useState(null);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    // Validar que las contraseñas coincidan
    if (password !== confirmPassword) {
      setError('Las contraseñas no coinciden');
      setLoading(false);
      return;
    }

    try {
      console.log('Iniciando proceso de registro...');
      
      // Verificar si ya existe una sesión
      try {
        const session = await account.getSession('current');
        if (session) {
          console.log('Sesión existente encontrada, redirigiendo...');
          window.location.href = '/home';
          return;
        }
      } catch (error) {
        console.log('No hay sesión existente, continuando con el registro');
      }

      // Crear el usuario
      console.log('Creando usuario...');
      const user = await account.create(
        ID.unique(),
        email,
        password,
        name
      );
      console.log('Usuario creado:', user);

      // Esperar 2 segundos antes de continuar
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Actualizar preferencias del usuario
      console.log('Actualizando preferencias del usuario...');
      await account.updatePrefs({
        companyName,
        employees,
        sector,
        role: 'user',  // Aseguramos que el rol sea 'user'
        labels: ['user']  // Añadimos la etiqueta 'user' para permisos
      });
      console.log('Preferencias actualizadas');

      // Esperar 2 segundos antes de intentar crear la sesión
      await new Promise(resolve => setTimeout(resolve, 2000));

      try {
        // Intentar crear la sesión
        console.log('Intentando crear sesión...');
        const session = await account.createEmailSession(email, password);
        console.log('Sesión creada:', session);

        // Obtener datos actualizados del usuario
        const updatedUser = await account.get();
        console.log('Usuario actualizado:', updatedUser);

        if (updatedUser.labels?.includes('admin')) {
          window.location.href = '/admin';
        } else {
          window.location.href = '/home';
        }
      } catch (sessionError) {
        console.error('Error al crear sesión:', sessionError);
        // Si falla la creación de la sesión, redirigir al login
        window.location.href = '/login?message=Registro completado. Por favor, inicia sesión.';
      }
    } catch (error) {
      console.error('Error de registro:', error);
      if (error.code === 429) {
        setError('Demasiados intentos. Por favor, espera 30 segundos antes de intentar nuevamente.');
        // Deshabilitar el botón de registro por 30 segundos
        setLoading(true);
        setTimeout(() => {
          setLoading(false);
        }, 30000);
      } else if (error.code === 401) {
        setError('No tienes permisos para realizar esta acción.');
      } else if (error.code === 409) {
        setError('Este correo electrónico ya está registrado.');
      } else {
        setError(`Error al registrar: ${error.message}`);
      }
    } finally {
      if (error?.code !== 429) {
        setLoading(false);
      }
    }
  };

  return (
    <div style={{ 
      display: 'flex', 
      justifyContent: 'center', 
      alignItems: 'center', 
      minHeight: '100vh',
      backgroundColor: '#f5f5f5',
      padding: '20px'
    }}>
      <div style={{ 
        width: '100%',
        maxWidth: '500px',
        backgroundColor: '#fff',
        borderRadius: '8px',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
        padding: '2rem'
      }}>
        <h2 style={{ 
          marginBottom: '1.5rem', 
          textAlign: 'center',
          color: '#333',
          fontSize: '1.5rem'
        }}>
          Registro
        </h2>
        {error && (
          <div style={{
            backgroundColor: '#fee',
            color: '#c00',
            padding: '10px',
            borderRadius: '4px',
            marginBottom: '1rem',
            textAlign: 'center'
          }}>
            {error}
          </div>
        )}
        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '1rem' }}>
            <input
              type="text"
              placeholder="Nombre"
              value={name}
              onChange={e => setName(e.target.value)}
              required
              disabled={loading}
              style={{ 
                width: '100%',
                padding: '0.75rem',
                border: '1px solid #ddd',
                borderRadius: '4px',
                fontSize: '1rem'
              }}
            />
          </div>
          <div style={{ marginBottom: '1rem' }}>
            <input
              type="email"
              placeholder="Correo electrónico"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              disabled={loading}
              style={{ 
                width: '100%',
                padding: '0.75rem',
                border: '1px solid #ddd',
                borderRadius: '4px',
                fontSize: '1rem'
              }}
            />
          </div>
          <div style={{ marginBottom: '1rem' }}>
            <input
              type="password"
              placeholder="Contraseña"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              disabled={loading}
              style={{ 
                width: '100%',
                padding: '0.75rem',
                border: '1px solid #ddd',
                borderRadius: '4px',
                fontSize: '1rem'
              }}
            />
          </div>
          <div style={{ marginBottom: '1rem' }}>
            <input
              type="password"
              placeholder="Repetir contraseña"
              value={confirmPassword}
              onChange={e => setConfirmPassword(e.target.value)}
              required
              disabled={loading}
              style={{ 
                width: '100%',
                padding: '0.75rem',
                border: '1px solid #ddd',
                borderRadius: '4px',
                fontSize: '1rem'
              }}
            />
          </div>
          <div style={{ marginBottom: '1rem' }}>
            <input
              type="text"
              placeholder="Nombre de la empresa"
              value={companyName}
              onChange={e => setCompanyName(e.target.value)}
              required
              disabled={loading}
              style={{ 
                width: '100%',
                padding: '0.75rem',
                border: '1px solid #ddd',
                borderRadius: '4px',
                fontSize: '1rem'
              }}
            />
          </div>
          <div style={{ marginBottom: '1rem' }}>
            <input
              type="number"
              placeholder="Número de empleados"
              value={employees}
              onChange={e => setEmployees(e.target.value)}
              required
              disabled={loading}
              style={{ 
                width: '100%',
                padding: '0.75rem',
                border: '1px solid #ddd',
                borderRadius: '4px',
                fontSize: '1rem'
              }}
            />
          </div>
          <div style={{ marginBottom: '1.5rem' }}>
            <select
              value={sector}
              onChange={e => setSector(e.target.value)}
              required
              disabled={loading}
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
          <button
            type="submit"
            disabled={loading}
            style={{
              width: '100%',
              padding: '0.75rem',
              backgroundColor: loading ? '#ccc' : '#007bff',
              color: '#fff',
              border: 'none',
              borderRadius: '4px',
              fontSize: '1rem',
              cursor: loading ? 'not-allowed' : 'pointer'
            }}
          >
            {loading ? 'Registrando...' : 'Registrarse'}
          </button>
        </form>
        <div style={{ 
          marginTop: '1rem', 
          textAlign: 'center' 
        }}>
          <Link 
            to="/login" 
            style={{ 
              color: '#007bff',
              textDecoration: 'none'
            }}
          >
            ¿Ya tienes cuenta? Inicia sesión aquí
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Register; 