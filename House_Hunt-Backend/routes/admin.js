const express = require('express');
const router = express.Router();
const {
  getAllUsers,
  getUserDetails,
  toggleBlockUser,
  deleteUser,
  getAllProperties,
  deleteProperty,
  getDashboardStats
} = require('../controllers/adminController');
const auth = require('../middleware/auth');
const requireRole = require('../middleware/role');

// All admin routes require authentication and admin role
router.use(auth);
router.use(requireRole('admin'));

// Dashboard statistics
router.get('/stats', getDashboardStats);

// User management
router.get('/users', getAllUsers);
router.get('/users/:userId', getUserDetails);
router.put('/users/:userId/block', toggleBlockUser);
router.delete('/users/:userId', deleteUser);

// Property management
router.get('/properties', getAllProperties);
router.delete('/properties/:propertyId', deleteProperty);

module.exports = router;