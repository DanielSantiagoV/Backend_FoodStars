// Importa el módulo 'cors' que permite configurar políticas de Cross-Origin Resource Sharing (CORS)
// CORS es un mecanismo de seguridad que permite o restringe solicitudes entre diferentes dominios
import cors from 'cors';

// Define las opciones de configuración para CORS
const corsOptions = {
    // La función 'origin' se ejecuta para cada solicitud entrante y decide si se permite o no el origen
    origin: function (origin, callback) {
        // Permitir requests sin origin (mobile apps, curl, Postman, etc.)
        // Algunas aplicaciones o herramientas no envían el header 'Origin', esto las permite
        if (!origin) return callback(null, true);
        
        // Lista de orígenes permitidos (URLs desde las que se pueden hacer solicitudes)
        const allowedOrigins = [
            'http://localhost:3000',      // Puerto común para aplicaciones React/Next.js en desarrollo
            'http://localhost:8080',      // Puerto común para servidores de desarrollo alternativos
            'http://127.0.0.1:5500',      // Puerto usado por Live Server (extensión de VS Code)
            'http://localhost:5500',      // Alternativa con localhost en lugar de 127.0.0.1
            process.env.FRONTEND_URL      // URL del frontend definida en variables de entorno (producción)
        ].filter(Boolean);                // Elimina valores undefined/null del array (por si FRONTEND_URL no está definida)
        
        // En desarrollo, permitir todos los orígenes de localhost
        // Si el entorno es 'development' o no está definido (entorno local)
        if (process.env.NODE_ENV === 'development' || !process.env.NODE_ENV) {
            // Permite cualquier origen que contenga 'localhost' o '127.0.0.1' o esté en la lista permitida
            if (origin.includes('localhost') || origin.includes('127.0.0.1') || allowedOrigins.indexOf(origin) !== -1) {
                return callback(null, true);  // callback(null, true) = origen permitido
            }
        }
        
        // Verifica si el origen de la solicitud está en la lista de orígenes permitidos
        // indexOf retorna -1 si el elemento no existe en el array
        if (allowedOrigins.indexOf(origin) !== -1) {
            callback(null, true);  // Permite la solicitud: callback(error, permitir)
        } else {
            // Rechaza la solicitud enviando un error
            callback(new Error('No permitido por CORS'));
        }
    },
    // credentials: true permite que las cookies y headers de autenticación se envíen en las solicitudes
    // Es necesario para mantener sesiones y tokens de autenticación entre dominios
    credentials: true,
    // Lista de métodos HTTP que se permiten en las solicitudes CORS
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    // Lista de headers HTTP personalizados que el cliente puede enviar en las solicitudes
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
};

// Exporta la configuración de CORS aplicada al middleware 'cors'
// Este middleware se usará en el servidor Express para manejar las solicitudes CORS
export default cors(corsOptions);

