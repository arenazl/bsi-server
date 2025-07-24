import { Request, Response, NextFunction } from 'express';
import { AnyZodObject, ZodError } from 'zod';
import { validationResult } from 'express-validator';

/**
 * Middleware para validar requests usando Zod schemas
 */
export const validate = (schema: AnyZodObject) => {
  return async (req: Request, res: Response, next: NextFunction): Promise<Response | void> => {
    try {
      await schema.parseAsync({
        body: req.body,
        query: req.query,
        params: req.params,
      });
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const errors = error.errors.map(err => ({
          field: err.path.join('.'),
          message: err.message,
        }));

        return res.status(400).json({
          estado: 400,
          descripcion: 'Error de validación',
          data: null,
          error: {
            code: 'VALIDATION_ERROR',
            details: errors,
          },
        });
      }
      return next(error);
    }
  };
};

/**
 * Middleware para usar con express-validator
 */
export const validateExpressValidator = (req: Request, res: Response, next: NextFunction): Response | void => {
  const errors = validationResult(req);
  
  if (!errors.isEmpty()) {
    return res.status(400).json({
      estado: 400,
      descripcion: 'Error de validación',
      data: null,
      error: {
        code: 'VALIDATION_ERROR',
        details: errors.array().map(err => ({
          field: err.type === 'field' ? (err as any).path : (err as any).param,
          message: err.msg,
        })),
      },
    });
  }
  
  next();
};