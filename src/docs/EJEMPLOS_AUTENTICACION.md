# 💻 Ejemplos Prácticos de Autenticación JWT

## 🎯 Ejemplo 1: Generar y Verificar Token Manualmente

```javascript
import jwt from 'jsonwebtoken';

// Generar token
const usuario = { _id: '678901234567890' };
const SECRET_KEY = 'mi-clave-secreta-super-segura';

const token = jwt.sign(
    { id: usuario._id },
    SECRET_KEY,
    { expiresIn: '24h' }
);

console.log('Token generado:', token);
// Output: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY3ODkwMTIzNDU2Nzg5MCIsImlhdCI6MTY4MTIzNDU2NywgImV4cCI6MTY4MTM0NTY3OH0.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c

// Verificar token
try {
    const decoded = jwt.verify(token, SECRET_KEY);
    console.log('Token válido. Usuario ID:', decoded.id);
} catch (error) {
    console.error('Token inválido:', error.message);
}
```

## 🎯 Ejemplo 2: Proceso de Login Completo

### Backend (Node.js/Express)

```javascript
// src/controllers/usuario.controller.js
export const loginUsuario = async (req, res) => {
    try {
        const { email, password } = req.body;
        
        // 1. Buscar usuario
        const usuario = await buscarUsuarioPorEmail(email);
        if (!usuario) {
            return res.status(401).json({ 
                success: false, 
                message: 'Credenciales inválidas' 
            });
        }
        
        // 2. Verificar password
        const passwordValido = await bcrypt.compare(
            password, 
            usuario.password
        );
        
        if (!passwordValido) {
            return res.status(401).json({ 
                success: false, 
                message: 'Credenciales inválidas' 
            });
        }
        
        // 3. Generar JWT
        const token = jwt.sign(
            { id: usuario._id.toString() },
            process.env.JWT_SECRET_KEY,
            { expiresIn: '24h' }
        );
        
        // 4. Retornar respuesta (sin password)
        const { password: _, ...usuarioSinPassword } = usuario;
        
        return res.status(200).json({
            success: true,
            data: {
                usuario: usuarioSinPassword,
                token
            },
            message: 'Login exitoso'
        });
        
    } catch (error) {
        return res.status(500).json({ 
            success: false, 
            message: error.message 
        });
    }
};
```

### Frontend (JavaScript)

```javascript
// js/auth.js
async function handleLogin(email, password) {
    try {
        const response = await fetch('http://localhost:4000/api/v1/usuarios/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ email, password })
        });
        
        const data = await response.json();
        
        if (data.success) {
            // Guardar token y usuario
            localStorage.setItem('token', data.data.token);
            localStorage.setItem('user', JSON.stringify(data.data.usuario));
            
            console.log('Login exitoso!');
            window.location.href = 'index.html';
        } else {
            alert(data.message);
        }
    } catch (error) {
        console.error('Error en login:', error);
    }
}

// Uso
handleLogin('usuario@example.com', 'password123');
```

## 🎯 Ejemplo 3: Proteger una Ruta

### Backend - Middleware de Autenticación

```javascript
// src/middlewares/autenticacion.middleware.js
import jwt from 'jsonwebtoken';

export const autenticacionMiddleware = (req, res, next) => {
    try {
        // 1. Obtener token del header
        const authHeader = req.headers.authorization;
        
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({ 
                success: false, 
                message: 'Token no proporcionado' 
            });
        }
        
        // 2. Extraer token (remover "Bearer ")
        const token = authHeader.substring(7);
        
        // 3. Verificar token
        const decoded = jwt.verify(token, process.env.JWT_SECRET_KEY);
        
        // 4. Buscar usuario en BD
        const usuario = await obtenerBD()
            .collection('usuarios')
            .findOne({ _id: new ObjectId(decoded.id) });
        
        if (!usuario) {
            return res.status(401).json({ 
                success: false, 
                message: 'Usuario no encontrado' 
            });
        }
        
        // 5. Agregar usuario al request
        req.usuario = usuario;
        
        // 6. Continuar
        next();
        
    } catch (error) {
        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({ 
                success: false, 
                message: 'Token expirado' 
            });
        }
        return res.status(401).json({ 
            success: false, 
            message: 'Token inválido' 
        });
    }
};
```

### Usar Middleware en Rutas

