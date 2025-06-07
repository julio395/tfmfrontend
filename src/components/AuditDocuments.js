import React from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from './Navbar.js';
import '../styles/AuditDocuments.css';

const AuditDocuments = ({ userData, onLogout }) => {
  const navigate = useNavigate();

  return (
    <div className="audit-documents">
      <Navbar userData={userData} role="user" onLogout={onLogout} />
      
      <main style={{ padding: '2rem' }}>
        <div style={{ 
          display: 'flex', 
          alignItems: 'center',
          marginBottom: '2rem',
          position: 'relative'
        }}>
          <button
            onClick={() => navigate('/home')}
            style={{
              padding: '0.75rem 1.5rem',
              backgroundColor: '#6c757d',
              color: '#fff',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              fontSize: '1rem',
              fontWeight: '500',
              transition: 'background-color 0.2s',
              position: 'absolute',
              left: 0
            }}
            onMouseOver={(e) => e.target.style.backgroundColor = '#5a6268'}
            onMouseOut={(e) => e.target.style.backgroundColor = '#6c757d'}
          >
            ← Volver
          </button>
          <h1 style={{ 
            margin: 0,
            width: '100%',
            textAlign: 'center'
          }}>
            Documentos de Auditorías
          </h1>
        </div>

        <div style={{ 
          backgroundColor: '#fff',
          borderRadius: '8px',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
          padding: '2rem'
        }}>
          <p style={{ color: '#666', textAlign: 'center' }}>
            Aquí se mostrarán los documentos de auditorías
          </p>
        </div>
      </main>
    </div>
  );
};

export default AuditDocuments; 