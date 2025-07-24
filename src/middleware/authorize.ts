import { Request, Response, NextFunction } from 'express';
import { ForbiddenError } from './errorHandler';

// Middleware de autorización
export const authorize = (roles: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const user = (req as any).user;
    
    if (!user) {
      throw new ForbiddenError('Usuario no autenticado');
    }
    
    // Por ahora, todos los usuarios tienen rol 'admin' para desarrollo
    // En producción, esto debe venir del token JWT o de la base de datos
    const userRole = user.role || 'admin';
    
    if (!roles.includes(userRole)) {
      throw new ForbiddenError('No tienes permisos para acceder a este recurso');
    }
    
    next();
  };
};