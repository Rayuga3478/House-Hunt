const Joi = require('joi');

const createPropertySchema = Joi.object({
  title: Joi.string()
    .min(5)
    .max(200)
    .required()
    .messages({
      'string.empty': 'Title is required',
      'string.min': 'Title must be at least 5 characters'
    }),
  
  description: Joi.string()
    .min(20)
    .max(2000)
    .required()
    .messages({
      'string.empty': 'Description is required',
      'string.min': 'Description must be at least 20 characters'
    }),
  
  address: Joi.string()
    .required()
    .messages({
      'string.empty': 'Address is required'
    }),
  
  city: Joi.string()
    .required()
    .messages({
      'string.empty': 'City is required'
    }),
  
  latitude: Joi.alternatives()
    .try(
      Joi.number().min(-90).max(90),
      Joi.string().pattern(/^-?\d+(\.\d+)?$/).allow('')
    )
    .optional(),
  
  longitude: Joi.alternatives()
    .try(
      Joi.number().min(-180).max(180),
      Joi.string().pattern(/^-?\d+(\.\d+)?$/).allow('')
    )
    .optional(),
  
  price: Joi.alternatives()
    .try(
      Joi.number().positive(),
      Joi.string().pattern(/^\d+(\.\d+)?$/)
    )
    .required()
    .messages({
      'any.required': 'Price is required',
      'alternatives.match': 'Price must be a positive number'
    }),
  
  size: Joi.alternatives()
    .try(
      Joi.number().positive(),
      Joi.string().pattern(/^\d+(\.\d+)?$/)
    )
    .required()
    .messages({
      'any.required': 'Size is required',
      'alternatives.match': 'Size must be a positive number'
    }),
  
  bedrooms: Joi.alternatives()
    .try(
      Joi.number().integer().min(1),
      Joi.string().pattern(/^\d+$/)
    )
    .required()
    .messages({
      'any.required': 'Bedrooms is required',
      'alternatives.match': 'Bedrooms must be a positive integer'
    }),
  
  parking: Joi.alternatives()
    .try(
      Joi.boolean(),
      Joi.string().valid('true', 'false', '')
    )
    .default(false),
  
  balcony: Joi.alternatives()
    .try(
      Joi.boolean(),
      Joi.string().valid('true', 'false', '')
    )
    .default(false),
  
  amenities: Joi.alternatives()
    .try(
      Joi.array().items(Joi.string()),
      Joi.string().allow('')
    )
    .optional(),
  
  occupancyStatus: Joi.string()
    .valid('available', 'occupied')
    .default('available'),
  
  isPublished: Joi.alternatives()
    .try(
      Joi.boolean(),
      Joi.string().valid('true', 'false', '')
    )
    .default(true)
});

const updatePropertySchema = Joi.object({
  title: Joi.string().min(5).max(200).optional(),
  description: Joi.string().min(20).max(2000).optional(),
  address: Joi.string().optional(),
  city: Joi.string().optional(),
  
  latitude: Joi.alternatives()
    .try(
      Joi.number().min(-90).max(90),
      Joi.string().pattern(/^-?\d+(\.\d+)?$/).allow('')
    )
    .optional(),
  
  longitude: Joi.alternatives()
    .try(
      Joi.number().min(-180).max(180),
      Joi.string().pattern(/^-?\d+(\.\d+)?$/).allow('')
    )
    .optional(),
  
  price: Joi.alternatives()
    .try(
      Joi.number().positive(),
      Joi.string().pattern(/^\d+(\.\d+)?$/)
    )
    .optional(),
  
  size: Joi.alternatives()
    .try(
      Joi.number().positive(),
      Joi.string().pattern(/^\d+(\.\d+)?$/)
    )
    .optional(),
  
  bedrooms: Joi.alternatives()
    .try(
      Joi.number().integer().min(1),
      Joi.string().pattern(/^\d+$/)
    )
    .optional(),
  
  parking: Joi.alternatives()
    .try(
      Joi.boolean(),
      Joi.string().valid('true', 'false', '')
    )
    .optional(),
  
  balcony: Joi.alternatives()
    .try(
      Joi.boolean(),
      Joi.string().valid('true', 'false', '')
    )
    .optional(),
  
  amenities: Joi.alternatives()
    .try(
      Joi.array().items(Joi.string()),
      Joi.string().allow('')
    )
    .optional(),
  
  occupancyStatus: Joi.string()
    .valid('available', 'occupied')
    .optional(),
  
  isPublished: Joi.alternatives()
    .try(
      Joi.boolean(),
      Joi.string().valid('true', 'false', '')
    )
    .optional()
});

module.exports = {
  createPropertySchema,
  updatePropertySchema
};