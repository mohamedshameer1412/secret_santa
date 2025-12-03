const { validationResult } = require('express-validator');
const AppError = require('../utils/AppError');

const validate = (req, res, next) => {
  const errors = validationResult(req);
  
  if (!errors.isEmpty()) {
    // Get only FIRST error per field (cleaner)
    const fieldErrors = {};
    errors.array().forEach(err => {
      if (!fieldErrors[err.path]) {
        fieldErrors[err.path] = err.msg;
      }
    });
    
    const errorMessages = Object.values(fieldErrors);
    
    // Development: log detailed errors
    if (process.env.NODE_ENV === 'development') {
      console.log('❌ Validation errors:', fieldErrors);
    }
    
    throw new AppError(errorMessages.join(', '), 400);
  }
  
  next();
};

module.exports = validate;