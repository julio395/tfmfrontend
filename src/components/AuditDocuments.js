import React from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from './Navbar.js';
import '../styles/AuditDocuments.css';

const AuditDocuments = ({ userData, onLogout }) => {
  const navigate = useNavigate();

  return (
    <div className="audit-documents">
      <Navbar userData={userData} role="user" onLogout={onLogout} />
      
      <main>
        <div className="audit-header">
          <button
            onClick={() => navigate('/user')}
            className="volver-button"
          >
            ← Volver
          </button>
          <h1 className="audit-title">
            Documentos de Auditorías
          </h1>
        </div>

        <div className="audit-content">
          <p className="audit-message">
            Aquí se mostrarán los documentos de auditorías
          </p>
        </div>
      </main>
    </div>
  );
};

export default AuditDocuments; 