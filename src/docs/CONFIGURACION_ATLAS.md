# Guía para Configurar MongoDB Atlas

Esta guía te ayudará a migrar de MongoDB local a MongoDB Atlas.

## 📋 Pasos para Configurar MongoDB Atlas

### 1. Crear cuenta en MongoDB Atlas

1. Ve a [https://www.mongodb.com/cloud/atlas](https://www.mongodb.com/cloud/atlas)
2. Crea una cuenta gratuita o inicia sesión
3. Selecciona el plan **FREE (M0)** - es completamente gratuito

### 2. Crear un Cluster

1. Una vez dentro de Atlas, haz clic en **"Build a Database"** o **"Create Cluster"**
2. Selecciona **FREE (M0)** - Shared cluster
3. Selecciona una región cercana a tu ubicación (para mejor rendimiento)
4. Deja las opciones por defecto y haz clic en **"Create"**
5. Espera a que el cluster se cree (puede tomar 3-5 minutos)

### 3. Configurar Usuario de Base de Datos

1. En la pantalla de creación de cluster, te pedirá crear un usuario:
   - **Username**: Elige un nombre de usuario (ej: `admin` o `foodierank_user`)
   - **Password**: Genera una contraseña segura (¡Guárdala bien!)
   - Haz clic en **"Create Database User"**

### 4. Configurar Acceso a la Red (Whitelist)

1. En la misma pantalla, configura el acceso a la red:
   - Para **desarrollo local**: Selecciona **"Add My Current IP Address"**
   - Para permitir acceso desde cualquier IP (solo desarrollo): Usa `0.0.0.0/0`
   - ⚠️ **IMPORTANTE**: `0.0.0.0/0` permite acceso desde cualquier IP - solo úsalo en desarrollo

2. Haz clic en **"Finish and Close"**

### 5. Obtener la Connection String (URI)

1. Una vez que el cluster esté listo, haz clic en **"Connect"**
2. Selecciona **"Connect your application"** o **"Drivers"**
3. Selecciona **"Node.js"** como driver
4. Copia la **Connection String** que aparece

La URI se verá algo así:
```
mongodb+srv://usuario:<password>@cluster0.xxxxx.mongodb.net/?retryWrites=true&w=majority
```

### 6. Crear el archivo `.env`

1. En la raíz de tu proyecto, crea un archivo llamado `.env` (si no existe)
2. Agrega las siguientes variables:

```env
# MongoDB Atlas Configuration
MONGO_URI=mongodb+srv://TU_USUARIO:TU_PASSWORD@TU_CLUSTER.mongodb.net/foodierank?retryWrites=true&w=majority
DB_NAME=foodierank

# JWT Secret Key
JWT_SECRET_KEY=tu-clave-secreta-super-segura-aqui

# Server Configuration
PORT=3000
HOST_NAME=localhost
NODE_ENV=development

# API Version
API_VERSION=1.0.0

# Frontend URL (opcional)
FRONTEND_URL=http://localhost:5500
```

### 7. Reemplazar los valores en MONGO_URI

En la URI que copiaste de Atlas:
1. Reemplaza `<password>` con tu contraseña real (sin los símbolos `<` y `>`)
2. Reemplaza el nombre de la base de datos después de `.net/` (o déjalo como está si ya incluye `foodierank`)
3. Si la URI no incluye el nombre de la base de datos, agrégalo así:
   ```
   mongodb+srv://usuario:password@cluster.mongodb.net/foodierank?retryWrites=true&w=majority
   ```

**Ejemplo completo:**
```env
MONGO_URI=mongodb+srv://foodierank_user:MiPassword123@cluster0.abc123.mongodb.net/foodierank?retryWrites=true&w=majority
```

### 8. Verificar la Conexión

1. Asegúrate de tener todas las dependencias instaladas:
   ```bash
   npm install
   ```

2. Inicia el servidor:
   ```bash
   npm run dev
   ```

3. Deberías ver mensajes como:
   ```
   ✅ Base de datos MongoDB conectada exitosamente
   ✅ Ping a MongoDB exitoso
   ✅ Usando base de datos: foodierank
   ```

### 9. Poblar la Base de Datos

Si es la primera vez, ejecuta el script de seed para crear datos de ejemplo:

```bash
npm run seed
```

## 🔒 Seguridad Importante

1. **Nunca subas el archivo `.env` al repositorio**
2. El archivo `.env` debe estar en `.gitignore`
3. En producción, usa variables de entorno del servidor, no archivos `.env`

## ❌ Solución de Problemas Comunes

### Error: "authentication failed"
- Verifica que el usuario y contraseña sean correctos
- Asegúrate de no tener caracteres especiales sin codificar en la contraseña

### Error: "ENOTFOUND" o "getaddrinfo"
- Verifica que la URI del cluster sea correcta
- Asegúrate de que tu IP esté en la whitelist de Atlas
- Verifica tu conexión a internet

### Error: "timeout"
- Verifica tu conexión a internet
- Revisa que el cluster de Atlas esté activo (no en estado "Paused")
- Asegúrate de que tu IP esté en la whitelist

### Error: "MONGO_URI no está definida"
- Asegúrate de que el archivo `.env` existe en la raíz del proyecto
- Verifica que no haya espacios antes o después de `=` en el archivo `.env`
- Reinicia el servidor después de crear/modificar el archivo `.env`

## 📝 Formato de URI Correcto

✅ **Correcto:**
```
mongodb+srv://usuario:password@cluster.mongodb.net/foodierank?retryWrites=true&w=majority
```

❌ **Incorrecto (local):**
```
mongodb://localhost:27017/foodierank
```

## 🎯 Próximos Pasos

Una vez configurado:
1. El código ya está preparado para usar Atlas automáticamente
2. Todos los datos se guardarán en tu cluster de Atlas
3. Puedes acceder a tus datos desde cualquier lugar con conexión a internet
4. La base de datos se respaldará automáticamente en Atlas