```javascript
// src/routes/restaurante.routes.js
import { Router } from 'express';
import { autenticacionMiddleware } from '../middlewares/autenticacion.middleware.js';

const router = Router();

// Ruta pública - Cualquiera puede ver
router.get('/', obtenerTodosRestaurantes);

// Ruta protegida - Solo usuarios autenticados
router.post(
    '/',
    autenticacionMiddleware,  // ← Verifica token aquí
    crearRestaurante
);

// Ruta protegida - Solo admin
router.post(
    '/',
    autenticacionMiddleware,
    esAdminMiddleware,        // ← Verifica que sea admin
    aprobarRestaurante
);
```

## 🎯 Ejemplo 4: Frontend - Enviar Token en Peticiones

```javascript
// js/api.js
class APIClient {
    constructor(baseURL) {
        this.baseURL = baseURL;
    }
    
    // Obtener headers con token
    getHeaders() {
        const headers = {
            'Content-Type': 'application/json'
        };
        
        // Obtener token del localStorage
        const token = localStorage.getItem('token');
        
        if (token) {
            // Agregar token al header Authorization
            headers['Authorization'] = `Bearer ${token}`;
        }
        
        return headers;
    }
    
    // Método genérico para peticiones
    async request(endpoint, options = {}) {
        const url = `${this.baseURL}${endpoint}`;
        
        const config = {
            ...options,
            headers: {
                ...this.getHeaders(),  // ← Incluye el token
                ...options.headers
            }
        };
        
        try {
            const response = await fetch(url, config);
            const data = await response.json();
            
            // Si token inválido (401), limpiar y redirigir
            if (response.status === 401) {
                localStorage.removeItem('token');
                localStorage.removeItem('user');
                window.location.href = 'auth.html';
                return;
            }
            
            return data;
        } catch (error) {
            console.error('Error en petición:', error);
            throw error;
        }
    }
    
    // Métodos específicos
    async getProfile() {
        return this.request('/api/v1/usuarios/perfil');
    }
    
    async createRestaurant(data) {
        return this.request('/api/v1/restaurantes', {
            method: 'POST',
            body: JSON.stringify(data)
        });
    }
}

// Uso
const api = new APIClient('http://localhost:4000');

// Esta petición incluirá automáticamente el token
const perfil = await api.getProfile();
```

## 🎯 Ejemplo 5: Hashear y Verificar Password

```javascript
import bcrypt from 'bcrypt';

// 1. REGISTRO - Hashear password
async function registrarUsuario(nombre, email, password) {
    // Generar hash
    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(password, saltRounds);
    
    console.log('Password original:', password);
    // Output: miPassword123
    
    console.log('Password hasheado:', passwordHash);
    // Output: $2b$10$rX8K7Y9vZ5nQw2P3M4N5O6P7Q8R9S0T1U2V3W4X5Y6Z7A8B9C0D1E
    
    // Guardar en BD
    const usuario = {
        nombre,
        email,
        password: passwordHash  // ← Guardar hash, NO el password original
    };
    
    return usuario;
}

// 2. LOGIN - Verificar password
async function verificarLogin(email, passwordIngresado) {
    // Buscar usuario en BD
    const usuario = await buscarUsuarioPorEmail(email);
    
    // Comparar password ingresado con hash almacenado
    const esValido = await bcrypt.compare(
        passwordIngresado,      // Password que ingresó el usuario
        usuario.password         // Hash almacenado en BD
    );
    
    if (esValido) {
        console.log('✅ Password correcto');
        return true;
    } else {
        console.log('❌ Password incorrecto');
        return false;
    }
}

// Ejemplo de uso
async function ejemplo() {
    // Registro
    await registrarUsuario('Juan', 'juan@example.com', 'miPassword123');
    
    // Login
    const esValido = await verificarLogin('juan@example.com', 'miPassword123');
    // Si el password es correcto → esValido = true
}
```

## 🎯 Ejemplo 6: Decodificar JWT sin Verificar (Solo lectura)

```javascript
import jwt from 'jsonwebtoken';

const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY3ODkwMTIzNDU2Nzg5MCIsImlhdCI6MTY4MTIzNDU2NywgImV4cCI6MTY4MTM0NTY3OH0.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c';

// Decodificar sin verificar (NO RECOMENDADO para validación)
const decoded = jwt.decode(token);
console.log('Payload:', decoded);
// Output: { id: '678901234567890', iat: 1681234567, exp: 1681345678 }

// IMPORTANTE: jwt.decode() NO verifica la firma
// Cualquiera puede crear un token falso
// Siempre usar jwt.verify() para validación
```

