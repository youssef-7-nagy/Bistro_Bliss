const Joi = require("joi");

// title: { type: String, required: true, minLength: 3, maxLength: 120 },
// description: { type: String, required: true },
// price: { type: Number, required: true, min: 0 },
// stock: { type: Number, required: true, min: 0, default: 0 },
// category: { type: String, required: true },

const createProductSchema = Joi.object({
  title: Joi.string().min(3).max(120).required(),
  description: Joi.string().required(),
  price: Joi.number().min(0).required(),
  stock: Joi.number().min(0).default(0),
  category: Joi.string().required() 
  
});

module.exports = { createProductSchema };