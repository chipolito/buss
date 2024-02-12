const express               = require('express');
const usuarioController     = require('../controllers/usuario.controller');
const router                = express.Router();

router.get('/', usuarioController.Get);
router.post('/Set', usuarioController.Set);
router.post('/Sign', usuarioController.Sign);
router.delete('/', usuarioController.Del);
router.put('/', usuarioController.Put);
router.put('/PutPassword', usuarioController.PutPassword);

module.exports = router;