import React, { useState } from 'react';
import { Box, Button, Typography, Paper } from '@mui/material';
import { RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, Legend } from 'recharts';
import AuditoriaCuestionario from './AuditoriaCuestionario';
import Navbar from './Navbar';
import '../styles/UserHome.css';
import { useNavigate } from 'react-router-dom';
import { account } from '../appwrite/appwrite';

const UserHome = ({ userData, onLogout }) => {
  const [mostrarCuestionario, setMostrarCuestionario] = useState(false);
  const navigate = useNavigate();

  const handleComenzarAuditoria = () => {
    setMostrarCuestionario(true);
  };

  const handleFinalizarAuditoria = () => {
    setMostrarCuestionario(false);
  };

  const handleLogout = async () => {
    try {
      // Primero navegamos al login
      navigate('/login');
      // Luego cerramos la sesión
      await account.deleteSession('current');
      // Finalmente actualizamos el estado
      onLogout();
    } catch (error) {
      console.error('Error al cerrar sesión:', error);
      // Aún así navegamos al login
      navigate('/login');
    }
  };

  // Datos para el gráfico de araña
  const data = [
    { category: 'Equipos Informáticos', minimo: 70, actual: 45, potencial: 90 },
    { category: 'Red e Internet', minimo: 75, actual: 60, potencial: 95 },
    { category: 'Dispositivos de Seguridad Física', minimo: 80, actual: 50, potencial: 85 },
    { category: 'Infraestructura Tecnológica', minimo: 65, actual: 40, potencial: 80 },
    { category: 'Software Empresarial', minimo: 70, actual: 55, potencial: 90 },
    { category: 'Tecnología Financiera', minimo: 85, actual: 65, potencial: 95 },
    { category: 'Seguridad Digital', minimo: 80, actual: 45, potencial: 90 },
    { category: 'Servicios', minimo: 70, actual: 50, potencial: 85 },
    { category: 'Activos Digitales', minimo: 75, actual: 55, potencial: 90 },
  ];

  const renderRadarChart = () => {
    return (
      <div style={{ width: '100%', maxWidth: 800, margin: '0 auto', marginBottom: '2rem' }}>
        <RadarChart
          width={800}
          height={500}
          data={data}
          margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
        >
          <PolarGrid />
          <PolarAngleAxis dataKey="category" />
          <PolarRadiusAxis angle={30} domain={[0, 100]} />
          <Radar
            name="Nivel Mínimo"
            dataKey="minimo"
            stroke="#FFA500"
            fill="none"
            strokeWidth={2}
          />
          <Radar
            name="Nivel Actual"
            dataKey="actual"
            stroke="#1E90FF"
            fill="none"
            strokeWidth={2}
          />
          <Radar
            name="Nivel Potencial"
            dataKey="potencial"
            stroke="#32CD32"
            fill="none"
            strokeWidth={2}
          />
          <Legend />
        </RadarChart>
      </div>
    );
  };

  return (
    <div className="user-home">
      <Navbar userData={userData} role="user" onLogout={handleLogout} />
      
      <main style={{ padding: '2rem' }}>
        <div className="dashboard-container">
          <div className="dashboard-header">
            <h1>Panel de Usuario</h1>
            <p>Bienvenido, {userData.name}</p>
          </div>

          <div className="dashboard-actions">
            <button 
              className="action-button"
              onClick={handleComenzarAuditoria}
            >
              Comenzar Nueva Auditoría
            </button>
          </div>

          {mostrarCuestionario && (
            <div className="cuestionario-container">
              {!mostrarCuestionario ? (
                <Paper sx={{ p: 4, textAlign: 'center' }}>
                  <Typography variant="h4" gutterBottom>
                    Bienvenido al Sistema de Auditoría
                  </Typography>
                  <Typography variant="body1" paragraph>
                    Este sistema le ayudará a realizar una auditoría completa de sus activos de seguridad.
                  </Typography>
                  
                  {renderRadarChart()}

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
                  onCancel={handleFinalizarAuditoria} 
                  userData={userData}
                />
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default UserHome; 