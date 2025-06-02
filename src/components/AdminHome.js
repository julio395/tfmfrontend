import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { signOut } from 'firebase/auth';
import { auth, db } from '../firebase/firebase';
import { collection, getDocs, doc, deleteDoc, updateDoc, addDoc } from 'firebase/firestore';
import { authService } from '../services/authService';

const AdminHome = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('usuarios');
  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    email: '',
    companyName: '',
    employees: '',
    sector: '',
    responsible: '',
    role: ''
  });

  // Estados para las bases de datos
  const [activos, setActivos] = useState([]);
  const [amenazas, setAmenazas] = useState([]);
  const [vulnerabilidades, setVulnerabilidades] = useState([]);
  const [salvaguardas, setSalvaguardas] = useState([]);
  const [relaciones, setRelaciones] = useState([]);
  const [selectedItem, setSelectedItem] = useState(null);
  const [isEditingItem, setIsEditingItem] = useState(false);
  const [editItemForm, setEditItemForm] = useState({});
  const [activeCollection, setActiveCollection] = useState('');

  // Estados para controlar qué listas están expandidas
  const [expandedLists, setExpandedLists] = useState({
    activos: false,
    amenazas: false,
    vulnerabilidades: false,
    salvaguardas: false,
    relaciones: false
  });

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const token = await authService.getToken();
        const validationResult = await authService.validateToken(token);
        
        if (!validationResult.valid) {
          console.error('Token no válido');
          navigate('/login');
          return;
        }

        if (validationResult.user.role !== 'admin') {
          console.error('Usuario no es administrador');
          navigate('/home');
          return;
        }
      } catch (error) {
        console.error('Error de autenticación:', error);
        // Si hay un error de conexión, permitimos el acceso temporalmente
        if (error.message.includes('Failed to fetch')) {
          console.warn('Error de conexión al servidor, permitiendo acceso temporal');
          return;
        }
        navigate('/login');
      }
    };

    checkAuth();
  }, [navigate]);

  useEffect(() => {
    if (activeTab === 'usuarios') {
      fetchUsers();
    } else {
      fetchAllData();
    }
  }, [activeTab]);

  const fetchAllData = async () => {
    try {
      const token = await authService.getToken();
      
      // Obtener Activos
      const activosSnapshot = await getDocs(collection(db, 'Activos'));
      setActivos(activosSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));

      // Obtener Amenazas
      const amenazasSnapshot = await getDocs(collection(db, 'Amenazas'));
      setAmenazas(amenazasSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));

      // Obtener Vulnerabilidades
      const vulnerabilidadesSnapshot = await getDocs(collection(db, 'Vulnerabilidades'));
      setVulnerabilidades(vulnerabilidadesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));

      // Obtener Salvaguardas
      const salvaguardasSnapshot = await getDocs(collection(db, 'Salvaguardas'));
      setSalvaguardas(salvaguardasSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));

      // Obtener Relaciones
      console.log('Intentando obtener Relaciones...');
      try {
        const relacionesSnapshot = await getDocs(collection(db, 'Relaciones'));
        console.log('Relaciones obtenidas:', relacionesSnapshot.docs.length);
        const relacionesData = relacionesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        console.log('Datos de relaciones procesados:', relacionesData);
        setRelaciones(relacionesData);
        console.log('Estado de relaciones actualizado:', relacionesData.length);
      } catch (relacionesError) {
        console.error('Error específico al obtener relaciones:', relacionesError);
        console.error('Detalles del error:', {
          message: relacionesError.message,
          code: relacionesError.code,
          stack: relacionesError.stack
        });
        // Intentar obtener la lista de colecciones disponibles
        try {
          const collections = await db.listCollections();
          console.log('Colecciones disponibles:', collections.map(c => c.id));
        } catch (listError) {
          console.error('Error al listar colecciones:', listError);
        }
      }
    } catch (error) {
      console.error('Error general al obtener datos:', error);
      console.error('Detalles del error general:', {
        message: error.message,
        code: error.code,
        stack: error.stack
      });
      if (error.message === 'Token inválido') {
        navigate('/login');
      }
    }
  };

  const fetchUsers = async () => {
    try {
      const token = await authService.getToken();
      const querySnapshot = await getDocs(collection(db, 'users'));
      const usersData = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setUsers(usersData);
    } catch (error) {
      console.error('Error al obtener usuarios:', error);
      if (error.message === 'Token inválido') {
        navigate('/login');
      }
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      navigate('/login');
    } catch (error) {
      console.error('Error al cerrar sesión:', error);
    }
  };

  const handleEdit = (user) => {
    setSelectedUser(user);
    setEditForm({
      email: user.email,
      companyName: user.companyName,
      employees: user.employees,
      sector: user.sector,
      responsible: user.responsible,
      role: user.role
    });
    setIsEditing(true);
  };

  const handleDelete = async (userId) => {
    if (window.confirm('¿Estás seguro de que quieres eliminar este usuario?')) {
      try {
        await deleteDoc(doc(db, 'users', userId));
        await fetchUsers();
      } catch (error) {
        console.error('Error al eliminar usuario:', error);
      }
    }
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    try {
      await updateDoc(doc(db, 'users', selectedUser.id), editForm);
      setIsEditing(false);
      setSelectedUser(null);
      await fetchUsers();
    } catch (error) {
      console.error('Error al actualizar usuario:', error);
    }
  };

  // Funciones para el CRUD de bases de datos
  const handleEditItem = (item, collection) => {
    setSelectedItem(item);
    setEditItemForm(item);
    setIsEditingItem(true);
    setActiveCollection(collection);
  };

  const handleDeleteItem = async (itemId, collection) => {
    if (window.confirm('¿Estás seguro de que quieres eliminar este elemento?')) {
      try {
        const collectionName = collection;
        await deleteDoc(doc(db, collectionName, itemId));
        await fetchAllData();
      } catch (error) {
        console.error('Error al eliminar elemento:', error);
      }
    }
  };

  const handleUpdateItem = async (e) => {
    e.preventDefault();
    try {
      const collectionName = activeCollection;
      await updateDoc(doc(db, collectionName, selectedItem.id), editItemForm);
      setIsEditingItem(false);
      setSelectedItem(null);
      await fetchAllData();
    } catch (error) {
      console.error('Error al actualizar elemento:', error);
    }
  };

  const handleAddItem = async (collection) => {
    setActiveCollection(collection);
    // Inicializar el formulario con los campos específicos de cada colección
    let initialForm = {};
    switch (collection) {
      case 'Activos':
        // Obtener el último ID_Activos
        const lastActivo = activos.length > 0 
          ? Math.max(...activos.map(a => parseInt(a.ID_Activos) || 0))
          : 0;
        initialForm = {
          ID_Activos: (lastActivo + 1).toString(),
          'Nombre del Activo': '',
          'Dependencias Críticas': '',
          Tipo: '',
          Clasificacion: '',
          'Valoración (CIA)': {
            Disponibilidad: '',
            Integridad: '',
            Confidencialidad: ''
          }
        };
        break;
      case 'Amenazas':
        // Obtener el último ID_Amenazas
        const lastAmenaza = amenazas.length > 0 
          ? Math.max(...amenazas.map(a => parseInt(a.ID_Amenazas) || 0))
          : 0;
        initialForm = {
          ID_Amenazas: (lastAmenaza + 1).toString(),
          'Nombre de Amenaza': '',
          'Descripción Breve': '',
          Categoria: '',
          Fuente: ''
        };
        break;
      case 'Vulnerabilidades':
        initialForm = {
          'Nombre de Vulnerabilidad': '',
          'Descripción Breve': '',
          Tipo: '',
          'Activos Asociados': {
            '0': '',
            '1': '',
            '2': '',
            '3': '',
            '4': ''
          }
        };
        break;
      case 'Salvaguardas':
        initialForm = {
          'Nombre de la Salvaguarda': '',
          'Descripción Contextual': '',
          Tipo: '',
          'Norma o Guía Asociada': ''
        };
        break;
      case 'Relaciones':
        initialForm = {
          'ID_Activo': '',
          'ID_Amenaza': '',
          'ID_Vulnerabilidad': '',
          'ID_Salvaguarda': '',
          'Descripción': ''
        };
        break;
      default:
        initialForm = {};
    }
    setEditItemForm(initialForm);
    setIsEditingItem(true);
  };

  const handleCreateItem = async (e) => {
    e.preventDefault();
    try {
      const collectionName = activeCollection;
      await addDoc(collection(db, collectionName), editItemForm);
      setIsEditingItem(false);
      await fetchAllData();
    } catch (error) {
      console.error('Error al crear elemento:', error);
    }
  };

  const renderDataTable = (data, collection) => {
    if (!data || data.length === 0) return <p>No hay datos disponibles</p>;

    // Ordenar los datos si es Activos o Amenazas
    let sortedData = [...data];
    if (collection === 'Activos') {
      sortedData.sort((a, b) => {
        const idA = parseInt(a.ID_Activos) || 0;
        const idB = parseInt(b.ID_Activos) || 0;
        return idA - idB;
      });
    } else if (collection === 'Amenazas') {
      sortedData.sort((a, b) => {
        const idA = parseInt(a.ID_Amenazas) || 0;
        const idB = parseInt(b.ID_Amenazas) || 0;
        return idA - idB;
      });
    }

    const columns = Object.keys(sortedData[0]).filter(key => key !== 'id');

    const renderCellValue = (value) => {
      if (typeof value === 'object' && value !== null) {
        // Caso especial para Activos Asociados en Vulnerabilidades
        if (collection === 'Vulnerabilidades' && Object.keys(value).some(key => !isNaN(parseInt(key)))) {
          return Object.values(value).join(', ');
        }
        return Object.entries(value)
          .map(([key, val]) => `${key}: ${val}`)
          .join(', ');
      }
      return value;
    };

    const listName = collection.toLowerCase();
    const isExpanded = expandedLists[listName];

    return (
      <div style={{ marginBottom: '1rem' }}>
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          backgroundColor: '#f8f9fa',
          padding: '0.5rem 1rem',
          borderRadius: '4px',
          cursor: 'pointer'
        }} onClick={() => toggleList(listName)}>
          <h3 style={{ margin: 0 }}>{collection}</h3>
          <button
            style={{
              backgroundColor: 'transparent',
              border: 'none',
              fontSize: '1.2rem',
              cursor: 'pointer',
              padding: '0.5rem'
            }}
          >
            {isExpanded ? '▼' : '▶'}
          </button>
        </div>
        
        {isExpanded && (
          <div style={{ marginTop: '1rem' }}>
            <button
              onClick={() => handleAddItem(collection)}
              style={{
                marginBottom: '1rem',
                padding: '0.5rem 1rem',
                backgroundColor: '#28a745',
                color: '#fff',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer'
              }}
            >
              Añadir Nuevo
            </button>
            
            <div style={{ 
              overflowX: 'auto',
              maxHeight: '400px',
              overflowY: 'auto'
            }}>
              <table style={{ 
                width: '100%', 
                borderCollapse: 'collapse',
                minWidth: '800px'
              }}>
                <thead>
                  <tr style={{ backgroundColor: '#f8f9fa' }}>
                    {columns.map(column => (
                      <th key={column} style={{ 
                        padding: '1rem', 
                        textAlign: 'left',
                        position: 'sticky',
                        top: 0,
                        backgroundColor: '#f8f9fa',
                        zIndex: 1
                      }}>
                        {column.charAt(0).toUpperCase() + column.slice(1)}
                      </th>
                    ))}
                    <th style={{ 
                      padding: '1rem', 
                      textAlign: 'left',
                      position: 'sticky',
                      top: 0,
                      backgroundColor: '#f8f9fa',
                      zIndex: 1
                    }}>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {sortedData.map(item => (
                    <tr key={item.id} style={{ borderBottom: '1px solid #dee2e6' }}>
                      {columns.map(column => (
                        <td key={column} style={{ padding: '1rem' }}>
                          {renderCellValue(item[column])}
                        </td>
                      ))}
                      <td style={{ padding: '1rem' }}>
                        <button
                          onClick={() => handleEditItem(item, collection)}
                          style={{
                            marginRight: '0.5rem',
                            padding: '0.25rem 0.5rem',
                            backgroundColor: '#007bff',
                            color: '#fff',
                            border: 'none',
                            borderRadius: '4px',
                            cursor: 'pointer'
                          }}
                        >
                          Editar
                        </button>
                        <button
                          onClick={() => handleDeleteItem(item.id, collection)}
                          style={{
                            padding: '0.25rem 0.5rem',
                            backgroundColor: '#dc3545',
                            color: '#fff',
                            border: 'none',
                            borderRadius: '4px',
                            cursor: 'pointer'
                          }}
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
        )}
      </div>
    );
  };

  const toggleList = (listName) => {
    setExpandedLists(prev => ({
      ...prev,
      [listName]: !prev[listName]
    }));
  };

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f5f5f5' }}>
      {/* Header */}
      <header style={{
        backgroundColor: '#fff',
        padding: '1rem',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <h1 style={{ marginRight: '2rem' }}>Panel de Administración</h1>
          <nav>
            <button
              onClick={() => setActiveTab('usuarios')}
              style={{
                marginRight: '1rem',
                padding: '0.5rem 1rem',
                backgroundColor: activeTab === 'usuarios' ? '#007bff' : 'transparent',
                color: activeTab === 'usuarios' ? '#fff' : '#000',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer'
              }}
            >
              Usuarios
            </button>
            <button
              onClick={() => setActiveTab('bases')}
              style={{
                padding: '0.5rem 1rem',
                backgroundColor: activeTab === 'bases' ? '#007bff' : 'transparent',
                color: activeTab === 'bases' ? '#fff' : '#000',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer'
              }}
            >
              Bases de Datos
            </button>
          </nav>
        </div>
        <button
          onClick={handleLogout}
          style={{
            padding: '0.5rem 1rem',
            backgroundColor: '#dc3545',
            color: '#fff',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          Cerrar Sesión
        </button>
      </header>

      {/* Main Content */}
      <main style={{ padding: '2rem' }}>
        <div style={{ 
          backgroundColor: '#fff', 
          padding: '2rem', 
          borderRadius: '8px',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
        }}>
          {activeTab === 'usuarios' ? (
            <>
              <h2>Gestión de Usuarios</h2>
              <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '1rem' }}>
                <thead>
                  <tr style={{ backgroundColor: '#f8f9fa' }}>
                    <th style={{ padding: '1rem', textAlign: 'left' }}>Email</th>
                    <th style={{ padding: '1rem', textAlign: 'left' }}>Empresa</th>
                    <th style={{ padding: '1rem', textAlign: 'left' }}>Rol</th>
                    <th style={{ padding: '1rem', textAlign: 'left' }}>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map(user => (
                    <tr key={user.id} style={{ borderBottom: '1px solid #dee2e6' }}>
                      <td style={{ padding: '1rem' }}>{user.email}</td>
                      <td style={{ padding: '1rem' }}>{user.companyName}</td>
                      <td style={{ padding: '1rem' }}>{user.role}</td>
                      <td style={{ padding: '1rem' }}>
                        <button
                          onClick={() => handleEdit(user)}
                          style={{
                            marginRight: '0.5rem',
                            padding: '0.25rem 0.5rem',
                            backgroundColor: '#007bff',
                            color: '#fff',
                            border: 'none',
                            borderRadius: '4px',
                            cursor: 'pointer'
                          }}
                        >
                          Editar
                        </button>
                        <button
                          onClick={() => handleDelete(user.id)}
                          style={{
                            padding: '0.25rem 0.5rem',
                            backgroundColor: '#dc3545',
                            color: '#fff',
                            border: 'none',
                            borderRadius: '4px',
                            cursor: 'pointer'
                          }}
                        >
                          Eliminar
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </>
          ) : (
            <div>
              <h2>Gestión de Bases de Datos</h2>
              {renderDataTable(activos, 'Activos')}
              {renderDataTable(amenazas, 'Amenazas')}
              {renderDataTable(vulnerabilidades, 'Vulnerabilidades')}
              {renderDataTable(salvaguardas, 'Salvaguardas')}
              {renderDataTable(relaciones, 'Relaciones')}
            </div>
          )}
        </div>
      </main>

      {/* Modal de edición de usuario */}
      {isEditing && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.5)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center'
        }}>
          <div style={{
            backgroundColor: '#fff',
            padding: '2rem',
            borderRadius: '8px',
            width: '500px'
          }}>
            <h3>Editar Usuario</h3>
            <form onSubmit={handleUpdate}>
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem' }}>Email:</label>
                <input
                  type="email"
                  value={editForm.email}
                  onChange={(e) => setEditForm({...editForm, email: e.target.value})}
                  style={{ width: '100%', padding: '0.5rem' }}
                />
              </div>
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem' }}>Empresa:</label>
                <input
                  type="text"
                  value={editForm.companyName}
                  onChange={(e) => setEditForm({...editForm, companyName: e.target.value})}
                  style={{ width: '100%', padding: '0.5rem' }}
                />
              </div>
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem' }}>Rol:</label>
                <select
                  value={editForm.role}
                  onChange={(e) => setEditForm({...editForm, role: e.target.value})}
                  style={{ width: '100%', padding: '0.5rem' }}
                >
                  <option value="user">Usuario</option>
                  <option value="admin">Administrador</option>
                </select>
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  style={{
                    padding: '0.5rem 1rem',
                    backgroundColor: '#6c757d',
                    color: '#fff',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer'
                  }}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  style={{
                    padding: '0.5rem 1rem',
                    backgroundColor: '#28a745',
                    color: '#fff',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer'
                  }}
                >
                  Guardar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal de edición de elementos de base de datos */}
      {isEditingItem && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.5)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center'
        }}>
          <div style={{
            backgroundColor: '#fff',
            padding: '2rem',
            borderRadius: '8px',
            width: '500px',
            maxHeight: '90vh',
            overflowY: 'auto'
          }}>
            <h3>{selectedItem ? 'Editar Elemento' : 'Añadir Nuevo Elemento'}</h3>
            <form onSubmit={selectedItem ? handleUpdateItem : handleCreateItem}>
              {Object.entries(editItemForm).map(([key, value]) => {
                if (key === 'id') return null;

                // Campos específicos para Activos
                if (activeCollection === 'Activos') {
                  if (key === 'ID_Activos') {
                    return (
                      <div key={key} style={{ marginBottom: '1rem' }}>
                        <label style={{ display: 'block', marginBottom: '0.5rem' }}>
                          {key}:
                        </label>
                        <input
                          type="text"
                          value={value}
                          disabled
                          style={{ width: '100%', padding: '0.5rem', backgroundColor: '#f8f9fa' }}
                        />
                      </div>
                    );
                  }
                  if (key === 'Clasificacion') {
                    return (
                      <div key={key} style={{ marginBottom: '1rem' }}>
                        <label style={{ display: 'block', marginBottom: '0.5rem' }}>
                          {key}:
                        </label>
                        <select
                          value={value}
                          onChange={(e) => setEditItemForm({
                            ...editItemForm,
                            [key]: e.target.value
                          })}
                          style={{ width: '100%', padding: '0.5rem' }}
                        >
                          <option value="">Seleccione una opción</option>
                          <option value="Bajo">Bajo</option>
                          <option value="Medio">Medio</option>
                          <option value="Alto">Alto</option>
                        </select>
                      </div>
                    );
                  }
                  if (key === 'Valoración (CIA)') {
                    return (
                      <div key={key} style={{ marginBottom: '1rem' }}>
                        <label style={{ display: 'block', marginBottom: '0.5rem' }}>
                          {key}:
                        </label>
                        <div style={{ padding: '1rem', border: '1px solid #dee2e6', borderRadius: '4px' }}>
                          <div style={{ marginBottom: '1rem' }}>
                            <label style={{ display: 'block', marginBottom: '0.5rem' }}>
                              Disponibilidad:
                            </label>
                            <select
                              value={value.Disponibilidad}
                              onChange={(e) => setEditItemForm({
                                ...editItemForm,
                                'Valoración (CIA)': {
                                  ...value,
                                  Disponibilidad: e.target.value
                                }
                              })}
                              style={{ width: '100%', padding: '0.5rem' }}
                            >
                              <option value="">Seleccione una opción</option>
                              <option value="Baja">Baja</option>
                              <option value="Media">Media</option>
                              <option value="Alta">Alta</option>
                            </select>
                          </div>
                          <div style={{ marginBottom: '1rem' }}>
                            <label style={{ display: 'block', marginBottom: '0.5rem' }}>
                              Integridad:
                            </label>
                            <select
                              value={value.Integridad}
                              onChange={(e) => setEditItemForm({
                                ...editItemForm,
                                'Valoración (CIA)': {
                                  ...value,
                                  Integridad: e.target.value
                                }
                              })}
                              style={{ width: '100%', padding: '0.5rem' }}
                            >
                              <option value="">Seleccione una opción</option>
                              <option value="Baja">Baja</option>
                              <option value="Media">Media</option>
                              <option value="Alta">Alta</option>
                            </select>
                          </div>
                          <div>
                            <label style={{ display: 'block', marginBottom: '0.5rem' }}>
                              Confidencialidad:
                            </label>
                            <select
                              value={value.Confidencialidad}
                              onChange={(e) => setEditItemForm({
                                ...editItemForm,
                                'Valoración (CIA)': {
                                  ...value,
                                  Confidencialidad: e.target.value
                                }
                              })}
                              style={{ width: '100%', padding: '0.5rem' }}
                            >
                              <option value="">Seleccione una opción</option>
                              <option value="Baja">Baja</option>
                              <option value="Media">Media</option>
                              <option value="Alta">Alta</option>
                            </select>
                          </div>
                        </div>
                      </div>
                    );
                  }
                }

                // Campos específicos para Amenazas
                if (activeCollection === 'Amenazas') {
                  if (key === 'ID_Amenazas') {
                    return (
                      <div key={key} style={{ marginBottom: '1rem' }}>
                        <label style={{ display: 'block', marginBottom: '0.5rem' }}>
                          {key}:
                        </label>
                        <input
                          type="text"
                          value={value}
                          disabled
                          style={{ width: '100%', padding: '0.5rem', backgroundColor: '#f8f9fa' }}
                        />
                      </div>
                    );
                  }
                  if (key === 'Categoria') {
                    return (
                      <div key={key} style={{ marginBottom: '1rem' }}>
                        <label style={{ display: 'block', marginBottom: '0.5rem' }}>
                          {key}:
                        </label>
                        <select
                          value={value}
                          onChange={(e) => setEditItemForm({
                            ...editItemForm,
                            [key]: e.target.value
                          })}
                          style={{ width: '100%', padding: '0.5rem' }}
                        >
                          <option value="">Seleccione una opción</option>
                          <option value="Ingenería Social">Ingenería Social</option>
                          <option value="Intrusión">Intrusión</option>
                          <option value="Software Malicioso">Software Malicioso</option>
                          <option value="Técnica">Técnica</option>
                        </select>
                      </div>
                    );
                  }
                  if (key === 'Fuente') {
                    return (
                      <div key={key} style={{ marginBottom: '1rem' }}>
                        <label style={{ display: 'block', marginBottom: '0.5rem' }}>
                          {key}:
                        </label>
                        <select
                          value={value}
                          onChange={(e) => setEditItemForm({
                            ...editItemForm,
                            [key]: e.target.value
                          })}
                          style={{ width: '100%', padding: '0.5rem' }}
                        >
                          <option value="">Seleccione una opción</option>
                          <option value="Atacantes Especializados">Atacantes Especializados</option>
                          <option value="Cibercriminales">Cibercriminales</option>
                          <option value="Externo">Externo</option>
                          <option value="Hackers">Hackers</option>
                          <option value="Interno">Interno</option>
                        </select>
                      </div>
                    );
                  }
                }

                // Campos específicos para Vulnerabilidades
                if (activeCollection === 'Vulnerabilidades') {
                  if (key === 'Tipo') {
                    return (
                      <div key={key} style={{ marginBottom: '1rem' }}>
                        <label style={{ display: 'block', marginBottom: '0.5rem' }}>
                          {key}:
                        </label>
                        <select
                          value={value}
                          onChange={(e) => setEditItemForm({
                            ...editItemForm,
                            [key]: e.target.value
                          })}
                          style={{ width: '100%', padding: '0.5rem' }}
                        >
                          <option value="">Seleccione una opción</option>
                          <option value="Humana">Humana</option>
                          <option value="Organizacional">Organizacional</option>
                          <option value="Técnica">Técnica</option>
                        </select>
                      </div>
                    );
                  }
                  if (key === 'Activos Asociados') {
                    const activosOptions = [
                      'Aplicaciones',
                      'Bases de datos',
                      'Redes',
                      'Servidores',
                      'Sistemas'
                    ];
                    
                    return (
                      <div key={key} style={{ marginBottom: '1rem' }}>
                        <label style={{ display: 'block', marginBottom: '0.5rem' }}>
                          {key}:
                        </label>
                        <div style={{ padding: '1rem', border: '1px solid #dee2e6', borderRadius: '4px' }}>
                          {activosOptions.map((option, index) => (
                            <div key={index} style={{ marginBottom: '0.5rem' }}>
                              <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <input
                                  type="checkbox"
                                  checked={Object.values(value).includes(option)}
                                  onChange={(e) => {
                                    const newValue = { ...value };
                                    if (e.target.checked) {
                                      // Encontrar el primer índice vacío
                                      const emptyIndex = Object.entries(newValue).find(([_, v]) => !v)?.[0] || 
                                        Object.keys(newValue).length.toString();
                                      newValue[emptyIndex] = option;
                                    } else {
                                      // Eliminar la opción deseleccionada
                                      const indexToRemove = Object.entries(newValue).find(([_, v]) => v === option)?.[0];
                                      if (indexToRemove) {
                                        newValue[indexToRemove] = '';
                                      }
                                    }
                                    setEditItemForm({
                                      ...editItemForm,
                                      [key]: newValue
                                    });
                                  }}
                                />
                                {option}
                              </label>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  }
                }

                // Campos específicos para Salvaguardas
                if (activeCollection === 'Salvaguardas') {
                  if (key === 'Tipo') {
                    return (
                      <div key={key} style={{ marginBottom: '1rem' }}>
                        <label style={{ display: 'block', marginBottom: '0.5rem' }}>
                          {key}:
                        </label>
                        <select
                          value={value}
                          onChange={(e) => setEditItemForm({
                            ...editItemForm,
                            [key]: e.target.value
                          })}
                          style={{ width: '100%', padding: '0.5rem' }}
                        >
                          <option value="">Seleccione una opción</option>
                          <option value="Correctiva">Correctiva</option>
                          <option value="Detectiva">Detectiva</option>
                          <option value="Organizacional">Organizacional</option>
                          <option value="Preventiva">Preventiva</option>
                        </select>
                      </div>
                    );
                  }
                }

                // Campos específicos para Relaciones
                if (activeCollection === 'Relaciones') {
                  if (key === 'ID_Activo') {
                    return (
                      <div key={key} style={{ marginBottom: '1rem' }}>
                        <label style={{ display: 'block', marginBottom: '0.5rem' }}>
                          {key}:
                        </label>
                        <select
                          value={value}
                          onChange={(e) => setEditItemForm({
                            ...editItemForm,
                            [key]: e.target.value
                          })}
                          style={{ width: '100%', padding: '0.5rem' }}
                        >
                          <option value="">Seleccione un activo</option>
                          {activos.map(activo => (
                            <option key={activo.id} value={activo.ID_Activos}>
                              {activo['Nombre del Activo']}
                            </option>
                          ))}
                        </select>
                      </div>
                    );
                  }
                  if (key === 'ID_Amenaza') {
                    return (
                      <div key={key} style={{ marginBottom: '1rem' }}>
                        <label style={{ display: 'block', marginBottom: '0.5rem' }}>
                          {key}:
                        </label>
                        <select
                          value={value}
                          onChange={(e) => setEditItemForm({
                            ...editItemForm,
                            [key]: e.target.value
                          })}
                          style={{ width: '100%', padding: '0.5rem' }}
                        >
                          <option value="">Seleccione una amenaza</option>
                          {amenazas.map(amenaza => (
                            <option key={amenaza.id} value={amenaza.ID_Amenazas}>
                              {amenaza['Nombre de Amenaza']}
                            </option>
                          ))}
                        </select>
                      </div>
                    );
                  }
                  if (key === 'ID_Vulnerabilidad') {
                    return (
                      <div key={key} style={{ marginBottom: '1rem' }}>
                        <label style={{ display: 'block', marginBottom: '0.5rem' }}>
                          {key}:
                        </label>
                        <select
                          value={value}
                          onChange={(e) => setEditItemForm({
                            ...editItemForm,
                            [key]: e.target.value
                          })}
                          style={{ width: '100%', padding: '0.5rem' }}
                        >
                          <option value="">Seleccione una vulnerabilidad</option>
                          {vulnerabilidades.map(vulnerabilidad => (
                            <option key={vulnerabilidad.id} value={vulnerabilidad.id}>
                              {vulnerabilidad['Nombre de Vulnerabilidad']}
                            </option>
                          ))}
                        </select>
                      </div>
                    );
                  }
                  if (key === 'ID_Salvaguarda') {
                    return (
                      <div key={key} style={{ marginBottom: '1rem' }}>
                        <label style={{ display: 'block', marginBottom: '0.5rem' }}>
                          {key}:
                        </label>
                        <select
                          value={value}
                          onChange={(e) => setEditItemForm({
                            ...editItemForm,
                            [key]: e.target.value
                          })}
                          style={{ width: '100%', padding: '0.5rem' }}
                        >
                          <option value="">Seleccione una salvaguarda</option>
                          {salvaguardas.map(salvaguarda => (
                            <option key={salvaguarda.id} value={salvaguarda.id}>
                              {salvaguarda['Nombre de la Salvaguarda']}
                            </option>
                          ))}
                        </select>
                      </div>
                    );
                  }
                }

                // Campos de texto por defecto
                return (
                  <div key={key} style={{ marginBottom: '1rem' }}>
                    <label style={{ display: 'block', marginBottom: '0.5rem' }}>
                      {key}:
                    </label>
                    <input
                      type="text"
                      value={value || ''}
                      onChange={(e) => setEditItemForm({
                        ...editItemForm,
                        [key]: e.target.value
                      })}
                      style={{ width: '100%', padding: '0.5rem' }}
                    />
                  </div>
                );
              })}
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
                <button
                  type="button"
                  onClick={() => setIsEditingItem(false)}
                  style={{
                    padding: '0.5rem 1rem',
                    backgroundColor: '#6c757d',
                    color: '#fff',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer'
                  }}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  style={{
                    padding: '0.5rem 1rem',
                    backgroundColor: '#28a745',
                    color: '#fff',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer'
                  }}
                >
                  {selectedItem ? 'Guardar' : 'Crear'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminHome; 