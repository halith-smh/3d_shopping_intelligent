import Joi from "joi";

// user registartion : name, email, password
export const registerSchema = Joi.object({
  name: Joi.string().min(4).max(50).required().messages({
    "string.empty": "Name is required",
    "string.min": "Name should have a minimum length of 4 characters",
  }),
  email: Joi.string().email().required().messages({
    "string.empty": "Email is required",
    "string.email": "Email must be a valid email address",
  }),
  password: Joi.string().min(8).required().messages({
    "string.empty": "Password is required",
    "string.min": "Password should have a minimum length of 8 characters",
  }),
});

// user login : email, password
export const loginSchema = Joi.object({
  email: Joi.string().email().required().messages({
    "string.empty": "Email is required",
    "string.email": "Email must be a valid email address",
  }),
  password: Joi.string().min(6).required().messages({
    "string.empty": "Password is required",
    "string.min": "Password should have a minimum length of 6 characters",
  }),
});

// exports.validateRegisterInput = (data) => registerSchema.validate(data);
// exports.validateLoginInput = (data) => loginSchema.validate(data);
