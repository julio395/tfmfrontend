import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getCurrentUser, logoutUser, getUsers, createUser, updateUser, deleteUser } from '../appwrite/appwrite';
import Navbar from './Navbar';
import '../styles/AdminHome.css';

const AdminHome = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeView, setActiveView] = useState('users');
  const [users, setUsers] = useState([]);
  const [activeCollection, setActiveCollection] = useState(null);
  const [collectionData, setCollectionData] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [userData, setUserData] = useState([]);
  const [collections, setCollections] = useState([
    { id: 'Activos', name: 'Activos' },
    { id: 'Amenazas', name: 'Amenazas' },
    { id: 'Vulnerabilidades', name: 'Vulnerabilidades' },
    { id: 'Salvaguardas', name: 'Salvaguardas' },
    { id: 'Relaciones', name: 'Relaciones' }
  ]);
  const [modalData, setModalData] = useState({
    type: 'create',
    collection: null,
    data: {}
  });
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    pageSize: 10,
    totalItems: 0
  });

  useEffect(() => {
    checkAuth();
  }, []);

  useEffect(() => {
    if (activeView === 'databases' && activeCollection) {
      fetchCollectionData(activeCollection);
    }
  }, [activeView, activeCollection]);

  const checkAuth = async () => {
    try {
      const user = await getCurrentUser();
      const isAdmin = user.labels?.includes('admin');
      if (!isAdmin) {
        setError('No tienes permisos de administrador');
        return;
      }
      if (activeView === 'users') {
        await fetchUsers();
      } else {
        await fetchCollections();
      }
    } catch (error) {
      setError('Error al verificar permisos: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchUsers = async () => {
    try {
      const response = await getUsers();
      if (response && response.length > 0) {
        setUsers(response);
        setUserData(response);
      } else {
        setUsers([]);
        setUserData([]);
        setError('No se encontraron usuarios en el sistema');
      }
    } catch (error) {
      console.error('Error al obtener usuarios:', error);
      setError(error.message || 'Error al obtener usuarios');
      setUsers([]);
      setUserData([]);
    }
  };

  const fetchCollections = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/tfm/collections', {
        headers: {
          'Content-Type': 'application/json',
        }
      });

      if (!response.ok) {
        throw new Error('Error al obtener colecciones');
      }

      const data = await response.json();
      setCollections(Array.isArray(data) ? data : []);
      if (data.length > 0) {
        setActiveCollection(data[0].id);
      }
    } catch (error) {
      setError('Error al obtener colecciones: ' + error.message);
      setCollections([]);
    }
  };

  const fetchCollectionData = async (collection, page = 1) => {
    try {
      setLoading(true);
      setError(null);
      
      const baseUrl = 'http://localhost:5000';
      const url = `${baseUrl}/api/tfm/${collection}?page=${page}&pageSize=${pagination.pageSize}&sort=_id&order=asc`;
      console.log('Intentando conectar a:', url);

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Respuesta del servidor:', errorText);
        throw new Error(`Error del servidor (${response.status}): ${errorText}`);
      }

      const responseData = await response.json();
      console.log('Datos recibidos:', responseData);

      if (!responseData.data || !Array.isArray(responseData.data)) {
        throw new Error('La respuesta del servidor no tiene el formato esperado');
      }

      setCollectionData(responseData.data);
      
      if (responseData.pagination) {
        setPagination({
          currentPage: responseData.pagination.currentPage || page,
          totalPages: responseData.pagination.totalPages || 1,
          pageSize: responseData.pagination.pageSize || 10,
          totalItems: responseData.pagination.totalItems || 0
        });
      } else {
        setPagination(prev => ({
          ...prev,
          currentPage: page,
          totalPages: Math.ceil(responseData.data.length / prev.pageSize) || 1
        }));
      }
    } catch (error) {
      console.error('Error detallado:', error);
      if (error.name === 'AbortError') {
        setError(`Error de conexión: El servidor no respondió a tiempo`);
      } else if (error.message.includes('Failed to fetch')) {
        setError(`Error de conexión: No se pudo conectar al servidor. Verifica que el servidor esté corriendo en http://localhost:5000`);
      } else {
        setError(`Error al obtener datos de ${collection}: ${error.message}`);
      }
      setCollectionData([]);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateItem = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch(`http://localhost:5000/api/tfm/${modalData.collection}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(modalData.data)
      });

      if (!response.ok) {
        throw new Error('Error al crear el elemento');
      }

      setShowModal(false);
      fetchCollectionData(modalData.collection);
    } catch (error) {
      setError(`Error al crear elemento: ${error.message}`);
    }
  };

  const handleUpdateItem = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch(`http://localhost:5000/api/tfm/${modalData.collection}/${modalData.data._id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(modalData.data)
      });

      if (!response.ok) {
        throw new Error('Error al actualizar el elemento');
      }

      setShowModal(false);
      fetchCollectionData(modalData.collection);
    } catch (error) {
      setError(`Error al actualizar elemento: ${error.message}`);
    }
  };

  const handleDeleteItem = async (collection, id) => {
    if (window.confirm('¿Estás seguro de que deseas eliminar este elemento?')) {
      try {
        const response = await fetch(`http://localhost:5000/api/tfm/${collection}/${id}`, {
          method: 'DELETE'
        });

        if (!response.ok) {
          throw new Error('Error al eliminar el elemento');
        }

        fetchCollectionData(collection);
      } catch (error) {
        setError(`Error al eliminar elemento: ${error.message}`);
      }
    }
  };

  const handleLogout = async () => {
    try {
      await logoutUser();
      navigate('/login');
    } catch (error) {
      console.error('Error al cerrar sesión:', error);
    }
  };

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= pagination.totalPages) {
      fetchCollectionData(activeCollection, newPage);
    }
  };

  const renderPagination = () => {
    const currentPage = pagination.currentPage || 1;
    const totalPages = pagination.totalPages || 1;

    return (
      <div className="pagination">
        <button
          className="pagination-button"
          onClick={() => handlePageChange(currentPage - 1)}
          disabled={currentPage === 1}
        >
          &lt;
        </button>
        <div className="pagination-info">
          {`${currentPage} de ${totalPages}`}
        </div>
        <button
          className="pagination-button"
          onClick={() => handlePageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
        >
          &gt;
        </button>
      </div>
    );
  };

  const renderUsersView = () => (
    <div className="users-view">
      <div className="users-header">
        <h2>Usuarios</h2>
        <button className="create-button" onClick={() => {
          setModalData({
            type: 'create',
            collection: 'users',
            data: {
              email: '',
              password: '',
              name: ''
            }
          });
          setShowModal(true);
        }}>
          Nuevo
        </button>
      </div>
      <div className="table-container">
        <table>
          <thead>
            <tr>
              <th>Email</th>
              <th>Nombre</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {Array.isArray(userData) && userData.map((user) => (
              <tr key={user.$id}>
                <td>{user.email}</td>
                <td>{user.name}</td>
                <td>
                  <button
                    className="edit-button"
                    onClick={() => {
                      setModalData({
                        type: 'edit',
                        collection: 'users',
                        data: {
                          $id: user.$id,
                          email: user.email,
                          name: user.name
                        }
                      });
                      setShowModal(true);
                    }}
                  >
                    Editar
                  </button>
                  <button
                    className="delete-button"
                    onClick={() => handleDeleteItem('users', user.$id)}
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
    <div className="databases-view">
      <div className="collections-header">
        <h3>Colecciones</h3>
        <div className="collections-list">
          {collections.map((collection) => (
            <button
              key={collection.id}
              className={`collection-button ${activeCollection === collection.id ? 'active' : ''}`}
              onClick={() => setActiveCollection(collection.id)}
            >
              {collection.name}
            </button>
          ))}
        </div>
      </div>
      <div className="collection-content">
        {activeCollection ? (
          <>
            <div className="collection-header">
              <h2>{collections.find(c => c.id === activeCollection)?.name}</h2>
              <button 
                className="create-button"
                onClick={() => {
                  setModalData({
                    type: 'create',
                    collection: activeCollection,
                    data: {}
                  });
                  setShowModal(true);
                }}
              >
                Nuevo
              </button>
            </div>
            <div className="table-container">
              <table>
                <thead>
                  <tr>
                    {collectionData.length > 0 &&
                      Object.keys(collectionData[0]).map((key) => (
                        <th key={key}>{key}</th>
                      ))}
                    <th>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {collectionData.map((item, index) => (
                    <tr key={index}>
                      {Object.entries(item).map(([key, value]) => (
                        <td key={key}>{JSON.stringify(value)}</td>
                      ))}
                      <td>
                        <button
                          className="edit-button"
                          onClick={() => {
                            setModalData({
                              type: 'edit',
                              collection: activeCollection,
                              data: item
                            });
                            setShowModal(true);
                          }}
                        >
                          Editar
                        </button>
                        <button
                          className="delete-button"
                          onClick={() => handleDeleteItem(activeCollection, item._id)}
                        >
                          Eliminar
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {renderPagination()}
          </>
        ) : (
          <div className="no-collection-selected">
            Selecciona una colección para ver sus datos
          </div>
        )}
      </div>

      {showModal && (
        <div className="modal">
          <div className="modal-content">
            <h2>{modalData.type === 'create' ? 'Crear' : 'Editar'} {collections.find(c => c.id === modalData.collection)?.name}</h2>
            <form onSubmit={modalData.type === 'create' ? handleCreateItem : handleUpdateItem}>
              {collectionData.length > 0 &&
                Object.keys(collectionData[0])
                  .filter(key => key !== '_id' && key !== '__v')
                  .map((key) => (
                    <div key={key} className="form-group">
                      <label>{key}:</label>
                      <input
                        type="text"
                        value={modalData.data[key] || ''}
                        onChange={(e) =>
                          setModalData({
                            ...modalData,
                            data: { ...modalData.data, [key]: e.target.value }
                          })
                        }
                        required
                      />
                    </div>
                  ))}
              <div className="modal-buttons">
                <button type="submit">
                  {modalData.type === 'create' ? 'Crear' : 'Guardar'}
                </button>
                <button type="button" onClick={() => setShowModal(false)}>
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );

  if (loading) {
    return <div className="loading">Cargando...</div>;
  }

  return (
    <div className="admin-container">
      <Navbar userData={userData} onLogout={handleLogout} />
      <div className="admin-content">
        <div className="view-selector">
          <button 
            className={`view-button ${activeView === 'users' ? 'active' : ''}`}
            onClick={() => setActiveView('users')}
          >
            Usuarios
          </button>
          <button 
            className={`view-button ${activeView === 'databases' ? 'active' : ''}`}
            onClick={() => setActiveView('databases')}
          >
            Bases de Datos
          </button>
        </div>

        {error && <div className="error-message">{error}</div>}

        {activeView === 'users' ? renderUsersView() : renderDatabasesView()}
      </div>
    </div>
  );
};

export default AdminHome; 