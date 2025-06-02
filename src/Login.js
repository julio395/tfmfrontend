import React, { useState } from 'react';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth, db } from './firebase/firebase';
import { doc, getDoc } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      // Iniciar sesión con Firebase
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      
      // Obtener el documento del usuario
      const userDoc = await getDoc(doc(db, 'users', userCredential.user.uid));
      
      if (!userDoc.exists()) {
        setError('No se encontró información del usuario');
        return;
      }

      const userData = userDoc.data();
      
      // Verificar el rol y redirigir
      if (userData.role === 'admin') {
        navigate('/admin', { replace: true });
      } else if (userData.role === 'user') {
        navigate('/home', { replace: true });
      } else {
        setError('Rol de usuario no válido');
        await auth.signOut(); // Cerrar sesión si el rol no es válido
      }
    } catch (err) {
      console.error('Error de login:', err);
      if (err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password') {
        setError('Credenciales inválidas');
      } else {
        setError('Error al iniciar sesión: ' + err.message);
      }
    }
  };

  return (
    <div style={{ 
      display: 'flex', 
      justifyContent: 'center', 
      alignItems: 'center', 
      minHeight: '100vh',
      backgroundColor: '#f5f5f5'
    }}>
      <form onSubmit={handleSubmit} style={{ 
        display: 'flex', 
        flexDirection: 'column', 
        width: 300,
        padding: '2rem',
        backgroundColor: '#fff',
        borderRadius: '8px',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
      }}>
        <h2 style={{ marginBottom: '1.5rem', textAlign: 'center' }}>Iniciar sesión</h2>
        <input
          type="email"
          placeholder="Usuario (email)"
          value={email}
          onChange={e => setEmail(e.target.value)}
          required
          style={{ 
            marginBottom: '1rem',
            padding: '0.5rem',
            border: '1px solid #ddd',
            borderRadius: '4px'
          }}
        />
        <input
          type="password"
          placeholder="Contraseña"
          value={password}
          onChange={e => setPassword(e.target.value)}
          required
          style={{ 
            marginBottom: '1rem',
            padding: '0.5rem',
            border: '1px solid #ddd',
            borderRadius: '4px'
          }}
        />
        <button 
          type="submit"
          style={{
            padding: '0.5rem',
            backgroundColor: '#007bff',
            color: '#fff',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          Entrar
        </button>
        {error && (
          <div style={{ 
            color: '#dc3545', 
            marginTop: '1rem',
            textAlign: 'center',
            fontSize: '0.9rem'
          }}>
            {error}
          </div>
        )}
      </form>
    </div>
  );
};

export default Login; 