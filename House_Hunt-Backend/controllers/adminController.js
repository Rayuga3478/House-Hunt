const User = require('../models/user');
const Property = require('../models/property');
const ApiResponse = require('../utils/response');

// @desc    Get all users (owners and tenants)
// @route   GET /api/admin/users
// @access  Private (Admin only)
exports.getAllUsers = async (req, res, next) => {
  try {
    const { role, page = 1, limit = 20, search } = req.query;

    const query = {};
    
    // Filter by role if provided
    if (role && ['owner', 'tenant'].includes(role)) {
      query.role = role;
    }

    // Search by name or email
    if (search) {
      query.$or = [
        { name: new RegExp(search, 'i') },
        { email: new RegExp(search, 'i') }
      ];
    }

    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    const users = await User.find(query)
      .select('-password')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum);

    const total = await User.countDocuments(query);

    ApiResponse.paginated(res, users, pageNum, limitNum, total);
  } catch (error) {
    next(error);
  }
};

// @desc    Get single user details
// @route   GET /api/admin/users/:userId
// @access  Private (Admin only)
exports.getUserDetails = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.userId).select('-password');

    if (!user) {
      return ApiResponse.error(res, 'User not found', 404);
    }

    // If user is an owner, get their properties count
    let propertiesCount = 0;
    if (user.role === 'owner') {
      propertiesCount = await Property.countDocuments({ owner: user._id });
    }

    ApiResponse.success(res, {
      user,
      ...(user.role === 'owner' && { propertiesCount })
    }, 'User details retrieved successfully');
  } catch (error) {
    next(error);
  }
};

// @desc    Block/Unblock user
// @route   PUT /api/admin/users/:userId/block
// @access  Private (Admin only)
exports.toggleBlockUser = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.userId);

    if (!user) {
      return ApiResponse.error(res, 'User not found', 404);
    }

    // Prevent admin from blocking themselves
    if (user._id.toString() === req.user._id.toString()) {
      return ApiResponse.error(res, 'You cannot block yourself', 400);
    }

    // Toggle blocked status
    user.isBlocked = !user.isBlocked;
    await user.save();

    // If blocking an owner, unpublish all their properties
    if (user.isBlocked && user.role === 'owner') {
      await Property.updateMany(
        { owner: user._id },
        { isPublished: false }
      );
    }

    ApiResponse.success(
      res,
      { user },
      `User ${user.isBlocked ? 'blocked' : 'unblocked'} successfully`
    );
  } catch (error) {
    next(error);
  }
};

// @desc    Delete user
// @route   DELETE /api/admin/users/:userId
// @access  Private (Admin only)
exports.deleteUser = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.userId);

    if (!user) {
      return ApiResponse.error(res, 'User not found', 404);
    }

    // Prevent admin from deleting themselves
    if (user._id.toString() === req.user._id.toString()) {
      return ApiResponse.error(res, 'You cannot delete yourself', 400);
    }

    // Soft delete the user
    user.isDeleted = true;
    await user.save();

    // If owner, soft delete all their properties
    if (user.role === 'owner') {
      await Property.updateMany(
        { owner: user._id },
        { isDeleted: true, isPublished: false }
      );
    }

    ApiResponse.success(res, null, 'User deleted successfully');
  } catch (error) {
    next(error);
  }
};

// @desc    Get all properties (for admin)
// @route   GET /api/admin/properties
// @access  Private (Admin only)
exports.getAllProperties = async (req, res, next) => {
  try {
    const { status, occupancyStatus, page = 1, limit = 20, search } = req.query;

    const query = {};

    // Filter by published status
    if (status === 'published') {
      query.isPublished = true;
    } else if (status === 'unpublished') {
      query.isPublished = false;
    }

    // Filter by occupancy status
    if (occupancyStatus && ['available', 'occupied'].includes(occupancyStatus)) {
      query.occupancyStatus = occupancyStatus;
    }

    // Search by title or city
    if (search) {
      query.$or = [
        { title: new RegExp(search, 'i') },
        { 'location.city': new RegExp(search, 'i') }
      ];
    }

    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    const properties = await Property.find(query)
      .populate('owner', 'name email phone isBlocked')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum);

    const total = await Property.countDocuments(query);

    ApiResponse.paginated(res, properties, pageNum, limitNum, total);
  } catch (error) {
    next(error);
  }
};

// @desc    Delete property (admin)
// @route   DELETE /api/admin/properties/:propertyId
// @access  Private (Admin only)
exports.deleteProperty = async (req, res, next) => {
  try {
    const property = await Property.findById(req.params.propertyId);

    if (!property) {
      return ApiResponse.error(res, 'Property not found', 404);
    }

    // Soft delete
    property.isDeleted = true;
    property.isPublished = false;
    await property.save();

    ApiResponse.success(res, null, 'Property deleted successfully');
  } catch (error) {
    next(error);
  }
};

// @desc    Get dashboard statistics
// @route   GET /api/admin/stats
// @access  Private (Admin only)
exports.getDashboardStats = async (req, res, next) => {
  try {
    const totalUsers = await User.countDocuments();
    const totalOwners = await User.countDocuments({ role: 'owner' });
    const totalTenants = await User.countDocuments({ role: 'tenant' });
    const blockedUsers = await User.countDocuments({ isBlocked: true });

    const totalProperties = await Property.countDocuments();
    const publishedProperties = await Property.countDocuments({ isPublished: true });
    const availableProperties = await Property.countDocuments({ 
      isPublished: true, 
      occupancyStatus: 'available' 
    });
    const occupiedProperties = await Property.countDocuments({ 
      occupancyStatus: 'occupied' 
    });

    ApiResponse.success(res, {
      users: {
        total: totalUsers,
        owners: totalOwners,
        tenants: totalTenants,
        blocked: blockedUsers
      },
      properties: {
        total: totalProperties,
        published: publishedProperties,
        available: availableProperties,
        occupied: occupiedProperties
      }
    }, 'Dashboard statistics retrieved successfully');
  } catch (error) {
    next(error);
  }
};

module.exports = exports;