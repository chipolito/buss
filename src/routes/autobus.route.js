const express           = require('express');
const autobusController = require('../controllers/autobus.controller');
const router            = express.Router();

router.get('/', autobusController.Get);
router.post('/', autobusController.Set);
router.delete('/', autobusController.Del);

module.exports = router;