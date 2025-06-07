import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { account, getUsers, fetchMongoDBData } from '../appwrite/appwrite.js';
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

  const collections = ['Activos', 'Amenazas', 'Vulnerabilidades', 'Salvaguardas', 'Relaciones'];

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const session = await account.getSession('current');
        if (!session || userData?.role !== 'admin') {
          navigate('/login', { replace: true });
          return;
        }
        await fetchUsers();
        if (activeView === 'databases') {
          await fetchCollectionData();
        }
      } catch (error) {
        console.error('Error en AdminHome:', error);
        setErrorMessage('Error al verificar autenticación');
        navigate('/login', { replace: true });
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, [navigate, userData, activeView, activeCollection]);

  const fetchUsers = async () => {
    try {
      const response = await getUsers();
      console.log('Usuarios obtenidos:', response);
      if (response && response.users) {
        const usersWithRoles = response.users.map(user => ({
          ...user,
          role: user.labels?.includes('admin') ? 'Admin' : 'Usuario',
          name: user.name || 'Sin nombre'
        }));
        console.log('Usuarios procesados:', usersWithRoles);
        setUsers(usersWithRoles);
      } else {
        console.error('Formato de respuesta inesperado:', response);
        setUsers([]);
      }
    } catch (error) {
      console.error('Error al obtener usuarios:', error);
      setUsers([]);
    }
  };

  const fetchCollectionData = async () => {
    try {
      const data = await fetchMongoDBData(activeCollection);
      console.log(`Datos de ${activeCollection}:`, data);
      setDbData(data);
    } catch (error) {
      console.error(`Error al obtener datos de ${activeCollection}:`, error);
      setErrorMessage(`Error al obtener datos de ${activeCollection}`);
    }
  };

  const handleUserDelete = async (userId) => {
    if (window.confirm('¿Estás seguro de que deseas eliminar este usuario?')) {
      try {
        console.log('Eliminando usuario:', userId);
        await account.delete(userId);
        await fetchUsers();
      } catch (error) {
        console.error('Error al eliminar usuario:', error);
        setErrorMessage('Error al eliminar usuario');
      }
    }
  };

  const handleUserUpdate = async (userId, data) => {
    try {
      console.log('Actualizando usuario:', userId, data);
      await account.update(userId, data);
      await fetchUsers();
    } catch (error) {
      console.error('Error al actualizar usuario:', error);
      setErrorMessage('Error al actualizar usuario');
    }
  };

  const handleDBItemDelete = async (itemId) => {
    if (window.confirm('¿Estás seguro de que deseas eliminar este elemento?')) {
      try {
        console.log('Eliminando elemento:', itemId);
        await fetchMongoDBData(activeCollection.toLowerCase(), itemId);
        await fetchCollectionData();
      } catch (error) {
        console.error('Error al eliminar elemento:', error);
        setErrorMessage('Error al eliminar elemento');
      }
    }
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
            onClick={() => setActiveCollection(collection)}
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
                    <td key={key}>{value}</td>
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