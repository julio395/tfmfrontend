import React, { useState, useEffect } from 'react';
import { Box, Typography, TextField, Button, Slider, Select, MenuItem, FormControl, InputLabel, Paper, Grid, ButtonGroup, IconButton, FormControlLabel, Radio, CircularProgress, Dialog, DialogTitle, DialogContent, DialogActions, Container, Snackbar, Alert } from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import SaveIcon from '@mui/icons-material/Save';
import AddIcon from '@mui/icons-material/Add';
import { MONGODB_API_URL } from '../appwrite/appwrite';

// Configuración de Axios
const axiosInstance = axios.create({
    baseURL: MONGODB_API_URL,
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
            if (error.response.status === 401) {
                return Promise.reject(new Error('Sesión expirada. Por favor, vuelve a iniciar sesión.'));
            }
            if (error.response.status === 403) {
                return Promise.reject(new Error('No tienes permisos para realizar esta acción.'));
            }
            if (error.response.status === 503) {
                return Promise.reject(new Error('El servidor está temporalmente no disponible. Por favor, intente más tarde.'));
            }
            return Promise.reject(new Error(error.response.data.error || 'Error en el servidor'));
        }
        return Promise.reject(error);
    }
);

const AuditoriaCuestionario = ({ onCancel, userData }) => {
    const navigate = useNavigate();
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
    const [success, setSuccess] = useState(null);
    const [dialogoConfirmacion, setDialogoConfirmacion] = useState(false);
    const [auditoriaTerminada, setAuditoriaTerminada] = useState(false);
    const [auditoriaFinalizada, setAuditoriaFinalizada] = useState(false);
    const [mensaje, setMensaje] = useState({
        texto: '',
        tipo: '',
        visible: false
    });

    // Obtener userData de la ventana si no se proporciona como prop
    const userDataFinal = userData || window.userData;
    // Obtener onCancel de la ventana si no se proporciona como prop
    const onCancelFinal = onCancel || window.onCancel;

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
        if (!categorias || categorias.length === 0) {
            console.log('Esperando a que las categorías estén listas antes de cargar/crear auditoría...');
            return;
        }
        const cargarRespuestasAuditoria = async () => {
            if (!userDataFinal || !userDataFinal.$id) {
                console.log('No hay datos de usuario disponibles');
                return;
            }
            console.log('Disparando efecto de cargar/crear auditoría con categorías:', categorias);
            try {
                // Obtener la auditoría en progreso del usuario
                console.log('Buscando auditoría en progreso para usuario:', userDataFinal.$id);
                const response = await axiosInstance.get(`/api/auditoria/en-progreso/${userDataFinal.$id}`);
                console.log('Respuesta al buscar auditoría:', response.data);
                
                if (!response.data || !response.data._id) {
                    throw { response: { status: 404 } };
                }
                setAuditoriaId(response.data._id);
                if (response.data.finalizada) {
                    setAuditoriaTerminada(true);
                    setAuditoriaFinalizada(response.data.auditoriaFinalizada || false);
                }
                if (response.data.respuestas) {
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
                setBorradoresCargados(true);
            } catch (error) {
                console.log('Entrando al catch de cargarRespuestasAuditoria. Error:', error);
                
                // Crear nueva auditoría si no existe una en progreso
                try {
                    const nuevaAuditoria = {
                        respuestas: {},
                        cliente: {
                            id: userDataFinal.$id,
                            nombre: userDataFinal.name || 'Usuario'
                        },
                        estado: 'en_progreso',
                        fechaCreacion: new Date().toISOString(),
                        ultimaModificacion: new Date().toISOString(),
                        finalizada: false,
                        auditoriaFinalizada: false,
                        procesadoIA: false
                    };
                    console.log('Creando nueva auditoría:', nuevaAuditoria);
                    const createResponse = await axiosInstance.post('/api/auditoria/en-progreso', nuevaAuditoria, {
                        headers: {
                            'Content-Type': 'application/json'
                        }
                    });
                    console.log('Respuesta al crear auditoría:', createResponse.data);
                    
                    if (createResponse.data && createResponse.data._id) {
                        setAuditoriaId(createResponse.data._id);
                        const respuestasIniciales = {};
                        categorias.forEach(categoria => {
                            respuestasIniciales[categoria] = {
                                cantidad: 0,
                                detalles: []
                            };
                        });
                        setRespuestas(respuestasIniciales);
                        setBorradoresCargados(true);
                        setError(null);
                        console.log('Auditoría creada y estados actualizados correctamente');
                    } else {
                        console.error('La respuesta no contiene ID de auditoría:', createResponse.data);
                        setError('Error al iniciar la auditoría. Por favor, intente nuevamente.');
                    }
                } catch (createError) {
                    console.error('Error al crear nueva auditoría:', createError);
                    if (createError.response) {
                        console.error('Datos de error del servidor:', createError.response.data);
                    }
                    setError('Error al iniciar la auditoría. Por favor, intente nuevamente.');
                }
            }
        };
        cargarRespuestasAuditoria();
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [userDataFinal, categorias]);

    // Verificar datos del usuario al inicio
    useEffect(() => {
        if (!userDataFinal) {
            setError('No hay datos de usuario disponibles');
            setLoading(false);
            return;
        }

        console.log('Datos del usuario recibidos:', userDataFinal);
        console.log('ID del usuario:', userDataFinal.$id);
        console.log('Estructura completa de userData:', JSON.stringify(userDataFinal, null, 2));
    }, [userDataFinal]);

    // Función para verificar la conexión con el backend
    const verificarConexionBackend = async () => {
        try {
            console.log('Verificando conexión con el backend...');
            const response = await axiosInstance.get('/api/health');
            console.log('Respuesta del backend:', response.data);
            return true;
        } catch (error) {
            console.error('Error en la petición:', error);
            if (error.response) {
                console.error('Detalles del error:', {
                    status: error.response.status,
                    data: error.response.data
                });
            }
            throw new Error('El servidor está temporalmente no disponible. Por favor, intente más tarde.');
        }
    };

    // Función para obtener los activos
    const fetchActivos = async () => {
        try {
            console.log('Iniciando verificación de conexión...');
            await verificarConexionBackend();
            console.log('Conexión verificada, obteniendo activos...');
            
            const response = await axiosInstance.get('/api/tfm/Activos/all');
            console.log('Respuesta de activos:', response.data);
            
            if (!response.data || !Array.isArray(response.data)) {
                console.error('Formato de respuesta inválido:', response.data);
                throw new Error('Formato de respuesta inválido del servidor');
            }
            
            return response.data;
        } catch (error) {
            console.error('Error al cargar activos:', error);
            if (error.response) {
                console.error('Detalles del error:', {
                    status: error.response.status,
                    data: error.response.data
                });
            }
            throw new Error('Error al cargar los activos. Por favor, intente más tarde.');
        }
    };

    useEffect(() => {
        fetchActivos();
    }, []);

    // Función para obtener nombres únicos de activos por categoría
    const getNombresActivos = (categoria) => {
        const nombresUnicos = [...new Set(
            activos
                .filter(activo => activo.Categoría === categoria)
                .map(activo => activo.Nombre)
        )];
        return nombresUnicos;
    };

    // Función para obtener proveedores únicos de activos por categoría
    const getProveedoresActivos = (categoria) => {
        const proveedoresUnicos = [...new Set(
            activos
                .filter(activo => activo.Categoría === categoria)
                .map(activo => activo.Proveedor)
        )];
        return proveedoresUnicos;
    };

    const handleCantidadChange = (categoria, nuevaCantidad) => {
        setRespuestas(prev => {
            const detallesPrevios = prev[categoria]?.detalles || [];
            let nuevosDetalles;

            if (nuevaCantidad > detallesPrevios.length) {
                // Añadir nuevos elementos si se aumenta la cantidad
                nuevosDetalles = [
                    ...detallesPrevios,
                    ...Array(nuevaCantidad - detallesPrevios.length).fill({
                        nombre: '',
                        proveedor: '',
                        criticidad: 3,
                        securizacion: ''
                    })
                ];
            } else {
                // Recortar si se reduce la cantidad
                nuevosDetalles = detallesPrevios.slice(0, nuevaCantidad);
            }

            return {
                ...prev,
                [categoria]: {
                    ...prev[categoria],
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
            if (!userDataFinal || !userDataFinal.$id) {
                throw new Error('No hay datos de usuario disponibles');
            }

            // Verificar que tenemos un ID de auditoría
            if (!auditoriaId) {
                throw new Error('No hay una auditoría activa');
            }

            // Preparar los datos a guardar
            const datosCategoria = {
                respuestas: {
                    ...respuestas,
                    [categoria]: respuestas[categoria]
                },
                cliente: {
                    id: userDataFinal.$id,
                    nombre: userDataFinal.name || 'Usuario'
                },
                ultimaModificacion: new Date().toISOString()
            };

            // Actualizar la auditoría en la base de datos
            const response = await axios.put(
                `${MONGODB_API_URL}/api/auditoria/${auditoriaId}`,
                datosCategoria,
                {
                    headers: {
                        'Content-Type': 'application/json'
                    }
                }
            );

            if (response.data) {
                // Actualizar el estado local
                setGuardadoCategoria(prev => ({
                    ...prev,
                    [categoria]: {
                        guardado: true,
                        timestamp: new Date().toISOString()
                    }
                }));

                setMensaje({
                    texto: `Categoría ${categoria} guardada correctamente`,
                    tipo: 'success',
                    visible: true
                });

                // Ocultar el mensaje después de 3 segundos
                setTimeout(() => {
                    setMensaje(prev => ({ ...prev, visible: false }));
                }, 3000);
            }
        } catch (error) {
            console.error('Error al guardar la categoría:', error);
            setMensaje({
                texto: error.message || 'Error al guardar la categoría',
                tipo: 'error',
                visible: true
            });
        }
    };

    const handleConfirmarFinalizacion = async () => {
        try {
            if (!userDataFinal || !userDataFinal.$id) {
                throw new Error('No hay datos de usuario disponibles');
            }

            if (!auditoriaId) {
                throw new Error('No hay una auditoría activa');
            }

            // Preparar los datos finales
            const datosFinales = {
                respuestas: respuestas,
                cliente: {
                    id: userDataFinal.$id,
                    nombre: userDataFinal.name || 'Usuario'
                },
                estado: 'finalizada',
                fechaFinalizacion: new Date().toISOString(),
                ultimaModificacion: new Date().toISOString(),
                finalizada: true,
                auditoriaFinalizada: true,
                procesadoIA: false,
                metadata: {
                    auditoriaFinalizada: true,
                    fechaFinalizacion: new Date().toISOString()
                }
            };

            console.log('Enviando datos para finalizar auditoría:', datosFinales);

            // Actualizar la auditoría en la base de datos
            const response = await axios.put(
                `${MONGODB_API_URL}/api/auditoria/${auditoriaId}`,
                datosFinales,
                {
                    headers: {
                        'Content-Type': 'application/json'
                    }
                }
            );

            if (response.data) {
                // Verificar que los datos se guardaron correctamente
                console.log('Respuesta del servidor:', response.data);
                
                setAuditoriaTerminada(true);
                setAuditoriaFinalizada(true);
                // Añadir campo oculto al formulario
                const finalizadaInput = document.createElement('input');
                finalizadaInput.type = 'hidden';
                finalizadaInput.name = 'auditoria_finalizada';
                finalizadaInput.value = 'true';
                document.querySelector('form')?.appendChild(finalizadaInput);

                setMensaje({
                    texto: 'Auditoría finalizada correctamente',
                    tipo: 'success',
                    visible: true
                });

                // Ocultar el mensaje después de 3 segundos
                setTimeout(() => {
                    setMensaje(prev => ({ ...prev, visible: false }));
                }, 3000);

                // Cerrar el diálogo de confirmación
                setDialogoConfirmacion(false);

                // Redirigir a la página de resultados después de un breve delay
                setTimeout(() => {
                    navigate('/user');
                }, 2000);
            }
        } catch (error) {
            console.error('Error al finalizar la auditoría:', error);
            setMensaje({
                texto: error.message || 'Error al finalizar la auditoría',
                tipo: 'error',
                visible: true
            });
            setDialogoConfirmacion(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setDialogoConfirmacion(true);
    };

    const handleCancel = () => {
        navigate('/user');
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
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
                <CircularProgress />
            </Box>
        );
    }

    if (error) {
        return (
            <Box sx={{ p: 3 }}>
                <Typography color="error" gutterBottom>
                    {error}
                </Typography>
                <Button 
                    variant="contained" 
                    onClick={() => {
                        setError(null);
                        setLoading(true);
                        fetchActivos();
                    }}
                    sx={{ mt: 2 }}
                >
                    Reintentar
                </Button>
            </Box>
        );
    }

    return (
        <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
            <Box sx={{ 
                position: 'fixed', 
                top: '20px', 
                left: '50%', 
                transform: 'translateX(-50%)', 
                zIndex: 1000,
                width: 'auto',
                minWidth: '300px'
            }}>
                <Snackbar
                    open={mensaje.visible}
                    autoHideDuration={3000}
                    onClose={() => setMensaje(prev => ({ ...prev, visible: false }))}
                    anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
                >
                    <Alert 
                        severity={mensaje.tipo} 
                        sx={{ 
                            width: '100%',
                            boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
                            '& .MuiAlert-message': {
                                fontSize: '1rem',
                                fontWeight: 'medium'
                            }
                        }}
                    >
                        {mensaje.texto}
                    </Alert>
                </Snackbar>
            </Box>
            <Box sx={{ display: 'flex', justifyContent: 'center', mb: 4 }}>
                <Typography 
                    variant="h4" 
                    component="h1" 
                    sx={{ 
                        color: '#1976d2',
                        textAlign: 'center',
                        borderBottom: '2px solid #1976d2',
                        pb: 1,
                        fontWeight: 'bold'
                    }}
                >
                    Auditoría de activos
                </Typography>
            </Box>
            <form onSubmit={handleSubmit}>
                {categorias.map((categoria) => (
                    <Paper 
                        key={categoria} 
                        elevation={3} 
                        sx={{ 
                            p: 3, 
                            mb: 3, 
                            backgroundColor: '#ffffff',
                            borderRadius: '8px'
                        }}
                    >
                        <Box sx={{ mb: 4 }}>
                            <Box sx={{ 
                                display: 'flex', 
                                justifyContent: 'flex-end', 
                                alignItems: 'center',
                                mb: 2
                            }}>
                                <Typography 
                                    variant="h4" 
                                    sx={{ 
                                        color: '#1976d2',
                                        textAlign: 'left',
                                        borderBottom: '2px solid #1976d2',
                                        pb: 1,
                                        fontWeight: 'bold',
                                        flex: 1
                                    }}
                                >
                                    {categoria}
                                </Typography>
                                {!auditoriaTerminada && (
                                    <Button
                                        variant="contained"
                                        onClick={() => handleGuardarCategoria(categoria)}
                                        sx={{ 
                                            backgroundColor: '#FFB6A3',
                                            color: '#666',
                                            padding: '4px 6px',
                                            minWidth: 'auto',
                                            width: 'fit-content',
                                            '&:hover': {
                                                backgroundColor: '#FFA38C'
                                            }
                                        }}
                                    >
                                        Guardar Categoría
                                    </Button>
                                )}
                            </Box>
                            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2, gap: 1 }}>
                                <Typography 
                                    variant="subtitle1" 
                                    sx={{ 
                                        color: '#666',
                                        textAlign: 'left',
                                        fontStyle: 'italic'
                                    }}
                                >
                                    ¿Cuántos activos {categoria.toLowerCase()} tienes?
                                </Typography>
                                <TextField
                                    type="number"
                                    value={respuestas[categoria]?.cantidad || 0}
                                    onChange={(e) => handleCantidadChange(categoria, parseInt(e.target.value) || 0)}
                                    disabled={auditoriaTerminada}
                                    InputProps={{ 
                                        inputProps: { 
                                            min: 0,
                                            style: { 
                                                fontSize: '1.1rem',
                                                fontWeight: 'bold',
                                                textAlign: 'center',
                                                padding: '4px 8px',
                                                width: '100%',
                                                color: '#666'
                                            }
                                        },
                                        sx: { 
                                            backgroundColor: '#ffffff',
                                            borderRadius: '4px',
                                            '&:hover': {
                                                backgroundColor: '#f5f5f5'
                                            }
                                        }
                                    }}
                                    sx={{ 
                                        width: '80px',
                                        '& .MuiOutlinedInput-root': {
                                            '& fieldset': {
                                                borderColor: '#666',
                                            },
                                            '&:hover fieldset': {
                                                borderColor: '#666',
                                            },
                                            '&.Mui-focused fieldset': {
                                                borderColor: '#666',
                                            }
                                        }
                                    }}
                                />
                            </Box>
                            {respuestas[categoria]?.detalles.map((detalle, detalleIndex) => (
                                <Box 
                                    key={detalleIndex} 
                                    sx={{ 
                                        mb: 2, 
                                        p: 2, 
                                        border: '1px solid #e0e0e0', 
                                        borderRadius: '4px',
                                        backgroundColor: '#fafafa',
                                        position: 'relative'
                                    }}
                                >
                                    <Box sx={{ 
                                        display: 'flex', 
                                        justifyContent: 'space-between', 
                                        alignItems: 'center',
                                        mb: 2
                                    }}>
                                        <Typography 
                                            variant="subtitle1" 
                                            sx={{ 
                                                color: '#1976d2',
                                                textAlign: 'left',
                                                borderBottom: '2px solid #1976d2',
                                                pb: 1,
                                                fontWeight: 'bold'
                                            }}
                                        >
                                            Activo {categoria} {detalleIndex + 1}
                                        </Typography>
                                        {!auditoriaTerminada && (
                                            <IconButton
                                                onClick={() => handleEliminarActivo(categoria, detalleIndex)}
                                                color="error"
                                                size="small"
                                                sx={{ 
                                                    border: '1px solid #d32f2f',
                                                    color: '#d32f2f',
                                                    width: '28px',
                                                    height: '28px',
                                                    minWidth: '28px',
                                                    padding: '4px',
                                                    '&:hover': {
                                                        borderColor: '#b71c1c',
                                                        backgroundColor: 'rgba(211, 47, 47, 0.04)'
                                                    }
                                                }}
                                            >
                                                <DeleteIcon fontSize="small" />
                                            </IconButton>
                                        )}
                                    </Box>
                                    <Grid container spacing={2}>
                                        <Grid item xs={12}>
                                            <Typography 
                                                variant="subtitle1" 
                                                sx={{ 
                                                    color: '#666',
                                                    textAlign: 'left',
                                                    borderBottom: '1px solid #666',
                                                    pb: 0.5,
                                                    mb: 1
                                                }}
                                            >
                                                Nombre
                                            </Typography>
                                            <FormControl fullWidth>
                                                <Select
                                                    value={detalle.nombre || ''}
                                                    onChange={(e) => handleDetalleChange(categoria, detalleIndex, 'nombre', e.target.value)}
                                                    disabled={auditoriaTerminada}
                                                    sx={{ backgroundColor: '#ffffff' }}
                                                >
                                                    {getNombresActivos(categoria).map((nombre) => (
                                                        <MenuItem key={nombre} value={nombre}>
                                                            {nombre}
                                                        </MenuItem>
                                                    ))}
                                                </Select>
                                            </FormControl>
                                        </Grid>
                                        <Grid item xs={12}>
                                            <Typography 
                                                variant="subtitle1" 
                                                sx={{ 
                                                    color: '#666',
                                                    textAlign: 'left',
                                                    borderBottom: '1px solid #666',
                                                    pb: 0.5,
                                                    mb: 1
                                                }}
                                            >
                                                Proveedor
                                            </Typography>
                                            <FormControl fullWidth>
                                                <Select
                                                    value={detalle.proveedor || ''}
                                                    onChange={(e) => handleDetalleChange(categoria, detalleIndex, 'proveedor', e.target.value)}
                                                    disabled={auditoriaTerminada}
                                                    sx={{ backgroundColor: '#ffffff' }}
                                                >
                                                    {getProveedoresActivos(categoria).map((proveedor) => (
                                                        <MenuItem key={proveedor} value={proveedor}>
                                                            {proveedor}
                                                        </MenuItem>
                                                    ))}
                                                </Select>
                                            </FormControl>
                                        </Grid>
                                        <Grid item xs={12}>
                                            <Typography 
                                                variant="subtitle1" 
                                                sx={{ 
                                                    color: '#666',
                                                    textAlign: 'left',
                                                    borderBottom: '1px solid #666',
                                                    pb: 0.5,
                                                    mb: 1
                                                }}
                                            >
                                                Criticidad
                                            </Typography>
                                            <Slider
                                                value={detalle.criticidad || 3}
                                                onChange={(_, value) => handleDetalleChange(categoria, detalleIndex, 'criticidad', value)}
                                                min={1}
                                                max={5}
                                                step={1}
                                                marks={[
                                                    { value: 1, label: '1' },
                                                    { value: 2, label: '2' },
                                                    { value: 3, label: '3' },
                                                    { value: 4, label: '4' },
                                                    { value: 5, label: '5' }
                                                ]}
                                                disabled={auditoriaTerminada}
                                                sx={{
                                                    color: '#666',
                                                    width: '80%',
                                                    mx: 'auto',
                                                    '& .MuiSlider-mark': {
                                                        backgroundColor: '#bfbfbf'
                                                    },
                                                    '& .MuiSlider-markLabel': {
                                                        color: '#666',
                                                        fontSize: '0.875rem'
                                                    }
                                                }}
                                            />
                                        </Grid>
                                        <Grid item xs={12}>
                                            <Typography 
                                                variant="subtitle1" 
                                                sx={{ 
                                                    color: '#666',
                                                    textAlign: 'left',
                                                    borderBottom: '1px solid #666',
                                                    pb: 0.5,
                                                    mb: 1
                                                }}
                                            >
                                                Securización del activo
                                            </Typography>
                                            <TextField
                                                value={detalle.securizacion || ''}
                                                onChange={(e) => handleDetalleChange(categoria, detalleIndex, 'securizacion', e.target.value)}
                                                fullWidth
                                                disabled={auditoriaTerminada}
                                                multiline
                                                rows={4}
                                                sx={{ 
                                                    backgroundColor: '#ffffff',
                                                    '& .MuiOutlinedInput-root': {
                                                        '& fieldset': {
                                                            borderColor: '#666',
                                                        },
                                                        '&:hover fieldset': {
                                                            borderColor: '#666',
                                                        },
                                                        '&.Mui-focused fieldset': {
                                                            borderColor: '#666',
                                                        }
                                                    }
                                                }}
                                            />
                                        </Grid>
                                    </Grid>
                                </Box>
                            ))}
                        </Box>
                    </Paper>
                ))}
                {!auditoriaTerminada && (
                    <Box sx={{ display: 'flex', justifyContent: 'center', gap: 2, mt: 4 }}>
                        <Button
                            variant="outlined"
                            color="error"
                            onClick={handleCancel}
                            size="large"
                            sx={{ 
                                borderColor: '#d32f2f',
                                color: '#d32f2f',
                                '&:hover': {
                                    borderColor: '#b71c1c',
                                    backgroundColor: 'rgba(211, 47, 47, 0.04)'
                                }
                            }}
                        >
                            Cancelar
                        </Button>
                        <Button
                            type="submit"
                            variant="contained"
                            color="primary"
                            size="large"
                            sx={{ 
                                backgroundColor: '#1976d2',
                                '&:hover': {
                                    backgroundColor: '#1565c0'
                                }
                            }}
                        >
                            Finalizar Auditoría
                        </Button>
                    </Box>
                )}
            </form>
            <Dialog
                open={dialogoConfirmacion}
                onClose={() => setDialogoConfirmacion(false)}
                maxWidth="sm"
                fullWidth
            >
                <DialogTitle sx={{ 
                    backgroundColor: '#1976d2', 
                    color: 'white',
                    fontWeight: 'bold'
                }}>
                    Confirmar Finalización
                </DialogTitle>
                <DialogContent sx={{ mt: 2 }}>
                    <Typography>
                        ¿Estás seguro de que deseas finalizar la auditoría? Esta acción no se puede deshacer.
                    </Typography>
                </DialogContent>
                <DialogActions sx={{ p: 2 }}>
                    <Button 
                        onClick={() => setDialogoConfirmacion(false)} 
                        color="error"
                        sx={{ mr: 1 }}
                    >
                        Cancelar
                    </Button>
                    <Button 
                        onClick={() => handleConfirmarFinalizacion()} 
                        color="primary" 
                        variant="contained"
                    >
                        Confirmar
                    </Button>
                </DialogActions>
            </Dialog>
        </Container>
    );
};

export default AuditoriaCuestionario; 