import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { account, getUsers, fetchMongoDBData, MONGODB_API_URL } from '../appwrite/appwrite.js';
import Navbar from './Navbar.js';
import '../styles/AdminHome.css';

const AdminHome = ({ userData, onLogout }) => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState(null);
  const [users, setUsers] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [modalData, setModalData] = useState({});
  const [modalType, setModalType] = useState('create');
  const [activeView, setActiveView] = useState('users');
  const [activeCollection, setActiveCollection] = useState('Activos');
  const [dbData, setDbData] = useState([]);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 50,
    total: 0,
    totalPages: 0
  });

  const collections = ['Activos', 'Amenazas', 'Vulnerabilidades', 'Salvaguardas', 'Relaciones'];

  const checkBackendConnection = async () => {
    try {
      const baseUrl = MONGODB_API_URL.replace('/api/tfm', '');
      const response = await fetch(`${baseUrl}/api/mongodb-status`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`Error en la respuesta: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      if (data.status !== 'connected') {
        throw new Error('MongoDB no está conectado');
      }

      return true;
    } catch (error) {
      console.error('Error al conectar con el backend:', error);
      return false;
    }
  };

  const checkMongoDBStatus = async () => {
    try {
      const baseUrl = MONGODB_API_URL.replace('/api/tfm', '');
      const response = await fetch(`${baseUrl}/api/mongodb-status`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`Error en la respuesta: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      return data.status === 'connected';
    } catch (error) {
      console.error('Error al verificar estado de MongoDB:', error);
      return false;
    }
  };

  const fetchCollectionData = async (page = 1) => {
    try {
      setIsLoading(true);
      setErrorMessage(null);
      
      const isBackendConnected = await checkBackendConnection();
      if (!isBackendConnected) {
        throw new Error('No se pudo conectar con el backend');
      }

      const isMongoDBConnected = await checkMongoDBStatus();
      if (!isMongoDBConnected) {
        throw new Error('No se pudo conectar con MongoDB');
      }

      const url = `${MONGODB_API_URL}/${activeCollection.toLowerCase()}?page=${page}&limit=50`;
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Accept': 'application/json'
        }
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Error al obtener datos de la colección: ${response.status} ${response.statusText}`);
      }

      const result = await response.json();
      
      if (!result.data) {
        throw new Error('Formato de respuesta inválido: no se encontró el campo data');
      }
      
      setDbData(result.data);
      setPagination(result.pagination);
    } catch (error) {
      console.error('Error al cargar datos:', error);
      setErrorMessage(`Error al cargar los datos: ${error.message}`);
      setDbData([]);
      setPagination({
        page: 1,
        limit: 50,
        total: 0,
        totalPages: 0
      });
    } finally {
      setIsLoading(false);
    }
  };

  const checkAuth = async () => {
    try {
      setIsLoading(true);
      setErrorMessage(null);
      
      const session = await account.getSession('current');
      if (!session) {
        throw new Error('No hay sesión activa');
      }

      const currentUser = await account.get();
      console.log('Usuario actual en checkAuth:', currentUser);

      if (!currentUser.labels?.includes('admin')) {
        throw new Error('No tienes permisos de administrador');
      }

      await fetchUsers();
    } catch (error) {
      console.error('Error en checkAuth:', error);
      setErrorMessage(error.message || 'Error al verificar autenticación');
      navigate('/login', { replace: true });
    } finally {
      setIsLoading(false);
    }
  };

  const fetchUsers = async () => {
    try {
      setIsLoading(true);
      setErrorMessage(null);
      
      const session = await account.getSession('current');
      if (!session) {
        throw new Error('No hay sesión activa');
      }

      const currentUser = await account.get();
      if (!currentUser.labels?.includes('admin')) {
        throw new Error('No tienes permisos de administrador');
      }

      const users = await getUsers();
      console.log('Usuarios obtenidos:', users);
      
      if (users && users.length > 0) {
        setUsers(users);
      } else {
        console.log('No se encontraron usuarios');
        setUsers([]);
        setErrorMessage('No se encontraron usuarios en el sistema');
      }
    } catch (error) {
      console.error('Error en fetchUsers:', error);
      setErrorMessage(error.message || 'Error al obtener usuarios. Por favor, intenta de nuevo.');
      setUsers([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    checkAuth();
  }, []);

  useEffect(() => {
    if (activeView === 'databases') {
      fetchCollectionData(pagination.page);
    }
  }, [activeView, activeCollection, pagination.page]);

  const handleUserDelete = async (userId) => {
    if (window.confirm('¿Estás seguro de que deseas eliminar este usuario?')) {
      try {
        await account.delete(userId);
        await fetchUsers();
      } catch (error) {
        setErrorMessage('Error al eliminar usuario');
      }
    }
  };

  const handleUserUpdate = async (userId, data) => {
    try {
      await account.update(userId, data);
      await fetchUsers();
    } catch (error) {
      setErrorMessage('Error al actualizar usuario');
    }
  };

  const handleDBItemDelete = async (itemId) => {
    if (window.confirm('¿Estás seguro de que deseas eliminar este elemento?')) {
      try {
        await fetchMongoDBData(activeCollection.toLowerCase(), itemId);
        await fetchCollectionData();
      } catch (error) {
        setErrorMessage('Error al eliminar elemento');
      }
    }
  };

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= pagination.totalPages) {
      fetchCollectionData(newPage);
    }
  };

  const renderValue = (value) => {
    if (value === null || value === undefined) {
      return '';
    }
    if (typeof value === 'object') {
      return JSON.stringify(value);
    }
    return String(value);
  };

  const renderUsersView = () => (
    <div>
      <h2>Gestión de Usuarios (Appwrite)</h2>
      {errorMessage && (
        <div className="error-message">
          {errorMessage}
        </div>
      )}
      {isLoading ? (
        <div className="loading">Cargando usuarios...</div>
      ) : (
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Email</th>
                <th>Nombre</th>
                <th>Rol</th>
                <th>Estado</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {users.length > 0 ? (
                users.map(user => (
                  <tr key={user.$id}>
                    <td>{user.email}</td>
                    <td>{user.name || 'Sin nombre'}</td>
                    <td>{user.labels?.includes('admin') ? 'Admin' : 'Usuario'}</td>
                    <td>{user.status ? 'Activo' : 'Inactivo'}</td>
                    <td>
                      <button
                        onClick={() => {
                          setModalData(user);
                          setModalType('update');
                          setShowModal(true);
                        }}
                        className="btn-edit"
                      >
                        Editar
                      </button>
                      <button
                        onClick={() => handleUserDelete(user.$id)}
                        className="btn-delete"
                      >
                        Eliminar
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="5" className="no-data">
                    No hay usuarios registrados
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );

  const renderDatabasesView = () => (
    <div>
      <h2>Gestión de Bases de Datos (MongoDB)</h2>
      
      <div className="collection-selector">
        {collections.map(collection => (
          <button
            key={collection}
            className={activeCollection === collection ? 'active' : ''}
            onClick={() => {
              setActiveCollection(collection);
              setPagination(prev => ({ ...prev, page: 1 }));
            }}
          >
            {collection}
          </button>
        ))}
      </div>

      <div className="table-container">
        <table>
          <thead>
            <tr>
              {dbData.length > 0 && Object.keys(dbData[0])
                .filter(key => key !== '_id')
                .map(key => (
                  <th key={key}>{key}</th>
                ))
              }
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {dbData.map((item, index) => (
              <tr key={item._id || index}>
                {Object.entries(item)
                  .filter(([key]) => key !== '_id')
                  .map(([key, value]) => (
                    <td key={key}>{renderValue(value)}</td>
                  ))
                }
                <td>
                  <button
                    onClick={() => {
                      setModalData(item);
                      setModalType('update');
                      setShowModal(true);
                    }}
                    className="btn-edit"
                  >
                    Editar
                  </button>
                  <button
                    onClick={() => handleDBItemDelete(item._id)}
                    className="btn-delete"
                  >
                    Eliminar
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="pagination-controls">
        <button 
          onClick={() => handlePageChange(pagination.page - 1)}
          disabled={pagination.page === 1}
          className="pagination-btn"
        >
          Anterior
        </button>
        <span className="pagination-info">
          Página {pagination.page} de {pagination.totalPages}
        </span>
        <button 
          onClick={() => handlePageChange(pagination.page + 1)}
          disabled={pagination.page === pagination.totalPages}
          className="pagination-btn"
        >
          Siguiente
        </button>
      </div>
    </div>
  );

  const handleLogout = async () => {
    try {
      await account.deleteSession('current');
      onLogout();
      navigate('/login');
    } catch (error) {
      console.error('Error al cerrar sesión:', error);
    }
  };

  return (
    <div className="admin-container">
      <Navbar userData={userData} onLogout={handleLogout} />
      {isLoading ? (
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Cargando...</p>
        </div>
      ) : errorMessage ? (
        <div className="error-container">
          <p className="error-message">{errorMessage}</p>
          <button onClick={() => window.location.reload()}>Reintentar</button>
        </div>
      ) : (
        <div className="admin-content">
          <div className="view-selector">
            <button
              className={activeView === 'users' ? 'active' : ''}
              onClick={() => setActiveView('users')}
            >
              Usuarios
            </button>
            <button
              className={activeView === 'databases' ? 'active' : ''}
              onClick={() => setActiveView('databases')}
            >
              Bases de Datos
            </button>
          </div>
          {activeView === 'users' ? renderUsersView() : renderDatabasesView()}
        </div>
      )}
    </div>
  );
};

export default AdminHome; 