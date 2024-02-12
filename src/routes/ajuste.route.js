const express           = require('express');
const ajusteController  = require('../controllers/ajuste.controller');
const router            = express.Router();

router.get('/', ajusteController.Get);
router.post('/', ajusteController.Set);

module.exports = router;