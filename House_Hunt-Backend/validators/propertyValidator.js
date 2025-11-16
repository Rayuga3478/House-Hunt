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
  
  latitude: Joi.number().min(-90).max(90).optional(),
  longitude: Joi.number().min(-180).max(180).optional(),
  
  price: Joi.number()
    .positive()
    .required()
    .messages({
      'number.base': 'Price must be a number',
      'number.positive': 'Price must be greater than 0'
    }),
  
  size: Joi.number()
    .positive()
    .required()
    .messages({
      'number.base': 'Size must be a number',
      'number.positive': 'Size must be greater than 0'
    }),
  
  bedrooms: Joi.number()
    .integer()
    .min(1)
    .required()
    .messages({
      'number.base': 'Bedrooms must be a number',
      'number.integer': 'Bedrooms must be an integer',
      'number.min': 'Bedrooms must be at least 1'
    }),
  
  parking: Joi.boolean().default(false),
  balcony: Joi.boolean().default(false),
  
  amenities: Joi.alternatives()
    .try(
      Joi.array().items(Joi.string()),
      Joi.string()
    )
    .optional(),
  
  isPublished: Joi.boolean().default(true)
});

const updatePropertySchema = Joi.object({
  title: Joi.string().min(5).max(200).optional(),
  description: Joi.string().min(20).max(2000).optional(),
  address: Joi.string().optional(),
  city: Joi.string().optional(),
  latitude: Joi.number().min(-90).max(90).optional(),
  longitude: Joi.number().min(-180).max(180).optional(),
  price: Joi.number().positive().optional(),
  size: Joi.number().positive().optional(),
  bedrooms: Joi.number().integer().min(1).optional(),
  parking: Joi.boolean().optional(),
  balcony: Joi.boolean().optional(),
  amenities: Joi.alternatives()
    .try(
      Joi.array().items(Joi.string()),
      Joi.string()
    )
    .optional(),
  isPublished: Joi.boolean().optional()
});

module.exports = {
  createPropertySchema,
  updatePropertySchema
};