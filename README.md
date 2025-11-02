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
