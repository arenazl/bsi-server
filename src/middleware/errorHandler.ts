import { Request, Response, NextFunction } from 'express';
import logger from '@config/logger';
import { config } from '@config/index';
import { auditService, AuditEventType } from '@config/audit';
import EmailService from '@services/emailService';
import DatabaseHelper from '../databaseHelper';
import { ZodError } from 'zod';

// Custom error classes
export class AppError extends Error {
  constructor(
    public statusCode: number,
    public message: string,
    public code?: string,
    public details?: any,
    public shouldNotifyEmail: boolean = false
  ) {
    super(message);
    this.name = this.constructor.name;
    Error.captureStackTrace(this, this.constructor);
  }
}

export class BadRequestError extends AppError {
  constructor(message: string = 'Bad request', details?: any) {
    super(400, message, 'BAD_REQUEST', details);
  }
}

export class UnauthorizedError extends AppError {
  constructor(message: string = 'Unauthorized') {
    super(401, message, 'UNAUTHORIZED');
  }
}

export class ForbiddenError extends AppError {
  constructor(message: string = 'Forbidden') {
    super(403, message, 'FORBIDDEN');
  }
}

export class NotFoundError extends AppError {
  constructor(resource: string = 'Resource') {
    super(404, `${resource} not found`, 'NOT_FOUND');
  }
}

export class ConflictError extends AppError {
  constructor(message: string = 'Resource already exists') {
    super(409, message, 'CONFLICT');
  }
}

export class TooManyRequestsError extends AppError {
  constructor(message: string = 'Too many requests') {
    super(429, message, 'TOO_MANY_REQUESTS');
  }
}

export class InternalServerError extends AppError {
  constructor(message: string = 'Internal server error') {
    super(500, message, 'INTERNAL_ERROR', undefined, true); // Notificar por email
  }
}

// Interface para extender Request
declare global {
  namespace Express {
    interface Request {
      id?: string;
      user?: any;
    }
  }
}

// Helper function para obtener información del municipio
async function getMunicipioInfo(req: Request): Promise<{ id: string; descripcion: string }> {
  let municipioId = 'No especificado';
  let municipioDescripcion = 'No especificado';

  try {
    // Intentar extraer ID del municipio de diferentes lugares
    if (req.body?.body?.id_organismo) {
      municipioId = req.body.body.id_organismo.toString();
    } else if (req.body?.id_organismo) {
      municipioId = req.body.id_organismo.toString();
    } else if (req.body?.IDORG) {
      municipioId = req.body.IDORG.toString();
    } else if (req.params?.organismo) {
      municipioId = req.params.organismo.toString();
    }

    // Obtener descripción del municipio si tenemos el ID
    if (municipioId !== 'No especificado') {
      try {
        const result = await DatabaseHelper.executeSpSelect('ObtenerNombreOrganismo', [municipioId]);
        if (result && result.length > 0 && result[0].NombreOrganismo) {
          municipioDescripcion = result[0].NombreOrganismo;
        } else {
          municipioDescripcion = `Municipio ID: ${municipioId}`;
        }
      } catch (dbError) {
        logger.error('Error obteniendo descripción del municipio:', dbError);
        municipioDescripcion = `Municipio ID: ${municipioId}`;
      }
    }
  } catch (e) {
    logger.error('Error extrayendo información del municipio:', e);
  }

  return { id: municipioId, descripcion: municipioDescripcion };
}

