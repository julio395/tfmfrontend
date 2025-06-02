import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { signOut } from 'firebase/auth';
import { auth, db } from '../firebase/firebase';
import { collection, getDocs } from 'firebase/firestore';
import { Radar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  RadialLinearScale,
  PointElement,
  LineElement,
  Filler,
  Tooltip,
  Legend
} from 'chart.js';

ChartJS.register(
  RadialLinearScale,
  PointElement,
  LineElement,
  Filler,
  Tooltip,
  Legend
);

const UserHome = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('inicio');
  const [activos, setActivos] = useState([]);
  const [showAuditoria, setShowAuditoria] = useState(false);
  const [respuestas, setRespuestas] = useState({});
  const [categorias, setCategorias] = useState([]);

  useEffect(() => {
    const fetchActivos = async () => {
      try {
        const activosSnapshot = await getDocs(collection(db, 'Activos'));
        const activosData = activosSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setActivos(activosData);
        
        // Extraer categorías únicas
        const categoriasUnicas = [...new Set(activosData.map(activo => activo.Tipo))];
        setCategorias(categoriasUnicas);
      } catch (error) {
        console.error('Error al obtener activos:', error);
      }
    };

    fetchActivos();
  }, []);

  const handleLogout = async () => {
    try {
      await signOut(auth);
      navigate('/login');
    } catch (error) {
      console.error('Error al cerrar sesión:', error);
    }
  };

  const handleIniciarAuditoria = () => {
    setShowAuditoria(true);
  };

  const handleCantidadChange = (categoria, cantidad) => {
    setRespuestas(prev => ({
      ...prev,
      [categoria]: {
        ...prev[categoria],
        cantidad: parseInt(cantidad) || 0,
        detalles: Array(parseInt(cantidad) || 0).fill({
          tipo: '',
          criticidad: 1,
          medidas: ''
        })
      }
    }));
  };

  const handleDetalleChange = (categoria, index, field, value) => {
    setRespuestas(prev => ({
      ...prev,
      [categoria]: {
        ...prev[categoria],
        detalles: prev[categoria].detalles.map((detalle, i) => 
          i === index ? { ...detalle, [field]: value } : detalle
        )
      }
    }));
  };

  const renderAuditoriaForm = () => {
    return (
      <div style={{ 
        backgroundColor: '#fff', 
        padding: '2rem', 
        borderRadius: '8px',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
      }}>
        <h2>Cuestionario de Auditoría</h2>
        {categorias.map(categoria => (
          <div key={categoria} style={{ marginBottom: '2rem' }}>
            <h3>{categoria}</h3>
            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem' }}>
                ¿Cuántos {categoria} tiene la empresa?
              </label>
              <input
                type="number"
                min="0"
                value={respuestas[categoria]?.cantidad || 0}
                onChange={(e) => handleCantidadChange(categoria, e.target.value)}
                style={{ width: '100px', padding: '0.5rem' }}
              />
            </div>

            {respuestas[categoria]?.cantidad > 0 && (
              <div style={{ marginLeft: '2rem' }}>
                {Array(respuestas[categoria].cantidad).fill().map((_, index) => (
                  <div key={index} style={{ marginBottom: '1.5rem', padding: '1rem', border: '1px solid #dee2e6', borderRadius: '4px' }}>
                    <h4>{categoria} #{index + 1}</h4>
                    
                    <div style={{ marginBottom: '1rem' }}>
                      <label style={{ display: 'block', marginBottom: '0.5rem' }}>
                        Tipo:
                      </label>
                      <select
                        value={respuestas[categoria].detalles[index].tipo}
                        onChange={(e) => handleDetalleChange(categoria, index, 'tipo', e.target.value)}
                        style={{ width: '100%', padding: '0.5rem' }}
                      >
                        <option value="">Seleccione un tipo</option>
                        {activos
                          .filter(activo => activo.Tipo === categoria)
                          .map(activo => (
                            <option key={activo.id} value={activo['Nombre del Activo']}>
                              {activo['Nombre del Activo']}
                            </option>
                          ))}
                      </select>
                    </div>

                    <div style={{ marginBottom: '1rem' }}>
                      <label style={{ display: 'block', marginBottom: '0.5rem' }}>
                        Nivel de Criticidad (1-5):
                      </label>
                      <input
                        type="range"
                        min="1"
                        max="5"
                        value={respuestas[categoria].detalles[index].criticidad}
                        onChange={(e) => handleDetalleChange(categoria, index, 'criticidad', parseInt(e.target.value))}
                        style={{ width: '100%' }}
                      />
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span>1</span>
                        <span>2</span>
                        <span>3</span>
                        <span>4</span>
                        <span>5</span>
                      </div>
                    </div>

                    <div>
                      <label style={{ display: 'block', marginBottom: '0.5rem' }}>
                        Medidas de Seguridad Implementadas:
                      </label>
                      <textarea
                        value={respuestas[categoria].detalles[index].medidas}
                        onChange={(e) => handleDetalleChange(categoria, index, 'medidas', e.target.value)}
                        style={{ width: '100%', padding: '0.5rem', minHeight: '100px' }}
                        placeholder="Describa las medidas de seguridad implementadas..."
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}

        <div style={{ marginTop: '2rem', display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
          <button
            onClick={() => setShowAuditoria(false)}
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
            onClick={() => {
              // Aquí irá la lógica para guardar las respuestas
              console.log('Respuestas:', respuestas);
            }}
            style={{
              padding: '0.5rem 1rem',
              backgroundColor: '#28a745',
              color: '#fff',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            Guardar Auditoría
          </button>
        </div>
      </div>
    );
  };

  const data = {
    labels: ['Seguridad Mínima', 'Seguridad Actual', 'Seguridad Objetivo'],
    datasets: [
      {
        label: 'Nivel de Seguridad',
        data: [30, 65, 85],
        backgroundColor: 'rgba(255, 99, 132, 0.2)',
        borderColor: 'rgba(255, 99, 132, 1)',
        borderWidth: 1,
      },
    ],
  };

  const options = {
    scales: {
      r: {
        angleLines: {
          display: true
        },
        suggestedMin: 0,
        suggestedMax: 100
      }
    }
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
        <nav>
          <button
            onClick={() => setActiveTab('inicio')}
            style={{
              marginRight: '1rem',
              padding: '0.5rem 1rem',
              backgroundColor: activeTab === 'inicio' ? '#007bff' : 'transparent',
              color: activeTab === 'inicio' ? '#fff' : '#000',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            Inicio
          </button>
          <button
            onClick={() => setActiveTab('documentos')}
            style={{
              padding: '0.5rem 1rem',
              backgroundColor: activeTab === 'documentos' ? '#007bff' : 'transparent',
              color: activeTab === 'documentos' ? '#fff' : '#000',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            Documentos de Auditorías
          </button>
        </nav>
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
      <main style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto' }}>
        {activeTab === 'inicio' ? (
          <div style={{ textAlign: 'center' }}>
            {!showAuditoria ? (
              <div style={{ 
                backgroundColor: '#fff', 
                padding: '2rem', 
                borderRadius: '8px',
                boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                marginBottom: '2rem'
              }}>
                <h2 style={{ marginBottom: '2rem' }}>Estado de Seguridad</h2>
                <div style={{ maxWidth: '600px', margin: '0 auto' }}>
                  <Radar data={data} options={options} />
                </div>
                <button
                  onClick={handleIniciarAuditoria}
                  style={{
                    marginTop: '2rem',
                    padding: '1rem 2rem',
                    backgroundColor: '#28a745',
                    color: '#fff',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontSize: '1.1rem'
                  }}
                >
                  Iniciar Auditoría
                </button>
              </div>
            ) : (
              renderAuditoriaForm()
            )}
          </div>
        ) : (
          <div style={{ 
            backgroundColor: '#fff', 
            padding: '2rem', 
            borderRadius: '8px',
            boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
          }}>
            <h2>Documentos de Auditorías</h2>
            {/* Aquí irá el contenido de los documentos */}
          </div>
        )}
      </main>
    </div>
  );
};

export default UserHome; 