import { Request, Response, NextFunction } from 'express';
import { ForbiddenError } from './errorHandler';

// Middleware de autorización
export const authorize = (roles: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const user = (req as any).user;
    
    if (!user) {
      throw new ForbiddenError('Usuario no autenticado');
    }
    
    if (!roles.includes(user.role)) {
      throw new ForbiddenError('No tienes permisos para acceder a este recurso');
    }
    
    next();
  };
};