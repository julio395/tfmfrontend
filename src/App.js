import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './components/Login';
import AdminHome from './components/AdminHome';
import UserHome from './components/UserHome';
import { checkSession, account } from './appwrite/appwrite';
import './App.css';

function App() {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkUser = async () => {
      try {
        const session = await checkSession();
        if (session) {
          // Si hay sesión, obtener información del usuario
          const userData = await account.get();
          const isAdmin = userData.labels && userData.labels.includes('admin');
          
          setUser({
            ...userData,
            role: isAdmin ? 'admin' : 'user'
          });
        }
      } catch (error) {
        console.error('Error al verificar sesión:', error);
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    };

    checkUser();
  }, []);

  if (isLoading) {
    return <div className="loading">Cargando...</div>;
  }

  return (
    <Router>
      <div className="App">
        <Routes>
          <Route 
            path="/login" 
            element={!user ? <Login onLogin={setUser} /> : <Navigate to={user.role === 'admin' ? "/admin" : "/home"} />} 
          />
          <Route 
            path="/admin" 
            element={user?.role === 'admin' ? <AdminHome user={user} onLogout={() => setUser(null)} /> : <Navigate to="/login" />} 
          />
          <Route 
            path="/home" 
            element={user?.role === 'user' ? <UserHome user={user} onLogout={() => setUser(null)} /> : <Navigate to="/login" />} 
          />
          <Route 
            path="/" 
            element={<Navigate to={user ? (user.role === 'admin' ? "/admin" : "/home") : "/login"} />} 
          />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
