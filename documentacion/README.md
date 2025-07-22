# Documentación del Proyecto BSI Server

Esta carpeta contiene toda la documentación técnica del proyecto BSI Server API.

## Índice de Documentación

### Servicios
- [**EmailService**](./EmailService.md) - Servicio de correo electrónico singleton para envío de notificaciones

## Estructura del Proyecto

```
bsi-server/
├── src/
│   ├── controllers/     # Controladores de la API
│   ├── services/        # Servicios singleton
│   ├── routes/          # Definición de rutas
│   ├── models/          # Modelos de datos
│   ├── enums/           # Enumeraciones
│   └── crt/             # Certificados SSL
├── documentacion/       # Documentación técnica
└── build/               # Código compilado
```

## Convenciones

### Servicios
- Los servicios siguen el patrón Singleton
- Se auto-inicializan al importarlos: `export default ServiceName.getInstance()`
- Se importan desde cualquier controlador sin necesidad de instanciar

### Documentación
- Cada servicio o componente principal debe tener su documentación en esta carpeta
- Los archivos deben seguir el formato: `NombreDelServicio.md`
- Incluir ejemplos de uso y configuración necesaria

## Configuración General

### Variables de Entorno
El proyecto utiliza las siguientes variables de entorno definidas en `.env`:

```env
# OpenAI API Key
OPENAI_API_KEY=your-openai-api-key-here

# Email Configuration  
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-app-password

# Server Configuration
PORT=3000
```

### Base de Datos
La conexión a base de datos se maneja a través de `DatabaseHelper` (singleton) configurado en `keys.ts`.

### Correos Electrónicos
Lista de correos configurados en `config.mails`:
- `admin`: Administrador del sistema
- `control`: Control de proyectos
- `documentacion`: Documentación
- `new`: New Life
- `cj`: Bienes Cintiap
- `real`: Real Estate
- `ar`: Desarrollo Inmobiliario

## Contribuir

Al agregar nuevos servicios o funcionalidades:

1. Crear la documentación correspondiente en esta carpeta
2. Actualizar este README con el nuevo índice
3. Seguir las convenciones establecidas
4. Incluir ejemplos de uso claros
