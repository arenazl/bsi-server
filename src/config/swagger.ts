import swaggerJsdoc from 'swagger-jsdoc';
import { config } from './index';

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
        // Schemas para V2
        Nomina: {
          type: 'object',
          properties: {
            id: {
              type: 'integer',
              example: 1,
            },
            cuil: {
              type: 'string',
              example: '20123456789',
            },
            nombre: {
              type: 'string',
              example: 'Juan Pérez',
            },
            cbu: {
              type: 'string',
              example: '1234567890123456789012',
            },
            estado: {
              type: 'string',
              enum: ['VALIDADO', 'ERROR', 'PROCESADO'],
              example: 'VALIDADO',
            },
          },
        },
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
            },
            fechaPago: {
              type: 'string',
              format: 'date',
              example: '2024-01-15',
            },
            importe: {
              type: 'number',
              example: 150000.50,
            },
            estado: {
              type: 'string',
              enum: ['PENDIENTE', 'PROCESADO', 'ENVIADO'],
              example: 'PROCESADO',
            },
          },
        },
        Archivo: {
          type: 'object',
          properties: {
            id: {
              type: 'integer',
              example: 1,
            },
            nombreOriginal: {
              type: 'string',
              example: 'nomina_enero_2024.txt',
            },
            tipoModulo: {
              type: 'string',
              enum: ['NOMINA', 'PAGO', 'CUENTA'],
              example: 'NOMINA',
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
          },
        },
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
            },
            cuit: {
              type: 'string',
              example: '30123456789',
            },
            tipoOrganismo: {
              type: 'string',
              example: 'MUNICIPIO',
            },
            activo: {
              type: 'boolean',
              example: true,
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
    './src/routes/*.ts',
    './src/routes/*.js',
    './src/models/*.ts',
    './src/models/*.js',
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
    './src/routes-v2/*.ts',
    './src/routes-v2/*.js',
    './src/models/*.ts',
    './src/models/*.js',
  ],
};

export const swaggerSpec = swaggerJsdoc(swaggerOptions);
export const swaggerSpecV2 = swaggerJsdoc(swaggerOptionsV2);