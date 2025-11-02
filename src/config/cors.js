import cors from 'cors';

const corsOptions = {
    origin: function (origin, callback) {
        // Permitir requests sin origin (mobile apps, curl, etc.)
        if (!origin) return callback(null, true);
        
        // Lista de orígenes permitidos
        const allowedOrigins = [
            'http://localhost:3000',
            'http://localhost:8080',
            'http://127.0.0.1:5500',
            'http://localhost:5500',
            process.env.FRONTEND_URL
        ].filter(Boolean);
        
        // En desarrollo, permitir todos los orígenes de localhost
        if (process.env.NODE_ENV === 'development' || !process.env.NODE_ENV) {
            if (origin.includes('localhost') || origin.includes('127.0.0.1') || allowedOrigins.indexOf(origin) !== -1) {
                return callback(null, true);
            }
        }
        
        if (allowedOrigins.indexOf(origin) !== -1) {
            callback(null, true);
        } else {
            callback(new Error('No permitido por CORS'));
        }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
};

export default cors(corsOptions);

