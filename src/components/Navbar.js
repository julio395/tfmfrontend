import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const Navbar = ({ userData, role, onLogout }) => {
  const [showProfile, setShowProfile] = useState(false);
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await onLogout();
      navigate('/login', { replace: true });
    } catch (error) {
      console.error('Error al cerrar sesión:', error);
      navigate('/login', { replace: true });
    }
  };

  return (
    <nav style={{
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: '1rem 2rem',
      backgroundColor: '#fff',
      boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
      position: 'sticky',
      top: 0,
      zIndex: 1000
    }}>
      <div style={{ display: 'flex', gap: '1rem' }}>
        {role === 'user' ? (
          <>
            <button 
              onClick={() => navigate('/home')}
              style={{
                background: 'none',
                border: 'none',
                fontSize: '1rem',
                cursor: 'pointer',
                color: '#333',
                fontWeight: '500',
                padding: '0.5rem 1rem',
                borderRadius: '4px',
                transition: 'background-color 0.2s'
              }}
              onMouseOver={(e) => e.target.style.backgroundColor = '#f0f0f0'}
              onMouseOut={(e) => e.target.style.backgroundColor = 'transparent'}
            >
              Inicio
            </button>
            <button 
              onClick={() => navigate('/auditorias')}
              style={{
                background: 'none',
                border: 'none',
                fontSize: '1rem',
                cursor: 'pointer',
                color: '#333',
                fontWeight: '500',
                padding: '0.5rem 1rem',
                borderRadius: '4px',
                transition: 'background-color 0.2s'
              }}
              onMouseOver={(e) => e.target.style.backgroundColor = '#f0f0f0'}
              onMouseOut={(e) => e.target.style.backgroundColor = 'transparent'}
            >
              Documentos de Auditorías
            </button>
          </>
        ) : (
          <button 
            onClick={() => navigate('/admin')}
            style={{
              background: 'none',
              border: 'none',
              fontSize: '1rem',
              cursor: 'pointer',
              color: '#333',
              fontWeight: '500',
              padding: '0.5rem 1rem',
              borderRadius: '4px',
              transition: 'background-color 0.2s'
            }}
            onMouseOver={(e) => e.target.style.backgroundColor = '#f0f0f0'}
            onMouseOut={(e) => e.target.style.backgroundColor = 'transparent'}
          >
            Inicio
          </button>
        )}
      </div>

      <div style={{ position: 'relative' }}>
        <button
          onClick={() => setShowProfile(!showProfile)}
          style={{
            background: 'none',
            border: '1px solid #ddd',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            padding: '0.5rem 1rem',
            borderRadius: '4px',
            color: '#333',
            fontWeight: '500',
            transition: 'all 0.2s'
          }}
          onMouseOver={(e) => e.target.style.backgroundColor = '#f0f0f0'}
          onMouseOut={(e) => e.target.style.backgroundColor = 'transparent'}
        >
          <span>{userData?.name || 'Usuario'}</span>
          <span style={{ fontSize: '0.8rem' }}>▼</span>
        </button>

        {showProfile && (
          <div style={{
            position: 'absolute',
            right: 0,
            top: '100%',
            backgroundColor: '#fff',
            boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
            borderRadius: '4px',
            padding: '1rem',
            minWidth: '200px',
            marginTop: '0.5rem',
            border: '1px solid #ddd'
          }}>
            <div style={{ marginBottom: '1rem', color: '#333' }}>
              <p style={{ margin: '0' }}><strong>Email:</strong> {userData?.email}</p>
            </div>
            <button
              onClick={handleLogout}
              style={{
                width: '100%',
                padding: '0.75rem',
                backgroundColor: '#dc3545',
                color: '#fff',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontWeight: '500',
                transition: 'background-color 0.2s'
              }}
              onMouseOver={(e) => e.target.style.backgroundColor = '#c82333'}
              onMouseOut={(e) => e.target.style.backgroundColor = '#dc3545'}
            >
              Cerrar Sesión
            </button>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar; 