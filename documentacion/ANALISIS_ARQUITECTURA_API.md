# 🏗️ Análisis y Propuesta de Arquitectura - API BSI-2025

## 📋 Análisis del Estado Actual

### Problemas Identificados:

#### 1. **Seguridad Crítica**
- **Credenciales Hardcodeadas** (`bsi-server/src/keys.ts:14-56`)
  - Passwords de base de datos expuestos
  - Tokens de API (Meta/WhatsApp) en código fuente
  - Credenciales AWS visibles

#### 2. **Arquitectura**
- **Acoplamiento directo**: Controllers → Database sin capa de servicios
- **Sin validación**: Datos sin validar llegan directo a la BD
- **Sin autenticación real**: Solo login básico sin JWT/sessions
- **Mezcla de frameworks**: Angular + React en el mismo proyecto

#### 3. **Calidad de Código**
- **Uso excesivo de `any`**: Pérdida de type safety
- **Sin manejo de errores**: Catch básicos con console.log
- **Código duplicado**: Violaciones DRY en múltiples lugares
- **Comentarios no profesionales**: "DB super is Fucking Connected"

#### 4. **Vulnerabilidades SQL**
```typescript
// databaseHelper.ts:42-43
const sql = `CALL ${spName}(${placeholders});`; // spName sin validar
```

#### 5. **Performance**
- **O(n²) en auditoria.component.ts**: 10 llamadas API secuenciales
- **N+1 queries**: Loops con queries individuales
- **Memory leaks**: Blob URLs sin limpiar
- **Operaciones síncronas**: `fs.readFileSync` bloqueando event loop

## 🎯 Arquitectura Propuesta: Clean Architecture + DDD

### 1. **Estructura de Capas**

```
bsi-server/
├── src/
│   ├── domain/              # Lógica de negocio (DDD)
│   │   ├── entities/        # Entidades del dominio
│   │   ├── value-objects/   # Objetos de valor
│   │   ├── repositories/    # Interfaces de repositorios
│   │   └── services/        # Servicios de dominio
│   │
│   ├── application/         # Casos de uso
│   │   ├── use-cases/       # Lógica de aplicación
│   │   ├── dto/            # Data Transfer Objects
│   │   └── mappers/        # Mapeadores DTO ↔ Entity
│   │
│   ├── infrastructure/      # Implementaciones técnicas
│   │   ├── database/       # Implementación de repositorios
│   │   ├── http/           # Controllers REST
│   │   ├── security/       # JWT, autenticación
│   │   └── external/       # Servicios externos
│   │
│   └── shared/             # Código compartido
│       ├── errors/         # Manejo de errores
│       ├── utils/          # Utilidades
│       └── config/         # Configuración
```

### 2. **Implementación por Capas**

#### **Domain Layer** (Entidades y Lógica de Negocio)

```typescript
// domain/entities/User.ts
export class User {
  private constructor(
    private readonly id: UserId,
    private readonly email: Email,
    private readonly password: Password,
    private readonly profile: UserProfile
  ) {}

  static create(props: CreateUserProps): Either<DomainError, User> {
    // Validaciones de dominio
    const emailOrError = Email.create(props.email);
    if (emailOrError.isLeft()) return left(emailOrError.value);
    
    // ... más validaciones
    
    return right(new User(...));
  }

  changePassword(newPassword: string): Either<DomainError, void> {
    const passwordOrError = Password.create(newPassword);
    if (passwordOrError.isLeft()) return left(passwordOrError.value);
    
    this.password = passwordOrError.value;
    return right(undefined);
  }
}

// domain/value-objects/Email.ts
export class Email {
  private constructor(private readonly value: string) {}
  
  static create(email: string): Either<DomainError, Email> {
    if (!this.isValid(email)) {
      return left(new InvalidEmailError(email));
    }
    return right(new Email(email));
  }
  
  private static isValid(email: string): boolean {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return regex.test(email);
  }
}
```

