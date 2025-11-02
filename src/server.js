// Imports
import express from "express";
import 'dotenv/config';
import { conectarBD } from "./config/db.js";
import corsConfig from "./config/cors.js";
import { swaggerSetup } from "./config/swagger.js";
import { manejoErrores, rutaNoEncontrada } from "./middlewares/errores.middleware.js";
import { validarVersion, agregarHeadersVersion, API_VERSION } from "./middlewares/versioning.middleware.js";
import passport from "passport";

// Rutas
import usuarioRouter from "./routes/usuario.routes.js";
import categoriaRouter from "./routes/categoria.routes.js";
import restauranteRouter from "./routes/restaurante.routes.js";
import platoRouter from "./routes/plato.routes.js";
import reseñaRouter from "./routes/reseña.routes.js";
import rankingRouter from "./routes/ranking.routes.js";

// Config
const app = express();
app.use(express.json());
app.use(corsConfig);
app.use(passport.initialize());

// Middleware de versionado (debe ir antes de las rutas)
app.use(agregarHeadersVersion);
app.use(validarVersion);

// Swagger Documentation
swaggerSetup(app);

// Health check
app.get("/health", (req, res) => {
    res.status(200).json({ 
        message: "Backend activo! FoodieRank API",
        version: API_VERSION,
        timestamp: new Date().toISOString()
    });
});

// API Routes (versioned)
app.use(`/api/v1/usuarios`, usuarioRouter);
app.use(`/api/v1/categorias`, categoriaRouter);
app.use(`/api/v1/restaurantes`, restauranteRouter);
app.use(`/api/v1/platos`, platoRouter);
app.use(`/api/v1/resenas`, reseñaRouter);
app.use(`/api/v1/ranking`, rankingRouter);

// Manejo de errores (debe ir al final)
app.use(rutaNoEncontrada);
app.use(manejoErrores);

// Ejecución
conectarBD().then(() => {
    const PORT = process.env.PORT || 3000;
    const HOST_NAME = process.env.HOST_NAME || 'localhost';
    app.listen(PORT, () => {
        console.log(`🚀 Backend escuchando en http://${HOST_NAME}:${PORT}`);
        console.log(`📚 Documentación Swagger disponible en http://${HOST_NAME}:${PORT}/api-docs`);
        console.log(`🔗 API versión ${API_VERSION}`);
    });
}).catch((error) => {
    console.error("❌ Error al conectar la base de datos:", error);
    process.exit(1);
});