// Error handler middleware mejorado
export const errorHandler = async (
  err: Error | AppError,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  // Información básica del error
  const timestamp = new Date();
  const method = req.method;
  const url = req.originalUrl || req.url;
  const userAgent = req.get('User-Agent') || 'Unknown';
  const ip = req.ip || req.socket.remoteAddress || 'Unknown';
  
  // Obtener información del municipio
  const municipioInfo = await getMunicipioInfo(req);

  // Default error values
  let statusCode = 500;
  let message = 'Internal server error';
  let code = 'INTERNAL_ERROR';
  let details: any = undefined;
  let shouldNotifyEmail = false;

  // Handle different error types
  if (err instanceof AppError) {
    statusCode = err.statusCode;
    message = err.message;
    code = err.code || 'APP_ERROR';
    details = err.details;
    shouldNotifyEmail = err.shouldNotifyEmail;
  } else if (err instanceof ZodError) {
    statusCode = 400;
    message = 'Validation failed';
    code = 'VALIDATION_ERROR';
    details = err.errors.map(error => ({
      field: error.path.join('.'),
      message: error.message,
    }));
  } else if (err.name === 'ValidationError') {
    // Express validator errors
    statusCode = 400;
    message = 'Validation failed';
    code = 'VALIDATION_ERROR';
    const validationErr = err as any;
    if (Array.isArray(validationErr.errors)) {
      details = validationErr.errors.map((error: any) => ({
        field: error.param || error.path,
        message: error.msg || error.message,
      }));
    }
  } else if (err.name === 'JsonWebTokenError') {
    statusCode = 401;
    message = 'Invalid token';
    code = 'INVALID_TOKEN';
  } else if (err.name === 'TokenExpiredError') {
    statusCode = 401;
    message = 'Token expired';
    code = 'TOKEN_EXPIRED';
  } else if (err.name === 'MulterError') {
    statusCode = 400;
    message = err.message;
    code = 'FILE_UPLOAD_ERROR';
  } else if (statusCode === 500) {
    // Para errores 500 no controlados, notificar por email
    shouldNotifyEmail = true;
  }

  // Log completo del error
  const errorLog = {
    error: {
      name: err.name,
      message: err.message,
      code,
      stack: err.stack,
      statusCode,
    },
    request: {
      id: req.id,
      method,
      url,
      headers: req.headers,
      body: req.body,
      query: req.query,
      params: req.params,
      ip,
      userAgent,
      user: req.user?.id,
    },
    municipio: municipioInfo,
    timestamp: timestamp.toISOString(),
  };

  // Log en Winston
  logger.error('Error en la aplicación', errorLog);

  // Auditar el error
  auditService.log({
    eventType: AuditEventType.SYSTEM_ERROR,
    action: `Error ${statusCode}: ${message}`,
    result: 'failure',
    errorMessage: message,
    statusCode,
    ipAddress: ip,
    userAgent,
    resource: url,
    requestId: req.id || '',
    metadata: {
      errorCode: code,
      municipio: municipioInfo,
      stack: config.isDevelopment ? err.stack : undefined,
    },
  });

  // Enviar notificación por email si es necesario
  if (shouldNotifyEmail || (statusCode >= 500 && config.isProduction)) {
    const errorDetails = `
MÉTODO HTTP: ${method}
ENDPOINT: ${url}
HORA: ${timestamp.toLocaleString('es-AR')}
MUNICIPIO: ${municipioInfo.descripcion}
USER AGENT: ${userAgent}
IP: ${ip}
CÓDIGO DE ERROR: ${code}
MENSAJE: ${message}

PARÁMETROS RECIBIDOS:
- Body: ${JSON.stringify(req.body, null, 2)}
- Query: ${JSON.stringify(req.query, null, 2)}
- Params: ${JSON.stringify(req.params, null, 2)}

STACK TRACE:
${err.stack || 'No disponible'}
    `.trim();

    const friendlyDescription = `
Se produjo un error en el servidor BSI durante la ejecución de una operación.

Detalles del contexto:
- Endpoint afectado: ${method} ${url}
- Fecha y hora: ${timestamp.toLocaleString('es-AR')}
- Dirección IP del cliente: ${ip}
- Municipio: ${municipioInfo.descripcion}
- Código de error: ${code}

Por favor revise los logs del servidor y tome las acciones necesarias.
    `.trim();

    try {
      await EmailService.sendErrorNotificationSimple(
        `Error ${statusCode}: ${code}`,
        errorDetails,
        friendlyDescription
      );
    } catch (emailError) {
      logger.error('Error enviando notificación por email:', emailError);
    }
  }

  // Preparar respuesta de error
  const errorResponse: any = {
    estado: statusCode >= 500 ? 0 : statusCode, // Mantener compatibilidad con formato actual
    descripcion: message,
    data: null,
    error: {
      code,
      ...(details && { details }),
    },
  };

  // En desarrollo, incluir stack trace
  if (config.isDevelopment && err.stack) {
    errorResponse.error.stack = err.stack.split('\n');
  }

  // Enviar respuesta
  res.status(statusCode).json(errorResponse);
};

// 404 handler
export const notFoundHandler = (req: Request, res: Response) => {
  const notFoundError = {
    estado: 404,
    descripcion: 'Recurso no encontrado',
    data: null,
    error: {
      code: 'NOT_FOUND',
      path: req.originalUrl,
      method: req.method,
    },
  };

  // Log y auditoría
  logger.warn('Recurso no encontrado', {
    method: req.method,
    url: req.originalUrl,
    ip: req.ip,
  });

  res.status(404).json(notFoundError);
};