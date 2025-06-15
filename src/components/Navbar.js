import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { logoutUser, getCurrentUser } from '../appwrite/appwrite';
import '../styles/Navbar.css';

const Navbar = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [showDropdown, setShowDropdown] = useState(false);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const userData = await getCurrentUser();
        setUser(userData);
      } catch (error) {
        console.error('Error al obtener el usuario:', error);
      }
    };

    fetchUser();
  }, []);

  const handleLogout = async (e) => {
    e.preventDefault();
    try {
      await logoutUser();
    } catch (error) {
      console.error('Error al cerrar sesión:', error);
    } finally {
      // Limpiar el estado local y redirigir independientemente del resultado
      setUser(null);
      setShowDropdown(false);
      // Forzar la redirección a login
      window.location.href = '/login';
    }
  };

  return (
    <nav className="navbar">
      <div className="navbar-brand">
        <h1>TFM</h1>
      </div>
      <div className="user-menu">
        <button 
          className="user-button"
          onClick={() => setShowDropdown(!showDropdown)}
        >
          {user?.name || 'Usuario'}
          <span className={`dropdown-arrow ${showDropdown ? 'up' : 'down'}`}>▼</span>
        </button>
        {showDropdown && (
          <div className="dropdown-menu">
            <div className="user-info">
              <p><strong>Nombre:</strong> {user?.name}</p>
              <p><strong>Email:</strong> {user?.email}</p>
            </div>
            <button className="logout-button" onClick={handleLogout}>
              Cerrar Sesión
            </button>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar; 