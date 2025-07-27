import dotenv from 'dotenv';

// Cargar variables de entorno
dotenv.config();

// Database configuration - using hardcoded values for Heroku (like your other 3 apps)
const isProduction = process.env.NODE_ENV === 'production';
const sslCertPath = isProduction ? './build/DB/crt/ca.pem' : './src/DB/crt/ca.pem';

const databaseConfig = {
  host: 'mysql-aiven-arenazl.e.aivencloud.com',
  user: 'avnadmin',
  password: 'AVNS_Fqe0qsChCHnqSnVsvoi',
  database: 'defaultdev',
  port: 23108,
  ssl: {
    ca: sslCertPath
  }
};

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
      host: databaseConfig.host,
      port: databaseConfig.port,
      user: databaseConfig.user,
      password: databaseConfig.password,
      database: databaseConfig.database,
      connectionLimit: 10,
      waitForConnections: true,
      queueLimit: 0,
      timezone: 'Z',
      ...(databaseConfig.ssl?.ca && {
        ssl: {
          ca: require('fs').readFileSync(require('path').resolve(databaseConfig.ssl.ca), 'utf-8')
        }
      })
    },
    // Núcleo Database Local
    nucleo: {
      host: process.env.DB_NUCLEO_HOST || 'localhost',
      port: parseInt(process.env.DB_NUCLEO_PORT || '3306', 10),
      user: process.env.DB_NUCLEO_USER || 'root',
      password: process.env.DB_NUCLEO_PASSWORD || '',
      database: process.env.DB_NUCLEO_NAME || 'ng',
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
  
  // JWT (not used according to user)
  jwt: {
    secret: 'not-used',
    expiresIn: '15m',
    refreshSecret: 'not-used',
    refreshExpiresIn: '7d',
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
    service: 'gmail',
    host: 'smtp.gmail.com',
    port: 587,
    secure: false,
    auth: {
      user: 'arenazl@gmail.com',
      pass: 'wyev fcmg ohbn uawv',
    },
    from: 'BSI <arenazl@gmail.com>',
    adminEmail: 'arenazl@gmail.com',
    controlEmail: 'arenazl@gmail.com',
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
    corsOrigin: process.env.CORS_ORIGIN ? process.env.CORS_ORIGIN.split(',') : ['http://localhost:4200', 'https://bsi-front.herokuapp.com', 'https://bsi-new.herokuapp.com', 'https://bsi-front-new-20ad7335b66c.herokuapp.com'],
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