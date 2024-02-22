const express           = require('express');
const toolController    = require('../controllers/tool.controller');
const router            = express.Router();

router.get('/migrateDatabase', toolController.Migrate);

module.exports = router;