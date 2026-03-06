import { body, validationResult } from 'express-validator'

export const validate = (req, res, next) => {
  const errors = validationResult(req)
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array().map(err => ({
        field: err.path,
        message: err.msg
      }))
    })
  }
  next()
}

export const registerValidation = [
  body('name')
    .trim()
    .notEmpty().withMessage('Name is required')
    .isLength({ min: 2, max: 50 }).withMessage('Name must be 2-50 characters'),
  body('email')
    .trim()
    .notEmpty().withMessage('Email is required')
    .isEmail().withMessage('Invalid email format')
    .normalizeEmail(),
  body('password')
    .notEmpty().withMessage('Password is required')
    .isLength({ min: 6 }).withMessage('Password must be at least 6 characters')
]

export const loginValidation = [
  body('email')
    .trim()
    .notEmpty().withMessage('Email is required')
    .isEmail().withMessage('Invalid email format')
    .normalizeEmail(),
  body('password')
    .notEmpty().withMessage('Password is required')
]

export const reviewValidation = [
  body('text')
    .trim()
    .notEmpty().withMessage('Review text is required')
    .isLength({ min: 10, max: 5000 }).withMessage('Review must be 10-5000 characters'),
  body('productId')
    .notEmpty().withMessage('Product ID is required'),
  body('productName')
    .trim()
    .notEmpty().withMessage('Product name is required'),
  body('brand')
    .trim()
    .notEmpty().withMessage('Brand is required')
]
