import React, { useState, useEffect } from 'react';
import { Box, Typography, TextField, Button, Slider, Select, MenuItem, FormControl, InputLabel, Paper, Grid, ButtonGroup, IconButton } from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'https://backendtfm.julio.coolify.hgccarlos.es';

// Configuración de Axios
const axiosInstance = axios.create({
    baseURL: API_URL,
    withCredentials: true,
    headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
    }
});

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
                
                console.log('Intentando obtener activos de:', `${API_URL}/api/tfm/Activos/all`);
                
                // Verificar la conexión con MongoDB primero
                const mongoStatus = await axiosInstance.get('/api/mongodb-status');
                if (!mongoStatus.data || mongoStatus.data.status !== 'connected') {
                    throw new Error('No se pudo conectar con la base de datos. Por favor, contacte al administrador.');
                }

                // Obtener los activos
                const response = await axiosInstance.get('/api/tfm/Activos/all');
                
                if (!response.data || !Array.isArray(response.data)) {
                    console.error('Formato de respuesta inválido:', response.data);
                    setError('Formato de datos inválido recibido del servidor');
                    setLoading(false);
                    return;
                }

                // Filtrar activos que tengan categoría
                const activosFiltrados = response.data.filter(activo => activo && activo.Categoría);
                
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
                console.error('Error al cargar activos:', error);
                if (error.response) {
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

    const handleGuardarCategoria = async (categoria) => {
        try {
            if (!userData || !userData.$id) {
                setError('No se encontraron los datos del usuario. Por favor, inicie sesión nuevamente.');
                return;
            }

            const dataToSend = {
                respuestas: {
                    [categoria]: respuestas[categoria]
                },
                cliente: {
                    id: userData.$id,
                    nombre: userData.name,
                    email: userData.email,
                    empresa: userData.empresa || 'No especificada'
                },
                ultimaModificacion: new Date().toISOString()
            };

            let response;
            // Si ya existe una auditoría en progreso, actualizamos
            if (auditoriaId) {
                response = await axios.put(`${API_URL}/api/auditoria/${auditoriaId}`, dataToSend);
            } else {
                // Si no existe, creamos una nueva
                response = await axios.post(`${API_URL}/api/auditoria/en-progreso`, dataToSend);
                if (response.data && response.data._id) {
                    setAuditoriaId(response.data._id);
                }
            }

            // Actualizar SOLO el estado de guardado de la categoría actual
            setGuardadoCategoria(prev => ({
                ...prev,
                [categoria]: {
                    guardado: true,
                    timestamp: new Date().toISOString()
                }
            }));

            // Si la respuesta incluye las respuestas actualizadas, actualizamos el estado
            if (response.data && response.data.respuestas) {
                setRespuestas(prev => ({
                    ...prev,
                    ...response.data.respuestas
                }));
            }

            alert(`Respuestas de ${categoria} guardadas correctamente`);
        } catch (error) {
            console.error('Error al guardar categoría:', error);
            setError(`Error al guardar las respuestas de ${categoria}`);
            alert(`Error al guardar las respuestas de ${categoria}. Por favor, intente nuevamente.`);
        }
    };

    const handleSubmit = async () => {
        try {
            if (!userData || !userData.$id) {
                alert('Error: No se encontraron los datos del usuario. Por favor, inicie sesión nuevamente.');
                return;
            }

            if (!auditoriaId) {
                alert('Error: No se encontró la auditoría en progreso.');
                return;
            }

            const dataToSend = {
                estado: 'completada',
                finalizado: true,
                procesadoIA: false,
                ultimaModificacion: new Date().toISOString()
            };

            const response = await axios.put(`${API_URL}/api/auditoria/${auditoriaId}/finalizar`, dataToSend);
            
            if (response.data) {
                alert('Auditoría finalizada correctamente');
                onCancel();
            } else {
                alert('La auditoría se guardó pero no se recibió confirmación del servidor');
                onCancel();
            }
        } catch (error) {
            if (error.response) {
                const errorMessage = error.response.data?.error || error.response.data?.message || 'Error al finalizar la auditoría';
                alert(`Error del servidor: ${errorMessage}`);
            } else if (error.request) {
                alert('No se pudo conectar con el servidor. Por favor, verifica tu conexión.');
            } else {
                alert('Error al finalizar la auditoría. Por favor, intente nuevamente.');
            }
        }
    };

    const handleTerminar = () => {
        setMostrarConfirmacion(true);
    };

    const handleConfirmarFinalizacion = (confirmado) => {
        setMostrarConfirmacion(false);
        if (confirmado) {
            handleSubmit();
        }
    };

    // Resetear el estado de borradores cargados cuando se cancela
    const handleCancel = () => {
        setBorradoresCargados(false);
        onCancel();
    };

    const handleEliminarActivo = (categoria, index) => {
        setRespuestas(prev => {
            const nuevasRespuestas = { ...prev };
            const detalles = [...nuevasRespuestas[categoria].detalles];
            detalles.splice(index, 1);
            nuevasRespuestas[categoria] = {
                ...nuevasRespuestas[categoria],
                cantidad: nuevasRespuestas[categoria].cantidad - 1,
                detalles: detalles
            };
            return nuevasRespuestas;
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
                <Button 
                    variant="contained" 
                    color="primary" 
                    onClick={() => window.location.reload()}
                    sx={{ mt: 2 }}
                >
                    Reintentar
                </Button>
            </Box>
        );
    }

    if (categorias.length === 0) {
        return (
            <Box sx={{ p: 3, textAlign: 'center' }}>
                <Typography color="error">
                    No se encontraron categorías de activos. Por favor, contacte al administrador.
                </Typography>
            </Box>
        );
    }

    return (
        <Box sx={{ 
            p: 3,
            width: '100%',
            margin: '0 auto'
        }}>
            <Typography 
                variant="h4" 
                sx={{ 
                    mb: 3,
                    textAlign: 'center',
                    fontWeight: 'bold',
                    color: 'primary.main'
                }}
            >
                Auditoría de seguridad
            </Typography>
            
            {categorias.map((categoria, categoriaIndex) => {
                // Asegurarnos de que la categoría tiene una estructura válida
                const categoriaRespuestas = respuestas[categoria] || { cantidad: 0, detalles: [] };
                
                return (
                    <Paper key={`categoria-${categoriaIndex}`} sx={{ p: 3, mb: 3, width: '100%', position: 'relative' }}>
                        <Box sx={{ 
                            display: 'flex', 
                            justifyContent: 'space-between', 
                            alignItems: 'center',
                            mb: 3,
                            position: 'relative'
                        }}>
                            <Typography 
                                variant="h6" 
                                sx={{ 
                                    color: 'primary.main',
                                    fontWeight: 'bold',
                                    fontSize: '1.5rem'
                                }}
                            >
                                {categoria}
                            </Typography>
                            <Button
                                variant="contained"
                                onClick={() => handleGuardarCategoria(categoria)}
                                sx={{ 
                                    backgroundColor: guardadoCategoria[categoria]?.guardado ? '#81c784' : '#ffcc80',
                                    color: guardadoCategoria[categoria]?.guardado ? '#fff' : '#5d4037',
                                    '&:hover': {
                                        backgroundColor: guardadoCategoria[categoria]?.guardado ? '#66bb6a' : '#ffb74d',
                                        color: '#fff'
                                    },
                                    padding: '6px 12px',
                                    width: 'fit-content',
                                    whiteSpace: 'nowrap',
                                    fontSize: '0.875rem',
                                    textTransform: 'none',
                                    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                                    borderRadius: '4px',
                                    position: 'absolute',
                                    right: '24px',
                                    top: '50%',
                                    transform: 'translateY(-50%)'
                                }}
                            >
                                {guardadoCategoria[categoria]?.guardado ? 'Guardado' : 'Guardar Categoría'}
                            </Button>
                        </Box>
                        
                        <Box sx={{ 
                            display: 'flex', 
                            flexDirection: 'column', 
                            gap: 3,
                            width: '100%',
                            minWidth: '600px'
                        }}>
                            <Grid container spacing={3}>
                                <Grid sx={{ width: { xs: '100%', md: '100px' } }}>
                                    <Box sx={{ 
                                        display: 'flex', 
                                        flexDirection: 'row',
                                        alignItems: 'center',
                                        gap: 2
                                    }}>
                                        <Typography 
                                            variant="subtitle1" 
                                            sx={{ 
                                                whiteSpace: 'nowrap',
                                                fontSize: '0.9rem'
                                            }}
                                        >
                                            ¿Cuántos activos de {categoria.toLowerCase()} tiene?
                                        </Typography>
                                        <input
                                            type="number"
                                            value={categoriaRespuestas.cantidad}
                                            onChange={(e) => handleCantidadChange(categoria, e.target.value)}
                                            min="0"
                                            style={{
                                                width: '80px',
                                                height: '45px',
                                                marginLeft: '20px',
                                                padding: '0 14px',
                                                fontSize: '1.2rem',
                                                fontWeight: '500',
                                                textAlign: 'center',
                                                border: '2px solid #1976d2',
                                                borderRadius: '4px',
                                                color: 'black',
                                                backgroundColor: 'white'
                                            }}
                                        />
                                    </Box>
                                </Grid>

                                <Grid sx={{ width: { xs: '100%', md: 'calc(100% - 100px)' } }}>
                                    {categoriaRespuestas.cantidad > 0 && (
                                        <Typography variant="subtitle1" gutterBottom sx={{ mb: 2 }}>
                                            {categoriaRespuestas.cantidad === 1 
                                                ? `Detalles del activo de ${categoria.toLowerCase()}`
                                                : `Detalles de los activos de ${categoria.toLowerCase()}`
                                            }
                                        </Typography>
                                    )}
                                    
                                    {[...Array(categoriaRespuestas.cantidad)].map((_, index) => (
                                        <Paper 
                                            key={`detalle-${categoria}-${index}`} 
                                            sx={{ 
                                                p: 4, 
                                                mb: 3,
                                                width: '100%',
                                                minWidth: '600px',
                                                backgroundColor: 'background.default',
                                                borderRadius: 2,
                                                mx: 'auto',
                                                position: 'relative'
                                            }}
                                        >
                                            <Box sx={{ 
                                                display: 'flex', 
                                                justifyContent: 'space-between', 
                                                alignItems: 'center',
                                                mb: 4
                                            }}>
                                                <Typography 
                                                    variant="h6" 
                                                    sx={{ 
                                                        color: 'primary.main',
                                                        fontWeight: 'medium'
                                                    }}
                                                >
                                                    Activo {categoria} {index + 1}
                                                </Typography>
                                                <IconButton
                                                    color="error"
                                                    onClick={() => handleEliminarActivo(categoria, index)}
                                                    sx={{
                                                        backgroundColor: 'rgba(211, 47, 47, 0.1)',
                                                        '&:hover': {
                                                            backgroundColor: 'rgba(211, 47, 47, 0.2)'
                                                        },
                                                        width: '40px',
                                                        height: '40px',
                                                        borderRadius: '4px',
                                                        border: '1px solid rgba(211, 47, 47, 0.3)',
                                                        '& .MuiSvgIcon-root': {
                                                            fontSize: '20px'
                                                        }
                                                    }}
                                                >
                                                    <DeleteIcon />
                                                </IconButton>
                                            </Box>

                                            <Box sx={{ 
                                                display: 'flex', 
                                                flexDirection: 'column', 
                                                gap: 4,
                                                width: '100%',
                                                minWidth: '600px'
                                            }}>
                                                {/* Sección de Información del Activo */}
                                                <Box sx={{ width: '100%' }}>
                                                    <Typography 
                                                        variant="subtitle1" 
                                                        gutterBottom 
                                                        sx={{ 
                                                            mb: 3,
                                                            fontWeight: 'medium',
                                                            borderBottom: '1px solid',
                                                            borderColor: 'black',
                                                            pb: 0.5,
                                                            width: 'fit-content'
                                                        }}
                                                    >
                                                        Información del Activo
                                                    </Typography>
                                                    
                                                    <Box sx={{ 
                                                        display: 'flex', 
                                                        flexDirection: 'column', 
                                                        gap: 2,
                                                        width: '100%'
                                                    }}>
                                                        <Box sx={{ 
                                                            display: 'flex', 
                                                            alignItems: 'center', 
                                                            gap: 2,
                                                            width: '100%'
                                                        }}>
                                                            <Typography sx={{ 
                                                                flex: '0 0 150px',
                                                                fontSize: '0.9rem'
                                                            }}>
                                                                Nombre
                                                            </Typography>
                                                            <FormControl sx={{ flex: 1 }}>
                                                                <Select
                                                                    value={categoriaRespuestas.detalles[index]?.nombre || ''}
                                                                    onChange={(e) => {
                                                                        const nombreSeleccionado = e.target.value;
                                                                        const activoSeleccionado = modelos[categoria]?.nombres.find(
                                                                            activo => activo.nombre === nombreSeleccionado
                                                                        );
                                                                        handleDetalleChange(categoria, index, 'nombre', nombreSeleccionado);
                                                                        if (nombreSeleccionado) {
                                                                            handleDetalleChange(categoria, index, 'proveedor', '');
                                                                        }
                                                                    }}
                                                                    size="small"
                                                                >
                                                                    <MenuItem value="">
                                                                        <em>Seleccionar</em>
                                                                    </MenuItem>
                                                                    {modelos[categoria]?.nombres.map((activo, i) => (
                                                                        <MenuItem key={i} value={activo.nombre}>
                                                                            {activo.nombre}
                                                                        </MenuItem>
                                                                    ))}
                                                                </Select>
                                                            </FormControl>
                                                        </Box>

                                                        <Box sx={{ 
                                                            display: 'flex', 
                                                            alignItems: 'center', 
                                                            gap: 2,
                                                            width: '100%'
                                                        }}>
                                                            <Typography sx={{ 
                                                                flex: '0 0 150px',
                                                                fontSize: '0.9rem'
                                                            }}>
                                                                Proveedor
                                                            </Typography>
                                                            <FormControl sx={{ flex: 1 }}>
                                                                <Select
                                                                    value={categoriaRespuestas.detalles[index]?.proveedor || ''}
                                                                    onChange={(e) => handleDetalleChange(categoria, index, 'proveedor', e.target.value)}
                                                                    size="small"
                                                                >
                                                                    <MenuItem value="">
                                                                        <em>Seleccionar</em>
                                                                    </MenuItem>
                                                                    {modelos[categoria]?.proveedores.map((proveedor, i) => (
                                                                        <MenuItem key={i} value={proveedor}>
                                                                            {proveedor}
                                                                        </MenuItem>
                                                                    ))}
                                                                </Select>
                                                            </FormControl>
                                                        </Box>
                                                    </Box>
                                                </Box>

                                                {/* Sección de Nivel de Criticidad */}
                                                <Box sx={{ width: '100%', minWidth: '600px' }}>
                                                    <Typography 
                                                        variant="subtitle1" 
                                                        gutterBottom 
                                                        sx={{ 
                                                            mb: 3,
                                                            fontWeight: 'medium',
                                                            borderBottom: '1px solid',
                                                            borderColor: 'black',
                                                            pb: 0.5,
                                                            width: 'fit-content'
                                                        }}
                                                    >
                                                        Nivel de Criticidad
                                                    </Typography>
                                                    <Box sx={{ 
                                                        px: 2, 
                                                        width: '80%', 
                                                        minWidth: '400px',
                                                        mx: 'auto'
                                                    }}>
                                                        <Slider
                                                            value={categoriaRespuestas.detalles[index]?.criticidad || 3}
                                                            onChange={(_, value) => handleDetalleChange(categoria, index, 'criticidad', value)}
                                                            min={1}
                                                            max={5}
                                                            marks={[
                                                                { value: 1, label: '1' },
                                                                { value: 2, label: '2' },
                                                                { value: 3, label: '3' },
                                                                { value: 4, label: '4' },
                                                                { value: 5, label: '5' }
                                                            ]}
                                                            valueLabelDisplay="auto"
                                                        />
                                                    </Box>
                                                </Box>

                                                {/* Sección de Descripción de Securización */}
                                                <Box sx={{ width: '100%', minWidth: '600px' }}>
                                                    <Typography 
                                                        variant="subtitle1" 
                                                        gutterBottom 
                                                        sx={{ 
                                                            mb: 3,
                                                            fontWeight: 'medium',
                                                            borderBottom: '1px solid',
                                                            borderColor: 'black',
                                                            pb: 0.5,
                                                            width: 'fit-content'
                                                        }}
                                                    >
                                                        Descripción de la Securización
                                                    </Typography>
                                                    <TextField
                                                        fullWidth
                                                        multiline
                                                        rows={4}
                                                        value={categoriaRespuestas.detalles[index]?.securizacion || ''}
                                                        onChange={(e) => handleDetalleChange(categoria, index, 'securizacion', e.target.value)}
                                                        sx={{ minWidth: '600px' }}
                                                    />
                                                </Box>
                                            </Box>
                                        </Paper>
                                    ))}
                                </Grid>
                            </Grid>
                        </Box>
                    </Paper>
                );
            })}

            <Box sx={{ 
                display: 'flex', 
                justifyContent: 'center', 
                gap: 3,
                mt: 4,
                flexWrap: 'wrap'
            }}>
                <Button
                    variant="contained"
                    onClick={handleCancel}
                    sx={{ 
                        px: 4,
                        py: 1.5,
                        fontSize: '1.1rem',
                        backgroundColor: '#ef5350',
                        '&:hover': {
                            backgroundColor: '#e53935'
                        },
                        minWidth: { xs: '100%', sm: '200px' },
                        maxWidth: '300px'
                    }}
                >
                    Cancelar
                </Button>
                <Button
                    variant="contained"
                    onClick={handleTerminar}
                    sx={{ 
                        px: 4,
                        py: 1.5,
                        fontSize: '1.1rem',
                        backgroundColor: '#66bb6a',
                        '&:hover': {
                            backgroundColor: '#43a047'
                        },
                        minWidth: { xs: '100%', sm: '200px' },
                        maxWidth: '300px'
                    }}
                >
                    Terminar
                </Button>
            </Box>

            {/* Diálogo de confirmación */}
            {mostrarConfirmacion && (
                <Box
                    sx={{
                        position: 'fixed',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        backgroundColor: 'rgba(0, 0, 0, 0.5)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        zIndex: 1000
                    }}
                >
                    <Paper
                        sx={{
                            p: 4,
                            maxWidth: 400,
                            width: '100%',
                            textAlign: 'center'
                        }}
                    >
                        <Typography variant="h6" gutterBottom>
                            ¿Está seguro de que desea finalizar el cuestionario?
                        </Typography>
                        <Typography variant="body1" sx={{ mb: 3 }}>
                            Una vez finalizado, no podrá realizar más cambios.
                        </Typography>
                        <Box sx={{ display: 'flex', justifyContent: 'center', gap: 2 }}>
                            <Button
                                variant="contained"
                                color="primary"
                                onClick={() => handleConfirmarFinalizacion(true)}
                            >
                                Sí, finalizar
                            </Button>
                            <Button
                                variant="outlined"
                                onClick={() => handleConfirmarFinalizacion(false)}
                            >
                                No, continuar
                            </Button>
                        </Box>
                    </Paper>
                </Box>
            )}
        </Box>
    );
};

export default AuditoriaCuestionario; 