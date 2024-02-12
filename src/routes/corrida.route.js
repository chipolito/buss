const express               = require('express');
const corridaController     = require('../controllers/corrida.controller');
const router                = express.Router();

router.get('/', corridaController.Get);
router.post('/', corridaController.Set);
router.delete('/', corridaController.Del);
router.put('/', corridaController.Put);

module.exports = router;