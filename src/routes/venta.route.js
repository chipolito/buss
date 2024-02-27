const express               = require('express');
const ventaController   = require('../controllers/venta.controller');
const router                = express.Router();

router.get('/Configuracion', ventaController.Configuracion);
router.get('/MovimientoEfectivo/:turno_id', ventaController.GetMovimientoEffectivo);
router.get('/GetHistorialVenta/:turno_id', ventaController.GetHistorialVenta);
router.get('/GetTurno/:turnoid/:sucursal_id', ventaController.GetTurno);
router.get('/GetTurnos', ventaController.GetTurnos);
router.get('/GetVentaForTicket/:venta_id/:sucursal_id', ventaController.GetVentaForTicket);
router.post('/AbrirTurno', ventaController.AbrirTurno);
router.post('/Sale', ventaController.Sale);
router.post('/CerrarTurno', ventaController.CerrarTurno)
router.post('/RegistrarMovimiento', ventaController.SetMovimientoEfectivo);
router.post('/GeneraPdfCorte', ventaController.GeneraPdfCorte);
router.post('/Reimpresion', ventaController.Reimpresion);
router.delete('/MovimientoEfectivo', ventaController.DelMovimientoEfectivo);

module.exports = router;