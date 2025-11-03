# 🏗️ Arquitectura y Mejoras Implementadas

## 📋 Resumen de Mejoras

Este documento detalla todas las mejoras implementadas en la API de FoodieRank siguiendo los requerimientos especificados.

---

## 1. 🔢 Versionado de API con Semver

### Implementación

**Archivo:** `src/middlewares/versioning.middleware.js`

- ✅ Sistema de versionado siguiendo el estándar **Semver** (MAJOR.MINOR.PATCH)
- ✅ Validación automática de versión en headers (`X-API-Version`)
- ✅ Soporte para retrocompatibilidad dentro de la misma versión mayor
- ✅ Headers de respuesta con información de versión

### Uso

**Headers de Request:**
```http
X-API-Version: 1.0.0
```

**Headers de Response:**
```http
X-API-Version: 1.0.0
X-API-Min-Version: 1.0.0
X-API-Max-Version: 2.0.0
```

### Configuración

```javascript
// .env
API_VERSION=1.0.0

// Variables configurables
MIN_SUPPORTED_VERSION = '1.0.0'
MAX_SUPPORTED_VERSION = '2.0.0'
```

---

## 2. 🔄 Transacciones MongoDB para Operaciones Críticas

### Operaciones que Usan Transacciones

#### ✅ Crear Reseña
**Archivo:** `src/controllers/reseña.controller.js` - Función `crear`

- **Operaciones transaccionales:**
  1. Crear reseña
  2. Calcular nuevo promedio de calificaciones
  3. Actualizar calificación promedio del restaurante

- **Fuera de transacción:** Actualización de ranking (no bloqueante)

#### ✅ Eliminar Reseña
**Archivo:** `src/controllers/reseña.controller.js` - Función `eliminar`

- **Operaciones transaccionales:**
  1. Eliminar reseña
  2. Recalcular promedio de calificaciones restantes
  3. Actualizar calificación promedio del restaurante

#### ✅ Actualizar Reseña (solo si cambia calificación)
**Archivo:** `src/controllers/reseña.controller.js` - Función `actualizar`

- **Operaciones transaccionales:**
  1. Actualizar reseña
  2. Recalcular promedio si cambió la calificación
  3. Actualizar promedio del restaurante

#### ✅ Like/Dislike en Reseñas
**Archivos:** 
- `src/controllers/reseña.controller.js` - Funciones `like` y `dislike`
- `src/models/reseña.model.js` - Funciones `darLike` y `darDislike`

- **Operaciones transaccionales:**
  1. Actualizar contador de likes/dislikes
  2. Actualizar arrays de usuarios que dieron like/dislike
  3. Validación: usuario no puede dar like/dislike a su propia reseña

### Servicio de Transacciones

**Archivo:** `src/services/transacciones.service.js`

- ✅ Detección automática de disponibilidad de transacciones
- ✅ Fallback automático si MongoDB no soporta transacciones (instancia standalone)
- ✅ Manejo de errores con reintentos
- ✅ Soporte para MongoDB Atlas y Replica Sets

```javascript
// Uso
await ejecutarTransaccion(async (session) => {
    // Operaciones que deben ser atómicas
    // session se pasa a todas las operaciones de MongoDB
});
```

---

## 3. 👥 Gestión de Usuarios

### ✅ Registro, Login y Autenticación JWT

**Archivos:**
- `src/controllers/usuario.controller.js`
- `src/models/usuario.model.js`
- `src/config/passport.js`

**Características:**
- ✅ Registro con hash de password (bcrypt)
- ✅ Login con validación de credenciales
- ✅ Generación de token JWT con expiración (24h por defecto)
- ✅ Tokens firmados con `JWT_SECRET_KEY`

### ✅ Roles: Usuario y Administrador

**Constantes:** `src/utils/constants.js`
```javascript
ROLES = {
    USUARIO: 'usuario',
    ADMIN: 'admin'
}
```

**Middleware de Roles:**
- `src/middlewares/roles.middleware.js` - `requiereAdmin()`
- Verifica que el usuario tenga rol `admin` antes de continuar

### ✅ Permisos de Administrador

**Los administradores pueden:**
- ✅ Gestionar categorías (CRUD completo)
- ✅ Aprobar restaurantes nuevos
- ✅ Aprobar platos nuevos (si se implementa en el futuro)
- ✅ Editar y eliminar cualquier reseña
- ✅ Eliminar restaurantes

**Rutas protegidas con `requiereAdmin`:**
- `POST /api/v1/categorias` - Crear categoría
- `PUT /api/v1/categorias/:id` - Actualizar categoría
- `DELETE /api/v1/categorias/:id` - Eliminar categoría
- `PATCH /api/v1/restaurantes/:id/aprobar` - Aprobar restaurante

---

## 4. 🍽️ Gestión de Restaurantes y Platos

### ✅ CRUD de Restaurantes