#### **Application Layer** (Casos de Uso)

```typescript
// application/use-cases/CreateUser.ts
export class CreateUserUseCase {
  constructor(
    private userRepository: UserRepository,
    private eventBus: EventBus,
    private hashService: HashService
  ) {}

  async execute(dto: CreateUserDTO): Promise<Either<ApplicationError, UserDTO>> {
    // 1. Validar DTO
    const validationResult = await this.validator.validate(dto);
    if (validationResult.hasErrors()) {
      return left(new ValidationError(validationResult.errors));
    }

    // 2. Verificar que no existe
    const existingUser = await this.userRepository.findByEmail(dto.email);
    if (existingUser) {
      return left(new UserAlreadyExistsError(dto.email));
    }

    // 3. Crear entidad de dominio
    const hashedPassword = await this.hashService.hash(dto.password);
    const userOrError = User.create({ ...dto, password: hashedPassword });
    
    if (userOrError.isLeft()) {
      return left(userOrError.value);
    }

    // 4. Persistir
    const user = userOrError.value;
    await this.userRepository.save(user);

    // 5. Publicar evento
    await this.eventBus.publish(new UserCreatedEvent(user));

    // 6. Retornar DTO
    return right(UserMapper.toDTO(user));
  }
}
```

#### **Infrastructure Layer** (Implementaciones)

```typescript
// infrastructure/http/controllers/UserController.ts
@Controller('/api/v1/users')
@UseMiddleware(ErrorHandlerMiddleware)
export class UserController {
  constructor(
    private createUserUseCase: CreateUserUseCase,
    private getUserUseCase: GetUserUseCase,
    private updateUserUseCase: UpdateUserUseCase
  ) {}

  @Post('/')
  @UseMiddleware(ValidationMiddleware(CreateUserSchema))
  @UseMiddleware(AuthMiddleware)
  @UseMiddleware(RateLimitMiddleware({ window: 60, max: 10 }))
  async create(
    @Body() body: CreateUserDTO,
    @Res() res: Response
  ): Promise<Response> {
    const result = await this.createUserUseCase.execute(body);
    
    return result.fold(
      (error) => res.status(error.statusCode).json({ error: error.message }),
      (user) => res.status(201).json({ data: user })
    );
  }

  @Get('/:id')
  @UseMiddleware(AuthMiddleware)
  @UseMiddleware(CacheMiddleware({ ttl: 300 }))
  async getById(
    @Param('id') id: string,
    @Res() res: Response
  ): Promise<Response> {
    const result = await this.getUserUseCase.execute({ id });
    
    return result.fold(
      (error) => res.status(error.statusCode).json({ error: error.message }),
      (user) => res.status(200).json({ data: user })
    );
  }
}
```

### 3. **Autenticación y Seguridad**

#### **JWT + Refresh Tokens**

```typescript
// infrastructure/security/AuthService.ts
export class AuthService {
  constructor(
    private jwtService: JwtService,
    private refreshTokenRepository: RefreshTokenRepository,
    private userRepository: UserRepository
  ) {}

  async login(credentials: LoginDTO): Promise<Either<AuthError, TokenPair>> {
    // 1. Validar usuario
    const user = await this.userRepository.findByEmail(credentials.email);
    if (!user) return left(new InvalidCredentialsError());

    // 2. Verificar password
    const isValid = await bcrypt.compare(credentials.password, user.password);
    if (!isValid) return left(new InvalidCredentialsError());

    // 3. Generar tokens
    const accessToken = this.jwtService.sign(
      { sub: user.id, email: user.email, roles: user.roles },
      { expiresIn: '15m' }
    );

    const refreshToken = await this.generateRefreshToken(user.id);

    return right({ accessToken, refreshToken });
  }

  async refresh(refreshToken: string): Promise<Either<AuthError, TokenPair>> {
    // Validar y renovar tokens
    const storedToken = await this.refreshTokenRepository.find(refreshToken);
    if (!storedToken || storedToken.isExpired()) {
      return left(new InvalidRefreshTokenError());
    }

    // Generar nuevos tokens
    const user = await this.userRepository.findById(storedToken.userId);
    return this.generateTokenPair(user);
  }
}
```

