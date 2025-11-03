// Imports
// Importa Express, el framework web para Node.js que facilita la creación de servidores y APIs
import express from "express";
// Importa y carga automáticamente las variables de entorno desde el archivo .env
import 'dotenv/config';
// Importa la función para conectar a la base de datos MongoDB
import { conectarBD } from "./config/db.js";
// Importa la configuración de CORS (Cross-Origin Resource Sharing) para permitir peticiones desde otros dominios
import corsConfig from "./config/cors.js";
// Importa la función para configurar la documentación Swagger de la API
import { swaggerSetup } from "./config/swagger.js";
// Importa los middlewares para manejar errores: manejo general de errores y ruta no encontrada
import { manejoErrores, rutaNoEncontrada } from "./middlewares/errores.middleware.js";
// Importa los middlewares y constante para el versionado de la API (validación, headers y versión actual)
import { validarVersion, agregarHeadersVersion, API_VERSION } from "./middlewares/versioning.middleware.js";
// Importa Passport, middleware de autenticación para Node.js
import passport from "passport";

// Rutas
// Importa el router que contiene todas las rutas relacionadas con usuarios
import usuarioRouter from "./routes/usuario.routes.js";
// Importa el router que contiene todas las rutas relacionadas con categorías
import categoriaRouter from "./routes/categoria.routes.js";
// Importa el router que contiene todas las rutas relacionadas con restaurantes
import restauranteRouter from "./routes/restaurante.routes.js";
// Importa el router que contiene todas las rutas relacionadas con platos
import platoRouter from "./routes/plato.routes.js";
// Importa el router que contiene todas las rutas relacionadas con reseñas
import reseñaRouter from "./routes/reseña.routes.js";
// Importa el router que contiene todas las rutas relacionadas con rankings
import rankingRouter from "./routes/ranking.routes.js";

// Config
// Crea una instancia de la aplicación Express
const app = express();
// Middleware para parsear automáticamente el cuerpo de las peticiones JSON a objetos JavaScript
app.use(express.json());
// Aplica la configuración de CORS para permitir peticiones desde diferentes orígenes
app.use(corsConfig);
// Inicializa Passport para que esté disponible en toda la aplicación
app.use(passport.initialize());

// Middleware de versionado (debe ir antes de las rutas)
// Middleware que agrega headers relacionados con la versión de la API a las respuestas
app.use(agregarHeadersVersion);
// Middleware que valida que las peticiones incluyan la versión correcta de la API
app.use(validarVersion);

// Swagger Documentation
// Configura Swagger UI para documentar la API, disponible en /api-docs
swaggerSetup(app);

// Health check
// Ruta GET para verificar que el servidor está activo y funcionando correctamente
app.get("/health", (req, res) => {
    // Retorna un status 200 (OK) con información del estado del servidor
    res.status(200).json({ 
        message: "Backend activo! FoodieRank API", // Mensaje indicando que el backend está activo
        version: API_VERSION, // Versión actual de la API
        timestamp: new Date().toISOString() // Fecha y hora actual en formato ISO
    });
});

// API Routes (versioned)
// Ruta de admin debe ir antes para evitar conflictos
// Registra el router de usuarios en la ruta /api/v1/admin/usuarios (alias para compatibilidad con frontend)
app.use(`/api/v1/admin/usuarios`, usuarioRouter); // Alias para compatibilidad con frontend
// Registra el router de usuarios en la ruta /api/v1/usuarios
app.use(`/api/v1/usuarios`, usuarioRouter);
// Registra el router de categorías en la ruta /api/v1/categorias
app.use(`/api/v1/categorias`, categoriaRouter);
// Registra el router de restaurantes en la ruta /api/v1/restaurantes
app.use(`/api/v1/restaurantes`, restauranteRouter);
// Registra el router de platos en la ruta /api/v1/platos
app.use(`/api/v1/platos`, platoRouter);
// Registra el router de reseñas en la ruta /api/v1/resenas
app.use(`/api/v1/resenas`, reseñaRouter);
// Registra el router de rankings en la ruta /api/v1/ranking
app.use(`/api/v1/ranking`, rankingRouter);

// Manejo de errores (debe ir al final)
// Middleware que maneja las rutas que no fueron encontradas (404)
app.use(rutaNoEncontrada);
// Middleware que maneja todos los errores que ocurren en la aplicación
app.use(manejoErrores);

// Ejecución
// Intenta conectar a la base de datos antes de iniciar el servidor
conectarBD().then(() => {
    // Obtiene el puerto desde las variables de entorno o usa 3000 por defecto
    const PORT = process.env.PORT || 3000;
    // Obtiene el nombre del host desde las variables de entorno o usa 'localhost' por defecto
    const HOST_NAME = process.env.HOST_NAME || 'localhost';
    // Inicia el servidor Express para escuchar peticiones en el puerto especificado
    app.listen(PORT, () => {
        // Imprime en consola la URL donde el backend está escuchando
        console.log(`🚀 Backend escuchando en http://${HOST_NAME}:${PORT}`);
        // Imprime en consola la URL de la documentación Swagger
        console.log(`📚 Documentación Swagger disponible en http://${HOST_NAME}:${PORT}/api-docs`);
        // Imprime en consola la versión actual de la API
        console.log(`🔗 API versión ${API_VERSION}`);
    });
}).catch((error) => {
    // Si hay un error al conectar a la base de datos, imprime el error en consola
    console.error("❌ Error al conectar la base de datos:", error);
    // Termina el proceso de Node.js con código de salida 1 (indica error)
    process.exit(1);
});
