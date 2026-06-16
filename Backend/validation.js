const { body, validationResult } = require('express-validator');

const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array().map(e => ({ field: e.path, message: e.msg }))
    });
  }
  next();
};

const validateStudentRegister = [
  body('matric_number').trim().notEmpty().withMessage('Matric number is required').isLength({ min: 5, max: 20 }).withMessage('Matric number must be 5-20 characters'),
  body('first_name').trim().notEmpty().withMessage('First name is required').isLength({ min: 2, max: 50 }),
  body('last_name').trim().notEmpty().withMessage('Last name is required').isLength({ min: 2, max: 50 }),
  body('email').trim().notEmpty().withMessage('Email is required').isEmail().withMessage('Invalid email format').normalizeEmail(),
  body('phone').optional().trim().matches(/^\+?[0-9\s-]{10,15}$/).withMessage('Invalid phone number'),
  body('department').trim().notEmpty().withMessage('Department is required'),
  body('level').trim().notEmpty().withMessage('Level is required').isIn(['100', '200', '300', '400', '500', 'HND1', 'HND2', 'ND1', 'ND2']).withMessage('Invalid level'),
  body('password').notEmpty().withMessage('Password is required').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  body('gender').trim().notEmpty().withMessage('Gender is required').isIn(['male', 'female']).withMessage('Gender must be male or female'),
  handleValidationErrors
];

const validateStudentLogin = [
  body('matric_number').trim().notEmpty().withMessage('Matric number is required'),
  body('password').notEmpty().withMessage('Password is required'),
  handleValidationErrors
];

const validateAdminLogin = [
  body('email').trim().notEmpty().withMessage('Email is required').isEmail().withMessage('Invalid email format'),
  body('password').notEmpty().withMessage('Password is required'),
  handleValidationErrors
];

const validateApplication = [
  body('room_type_id').notEmpty().withMessage('Room type is required').isInt({ min: 1 }).withMessage('Invalid room type'),
  body('preferred_block').optional().trim().isIn(['A', 'B', 'C', 'D']).withMessage('Block must be A, B, C, or D'),
  handleValidationErrors
];

const validateContact = [
  body('name').trim().notEmpty().withMessage('Name is required').isLength({ min: 2, max: 100 }),
  body('email').trim().notEmpty().withMessage('Email is required').isEmail().withMessage('Invalid email format'),
  body('phone').optional().trim().matches(/^\+?[0-9\s-]{10,15}$/).withMessage('Invalid phone number'),
  body('subject').trim().notEmpty().withMessage('Subject is required').isLength({ min: 3, max: 200 }),
  body('message').trim().notEmpty().withMessage('Message is required').isLength({ min: 10, max: 2000 }),
  handleValidationErrors
];

const validateComplaint = [
  body('category').trim().notEmpty().withMessage('Category is required').isIn(['maintenance', 'security', 'cleanliness', 'noise', 'facilities', 'other']).withMessage('Invalid category'),
  body('title').trim().notEmpty().withMessage('Title is required').isLength({ min: 5, max: 200 }),
  body('description').trim().notEmpty().withMessage('Description is required').isLength({ min: 10, max: 2000 }),
  body('room_number').optional().trim().isLength({ max: 20 }).withMessage('Room number too long'),
  handleValidationErrors
];

module.exports = {
  validateStudentRegister,
  validateStudentLogin,
  validateAdminLogin,
  validateApplication,
  validateContact,
  validateComplaint,
  handleValidationErrors
};
