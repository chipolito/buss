const express               = require('express');
const motivoController   = require('../controllers/motivo.controller');
const router                = express.Router();

router.get('/', motivoController.Get);

module.exports = router;