const express = require('express');
const router = express.Router();
const {
  signup,
  login,
  getProfile,
  updateProfile
} = require('../controllers/authController');
const auth = require('../middleware/auth');
const validate = require('../middleware/validate');
const {
  signupSchema,
  loginSchema,
  updateProfileSchema
} = require('../validators/authValidator');

router.post('/signup', validate(signupSchema), signup);
router.post('/login', validate(loginSchema), login);
router.get('/me', auth, getProfile);
router.put('/me', auth, validate(updateProfileSchema), updateProfile);

module.exports = router;