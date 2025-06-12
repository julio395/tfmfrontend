import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './components/Login';
import Register from './components/Register';
import AdminHome from './components/AdminHome';
import UserHome from './components/UserHome';
import { account } from './appwrite/appwrite';
import './App.css';

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkSession = async () => {
      try {
        const session = await account.getSession('current');
        if (session) {
          const userData = await account.get();
          const isAdmin = userData.labels && userData.labels.includes('admin');
          setUser({
            ...userData,
            role: isAdmin ? 'admin' : 'user'
          });
        }
      } catch (error) {
        console.log('No hay sesión activa');
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    checkSession();
  }, []);

  if (loading) {
    return <div className="loading">Cargando...</div>;
  }

  return (
    <Router>
      <div className="App">
        <Routes>
          <Route path="/login" element={!user ? <Login setUser={setUser} /> : <Navigate to={user.role === 'admin' ? '/admin' : '/home'} />} />
          <Route path="/register" element={!user ? <Register setUser={setUser} /> : <Navigate to={user.role === 'admin' ? '/admin' : '/home'} />} />
          <Route path="/admin" element={user && user.role === 'admin' ? <AdminHome user={user} setUser={setUser} /> : <Navigate to="/login" />} />
          <Route path="/home" element={user && user.role === 'user' ? <UserHome user={user} setUser={setUser} /> : <Navigate to="/login" />} />
          <Route path="/" element={<Navigate to="/login" />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
