const User = require('../models/user');
const { generateToken } = require('../utils/jwt');
const ApiResponse = require('../utils/response');

// @desc    Register a new user
// @route   POST /api/auth/signup
// @access  Public
exports.signup = async (req, res, next) => {
  try {
    const { name, email, password, role, phone } = req.body;

    // Create user
    const user = await User.create({
      name,
      email,
      password,
      role,
      phone
    });

    // Generate token
    const token = generateToken(user._id);

    ApiResponse.success(
      res,
      {
        token,
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role
        }
      },
      'User registered successfully',
      201
    );
  } catch (error) {
    next(error);
  }
};

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    // Find user with password field
    const user = await User.findOne({ email }).select('+password');

    if (!user) {
      return ApiResponse.error(res, 'Invalid email or password', 401);
    }

    // Check password
    const isPasswordValid = await user.comparePassword(password);

    if (!isPasswordValid) {
      return ApiResponse.error(res, 'Invalid email or password', 401);
    }

    // Generate token
    const token = generateToken(user._id);

    ApiResponse.success(res, {
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    }, 'Login successful');
  } catch (error) {
    next(error);
  }
};

// @desc    Get current user profile
// @route   GET /api/auth/me
// @access  Private
exports.getProfile = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);

    ApiResponse.success(res, { user }, 'Profile retrieved successfully');
  } catch (error) {
    next(error);
  }
};

// @desc    Update user profile
// @route   PUT /api/auth/me
// @access  Private
exports.updateProfile = async (req, res, next) => {
  try {
    const { name, phone, contactInfo } = req.body;

    const user = await User.findByIdAndUpdate(
      req.user._id,
      { name, phone, contactInfo },
      { new: true, runValidators: true }
     );

    ApiResponse.success(res, { user }, 'Profile updated successfully');
  } catch (error) {
    next(error);
  }
};