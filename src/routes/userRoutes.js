import express from 'express';
import { verifyToken } from '../middleware/auth.js';
import * as activosService from '../services/activosService.js';
import * as amenazasService from '../services/amenazasService.js';
import * as vulnerabilidadesService from '../services/vulnerabilidadesService.js';
import * as salvaguardasService from '../services/salvaguardasService.js';

const router = express.Router();

// Middleware para verificar token
router.use(verifyToken);

// Rutas de solo lectura para Activos
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

// Rutas de solo lectura para Amenazas
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

// Rutas de solo lectura para Vulnerabilidades
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

// Rutas de solo lectura para Salvaguardas
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

export default router; 