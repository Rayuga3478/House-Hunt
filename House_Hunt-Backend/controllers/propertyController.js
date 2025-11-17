const Property = require('../models/property');
const User = require('../models/user');
const ApiResponse = require('../utils/response');
const {
  uploadMultipleToCloudinary,
  deleteFromCloudinary,
  isCloudinaryConfigured
} = require('../utils/cloudinary');

// @desc    Create a new property
// @route   POST /api/properties
// @access  Private (Owner only)
exports.createProperty = async (req, res, next) => {
  try {
    // Check if owner is blocked
    const owner = await User.findById(req.user._id);
    if (owner.isBlocked) {
      return ApiResponse.error(res, 'Your account is blocked. Cannot create properties.', 403);
    }

    const {
      title,
      description,
      address,
      city,
      latitude, 
      longitude,
      price,
      size,
      bedrooms,
      parking,
      balcony,
      amenities,
      isPublished,
      occupancyStatus
    } = req.body;

    let amenitiesArray = [];
    if (amenities) {
      amenitiesArray = typeof amenities === 'string'
        ? amenities.split(',').map(a => a.trim())
        : amenities;
    }

    const propertyData = {
      title,
      description,
      owner: req.user._id,
      location: {
        address,
        city
      },
      price,
      size,
      bedrooms,
      parking: parking === 'true' || parking === true,
      balcony: balcony === 'true' || balcony === true,
      amenities: amenitiesArray,
      isPublished: isPublished === 'true' || isPublished === true,
      occupancyStatus: occupancyStatus || 'available'
    };

    if (latitude && longitude) {
      propertyData.location.coordinates = {
        type: 'Point',
        coordinates: [parseFloat(longitude), parseFloat(latitude)]
      };
    }

    if (req.files && req.files.length > 0) {
      if (isCloudinaryConfigured()) {
        try {
          const imageUrls = await uploadMultipleToCloudinary(req.files);
          propertyData.images = imageUrls;
        } catch (error) {
          return ApiResponse.error(res, 'Failed to upload images. Please try again.', 500);
        }
      } else {
        propertyData.images = req.files.map(file => `/uploads/${file.filename}`);
      }
    }

    const property = await Property.create(propertyData);

    ApiResponse.success(res, { property }, 'Property created successfully', 201);
  } catch (error) {
    next(error);
  }
};

// @desc    Get all properties with filters
// @route   GET /api/properties
// @access  Public
exports.getProperties = async (req, res, next) => {
  try {
    const {
      city,
      q,
      minPrice,
      maxPrice,
      minSize,
      maxSize,
      bedrooms,
      parking,
      balcony,
      amenities,
      lat,
      lng,
      radius,
      sort = 'newest',
      page = 1,
      limit = 10
    } = req.query;

    // Only show published and available properties to public
    const query = { 
      isPublished: true,
      occupancyStatus: 'available'
    };

    // Also filter out properties from blocked owners
    const blockedOwners = await User.find({ isBlocked: true }).select('_id');
    const blockedOwnerIds = blockedOwners.map(owner => owner._id);
    if (blockedOwnerIds.length > 0) {
      query.owner = { $nin: blockedOwnerIds };
    }

    if (city) {
      query['location.city'] = new RegExp(city, 'i');
    }

    if (q) {
      query.$text = { $search: q };
    }

    if (minPrice || maxPrice) {
      query.price = {};
      if (minPrice) query.price.$gte = parseFloat(minPrice);
      if (maxPrice) query.price.$lte = parseFloat(maxPrice);
    }

    if (minSize || maxSize) {
      query.size = {};
      if (minSize) query.size.$gte = parseFloat(minSize);
      if (maxSize) query.size.$lte = parseFloat(maxSize);
    }

    if (bedrooms) {
      const bedroomsList = bedrooms.split(',').map(b => parseInt(b));
      query.bedrooms = { $in: bedroomsList };
    }

    if (parking !== undefined) {
      query.parking = parking === 'true';
    }
    if (balcony !== undefined) {
      query.balcony = balcony === 'true';
    }

    if (amenities) {
      const amenitiesList = amenities.split(',').map(a => a.trim());
      query.amenities = { $all: amenitiesList };
    }

    if (lat && lng && radius) {
      const radiusInMeters = parseFloat(radius);
      query['location.coordinates'] = {
        $near: {
          $geometry: {
            type: 'Point',
            coordinates: [parseFloat(lng), parseFloat(lat)]
          },
          $maxDistance: radiusInMeters
        }
      };
    }

    let sortOption = {};
    switch (sort) {
      case 'price_asc':
        sortOption = { price: 1 };
        break;
      case 'price_desc':
        sortOption = { price: -1 };
        break;
      case 'newest':
        sortOption = { createdAt: -1 };
        break;
      default:
        sortOption = { createdAt: -1 };
    }

    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    const properties = await Property.find(query)
      .populate('owner', 'name email phone contactInfo')
      .sort(sortOption)
      .skip(skip)
      .limit(limitNum);

    const total = await Property.countDocuments(query);

    ApiResponse.paginated(res, properties, pageNum, limitNum, total);
  } catch (error) {
    next(error);
  }
};

