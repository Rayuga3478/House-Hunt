const Property = require('../models/property');
const ApiResponse = require('../utils/response');

// @desc    Create a new property
// @route   POST /api/properties
// @access  Private (Owner only)
exports.createProperty = async (req, res, next) => {
  try {
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
      isPublished
    } = req.body;

    // Handle amenities (can be comma-separated string or array)
    let amenitiesArray = [];
    if (amenities) {
      amenitiesArray = typeof amenities === 'string'
        ? amenities.split(',').map(a => a.trim())
        : amenities;
    }

    // Build property object
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
      isPublished: isPublished === 'true' || isPublished === true
    };

    // Add GeoJSON coordinates if provided
    if (latitude && longitude) {
      propertyData.location.coordinates = {
        type: 'Point',
        coordinates: [parseFloat(longitude), parseFloat(latitude)]
      };
    }

    // Handle image uploads
    if (req.files && req.files.length > 0) {
      propertyData.images = req.files.map(file => `/uploads/${file.filename}`);
    }

    const property = await Property.create(propertyData);

    ApiResponse.success(
      res,
      { property },
      'Property created successfully',
      201
    );
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
      q, // Text search
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
      radius, // In meters
      sort = 'newest',
      page = 1,
      limit = 10
    } = req.query;

    // Build query
    const query = { isPublished: true };

    // City filter
    if (city) {
      query['location.city'] = new RegExp(city, 'i');
    }

    // Text search on title and description
    if (q) {
      query.$text = { $search: q };
    }

    // Price filters
    if (minPrice || maxPrice) {
      query.price = {};
      if (minPrice) query.price.$gte = parseFloat(minPrice);
      if (maxPrice) query.price.$lte = parseFloat(maxPrice);
    }

    // Size filters
    if (minSize || maxSize) {
      query.size = {};
      if (minSize) query.size.$gte = parseFloat(minSize);
      if (maxSize) query.size.$lte = parseFloat(maxSize);
    }

    // Bedrooms filter (supports multiple values: bedrooms=2,3)
    if (bedrooms) {
      const bedroomsList = bedrooms.split(',').map(b => parseInt(b));
      query.bedrooms = { $in: bedroomsList };
    }

    // Boolean filters
    if (parking !== undefined) {
      query.parking = parking === 'true';
    }
    if (balcony !== undefined) {
      query.balcony = balcony === 'true';
    }

    // Amenities filter (comma-separated)
    if (amenities) {
      const amenitiesList = amenities.split(',').map(a => a.trim());
      query.amenities = { $all: amenitiesList };
    }

    // Geospatial search
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

    // Sorting
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

    // Pagination
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    // Execute query
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
      .populate('owner', 'name email phone contactInfo');

    if (!property) {
      return ApiResponse.error(res, 'Property not found', 404);
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

    // Check ownership
    if (property.owner.toString() !== req.user._id.toString()) {
      return ApiResponse.error(res, 'Not authorized to update this property', 403);
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
      isPublished
    } = req.body;

    // Handle amenities
    let amenitiesArray;
    if (amenities) {
      amenitiesArray = typeof amenities === 'string'
        ? amenities.split(',').map(a => a.trim())
        : amenities;
    }

    // Build update object
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

    // Update coordinates if provided
    if (latitude && longitude) {
      updateData['location.coordinates'] = {
        type: 'Point',
        coordinates: [parseFloat(longitude), parseFloat(latitude)]
      };
    }

    // Handle new image uploads
    if (req.files && req.files.length > 0) {
      const newImages = req.files.map(file => `/uploads/${file.filename}`);
      updateData.images = [...property.images, ...newImages];
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

    // Check ownership
    if (property.owner.toString() !== req.user._id.toString()) {
      return ApiResponse.error(res, 'Not authorized to delete this property', 403);
    }

    // Soft delete
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

    // Check ownership
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