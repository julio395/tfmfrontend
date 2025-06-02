import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './Login';
import Register from './Register';
import UserHome from './components/UserHome';
import AdminHome from './components/AdminHome';
import { auth } from './firebase/firebase';
import { useAuthState } from 'react-firebase-hooks/auth';

function App() {
  const [user, loading] = useAuthState(auth);

  if (loading) {
    return <div>Cargando...</div>;
  }

  return (
    <Router>
      <div className="App">
        <Routes>
          <Route path="/login" element={!user ? <Login /> : <Navigate to="/home" />} />
          <Route path="/register" element={!user ? <Register /> : <Navigate to="/home" />} />
          <Route path="/home" element={user ? <UserHome /> : <Navigate to="/login" />} />
          <Route path="/admin" element={user ? <AdminHome /> : <Navigate to="/login" />} />
          <Route path="/" element={<Navigate to="/login" />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
