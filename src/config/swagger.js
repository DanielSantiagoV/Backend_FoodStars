import swaggerUi from 'swagger-ui-express';
import swaggerJSDoc from 'swagger-jsdoc';
import semver from 'semver';
import 'dotenv/config';

const apiVersion = process.env.API_VERSION || '1.0.0';

// Validar y normalizar la versión
const normalizedVersion = semver.valid(semver.coerce(apiVersion)) || '1.0.0';

const swaggerOptions = {
    definition: {
        openapi: '3.0.0',
        info: {
            title: 'FoodieRank API',
            version: normalizedVersion,
            description: 'API para sistema de ranking de restaurantes y platos',
            contact: {
                name: 'FoodieRank Support'
            }
        },
        servers: [
            {
                url: `http://${process.env.HOST_NAME || 'localhost'}:${process.env.PORT || 3000}/api/v1`,
                description: 'Servidor de desarrollo'
            }
        ],
        components: {
            securitySchemes: {
                bearerAuth: {
                    type: 'http',
                    scheme: 'bearer',
                    bearerFormat: 'JWT',
                    description: 'Ingrese el token JWT'
                }
            }
        },
        security: [
            {
                bearerAuth: []
            }
        ]
    },
    apis: ['./src/routes/*.js', './src/docs/*.yaml']
};

const swaggerSpec = swaggerJSDoc(swaggerOptions);

export const swaggerSetup = (app) => {
    app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
        customCss: '.swagger-ui .topbar { display: none }',
        customSiteTitle: 'FoodieRank API Documentation'
    }));
    
    // Endpoint para obtener el JSON de Swagger
    app.get('/api-docs.json', (req, res) => {
        res.setHeader('Content-Type', 'application/json');
        res.send(swaggerSpec);
    });
};

export { swaggerSpec };

