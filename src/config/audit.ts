import winston from 'winston';
import DailyRotateFile from 'winston-daily-rotate-file';
import { Request } from 'express';
import crypto from 'crypto';

// Interfaz para eventos de auditoría
export interface AuditEvent {
  eventId: string;
  eventType: AuditEventType;
  timestamp: Date;
  userId?: string;
  userName?: string;
  userEmail?: string;
  ipAddress: string;
  userAgent?: string;
  resource: string;
  action: string;
  result: 'success' | 'failure';
  statusCode?: number;
  errorMessage?: string;
  metadata?: Record<string, any>;
  requestId: string;
  sessionId?: string;
  duration?: number;
}

export enum AuditEventType {
  // Autenticación
  LOGIN_ATTEMPT = 'LOGIN_ATTEMPT',
  LOGIN_SUCCESS = 'LOGIN_SUCCESS',
  LOGIN_FAILURE = 'LOGIN_FAILURE',
  LOGOUT = 'LOGOUT',
  TOKEN_REFRESH = 'TOKEN_REFRESH',
  
  // Autorización
  ACCESS_GRANTED = 'ACCESS_GRANTED',
  ACCESS_DENIED = 'ACCESS_DENIED',
  
  // CRUD Operations
  CREATE = 'CREATE',
  READ = 'READ',
  UPDATE = 'UPDATE',
  DELETE = 'DELETE',
  
  // File Operations
  FILE_UPLOAD = 'FILE_UPLOAD',
  FILE_DOWNLOAD = 'FILE_DOWNLOAD',
  FILE_DELETE = 'FILE_DELETE',
  
  // System Events
  SYSTEM_ERROR = 'SYSTEM_ERROR',
  CONFIGURATION_CHANGE = 'CONFIGURATION_CHANGE',
  
  // Security Events
  SUSPICIOUS_ACTIVITY = 'SUSPICIOUS_ACTIVITY',
  RATE_LIMIT_EXCEEDED = 'RATE_LIMIT_EXCEEDED',
  INVALID_TOKEN = 'INVALID_TOKEN',
}

// Configuración del logger de auditoría
const auditLogger = winston.createLogger({
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    // Archivo rotativo para auditoría (se guarda por más tiempo)
    new DailyRotateFile({
      filename: 'logs/audit/audit-%DATE%.log',
      datePattern: 'YYYY-MM-DD',
      maxSize: '100m',
      maxFiles: '365d', // Mantener logs de auditoría por 1 año
      auditFile: true,
    }),
    // Archivo separado para eventos de seguridad
    new DailyRotateFile({
      filename: 'logs/audit/security-%DATE%.log',
      datePattern: 'YYYY-MM-DD',
      maxSize: '50m',
      maxFiles: '180d',
      level: 'warn',
      filter: (info) => {
        return [
          AuditEventType.LOGIN_FAILURE,
          AuditEventType.ACCESS_DENIED,
          AuditEventType.SUSPICIOUS_ACTIVITY,
          AuditEventType.RATE_LIMIT_EXCEEDED,
          AuditEventType.INVALID_TOKEN,
        ].includes(info.eventType);
      }
    }),
  ],
});

// En producción, también enviar a servicios externos
if (process.env.NODE_ENV === 'production' && process.env.AUDIT_WEBHOOK_URL) {
  // Aquí podrías agregar transporte a ElasticSearch, Splunk, etc.
  // Por ejemplo, un webhook transport
}

// Clase principal de auditoría
export class AuditService {
  private static instance: AuditService;

  private constructor() {}

  public static getInstance(): AuditService {
    if (!AuditService.instance) {
      AuditService.instance = new AuditService();
    }
    return AuditService.instance;
  }

  // Método principal para registrar eventos
  public log(event: Partial<AuditEvent> & { eventType: AuditEventType; action: string }): void {
    const auditEvent: AuditEvent = {
      eventId: crypto.randomUUID(),
      timestamp: new Date(),
      resource: '',
      result: 'success',
      ipAddress: '0.0.0.0',
      requestId: crypto.randomUUID(),
      ...event,
    };

    // Determinar el nivel de log según el tipo de evento
    const level = this.getLogLevel(auditEvent.eventType, auditEvent.result);
    
    auditLogger.log(level, 'Audit Event', auditEvent);
  }

