import express from 'express';
import { verifyToken, isAdmin } from '../middleware/auth.js';
import * as activosService from '../services/activosService.js';
import * as amenazasService from '../services/amenazasService.js';
import * as vulnerabilidadesService from '../services/vulnerabilidadesService.js';
import * as salvaguardasService from '../services/salvaguardasService.js';

const router = express.Router();

// Middleware para verificar token y rol de admin
router.use(verifyToken, isAdmin);

// Rutas para Activos
router.get('/activos', async (req, res) => {
  try {
    const activos = await activosService.getAllActivos();
    res.json(activos);
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener activos' });
  }
});

router.get('/activos/:id', async (req, res) => {
  try {
    const activo = await activosService.getActivoById(req.params.id);
    if (!activo) return res.status(404).json({ error: 'Activo no encontrado' });
    res.json(activo);
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener activo' });
  }
});

router.post('/activos', async (req, res) => {
  try {
    const id = await activosService.createActivo(req.body);
    res.status(201).json({ id });
  } catch (error) {
    res.status(500).json({ error: 'Error al crear activo' });
  }
});

router.put('/activos/:id', async (req, res) => {
  try {
    const activo = await activosService.updateActivo(req.params.id, req.body);
    res.json(activo);
  } catch (error) {
    res.status(500).json({ error: 'Error al actualizar activo' });
  }
});

router.delete('/activos/:id', async (req, res) => {
  try {
    await activosService.removeActivo(req.params.id);
    res.json({ message: 'Activo eliminado correctamente' });
  } catch (error) {
    res.status(500).json({ error: 'Error al eliminar activo' });
  }
});

// Rutas para Amenazas
router.get('/amenazas', async (req, res) => {
  try {
    const amenazas = await amenazasService.getAllAmenazas();
    res.json(amenazas);
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener amenazas' });
  }
});

router.get('/amenazas/:id', async (req, res) => {
  try {
    const amenaza = await amenazasService.getAmenazaById(req.params.id);
    if (!amenaza) return res.status(404).json({ error: 'Amenaza no encontrada' });
    res.json(amenaza);
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener amenaza' });
  }
});

router.post('/amenazas', async (req, res) => {
  try {
    const id = await amenazasService.createAmenaza(req.body);
    res.status(201).json({ id });
  } catch (error) {
    res.status(500).json({ error: 'Error al crear amenaza' });
  }
});

router.put('/amenazas/:id', async (req, res) => {
  try {
    const amenaza = await amenazasService.updateAmenaza(req.params.id, req.body);
    res.json(amenaza);
  } catch (error) {
    res.status(500).json({ error: 'Error al actualizar amenaza' });
  }
});

router.delete('/amenazas/:id', async (req, res) => {
  try {
    await amenazasService.removeAmenaza(req.params.id);
    res.json({ message: 'Amenaza eliminada correctamente' });
  } catch (error) {
    res.status(500).json({ error: 'Error al eliminar amenaza' });
  }
});

// Rutas para Vulnerabilidades
router.get('/vulnerabilidades', async (req, res) => {
  try {
    const vulnerabilidades = await vulnerabilidadesService.getAllVulnerabilidades();
    res.json(vulnerabilidades);
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener vulnerabilidades' });
  }
});

router.get('/vulnerabilidades/:id', async (req, res) => {
  try {
    const vulnerabilidad = await vulnerabilidadesService.getVulnerabilidadById(req.params.id);
    if (!vulnerabilidad) return res.status(404).json({ error: 'Vulnerabilidad no encontrada' });
    res.json(vulnerabilidad);
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener vulnerabilidad' });
  }
});

router.post('/vulnerabilidades', async (req, res) => {
  try {
    const id = await vulnerabilidadesService.createVulnerabilidad(req.body);
    res.status(201).json({ id });
  } catch (error) {
    res.status(500).json({ error: 'Error al crear vulnerabilidad' });
  }
});

router.put('/vulnerabilidades/:id', async (req, res) => {
  try {
    const vulnerabilidad = await vulnerabilidadesService.updateVulnerabilidad(req.params.id, req.body);
    res.json(vulnerabilidad);
  } catch (error) {
    res.status(500).json({ error: 'Error al actualizar vulnerabilidad' });
  }
});

router.delete('/vulnerabilidades/:id', async (req, res) => {
  try {
    await vulnerabilidadesService.removeVulnerabilidad(req.params.id);
    res.json({ message: 'Vulnerabilidad eliminada correctamente' });
  } catch (error) {
    res.status(500).json({ error: 'Error al eliminar vulnerabilidad' });
  }
});

// Rutas para Salvaguardas
router.get('/salvaguardas', async (req, res) => {
  try {
    const salvaguardas = await salvaguardasService.getAllSalvaguardas();
    res.json(salvaguardas);
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener salvaguardas' });
  }
});

router.get('/salvaguardas/:id', async (req, res) => {
  try {
    const salvaguarda = await salvaguardasService.getSalvaguardaById(req.params.id);
    if (!salvaguarda) return res.status(404).json({ error: 'Salvaguarda no encontrada' });
    res.json(salvaguarda);
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener salvaguarda' });
  }
});

router.post('/salvaguardas', async (req, res) => {
  try {
    const id = await salvaguardasService.createSalvaguarda(req.body);
    res.status(201).json({ id });
  } catch (error) {
    res.status(500).json({ error: 'Error al crear salvaguarda' });
  }
});

router.put('/salvaguardas/:id', async (req, res) => {
  try {
    const salvaguarda = await salvaguardasService.updateSalvaguarda(req.params.id, req.body);
    res.json(salvaguarda);
  } catch (error) {
    res.status(500).json({ error: 'Error al actualizar salvaguarda' });
  }
});

router.delete('/salvaguardas/:id', async (req, res) => {
  try {
    await salvaguardasService.removeSalvaguarda(req.params.id);
    res.json({ message: 'Salvaguarda eliminada correctamente' });
  } catch (error) {
    res.status(500).json({ error: 'Error al eliminar salvaguarda' });
  }
});

export default router; 