## 🎯 Ejemplo 7: Manejo de Token Expirado

```javascript
// Frontend - Verificar si token está expirado antes de usarlo
function isTokenExpired(token) {
    try {
        const decoded = jwt.decode(token);
        
        if (!decoded || !decoded.exp) {
            return true;
        }
        
        // exp está en segundos, Date.now() está en milisegundos
        const expirationTime = decoded.exp * 1000;
        const currentTime = Date.now();
        
        return currentTime >= expirationTime;
    } catch (error) {
        return true;
    }
}

// Uso antes de hacer petición
function makeAuthenticatedRequest(url) {
    const token = localStorage.getItem('token');
    
    if (!token || isTokenExpired(token)) {
        // Token expirado o no existe
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = 'auth.html';
        return;
    }
    
    // Token válido, hacer petición
    return fetch(url, {
        headers: {
            'Authorization': `Bearer ${token}`
        }
    });
}
```

## 🎯 Ejemplo 8: Middleware para Verificar Rol (Admin)

```javascript
// src/middlewares/admin.middleware.js
export const esAdminMiddleware = (req, res, next) => {
    // El usuario ya está en req.usuario (agregado por autenticacionMiddleware)
    const usuario = req.usuario;
    
    if (!usuario) {
        return res.status(401).json({ 
            success: false, 
            message: 'No autenticado' 
        });
    }
    
    // Verificar si es admin
    if (usuario.rol !== 'admin') {
        return res.status(403).json({ 
            success: false, 
            message: 'Acceso denegado. Se requiere rol de administrador' 
        });
    }
    
    // Es admin, continuar
    next();
};

// Uso en rutas
router.delete(
    '/restaurantes/:id',
    autenticacionMiddleware,  // 1. Verificar token
    esAdminMiddleware,        // 2. Verificar que sea admin
    eliminarRestaurante       // 3. Ejecutar acción
);
```

## 🎯 Ejemplo 9: Cerrar Sesión (Logout)

### Frontend

```javascript
// js/auth.js
function logout() {
    // Limpiar datos locales
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    
    // Opcional: Notificar al servidor (si se implementa blacklist)
    fetch('http://localhost:4000/api/v1/usuarios/logout', {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
    }).catch(() => {
        // Ignorar errores si el servidor no tiene endpoint de logout
    });
    
    // Redirigir
    window.location.href = 'index.html';
}
```

### Backend (Opcional - Blacklist de tokens)

```javascript
// src/controllers/usuario.controller.js
export const logoutUsuario = async (req, res) => {
    try {
        const token = req.headers.authorization?.substring(7);
        
        if (token) {
            // Guardar token en blacklist (Redis o BD)
            await guardarTokenEnBlacklist(token);
        }
        
        return responderExito(res, HTTP_STATUS.OK, null, 'Logout exitoso');
    } catch (error) {
        return responderError(res, HTTP_STATUS.INTERNAL_SERVER_ERROR, error.message);
    }
};

// Middleware actualizado para verificar blacklist
export const verificarTokenBlacklist = async (req, res, next) => {
    const token = req.headers.authorization?.substring(7);
    
    if (await tokenEnBlacklist(token)) {
        return responderError(res, HTTP_STATUS.UNAUTHORIZED, 'Token revocado');
    }
    
    next();
};
```

## 📝 Resumen de Flujo Visual

```
┌─────────────┐
│   Usuario   │
│  (Frontend) │
└──────┬──────┘
       │
       │ 1. POST /login {email, password}
       ↓
┌─────────────────┐
│   Backend       │
│  - Verificar    │
│  - Generar JWT  │
└──────┬──────────┘
       │
       │ 2. Retorna {usuario, token}
       ↓
┌─────────────┐
│  Frontend   │
│ Guarda token│
│ localStorage│
└──────┬──────┘
       │
       │ 3. Peticiones con Authorization: Bearer <token>
       ↓
┌─────────────────┐
│   Middleware    │
│  - Verifica     │
│  - Decodifica   │
│  - Busca user   │
└──────┬──────────┘
       │
       │ 4. Agrega req.usuario
       ↓
┌─────────────────┐
│   Controller    │
│  Procesa request│
└─────────────────┘
```

---

Estos ejemplos cubren todos los aspectos principales de la autenticación JWT. ¿Necesitas más detalles sobre algún ejemplo específico? 🚀

