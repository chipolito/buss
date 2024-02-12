const express               = require('express');
const descuentoController   = require('../controllers/descuento.controller');
const router                = express.Router();

router.get('/', descuentoController.Get);
router.post('/', descuentoController.Set);
router.delete('/', descuentoController.Del);

module.exports = router;