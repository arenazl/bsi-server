import { Request, Response, NextFunction } from 'express';
import chalk from 'chalk';

export interface LogEntry {
  timestamp: string;
  method: string;
  endpoint: string;
  ip: string;
  userId?: number;
  params?: any;
  query?: any;
  body?: any;
  statusCode?: number;
  responseTime?: number;
  responseData?: any;
  error?: any;
}

class DevLogger {
  private startTime: Map<string, number> = new Map();
  private isVerbose: boolean = process.argv.includes('--verbose') || process.env.VERBOSE === 'true';

  /**
   * Middleware para loggear requests/responses formateados
   */
  middleware() {
    return (req: Request, res: Response, next: NextFunction) => {
      // Skip si no estamos en desarrollo
      if (process.env.NODE_ENV === 'production' && !this.isVerbose) {
        return next();
      }

      // Generar ID único para este request
      const requestId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      (req as any).requestId = requestId;

      // Guardar tiempo de inicio
      this.startTime.set(requestId, Date.now());

      // Capturar datos del request
      const logEntry: LogEntry = {
        timestamp: new Date().toISOString(),
        method: req.method,
        endpoint: req.originalUrl,
        ip: req.ip || req.connection.remoteAddress || 'unknown',
        userId: (req as any).user?.id,
        params: Object.keys(req.params).length > 0 ? req.params : undefined,
        query: Object.keys(req.query).length > 0 ? req.query : undefined,
        body: this.sanitizeBody(req.body)
      };

      // Log del request
      this.logRequest(logEntry);

      // Interceptar response
      const originalSend = res.send;
      const originalJson = res.json;

      res.json = function(data: any) {
        res.locals.responseData = data;
        return originalJson.call(this, data);
      };

      res.send = function(data: any) {
        res.locals.responseData = data;
        return originalSend.call(this, data);
      };

      // Al terminar el response
      res.on('finish', () => {
        const endTime = Date.now();
        const startTime = this.startTime.get(requestId) || endTime;
        const responseTime = endTime - startTime;

        // Actualizar log entry con response
        logEntry.statusCode = res.statusCode;
        logEntry.responseTime = responseTime;
        logEntry.responseData = res.locals.responseData;

        // Log del response
        this.logResponse(logEntry);

        // Limpiar
        this.startTime.delete(requestId);
      });

      next();
    };
  }

  /**
   * Loggear request con formato bonito
   */
  private logRequest(entry: LogEntry) {
    if (!this.isVerbose && entry.endpoint.includes('/health')) return;

    console.log('\n' + chalk.cyan('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'));
    console.log(chalk.cyan('📥 REQUEST'));
    console.log(chalk.cyan('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'));
    
    console.log(chalk.gray('🕐 Time:     ') + chalk.white(new Date(entry.timestamp).toLocaleTimeString()));
    console.log(chalk.gray('📍 Method:   ') + this.getMethodColor(entry.method)(entry.method));
    console.log(chalk.gray('🌐 Endpoint: ') + chalk.yellow(entry.endpoint));
    console.log(chalk.gray('💻 IP:       ') + chalk.white(entry.ip));
    
    if (entry.userId) {
      console.log(chalk.gray('👤 User ID:  ') + chalk.white(entry.userId));
    }

    if (this.isVerbose) {
      if (entry.params) {
        console.log(chalk.gray('\n📌 Params:'));
        console.log(this.formatJson(entry.params));
      }

      if (entry.query) {
        console.log(chalk.gray('\n🔍 Query:'));
        console.log(this.formatJson(entry.query));
      }

      if (entry.body) {
        console.log(chalk.gray('\n📦 Body:'));
        console.log(this.formatJson(entry.body));
      }
    }
  }

  /**
   * Loggear response con formato bonito
   */
  private logResponse(entry: LogEntry) {
    if (!this.isVerbose && entry.endpoint.includes('/health')) return;

    console.log('\n' + chalk.green('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'));
    console.log(chalk.green('📤 RESPONSE'));
    console.log(chalk.green('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'));
    
    console.log(chalk.gray('✅ Status:   ') + this.getStatusColor(entry.statusCode!)(entry.statusCode!.toString()));
    console.log(chalk.gray('⏱️  Time:     ') + this.getResponseTimeColor(entry.responseTime!)(entry.responseTime + 'ms'));
    
    if (this.isVerbose && entry.responseData) {
      console.log(chalk.gray('\n📊 Response Data:'));
      
      // Limitar tamaño de response en logs
      const responseStr = JSON.stringify(entry.responseData);
      if (responseStr.length > 1000) {
        console.log(this.formatJson({
          ...entry.responseData,
          _truncated: true,
          _message: 'Response truncated. Original size: ' + responseStr.length
        }));
      } else {
        console.log(this.formatJson(entry.responseData));
      }
    }

    console.log(chalk.gray('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n'));
  }

  /**
   * Sanitizar body para no mostrar passwords
   */
  private sanitizeBody(body: any): any {
    if (!body || typeof body !== 'object') return body;

    const sanitized = { ...body };
    const sensitiveFields = ['password', 'token', 'secret', 'apiKey', 'refreshToken'];

    sensitiveFields.forEach(field => {
      if (sanitized[field]) {
        sanitized[field] = '***HIDDEN***';
      }
    });

    return sanitized;
  }

  /**
   * Formatear JSON con indentación y colores
   */
  private formatJson(obj: any): string {
    try {
      return JSON.stringify(obj, null, 2)
        .split('\n')
        .map(line => '  ' + line)
        .join('\n');
    } catch {
      return '  ' + String(obj);
    }
  }

  /**
   * Color según método HTTP
   */
  private getMethodColor(method: string) {
    const colors: { [key: string]: any } = {
      'GET': chalk.blue,
      'POST': chalk.green,
      'PUT': chalk.yellow,
      'DELETE': chalk.red,
      'PATCH': chalk.magenta
    };
    return colors[method] || chalk.white;
  }

  /**
   * Color según status code
   */
  private getStatusColor(status: number) {
    if (status >= 200 && status < 300) return chalk.green;
    if (status >= 300 && status < 400) return chalk.yellow;
    if (status >= 400 && status < 500) return chalk.red;
    if (status >= 500) return chalk.bgRed.white;
    return chalk.white;
  }

  /**
   * Color según tiempo de respuesta
   */
  private getResponseTimeColor(time: number) {
    if (time < 100) return chalk.green;
    if (time < 500) return chalk.yellow;
    if (time < 1000) return chalk.red;
    return chalk.bgRed.white;
  }

  /**
   * Logger para errores
   */
  logError(error: Error, req: Request) {
    console.log('\n' + chalk.red('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'));
    console.log(chalk.red('❌ ERROR'));
    console.log(chalk.red('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'));
    
    console.log(chalk.gray('🕐 Time:     ') + chalk.white(new Date().toLocaleTimeString()));
    console.log(chalk.gray('📍 Endpoint: ') + chalk.yellow(req.originalUrl));
    console.log(chalk.gray('💻 IP:       ') + chalk.white(req.ip));
    console.log(chalk.gray('❌ Error:    ') + chalk.red(error.message));
    
    if (this.isVerbose && error.stack) {
      console.log(chalk.gray('\n📚 Stack:'));
      console.log(chalk.red(error.stack));
    }
    
    console.log(chalk.red('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n'));
  }
}

export const devLogger = new DevLogger();