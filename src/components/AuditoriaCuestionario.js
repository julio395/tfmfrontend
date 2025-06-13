import React, { useState, useEffect } from 'react';
import { Box, Typography, TextField, Button, Slider, Select, MenuItem, FormControl, InputLabel, Paper, Grid, ButtonGroup, IconButton } from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'https://backendtfm.julio.coolify.hgccarlos.es';

// Configuración de Axios
const axiosInstance = axios.create({
    baseURL: API_URL,
    withCredentials: true,
    timeout: 15000, // Aumentamos el timeout a 15 segundos
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
        if (error.code === 'ECONNABORTED') {
            console.error('La petición ha excedido el tiempo de espera');
            return Promise.reject(new Error('La petición ha excedido el tiempo de espera. Por favor, intente nuevamente.'));
        }
        if (error.code === 'ERR_NETWORK') {
            console.error('Error de red:', error);
            return Promise.reject(new Error('No se pudo conectar con el servidor. Por favor, verifica tu conexión.'));
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

    useEffect(() => {
        const fetchActivos = async () => {
            try {
                setLoading(true);
                setError(null);
                
                console.log('Iniciando verificación de conexión con el backend...');
                
                // Primero verificamos que el backend esté respondiendo
                try {
                    console.log('Verificando disponibilidad del backend...');
                    const healthCheck = await axios.get(`${API_URL}/api/health`, { timeout: 5000 });
                    console.log('Estado del backend:', healthCheck.data);
                } catch (healthError) {
                    console.error('Error al verificar el backend:', healthError);
                    throw new Error('El servidor no está respondiendo. Por favor, contacte al administrador.');
                }

                // Verificar la conexión con MongoDB
                try {
                    console.log('Verificando conexión con MongoDB...');
                    const mongoStatus = await axiosInstance.get('/api/mongodb-status', { timeout: 5000 });
                    console.log('Estado de MongoDB:', mongoStatus.data);
                    
                    if (!mongoStatus.data || mongoStatus.data.status !== 'connected') {
                        throw new Error('No se pudo conectar con la base de datos. Por favor, contacte al administrador.');
                    }
                } catch (mongoError) {
                    console.error('Error detallado al verificar MongoDB:', {
                        message: mongoError.message,
                        response: mongoError.response?.data,
                        status: mongoError.response?.status,
                        code: mongoError.code
                    });
                    throw new Error('No se pudo verificar la conexión con la base de datos. Por favor, contacte al administrador.');
                }

                // Obtener los activos
                console.log('Intentando obtener activos...');
                const activosResponse = await axiosInstance.get('/api/tfm/Activos/all', { timeout: 10000 });
                console.log('Respuesta de activos recibida:', activosResponse.data);
                
                if (!activosResponse.data || !Array.isArray(activosResponse.data)) {
                    console.error('Formato de respuesta inválido:', activosResponse.data);
                    setError('Formato de datos inválido recibido del servidor');
                    setLoading(false);
                    return;
                }

                // Filtrar activos que tengan categoría
                const activosFiltrados = activosResponse.data.filter(activo => activo && activo.Categoría);
                
                if (activosFiltrados.length === 0) {
                    console.error('No se encontraron activos con categoría');
                    setError('No se encontraron activos con categoría en la base de datos');
                    setLoading(false);
                    return;
                }

                console.log('Activos obtenidos:', activosFiltrados.length);
                setActivos(activosFiltrados);
                
                // Extraer categorías únicas
                const categoriasUnicas = [...new Set(activosFiltrados.map(activo => activo.Categoría))];
                console.log('Categorías encontradas:', categoriasUnicas);
                
                if (categoriasUnicas.length === 0) {
                    setError('No se encontraron categorías en los activos');
                    setLoading(false);
                    return;
                }

                setCategorias(categoriasUnicas);
                
                // Inicializar respuestas para cada categoría solo si no hay borradores cargados
                if (!borradoresCargados) {
                    const respuestasIniciales = {};
                    categoriasUnicas.forEach(categoria => {
                        respuestasIniciales[categoria] = {
                            cantidad: 0,
                            detalles: []
                        };
                    });
                    setRespuestas(respuestasIniciales);
                }
                
                // Agrupar activos por categoría
                const modelosPorCategoria = {};
                categoriasUnicas.forEach(categoria => {
                    const activosCategoria = activosFiltrados
                        .filter(activo => activo.Categoría === categoria)
                        .map(activo => ({
                            nombre: activo.Nombre || '',
                            proveedor: activo.Proveedor || ''
                        }));

                    // Eliminar duplicados de nombres y mantener sus proveedores correspondientes
                    const nombresUnicos = [...new Set(activosCategoria.map(activo => activo.nombre))]
                        .filter(nombre => nombre)
                        .map(nombre => {
                            const activo = activosCategoria.find(a => a.nombre === nombre);
                            return {
                                nombre: nombre,
                                proveedor: activo?.proveedor || ''
                            };
                        });

                    // Obtener proveedores únicos de los activos filtrados
                    const proveedoresUnicos = [...new Set(activosCategoria
                        .filter(activo => activo.proveedor)
                        .map(activo => activo.proveedor))];

                    modelosPorCategoria[categoria] = {
                        nombres: nombresUnicos,
                        proveedores: proveedoresUnicos
                    };
                });
                setModelos(modelosPorCategoria);
                
                setLoading(false);
            } catch (error) {
                console.error('Error detallado al cargar activos:', {
                    message: error.message,
                    response: error.response?.data,
                    status: error.response?.status,
                    code: error.code,
                    stack: error.stack
                });
                
                if (error.message.includes('Timeout')) {
                    setError('El servidor está tardando demasiado en responder. Por favor, intente nuevamente más tarde.');
                } else if (error.message.includes('no está respondiendo')) {
                    setError('El servidor no está respondiendo. Por favor, contacte al administrador.');
                } else if (error.response) {
                    console.error('Respuesta del servidor:', error.response.data);
                    console.error('Estado:', error.response.status);
                    if (error.response.data.error && error.response.data.error.includes('listCollections')) {
                        setError('Error de conexión con la base de datos. Por favor, contacte al administrador.');
                    } else {
                        setError(`Error del servidor: ${error.response.data.message || 'Error al cargar los activos'}`);
                    }
                } else if (error.request) {
                    console.error('No se recibió respuesta del servidor');
                    setError('No se pudo conectar con el servidor. Por favor, verifica tu conexión.');
                } else {
                    console.error('Error:', error.message);
                    setError(error.message || 'Error al cargar los activos. Por favor, intente nuevamente.');
                }
                setLoading(false);
            }
        };

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