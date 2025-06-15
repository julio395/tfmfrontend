import React, { useState, useEffect } from 'react';
import { Box, Typography, TextField, Button, Slider, Select, MenuItem, FormControl, InputLabel, Paper, Grid, ButtonGroup, IconButton } from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'https://backendtfm.julio.coolify.hgccarlos.es';

// Configuración de Axios
const axiosInstance = axios.create({
    baseURL: API_URL,
    withCredentials: true,
    timeout: 120000,
    headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache',
        'Pragma': 'no-cache'
    }
});

// Interceptor para manejar errores de red
axiosInstance.interceptors.response.use(
    response => response,
    error => {
        console.error('Error en la petición:', {
            message: error.message,
            response: error.response?.data,
            status: error.response?.status,
            code: error.code,
            stack: error.stack
        });
        
        if (error.code === 'ECONNABORTED') {
            return Promise.reject(new Error('El servidor está tardando demasiado en responder. Por favor, intente nuevamente.'));
        }
        if (error.code === 'ERR_NETWORK') {
            return Promise.reject(new Error('No se pudo conectar con el servidor. Por favor, verifica tu conexión.'));
        }
        if (error.response) {
            return Promise.reject(new Error(error.response.data.error || 'Error en el servidor'));
        }
        return Promise.reject(error);
    }
);

