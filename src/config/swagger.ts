import swaggerJsdoc from 'swagger-jsdoc';
import { config } from './index';
import path from 'path';

// Determine if we're in production (compiled) or development
const isProduction = __dirname.includes('build');
const basePath = isProduction ? './build' : './src';

const swaggerOptions: swaggerJsdoc.Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'BSI API',
      version: '2.0.0',
      description: 'API profesional para el sistema BSI con autenticación JWT, auditoría completa y documentación interactiva.',
      contact: {
        name: 'BSI Development Team',
        email: 'support@bsi.com',
      },
      license: {
        name: 'MIT',
        url: 'https://opensource.org/licenses/MIT',
      },
    },
    servers: [
      {
        url: `http://localhost:${config.port}/api`,
        description: 'Development Server',
      },
      {
        url: `https://bsi-backend-staging.herokuapp.com/api`,
        description: 'Staging Server',
      },
      {
        url: `https://bsi-backend-prod.herokuapp.com/api`,
        description: 'Production Server',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'Enter your JWT token in the format: Bearer <token>',
        },
      },
      schemas: {
        Error: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              example: false,
            },
            message: {
              type: 'string',
              example: 'Error message',
            },
            error: {
              type: 'object',
              properties: {
                code: {
                  type: 'string',
                  example: 'ERROR_CODE',
                },
                details: {
                  type: 'array',
                  items: {
                    type: 'object',
                  },
                },
              },
            },
          },
        },
        ValidationError: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              example: false,
            },
            message: {
              type: 'string',
              example: 'Validation failed',
            },
            errors: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  field: {
                    type: 'string',
                    example: 'email',
                  },
                  message: {
                    type: 'string',
                    example: 'Invalid email format',
                  },
                },
              },
            },
          },
        },
        PaginationMeta: {
          type: 'object',
          properties: {
            page: {
              type: 'integer',
              example: 1,
            },
            limit: {
              type: 'integer',
              example: 10,
            },
            total: {
              type: 'integer',
              example: 100,
            },
            pages: {
              type: 'integer',
              example: 10,
            },
            hasNext: {
              type: 'boolean',
              example: true,
            },
            hasPrev: {
              type: 'boolean',
              example: false,
            },
          },
        },
        SuccessResponse: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              example: true,
            },
            message: {
              type: 'string',
              example: 'Operation successful',
            },
            data: {
              type: 'object',
              description: 'Response data',
            },
          },
        },
        // Auth DTOs
        LoginRequest: {
          type: 'object',
          required: ['email', 'password'],
          properties: {
            email: {
              type: 'string',
              format: 'email',
              example: 'admin@bsi.com',
              description: 'Email del usuario'
            },
            password: {
              type: 'string',
              minLength: 6,
              example: 'password123',
              description: 'Contraseña del usuario'
            },
          },
        },
        LoginResponse: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              example: true,
            },
            token: {
              type: 'string',
              example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
              description: 'JWT token de acceso'
            },
            refreshToken: {
              type: 'string',
              example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
              description: 'Token para renovar sesión'
            },
            user: {
              $ref: '#/components/schemas/User',
            },
            expiresIn: {
              type: 'number',
              example: 3600,
              description: 'Tiempo de expiración en segundos'
            },
          },
        },
        RefreshRequest: {
          type: 'object',
          required: ['refreshToken'],
          properties: {
            refreshToken: {
              type: 'string',
              example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
              description: 'Token de refresh válido'
            },
          },
        },
        
        // User DTOs
        User: {
          type: 'object',
          properties: {
            id: {
              type: 'integer',
              example: 1,
            },
            email: {
              type: 'string',
              format: 'email',
              example: 'usuario@bsi.com',
            },
            nombre: {
              type: 'string',
              example: 'Juan Pérez',
            },
            apellido: {
              type: 'string',
              example: 'González',
            },
            rol: {
              type: 'string',
              enum: ['admin', 'usuario', 'viewer'],
              example: 'usuario',
            },
            activo: {
              type: 'boolean',
              example: true,
            },
            organismo: {
              $ref: '#/components/schemas/Organismo',
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
              example: '2024-01-15T10:30:00Z',
            },
            updatedAt: {
              type: 'string',
              format: 'date-time',
              example: '2024-01-15T10:30:00Z',
            },
          },
        },
        CreateUserRequest: {
          type: 'object',
          required: ['email', 'password', 'nombre', 'apellido', 'rol', 'organismoId'],
          properties: {
            email: {
              type: 'string',
              format: 'email',
              example: 'nuevo@bsi.com',
            },
            password: {
              type: 'string',
              minLength: 6,
              example: 'password123',
            },
            nombre: {
              type: 'string',
              example: 'Juan',
            },
            apellido: {
              type: 'string',
              example: 'Pérez',
            },
            rol: {
              type: 'string',
              enum: ['admin', 'usuario', 'viewer'],
              example: 'usuario',
            },
            organismoId: {
              type: 'integer',
              example: 1,
            },
          },
        },
        UpdateUserRequest: {
          type: 'object',
          properties: {
            email: {
              type: 'string',
              format: 'email',
              example: 'actualizado@bsi.com',
            },
            nombre: {
              type: 'string',
              example: 'Juan Carlos',
            },
            apellido: {
              type: 'string',
              example: 'Pérez González',
            },
            rol: {
              type: 'string',
              enum: ['admin', 'usuario', 'viewer'],
              example: 'admin',
            },
            activo: {
              type: 'boolean',
              example: true,
            },
          },
        },

        // Nomina DTOs
        Nomina: {
          type: 'object',
          properties: {
            id: {
              type: 'integer',
              example: 1,
            },
            cuil: {
              type: 'string',
              pattern: '^[0-9]{11}$',
              example: '20123456789',
              description: 'CUIL del empleado (11 dígitos)'
            },
            nombre: {
              type: 'string',
              example: 'Juan Pérez',
              description: 'Nombre completo del empleado'
            },
            cbu: {
              type: 'string',
              pattern: '^[0-9]{22}$',
              example: '1234567890123456789012',
              description: 'CBU de la cuenta bancaria (22 dígitos)'
            },
            importe: {
              type: 'number',
              format: 'decimal',
              example: 150000.50,
              description: 'Importe a pagar'
            },
            concepto: {
              type: 'string',
              example: 'SUELDO',
              description: 'Concepto del pago'
            },
            estado: {
              type: 'string',
              enum: ['VALIDADO', 'ERROR', 'PROCESADO'],
              example: 'VALIDADO',
            },
            fechaProceso: {
              type: 'string',
              format: 'date-time',
              example: '2024-01-15T10:30:00Z',
            },
            contrato: {
              type: 'string',
              example: 'CONT001',
            },
            organismo: {
              $ref: '#/components/schemas/Organismo',
            },
          },
        },
        NominaValidationResponse: {
          type: 'object',
          properties: {
            estado: {
              type: 'integer',
              enum: [0, 1],
              example: 1,
              description: '1 = éxito, 0 = error'
            },
            descripcion: {
              type: 'string',
              example: 'Nómina procesada correctamente',
            },
            data: {
              type: 'object',
              properties: {
                totalRegistros: {
                  type: 'integer',
                  example: 150,
                },
                registrosValidados: {
                  type: 'integer',
                  example: 148,
                },
                registrosConError: {
                  type: 'integer',
                  example: 2,
                },
                errores: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      linea: {
                        type: 'integer',
                        example: 5,
                      },
                      error: {
                        type: 'string',
                        example: 'CBU inválido',
                      },
                    },
                  },
                },
              },
            },
          },
        },

        // Pago DTOs  
        Pago: {
          type: 'object',
          properties: {
            id: {
              type: 'integer',
              example: 1,
            },
            concepto: {
              type: 'string',
              example: 'SUELDO',
              description: 'Concepto del pago'
            },
            fechaPago: {
              type: 'string',
              format: 'date',
              example: '2024-01-15',
              description: 'Fecha programada para el pago'
            },
            importe: {
              type: 'number',
              format: 'decimal',
              example: 150000.50,
              description: 'Importe total del pago'
            },
            estado: {
              type: 'string',
              enum: ['PENDIENTE', 'PROCESADO', 'ENVIADO', 'ERROR'],
              example: 'PROCESADO',
            },
            contrato: {
              type: 'string',
              example: 'CONT001',
            },
            organismo: {
              $ref: '#/components/schemas/Organismo',
            },
            cantidadBeneficiarios: {
              type: 'integer',
              example: 150,
            },
            archivoGenerado: {
              type: 'string',
              example: 'PAGO_CONT001_20240115.txt',
              nullable: true,
            },
            fechaGeneracion: {
              type: 'string',
              format: 'date-time',
              example: '2024-01-15T10:30:00Z',
              nullable: true,
            },
          },
        },
        PagoGenerarArchivoRequest: {
          type: 'object',
          required: ['pagoId'],
          properties: {
            pagoId: {
              type: 'string',
              example: '123',
              description: 'ID del pago a procesar'
            },
            formato: {
              type: 'string',
              enum: ['TXT', 'CSV', 'EXCEL'],
              default: 'TXT',
              example: 'TXT',
              description: 'Formato del archivo a generar'
            },
          },
        },

        // Archivo DTOs
        Archivo: {
          type: 'object',
          properties: {
            id: {
              type: 'integer',
              example: 1,
            },
            nombreOriginal: {
              type: 'string',
              example: 'NOMINA-USER123-ORG001-CONT001-SUELDO-20240115.txt',
              description: 'Nombre original del archivo subido'
            },
            nombreSistema: {
              type: 'string',
              example: 'archivo_1705317000123.txt',
              description: 'Nombre interno del archivo en el sistema'
            },
            tipoModulo: {
              type: 'string',
              enum: ['NOMINA', 'PAGO', 'CUENTA'],
              example: 'NOMINA',
              description: 'Tipo de módulo al que pertenece el archivo'
            },
            estado: {
              type: 'string',
              enum: ['SUBIDO', 'PROCESANDO', 'PROCESADO', 'ERROR'],
              example: 'PROCESADO',
            },
            fechaSubida: {
              type: 'string',
              format: 'date-time',
              example: '2024-01-15T10:30:00Z',
            },
            tamano: {
              type: 'integer',
              example: 1024576,
              description: 'Tamaño del archivo en bytes'
            },
            registrosProcesados: {
              type: 'integer',
              example: 150,
              nullable: true,
            },
            registrosConError: {
              type: 'integer',
              example: 2,
              nullable: true,
            },
            usuario: {
              $ref: '#/components/schemas/User',
            },
            organismo: {
              $ref: '#/components/schemas/Organismo',
            },
          },
        },
        ArchivoEstadisticas: {
          type: 'object',
          properties: {
            totalArchivos: {
              type: 'integer',
              example: 45,
            },
            archivosProcesados: {
              type: 'integer',
              example: 40,
            },
            archivosConError: {
              type: 'integer',
              example: 3,
            },
            archivosPendientes: {
              type: 'integer',
              example: 2,
            },
            porModulo: {
              type: 'object',
              properties: {
                NOMINA: {
                  type: 'integer',
                  example: 20,
                },
                PAGO: {
                  type: 'integer',
                  example: 15,
                },
                CUENTA: {
                  type: 'integer',
                  example: 10,
                },
              },
            },
          },
        },

        // Organismo DTOs
        Organismo: {
          type: 'object',
          properties: {
            id: {
              type: 'integer',
              example: 1,
            },
            nombre: {
              type: 'string',
              example: 'Municipalidad de La Plata',
              description: 'Nombre del organismo'
            },
            cuit: {
              type: 'string',
              pattern: '^[0-9]{11}$',
              example: '30123456789',
              description: 'CUIT del organismo (11 dígitos)'
            },
            tipoOrganismo: {
              type: 'string',
              enum: ['MUNICIPIO', 'PROVINCIA', 'NACION', 'PRIVADO'],
              example: 'MUNICIPIO',
            },
            activo: {
              type: 'boolean',
              example: true,
            },
            direccion: {
              type: 'string',
              example: 'Av. 7 N° 878',
              nullable: true,
            },
            telefono: {
              type: 'string',
              example: '+54 221 427-5000',
              nullable: true,
            },
            email: {
              type: 'string',
              format: 'email',
              example: 'contacto@laplata.gov.ar',
              nullable: true,
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
              example: '2024-01-15T10:30:00Z',
            },
            updatedAt: {
              type: 'string',
              format: 'date-time',
              example: '2024-01-15T10:30:00Z',
            },
          },
        },
        CreateOrganismoRequest: {
          type: 'object',
          required: ['nombre', 'cuit', 'tipoOrganismo'],
          properties: {
            nombre: {
              type: 'string',
              example: 'Municipalidad de Berisso',
            },
            cuit: {
              type: 'string',
              pattern: '^[0-9]{11}$',
              example: '30123456780',
            },
            tipoOrganismo: {
              type: 'string',
              enum: ['MUNICIPIO', 'PROVINCIA', 'NACION', 'PRIVADO'],
              example: 'MUNICIPIO',
            },
            direccion: {
              type: 'string',
              example: 'Av. Montevideo 2502',
            },
            telefono: {
              type: 'string',
              example: '+54 221 464-1500',
            },
            email: {
              type: 'string',
              format: 'email',
              example: 'contacto@berisso.gov.ar',
            },
          },
        },

        // Cuenta DTOs
        Cuenta: {
          type: 'object',
          properties: {
            id: {
              type: 'integer',
              example: 1,
            },
            cuil: {
              type: 'string',
              pattern: '^[0-9]{11}$',
              example: '20123456789',
            },
            cbu: {
              type: 'string',
              pattern: '^[0-9]{22}$',
              example: '1234567890123456789012',
            },
            nombre: {
              type: 'string',
              example: 'Juan Pérez',
            },
            banco: {
              type: 'string',
              example: 'Banco Nación',
            },
            tipoCuenta: {
              type: 'string',
              enum: ['CAJA_AHORRO', 'CUENTA_CORRIENTE'],
              example: 'CAJA_AHORRO',
            },
            estado: {
              type: 'string',
              enum: ['ACTIVA', 'INACTIVA', 'BLOQUEADA'],
              example: 'ACTIVA',
            },
            organismo: {
              $ref: '#/components/schemas/Organismo',
            },
            fechaAlta: {
              type: 'string',
              format: 'date-time',
              example: '2024-01-15T10:30:00Z',
            },
          },
        },

        // Navigation DTOs
        MenuItem: {
          type: 'object',
          properties: {
            id: {
              type: 'integer',
              example: 1,
            },
            titulo: {
              type: 'string',
              example: 'Gestión de Nóminas',
            },
            ruta: {
              type: 'string',
              example: '/nominas',
              nullable: true,
            },
            icono: {
              type: 'string',
              example: 'fas fa-users',
              nullable: true,
            },
            orden: {
              type: 'integer',
              example: 1,
            },
            activo: {
              type: 'boolean',
              example: true,
            },
            padre: {
              type: 'integer',
              example: null,
              nullable: true,
            },
            children: {
              type: 'array',
              items: {
                $ref: '#/components/schemas/MenuItem',
              },
            },
          },
        },
        NavigationTree: {
          type: 'object',
          properties: {
            menu: {
              type: 'array',
              items: {
                $ref: '#/components/schemas/MenuItem',
              },
            },
            permisos: {
              type: 'array',
              items: {
                type: 'string',
              },
              example: ['nominas.read', 'pagos.write', 'admin.all'],
            },
          },
        },

        // Generic DTOs
        MetadataUI: {
          type: 'object',
          properties: {
            columns: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  field: {
                    type: 'string',
                    example: 'nombre',
                  },
                  header: {
                    type: 'string',
                    example: 'Nombre',
                  },
                  type: {
                    type: 'string',
                    enum: ['text', 'number', 'date', 'boolean'],
                    example: 'text',
                  },
                  sortable: {
                    type: 'boolean',
                    example: true,
                  },
                  filterable: {
                    type: 'boolean',
                    example: true,
                  },
                },
              },
            },
            actions: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  name: {
                    type: 'string',
                    example: 'edit',
                  },
                  label: {
                    type: 'string',
                    example: 'Editar',
                  },
                  icon: {
                    type: 'string',
                    example: 'fas fa-edit',
                  },
                },
              },
            },
          },
        },
        StoredProcedureRequest: {
          type: 'object',
          required: ['procedure', 'parameters'],
          properties: {
            procedure: {
              type: 'string',
              example: 'sp_get_nominas',
              description: 'Nombre del stored procedure a ejecutar'
            },
            parameters: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  name: {
                    type: 'string',
                    example: 'organismo_id',
                  },
                  value: {
                    type: 'string',
                    example: '1',
                  },
                  type: {
                    type: 'string',
                    enum: ['string', 'number', 'date', 'boolean'],
                    example: 'number',
                  },
                },
              },
            },
          },
        },
      },
      parameters: {
        PageParam: {
          name: 'page',
          in: 'query',
          description: 'Page number',
          required: false,
          schema: {
            type: 'integer',
            minimum: 1,
            default: 1,
          },
        },
        LimitParam: {
          name: 'limit',
          in: 'query',
          description: 'Number of items per page',
          required: false,
          schema: {
            type: 'integer',
            minimum: 1,
            maximum: 100,
            default: 10,
          },
        },
        SortParam: {
          name: 'sort',
          in: 'query',
          description: 'Sort field and order (e.g., "-createdAt" for descending)',
          required: false,
          schema: {
            type: 'string',
          },
        },
        SearchParam: {
          name: 'search',
          in: 'query',
          description: 'Search term',
          required: false,
          schema: {
            type: 'string',
          },
        },
      },
      responses: {
        UnauthorizedError: {
          description: 'Authentication required',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/Error',
              },
              example: {
                success: false,
                message: 'Authentication required',
                error: {
                  code: 'UNAUTHORIZED',
                },
              },
            },
          },
        },
        ForbiddenError: {
          description: 'Insufficient permissions',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/Error',
              },
              example: {
                success: false,
                message: 'Insufficient permissions',
                error: {
                  code: 'FORBIDDEN',
                },
              },
            },
          },
        },
        NotFoundError: {
          description: 'Resource not found',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/Error',
              },
              example: {
                success: false,
                message: 'Resource not found',
                error: {
                  code: 'NOT_FOUND',
                },
              },
            },
          },
        },
        ValidationError: {
          description: 'Validation error',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/ValidationError',
              },
            },
          },
        },
        InternalError: {
          description: 'Internal server error',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/Error',
              },
              example: {
                success: false,
                message: 'An unexpected error occurred',
                error: {
                  code: 'INTERNAL_ERROR',
                },
              },
            },
          },
        },
      },
    },
    security: [
      {
        bearerAuth: [],
      },
    ],
    tags: [
      {
        name: 'Auth',
        description: 'Authentication endpoints',
      },
      {
        name: 'Users',
        description: 'User management endpoints',
      },
      {
        name: 'Files',
        description: 'File upload and management',
      },
      {
        name: 'Metadata',
        description: 'Metadata operations',
      },
      {
        name: 'Health',
        description: 'Health check endpoints',
      },
      // Tags V2 - Orientados al negocio
      {
        name: 'Nominas',
        description: 'Gestión de nóminas - Procesamiento de archivos TXT/Excel',
      },
      {
        name: 'Pagos',
        description: 'Gestión de pagos - Generación de archivos y transferencias',
      },
      {
        name: 'Archivos',
        description: 'Gestión de archivos - Subida, descarga y procesamiento',
      },
      {
        name: 'Organismos',
        description: 'Gestión de organismos/municipios',
      },
    ],
  },
  apis: [
    `${basePath}/routes/*.ts`,
    `${basePath}/routes/*.js`,
    `${basePath}/models/*.ts`,
    `${basePath}/models/*.js`,
    `${basePath}/controllers/*.ts`,
    `${basePath}/controllers/*.js`,
  ],
};

// Configuración separada para v2
const swaggerOptionsV2 = {
  definition: {
    ...swaggerOptions.definition,
    info: {
      title: 'BSI API v2.0 - Business Oriented',
      description: 'API v2 orientada al negocio con arquitectura MVC simple',
      version: '2.0.0',
    },
    servers: [
      {
        url: `http://localhost:${config.port}/api/v2`,
        description: 'API v2 - Development',
      },
      {
        url: `https://api.bsi.com/api/v2`,
        description: 'API v2 - Production',
      },
    ],
  },
  apis: [
    `${basePath}/routes-v2/*.ts`,
    `${basePath}/routes-v2/*.js`,
    `${basePath}/models/*.ts`,
    `${basePath}/models/*.js`,
  ],
};

export const swaggerSpec = swaggerJsdoc(swaggerOptions);
export const swaggerSpecV2 = swaggerJsdoc(swaggerOptionsV2);