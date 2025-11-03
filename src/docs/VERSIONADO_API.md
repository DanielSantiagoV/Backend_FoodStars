# 📦 Guía de Versionado de API con Semver

## 🎯 Introducción

El sistema de versionado de la API sigue el estándar **Semantic Versioning (Semver)** para garantizar compatibilidad y control de versiones.

## 📋 Formato de Versión

### Semver: MAJOR.MINOR.PATCH

- **MAJOR (X.0.0):** Cambios incompatibles con versiones anteriores
- **MINOR (0.X.0):** Nuevas funcionalidades compatibles hacia atrás
- **PATCH (0.0.X):** Correcciones de bugs compatibles

### Ejemplos

```
1.0.0 → 1.0.1  (Patch: corrección de bug)
1.0.1 → 1.1.0  (Minor: nueva feature compatible)
1.1.0 → 2.0.0  (Major: breaking change)
```

## 🔧 Configuración

### Variables de Entorno

```env
# .env
API_VERSION=1.0.0
```

### Versiones Soportadas

```javascript
// src/middlewares/versioning.middleware.js
export const API_VERSION = '1.0.0';              // Versión actual
export const MIN_SUPPORTED_VERSION = '1.0.0';     // Versión mínima
export const MAX_SUPPORTED_VERSION = '2.0.0';     // Versión máxima (exclusiva)
```

## 📡 Uso en Peticiones

### Header de Versión

```http
GET /api/v1/restaurantes
X-API-Version: 1.0.0
```

### Query Parameter (Alternativa)

```http
GET /api/v1/restaurantes?version=1.0.0
```

### Sin Especificar Versión

Si no se especifica versión, se usa la versión actual por defecto.

## 📥 Headers de Respuesta

Todas las respuestas incluyen headers de versión:

```http
X-API-Version: 1.0.0
X-API-Min-Version: 1.0.0
X-API-Max-Version: 2.0.0
```

## ✅ Validaciones

El middleware valida:

1. **Formato semver:** Debe ser válido (ej: `1.0.0`)
2. **Rango soportado:** Debe estar entre min y max
3. **Versión mayor:** Debe coincidir con la versión actual (backward compatibility)

### Ejemplos de Validación

```javascript
// ✅ Válido
X-API-Version: 1.0.0
X-API-Version: 1.0.1
X-API-Version: 1.1.0

// ❌ Inválido
X-API-Version: 2.0.0     // Versión mayor diferente
X-API-Version: 0.9.0     // Menor a versión mínima
X-API-Version: 1.0.0.1   // Formato inválido
X-API-Version: v1.0.0    // Formato inválido
```

## 🔄 Migración entre Versiones

### Actualizar Versión Minor (1.0.0 → 1.1.0)

1. Agregar nuevas features sin romper compatibilidad
2. Actualizar `API_VERSION` en `.env`
3. Las versiones anteriores (1.0.x) siguen funcionando

### Actualizar Versión Major (1.x.x → 2.0.0)

1. Documentar breaking changes
2. Actualizar `API_VERSION` y `MAX_SUPPORTED_VERSION`
3. Mantener soporte para versión anterior si es necesario

## 🛠️ Implementación Técnica

### Middleware

```javascript
// src/middlewares/versioning.middleware.js

// Valida versión en cada request
export const validarVersion = (req, res, next) => {
    const versionHeader = req.headers['x-api-version'];
    // ... validación semver
    req.apiVersion = versionValida;
    next();
};

// Agrega headers de versión a responses
export const agregarHeadersVersion = (req, res, next) => {
    res.setHeader('X-API-Version', API_VERSION);
    // ...
    next();
};
```

### Uso en Controllers

```javascript
// Acceder a la versión del request
export const obtenerRestaurantes = async (req, res) => {
    const apiVersion = req.apiVersion; // Versión solicitada
    
    // Usar feature según versión si es necesario
    if (featureDisponible(apiVersion, '1.1.0')) {
        // Feature nueva disponible desde 1.1.0
    }
    
    // ...
};
```

## 📚 Ejemplos de Uso

### Frontend - Especificar Versión

```javascript
// js/api.js
async request(endpoint, options = {}) {
    const headers = {
        ...this.getHeaders(),
        'X-API-Version': '1.0.0',  // Especificar versión
        ...options.headers
    };
    
    const response = await fetch(url, { ...options, headers });
    // ...
}
```

### Verificar Versión Disponible

```javascript
// Leer headers de respuesta
const apiVersion = response.headers.get('X-API-Version');
const minVersion = response.headers.get('X-API-Min-Version');
const maxVersion = response.headers.get('X-API-Max-Version');
```

## 🔐 Consideraciones de Seguridad

- ✅ Validación estricta de formato semver
- ✅ Verificación de rango de versiones soportadas
- ✅ Prevención de inyección en headers

## 📖 Referencias

- [Semantic Versioning](https://semver.org/)
- [semver npm package](https://www.npmjs.com/package/semver)

---

¿Necesitas agregar soporte para una nueva versión? Actualiza las constantes en `versioning.middleware.js` 🚀

