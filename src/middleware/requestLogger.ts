import { Request, Response, NextFunction } from 'express';
import { logRequest } from '@config/logger';

// Middleware para loguear todas las requests
export const requestLogger = (req: Request, res: Response, next: NextFunction) => {
  const startTime = Date.now();

  // Loguear cuando llega la request
  logRequest(req);

  // Interceptar el final de la response para loguear el tiempo
  const originalSend = res.send;
  res.send = function(data: any) {
    const responseTime = Date.now() - startTime;
    logRequest(req, responseTime);
    return originalSend.call(this, data);
  };

  next();
};