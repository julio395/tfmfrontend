import React, { useState } from 'react';
import { Box, Button, Typography, Paper } from '@mui/material';
import AuditoriaCuestionario from './AuditoriaCuestionario';
import Navbar from './Navbar.js';
import '../styles/UserHome.css';

const UserHome = ({ userData, onLogout }) => {
  const [mostrarCuestionario, setMostrarCuestionario] = useState(false);

  const handleComenzarAuditoria = () => {
    setMostrarCuestionario(true);
  };

  const handleCancelarAuditoria = () => {
    setMostrarCuestionario(false);
  };

  return (
    <div className="user-home">
      <Navbar userData={userData} role="user" onLogout={onLogout} />
      
      <main style={{ padding: '2rem' }}>
        {!mostrarCuestionario ? (
          <Paper sx={{ p: 4, textAlign: 'center' }}>
            <Typography variant="h4" gutterBottom>
              Bienvenido al Sistema de Auditoría
            </Typography>
            <Typography variant="body1" paragraph>
              Este sistema le ayudará a realizar una auditoría completa de sus activos de seguridad.
            </Typography>
            <Button
              variant="contained"
              color="primary"
              size="large"
              onClick={handleComenzarAuditoria}
            >
              Comenzar Auditoría
            </Button>
          </Paper>
        ) : (
          <AuditoriaCuestionario 
            onCancel={handleCancelarAuditoria} 
            userData={userData}
          />
        )}
      </main>
    </div>
  );
};

export default UserHome; 