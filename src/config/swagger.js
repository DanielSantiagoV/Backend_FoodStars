// Importa swagger-ui-express que proporciona una interfaz web interactiva para visualizar la documentación
// Permite ver y probar los endpoints de la API desde el navegador
import swaggerUi from 'swagger-ui-express';
// Importa swagger-jsdoc que genera la especificación Swagger/OpenAPI desde comentarios JSDoc en el código
// Escanea los archivos y genera automáticamente la documentación
import swaggerJSDoc from 'swagger-jsdoc';
// Importa semver para validar y normalizar números de versión siguiendo el formato SemVer (ej: 1.0.0)
// SemVer es el estándar para versionado de software (Major.Minor.Patch)
import semver from 'semver';
// Importa y configura dotenv para cargar variables de entorno desde el archivo .env
import 'dotenv/config';

// Obtiene la versión de la API desde las variables de entorno
// Si API_VERSION no está definida, usa '1.0.0' como versión por defecto
const apiVersion = process.env.API_VERSION || '1.0.0';

// Validar y normalizar la versión
// semver.coerce() intenta convertir el string a un formato de versión válido
// semver.valid() valida que sea una versión SemVer válida
// Si no es válida, usa '1.0.0' como fallback
const normalizedVersion = semver.valid(semver.coerce(apiVersion)) || '1.0.0';

// Configuración de opciones para Swagger
const swaggerOptions = {
    // Definición principal de la especificación OpenAPI
    definition: {
        // Especifica la versión de OpenAPI que se está usando (3.0.0 es la más actual)
        openapi: '3.0.0',
        // Información general sobre la API
        info: {
            // Título de la API que aparecerá en la documentación
            title: 'FoodieRank API',
            // Versión de la API normalizada (validada con semver)
            version: normalizedVersion,
            // Descripción de qué hace la API
            description: 'API para sistema de ranking de restaurantes y platos',
            // Información de contacto para soporte
            contact: {
                name: 'FoodieRank Support'
            }
        },
        // Lista de servidores donde está disponible la API
        servers: [
            {
                // URL base del servidor construida dinámicamente desde variables de entorno
                // HOST_NAME puede ser 'localhost' o un dominio, PORT puede ser 3000 u otro puerto
                // /api/v1 es el prefijo común para todas las rutas de la API
                url: `http://${process.env.HOST_NAME || 'localhost'}:${process.env.PORT || 3000}/api/v1`,
                // Descripción del servidor para que los usuarios sepan qué servidor están usando
                description: 'Servidor de desarrollo'
            }
        ],
        // Componentes reutilizables de la especificación OpenAPI
        components: {
            // Esquemas de seguridad que definen cómo autenticar las solicitudes
            securitySchemes: {
                // Define el esquema de autenticación Bearer Token con JWT
                bearerAuth: {
                    // Tipo de esquema HTTP
                    type: 'http',
                    // Esquema de autenticación 'bearer' (token en el header Authorization)
                    scheme: 'bearer',
                    // Formato específico del token: JWT (JSON Web Token)
                    bearerFormat: 'JWT',
                    // Descripción para que los usuarios sepan cómo ingresar el token
                    description: 'Ingrese el token JWT'
                }
            }
        },
        // Configuración de seguridad global para toda la API
        // Por defecto, todos los endpoints requieren autenticación bearerAuth
        security: [
            {
                // Aplica el esquema bearerAuth (definido arriba) a todos los endpoints
                bearerAuth: []
            }
        ]
    },
    // Rutas de archivos donde Swagger buscará comentarios JSDoc o archivos YAML de documentación
    // Busca en todos los archivos .js dentro de ./src/routes/ y archivos .yaml en ./src/docs/
    apis: ['./src/routes/*.js', './src/docs/*.yaml']
};

// Genera la especificación Swagger/OpenAPI completa escaneando los archivos definidos en apis
// swaggerJSDoc procesa los comentarios JSDoc y archivos YAML y genera un objeto JSON con toda la documentación
const swaggerSpec = swaggerJSDoc(swaggerOptions);

// Función exportada que configura Swagger en la aplicación Express
// Debe llamarse en el archivo principal (app.js o server.js) pasando la instancia de Express
export const swaggerSetup = (app) => {
    // Configura la ruta /api-docs para servir la interfaz web de Swagger
    // swaggerUi.serve sirve los archivos estáticos necesarios para la UI
    // swaggerUi.setup configura y renderiza la documentación interactiva
    app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
        // CSS personalizado que oculta la barra superior de Swagger UI
        customCss: '.swagger-ui .topbar { display: none }',
        // Título personalizado que aparecerá en la pestaña del navegador
        customSiteTitle: 'FoodieRank API Documentation'
    }));
    
    // Endpoint para obtener el JSON de Swagger
    // Permite acceder a la especificación OpenAPI en formato JSON puro
    // Útil para herramientas externas que consumen la especificación o para depuración
    app.get('/api-docs.json', (req, res) => {
        // Establece el header Content-Type como application/json
        res.setHeader('Content-Type', 'application/json');
        // Envía la especificación Swagger completa como JSON
        res.send(swaggerSpec);
    });
};

// Exporta la especificación Swagger generada
// Útil si otros módulos necesitan acceder a la especificación directamente
export { swaggerSpec };

