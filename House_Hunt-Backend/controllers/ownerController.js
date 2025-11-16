const Property = require('../models/property');
const User = require('../models/user');
const ApiResponse = require('../utils/response');

// @desc    Get all properties by a specific owner
// @route   GET /api/owners/:ownerId/properties
// @access  Public
exports.getOwnerProperties = async (req, res, next) => {
  try {
    const { ownerId } = req.params;
    const { page = 1, limit = 10 } = req.query;

    // Verify owner exists
    const owner = await User.findById(ownerId);
    if (!owner || owner.role !== 'owner') {
      return ApiResponse.error(res, 'Owner not found', 404);
    }

    // Get properties
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    const properties = await Property.find({ 
      owner: ownerId,
      isPublished: true 
    })
      .populate('owner', 'name email phone contactInfo')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum);

    const total = await Property.countDocuments({ 
      owner: ownerId,
      isPublished: true 
    });

    ApiResponse.paginated(res, properties, pageNum, limitNum, total);
  } catch (error) {
    next(error);
  }
};

module.exports = exports;