# 🔐 Autenticación de Usuario, Sesión, Cookies y JWT con Node.js

## 📚 Índice
1. [Conceptos Fundamentales](#conceptos-fundamentales)
2. [JWT (JSON Web Tokens)](#jwt-json-web-tokens)
3. [Implementación en el Proyecto](#implementación-en-el-proyecto)
4. [Flujo Completo de Autenticación](#flujo-completo-de-autenticación)
5. [Seguridad y Buenas Prácticas](#seguridad-y-buenas-prácticas)

---

## 1. Conceptos Fundamentales

### 🔑 Autenticación vs Autorización

**Autenticación**: Verificar quién es el usuario (login)
- ¿Es realmente quien dice ser?
- Ejemplo: Login con email y password

**Autorización**: Verificar qué puede hacer el usuario
- ¿Tiene permisos para esta acción?
- Ejemplo: Solo admins pueden aprobar restaurantes

### 🍪 Cookies vs LocalStorage vs JWT

#### Cookies
```javascript
// Set cookie (servidor)
res.cookie('token', jwtToken, {
    httpOnly: true,    // No accesible desde JavaScript
    secure: true,      // Solo HTTPS
    sameSite: 'strict', // Protección CSRF
    maxAge: 86400000   // 24 horas
});

// Leer cookie (automático en peticiones)
// El navegador envía cookies automáticamente
```

**Ventajas:**
- Enviadas automáticamente por el navegador
- Pueden ser httpOnly (seguridad)
- Funcionan en subdominios

**Desventajas:**
- Limitadas en tamaño (4KB)
- Pueden ser accedidas por JavaScript (XSS)
- Requieren configuración CORS

#### LocalStorage
```javascript
// Guardar token
localStorage.setItem('token', jwtToken);

// Leer token
const token = localStorage.getItem('token');

// Eliminar token
localStorage.removeItem('token');
```

**Ventajas:**
- Más espacio (5-10MB)
- Control total desde JavaScript
- No se envían automáticamente

**Desventajas:**
- Vulnerable a XSS
- No se envían automáticamente (hay que agregarlos manualmente)
- No funcionan en servidor

#### JWT (JSON Web Tokens)
- Formato estándar para tokens
- Puede almacenarse en cookies O localStorage
- Este proyecto usa localStorage

---

## 2. JWT (JSON Web Tokens)

### 🏗️ Estructura de un JWT

Un JWT tiene 3 partes separadas por puntos:

```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY3ODkwMTIzNDU2Nzg5MCIsImlhdCI6MTY4MTIzNDU2NywgImV4cCI6MTY4MTM0NTY3OH0.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c
```

**Formato:** `HEADER.PAYLOAD.SIGNATURE`

#### 1. Header (Encabezado)
```json
{
  "alg": "HS256",  // Algoritmo de encriptación
  "typ": "JWT"     // Tipo de token
}
```
→ Codificado en Base64URL

#### 2. Payload (Carga útil)
```json
{
  "id": "678901234567890",     // ID del usuario
  "iat": 1681234567,            // Issued At (fecha de emisión)
  "exp": 1681345678             // Expiration (fecha de expiración)
}
```
→ Codificado en Base64URL

#### 3. Signature (Firma)
```
HMACSHA256(
  base64UrlEncode(header) + "." + base64UrlEncode(payload),
  SECRET_KEY
)
```
→ Verifica que el token no ha sido modificado

### 🔨 Generar un JWT

```javascript
import jwt from 'jsonwebtoken';

const token = jwt.sign(
    { id: usuario._id.toString() },      // Payload
    process.env.JWT_SECRET_KEY,            // Clave secreta
    { expiresIn: '24h' }                   // Tiempo de expiración
);
```

### 🔍 Verificar un JWT

```javascript
try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET_KEY);
    console.log(decoded.id); // ID del usuario
} catch (error) {
    // Token inválido o expirado
    console.error('Token inválido');
}
```

---

## 3. Implementación en el Proyecto

### 📦 Dependencias Instaladas

```json
{
  "bcrypt": "^6.0.0",           // Para hashear passwords
  "jsonwebtoken": "^9.0.2",     // Para generar/verificar JWT
  "passport": "^0.7.0",         // Estrategias de autenticación
  "passport-jwt": "^4.0.1"      // Estrategia JWT para Passport
}
```

### 🔐 1. Hash de Passwords (bcrypt)

**Ubicación:** `src/models/usuario.model.js`

```javascript
import bcrypt from 'bcrypt';

// Al crear usuario - Hashear password
const saltRounds = 10;
const passwordHash = await bcrypt.hash(password, saltRounds);

// Al hacer login - Verificar password
const passwordValido = await bcrypt.compare(password, usuario.password);
```

**¿Por qué hashear?**
- Si alguien roba la BD, no puede ver passwords reales
- bcrypt usa "salt" (aleatorio) para cada hash único
- Es una función unidireccional (no se puede revertir)

**Ejemplo:**
```javascript
// Password original: "miPassword123"
// Hash generado: "$2b$10$rX8K7Y9vZ5nQw2P... (60 caracteres)"
// No se puede revertir → Solo se puede comparar
```

### 🎫 2. Generar Token JWT

**Ubicación:** `src/controllers/usuario.controller.js`

#### En Registro:
```javascript
export const registrarUsuario = async (req, res) => {
    const usuario = await crearUsuario({ nombre, email, password });
    
    // Generar token después de crear usuario
    const token = jwt.sign(
        { id: usuario._id.toString() },
        process.env.JWT_SECRET_KEY,
        { expiresIn: '24h' }
    );
    
    return responderExito(res, HTTP_STATUS.CREATED, {
        usuario,
        token  // Enviamos el token al frontend
    });
};
```

#### En Login:
```javascript
export const loginUsuario = async (req, res) => {
    // 1. Buscar usuario
    const usuario = await buscarUsuarioPorEmail(email);
    
    // 2. Verificar password
    const passwordValido = await bcrypt.compare(password, usuario.password);
    
    // 3. Si es válido, generar token
    const token = jwt.sign(
        { id: usuario._id.toString() },
        process.env.JWT_SECRET_KEY,
        { expiresIn: '24h' }
    );
    
    // 4. Retornar usuario (sin password) y token
    const { password: _, ...usuarioSinPassword } = usuario;
    return responderExito(res, HTTP_STATUS.OK, {
        usuario: usuarioSinPassword,
        token
    });
};
```

### 🛡️ 3. Middleware de Autenticación (Passport)

**Ubicación:** `src/config/passport.js`

```javascript
import passport from 'passport';
import { Strategy as JwtStrategy } from 'passport-jwt';
import { ExtractJwt } from 'passport-jwt';

// Configuración
const options = {
    secretOrKey: process.env.JWT_SECRET_KEY,
    jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken()
    // Extrae el token del header: Authorization: Bearer <token>
};

// Estrategia JWT
passport.use(
    new JwtStrategy(options, async (payload, done) => {
        try {
            // payload contiene { id: "..." } del token
            const user = await obtenerBD().collection("usuarios")
                .findOne({ _id: new ObjectId(payload.id) });
            
            if (!user) return done(null, false);
            return done(null, user); // Usuario encontrado
        } catch (error) {
            done(error, false);
        }
    })
);
```

**Middleware de autenticación:**
**Ubicación:** `src/middlewares/autenticacion.middleware.js`

```javascript
export const autenticacionMiddleware = (req, res, next) => {
    passport.authenticate('jwt', { session: false }, (err, usuario) => {
        if (err || !usuario) {
            return responderError(res, HTTP_STATUS.UNAUTHORIZED, 'No autorizado');
        }
        req.usuario = usuario; // Agregar usuario al request
        next(); // Continuar al siguiente middleware/controller
    })(req, res, next);
};
```

### 🛣️ 4. Rutas Protegidas

**Ubicación:** `src/routes/usuario.routes.js`

```javascript
// Ruta pública - No requiere autenticación
router.post('/login', loginUsuario);
router.post('/registro', registrarUsuario);

// Ruta protegida - Requiere token válido
router.get(
    '/perfil',
    autenticacionMiddleware,  // ← Middleware de autenticación
    obtenerMiPerfil           // ← Controller
);
```

### 🌐 5. Frontend - Almacenar Token

**Ubicación:** `js/auth.js`

```javascript
// Guardar token después de login/registro
function saveAuthData(token, user) {
    localStorage.setItem(CONFIG.STORAGE_KEYS.TOKEN, token);
    localStorage.setItem(CONFIG.STORAGE_KEYS.USER, JSON.stringify(user));
}

// Verificar si está autenticado
function isAuthenticated() {
    const token = localStorage.getItem(CONFIG.STORAGE_KEYS.TOKEN);
    const user = localStorage.getItem(CONFIG.STORAGE_KEYS.USER);
    return !!(token && user);
}

// Cerrar sesión
function logout() {
    localStorage.removeItem(CONFIG.STORAGE_KEYS.TOKEN);
    localStorage.removeItem(CONFIG.STORAGE_KEYS.USER);
}
```

### 📡 6. Frontend - Enviar Token en Peticiones

**Ubicación:** `js/api.js`

```javascript
getHeaders() {
    const headers = {
        'Content-Type': 'application/json'
    };
    
    // Obtener token del localStorage
    const token = localStorage.getItem(CONFIG.STORAGE_KEYS.TOKEN);
    
    if (token) {
        // Agregar token al header Authorization
        headers['Authorization'] = `Bearer ${token}`;
    }
    
    return headers;
}

// Todas las peticiones usan estos headers
async request(endpoint, options = {}) {
    const config = {
        ...options,
        headers: {
            ...this.getHeaders(),  // ← Incluye el token
            ...options.headers
        }
    };
    
    const response = await fetch(url, config);
    // ...
}
```

---

## 4. Flujo Completo de Autenticación

### 📝 Registro de Usuario

```
1. Usuario llena formulario (nombre, email, password)
   ↓
2. Frontend envía POST /api/v1/usuarios/registro
   ↓
3. Backend valida datos
   ↓
4. Backend hashea password con bcrypt
   ↓
5. Backend guarda usuario en BD
   ↓
6. Backend genera JWT con ID del usuario
   ↓
7. Backend retorna { usuario, token }
   ↓
8. Frontend guarda token en localStorage
   ↓
9. Frontend redirige a página principal
```

### 🔐 Login

```
1. Usuario ingresa email y password
   ↓
2. Frontend envía POST /api/v1/usuarios/login
   ↓
3. Backend busca usuario por email
   ↓
4. Backend compara password con bcrypt.compare()
   ↓
5. Si es válido → Genera JWT
   ↓
6. Retorna { usuario, token }
   ↓
7. Frontend guarda en localStorage
```

### 🔒 Acceso a Ruta Protegida

```
1. Usuario intenta acceder a /api/v1/usuarios/perfil
   ↓
2. Frontend obtiene token del localStorage
   ↓
3. Frontend envía petición con header:
   Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   ↓
4. Backend recibe petición
   ↓
5. Middleware autenticacionMiddleware ejecuta:
   - Extrae token del header
   - Verifica firma con JWT_SECRET_KEY
   - Extrae payload { id: "..." }
   - Busca usuario en BD por ID
   ↓
6. Si usuario existe → Agrega a req.usuario
   ↓
7. Controller obtiene req.usuario
   ↓
8. Retorna datos del usuario
```

### ⚠️ Token Inválido o Expirado

```
1. Usuario envía petición con token expirado
   ↓
2. Middleware intenta verificar token
   ↓
3. jwt.verify() falla → Error
   ↓
4. Middleware retorna 401 Unauthorized
   ↓
5. Frontend detecta 401
   ↓
6. Frontend limpia localStorage
   ↓
7. Frontend redirige a login
```

---

## 5. Seguridad y Buenas Prácticas

### ✅ Implementado en el Proyecto

1. **Passwords Hasheados**
   - ✅ bcrypt con salt rounds = 10
   - ✅ Nunca se almacenan en texto plano

2. **Token JWT Seguro**
   - ✅ Firmado con SECRET_KEY
   - ✅ Tiene expiración (24h)
   - ✅ Payload mínimo (solo ID)

3. **Validación de Input**
   - ✅ express-validator
   - ✅ Sanitización de datos

4. **Rate Limiting**
   - ✅ limiterAuth limita intentos de login

5. **Headers Seguros**
   - ✅ Authorization: Bearer <token>
   - ✅ Content-Type: application/json

### ⚠️ Consideraciones Adicionales

#### 1. HTTPS en Producción
```javascript
// Siempre usar HTTPS en producción
// Los tokens deben viajar encriptados
```

#### 2. Refresh Tokens (Tokens de Renovación)
```javascript
// Para mejorar seguridad, usar refresh tokens
// Access token: corto (15min) para peticiones
// Refresh token: largo (7 días) para renovar access token
```

#### 3. HttpOnly Cookies (Alternativa a localStorage)
```javascript
// Más seguro que localStorage para tokens
res.cookie('token', jwtToken, {
    httpOnly: true,  // No accesible desde JavaScript
    secure: true,    // Solo HTTPS
    sameSite: 'strict'
});
```

#### 4. Blacklist de Tokens
```javascript
// Para logout, invalidar tokens
// Guardar tokens revocados en Redis/BD
// Verificar en cada petición
```

#### 5. CORS Configurado
```javascript
// Limitar origen de peticiones
// Evitar CSRF
```

---

## 📋 Resumen

### 🔑 Conceptos Clave

| Concepto | Descripción |
|----------|-------------|
| **JWT** | Token estándar con payload, header y firma |
| **bcrypt** | Algoritmo para hashear passwords de forma segura |
| **Passport** | Middleware de autenticación con estrategias |
| **localStorage** | Almacenamiento del token en el navegador |
| **Bearer Token** | Formato del header: `Authorization: Bearer <token>` |

### 🔄 Flujo Simplificado

```
Login → Generar JWT → Guardar en localStorage 
→ Enviar en header → Middleware verifica → Acceso permitido
```

### 📁 Archivos Clave del Proyecto

- `src/models/usuario.model.js` - Hash de passwords
- `src/controllers/usuario.controller.js` - Generar tokens
- `src/config/passport.js` - Configuración JWT strategy
- `src/middlewares/autenticacion.middleware.js` - Verificar token
- `js/auth.js` - Gestión de sesión en frontend
- `js/api.js` - Enviar token en peticiones

---

¿Tienes preguntas específicas sobre algún aspecto de la autenticación? 🚀

