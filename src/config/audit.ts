// Archivo simplificado temporalmente para evitar errores de compilación
// TODO: Restaurar funcionalidad completa de auditoría

export const auditConfig = {
  enabled: false,
  logLevel: 'info'
};

// Mock del audit logger para no romper imports
export const auditLogger = {
  log: () => {},
  logUserLogin: () => {},
  logUserLogout: () => {},
  logResourceAccess: () => {},
  logDataModification: () => {},
  logError: () => {},
  logRequest: () => {}
};

// Enum temporal para tipos de evento de auditoría
export enum AuditEventType {
  USER_LOGIN = 'USER_LOGIN',
  USER_LOGOUT = 'USER_LOGOUT',
  LOGIN_SUCCESS = 'LOGIN_SUCCESS',
  LOGIN_FAILURE = 'LOGIN_FAILURE',
  LOGOUT = 'LOGOUT',
  TOKEN_REFRESH = 'TOKEN_REFRESH',
  RESOURCE_ACCESS = 'RESOURCE_ACCESS',
  DATA_CREATE = 'DATA_CREATE',
  DATA_UPDATE = 'DATA_UPDATE',
  DATA_DELETE = 'DATA_DELETE',
  CREATE = 'CREATE',
  UPDATE = 'UPDATE',
  DELETE = 'DELETE',
  ERROR = 'ERROR',
  SYSTEM_ERROR = 'SYSTEM_ERROR'
}

// Mock del servicio de auditoría
export const auditService = {
  log: (event: AuditEventType, details: any) => {},
  logUserActivity: (userId: string, action: string, details?: any) => {},
  logSystemEvent: (event: string, details?: any) => {},
  logError: (error: Error, context?: any) => {},
  fromRequest: (req: any) => ({
    log: (event: AuditEventType, details?: any) => {},
    logActivity: (action: string, details?: any) => {}
  })
};

export default auditLogger;