**Archivos:**
- `src/controllers/restaurante.controller.js`
- `src/models/restaurante.model.js`
- `src/routes/restaurante.routes.js`

**Validaciones:**
- ✅ Nombre único (índice único en MongoDB)
- ✅ Validación de categoría existente
- ✅ Atributos mínimos: nombre, descripción, categoría, ubicación, imagen (opcional)

**Aprobación:**
- ✅ Nuevos restaurantes requieren aprobación de admin
- ✅ Solo admins pueden aprobar (`PATCH /api/v1/restaurantes/:id/aprobar`)
- ✅ Solo restaurantes aprobados aparecen en listados públicos

### ✅ CRUD de Platos

**Archivos:**
- `src/controllers/plato.controller.js`
- `src/models/plato.model.js`
- `src/routes/plato.routes.js`

**Validaciones:**
- ✅ Nombre único por restaurante (índice compuesto único)
- ✅ Validación de restaurante existente
- ✅ Atributos: nombre, descripción, precio, imagen (opcional)

**Estructura:**
```javascript
{
    nombre: string,
    descripcion: string,
    restauranteId: ObjectId,
    imagen: string | null,  // Base64 o URL
    precio: number | null,
    fechaCreacion: Date,
    fechaActualizacion: Date
}
```

---

## 5. ⭐ Gestión de Reseñas y Ratings

### ✅ CRUD de Reseñas

**Archivos:**
- `src/controllers/reseña.controller.js`
- `src/models/reseña.model.js`
- `src/routes/reseña.routes.js`

**Operaciones:**
- ✅ **Crear:** Los usuarios pueden crear reseñas (una por restaurante)
- ✅ **Editar:** Los usuarios pueden editar sus propias reseñas
- ✅ **Eliminar:** Los usuarios pueden eliminar sus propias reseñas
- ✅ **Admin:** Puede editar/eliminar cualquier reseña

**Atributos:**
- ✅ Comentario (opcional)
- ✅ Calificación numérica (1-5 estrellas)
- ✅ Validación de rango de calificación
- ✅ Una reseña por usuario por restaurante

### ✅ Sistema de Likes/Dislikes

**Implementación:**
- ✅ Los usuarios pueden dar like/dislike a reseñas de otros
- ✅ No pueden dar like/dislike a sus propias reseñas
- ✅ Toggle: Si ya dio like, al dar like nuevamente lo remueve
- ✅ Si tiene dislike y da like, se remueve el dislike y se agrega like
- ✅ Operación transaccional para consistencia

**Estructura de Datos:**
```javascript
{
    likes: number,
    dislikes: number,
    usuariosQueLiked: [ObjectId],
    usuariosQueDisliked: [ObjectId]
}
```

**Endpoints:**
- `POST /api/v1/resenas/:id/like` - Dar/quitar like
- `POST /api/v1/resenas/:id/dislike` - Dar/quitar dislike

---

## 6. 🏆 Sistema de Ranking Ponderado

### Cálculo de Ranking

**Archivo:** `src/services/ranking.service.js`

**Fórmula:**
```
Ranking = (Calificación × 0.5) + (LikesRatio × 0.3) + (Recencia × 0.2)
```

**Componentes:**
1. **Calificación (50%):** Promedio de calificaciones (1-5 estrellas)
2. **Likes Ratio (30%):** Ratio de likes vs total de interacciones
3. **Recencia (20%):** Score basado en fecha de última reseña

**Pesos configurables:** `src/utils/constants.js`
```javascript
RANKING_WEIGHTS = {
    CALIFICACION: 0.5,
    LIKES_RATIO: 0.3,
    RECENCIA: 0.2
}
```

**Actualización Automática:**
- ✅ Se actualiza después de crear reseña
- ✅ Se actualiza después de eliminar reseña
- ✅ Se actualiza después de dar like/dislike
- ✅ Se actualiza si se modifica la calificación de una reseña

---

## 7. 📁 Gestión de Categorías

### ✅ CRUD de Categorías

**Archivos:**
- `src/controllers/categoria.controller.js`
- `src/models/categoria.model.js`
- `src/routes/categoria.routes.js`

**Características:**
- ✅ Solo administradores pueden gestionar categorías
- ✅ Validación de nombre único
- ✅ Validación antes de eliminar (no puede tener restaurantes asociados)

**Endpoints:**
- `GET /api/v1/categorias` - Listar todas (público)
- `POST /api/v1/categorias` - Crear (admin)
- `PUT /api/v1/categorias/:id` - Actualizar (admin)
- `DELETE /api/v1/categorias/:id` - Eliminar (admin)

---

## 8. 📊 Ranking y Listados

### ✅ Listado de Restaurantes

**Endpoint:** `GET /api/v1/restaurantes`

**Ordenamiento:**
- ✅ Por ranking (default)
- ✅ Por calificación promedio
- ✅ Por nombre
- ✅ Por fecha de creación

