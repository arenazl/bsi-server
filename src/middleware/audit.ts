import { Request, Response, NextFunction } from 'express';
import { auditService, AuditEventType } from '@config/audit';

// Extender Request para incluir información de auditoría
declare global {
  namespace Express {
    interface Request {
      auditInfo?: {
        startTime: number;
        eventType?: AuditEventType;
        resourceType?: string;
        resourceId?: string;
      };
    }
  }
}

// Middleware de auditoría automática
export const auditMiddleware = (req: Request, res: Response, next: NextFunction) => {
  // Inicializar información de auditoría
  req.auditInfo = {
    startTime: Date.now(),
  };

  // Interceptar el final de la response
  const originalSend = res.send;
  const originalJson = res.json;

  // Override send
  res.send = function(data: any) {
    res.locals.body = data;
    auditResponse(req, res);
    return originalSend.call(this, data);
  };

  // Override json
  res.json = function(data: any) {
    res.locals.body = data;
    auditResponse(req, res);
    return originalJson.call(this, data);
  };

  next();
};

// Función para auditar la respuesta
function auditResponse(req: Request & { user?: any }, res: Response) {
  const duration = Date.now() - (req.auditInfo?.startTime || Date.now());
  
  // Determinar el tipo de evento basado en la ruta y método
  const eventType = determineEventType(req.method, req.path, res.statusCode);
  
  if (!eventType) return; // No auditar si no es un evento relevante

  // Determinar si fue exitoso
  const success = res.statusCode >= 200 && res.statusCode < 400;

  // Construir evento de auditoría
  const auditEvent = {
    ...auditService.fromRequest(req, eventType, `${req.method} ${req.path}`),
    result: success ? 'success' as const : 'failure' as const,
    statusCode: res.statusCode,
    duration,
    metadata: {
      method: req.method,
      path: req.path,
      query: req.query,
      params: req.params,
      responseSize: JSON.stringify(res.locals.body || '').length,
      ...(req.auditInfo?.resourceType && { resourceType: req.auditInfo.resourceType }),
      ...(req.auditInfo?.resourceId && { resourceId: req.auditInfo.resourceId }),
    },
  };

  // Registrar el evento
  auditService.log(auditEvent);
}

// Determinar tipo de evento basado en la ruta
function determineEventType(method: string, path: string, statusCode: number): AuditEventType | null {
  // Rutas de autenticación
  if (path.includes('/auth/login')) {
    return statusCode >= 200 && statusCode < 300 
      ? AuditEventType.LOGIN_SUCCESS 
      : AuditEventType.LOGIN_FAILURE;
  }
  if (path.includes('/auth/logout')) return AuditEventType.LOGOUT;
  if (path.includes('/auth/refresh')) return AuditEventType.TOKEN_REFRESH;

  // Operaciones CRUD
  if (method === 'POST' && !path.includes('/auth/')) return AuditEventType.CREATE;
  if (method === 'GET' && path.includes('/api/')) return AuditEventType.READ;
  if (method === 'PUT' || method === 'PATCH') return AuditEventType.UPDATE;
  if (method === 'DELETE') return AuditEventType.DELETE;

  // Operaciones de archivos
  if (path.includes('/files/upload')) return AuditEventType.FILE_UPLOAD;
  if (path.includes('/files/download')) return AuditEventType.FILE_DOWNLOAD;
  if (method === 'DELETE' && path.includes('/files/')) return AuditEventType.FILE_DELETE;

  // No auditar health checks y recursos estáticos
  if (path.includes('/health') || path.includes('/static/')) return null;

  return null;
}

// Middleware específico para auditar accesos denegados
export const auditAccessDenied = (reason: string) => {
  return (req: Request & { user?: any }, res: Response, next: NextFunction) => {
    auditService.logAccessDenied(req, req.originalUrl, reason);
    next();
  };
};

// Middleware para marcar recursos específicos para auditoría
export const auditResource = (resourceType: string, getResourceId?: (req: Request) => string) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (req.auditInfo) {
      req.auditInfo.resourceType = resourceType;
      if (getResourceId) {
        req.auditInfo.resourceId = getResourceId(req);
      }
    }
    next();
  };
};