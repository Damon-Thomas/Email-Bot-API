import Joi from "joi";
import { Request, Response, NextFunction } from "express";

const emailSchema = Joi.object({
  to: Joi.alternatives().try(
    Joi.string().email().required(),
    Joi.array().items(Joi.string().email()).min(1).required()
  ),
  subject: Joi.string().min(1).max(998).required(),
  text: Joi.string().optional(),
  html: Joi.string().optional(),
  attachments: Joi.array()
    .items(
      Joi.object({
        filename: Joi.string().required(),
        content: Joi.alternatives().try(Joi.string(), Joi.binary()).required(),
        encoding: Joi.string().optional(),
      })
    )
    .optional(),
}).or("text", "html"); // At least one of text or html is required

export const validateEmailRequest = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const { error } = emailSchema.validate(req.body);

  if (error) {
    res.status(400).json({
      success: false,
      error: "Validation error",
      message: error.details[0]?.message || "Invalid input",
      details: error.details,
    });
    return;
  }

  next();
};