// @desc    Get single property by ID
// @route   GET /api/properties/:id
// @access  Public
exports.getProperty = async (req, res, next) => {
  try {
    const property = await Property.findById(req.params.id)
      .populate('owner', 'name email phone contactInfo isBlocked');

    if (!property) {
      return ApiResponse.error(res, 'Property not found', 404);
    }

    // Check if owner is blocked
    if (property.owner.isBlocked) {
      return ApiResponse.error(res, 'This property is no longer available', 404);
    }

    ApiResponse.success(res, { property }, 'Property retrieved successfully');
  } catch (error) {
    next(error);
  }
};

// @desc    Update property
// @route   PUT /api/properties/:id
// @access  Private (Owner only)
exports.updateProperty = async (req, res, next) => {
  try {
    let property = await Property.findById(req.params.id);

    if (!property) {
      return ApiResponse.error(res, 'Property not found', 404);
    }

    if (property.owner.toString() !== req.user._id.toString()) {
      return ApiResponse.error(res, 'Not authorized to update this property', 403);
    }

    // Check if owner is blocked
    const owner = await User.findById(req.user._id);
    if (owner.isBlocked) {
      return ApiResponse.error(res, 'Your account is blocked. Cannot update properties.', 403);
    }

    const {
      title,
      description,
      address,
      city,
      latitude,
      longitude,
      price,
      size,
      bedrooms,
      parking,
      balcony,
      amenities,
      isPublished,
      occupancyStatus
    } = req.body;

    let amenitiesArray;
    if (amenities) {
      amenitiesArray = typeof amenities === 'string'
        ? amenities.split(',').map(a => a.trim())
        : amenities;
    }

    const updateData = {};
    if (title) updateData.title = title;
    if (description) updateData.description = description;
    if (address) updateData['location.address'] = address;
    if (city) updateData['location.city'] = city;
    if (price) updateData.price = price;
    if (size) updateData.size = size;
    if (bedrooms) updateData.bedrooms = bedrooms;
    if (parking !== undefined) updateData.parking = parking === 'true' || parking === true;
    if (balcony !== undefined) updateData.balcony = balcony === 'true' || balcony === true;
    if (amenitiesArray) updateData.amenities = amenitiesArray;
    if (isPublished !== undefined) updateData.isPublished = isPublished === 'true' || isPublished === true;
    if (occupancyStatus) updateData.occupancyStatus = occupancyStatus;

    if (latitude && longitude) {
      updateData['location.coordinates'] = {
        type: 'Point',
        coordinates: [parseFloat(longitude), parseFloat(latitude)]
      };
    }

    if (req.files && req.files.length > 0) {
      if (isCloudinaryConfigured()) {
        try {
          const newImageUrls = await uploadMultipleToCloudinary(req.files);
          updateData.images = [...property.images, ...newImageUrls];
        } catch (error) {
          return ApiResponse.error(res, 'Failed to upload images. Please try again.', 500);
        }
      } else {
        const newImages = req.files.map(file => `/uploads/${file.filename}`);
        updateData.images = [...property.images, ...newImages];
      }
    }

    property = await Property.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    ).populate('owner', 'name email phone contactInfo');

    ApiResponse.success(res, { property }, 'Property updated successfully');
  } catch (error) {
    next(error);
  }
};

