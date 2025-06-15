import React from 'react';
import { Box, Paper } from '@mui/material';
import Navbar from './Navbar';
import '../styles/UserHome.css';
import { useNavigate } from 'react-router-dom';
import { account } from '../appwrite/appwrite';
import {
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  Legend,
  ResponsiveContainer
} from 'recharts';

const UserHome = ({ userData, onLogout }) => {
  const navigate = useNavigate();

  // Datos para el gráfico de araña
  const data = [
    { category: 'Equipos informáticos', seguridadMinima: 3, seguridadActual: 2, seguridadObjetivo: 4 },
    { category: 'Red e Internet', seguridadMinima: 4, seguridadActual: 3, seguridadObjetivo: 5 },
    { category: 'Dispositivos de Seguridad Física', seguridadMinima: 4, seguridadActual: 2, seguridadObjetivo: 5 },
    { category: 'Infraestructura Tecnológica', seguridadMinima: 4, seguridadActual: 3, seguridadObjetivo: 5 },
    { category: 'Software Empresarial', seguridadMinima: 3, seguridadActual: 2, seguridadObjetivo: 4 },
    { category: 'Tecnología Financiera', seguridadMinima: 5, seguridadActual: 3, seguridadObjetivo: 5 },
    { category: 'Seguridad Digital', seguridadMinima: 4, seguridadActual: 2, seguridadObjetivo: 5 },
    { category: 'Servicios y Activos Digitales', seguridadMinima: 3, seguridadActual: 2, seguridadObjetivo: 4 }
  ];

  const handleComenzarAuditoria = () => {
    navigate('/auditoria');
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

  return (
    <div className="user-home">
      <Navbar userData={userData} role="user" onLogout={handleLogout} />
      
      <main style={{ padding: '2rem' }}>
        <div className="dashboard-container">
          <div className="dashboard-header">
            <h1>Panel de Usuario</h1>
            <p>Bienvenido, {userData.name}</p>
          </div>

          <Paper elevation={3} sx={{ p: 3, mb: 4, backgroundColor: 'rgba(255, 255, 255, 0.9)' }}>
            <h2 style={{ textAlign: 'center', marginBottom: '2rem' }}>Estado de Seguridad</h2>
            <div style={{ width: '100%', height: 500 }}>
              <ResponsiveContainer>
                <RadarChart cx="50%" cy="50%" outerRadius="80%" data={data}>
                  <PolarGrid />
                  <PolarAngleAxis dataKey="category" />
                  <PolarRadiusAxis angle={30} domain={[0, 5]} />
                  <Radar
                    name="Seguridad Mínima"
                    dataKey="seguridadMinima"
                    stroke="#FFA500"
                    fill="#FFA500"
                    fillOpacity={0}
                  />
                  <Radar
                    name="Seguridad Actual"
                    dataKey="seguridadActual"
                    stroke="#1E90FF"
                    fill="#1E90FF"
                    fillOpacity={0}
                  />
                  <Radar
                    name="Seguridad Objetivo"
                    dataKey="seguridadObjetivo"
                    stroke="#32CD32"
                    fill="#32CD32"
                    fillOpacity={0}
                  />
                  <Legend />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          </Paper>

          <div className="dashboard-actions">
            <button 
              className="action-button"
              onClick={handleComenzarAuditoria}
            >
              Comenzar Auditoría
            </button>
          </div>
        </div>
      </main>
    </div>
  );
};

export default UserHome; 