#### **Middleware de Autenticación**

```typescript
// infrastructure/http/middleware/AuthMiddleware.ts
export class AuthMiddleware implements IMiddleware {
  constructor(
    private jwtService: JwtService,
    private userRepository: UserRepository
  ) {}

  async use(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      // 1. Extraer token
      const token = this.extractToken(req);
      if (!token) {
        return res.status(401).json({ error: 'No token provided' });
      }

      // 2. Verificar token
      const payload = await this.jwtService.verify(token);
      
      // 3. Cargar usuario
      const user = await this.userRepository.findById(payload.sub);
      if (!user) {
        return res.status(401).json({ error: 'User not found' });
      }

      // 4. Adjuntar al request
      req.user = user;
      req.permissions = await this.loadPermissions(user);
      
      next();
    } catch (error) {
      return res.status(401).json({ error: 'Invalid token' });
    }
  }
}
```

#### **Autorización basada en Roles/Permisos**

```typescript
// infrastructure/http/decorators/Permissions.ts
export function RequirePermissions(...permissions: Permission[]) {
  return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value;

    descriptor.value = async function (...args: any[]) {
      const [req, res] = args;
      
      const userPermissions = req.permissions || [];
      const hasPermission = permissions.every(p => 
        userPermissions.includes(p)
      );

      if (!hasPermission) {
        return res.status(403).json({ 
          error: 'Insufficient permissions' 
        });
      }

      return originalMethod.apply(this, args);
    };
  };
}

// Uso:
@RequirePermissions(Permission.CREATE_USER, Permission.ADMIN)
async createUser(req: Request, res: Response) {
  // Solo usuarios con permisos CREATE_USER y ADMIN
}
```

### 4. **Validación y DTOs**

#### **DTOs con Class-Validator**

```typescript
// application/dto/CreateUserDTO.ts
export class CreateUserDTO {
  @IsEmail({}, { message: 'Email inválido' })
  @IsNotEmpty({ message: 'Email es requerido' })
  email: string;

  @IsString()
  @MinLength(8, { message: 'Password debe tener al menos 8 caracteres' })
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/, {
    message: 'Password debe contener mayúsculas, minúsculas, números y caracteres especiales'
  })
  password: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  firstName: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  lastName: string;

  @IsEnum(UserRole)
  @IsOptional()
  role?: UserRole;
}
```

#### **Validation Middleware**

```typescript
// infrastructure/http/middleware/ValidationMiddleware.ts
export function ValidationMiddleware<T>(type: ClassConstructor<T>) {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      // Transformar y validar
      const dto = plainToClass(type, req.body);
      const errors = await validate(dto);

      if (errors.length > 0) {
        const formattedErrors = errors.map(error => ({
          field: error.property,
          constraints: error.constraints,
          children: error.children
        }));

        return res.status(400).json({
          error: 'Validation failed',
          details: formattedErrors
        });
      }

      // Sanitizar datos
      req.body = sanitize(dto);
      next();
    } catch (error) {
      return res.status(400).json({
        error: 'Invalid request format'
      });
    }
  };
}
```

### 5. **Manejo de Errores y Logging**

#### **Error Handler Global**

