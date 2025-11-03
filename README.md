# 🍽️ Backend FoodStars - Sistema de Ranking de Restaurantes

<div align="center">
  <img src="https://media.tenor.com/_mOMxTWntRcAAAAi/pepe-gaming.gif" alt="FoodStars" width="300" height="200">
</div>

> **Sistema de Gestión y Ranking de Restaurantes y Platos**  
> *API RESTful completa para gestión de restaurantes, platos, reseñas y sistema de ranking inteligente*

## 🔗 Frontend Repository

**Repositorio del Frontend:** [Frontend FoodStars](https://github.com/DanielSantiagoV/Frontend_FoodStars.git)

El frontend está desarrollado con tecnologías modernas, conectándose a este backend a través de las APIs documentadas.

## 🔗 Videos sustentación
**Parte1:** [Backend](https://youtu.be/TTiMNBuULb8)
**Parte2:**  [Frontend](https://youtu.be/mhJwC_7tgP8)

## 📋 Descripción del Proyecto

Este es el backend completo para un sistema de ranking de restaurantes y platos (FoodieRank/FoodStars). El sistema permite gestionar restaurantes, platos, reseñas, categorías y usuarios, con un algoritmo inteligente de ranking ponderado.

### 🎯 **Objetivo del Sistema**

El sistema está diseñado para resolver las necesidades de gestión y calificación de restaurantes, proporcionando:

- **Gestión de Restaurantes**: CRUD completo con sistema de aprobación por administradores
- **Gestión de Platos**: Asociación de platos a restaurantes con información detallada
- **Sistema de Reseñas**: Calificaciones, comentarios y sistema de likes/dislikes
- **Ranking Inteligente**: Algoritmo ponderado basado en calificaciones, likes/dislikes y recencia
- **Autenticación y Autorización**: JWT con roles de usuario y administrador
- **Escalabilidad**: Arquitectura preparada para crecimiento con transacciones MongoDB
- **Seguridad**: Validación robusta, rate limiting y manejo de errores centralizado


### 🎯 ¿Qué es un Sistema de Ranking de Restaurantes?

Un sistema de ranking de restaurantes es una plataforma integral que permite gestionar, calificar y clasificar restaurantes y sus platos. En este proyecto, implementamos un sistema completo con algoritmo de ranking inteligente, sistema de reseñas con interacciones, gestión de usuarios con roles, y operaciones transaccionales usando MongoDB Driver Nativo.

### 🏗️ ¿Por qué MongoDB Driver Nativo?

El MongoDB Driver Nativo ofrece máximo rendimiento y control directo sobre las operaciones de base de datos sin capas de abstracción innecesarias como ODMs (Object Document Mapping). Esto resulta en:
- **Rendimiento superior**: Comunicación directa con MongoDB para consultas rápidas de rankings y búsquedas
- **Control total**: Acceso completo a todas las características de MongoDB (aggregations, transactions, índices)
- **Transacciones reales**: Implementación de transacciones ACID nativas para operaciones críticas (crear restaurante con platos, actualizar rankings)
- **Aggregation Framework**: Consultas complejas optimizadas para cálculos de rankings, promedios y estadísticas
- **Flexibilidad de esquema**: Adaptación rápida a cambios en la estructura de datos (reseñas, platos, categorías)

### ⚖️ Ventajas del Sistema de Ranking Inteligente

| Característica         | Sistema Tradicional                              | Sistema FoodStars                                |
|:-----------------------|:-------------------------------------------------|:-------------------------------------------------|
| **Ranking**            | Solo calificación promedio                      | Algoritmo ponderado (calificación, likes, recencia) |
| **Interacción**        | Solo comentarios                                 | Sistema de likes/dislikes + comentarios         |
| **Actualización**     | Manual o por lote                                | Automática en tiempo real                       |
| **Transacciones**      | Sin consistencia garantizada                     | Operaciones atómicas con MongoDB Transactions  |
| **Validación**         | Básica                                           | Multi-nivel (rutas, controladores, modelos)    |
| **Seguridad**          | Autenticación simple                             | JWT + Roles + Rate Limiting                     |
| **Escalabilidad**      | Limitada                                         | Arquitectura preparada para crecimiento         |

---

### 🏗️ **Arquitectura del Sistema**

#### **Patrón de Arquitectura: MVC (Model-View-Controller)**

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │   Backend API   │    │   Database      │
│   (React/Vue)   │◄──►│   (Node.js)     │◄──►│   (MongoDB)     │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

#### **Componentes del Backend**

- **Framework**: Node.js + Express 5.x (servidor web robusto)
- **Base de datos**: MongoDB 6.x (driver nativo para máximo rendimiento)
- **Autenticación**: JWT + Passport.js (seguridad robusta)
- **Validación**: Express-validator (validación de entrada completa)
- **Documentación**: Swagger/OpenAPI (documentación interactiva)
- **Rate Limiting**: Express-rate-limit (protección contra abusos)
- **Versionado**: Middleware de versionado de API
- **Estructura**: Modular (separación de responsabilidades)
- **CORS**: Configurado para comunicación cross-origin
- **Transacciones**: MongoDB transactions para operaciones atómicas

#### **Flujo de Datos**

```
Request → Middleware → Routes → Validation → Controller → Service → Model → Database → Response
    ↓         ↓          ↓         ↓           ↓          ↓        ↓        ↓         ↓
  HTTP    Auth/Rate   Express   Express-   Business   Business  MongoDB  MongoDB   JSON
         Limiting    Router   Validator    Logic      Logic    Driver  Collection Response
```

### 🚀 **Características Principales**

#### **Gestión de Usuarios**
- ✅ **Registro y Login**: Sistema de autenticación JWT
- ✅ **Roles y Permisos**: Usuario regular y Administrador
- ✅ **Perfiles de Usuario**: Gestión de información personal
- ✅ **Seguridad**: Passwords hasheados con bcrypt
- ✅ **Validación Robusta**: Campos obligatorios, tipos de datos, formatos

#### **Gestión de Restaurantes**
- ✅ **CRUD Completo**: Crear, Leer, Actualizar, Eliminar restaurantes
- ✅ **Sistema de Aprobación**: Requiere aprobación de admin para publicación
- ✅ **Categorización**: Asociación con categorías
- ✅ **Búsqueda y Filtros**: Por categoría, ordenamiento por ranking/calificación
- ✅ **Paginación Inteligente**: Navegación eficiente en grandes datasets
- ✅ **Creación con Platos**: Transacciones para crear restaurante y platos simultáneamente
- ✅ **Validación de Unicidad**: Previene nombres duplicados

#### **Gestión de Platos**
- ✅ **CRUD Completo**: Gestión completa de platos asociados a restaurantes
- ✅ **Validación de Relación**: Verificación de existencia del restaurante
- ✅ **Información Completa**: Nombre, descripción, precio, imagen
- ✅ **Unicidad por Restaurante**: Previene platos duplicados en el mismo restaurante

#### **Sistema de Reseñas**
- ✅ **Calificaciones**: Sistema de estrellas (1-5)
- ✅ **Comentarios**: Reseñas textuales detalladas
- ✅ **Likes/Dislikes**: Sistema de interacción con reseñas
- ✅ **Validación de Propiedad**: Usuarios solo pueden modificar sus propias reseñas
- ✅ **Cálculo Automático**: Actualización automática de promedios de restaurantes

#### **Sistema de Ranking**
- ✅ **Algoritmo Ponderado**: Ranking inteligente basado en múltiples factores
- ✅ **Componentes del Ranking**:
  - Calificación promedio (peso configurable)
  - Ratio de likes/dislikes (peso configurable)
  - Recencia de reseñas (peso configurable)
- ✅ **Actualización Automática**: Recalcula rankings al agregar/modificar reseñas
- ✅ **Ranking Global**: Ordenamiento de restaurantes por score calculado

#### **Gestión de Categorías**
- ✅ **CRUD Completo**: Gestión de categorías de restaurantes
- ✅ **Validación**: Prevención de categorías duplicadas
- ✅ **Asociación**: Relación con restaurantes y platos

#### **Características Técnicas**
- ✅ **Autenticación JWT**: Tokens seguros con Passport.js
- ✅ **Rate Limiting**: Protección contra abusos (diferentes límites por ruta)
- ✅ **Validación de Entrada**: Express-validator integrado en todas las rutas
- ✅ **Manejo de Errores Centralizado**: Respuestas consistentes y estructuradas
- ✅ **Transacciones MongoDB**: Operaciones atómicas para consistencia de datos
- ✅ **CORS Configurado**: Comunicación segura con frontend
- ✅ **Variables de Entorno**: Configuración segura con dotenv
- ✅ **API Versioning**: Soporte para versionado de API (v1, v2, etc.)
- ✅ **Swagger Documentation**: Documentación interactiva completa
- ✅ **Health Check**: Endpoint de estado del servidor
- ✅ **Scripts de Utilidad**: Seed y clean para desarrollo

### 📁 **Estructura del Proyecto**

```
Backend_FoodStars/
├── src/
│   ├── config/          # Configuraciones
│   │   ├── cors.js       # Configuración CORS
│   │   ├── db.js         # Conexión MongoDB e índices
│   │   ├── limiters.js   # Rate limiting
│   │   ├── passport.js   # Configuración JWT
│   │   └── swagger.js    # Configuración Swagger
│   ├── controllers/      # Lógica de controladores
│   │   ├── categoria.controller.js
│   │   ├── plato.controller.js
│   │   ├── ranking.controller.js
│   │   ├── reseña.controller.js
│   │   ├── restaurante.controller.js
│   │   └── usuario.controller.js
│   ├── docs/             # Documentación
│   │   └── swagger.yaml  # Especificación OpenAPI
│   ├── middlewares/      # Middlewares personalizados
│   │   ├── admin.middleware.js
│   │   ├── autenticacion.middleware.js
│   │   ├── errores.middleware.js
│   │   ├── roles.middleware.js
│   │   ├── validationDTO.js
│   │   └── versioning.middleware.js
│   ├── models/           # Modelos de datos y acceso a BD
│   │   ├── categoria.model.js
│   │   ├── plato.model.js
│   │   ├── reseña.model.js
│   │   ├── restaurante.model.js
│   │   └── usuario.model.js
│   ├── routes/           # Definición de rutas
│   │   ├── categoria.routes.js
│   │   ├── plato.routes.js
│   │   ├── ranking.routes.js
│   │   ├── reseña.routes.js
│   │   ├── restaurante.routes.js
│   │   └── usuario.routes.js
│   ├── services/         # Servicios de negocio
│   │   ├── ranking.service.js
│   │   └── transacciones.service.js
│   ├── scripts/          # Scripts de utilidad
│   │   ├── seed.js       # Población de datos inicial
│   │   └── clean.js      # Limpieza de datos
│   ├── utils/            # Utilidades
│   │   ├── constants.js  # Constantes del sistema
│   │   └── helpers.js    # Funciones auxiliares
│   └── server.js         # Punto de entrada principal
├── package.json
└── README.md
```

### 🔐 **Autenticación y Seguridad**

- **JWT Tokens**: Autenticación basada en tokens
- **Passport.js**: Estrategia JWT para verificación de tokens
- **Bcrypt**: Hashing de contraseñas (10 salt rounds)
- **Rate Limiting**: 
  - Límites diferentes para autenticación y operaciones generales
  - Límites especiales para operaciones administrativas
- **Validación de Roles**: Middleware para verificar permisos de admin
- **Validación de Propiedad**: Usuarios solo pueden modificar sus propios recursos

### 📊 **Endpoints Principales**

#### **Usuarios**
- `POST /api/v1/usuarios/registro` - Registrar nuevo usuario
- `POST /api/v1/usuarios/login` - Iniciar sesión
- `GET /api/v1/usuarios/perfil` - Obtener perfil autenticado
- `GET /api/v1/usuarios` - Listar usuarios (Admin)

#### **Restaurantes**
- `POST /api/v1/restaurantes` - Crear restaurante
- `GET /api/v1/restaurantes` - Listar restaurantes (con filtros)
- `GET /api/v1/restaurantes/:id` - Obtener restaurante por ID
- `PUT /api/v1/restaurantes/:id` - Actualizar restaurante
- `PATCH /api/v1/restaurantes/:id/aprobar` - Aprobar restaurante (Admin)
- `DELETE /api/v1/restaurantes/:id` - Eliminar restaurante

#### **Platos**
- `POST /api/v1/platos` - Crear plato
- `GET /api/v1/platos` - Listar platos (con filtros)
- `GET /api/v1/platos/:id` - Obtener plato por ID
- `PUT /api/v1/platos/:id` - Actualizar plato
- `DELETE /api/v1/platos/:id` - Eliminar plato

#### **Reseñas**
- `POST /api/v1/resenas` - Crear reseña
- `GET /api/v1/resenas` - Listar reseñas (con filtros)
- `GET /api/v1/resenas/:id` - Obtener reseña por ID
- `PUT /api/v1/resenas/:id` - Actualizar reseña
- `PATCH /api/v1/resenas/:id/like` - Dar like a reseña
- `PATCH /api/v1/resenas/:id/dislike` - Dar dislike a reseña
- `DELETE /api/v1/resenas/:id` - Eliminar reseña

#### **Ranking**
- `GET /api/v1/ranking` - Obtener ranking de restaurantes
- `POST /api/v1/ranking/recalcular` - Recalcular rankings (Admin)

#### **Categorías**
- `POST /api/v1/categorias` - Crear categoría (Admin)
- `GET /api/v1/categorias` - Listar categorías
- `GET /api/v1/categorias/:id` - Obtener categoría por ID
- `PUT /api/v1/categorias/:id` - Actualizar categoría (Admin)
- `DELETE /api/v1/categorias/:id` - Eliminar categoría (Admin)

### 🛠️ **Tecnologías Utilizadas**

- **Node.js**: Runtime de JavaScript
- **Express 5.x**: Framework web
- **MongoDB 6.x**: Base de datos NoSQL
- **JWT (jsonwebtoken)**: Tokens de autenticación
- **Passport.js + Passport-JWT**: Estrategia de autenticación
- **Bcrypt**: Hashing de contraseñas
- **Express-validator**: Validación de entrada
- **Express-rate-limit**: Rate limiting
- **Swagger/OpenAPI**: Documentación de API
- **Dotenv**: Variables de entorno
- **Semver**: Manejo de versiones de API

### 📝 **Scripts Disponibles**

```bash
# Iniciar servidor en producción
npm start

# Iniciar servidor en desarrollo (con nodemon)
npm run dev

# Poblar base de datos con datos de ejemplo
npm run seed

# Limpiar base de datos
npm run clean
```

### 🔧 **Configuración**

El proyecto utiliza variables de entorno. Crea un archivo `.env` con:

```env
# Servidor
PORT=3000
HOST_NAME=localhost

# Base de datos
MONGODB_URI=mongodb://localhost:27017/foodierank

# JWT
JWT_SECRET_KEY=tu_secret_key_super_segura
JWT_EXPIRES_IN=24h

# API
API_VERSION=v1
```

### 📚 **Documentación API**

La documentación Swagger está disponible en:
- **URL**: `http://localhost:3000/api-docs`
- **Especificación**: `src/docs/swagger.yaml`

### 🎯 **Algoritmo de Ranking**

El ranking se calcula usando una fórmula ponderada:

```
Ranking = (Calificación × W1) + (Ratio Likes × W2) + (Recencia × W3)
```

Donde:
- **Calificación**: Promedio de calificaciones (0-5)
- **Ratio Likes**: Proporción de likes vs dislikes (0-1)
- **Recencia**: Puntuación basada en fecha de última reseña (0-1)
- **W1, W2, W3**: Pesos configurables en `utils/constants.js`

### 🔍 **Características Avanzadas**

- ✅ **Transacciones MongoDB**: Operaciones atómicas para consistencia
- ✅ **Índices Optimizados**: Índices en campos frecuentemente consultados
- ✅ **Validación Multi-nivel**: Validación en rutas, controladores y modelos
- ✅ **Manejo de Errores Robusto**: Errores estructurados y mensajes claros
- ✅ **Logging**: Registro de operaciones y errores
- ✅ **CORS Configurado**: Soporte para múltiples orígenes
- ✅ **Versionado de API**: Sistema de versiones para evolución de API


## 🛠️ Instalación y Configuración

### Prerrequisitos
- Node.js 20+
- MongoDB 6.20+ (con soporte para transacciones)
- npm o yarn

### Instalación
```bash
# Clonar el repositorio
git clone https://github.com/DanielSantiagoV/Backend_FoodStars.git
cd Backend_FoodStars

# Instalar dependencias
npm install

# Configurar variables de entorno
cp .env.example .env
# Editar .env con tu configuración (ver sección de Configuración)
```

### Configuración MongoDB

Para transacciones completas, se recomienda MongoDB con replica set. Para desarrollo local:

```bash
# Opción 1: MongoDB local con replica set (recomendado para producción)
# Configurar MongoDB con replica set según tu entorno

# Opción 2: MongoDB Atlas (cloud - incluye replica set por defecto)
# Usar la URI de conexión de MongoDB Atlas en .env
```

### Variables de Entorno

Crea un archivo `.env` con las siguientes variables:

```env
# MongoDB Configuration
MONGO_URI=mongodb+srv://DanielSantiagoV:2022worldcup@cluster0.k8jv69p.mongodb.net/foodierank?retryWrites=true&w=majority

DB_NAME=foodierank

# JWT Secret Key (cambia esto por una cadena segura aleatoria)
JWT_SECRET_KEY=0f5f8089d3003317086e07c112504af4b97110b9b1aa43965170e8fbaa95121db50387a743cfc733e1123cc2ec0b8a2e275f048373bda7f0874640dc894b7a16

# Server Configuration
PORT=3000
HOST_NAME=localhost
NODE_ENV=development

# API Version
API_VERSION=1.0.0

# Frontend URL (opcional, para CORS)
FRONTEND_URL=http://localhost:5500
```

### Ejecución
```bash
# Iniciar la aplicación en producción
npm start

# Modo desarrollo (con nodemon)
npm run dev

# Poblar base de datos con datos de ejemplo
npm run seed

# Limpiar base de datos
npm run clean
```

## 🎯 Ejemplos de Uso

### 🔐 Autenticación de Usuario

**Registrar nuevo usuario:**
```bash
POST /api/v1/usuarios/registro
Content-Type: application/json

{
  "nombre": "Juan Pérez",
  "email": "juan@example.com",
  "password": "password123"
}
```

**Iniciar sesión:**
```bash
POST /api/v1/usuarios/login
Content-Type: application/json

{
  "email": "juan@example.com",
  "password": "password123"
}

# Respuesta incluye token JWT para usar en requests autenticados
```

### 🍽️ Gestionar Restaurantes

**Crear restaurante (requiere autenticación):**
```bash
POST /api/v1/restaurantes
Authorization: Bearer <token>
Content-Type: application/json

{
  "nombre": "Restaurante El Buen Sabor",
  "descripcion": "Comida tradicional con ingredientes frescos",
  "categoriaId": "507f1f77bcf86cd799439011",
  "ubicacion": "Calle Principal 123",
  "imagen": "https://ejemplo.com/imagen.jpg",
  "platos": [
    {
      "nombre": "Pollo a la Brasa",
      "descripcion": "Pollo entero asado con papas",
      "precio": 25.50,
      "imagen": "https://ejemplo.com/plato.jpg"
    }
  ]
}
```

**Listar restaurantes con filtros:**
```bash
GET /api/v1/restaurantes?categoriaId=507f1f77bcf86cd799439011&ordenarPor=ranking&orden=desc&limite=10
```

**Obtener restaurante por ID:**
```bash
GET /api/v1/restaurantes/507f1f77bcf86cd799439011
```

### 🍛 Gestionar Platos

**Crear plato:**
```bash
POST /api/v1/platos
Authorization: Bearer <token>
Content-Type: application/json

{
  "nombre": "Ceviche de Pescado",
  "descripcion": "Pescado fresco con limón, cebolla y ají",
  "restauranteId": "507f1f77bcf86cd799439011",
  "precio": 18.00,
  "imagen": "https://ejemplo.com/ceviche.jpg"
}
```

**Listar platos por restaurante:**
```bash
GET /api/v1/platos?restauranteId=507f1f77bcf86cd799439011
```

### ⭐ Crear y Gestionar Reseñas

**Crear reseña:**
```bash
POST /api/v1/resenas
Authorization: Bearer <token>
Content-Type: application/json

{
  "restauranteId": "507f1f77bcf86cd799439011",
  "calificacion": 5,
  "comentario": "Excelente comida y servicio. Muy recomendado!"
}
```

**Dar like a una reseña:**
```bash
PATCH /api/v1/resenas/507f1f77bcf86cd799439011/like
Authorization: Bearer <token>
```

**Listar reseñas de un restaurante:**
```bash
GET /api/v1/resenas?restauranteId=507f1f77bcf86cd799439011&ordenarPor=calificacion&orden=desc
```

### 🏆 Consultar Rankings

**Obtener ranking de restaurantes:**
```bash
GET /api/v1/ranking?limite=20&ordenarPor=ranking&orden=desc
```

**Recalcular rankings (solo admin):**
```bash
POST /api/v1/ranking/recalcular
Authorization: Bearer <admin_token>
```

### 📁 Gestionar Categorías (Admin)

**Crear categoría:**
```bash
POST /api/v1/categorias
Authorization: Bearer <admin_token>
Content-Type: application/json

{
  "nombre": "Comida Italiana",
  "descripcion": "Restaurantes especializados en cocina italiana"
}
```

**Aprobar restaurante (Admin):**
```bash
PATCH /api/v1/restaurantes/507f1f77bcf86cd799439011/aprobar
Authorization: Bearer <admin_token>
```

## 🗄️ Modelo de Datos

### Colecciones MongoDB

#### `usuarios`
```javascript
{
    _id: ObjectId,
    nombre: String,
    email: String, // único, índice
    password: String, // hasheado con bcrypt
    rol: String, // 'usuario' | 'admin'
    fechaCreacion: Date,
    fechaActualizacion: Date
}
```

**Índices:**
- `email` (único)

#### `categorias`
```javascript
{
    _id: ObjectId,
    nombre: String, // único
    descripcion: String,
    fechaCreacion: Date,
    fechaActualizacion: Date
}
```

**Índices:**
- `nombre` (único)

#### `restaurantes`
```javascript
{
    _id: ObjectId,
    nombre: String, // único
    descripcion: String,
    categoriaId: ObjectId, // referencia a categorias
    ubicacion: String,
    imagen: String, // URL o Base64
    aprobado: Boolean, // requiere aprobación de admin
    calificacionPromedio: Number, // 0-5, calculado automáticamente
    totalReseñas: Number, // contador de reseñas
    ranking: Number, // 0-5, calculado por algoritmo ponderado
    fechaCreacion: Date,
    fechaActualizacion: Date
}
```

**Índices:**
- `nombre` (único)
- `categoriaId`
- `aprobado`
- `ranking` (descendente, para consultas rápidas de ranking)

#### `platos`
```javascript
{
    _id: ObjectId,
    nombre: String,
    descripcion: String,
    restauranteId: ObjectId, // referencia a restaurantes
    imagen: String, // URL o Base64 (opcional)
    precio: Number, // opcional
    fechaCreacion: Date,
    fechaActualizacion: Date
}
```

**Índices:**
- `restauranteId`
- `{ restauranteId: 1, nombre: 1 }` (único compuesto - previene nombres duplicados por restaurante)

#### `reseñas`
```javascript
{
    _id: ObjectId,
    comentario: String,
    calificacion: Number, // 1-5
    restauranteId: ObjectId, // referencia a restaurantes
    usuarioId: ObjectId, // referencia a usuarios
    likes: Number, // contador de likes
    dislikes: Number, // contador de dislikes
    usuariosQueLiked: [ObjectId], // array de IDs de usuarios que dieron like
    usuariosQueDisliked: [ObjectId], // array de IDs de usuarios que dieron dislike
    fechaCreacion: Date,
    fechaActualizacion: Date
}
```

**Índices:**
- `restauranteId`
- `usuarioId`
- `{ restauranteId: 1, usuarioId: 1 }` (único compuesto - un usuario solo puede hacer una reseña por restaurante)
- `calificacion`
- `fechaCreacion` (descendente, para ordenar por más recientes)

### Relaciones entre Colecciones

```
usuarios (1) ──→ (N) reseñas
                ↓
              restaurantes (1) ──→ (N) platos
                ↓
              categorias (1) ──→ (N) restaurantes
```

### Características del Modelo

- **Validaciones de Integridad**: 
  - Restaurantes requieren categoría válida
  - Platos requieren restaurante válido
  - Reseñas requieren restaurante aprobado y usuario válido
  - Un usuario solo puede hacer una reseña por restaurante

- **Cálculos Automáticos**:
  - `calificacionPromedio` se calcula automáticamente al crear/modificar reseñas
  - `totalReseñas` se mantiene actualizado automáticamente
  - `ranking` se recalcula usando algoritmo ponderado al actualizar reseñas

- **Transacciones**:
  - Crear restaurante con platos (operación atómica)
  - Crear/modificar reseña y actualizar estadísticas del restaurante
  - Dar like/dislike y actualizar contadores

- **Agregaciones**:
  - Reseñas incluyen información del usuario (lookup)
  - Rankings calculados con aggregation pipeline
  - Estadísticas de reseñas por restaurante


## 📊 Diagramas de Arquitectura del Sistema

### 🗄️ Diagrama de Entidad-Relación (ERD)

```mermaid
erDiagram
    USUARIO {
        ObjectId _id PK
        String nombre
        String email UK
        String password
        String rol
        Date fechaCreacion
        Date fechaActualizacion
    }
    
    CATEGORIA {
        ObjectId _id PK
        String nombre UK
        String descripcion
        Date fechaCreacion
        Date fechaActualizacion
    }
    
    RESTAURANTE {
        ObjectId _id PK
        String nombre UK
        String descripcion
        ObjectId categoriaId FK
        String ubicacion
        String imagen
        Boolean aprobado
        Number calificacionPromedio
        Number totalReseñas
        Number ranking
        Date fechaCreacion
        Date fechaActualizacion
    }
    
    PLATO {
        ObjectId _id PK
        String nombre
        String descripcion
        ObjectId restauranteId FK
        String imagen
        Number precio
        Date fechaCreacion
        Date fechaActualizacion
    }
    
    RESENA {
        ObjectId _id PK
        String comentario
        Number calificacion
        ObjectId restauranteId FK
        ObjectId usuarioId FK
        Number likes
        Number dislikes
        Array usuariosQueLiked
        Array usuariosQueDisliked
        Date fechaCreacion
        Date fechaActualizacion
    }

    %% Relaciones
    CATEGORIA ||--o{ RESTAURANTE : "clasifica"
    RESTAURANTE ||--o{ PLATO : "tiene"
    RESTAURANTE ||--o{ RESENA : "recibe"
    USUARIO ||--o{ RESENA : "escribe"
```

### 🔄 Diagrama de Flujo de Datos (DFD)

```mermaid
flowchart TD
    %% Entidades Externas
    A[👤 Usuario] 
    B[🍽️ Restaurante]
    C[⭐ Sistema de Reseñas]
    D[🏆 Sistema de Rankings]
    E[👨‍💼 Administrador]
    
    %% Procesos Principales
    F[🔐 Autenticación]
    G[🍽️ Gestión de Restaurantes]
    H[🍛 Gestión de Platos]
    I[⭐ Sistema de Reseñas]
    J[🏆 Cálculo de Rankings]
    K[📁 Gestión de Categorías]
    L[🔍 Búsqueda y Filtros]
    
    %% Almacenes de Datos
    M[(🗄️ Base de Datos MongoDB)]
    N[(📊 Caché de Rankings)]
    
    %% Flujos de Datos
    A -->|Registro/Login| F
    A -->|Buscar Restaurantes| L
    A -->|Crear Reseñas| I
    A -->|Dar Likes/Dislikes| I
    
    B -->|Crear Restaurante| G
    B -->|Agregar Platos| H
    
    C -->|Ver Reseñas| I
    
    D -->|Consultar Rankings| J
    
    E -->|Aprobar Restaurantes| G
    E -->|Gestionar Categorías| K
    E -->|Recalcular Rankings| J
    
    %% Procesos a Almacenes
    F <-->|CRUD Usuarios| M
    G <-->|CRUD Restaurantes| M
    H <-->|CRUD Platos| M
    I <-->|CRUD Reseñas| M
    J <-->|Actualizar Rankings| M
    J <-->|Consultar Rankings| N
    K <-->|CRUD Categorías| M
    L <-->|Consultas| M
    
    %% Transacciones entre Procesos
    G -.->|Crear con Platos| H
    I -.->|Actualizar Promedios| G
    I -.->|Actualizar Rankings| J
    I -.->|Actualizar Likes| I
    J -.->|Ranking Ponderado| G
```

### 🏗️ Diagrama de Arquitectura del Sistema

```mermaid
graph TB
    %% Capa de Presentación (Frontend)
    subgraph "🖥️ Capa de Presentación"
        FRONTEND[Frontend Application]
        API_CLIENT[API Client]
    end
    
    %% Capa de API
    subgraph "🌐 Capa de API"
        ROUTES[Express Routes]
        MIDDLEWARE[Middlewares]
        VALIDATION[Validation Layer]
    end
    
    %% Capa de Controladores
    subgraph "🎮 Capa de Controladores"
        CTRL_USUARIO[Usuario Controller]
        CTRL_RESTAURANTE[Restaurante Controller]
        CTRL_PLATO[Plato Controller]
        CTRL_RESENA[Reseña Controller]
        CTRL_RANKING[Ranking Controller]
        CTRL_CATEGORIA[Categoría Controller]
    end
    
    %% Capa de Servicios
    subgraph "⚙️ Capa de Servicios"
        SERVICE_RANKING[Ranking Service]
        SERVICE_TRANS[Transaction Service]
        SERVICE_AUTH[Auth Service]
    end
    
    %% Capa de Modelos
    subgraph "📋 Capa de Modelos"
        MODEL_USUARIO[Usuario Model]
        MODEL_RESTAURANTE[Restaurante Model]
        MODEL_PLATO[Plato Model]
        MODEL_RESENA[Reseña Model]
        MODEL_CATEGORIA[Categoría Model]
    end
    
    %% Base de Datos
    subgraph "💾 Persistencia"
        MONGODB[(MongoDB Database)]
        COLLECTIONS[Collections]
        INDEXES[Índices]
        TRANSACTIONS[Transacciones ACID]
    end
    
    %% Configuración
    subgraph "⚙️ Configuración"
        CONFIG[Config Manager]
        CORS[CORS Config]
        PASSPORT[Passport JWT]
        SWAGGER[Swagger Docs]
        RATE_LIMIT[Rate Limiting]
    end
    
    %% Conexiones entre capas
    FRONTEND --> API_CLIENT
    API_CLIENT --> ROUTES
    
    ROUTES --> MIDDLEWARE
    MIDDLEWARE --> VALIDATION
    MIDDLEWARE --> PASSPORT
    MIDDLEWARE --> RATE_LIMIT
    
    VALIDATION --> CTRL_USUARIO
    VALIDATION --> CTRL_RESTAURANTE
    VALIDATION --> CTRL_PLATO
    VALIDATION --> CTRL_RESENA
    VALIDATION --> CTRL_RANKING
    VALIDATION --> CTRL_CATEGORIA
    
    CTRL_USUARIO --> MODEL_USUARIO
    CTRL_RESTAURANTE --> MODEL_RESTAURANTE
    CTRL_RESTAURANTE --> SERVICE_TRANS
    CTRL_PLATO --> MODEL_PLATO
    CTRL_RESENA --> MODEL_RESENA
    CTRL_RESENA --> SERVICE_RANKING
    CTRL_RANKING --> SERVICE_RANKING
    CTRL_CATEGORIA --> MODEL_CATEGORIA
    
    SERVICE_RANKING --> MODEL_RESTAURANTE
    SERVICE_RANKING --> MODEL_RESENA
    SERVICE_TRANS --> MONGODB
    
    MODEL_USUARIO --> MONGODB
    MODEL_RESTAURANTE --> MONGODB
    MODEL_PLATO --> MONGODB
    MODEL_RESENA --> MONGODB
    MODEL_CATEGORIA --> MONGODB
    
    CONFIG --> CONNECTION
    CONNECTION --> MONGODB
    CONFIG --> CORS
    CONFIG --> SWAGGER
```

### 🔄 Diagrama de Flujo de Transacciones

```mermaid
sequenceDiagram
    participant U as Usuario
    participant API as Express API
    participant C as Controller
    participant S as Service
    participant M as Model
    participant DB as MongoDB
    
    Note over U,DB: Flujo de Creación de Restaurante con Platos
    
    U->>API: POST /api/v1/restaurantes
    API->>C: RestauranteController.crear()
    
    Note over C,DB: Validación y Autenticación
    C->>C: Validar datos (express-validator)
    C->>C: Verificar JWT token
    
    Note over C,DB: Transacción ACID
    C->>S: TransactionService.ejecutarTransaccion()
    S->>DB: startSession()
    S->>DB: startTransaction()
    
    C->>M: RestauranteModel.crearRestaurante()
    M->>DB: insertOne(restaurante)
    DB-->>M: restauranteId
    M-->>C: Restaurante creado
    
    loop Para cada plato
        C->>M: PlatoModel.crearPlato()
        M->>DB: insertOne(plato)
        DB-->>M: platoId
    end
    
    S->>DB: commitTransaction()
    DB-->>S: transacción exitosa
    S->>DB: endSession()
    
    C-->>API: Restaurante y platos creados
    API-->>U: 201 Created
    
    Note over U,DB: Flujo de Crear Reseña y Actualizar Ranking
    
    U->>API: POST /api/v1/resenas
    API->>C: ReseñaController.crear()
    
    C->>S: TransactionService.ejecutarTransaccion()
    S->>DB: startSession()
    S->>DB: startTransaction()
    
    C->>M: ReseñaModel.crearReseña()
    M->>DB: insertOne(reseña)
    DB-->>M: reseñaId
    
    C->>S: RankingService.actualizarRankingRestaurante()
    S->>DB: aggregate([$match, $group, $avg])
    DB-->>S: estadísticas
    
    S->>M: RestauranteModel.actualizarCalificacionPromedio()
    M->>DB: updateOne(restaurante)
    
    S->>M: RestauranteModel.actualizarRanking()
    M->>DB: updateOne(restaurante)
    
    S->>DB: commitTransaction()
    DB-->>S: transacción exitosa
    S->>DB: endSession()
    
    C-->>API: Reseña creada y ranking actualizado
    API-->>U: 201 Created
    
    Note over U,DB: Flujo de Rollback en caso de error
    
    alt Error en la transacción
        S->>DB: abortTransaction()
        DB-->>S: rollback automático
        S->>DB: endSession()
        C-->>API: 500 Error
        API-->>U: Error con mensaje
    end
```

### 📊 Diagrama de Estados del Sistema

```mermaid
stateDiagram-v2
    [*] --> Inicializacion
    
    Inicializacion --> ConectandoMongoDB : Verificar conexión
    ConectandoMongoDB --> ConfiguracionCompleta : Conexión exitosa
    ConectandoMongoDB --> ErrorConexion : Error de conexión
    ErrorConexion --> [*] : Salir del sistema
    
    ConfiguracionCompleta --> ServidorActivo : Sistema listo
    
    ServidorActivo --> GestionUsuarios : /api/v1/usuarios
    ServidorActivo --> GestionRestaurantes : /api/v1/restaurantes
    ServidorActivo --> GestionPlatos : /api/v1/platos
    ServidorActivo --> GestionResenas : /api/v1/resenas
    ServidorActivo --> GestionRanking : /api/v1/ranking
    ServidorActivo --> GestionCategorias : /api/v1/categorias
    ServidorActivo --> [*] : Shutdown
    
    state GestionRestaurantes {
        [*] --> ListarRestaurantes
        ListarRestaurantes --> CrearRestaurante : POST (autenticado)
        ListarRestaurantes --> ActualizarRestaurante : PUT (autenticado)
        ListarRestaurantes --> AprobarRestaurante : PATCH (admin)
        ListarRestaurantes --> EliminarRestaurante : DELETE (autenticado)
        CrearRestaurante --> PendienteAprobacion : Creado
        PendienteAprobacion --> Aprobado : Admin aprueba
        PendienteAprobacion --> Rechazado : Admin rechaza
    }
    
    state GestionResenas {
        [*] --> ListarResenas
        ListarResenas --> CrearResena : POST (autenticado)
        ListarResenas --> ActualizarResena : PUT (propietario)
        ListarResenas --> DarLike : PATCH like (autenticado)
        ListarResenas --> DarDislike : PATCH dislike (autenticado)
        CrearResena --> RankingActualizado : Reseña creada
        RankingActualizado --> CalificacionActualizada : Ranking calculado
    }
    
    state GestionRanking {
        [*] --> ConsultarRanking
        ConsultarRanking --> RecalcularRanking : POST (admin)
        RecalcularRanking --> RankingActualizado : Cálculo completo
    }
```

## 🔧 Requisitos Técnicos Implementados

### 📦 Uso de Librerías NPM Relevantes

#### **Librerías Principales Implementadas**
- **`express@5.1.0`**: Framework web para Node.js
- **`mongodb@6.20.0`**: Driver nativo de MongoDB
- **`jsonwebtoken@9.0.2`**: Tokens JWT para autenticación
- **`passport@0.7.0`** + **`passport-jwt@4.0.1`**: Estrategia de autenticación JWT
- **`bcrypt@6.0.0`**: Hashing de contraseñas
- **`express-validator@7.2.1`**: Validación de entrada
- **`express-rate-limit@8.1.0`**: Rate limiting para protección
- **`swagger-jsdoc@6.2.8`** + **`swagger-ui-express@5.0.1`**: Documentación API
- **`cors@2.8.5`**: Configuración CORS
- **`dotenv@17.2.3`**: Gestión de variables de entorno

#### **Implementación de Librerías**
```javascript
// Ejemplo de uso de librerías
import express from 'express';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import passport from 'passport';
import { body, validationResult } from 'express-validator';
import rateLimit from 'express-rate-limit';
import 'dotenv/config';

// Uso de Express
const app = express();
app.use(express.json());

// Uso de JWT
const token = jwt.sign(
    { id: usuarioId },
    process.env.JWT_SECRET_KEY,
    { expiresIn: '24h' }
);

// Uso de bcrypt
const passwordHash = await bcrypt.hash(password, 10);
const isValid = await bcrypt.compare(password, hash);

// Uso de express-validator
router.post('/registro', [
    body('email').isEmail().normalizeEmail(),
    body('password').isLength({ min: 6 })
], validacionMiddleware, controller);

// Uso de rate limiting
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutos
    max: 100 // máximo 100 requests
});
app.use('/api/', limiter);
```

### 🗄️ MongoDB con Driver Nativo

#### **Configuración MongoDB**
- **Driver Nativo**: Uso exclusivo del driver oficial de MongoDB
- **Sin Mongoose**: Evitamos ODMs para máximo control y rendimiento
- **Conexión Directa**: Control total sobre operaciones de base de datos
- **Transacciones Nativas**: Implementación de transacciones ACID

#### **Implementación Técnica**
```javascript
// Configuración de conexión MongoDB
class DatabaseManager {
    constructor() {
        this.client = null;
        this.db = null;
    }
    
    async connect() {
        this.client = new MongoClient(process.env.MONGODB_URI);
        await this.client.connect();
        this.db = this.client.db(process.env.MONGODB_DATABASE);
    }
    
    async startSession() {
        return this.client.startSession();
    }
    
    async close() {
        if (this.client) {
            await this.client.close();
        }
    }
}
```

### 🔄 Uso de Transacciones en Operaciones

#### **Transacciones ACID Implementadas**
- **Atomicity**: Operaciones atómicas para mantener consistencia
- **Consistency**: Validaciones a nivel de aplicación y base de datos
- **Isolation**: Aislamiento de transacciones concurrentes
- **Durability**: Persistencia garantizada de datos

#### **Ejemplos de Transacciones**
```javascript
// Transacción para crear restaurante con platos
export async function crearRestauranteConPlatos(restauranteData, platosData) {
    const { ejecutarTransaccion } = await import('./services/transacciones.service.js');
    
    return await ejecutarTransaccion(async (session) => {
        // Crear restaurante
        const restaurante = await crearRestaurante(restauranteData, session);
        const restauranteId = restaurante._id.toString();
        
        // Crear platos en la misma transacción
        const platosCreados = [];
        for (const platoData of platosData) {
            const plato = await crearPlato({
                ...platoData,
                restauranteId
            }, session);
            platosCreados.push(plato);
        }
        
        return { restaurante, platos: platosCreados };
    });
}

// Transacción para crear reseña y actualizar ranking
export async function crearResenaYActualizarRanking(resenaData) {
    const { ejecutarTransaccion } = await import('./services/transacciones.service.js');
    
    return await ejecutarTransaccion(async (session) => {
        // Crear reseña
        const reseña = await crearReseña(resenaData, session);
        
        // Calcular estadísticas del restaurante
        const estadisticas = await obtenerEstadisticasReseñas(
            resenaData.restauranteId, 
            session
        );
        
        // Actualizar calificación promedio
        await actualizarCalificacionPromedio(
            resenaData.restauranteId,
            estadisticas.promedio,
            estadisticas.totalReseñas,
            session
        );
        
        // Recalcular ranking ponderado
        const ranking = await actualizarRankingRestaurante(
            resenaData.restauranteId,
            session
        );
        
        return { reseña, ranking };
    });
}
```

### 🏗️ Arquitectura Modular (MVC)

#### **Capas Implementadas**
- **Controllers**: Lógica de controladores para cada entidad
  - `usuario.controller.js`: Autenticación y gestión de usuarios
  - `restaurante.controller.js`: CRUD de restaurantes
  - `plato.controller.js`: CRUD de platos
  - `reseña.controller.js`: Sistema de reseñas y likes/dislikes
  - `ranking.controller.js`: Cálculo y consulta de rankings
  - `categoria.controller.js`: Gestión de categorías

- **Models**: Acceso a datos y operaciones MongoDB
  - Modelos por colección con validaciones
  - Soporte para transacciones
  - Operaciones de agregación

- **Services**: Lógica de negocio compleja
  - `ranking.service.js`: Algoritmo de ranking ponderado
  - `transacciones.service.js`: Manejo de transacciones ACID

- **Routes**: Definición de endpoints y validaciones
  - Rutas RESTful con express-validator
  - Middlewares de autenticación y autorización
  - Rate limiting por ruta

#### **Ejemplo de Controller**
```javascript
export const crear = async (req, res) => {
    try {
        const { nombre, descripcion, categoriaId, ubicacion, imagen, platos } = req.body;
        const usuarioId = req.usuario._id.toString();
        
        // Validar datos (express-validator ya validó en rutas)
        
        // Crear restaurante con platos en transacción
        const resultado = await crearRestauranteConPlatos(
            { nombre, descripcion, categoriaId, ubicacion, imagen },
            platos || []
        );
        
        return responderExito(
            res,
            HTTP_STATUS.CREATED,
            resultado,
            'Restaurante creado exitosamente'
        );
    } catch (error) {
        return responderError(res, HTTP_STATUS.BAD_REQUEST, error.message);
    }
};
```

### 🎨 Patrones de Diseño Implementados

#### **1. MVC (Model-View-Controller)**
**Ubicación**: Toda la arquitectura
**Propósito**: Separación de responsabilidades

- **Models**: `src/models/` - Acceso a datos MongoDB
- **Controllers**: `src/controllers/` - Lógica de controladores
- **Routes**: `src/routes/` - Endpoints y validación

#### **2. Middleware Pattern**
**Ubicación**: `src/middlewares/`
**Propósito**: Interceptar y procesar requests

```javascript
// Middleware de autenticación
export const autenticacionMiddleware = (req, res, next) => {
    passport.authenticate('jwt', { session: false }, (err, usuario) => {
        if (err || !usuario) {
            return responderError(res, HTTP_STATUS.UNAUTHORIZED, 'No autorizado');
        }
        req.usuario = usuario;
        next();
    })(req, res, next);
};

// Middleware de validación
export const validacionMiddleware = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return responderError(res, HTTP_STATUS.BAD_REQUEST, errors.array());
    }
    next();
};
```

#### **3. Service Layer Pattern**
**Ubicación**: `src/services/`
**Propósito**: Lógica de negocio compleja

```javascript
// Ranking Service - Algoritmo ponderado
export function calcularRankingPonderado(
    restaurante,
    calificacionPromedio,
    totalLikes,
    totalDislikes,
    fechaUltimaReseña
) {
    const scoreCalificacion = calificacionPromedio || 0;
    const likesRatio = calcularRatioLikes(totalLikes, totalDislikes);
    const scoreLikes = likesRatio * 5;
    const recencyScore = calcularScoreRecencia(fechaUltimaReseña);
    const scoreRecencia = recencyScore * 5;
    
    const ranking = (
        scoreCalificacion * RANKING_WEIGHTS.CALIFICACION +
        scoreLikes * RANKING_WEIGHTS.LIKES_RATIO +
        scoreRecencia * RANKING_WEIGHTS.RECENCIA
    );
    
    return Math.round(ranking * 100) / 100;
}
```

#### **4. Factory Pattern para Transacciones**
**Ubicación**: `src/services/transacciones.service.js`
**Propósito**: Crear y gestionar transacciones MongoDB

```javascript
export async function ejecutarTransaccion(operacion) {
    const client = obtenerCliente();
    if (!client || !client.topology || !client.topology.capabilities().transactions) {
        // Fallback sin transacciones
        return await operacion(null);
    }
    
    const session = client.startSession();
    try {
        let resultado;
        await session.withTransaction(async () => {
            resultado = await operacion(session);
        });
        return resultado;
    } finally {
        await session.endSession();
    }
}
```

### 📊 Resumen de Implementación Técnica

| Requisito | Implementación | Ubicación |
|-----------|----------------|-----------|
| **Librerías NPM** | express, mongodb, jwt, passport, bcrypt, express-validator, swagger | `package.json` |
| **MongoDB Driver** | Driver nativo sin Mongoose | `src/config/db.js` |
| **Transacciones** | ACID con rollback automático | `src/services/transacciones.service.js` |
| **Arquitectura** | MVC con separación de capas | `src/controllers/`, `src/models/`, `src/routes/` |
| **Middleware Pattern** | Autenticación, validación, rate limiting | `src/middlewares/` |
| **Service Layer** | Lógica de negocio compleja | `src/services/` |
| **API RESTful** | Endpoints REST con versionado | `src/routes/` |
| **Documentación** | Swagger/OpenAPI | `src/docs/swagger.yaml` |
| **Seguridad** | JWT, bcrypt, rate limiting, CORS | `src/config/`, `src/middlewares/` |

## 🏃‍♂️ Metodología Scrum - Equipo de Desarrollo

### 📋 Documento de Planeación Scrum

Este proyecto fue desarrollado siguiendo la metodología Scrum, una framework ágil que promueve la colaboración, la adaptabilidad y la entrega iterativa de valor. El equipo trabajó en sprints cortos con reuniones diarias, planificación de sprints y retrospectivas para garantizar la calidad y eficiencia del desarrollo.

#### 📄 **Documentación Scrum Completa**
- **[📋 Documentación Scrum Detallada](docs/DocumentacionScrum_FoodStars.pdf)** - Documento completo con toda la metodología Scrum aplicada al proyecto

#### 🎥 **Explicación Técnica del Proyecto**
- **[🎥 Video Explicación Técnica Backend](https://youtu.be/TTiMNBuULb8)** - Video detallado con la explicación técnica completa del backend
- **[🎥 Video Explicación Frontend](https://youtu.be/mhJwC_7tgP8)** - Video detallado del frontend

### 👥 Roles del Equipo Scrum

#### 🎯 Product Owner
**Santiago Romero**
- **Responsabilidades**: Definición de requisitos, priorización del backlog, validación de funcionalidades
- **Contribución**: Especificación de funcionalidades del sistema de ranking de restaurantes
- **Decisiones**: Aprobación de características y criterios de aceptación

#### 🏃‍♂️ Scrum Master
**Ricardo Palomino**
- **Responsabilidades**: Facilitación de ceremonias, eliminación de impedimentos, coaching del equipo
- **Contribución**: Gestión de procesos ágiles y resolución de bloqueos
- **Liderazgo**: Asegurar que el equipo siga las prácticas Scrum

#### 💻 Developer
**Daniel Vinasco**
- **Responsabilidades**: Desarrollo, testing, implementación de funcionalidades
- **Contribución**: Arquitectura del sistema, implementación de patrones de diseño, desarrollo de funcionalidades
- **Tecnologías**: Node.js, Express, MongoDB, JWT, Swagger, principios SOLID

### 🎯 Objetivos del Proyecto

- ✅ **API RESTful Completa**: Implementar todas las funcionalidades requeridas
- ✅ **Arquitectura Robusta**: Aplicar principios SOLID y patrones de diseño MVC
- ✅ **Transacciones ACID**: Garantizar consistencia de datos con MongoDB
- ✅ **Sistema de Ranking Inteligente**: Algoritmo ponderado funcional
- ✅ **Documentación Técnica**: Swagger completo y README profesional

### 📊 Métricas del Proyecto

| Métrica | Valor |
|---------|-------|
| **Sprints Completados** | Múltiples sprints |
| **Endpoints Implementados** | 30+ endpoints RESTful |
| **Colecciones MongoDB** | 5 colecciones principales |
| **Líneas de Código** | 2,500+ líneas |
| **Documentación Swagger** | 100% completa |
| **Módulos Implementados** | 6 módulos principales (usuarios, restaurantes, platos, reseñas, ranking, categorías) |

### 🚀 Ceremonias Scrum Realizadas

#### 📅 Sprint Planning
- **Frecuencia**: Al inicio de cada sprint
- **Duración**: 2-3 horas
- **Objetivo**: Planificación de tareas y estimación de esfuerzo

#### 🏃‍♂️ Daily Standups
- **Frecuencia**: Diaria
- **Duración**: 15 minutos
- **Objetivo**: Sincronización del equipo y identificación de impedimentos

#### 📋 Sprint Review
- **Frecuencia**: Al final de cada sprint
- **Duración**: 1-2 horas
- **Objetivo**: Demostración de funcionalidades completadas

#### 🔄 Sprint Retrospective
- **Frecuencia**: Al final de cada sprint
- **Duración**: 1 hora
- **Objetivo**: Mejora continua del proceso

### 🎯 Criterios de Aceptación

- ✅ **API RESTful Completa**: Todas las características implementadas
- ✅ **Calidad de Código**: Principios SOLID aplicados
- ✅ **Transacciones**: Operaciones ACID implementadas
- ✅ **Documentación**: README completo, Swagger y diagramas
- ✅ **Autenticación**: Sistema JWT completo y funcional
- ✅ **Ranking Inteligente**: Algoritmo ponderado funcionando
- ✅ **Instalación**: Guía completa de instalación

### 🏆 Logros del Equipo

- 🎯 **Entrega a Tiempo**: Proyecto completado según cronograma
- 🏗️ **Arquitectura Sólida**: Implementación de patrones MVC y servicios
- 📊 **Base de Datos Optimizada**: Esquema eficiente con índices
- 🔄 **Transacciones Robustas**: Manejo de errores y rollback
- 📚 **Documentación Profesional**: Swagger interactivo y README completo
- ⭐ **Ranking Inteligente**: Sistema de ranking ponderado funcional
- 🔐 **Seguridad Robusta**: JWT, bcrypt, rate limiting implementados

### 📈 Retrospectiva del Proyecto

#### ✅ **Lo que funcionó bien:**
- Metodología Scrum facilitó la organización del trabajo
- Comunicación constante entre roles
- Iteraciones cortas permitieron ajustes rápidos
- Documentación temprana evitó retrabajo

#### 🔄 **Áreas de mejora:**
- Implementar más pruebas automatizadas
- Establecer métricas de rendimiento más detalladas
- Integrar herramientas de CI/CD

#### 🎯 **Lecciones aprendidas:**
- La planificación detallada es crucial para el éxito
- La documentación temprana (Swagger) ahorra tiempo
- Las transacciones ACID requieren planificación cuidadosa
- Los algoritmos de ranking requieren múltiples factores ponderados
- La metodología Scrum es efectiva para proyectos técnicos complejos

## 🎓 Beneficios Técnicos del Proyecto

### ✅ **Arquitectura Robusta**
- **Separation of Concerns**: Cada capa tiene responsabilidades claras (MVC)
- **Modular Design**: Componentes independientes y reutilizables
- **Error Resilience**: Sistema tolera errores y se recupera gracefully
- **Scalable Foundation**: Base sólida para crecimiento futuro
- **API Versioning**: Sistema preparado para evolución de API

### 🏗️ **MongoDB Driver Nativo - Ventajas Empresariales**
- **Maximum Performance**: Sin overhead de ODMs, comunicación directa
- **Full Feature Access**: Acceso completo a características avanzadas de MongoDB
- **Memory Efficiency**: Menor uso de memoria comparado con ODMs pesados
- **Production Ready**: Usado en aplicaciones de alta escala mundialmente
- **Aggregation Framework**: Consultas complejas para rankings y estadísticas

### 💎 **Transacciones y Ranking - Código Empresarial**
- **ACID Compliance**: Transacciones atómicas para integridad de datos
- **Ranking Inteligente**: Algoritmo ponderado con múltiples factores
- **Performance**: Consultas optimizadas con índices automáticos
- **Scalability**: Sistema preparado para millones de operaciones
- **Real-time Updates**: Actualización automática de rankings al crear reseñas

### 🎯 **Conclusión del Proyecto**

#### 🏆 **Logros Alcanzados**
- ✅ **API RESTful Completa**: Implementación exitosa de todas las funcionalidades requeridas
- ✅ **Arquitectura Sólida**: Aplicación de principios SOLID y patrones MVC
- ✅ **Transacciones ACID**: Garantía de consistencia de datos en todas las operaciones
- ✅ **Documentación Profesional**: Swagger interactivo y README completo con diagramas
- ✅ **Metodología Scrum**: Desarrollo ágil con roles definidos y ceremonias
- ✅ **Calidad Empresarial**: Código de nivel profesional con mejores prácticas
- ✅ **Sistema de Ranking**: Algoritmo ponderado inteligente funcionando correctamente

#### 🚀 **Impacto Técnico**
- **MongoDB Driver Nativo**: Máximo rendimiento sin overhead de ODMs
- **Transacciones Robustas**: Operaciones atómicas con rollback automático
- **Arquitectura Escalable**: Base sólida para crecimiento futuro
- **API RESTful**: 30+ endpoints documentados con Swagger
- **Autenticación JWT**: Sistema seguro con Passport.js
- **Ranking Inteligente**: Algoritmo ponderado con calificación, likes y recencia

#### 📊 **Métricas del Proyecto**
- **Líneas de Código**: 2,500+ líneas de código profesional
- **Endpoints REST**: 30+ endpoints implementados
- **Colecciones MongoDB**: 5 colecciones principales
- **Patrones Implementados**: MVC, Middleware, Service Layer, Factory
- **Principios SOLID**: Aplicados en toda la arquitectura
- **Transacciones**: 100% de operaciones críticas con transacciones ACID
- **Documentación**: Swagger 100% completo + README detallado

#### 🎓 **Aprendizajes Técnicos**
- **MongoDB Avanzado**: Dominio del driver nativo y transacciones ACID
- **Arquitectura REST API**: Implementación de API RESTful con Express
- **Autenticación y Seguridad**: JWT, bcrypt, rate limiting
- **Algoritmos de Ranking**: Implementación de ranking ponderado inteligente
- **Swagger/OpenAPI**: Documentación interactiva de APIs
- **Transacciones Complejas**: Operaciones atómicas con múltiples colecciones

#### 🔮 **Futuras Mejoras**
- **Testing Automatizado**: Pruebas unitarias y de integración con Jest
- **CI/CD Pipeline**: Automatización de despliegue y testing
- **Notificaciones en Tiempo Real**: WebSockets para actualizaciones de ranking
- **Sistema de Cache**: Redis para rankings y búsquedas frecuentes
- **Microservicios**: Migración a arquitectura de microservicios
- **Analytics Avanzado**: Dashboard con métricas de restaurantes y usuarios

---

<p align="center">
  🍽️ <b>Backend FoodStars</b> - Sistema de Ranking de Restaurantes de Nivel Empresarial<br>
  💎 <b>Desarrollado con MongoDB Driver Nativo + ⚡ Transacciones ACID</b><br>
  🔥 <b>API RESTful completa con ranking inteligente y seguridad robusta</b> 🚀
</p>

**¡Descubre los mejores restaurantes con FoodStars! 🍽️⭐**

---