const express               = require('express');
const perfilController      = require('../controllers/perfil.controller');
const router                = express.Router();

router.post('/', perfilController.Get);

module.exports = router;