  // Helper para extraer información de la request
  public fromRequest(req: Request & { user?: any }, eventType: AuditEventType, action: string): Partial<AuditEvent> {
    return {
      eventType,
      action,
      userId: req.user?.id,
      userName: req.user?.name,
      userEmail: req.user?.email,
      ipAddress: this.getClientIp(req),
      userAgent: req.get('user-agent'),
      resource: req.originalUrl,
      requestId: req.id || crypto.randomUUID(),
      sessionId: req.sessionID,
      metadata: {
        method: req.method,
        query: req.query,
        params: req.params,
        body: this.sanitizeBody(req.body),
      },
    };
  }

  // Auditar login exitoso
  public logLoginSuccess(req: Request, userId: string, userEmail: string): void {
    this.log({
      ...this.fromRequest(req, AuditEventType.LOGIN_SUCCESS, 'User logged in'),
      userId,
      userEmail,
      result: 'success',
    });
  }

  // Auditar intento de login fallido
  public logLoginFailure(req: Request, email: string, reason: string): void {
    this.log({
      ...this.fromRequest(req, AuditEventType.LOGIN_FAILURE, 'Login attempt failed'),
      userEmail: email,
      result: 'failure',
      errorMessage: reason,
      metadata: {
        email,
        reason,
        ipAddress: this.getClientIp(req),
      },
    });
  }

  // Auditar acceso denegado
  public logAccessDenied(req: Request & { user?: any }, resource: string, reason: string): void {
    this.log({
      ...this.fromRequest(req, AuditEventType.ACCESS_DENIED, 'Access denied'),
      resource,
      result: 'failure',
      errorMessage: reason,
    });
  }

  // Auditar operaciones CRUD
  public logCRUD(
    req: Request & { user?: any }, 
    operation: 'CREATE' | 'READ' | 'UPDATE' | 'DELETE',
    resourceType: string,
    resourceId?: string,
    success: boolean = true
  ): void {
    const eventType = AuditEventType[operation];
    this.log({
      ...this.fromRequest(req, eventType, `${operation} ${resourceType}`),
      result: success ? 'success' : 'failure',
      metadata: {
        resourceType,
        resourceId,
        ...this.fromRequest(req, eventType, '').metadata,
      },
    });
  }

  // Auditar uploads de archivos
  public logFileUpload(req: Request & { user?: any }, filename: string, size: number, success: boolean): void {
    this.log({
      ...this.fromRequest(req, AuditEventType.FILE_UPLOAD, 'File uploaded'),
      result: success ? 'success' : 'failure',
      metadata: {
        filename,
        size,
        mimeType: req.file?.mimetype,
      },
    });
  }

  // Obtener IP del cliente
  private getClientIp(req: Request): string {
    return req.ip || 
           req.socket.remoteAddress || 
           req.headers['x-forwarded-for']?.toString().split(',')[0] || 
           '0.0.0.0';
  }

  // Sanitizar body para no loguear información sensible
  private sanitizeBody(body: any): any {
    if (!body) return {};
    
    const sanitized = { ...body };
    const sensitiveFields = ['password', 'token', 'secret', 'apiKey', 'creditCard', 'ssn'];
    
    Object.keys(sanitized).forEach(key => {
      if (sensitiveFields.some(field => key.toLowerCase().includes(field))) {
        sanitized[key] = '***REDACTED***';
      }
    });
    
    return sanitized;
  }

  // Determinar nivel de log
  private getLogLevel(eventType: AuditEventType, result: 'success' | 'failure'): string {
    if (result === 'failure') {
      return 'warn';
    }

    const criticalEvents = [
      AuditEventType.DELETE,
      AuditEventType.CONFIGURATION_CHANGE,
      AuditEventType.SUSPICIOUS_ACTIVITY,
    ];

    if (criticalEvents.includes(eventType)) {
      return 'warn';
    }

    return 'info';
  }

  // Consultas de auditoría
  public async queryAuditLogs(filters: {
    startDate?: Date;
    endDate?: Date;
    userId?: string;
    eventType?: AuditEventType;
    resource?: string;
    result?: 'success' | 'failure';
  }): Promise<AuditEvent[]> {
    // Implementar consulta a los logs
    // Esto podría conectarse a ElasticSearch o similar
    throw new Error('Not implemented - use log aggregation service');
  }
}

// Exportar instancia singleton
export const auditService = AuditService.getInstance();