```typescript
// shared/errors/AppError.ts
export abstract class AppError extends Error {
  constructor(
    public readonly message: string,
    public readonly statusCode: number,
    public readonly isOperational: boolean = true,
    public readonly stack?: string
  ) {
    super(message);
    Object.setPrototypeOf(this, new.target.prototype);
    Error.captureStackTrace(this);
  }
}

// Errores específicos
export class ValidationError extends AppError {
  constructor(public readonly errors: ValidationErrorDetail[]) {
    super('Validation failed', 400);
  }
}

export class NotFoundError extends AppError {
  constructor(resource: string, id: string) {
    super(`${resource} with id ${id} not found`, 404);
  }
}

export class UnauthorizedError extends AppError {
  constructor(message = 'Unauthorized') {
    super(message, 401);
  }
}
```

#### **Error Middleware**

```typescript
// infrastructure/http/middleware/ErrorMiddleware.ts
export class ErrorMiddleware {
  constructor(
    private logger: Logger,
    private monitoring: MonitoringService
  ) {}

  async handle(
    error: Error,
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    // 1. Logging
    this.logger.error({
      error: {
        message: error.message,
        stack: error.stack,
        type: error.constructor.name
      },
      request: {
        method: req.method,
        url: req.url,
        headers: req.headers,
        body: req.body,
        user: req.user?.id
      },
      timestamp: new Date().toISOString()
    });

    // 2. Monitoring
    await this.monitoring.captureException(error, {
      user: req.user,
      extra: { requestId: req.id }
    });

    // 3. Response
    if (error instanceof AppError) {
      return res.status(error.statusCode).json({
        error: {
          message: error.message,
          code: error.constructor.name,
          ...(error instanceof ValidationError && { details: error.errors })
        }
      });
    }

    // Error no controlado
    const isProd = process.env.NODE_ENV === 'production';
    return res.status(500).json({
      error: {
        message: isProd ? 'Internal server error' : error.message,
        ...(!isProd && { stack: error.stack })
      }
    });
  }
}
```

### 6. **Testing Strategy**

```typescript
// tests/unit/domain/entities/User.spec.ts
describe('User Entity', () => {
  describe('create', () => {
    it('should create a valid user', () => {
      const result = User.create({
        email: 'test@example.com',
        password: 'Valid123!',
        firstName: 'John',
        lastName: 'Doe'
      });

      expect(result.isRight()).toBe(true);
      if (result.isRight()) {
        expect(result.value.email.value).toBe('test@example.com');
      }
    });

    it('should fail with invalid email', () => {
      const result = User.create({
        email: 'invalid-email',
        password: 'Valid123!',
        firstName: 'John',
        lastName: 'Doe'
      });

      expect(result.isLeft()).toBe(true);
      if (result.isLeft()) {
        expect(result.value).toBeInstanceOf(InvalidEmailError);
      }
    });
  });
});

// tests/integration/api/users.spec.ts
describe('POST /api/v1/users', () => {
  let app: Application;
  let token: string;

  beforeAll(async () => {
    app = await createTestApp();
    token = await getAdminToken();
  });

  afterEach(async () => {
    await cleanDatabase();
  });

  it('should create a new user', async () => {
    const response = await request(app)
      .post('/api/v1/users')
      .set('Authorization', `Bearer ${token}`)
      .send({
        email: 'newuser@example.com',
        password: 'SecurePass123!',
        firstName: 'New',
        lastName: 'User'
      });

    expect(response.status).toBe(201);
    expect(response.body.data).toMatchObject({
      email: 'newuser@example.com',
      firstName: 'New',
      lastName: 'User'
    });
  });
});
```

### 7. **Repository Pattern con TypeORM**

```typescript
// infrastructure/database/repositories/UserRepository.ts
@Injectable()
export class UserRepositoryImpl implements UserRepository {
  constructor(
    @InjectRepository(UserEntity)
    private readonly repository: Repository<UserEntity>
  ) {}

  async findById(id: string): Promise<User | null> {
    const entity = await this.repository.findOne({ 
      where: { id },
      relations: ['profile', 'roles']
    });
    
    return entity ? UserMapper.toDomain(entity) : null;
  }

  async save(user: User): Promise<void> {
    const entity = UserMapper.toPersistence(user);
    await this.repository.save(entity);
  }

  async findByEmail(email: string): Promise<User | null> {
    const entity = await this.repository
      .createQueryBuilder('user')
      .where('user.email = :email', { email })
      .leftJoinAndSelect('user.profile', 'profile')
      .leftJoinAndSelect('user.roles', 'roles')
      .getOne();
    
    return entity ? UserMapper.toDomain(entity) : null;
  }
}
```