const AuditoriaCuestionario = ({ onCancel, userData }) => {
    const [activos, setActivos] = useState([]);
    const [categorias, setCategorias] = useState([]);
    const [respuestas, setRespuestas] = useState({});
    const [modelos, setModelos] = useState({});
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [guardadoCategoria, setGuardadoCategoria] = useState({});
    const [borradoresCargados, setBorradoresCargados] = useState(false);
    const [mostrarConfirmacion, setMostrarConfirmacion] = useState(false);
    const [procesadoIA, setProcesadoIA] = useState(false);
    const [auditoriaId, setAuditoriaId] = useState(null);

    // Inicializar respuestas para cada categoría
    useEffect(() => {
        if (categorias.length > 0 && !borradoresCargados) {
            const respuestasIniciales = {};
            categorias.forEach(categoria => {
                respuestasIniciales[categoria] = {
                    cantidad: 0,
                    detalles: []
                };
            });
            setRespuestas(respuestasIniciales);
        }
    }, [categorias]);

    // Cargar respuestas guardadas de la auditoría actual
    useEffect(() => {
        const cargarRespuestasAuditoria = async () => {
            if (!userData || !userData.$id || !categorias.length) return;

            try {
                // Primero intentamos obtener la auditoría en progreso del usuario
                const response = await axios.get(`${API_URL}/api/auditoria/en-progreso/${userData.$id}`);
                
                if (response.data && response.data._id) {
                    setAuditoriaId(response.data._id);
                    if (response.data.respuestas) {
                        // Asegurarnos de que todas las categorías tengan una estructura válida
                        const respuestasActualizadas = { ...response.data.respuestas };
                        categorias.forEach(categoria => {
                            if (!respuestasActualizadas[categoria]) {
                                respuestasActualizadas[categoria] = {
                                    cantidad: 0,
                                    detalles: []
                                };
                            }
                        });
                        setRespuestas(respuestasActualizadas);
                        
                        // Marcar SOLO las categorías que tienen datos guardados
                        const nuevoGuardadoCategoria = {};
                        Object.entries(respuestasActualizadas).forEach(([categoria, datos]) => {
                            if (datos.cantidad > 0) {
                                nuevoGuardadoCategoria[categoria] = {
                                    guardado: true,
                                    timestamp: response.data.ultimaModificacion || new Date().toISOString()
                                };
                            }
                        });
                        setGuardadoCategoria(nuevoGuardadoCategoria);
                    }
                }
                setBorradoresCargados(true);
            } catch (error) {
                console.error('Error al cargar respuestas guardadas:', error);
            }
        };

        cargarRespuestasAuditoria();
    }, [userData, categorias]);

    // Verificar datos del usuario al inicio
    useEffect(() => {
        if (!userData) {
            setError('No hay datos de usuario disponibles');
            setLoading(false);
            return;
        }

        console.log('Datos del usuario recibidos:', userData);
        console.log('ID del usuario:', userData.$id);
        console.log('Estructura completa de userData:', JSON.stringify(userData, null, 2));
    }, [userData]);

    // Función para verificar la conexión al backend
    const verificarConexionBackend = async () => {
        try {
            const response = await axios.get(`${API_URL}/api/health`, {
                timeout: 30000,
                validateStatus: function (status) {
                    return true;
                }
            });
            
            if (response.status !== 200 || response.data.status === 'error') {
                throw new Error(response.data.error || 'Error al verificar el estado del servidor');
            }
            
            return true;
        } catch (error) {
            console.error('Error al verificar conexión con el backend:', error);
            throw error;
        }
    };

    // Modificar la función fetchActivos para incluir verificación de conexión
    const fetchActivos = async () => {
        try {
            setLoading(true);
            setError(null);
            
            // Verificar conexión al backend primero
            await verificarConexionBackend();
            
            // Obtener los activos
            console.log('Intentando obtener activos...');
            const activosResponse = await axiosInstance.get('/api/tfm/Activos/all', { 
                timeout: 120000
            });

            if (!activosResponse.data || !Array.isArray(activosResponse.data)) {
                throw new Error('Formato de datos inválido recibido del servidor');
            }

            // Filtrar activos que tengan categoría
            const activosFiltrados = activosResponse.data.filter(activo => activo && activo.Categoría);
            
            if (activosFiltrados.length === 0) {
                throw new Error('No se encontraron activos con categoría en la base de datos');
            }

            console.log('Activos obtenidos:', activosFiltrados.length);
            setActivos(activosFiltrados);
            
            // Extraer categorías únicas
            const categoriasUnicas = [...new Set(activosFiltrados.map(activo => activo.Categoría))];
            
            if (categoriasUnicas.length === 0) {
                throw new Error('No se encontraron categorías en los activos');
            }

            setCategorias(categoriasUnicas);
            setLoading(false);
        } catch (error) {
            console.error('Error al cargar activos:', error);
            setError(error.message || 'Error al cargar los activos. Por favor, intente nuevamente.');
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchActivos();
    }, []);

    const handleCantidadChange = (categoria, cantidad) => {
        const nuevaCantidad = parseInt(cantidad) || 0;
        setRespuestas(prev => {
            const detallesPrevios = prev[categoria]?.detalles || [];
            let nuevosDetalles = [];
            if (nuevaCantidad > detallesPrevios.length) {
                // Mantener los existentes y añadir nuevos vacíos
                nuevosDetalles = [
                    ...detallesPrevios,
                    ...Array(nuevaCantidad - detallesPrevios.length).fill({
                        nombre: '',
                        proveedor: '',
                        version: '',
                        ubicacion: ''
                    })
                ];
            } else {
                // Reducir la lista manteniendo los primeros elementos
                nuevosDetalles = detallesPrevios.slice(0, nuevaCantidad);
            }
            return {
                ...prev,
                [categoria]: {
                    cantidad: nuevaCantidad,
                    detalles: nuevosDetalles
                }
            };
        });
    };

    const handleDetalleChange = (categoria, index, field, value) => {
        setRespuestas(prev => {
            const detalles = [...prev[categoria].detalles];
            detalles[index] = {
                ...detalles[index],
                [field]: value
            };
            return {
                ...prev,
                [categoria]: {
                    ...prev[categoria],
                    detalles
                }
            };
        });
    };

    const handleGuardarCategoria = async (categoria) => {
        try {
            const datosCategoria = {
                categoria,
                respuestas: respuestas[categoria],
                userId: userData.$id
            };

            if (auditoriaId) {
                // Actualizar auditoría existente
                await axios.put(`${API_URL}/api/auditoria/${auditoriaId}/categoria`, datosCategoria);
            } else {
                // Crear nueva auditoría
                const response = await axios.post(`${API_URL}/api/auditoria`, datosCategoria);
                setAuditoriaId(response.data._id);
            }

            setGuardadoCategoria(prev => ({
                ...prev,
                [categoria]: {
                    guardado: true,
                    timestamp: new Date().toISOString()
                }
            }));
        } catch (error) {
            console.error('Error al guardar categoría:', error);
            setError('Error al guardar los datos. Por favor, intente nuevamente.');
        }
    };

    const handleSubmit = async () => {
        try {
            setLoading(true);
            setError(null);

            // Verificar que todas las categorías tengan datos
            const categoriasSinDatos = categorias.filter(categoria => {
                const datosCategoria = respuestas[categoria];
                return !datosCategoria || datosCategoria.cantidad === 0;
            });

            if (categoriasSinDatos.length > 0) {
                setError(`Por favor, complete los datos para las siguientes categorías: ${categoriasSinDatos.join(', ')}`);
                setLoading(false);
                return;
            }

            // Enviar datos al backend
            const response = await axios.post(`${API_URL}/api/auditoria/procesar`, {
                userId: userData.$id,
                respuestas
            });

            if (response.data.success) {
                setProcesadoIA(true);
                setMostrarConfirmacion(true);
            } else {
                setError('Error al procesar la auditoría. Por favor, intente nuevamente.');
            }
        } catch (error) {
            console.error('Error al enviar auditoría:', error);
            setError('Error al procesar la auditoría. Por favor, intente nuevamente.');
        } finally {
            setLoading(false);
        }
    };

    const handleTerminar = () => {
        setMostrarConfirmacion(true);
    };

    const handleConfirmarFinalizacion = (confirmado) => {
        if (confirmado) {
            onCancel();
        }
        setMostrarConfirmacion(false);
    };

    const handleCancel = () => {
        setMostrarConfirmacion(true);
    };

    const handleEliminarActivo = (categoria, index) => {
        setRespuestas(prev => {
            const detalles = [...prev[categoria].detalles];
            detalles.splice(index, 1);
            return {
                ...prev,
                [categoria]: {
                    ...prev[categoria],
                    cantidad: detalles.length,
                    detalles
                }
            };
        });
    };

    if (loading) {
        return (
            <Box sx={{ p: 3, textAlign: 'center' }}>
                <Typography>Cargando activos...</Typography>
            </Box>
        );
    }

    if (error) {
        return (
            <Box sx={{ p: 3, textAlign: 'center' }}>
                <Typography color="error">{error}</Typography>
                <Button onClick={() => window.location.reload()} sx={{ mt: 2 }}>
                    Reintentar
                </Button>
            </Box>
        );
    }

    return (
        <Box sx={{ p: 3 }}>
            <Typography variant="h5" gutterBottom>
                Auditoría de Activos
            </Typography>
            {categorias.map(categoria => (
                <Paper key={categoria} sx={{ p: 2, mb: 2 }}>
                    <Typography variant="h6" gutterBottom>
                        {categoria}
                    </Typography>
                    <Grid container spacing={2}>
                        <Grid item xs={12}>
                            <FormControl fullWidth>
                                <InputLabel>Cantidad de Activos</InputLabel>
                                <Select
                                    value={respuestas[categoria]?.cantidad || 0}
                                    onChange={(e) => handleCantidadChange(categoria, e.target.value)}
                                >
                                    {[...Array(11)].map((_, i) => (
                                        <MenuItem key={i} value={i}>{i}</MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                        </Grid>
                        {respuestas[categoria]?.detalles.map((detalle, index) => (
                            <Grid item xs={12} key={index}>
                                <Paper sx={{ p: 2 }}>
                                    <Grid container spacing={2}>
                                        <Grid item xs={12} sm={6}>
                                            <FormControl fullWidth>
                                                <InputLabel>Nombre del Activo</InputLabel>
                                                <Select
                                                    value={detalle.nombre}
                                                    onChange={(e) => handleDetalleChange(categoria, index, 'nombre', e.target.value)}
                                                >
                                                    {modelos[categoria]?.nombres.map((modelo, i) => (
                                                        <MenuItem key={i} value={modelo.nombre}>
                                                            {modelo.nombre}
                                                        </MenuItem>
                                                    ))}
                                                </Select>
                                            </FormControl>
                                        </Grid>
                                        <Grid item xs={12} sm={6}>
                                            <FormControl fullWidth>
                                                <InputLabel>Proveedor</InputLabel>
                                                <Select
                                                    value={detalle.proveedor}
                                                    onChange={(e) => handleDetalleChange(categoria, index, 'proveedor', e.target.value)}
                                                >
                                                    {modelos[categoria]?.proveedores.map((proveedor, i) => (
                                                        <MenuItem key={i} value={proveedor}>
                                                            {proveedor}
                                                        </MenuItem>
                                                    ))}
                                                </Select>
                                            </FormControl>
                                        </Grid>
                                        <Grid item xs={12} sm={6}>
                                            <TextField
                                                fullWidth
                                                label="Versión"
                                                value={detalle.version}
                                                onChange={(e) => handleDetalleChange(categoria, index, 'version', e.target.value)}
                                            />
                                        </Grid>
                                        <Grid item xs={12} sm={6}>
                                            <TextField
                                                fullWidth
                                                label="Ubicación"
                                                value={detalle.ubicacion}
                                                onChange={(e) => handleDetalleChange(categoria, index, 'ubicacion', e.target.value)}
                                            />
                                        </Grid>
                                        <Grid item xs={12}>
                                            <Button
                                                variant="outlined"
                                                color="error"
                                                startIcon={<DeleteIcon />}
                                                onClick={() => handleEliminarActivo(categoria, index)}
                                            >
                                                Eliminar Activo
                                            </Button>
                                        </Grid>
                                    </Grid>
                                </Paper>
                            </Grid>
                        ))}
                        <Grid item xs={12}>
                            <Button
                                variant="contained"
                                color="primary"
                                onClick={() => handleGuardarCategoria(categoria)}
                                disabled={guardadoCategoria[categoria]?.guardado}
                            >
                                {guardadoCategoria[categoria]?.guardado ? 'Guardado' : 'Guardar Categoría'}
                            </Button>
                        </Grid>
                    </Grid>
                </Paper>
            ))}
            <Box sx={{ mt: 3, display: 'flex', justifyContent: 'space-between' }}>
                <Button
                    variant="outlined"
                    color="secondary"
                    onClick={handleCancel}
                >
                    Cancelar
                </Button>
                <Button
                    variant="contained"
                    color="primary"
                    onClick={handleSubmit}
                    disabled={loading}
                >
                    Finalizar Auditoría
                </Button>
            </Box>
        </Box>
    );
};

export default AuditoriaCuestionario; 