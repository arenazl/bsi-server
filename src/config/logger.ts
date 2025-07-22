import winston from 'winston';
import DailyRotateFile from 'winston-daily-rotate-file';
import { Request } from 'express';

// Definir niveles de log personalizados
const levels = {
  error: 0,
  warn: 1,
  info: 2,
  http: 3,
  debug: 4,
};

// Colores para cada nivel
const colors = {
  error: 'red',
  warn: 'yellow',
  info: 'green',
  http: 'magenta',
  debug: 'white',
};

winston.addColors(colors);

// Formato para desarrollo (con colores y más legible)
const devFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.colorize({ all: true }),
  winston.format.printf(
    (info) => `${info.timestamp} ${info.level}: ${info.message}`
  )
);

// Formato para producción (JSON)
const prodFormat = winston.format.combine(
  winston.format.timestamp(),
  winston.format.errors({ stack: true }),
  winston.format.json()
);

// Configuración de archivos rotativos
const fileRotateTransport = new DailyRotateFile({
  filename: 'logs/application-%DATE%.log',
  datePattern: 'YYYY-MM-DD',
  maxSize: '20m',
  maxFiles: '14d',
  format: prodFormat,
});

// Logger principal
const logger = winston.createLogger({
  level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
  levels,
  format: prodFormat,
  transports: [
    // Archivo para errores
    new winston.transports.File({
      filename: 'logs/error.log',
      level: 'error',
      format: prodFormat,
    }),
    // Archivo rotativo para todos los logs
    fileRotateTransport,
  ],
});

// En desarrollo, también loguear a consola
if (process.env.NODE_ENV !== 'production') {
  logger.add(
    new winston.transports.Console({
      format: devFormat,
    })
  );
}

// Función helper para loguear requests con todos los detalles
export const logRequest = (req: Request, responseTime?: number) => {
  const requestInfo = {
    method: req.method,
    url: req.originalUrl,
    ip: req.ip || req.socket.remoteAddress,
    userAgent: req.get('user-agent'),
    // Mostrar query params
    query: Object.keys(req.query).length > 0 ? req.query : undefined,
    // Mostrar body (censurar passwords)
    body: req.body && Object.keys(req.body).length > 0 
      ? sanitizeBody(req.body) 
      : undefined,
    // Mostrar params de ruta
    params: Object.keys(req.params).length > 0 ? req.params : undefined,
    // Headers importantes
    headers: {
      contentType: req.get('content-type'),
      authorization: req.get('authorization') ? '***' : undefined,
    },
    responseTime: responseTime ? `${responseTime}ms` : undefined,
  };

  // Formato especial para desarrollo
  if (process.env.NODE_ENV !== 'production') {
    logger.http(`
╔══════════════════════════════════════════════════════════════
║ ${req.method} ${req.originalUrl}
╟──────────────────────────────────────────────────────────────
║ IP: ${requestInfo.ip}
║ User-Agent: ${requestInfo.userAgent}
${requestInfo.query ? `║ Query: ${JSON.stringify(requestInfo.query, null, 2).split('\n').join('\n║ ')}` : ''}
${requestInfo.params ? `║ Params: ${JSON.stringify(requestInfo.params, null, 2).split('\n').join('\n║ ')}` : ''}
${requestInfo.body ? `║ Body: ${JSON.stringify(requestInfo.body, null, 2).split('\n').join('\n║ ')}` : ''}
${requestInfo.responseTime ? `║ Response Time: ${requestInfo.responseTime}` : ''}
╚══════════════════════════════════════════════════════════════`);
  } else {
    logger.http('HTTP Request', requestInfo);
  }
};

// Función para censurar información sensible
const sanitizeBody = (body: any): any => {
  const sanitized = { ...body };
  const sensitiveFields = ['password', 'token', 'secret', 'apiKey', 'creditCard'];
  
  Object.keys(sanitized).forEach(key => {
    if (sensitiveFields.some(field => key.toLowerCase().includes(field))) {
      sanitized[key] = '***REDACTED***';
    }
  });
  
  return sanitized;
};

export default logger;