// @desc    Delete property (soft delete)
// @route   DELETE /api/properties/:id
// @access  Private (Owner only)
exports.deleteProperty = async (req, res, next) => {
  try {
    const property = await Property.findById(req.params.id);

    if (!property) {
      return ApiResponse.error(res, 'Property not found', 404);
    }

    if (property.owner.toString() !== req.user._id.toString()) {
      return ApiResponse.error(res, 'Not authorized to delete this property', 403);
    }

    if (isCloudinaryConfigured() && property.images.length > 0) {
      const cloudinaryImages = property.images.filter(img => 
        img.includes('cloudinary.com')
      );
      
      for (const imageUrl of cloudinaryImages) {
        await deleteFromCloudinary(imageUrl);
      }
    }

    property.isDeleted = true;
    await property.save();

    ApiResponse.success(res, null, 'Property deleted successfully');
  } catch (error) {
    next(error);
  }
};

// @desc    Publish/unpublish property
// @route   POST /api/properties/:id/publish
// @access  Private (Owner only)
exports.togglePublish = async (req, res, next) => {
  try {
    const property = await Property.findById(req.params.id);

    if (!property) {
      return ApiResponse.error(res, 'Property not found', 404);
    }

    if (property.owner.toString() !== req.user._id.toString()) {
      return ApiResponse.error(res, 'Not authorized to modify this property', 403);
    }

    property.isPublished = !property.isPublished;
    await property.save();

    ApiResponse.success(
      res,
      { property },
      `Property ${property.isPublished ? 'published' : 'unpublished'} successfully`
    );
  } catch (error) {
    next(error);
  }
};

// @desc    Toggle occupancy status
// @route   PUT /api/properties/:id/occupancy
// @access  Private (Owner only)
exports.toggleOccupancy = async (req, res, next) => {
  try {
    const property = await Property.findById(req.params.id);

    if (!property) {
      return ApiResponse.error(res, 'Property not found', 404);
    }

    if (property.owner.toString() !== req.user._id.toString()) {
      return ApiResponse.error(res, 'Not authorized to modify this property', 403);
    }

    const { occupancyStatus } = req.body;

    if (!['available', 'occupied'].includes(occupancyStatus)) {
      return ApiResponse.error(res, 'Invalid occupancy status', 400);
    }

    property.occupancyStatus = occupancyStatus;
    await property.save();

    ApiResponse.success(
      res,
      { property },
      `Property marked as ${occupancyStatus}`
    );
  } catch (error) {
    next(error);
  }
};

// @desc    Get owner's own properties
// @route   GET /api/properties/my-properties
// @access  Private (Owner only)
exports.getMyProperties = async (req, res, next) => {
  try {
    const { page = 1, limit = 10, occupancyStatus } = req.query;

    const query = { owner: req.user._id };

    if (occupancyStatus && ['available', 'occupied'].includes(occupancyStatus)) {
      query.occupancyStatus = occupancyStatus;
    }

    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    const properties = await Property.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum);

    const total = await Property.countDocuments(query);

    ApiResponse.paginated(res, properties, pageNum, limitNum, total);
  } catch (error) {
    next(error);
  }
};

module.exports = exports;