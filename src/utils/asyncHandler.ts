import { Request, Response, NextFunction } from 'express';

/**
 * Wrapper para manejar errores en funciones async de Express
 * Evita tener que usar try-catch en cada controlador
 */
export const asyncHandler = (fn: Function) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};