const express         = require('express');
const logController   = require('../controllers/log.controller');
const router          = express.Router();

router.get('/', logController.Get);

module.exports = router;