import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { account } from './appwrite/appwrite.js';
import Login from './Login.js';
import Register from './Register.js';
import UserHome from './components/UserHome.js';
import AdminHome from './components/AdminHome.js';
import AuditDocuments from './components/AuditDocuments.js';
import './App.css';

function App() {
  const [userData, setUserData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  const checkUser = async () => {
    try {
      const session = await account.getSession('current');
      if (session) {
        const user = await account.get();
        const isAdmin = user.labels.includes('admin');
        setUserData({ ...user, role: isAdmin ? 'admin' : 'user' });
      }
    } catch (error) {
      console.log('No hay sesión activa');
      setUserData(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    checkUser();
  }, []);

  const handleLogin = async (user) => {
    const isAdmin = user.labels.includes('admin');
    setUserData({ ...user, role: isAdmin ? 'admin' : 'user' });
  };

  const handleLogout = async () => {
    try {
      await account.deleteSession('current');
      setUserData(null);
    } catch (error) {
      console.error('Error al cerrar sesión:', error);
    }
  };

  if (isLoading) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh',
        fontSize: '1.2rem',
        color: '#666'
      }}>
        Cargando...
      </div>
    );
  }

  return (
    <Router>
      <Routes>
        <Route 
          path="/login" 
          element={
            userData ? (
              <Navigate to={userData.role === 'admin' ? '/admin' : '/home'} replace />
            ) : (
              <Login onLogin={handleLogin} />
            )
          } 
        />
        <Route 
          path="/register" 
          element={
            userData ? (
              <Navigate to={userData.role === 'admin' ? '/admin' : '/home'} replace />
            ) : (
              <Register />
            )
          } 
        />
        <Route 
          path="/home" 
          element={
            userData ? (
              userData.role === 'admin' ? (
                <Navigate to="/admin" replace />
              ) : (
                <UserHome userData={userData} onLogout={handleLogout} />
              )
            ) : (
              <Navigate to="/login" replace />
            )
          } 
        />
        <Route 
          path="/admin" 
          element={
            userData ? (
              userData.role === 'admin' ? (
                <AdminHome userData={userData} onLogout={handleLogout} />
              ) : (
                <Navigate to="/home" replace />
              )
            ) : (
              <Navigate to="/login" replace />
            )
          } 
        />
        <Route 
          path="/audits" 
          element={
            userData ? (
              userData.role === 'admin' ? (
                <Navigate to="/admin" replace />
              ) : (
                <AuditDocuments userData={userData} onLogout={handleLogout} />
              )
            ) : (
              <Navigate to="/login" replace />
            )
          } 
        />
        <Route path="/" element={<Navigate to="/login" replace />} />
      </Routes>
    </Router>
  );
}

export default App;
