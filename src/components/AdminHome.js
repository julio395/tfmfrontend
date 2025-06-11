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
      const response = await fetch(`${baseUrl}/api/test`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`Error en la respuesta: ${response.status} ${response.statusText}`);
      }

      return true;
    } catch (error) {
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

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const session = await account.getSession('current');
        if (!session || userData?.role !== 'admin') {
          navigate('/login', { replace: true });
          return;
        }
        await fetchUsers();
      } catch (error) {
        setErrorMessage('Error al verificar autenticación');
        navigate('/login', { replace: true });
      } finally {
        setIsLoading(false);
      }
    };
    checkAuth();
  }, [navigate, userData]);

  useEffect(() => {
    if (activeView === 'databases') {
      fetchCollectionData(pagination.page);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeView, activeCollection, pagination.page]);

  const fetchUsers = async () => {
    try {
      const response = await getUsers();
      if (response && response.users) {
        const usersWithRoles = response.users.map(user => ({
          ...user,
          role: user.labels?.includes('admin') ? 'Admin' : 'Usuario',
          name: user.name || 'Sin nombre'
        }));
        setUsers(usersWithRoles);
      } else {
        setUsers([]);
      }
    } catch (error) {
      setErrorMessage('Error al obtener usuarios');
      setUsers([]);
    }
  };

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
            {users.map(user => (
              <tr key={user.$id}>
                <td>{user.email}</td>
                <td>{user.name || 'Sin nombre'}</td>
                <td>{user.labels?.includes('admin') ? 'Admin' : 'Usuario'}</td>
                <td>{user.status || 'Activo'}</td>
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
            ))}
          </tbody>
        </table>
      </div>
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

  if (isLoading) {
    return (
      <div className="loading">
        Cargando...
      </div>
    );
  }

  if (errorMessage) {
    return (
      <div className="error">
        {errorMessage}
      </div>
    );
  }

  return (
    <div className="admin-home">
      <Navbar userData={userData} role="admin" onLogout={onLogout} />
      
      <main>
        <h1>Panel de Administración</h1>

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
            Bases de datos
          </button>
        </div>

        <div className="content-container">
          {activeView === 'users' ? renderUsersView() : renderDatabasesView()}
        </div>

        {showModal && (
          <div className="modal">
            <div className="modal-content">
              <h3>{modalType === 'create' ? 'Crear Nuevo' : 'Editar'}</h3>
              <form onSubmit={(e) => {
                e.preventDefault();
                handleUserUpdate(modalData.$id, modalData);
              }}>
                {Object.keys(modalData)
                  .filter(key => key !== '_id' && key !== '$id')
                  .map(key => (
                    <div key={key} className="form-group">
                      <label>{key}</label>
                      <input
                        type="text"
                        value={modalData[key]}
                        onChange={(e) => setModalData({...modalData, [key]: e.target.value})}
                      />
                    </div>
                  ))}
                <div className="modal-actions">
                  <button type="submit" className="btn-save">Guardar</button>
                  <button type="button" onClick={() => setShowModal(false)} className="btn-cancel">
                    Cancelar
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default AdminHome; 