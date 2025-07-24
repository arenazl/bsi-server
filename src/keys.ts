/**
 * ⚠️  ARCHIVO DEPRECADO - NO USAR
 * ================================
 * 
 * Este archivo ha sido MIGRADO a variables de entorno (.env) por seguridad.
 * 
 * 🔴 PROBLEMA: Credenciales hardcodeadas en código fuente
 * ✅ SOLUCIÓN: Usar @config/index que lee desde .env
 * 
 * Para usar la configuración actual:
 * import { config } from '@config/index';
 * 
 * Ver: CONFIGURACION-SEGURIDAD.md para más detalles
 * 
 * NOTA: Este archivo será eliminado en la próxima versión
 */

console.warn('⚠️  keys.ts está DEPRECADO. Usar @config/index en su lugar.');

// Re-export de la configuración segura para compatibilidad temporal
import { config as secureConfig } from './config/index';

const config = {
  // Mapeo de compatibilidad con keys.ts legacy
  database: secureConfig.database.primary,
  databaseNucleo: secureConfig.database.nucleo,
  databaseNucleoOnline: secureConfig.database.nucleoOnline,
  
  Tokens: {
    Meta: secureConfig.apis.meta.token
  },
  
  OpenAi: {
    key: secureConfig.apis.openai.apiKey
  },
  
  AWS: {
    bucketName: secureConfig.aws.s3Bucket,
    bucketRegion: secureConfig.aws.region,
    accesKey: secureConfig.aws.accessKeyId,
    secretKey: secureConfig.aws.secretAccessKey
  },
  
  mails: {
    control: secureConfig.email.controlEmail,
    admin: secureConfig.email.adminEmail
  },
  
  emailConfig: {
    service: secureConfig.email.service || 'gmail',
    host: secureConfig.email.host,
    port: secureConfig.email.port,
    secure: secureConfig.email.secure,
    auth: {
      user: secureConfig.email.auth.user,
      pass: secureConfig.email.auth.pass
    }
  }
};

export default config;
