import React from 'react';
import { Box } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import AuditoriaCuestionario from './AuditoriaCuestionario';
import Navbar from './Navbar';

const AuditoriaPage = ({ userData, onLogout }) => {
  const navigate = useNavigate();

  return (
    <div className="auditoria-page">
      <Navbar userData={userData} role="user" onLogout={onLogout} />
      <main style={{ padding: '2rem' }}>
        <div className="auditoria-container">
          <Box sx={{ p: 3 }}>
            <AuditoriaCuestionario 
              userData={userData}
            />
          </Box>
        </div>
      </main>
    </div>
  );
};

export default AuditoriaPage; 