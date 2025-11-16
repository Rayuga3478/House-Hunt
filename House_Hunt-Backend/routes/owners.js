const express = require('express');
const router = express.Router();
const { getOwnerProperties } = require('../controllers/ownerController');

router.get('/:ownerId/properties', getOwnerProperties);

module.exports = router;