# 📊 Modelo de Base de Datos - Sistema de Nóminas y Pagos

**Base de Datos:** `defaultdev`  
**MySQL Versión:** 8.0.35  
**Total Tablas:** 37  
**Fecha Análisis:** Junio 2025

---

## 🏗️ Arquitectura General del Sistema

El sistema está diseñado para gestionar **nóminas, pagos y contratos** con un enfoque de **operaciones bancarias** que incluye validaciones de CBU, CUIL/CUIT y gestión de archivos para transferencias.

### Flujo Principal:
1. **Organismos** contratan servicios
2. **Contratos** definen modalidades de pago
3. **Nóminas** se procesan con validaciones
4. **Pagos** se generan y ejecutan
5. **Logs** registran toda la actividad

---

## 📋 Catálogo de Tablas por Módulo

### 🏛️ **CORE - Entidades Principales**

#### **Organismo** (168 registros)
Entidades que contratan los servicios
```sql
- ID_Organismo (PK, int, auto_increment)
- Nombre (varchar, NOT NULL)
- Nombre_Corto (varchar, NOT NULL) 
- CUIT (char, NOT NULL)
- Dirección_* (varchar, nullable) - Calle, Número, Localidad, CP
- Sucursal_Bapro (varchar)
- Tipo_Organismo (int, FK)
- Tipo_Estado (int, FK)
- Fecha_Alta, Fecha_Baja, Fecha_Modificacion (date)
```

#### **Usuarios** (4 registros) + **Usuarios_Pass** (6 registros)
Sistema de autenticación y autorización
```sql
Usuarios:
- ID_USER (PK, int, auto_increment)
- ID_Organismo (int, FK)
- User_Name (varchar)
- CUIL (char, NOT NULL)
- Apellido, Nombre (varchar, NOT NULL)
- Telefono, Email (varchar)
- Cargo_Funcion, Perfil (varchar)
- Tipo_Estado (int, FK)
- Fechas de gestión

Usuarios_Pass:
- ID_UP (PK, int, auto_increment)
- USER_ID (int, FK)
- Pass (varchar, NOT NULL)
- Tipo_Estado (int, FK)
- Fecha_Alta (date)
```

### 📄 **CONTRATOS Y MODALIDADES**

#### **Contratos650** (14 registros)
Contratos principales del sistema
```sql
- Contrato_ID (PK, int, auto_increment)
- ID_Organismo (int, FK)
- Informacion_Discrecional (varchar)
- Id_Modalidad (int, FK)
- Rotulo (varchar)
- Ente (char)
- Cuenta_Debito (char, NOT NULL)  -- Cuenta bancaria
- Tipo_Estado (int, FK)
- Fecha_Alta, Fecha_Baja (date)
- indicativo (char)
```

#### **Modalidad** (6 registros)
Tipos de modalidades de pago
```sql
- Id_Modalidad (PK, int, auto_increment)
- Modalidad (varchar, NOT NULL)
- Texto_Boton (char)
```

#### **Concepto_Modalidad** (7 registros)
Conceptos asociados a cada modalidad
```sql
- Concepto_Modalidad (PK, int, auto_increment)
- Id_Modalidad (int, FK)
- Concepto (char)
- Texto_alta_masiva (char)
```

### 👥 **MÓDULO NÓMINAS**

#### **OP_NOMINA_CABECERA** (194 registros)
Cabeceras de operaciones de nómina
```sql
- id (PK, int, auto_increment)
- iduser (int, NOT NULL)
- idorg (int, NOT NULL) 
- idcont (int, NOT NULL)
- rotulo (varchar, NOT NULL)
- ente (varchar, NOT NULL)
- registros (int) -- Cantidad de empleados
- estado (tinyint, default 1)
- descripcion_validacion (varchar, default 'Validación exitosa')
- fecha_creacion, fecha_actualizacion (timestamp)
```

#### **OP_NOMINA_DETALLE** (1,925 registros)
Detalle de empleados en nóminas
```sql
- id (PK, int, auto_increment)
- nomina_cabecera_id (int, NOT NULL, FK)
- iduser, idorg, idcont (int, NOT NULL)
- cuil (varchar) -- CUIL del empleado
- apellidos, nombres (varchar)
- cbu (varchar) -- CBU para transferencia
- valido (tinyint, default 1)
- descripcion_validacion (varchar, default 'Validación exitosa')
- fecha_creacion, fecha_actualizacion (timestamp)
```