**Filtrado:**
- ✅ Por categoría (`categoriaId`)
- ✅ Solo aprobados (default)
- ✅ Paginación con `limite` y `saltar`

**Respuesta incluye:**
- ✅ Información del restaurante
- ✅ Calificación promedio
- ✅ Total de reseñas
- ✅ Ranking actualizado

### ✅ Vista de Detalle

**Endpoint:** `GET /api/v1/restaurantes/:id`

**Incluye:**
- ✅ Información completa del restaurante
- ✅ Platos asociados (con imágenes)
- ✅ Reseñas asociadas (con likes/dislikes)
- ✅ Estadísticas (promedio, total reseñas, ranking)

---

## 9. 🏛️ Arquitectura y Estructura

### Separación de Responsabilidades

```
src/
├── config/          # Configuración (DB, CORS, Passport, Swagger)
├── controllers/     # Lógica de negocio y manejo de requests
├── models/          # Acceso a datos y operaciones MongoDB
├── routes/          # Definición de rutas y middlewares
├── middlewares/     # Autenticación, validación, versionado, roles
├── services/        # Servicios (ranking, transacciones)
└── utils/          # Utilidades y constantes
```

### Coherencia en Naming

- ✅ Funciones en camelCase
- ✅ Archivos en kebab-case
- ✅ Constantes en UPPER_SNAKE_CASE
- ✅ Clases en PascalCase

### Validaciones

- ✅ **express-validator** para validación de input
- ✅ Validación de ObjectIds
- ✅ Validación de rangos (calificación 1-5)
- ✅ Validación de formato (email, URLs)
- ✅ Validación de unicidad (nombres de restaurantes/platos)

---

## 10. 🔐 Seguridad

### Implementado

- ✅ Passwords hasheados con bcrypt (salt rounds = 10)
- ✅ Tokens JWT firmados con SECRET_KEY
- ✅ Tokens con expiración (24h)
- ✅ Middleware de autenticación con Passport
- ✅ Validación de roles (admin/usuario)
- ✅ Rate limiting para protección contra abusos
- ✅ Validación de input en todos los endpoints

---

## 📝 Resumen de Archivos Creados/Modificados

### Nuevos Archivos
1. `src/middlewares/versioning.middleware.js` - Versionado con semver
2. `src/middlewares/admin.middleware.js` - Verificación de admin (alternativa)
3. `docs/ARQUITECTURA_MEJORAS.md` - Esta documentación

### Archivos Mejorados
1. `src/server.js` - Agregado middleware de versionado
2. `src/controllers/reseña.controller.js` - Transacciones en todas las operaciones críticas
3. `src/models/reseña.model.js` - Soporte de transacciones en todas las funciones
4. `src/services/transacciones.service.js` - Ya existía, verificado y funcionando

---

## 🧪 Operaciones con Transacciones

### Operaciones Críticas que Usan Transacciones:

1. **Crear Reseña** ✅
   - Crear reseña + Actualizar promedio restaurante

2. **Eliminar Reseña** ✅
   - Eliminar reseña + Actualizar promedio restaurante

3. **Actualizar Reseña (si cambia calificación)** ✅
   - Actualizar reseña + Recalcular promedio

4. **Dar Like a Reseña** ✅
   - Actualizar contadores + Actualizar arrays

5. **Dar Dislike a Reseña** ✅
   - Actualizar contadores + Actualizar arrays

---

## ✅ Checklist de Requisitos

- [x] Versionado de API siguiendo semver
- [x] Transacciones reales en MongoDB para operaciones críticas
- [x] Arquitectura coherente
- [x] Gestión de usuarios: Registro, Login, JWT
- [x] Roles: usuario y administrador
- [x] Admins gestionan categorías
- [x] Admins aprueban restaurantes/platos
- [x] CRUD de restaurantes (solo admins aprueban)
- [x] CRUD de platos vinculados a restaurantes
- [x] Validación nombres únicos (restaurantes y platos)
- [x] Atributos mínimos requeridos
- [x] CRUD de reseñas (crear, editar, eliminar)
- [x] Reseñas con comentario y calificación (1-5)
- [x] Likes/dislikes en reseñas
- [x] Validación: no like/dislike a propia reseña
- [x] Ranking ponderado basado en calificaciones, likes/dislikes y fecha
- [x] CRUD de categorías (solo admin)
- [x] Listado de restaurantes con ordenamiento
- [x] Filtrado por categoría
- [x] Vista de detalle con restaurante, platos y reseñas

---

## 🚀 Próximos Pasos Recomendados

1. **Testing:** Crear tests unitarios e integración
2. **Documentación API:** Completar Swagger con todos los endpoints
3. **Logging:** Implementar sistema de logs estructurado
4. **Caching:** Implementar caché para rankings y listados
5. **Métricas:** Agregar métricas de rendimiento

---

¿Tienes preguntas sobre alguna implementación específica? 🚀

