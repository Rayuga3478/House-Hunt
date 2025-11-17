const express = require('express');
const router = express.Router();
const {
  createProperty,
  getProperties,
  getProperty,
  updateProperty,
  deleteProperty,
  togglePublish,
  toggleOccupancy,
  getMyProperties
} = require('../controllers/propertyController');
const auth = require('../middleware/auth');
const requireRole = require('../middleware/role');
const validate = require('../middleware/validate');
const upload = require('../middleware/upload');
const {
  createPropertySchema,
  updatePropertySchema
} = require('../validators/propertyValidator');

// Public routes
router.get('/', getProperties);
router.get('/:id', getProperty);

// Owner-only routes
router.post(
  '/',
  auth,
  requireRole('owner'),
  upload.array('images', 10),
  validate(createPropertySchema),
  createProperty
);

router.put(
  '/:id',
  auth,
  requireRole('owner'),
  upload.array('images', 10),
  validate(updatePropertySchema),
  updateProperty
);

router.delete(
  '/:id',
  auth,
  requireRole('owner'),
  deleteProperty
);

router.post(
  '/:id/publish',
  auth,
  requireRole('owner'),
  togglePublish
);

// New route for toggling occupancy status
router.put(
  '/:id/occupancy',
  auth,
  requireRole('owner'),
  toggleOccupancy
);

// Get owner's own properties
router.get(
  '/owner/my-properties',
  auth,
  requireRole('owner'),
  getMyProperties
);

module.exports = router;