#### Tablas Auxiliares de Nómina:
- **OP_NOMINA_DETALLE_AUX** (2 registros) - Tabla auxiliar de trabajo
- **OP_NOMINA_DETALLE_conerrores** (190 registros) - Registros con errores
- **OP_NOMINA_CABECERA_temp**, **OP_NOMINA_DETALLE_temp** - Tablas temporales

### 💰 **MÓDULO PAGOS**

#### **OP_PAGO_CABECERA** (179 registros)
Cabeceras de operaciones de pago
```sql
- id (PK, int, auto_increment)
- iduser, idorg, idcont (int, NOT NULL)
- concepto (varchar, NOT NULL) -- Concepto del pago
- fechapago (date, NOT NULL)
- estado (tinyint, default 1)
- descripcion_validacion (varchar)
- control (tinyint, default 1)
- fecha_creacion, fecha_actualizacion (timestamp/datetime)
```

#### **OP_PAGO_DETALLE** (11,274 registros) 
Detalle de pagos individuales
```sql
- id (PK, int, auto_increment)
- pago_cabecera_id (int, NOT NULL, FK)
- cbu (varchar) -- CBU destino
- cuil (varchar) -- CUIL beneficiario
- nombre (varchar) -- Nombre beneficiario
- importe (decimal) -- Monto a pagar
- valido (tinyint, default 1)
- descripcion_validacion (varchar, default 'Validación exitosa')
- fecha_creacion, fecha_actualizacion (timestamp)
```

#### **PagoHead** (378 registros) + **PagoDetail** (48,121 registros)
Sistema de pagos procesados
```sql
PagoHead:
- ID_PagoHead (PK, int, auto_increment)
- ID_Organismo (int, FK)
- ID_User, ID_Contrato (int)
- Prestacion (varchar, NOT NULL)
- Fecha_Emision, Fecha_Acreditacion (date)
- Hora_Generacion (time)
- Archivo_Origen (varchar)
- importe_total (decimal)
- concepto (char)
- Tipo_Estado (int, FK)

PagoDetail:
- PagoDetail_ID (PK, int, auto_increment)
- PagoHead_ID (int, FK)
- CBU (char, NOT NULL)
- CUIL (char, NOT NULL)
- Apellido_Nombre (varchar, NOT NULL)
- Importe (decimal, NOT NULL)
- Referencia_Univoca (char)
- Tipo_Estado (int, FK)
```

### 🏦 **MÓDULO CUENTAS**

#### **OP_CUENTA_CABECERA** (2 registros) + **OP_CUENTA_DETALLE** (240 registros)
Gestión de altas de cuentas bancarias
```sql
Cabecera:
- Similar estructura a nóminas
- Para gestión de apertura de cuentas

Detalle:
- Datos personales completos
- tipo_doc, nro_doc (varchar)
- fecha_nacimiento (date)
- sexo (varchar)
- Validaciones completas
```

### 🔄 **TRANSFERENCIAS INMEDIATAS**

#### **TransInmediataInfo** (50 registros) + **TransInmediataDato** (618 registros)
Sistema de transferencias bancarias inmediatas
```sql
Info:
- Información de la empresa y transferencia
- empresaCUIT (bigint)
- prestacion, concepto (varchar)
- fechaEmision, horaGeneracion (int)
- importeTotalFinal (decimal)

Dato:
- Detalles de cada transferencia individual
- bloqueCBU1, bloqueCBU2 (varchar) -- CBU fragmentado
- importe (decimal)
- refUnivoca (varchar)
- beneficiarioDoc, beneficiarioApeNombre (varchar)
```

### 📊 **LOGGING Y AUDITORÍA**

#### **JsonLogs** (351 registros, 2.6MB)
Logs principales del sistema en formato JSON
```sql
- log_id (PK, int, auto_increment)
- timestamp (timestamp, default CURRENT_TIMESTAMP)
- id_user, id_organismo, id_contrato (int)
- concepto (varchar)
- json_data (JSON) -- Datos completos de la operación
```

**Estructura típica del JSON:**
```json
{
  "IDORG": "71",
  "IDCONT": "4", 
  "IDUSER": "2",
  "CONCEPTO": "PROVEEDOR",
  "FECHAPAGO": "2024-10-01",
  "ITEMS": [
    {
      "CBU": "2014033270370645158028",
      "CUIL": 20215026435,
      "NOMBRE": "DIEGO DULAU", 
      "IMPORTE": 1914640.33
    }
    // ... más items
  ]
}
```

