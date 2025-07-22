import { Request, Response, NextFunction } from 'express';
import { UnauthorizedError } from './errorHandler';

// Middleware de autenticación temporal
export const authenticate = (req: Request, res: Response, next: NextFunction) => {
  const token = req.headers.authorization?.replace('Bearer ', '');
  
  if (!token) {
    throw new UnauthorizedError('Token no proporcionado');
  }
  
  // TODO: Verificar JWT real
  // Por ahora, aceptar cualquier token
  (req as any).user = {
    id: '1',
    email: 'user@bsi.com',
    role: 'USER'
  };
  
  next();
};