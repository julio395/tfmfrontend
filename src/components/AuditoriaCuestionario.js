import React, { useState, useEffect } from 'react';
import { Box, Typography, TextField, Button, Slider, Select, MenuItem, FormControl, InputLabel, Paper, Grid, ButtonGroup } from '@mui/material';
import axios from 'axios';

const AuditoriaCuestionario = ({ onCancel, userData }) => {
    const [activos, setActivos] = useState([]);
    const [categorias, setCategorias] = useState([]);
    const [respuestas, setRespuestas] = useState({});
    const [modelos, setModelos] = useState({});
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

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
                console.log('Iniciando fetch de activos...');
                const response = await axios.get('http://localhost:5000/api/tfm/Activos');
                console.log('Respuesta del servidor:', response.data);
                
                if (!response.data || response.data.length === 0) {
                    console.error('No se recibieron datos de activos');
                    setError('No se encontraron activos en la base de datos');
                    setLoading(false);
                    return;
                }

                // Filtrar activos que tengan categoría
                const activosFiltrados = response.data.filter(activo => activo.Categoría);
                console.log('Activos filtrados:', activosFiltrados);

                setActivos(activosFiltrados);
                
                // Extraer categorías únicas
                const categoriasUnicas = [...new Set(activosFiltrados.map(activo => activo.Categoría))];
                console.log('Categorías encontradas:', categoriasUnicas);
                
                if (categoriasUnicas.length === 0) {
                    console.error('No se encontraron categorías en los activos');
                    setError('No se encontraron categorías en la base de datos');
                    setLoading(false);
                    return;
                }

                setCategorias(categoriasUnicas);
                
                // Inicializar respuestas para cada categoría
                const respuestasIniciales = {};
                categoriasUnicas.forEach(categoria => {
                    respuestasIniciales[categoria] = {
                        cantidad: 0,
                        detalles: []
                    };
                });
                setRespuestas(respuestasIniciales);
                
                // Agrupar activos por categoría
                const modelosPorCategoria = {};
                categoriasUnicas.forEach(categoria => {
                    const activosCategoria = activosFiltrados
                        .filter(activo => activo.Categoría === categoria)
                        .map(activo => ({
                            nombre: activo.Nombre,
                            proveedor: activo.Proveedor
                        }));

                    // Eliminar duplicados de nombres
                    const nombresUnicos = [...new Set(activosCategoria.map(activo => activo.nombre))]
                        .map(nombre => ({
                            nombre: nombre,
                            proveedor: activosCategoria.find(activo => activo.nombre === nombre)?.proveedor || ''
                        }));

                    // Eliminar duplicados de proveedores
                    const proveedoresUnicos = [...new Set(activosCategoria.map(activo => activo.proveedor))]
                        .filter(proveedor => proveedor !== null && proveedor !== '');

                    console.log(`Activos únicos para ${categoria}:`, {
                        nombres: nombresUnicos,
                        proveedores: proveedoresUnicos
                    });

                    modelosPorCategoria[categoria] = {
                        nombres: nombresUnicos,
                        proveedores: proveedoresUnicos
                    };
                });
                setModelos(modelosPorCategoria);
                
                setLoading(false);
            } catch (error) {
                console.error('Error al cargar activos:', error);
                setError('Error al cargar los activos. Por favor, intente nuevamente.');
                setLoading(false);
            }
        };

        fetchActivos();
    }, []);

    const handleCantidadChange = (categoria, cantidad) => {
        setRespuestas(prev => ({
            ...prev,
            [categoria]: {
                ...prev[categoria],
                cantidad: parseInt(cantidad),
                detalles: Array(parseInt(cantidad)).fill({
                    nombre: '',
                    proveedor: '',
                    criticidad: 3,
                    securizacion: ''
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

    const handleSubmit = async () => {
        try {
            if (!userData || !userData.$id) {
                console.error('Datos de usuario no disponibles:', userData);
                alert('Error: No se encontraron los datos del usuario. Por favor, inicie sesión nuevamente.');
                return;
            }

            console.log('Datos del usuario al enviar:', userData);
            console.log('ID del usuario al enviar:', userData.$id);

            const fechaAuditoria = new Date().toISOString();
            const dataToSend = {
                fecha: fechaAuditoria,
                respuestas,
                cliente: {
                    id: userData.$id,
                    nombre: userData.name,
                    email: userData.email,
                    empresa: userData.empresa || 'No especificada'
                },
                estado: 'completada',
                timestamp: new Date().getTime(),
                metadata: {
                    version: '1.0',
                    tipo: 'auditoria_seguridad',
                    usuario: userData.$id,
                    fechaCreacion: new Date().toISOString(),
                    ultimaModificacion: new Date().toISOString()
                }
            };

            console.log('Enviando datos de auditoría:', JSON.stringify(dataToSend, null, 2));
            
            const response = await axios.post('http://localhost:5000/api/auditoria', dataToSend, {
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                }
            });
            
            console.log('Respuesta completa del servidor:', response);
            
            if (response.data) {
                const responseData = response.data;
                console.log('Datos de respuesta procesados:', responseData);

                if (responseData.id) {
                    console.log('ID de la auditoría guardada:', responseData.id);
                    alert(`Auditoría guardada correctamente con ID: ${responseData.id}`);
                    onCancel();
                } else {
                    console.warn('La respuesta no incluye un ID de auditoría:', responseData);
                    alert('La auditoría se guardó pero no se recibió un ID de confirmación.');
                    onCancel();
                }
            } else {
                console.warn('La respuesta no contiene datos:', response);
                alert('La auditoría se guardó pero no se recibió confirmación del servidor');
                onCancel();
            }
        } catch (error) {
            console.error('Error completo:', error);
            console.error('Detalles del error:', {
                message: error.message,
                response: error.response?.data,
                status: error.response?.status
            });

            if (error.response) {
                const errorMessage = error.response.data?.error || error.response.data?.message || 'Error al guardar la auditoría';
                console.error('Error del servidor:', errorMessage);
                alert(`Error del servidor: ${errorMessage}`);
            } else if (error.request) {
                console.error('No se recibió respuesta del servidor');
                alert('No se pudo conectar con el servidor. Por favor, verifica tu conexión.');
            } else {
                console.error('Error al configurar la petición:', error.message);
                alert('Error al enviar la auditoría. Por favor, intente nuevamente.');
            }
        }
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
            <Typography variant="h4" gutterBottom>
                Cuestionario de Auditoría
            </Typography>
            
            {categorias.map((categoria, categoriaIndex) => (
                <Paper key={`categoria-${categoriaIndex}`} sx={{ p: 3, mb: 3, width: '100%' }}>
                    <Typography 
                        variant="h6" 
                        gutterBottom 
                        sx={{ 
                            color: 'primary.main',
                            fontWeight: 'bold',
                            fontSize: '1.5rem',
                            mb: 3
                        }}
                    >
                        {categoria}
                    </Typography>
                    
                    <Grid container spacing={3}>
                        <Grid item xs={12} md={1}>
                            <Box sx={{ 
                                display: 'flex', 
                                flexDirection: 'column',
                                alignItems: 'center',
                                gap: 2
                            }}>
                                <Typography 
                                    variant="subtitle1" 
                                    sx={{ 
                                        textAlign: 'center',
                                        fontWeight: 'medium'
                                    }}
                                >
                                    ¿Cuántos activos de {categoria.toLowerCase()} tiene?
                                </Typography>
                                <TextField
                                    type="number"
                                    value={respuestas[categoria]?.cantidad || 0}
                                    onChange={(e) => handleCantidadChange(categoria, e.target.value)}
                                    fullWidth
                                    inputProps={{ 
                                        min: 0,
                                        style: { 
                                            textAlign: 'center',
                                            width: '80px'
                                        }
                                    }}
                                    sx={{
                                        '& .MuiOutlinedInput-root': {
                                            width: '100px'
                                        }
                                    }}
                                />
                            </Box>
                        </Grid>

                        {respuestas[categoria]?.cantidad > 0 && (
                            <Grid item xs={12} md={11}>
                                <Typography variant="subtitle1" gutterBottom sx={{ mb: 2 }}>
                                    {respuestas[categoria].cantidad === 1 
                                        ? `Detalles del activo de ${categoria.toLowerCase()}`
                                        : `Detalles de los activos de ${categoria.toLowerCase()}`
                                    }
                                </Typography>
                                
                                {[...Array(respuestas[categoria].cantidad)].map((_, index) => (
                                    <Paper 
                                        key={`detalle-${categoria}-${index}`} 
                                        sx={{ 
                                            p: 4, 
                                            mb: 3,
                                            width: '100%',
                                            minWidth: '600px',
                                            backgroundColor: 'background.default',
                                            borderRadius: 2,
                                            mx: 'auto'
                                        }}
                                    >
                                        <Typography 
                                            variant="h6" 
                                            gutterBottom 
                                            sx={{ 
                                                color: 'primary.main',
                                                fontWeight: 'medium',
                                                mb: 4
                                            }}
                                        >
                                            Activo {categoria} {index + 1}
                                        </Typography>

                                        <Box sx={{ 
                                            display: 'flex', 
                                            flexDirection: 'column', 
                                            gap: 4,
                                            width: '100%',
                                            minWidth: '600px'
                                        }}>
                                            {/* Sección de Información del Activo */}
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
                                                    Información del Activo
                                                </Typography>
                                                
                                                <Box sx={{ 
                                                    display: 'flex', 
                                                    flexDirection: 'column', 
                                                    gap: 3,
                                                    width: '100%',
                                                    minWidth: '600px'
                                                }}>
                                                    <FormControl fullWidth sx={{ minWidth: '600px' }}>
                                                        <InputLabel 
                                                            sx={{ 
                                                                backgroundColor: 'background.default',
                                                                px: 1
                                                            }}
                                                        >
                                                            Nombre
                                                        </InputLabel>
                                                        <Select
                                                            value={respuestas[categoria].detalles[index]?.nombre || ''}
                                                            onChange={(e) => handleDetalleChange(categoria, index, 'nombre', e.target.value)}
                                                        >
                                                            {modelos[categoria]?.nombres.map((activo, i) => (
                                                                <MenuItem key={`nombre-${categoria}-${i}`} value={activo.nombre}>
                                                                    {activo.nombre}
                                                                </MenuItem>
                                                            ))}
                                                        </Select>
                                                    </FormControl>

                                                    {!['Portátil', 'All-in-One', 'Desktop', 'Sensor de movimiento', 'Equipo físico'].includes(categoria) && (
                                                        <FormControl fullWidth sx={{ minWidth: '600px' }}>
                                                            <InputLabel 
                                                                sx={{ 
                                                                    backgroundColor: 'background.default',
                                                                    px: 1
                                                                }}
                                                            >
                                                                Proveedor
                                                            </InputLabel>
                                                            <Select
                                                                value={respuestas[categoria].detalles[index]?.proveedor || ''}
                                                                onChange={(e) => handleDetalleChange(categoria, index, 'proveedor', e.target.value)}
                                                            >
                                                                {modelos[categoria]?.proveedores.map((proveedor, i) => (
                                                                    <MenuItem key={`proveedor-${categoria}-${i}`} value={proveedor}>
                                                                        {proveedor}
                                                                    </MenuItem>
                                                                ))}
                                                            </Select>
                                                        </FormControl>
                                                    )}
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
                                                        value={respuestas[categoria].detalles[index]?.criticidad || 3}
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
                                                    value={respuestas[categoria].detalles[index]?.securizacion || ''}
                                                    onChange={(e) => handleDetalleChange(categoria, index, 'securizacion', e.target.value)}
                                                    sx={{ minWidth: '600px' }}
                                                />
                                            </Box>
                                        </Box>
                                    </Paper>
                                ))}
                            </Grid>
                        )}
                    </Grid>
                </Paper>
            ))}

            <Box sx={{ mt: 4, display: 'flex', justifyContent: 'center', gap: 2 }}>
                <ButtonGroup variant="contained" size="large">
                    <Button
                        color="error"
                        onClick={onCancel}
                        sx={{ 
                            px: 4,
                            py: 1.5
                        }}
                    >
                        Cancelar
                    </Button>
                    <Button
                        color="success"
                        onClick={handleSubmit}
                        sx={{ 
                            px: 4,
                            py: 1.5
                        }}
                    >
                        Enviar
                    </Button>
                </ButtonGroup>
            </Box>
        </Box>
    );
};

export default AuditoriaCuestionario; 