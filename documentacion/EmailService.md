# EmailService - Servicio de Correo Electrónico

## Descripción
EmailService es un servicio singleton que permite enviar correos electrónicos desde cualquier controlador de la API. Sigue el mismo patrón que DatabaseHelper y se auto-inicializa al importarlo.

## Configuración
El servicio utiliza la configuración SMTP de Gmail definida en `keys.ts`:

```typescript
emailConfig: {
  service: 'gmail',
  host: 'smtp.gmail.com',
  port: 587,
  secure: false,
  auth: {
    user: process.env.EMAIL_USER || 'your-email@gmail.com',
    pass: process.env.EMAIL_PASSWORD || 'your-app-password'
  }
}
```

**Importante**: Asegúrate de configurar las variables de entorno:
- `EMAIL_USER`: Tu email de Gmail
- `EMAIL_PASSWORD`: Tu contraseña de aplicación de Gmail (no tu contraseña normal)

## Uso Básico

### 1. Importar el servicio
```typescript
import EmailService from "../services/emailService";
```

### 2. Métodos simplificados (RECOMENDADOS)

#### Enviar notificación de error
```typescript
try {
  // Tu código aquí
} catch (error: any) {
  await EmailService.sendErrorNotificationSimple(
    'Error al crear usuario',
    error.message || error.toString(),
    'Se produjo un error al intentar crear un nuevo usuario en el sistema.'
  );
}
```

#### Enviar notificación de advertencia
```typescript
await EmailService.sendWarningNotification(
  'Advertencia del sistema',
  'Memoria casi llena',
  'El sistema está cerca del límite de memoria. Considere liberar espacio.'
);
```

#### Enviar notificación de información/éxito
```typescript
await EmailService.sendInfoNotification(
  'Proceso completado',
  'Backup realizado exitosamente',
  'El backup automático se completó sin errores.'
);
```

### 3. Método completo (uso avanzado)
```typescript
await EmailService.sendErrorNotification({
  title: 'Error personalizado',
  errorType: 'error', // 'success' | 'warning' | 'error'
  errorMessage: error.message || error.toString(),
  friendlyDescription: 'Descripción amigable del error.',
  recipients: ['admin@email.com', 'dev@email.com'] // Destinatarios personalizados
});
```

### 4. Enviar email personalizado
```typescript
await EmailService.sendCustomEmail(
  'destinatario@email.com',
  'Asunto del email',
  '<h1>Contenido HTML</h1><p>Tu mensaje aquí</p>'
);
```

## Tipos de Notificación

### Error (rojo)
```typescript
errorType: 'error'
```

### Advertencia (amarillo)
```typescript
errorType: 'warning'
```

### Éxito (verde)
```typescript
errorType: 'success'
```

## Lista de Emails Disponibles
Los emails están configurados en `config.mails`:
- `admin`: Email del administrador
- `control`: Email de control
- `documentacion`: Email de documentación
- `new`: Email de new life
- `cj`: Email de bienes cintiap
- `real`: Email de real estate
- `ar`: Email de desarrollo inmobiliario

## Ejemplo Completo
```typescript
import { Request, Response } from "express";
import EmailService from "../services/emailService";
import config from "../keys";

class MiController {
  public async miMetodo(req: Request, res: Response): Promise<void> {
    try {
      // Tu lógica de negocio aquí
      
      // Enviar email de éxito
      await EmailService.sendErrorNotification({
        title: 'Operación exitosa',
        errorType: 'success',
        errorMessage: 'La operación se completó correctamente',
        friendlyDescription: 'El proceso se ejecutó sin problemas.',
        recipients: config.mails.admin
      });
      
      res.json({ success: true });
    } catch (error: any) {
      // Enviar email de error
      await EmailService.sendErrorNotification({
        title: 'Error en operación',
        errorType: 'error',
        errorMessage: error.message,
        friendlyDescription: 'Se produjo un error durante la operación.',
        recipients: [config.mails.admin, config.mails.control]
      });
      
      res.status(500).json({ error: 'Error interno' });
    }
  }
}
```

## Características
- ✅ Patrón Singleton (una sola instancia)
- ✅ Plantillas HTML automáticas con colores por tipo
- ✅ Soporte para múltiples destinatarios
- ✅ Envío de emails personalizados
- ✅ Integración con Gmail SMTP
- ✅ Manejo de errores robusto
- ✅ Fácil de usar desde cualquier controlador