## 📚 Resumen de Mejoras Arquitectónicas

### **1. Arquitectura por Capas (Clean Architecture)**
- **Domain**: Lógica de negocio pura
- **Application**: Casos de uso y orquestación
- **Infrastructure**: Implementaciones técnicas
- **Shared**: Código compartido

### **2. Patrones Implementados**
- **Repository Pattern**: Abstracción de acceso a datos
- **Use Case Pattern**: Lógica de aplicación aislada
- **DTO Pattern**: Transferencia de datos segura
- **Dependency Injection**: Desacoplamiento de componentes
- **Either Monad**: Manejo funcional de errores

### **3. Seguridad Mejorada**
- **JWT + Refresh Tokens**: Autenticación robusta
- **RBAC**: Control de acceso basado en roles
- **Rate Limiting**: Protección contra ataques
- **Input Validation**: Validación exhaustiva
- **CORS + Security Headers**: Protección adicional

### **4. Calidad y Mantenibilidad**
- **TypeScript Strict**: Type safety completo
- **Testing**: Unit + Integration + E2E
- **Logging Estructurado**: Trazabilidad completa
- **Documentación OpenAPI**: API auto-documentada
- **Error Handling**: Manejo consistente de errores

### **5. Performance**
- **Connection Pooling**: Gestión eficiente de conexiones
- **Caching Strategy**: Redis para datos frecuentes
- **Pagination**: Manejo eficiente de grandes datasets
- **Async/Await**: Operaciones no bloqueantes

### **6. Ejemplo de Migración**

```typescript
// ANTES (Actual)
export class userController {
  public async login(req: Request, res: Response) {
    const { nombre, password } = req.body;
    const values = [nombre, password];
    const rows = await databaseHelper.executeSpSelect('sp_login_user', values);
    ResponseHelper.sendDatabaseResponse(res, rows);
  }
}

// DESPUÉS (Propuesto)
@Controller('/api/v1/auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('/login')
  @UseMiddleware(ValidationMiddleware(LoginDTO))
  @UseMiddleware(RateLimitMiddleware({ window: 60, max: 5 }))
  async login(
    @Body() credentials: LoginDTO,
    @Res() res: Response
  ): Promise<Response> {
    const result = await this.authService.login(credentials);
    
    return result.fold(
      (error) => res.status(error.statusCode).json({ error: error.message }),
      (tokens) => res.status(200).json({ data: tokens })
    );
  }
}
```

## 🚀 Plan de Implementación

### Fase 1: Seguridad Crítica (Semana 1)
1. Mover credenciales a variables de entorno
2. Implementar JWT authentication
3. Añadir validación de entrada básica
4. Corregir vulnerabilidades SQL

### Fase 2: Refactoring Core (Semanas 2-3)
1. Implementar estructura de capas
2. Crear DTOs y validadores
3. Implementar Repository Pattern
4. Añadir manejo de errores

### Fase 3: Testing y Documentación (Semana 4)
1. Añadir unit tests
2. Implementar integration tests
3. Configurar OpenAPI/Swagger
4. Documentar APIs

### Fase 4: Optimización (Semana 5)
1. Implementar caching
2. Añadir paginación
3. Optimizar queries
4. Configurar monitoring

Esta arquitectura proporciona:
- ✅ Escalabilidad
- ✅ Mantenibilidad
- ✅ Testabilidad
- ✅ Seguridad
- ✅ Documentación
- ✅ Monitoreo