const mongoose = require('mongoose');

const propertySchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Please provide a property title'],
      trim: true,
      maxlength: [200, 'Title cannot exceed 200 characters']
    },
    description: {
      type: String,
      required: [true, 'Please provide a description'],
      maxlength: [2000, 'Description cannot exceed 2000 characters']
    },
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    images: [{
      type: String // URL to image
    }],
    location: {
      address: {
        type: String,
        required: [true, 'Please provide an address']
      },
      city: {
        type: String,
        required: [true, 'Please provide a city'],
        trim: true
      },
      // Optional GeoJSON for geospatial queries
      coordinates: {
        type: {
          type: String,
          enum: ['Point'],
          default: 'Point'
        },
        coordinates: {
          type: [Number], // [longitude, latitude]
          index: '2dsphere'
        }
      }
    },
    price: {
      type: Number,
      required: [true, 'Please provide a price'],
      min: [0, 'Price cannot be negative']
    },
    size: {
      type: Number,
      required: [true, 'Please provide property size'],
      min: [0, 'Size cannot be negative']
    },
    bedrooms: {
      type: Number,
      required: [true, 'Please provide number of bedrooms'],
      min: [1, 'Bedrooms must be at least 1'],
      validate: {
        validator: Number.isInteger,
        message: 'Bedrooms must be an integer'
      }
    },
    parking: {
      type: Boolean,
      default: false
    },
    balcony: {
      type: Boolean,
      default: false
    },
    amenities: [{
      type: String,
      trim: true
    }],
    isPublished: {
      type: Boolean,
      default: true
    },
    isDeleted: {
      type: Boolean,
      default: false
    }
  },
  {
    timestamps: true
  }
);

// Indexes for performance
propertySchema.index({ title: 'text', description: 'text' }); // Text search
propertySchema.index({ 'location.coordinates': '2dsphere' }); // Geospatial
propertySchema.index({ bedrooms: 1, price: 1 }); // Filter queries
propertySchema.index({ 'location.city': 1 }); // City search
propertySchema.index({ owner: 1 }); // Owner's properties
propertySchema.index({ createdAt: -1 }); // Sorting by date

// Don't return deleted properties
propertySchema.pre(/^find/, function (next) {
  this.where({ isDeleted: false });
  next();
});

module.exports = mongoose.model('Property', propertySchema);