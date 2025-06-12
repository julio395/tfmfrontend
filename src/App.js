import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { account } from './appwrite/appwrite';
import Login from './components/Login';
import Register from './Register.js';
import UserHome from './components/UserHome.js';
import AdminHome from './components/AdminHome';
import AuditDocuments from './components/AuditDocuments.js';
import './App.css';

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const checkUser = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Intentar obtener la sesión actual
      const session = await account.getSession('current');
      if (session) {
        // Si hay sesión, obtener información del usuario
        const userData = await account.get();
        setUser(userData);
      }
    } catch (error) {
      console.error('Error al verificar sesión:', error);
      // No establecer error para errores de sesión no encontrada
      if (error.code !== 404) {
        setError('Error al verificar la sesión. Por favor, intenta iniciar sesión nuevamente.');
      }
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    checkUser();
  }, []);

  const handleLogout = async () => {
    try {
      await account.deleteSession('current');
      setUser(null);
    } catch (error) {
      console.error('Error al cerrar sesión:', error);
      setError('Error al cerrar sesión. Por favor, intenta nuevamente.');
    }
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Cargando...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="error-container">
        <p>{error}</p>
        <button onClick={() => window.location.reload()}>Reintentar</button>
      </div>
    );
  }

  return (
    <Router>
      <div className="App">
        <Routes>
          <Route 
            path="/" 
            element={user ? <Navigate to="/admin" replace /> : <Login />} 
          />
          <Route 
            path="/register" 
            element={
              user ? (
                <Navigate to={user.role === 'admin' ? '/admin' : '/home'} replace />
              ) : (
                <Register />
              )
            } 
          />
          <Route 
            path="/home" 
            element={
              user ? (
                user.role === 'admin' ? (
                  <Navigate to="/admin" replace />
                ) : (
                  <UserHome userData={user} onLogout={handleLogout} />
                )
              ) : (
                <Navigate to="/login" replace />
              )
            } 
          />
          <Route 
            path="/admin" 
            element={
              user ? (
                user.role === 'admin' ? (
                  <AdminHome user={user} onLogout={handleLogout} />
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
              user ? (
                user.role === 'admin' ? (
                  <Navigate to="/admin" replace />
                ) : (
                  <AuditDocuments userData={user} onLogout={handleLogout} />
                )
              ) : (
                <Navigate to="/login" replace />
              )
            } 
          />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