#### Otros Logs:
- **DebugLogs** (0 registros) - Logs de debugging
- **LogTable** (0 registros) - Log general de texto
- **PROC_LOG** (8 registros) - Logs de procedimientos almacenados
- **Mensajes** (7,910 registros, 1.5MB) - Sistema de mensajería interna

### 🎨 **INTERFAZ Y CONFIGURACIÓN**

#### **Botones** (9 registros)
Configuración de botones de interfaz
```sql
- id_boton (PK, int, auto_increment)
- id_componente (int, FK)
- texto (varchar) -- Texto del botón
- accion (varchar) -- Acción JavaScript
- contrato_id (int) -- Contrato asociado
- habilitado (tinyint, default 1)
- icono (varchar)
- created_at, updated_at (timestamp)
```

#### **ContratoBotones** (2 registros)
Relación entre contratos y botones disponibles

### 🛠️ **TABLAS DE CONFIGURACIÓN**

#### **Tipo_Sexo** (3 registros), **Tipo_Dato_Control** (0 registros)
Catálogos de tipos y configuraciones

#### **MAPSQLTOCODE** (5 registros)
Mapeo entre tipos SQL y controles HTML
```sql
- tipo_dato_sql (varchar, NOT NULL)
- control_html (varchar, NOT NULL)
```

### 🗃️ **TABLAS DE TRABAJO**

#### **ArchivoSalida** (0 registros)
Almacenamiento de archivos generados
```sql
- nombreArchivo (varchar)
- contenido (text)
```

#### **tabla_cbu_duplicados** (435 registros)
Control de CBUs duplicados en el sistema

---

## 🔗 Relaciones Principales

### Jerarquía Core:
```
Organismo → Usuarios → Contratos650 → Modalidad
    ↓
OP_NOMINA_CABECERA → OP_NOMINA_DETALLE
    ↓  
OP_PAGO_CABECERA → OP_PAGO_DETALLE
    ↓
PagoHead → PagoDetail
```

### Flujo de Datos:
1. **Organismo** tiene **Usuarios**
2. **Usuario** crea **Contratos** con **Modalidades**
3. **Contrato** genera **Nóminas** (CABECERA + DETALLE)
4. **Nóminas validadas** generan **Pagos**
5. **Pagos** se procesan como **TransferenciasInmediatas**
6. Todo se registra en **JsonLogs**

---

## 📈 Estadísticas del Sistema

| Módulo | Tablas | Registros Totales | Uso Principal |
|--------|--------|-------------------|---------------|
| Nóminas | 5 | ~2,300 | Gestión empleados |
| Pagos | 4 | ~60,000 | Procesamiento pagos |
| Organismos/Usuarios | 3 | ~180 | Entidades y autenticación |
| Contratos | 4 | ~30 | Configuración contratos |
| Logs/Auditoría | 4 | ~8,600 | Trazabilidad |
| Transferencias | 2 | ~670 | Operaciones bancarias |
| UI/Config | 8 | ~50 | Interfaz y configuración |

**Total Sistema:** 37 tablas, ~70,000+ registros

---

## 🛡️ Stored Procedures Principales

### Validaciones (Functions):
- `isValidCuil`, `isValidCuitCuil`, `ValidateCBU` - Validaciones argentinas
- `ReplaceSpecialChars` - Limpieza de caracteres

### Operaciones por Módulo:
- **NOMINA_*** (14 SPs) - Gestión completa de nóminas
- **PAGO_*** (8 SPs) - Procesamiento de pagos  
- **CUENTA_*** (8 SPs) - Altas de cuentas
- **METADATA_UI*** (8 SPs) - Interfaces de usuario
- **TOOLS_*** (5 SPs) - Herramientas de administración

---

## 🎯 Casos de Uso Principales

1. **Alta de Nómina:** Usuario carga empleados → Validación CBU/CUIL → Generación archivo
2. **Procesamiento Pago:** Nómina aprobada → Cálculo importes → Transferencia bancaria
3. **Auditoría:** Toda operación → JsonLogs → Trazabilidad completa
4. **Gestión Organismos:** Alta organismo → Usuarios → Contratos → Modalidades

---

*Este documento describe el estado actual del modelo de datos. Para actualizaciones, regenerar desde la base de datos activa.*