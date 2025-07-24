import dotenv from 'dotenv';

// Cargar variables de entorno
dotenv.config();

// Validar variables de entorno requeridas
const requiredEnvVars = [
  'DB_PRIMARY_HOST',
  'DB_PRIMARY_USER', 
  'DB_PRIMARY_PASSWORD',
  'DB_PRIMARY_NAME',
  'JWT_SECRET',
  'JWT_REFRESH_SECRET'
];

for (const envVar of requiredEnvVars) {
  if (!process.env[envVar]) {
    throw new Error(`Missing required environment variable: ${envVar}`);
  }
}

export const config = {
  // Environment
  env: process.env.NODE_ENV || 'development',
  isDevelopment: process.env.NODE_ENV === 'development',
  isProduction: process.env.NODE_ENV === 'production',
  
  // Server
  port: parseInt(process.env.PORT || '3000', 10),
  apiPrefix: process.env.API_PREFIX || '/api/v1',
  
  // Database Configurations
  database: {
    // Primary Database (Main)
    primary: {
      host: process.env.DB_PRIMARY_HOST!,
      port: parseInt(process.env.DB_PRIMARY_PORT || '3306', 10),
      user: process.env.DB_PRIMARY_USER!,
      password: process.env.DB_PRIMARY_PASSWORD!,
      database: process.env.DB_PRIMARY_NAME!,
      connectionLimit: parseInt(process.env.DB_CONNECTION_LIMIT || '10', 10),
      waitForConnections: true,
      queueLimit: 0,
      timezone: 'Z',
      ...(process.env.DB_PRIMARY_SSL_CA && {
        ssl: {
          ca: require('fs').readFileSync(require('path').resolve(process.env.DB_PRIMARY_SSL_CA), 'utf-8')
        }
      })
    },
    // Núcleo Database Local
    nucleo: {
      host: process.env.DB_NUCLEO_HOST!,
      port: parseInt(process.env.DB_NUCLEO_PORT || '3306', 10),
      user: process.env.DB_NUCLEO_USER!,
      password: process.env.DB_NUCLEO_PASSWORD!,
      database: process.env.DB_NUCLEO_NAME!,
      connectionLimit: parseInt(process.env.DB_CONNECTION_LIMIT || '10', 10),
      waitForConnections: true,
      queueLimit: 0,
      timezone: 'Z'
    },
    // Núcleo Database Online
    nucleoOnline: {
      host: process.env.DB_NUCLEO_ONLINE_HOST!,
      port: parseInt(process.env.DB_NUCLEO_ONLINE_PORT || '3306', 10),
      user: process.env.DB_NUCLEO_ONLINE_USER!,
      password: process.env.DB_NUCLEO_ONLINE_PASSWORD!,
      database: process.env.DB_NUCLEO_ONLINE_NAME!,
      connectionLimit: parseInt(process.env.DB_CONNECTION_LIMIT || '10', 10),
      waitForConnections: true,
      queueLimit: 0,
      timezone: 'Z',
      ...(process.env.DB_NUCLEO_ONLINE_SSL_CA && {
        ssl: {
          ca: require('fs').readFileSync(require('path').resolve(process.env.DB_NUCLEO_ONLINE_SSL_CA), 'utf-8')
        }
      })
    }
  },
  
  // JWT
  jwt: {
    secret: process.env.JWT_SECRET!,
    expiresIn: process.env.JWT_EXPIRES_IN || '15m',
    refreshSecret: process.env.JWT_REFRESH_SECRET!,
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
  },
  
  // AWS
  aws: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    region: process.env.AWS_REGION || 'us-east-1',
    s3Bucket: process.env.AWS_S3_BUCKET,
  },
  
  // Email Configuration  
  email: {
    service: process.env.EMAIL_SERVICE || 'gmail',
    host: process.env.EMAIL_HOST || process.env.SMTP_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.EMAIL_PORT || process.env.SMTP_PORT || '587', 10),
    secure: process.env.EMAIL_SECURE === 'true' || process.env.SMTP_SECURE === 'true',
    auth: {
      user: process.env.EMAIL_USER || process.env.SMTP_USER,
      pass: process.env.EMAIL_PASSWORD || process.env.SMTP_PASSWORD,
    },
    from: process.env.EMAIL_FROM || 'BSI System <noreply@bsi.com>',
    adminEmail: process.env.ADMIN_EMAIL,
    controlEmail: process.env.CONTROL_EMAIL,
  },
  
  // External APIs
  apis: {
    openai: {
      apiKey: process.env.OPENAI_API_KEY,
      organization: process.env.OPENAI_ORGANIZATION,
    },
    meta: {
      token: process.env.META_API_TOKEN,
      phoneNumberId: process.env.WHATSAPP_PHONE_NUMBER_ID,
    },
  },
  
  // Security
  security: {
    bcryptRounds: parseInt(process.env.BCRYPT_ROUNDS || '10', 10),
    corsOrigin: process.env.CORS_ORIGIN || 'http://localhost:4200',
    sessionSecret: process.env.SESSION_SECRET || 'default-session-secret',
  },
  
  // Rate Limiting
  rateLimit: {
    windowMs: parseInt(process.env.API_RATE_LIMIT_WINDOW_MS || '900000', 10), // 15 minutes
    max: parseInt(process.env.API_RATE_LIMIT_MAX_REQUESTS || '100', 10),
    enabled: process.env.ENABLE_RATE_LIMIT !== 'false',
  },
  
  // Logging
  logging: {
    level: process.env.LOG_LEVEL || 'info',
    dir: process.env.LOG_DIR || './logs',
  },
  
  // File Upload
  upload: {
    maxFileSize: parseInt(process.env.MAX_FILE_SIZE || '10485760', 10), // 10MB
    uploadDir: process.env.UPLOAD_DIR || './uploads',
    allowedMimeTypes: [
      'image/jpeg',
      'image/png',
      'image/gif',
      'application/pdf',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'text/plain',
      'text/csv',
    ],
  },
  
  // Redis (Optional)
  redis: process.env.REDIS_HOST ? {
    host: process.env.REDIS_HOST,
    port: parseInt(process.env.REDIS_PORT || '6379', 10),
    password: process.env.REDIS_PASSWORD,
  } : null,
  
  // Feature Flags
  features: {
    swagger: process.env.ENABLE_SWAGGER !== 'false',
    audit: process.env.ENABLE_AUDIT !== 'false',
    rateLimit: process.env.ENABLE_RATE_LIMIT !== 'false',
  },
  
  // Monitoring
  monitoring: {
    sentryDsn: process.env.SENTRY_DSN,
    newRelicKey: process.env.NEW_RELIC_LICENSE_KEY,
    auditWebhookUrl: process.env.AUDIT_WEBHOOK_URL,
  },
};

// Función helper para obtener configuración tipada
export function getConfig<T extends keyof typeof config>(key: T): typeof config[T] {
  return config[key];
}