import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '@config/index';
import { UnauthorizedError } from './errorHandler';

// Middleware de autenticación con JWT
export const authenticateToken = (req: Request, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.startsWith('Bearer ') ? authHeader.substring(7) : null;
    
    if (!token) {
      throw new UnauthorizedError('Token no proporcionado');
    }
    
    // Verificar JWT
    jwt.verify(token, config.jwt.secret, (err: any, decoded: any) => {
      if (err) {
        if (err.name === 'TokenExpiredError') {
          throw new UnauthorizedError('Token expirado');
        } else if (err.name === 'JsonWebTokenError') {
          throw new UnauthorizedError('Token inválido');
        } else {
          throw new UnauthorizedError('Error al verificar token');
        }
      }
      
      // Agregar usuario al request
      (req as any).user = decoded;
      next();
    });
  } catch (error) {
    next(error);
  }
};

// Alias para compatibilidad
export const authenticate = authenticateToken;