/**
 * Script de Seed para poblar la base de datos con datos de ejemplo
 * Ejecutar con: node src/scripts/seed.js
 */

// Importa las funciones de conexión a la base de datos
// conectarBD: establece la conexión con MongoDB
// obtenerBD: obtiene la instancia de la base de datos ya conectada
import { conectarBD, obtenerBD } from '../config/db.js';
// Importa las funciones del modelo de categorías
// crearCategoria: crea una nueva categoría en la base de datos
import { crearCategoria } from '../models/categoria.model.js';
// Importa las funciones del modelo de restaurantes
// crearRestaurante: crea un nuevo restaurante
// aprobarRestaurante: marca un restaurante como aprobado (visible para todos)
import { crearRestaurante, aprobarRestaurante } from '../models/restaurante.model.js';
// Importa las funciones del modelo de platos
// crearPlato: crea un nuevo plato asociado a un restaurante
import { crearPlato } from '../models/plato.model.js';
// Importa las funciones del modelo de usuarios
// crearUsuario: crea un nuevo usuario con contraseña hasheada
import { crearUsuario } from '../models/usuario.model.js';
// Importa las funciones del modelo de reseñas
// crearReseña: crea una nueva reseña para un restaurante
import { crearReseña } from '../models/reseña.model.js';
// Importa las funciones del modelo de restaurantes para actualización
// actualizarCalificacionPromedio: actualiza el promedio de calificaciones de un restaurante
import { actualizarCalificacionPromedio } from '../models/restaurante.model.js';
// Importa el servicio de ranking
// actualizarRankingRestaurante: calcula y actualiza el ranking de un restaurante
import { actualizarRankingRestaurante } from '../services/ranking.service.js';
// Importa ObjectId de MongoDB para trabajar con identificadores
import { ObjectId } from 'mongodb';
// Importa función helper para convertir strings a ObjectId
// convertirAObjectId: convierte un string a ObjectId válido de MongoDB
import { convertirAObjectId } from '../utils/helpers.js';
// Importa módulos nativos de Node.js para descargar imágenes
// https: módulo para realizar peticiones HTTPS
// http: módulo para realizar peticiones HTTP
import https from 'https';
import http from 'http';
// Importa URL para parsear y trabajar con URLs
import { URL } from 'url';
// Importa dotenv para cargar variables de entorno desde el archivo .env
import 'dotenv/config';

/**
 * Convertir URL de imagen a Base64
 * Usa módulos nativos de Node.js para soportar cualquier URL
 * @param {string} imageUrl - URL de la imagen
 * @returns {Promise<string|null>} - Base64 string o null si falla
 */
// Función que descarga una imagen desde una URL y la convierte a formato Base64
// Esta función es necesaria porque el sistema almacena imágenes en formato Base64
async function convertirImagenABase64(imageUrl) {
    // Retorna una Promise que se resuelve cuando la imagen se descarga y convierte
    return new Promise((resolve) => {
        try {
            // Mensaje indicando que se está descargando la imagen
            console.log(`📥 Descargando imagen: ${imageUrl}`);
            
            // Parsear la URL para extraer sus componentes (protocolo, hostname, path, etc.)
            const url = new URL(imageUrl);
            // Determina qué módulo usar según el protocolo (HTTPS o HTTP)
            const protocol = url.protocol === 'https:' ? https : http;
            
            // Configura las opciones para la petición HTTP/HTTPS
            const options = {
                hostname: url.hostname,  // Nombre del host (ej: images.unsplash.com)
                // Puerto por defecto según el protocolo (443 para HTTPS, 80 para HTTP)
                port: url.port || (url.protocol === 'https:' ? 443 : 80),
                // Ruta completa incluyendo query parameters
                path: url.pathname + url.search,
                method: 'GET',  // Método HTTP GET
                headers: {
                    // User-Agent para evitar bloqueos de algunos servidores
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
                    'Accept': 'image/*,*/*',  // Acepta cualquier tipo de imagen
                    'Accept-Language': 'en-US,en;q=0.9',  // Idioma preferido
                    'Cache-Control': 'no-cache',  // No usar caché
                    'Connection': 'keep-alive'  // Mantener la conexión abierta
                },
                timeout: 30000 // 30 segundos de timeout
            };

            // Crea la petición HTTP/HTTPS
            const req = protocol.request(options, (res) => {
                // Manejar redirecciones (códigos 301, 302, 303, 307, 308)
                // Algunos servidores redirigen a otra URL para la imagen
                if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
                    // Construye la URL de redirección (absoluta o relativa)
                    const redirectUrl = res.headers.location.startsWith('http') 
                        ? res.headers.location  // Si ya es una URL completa
                        : `${url.protocol}//${url.hostname}${res.headers.location}`;  // Si es relativa, se completa
                    console.log(`   ↪ Redirigiendo a: ${redirectUrl}`);
                    // Destruye la petición actual
                    req.destroy();
                    // Llama recursivamente a la función con la nueva URL
                    convertirImagenABase64(redirectUrl).then(resolve).catch(() => resolve(null));
                    return;
                }

                // Verifica que el código de estado sea exitoso (200-299)
                if (res.statusCode < 200 || res.statusCode >= 300) {
                    console.error(`   ❌ Error HTTP ${res.statusCode} al descargar imagen`);
                    resolve(null);
                    return;
                }

                // Obtiene el tipo de contenido (MIME type) de la imagen
                // Si no se especifica, asume 'image/jpeg' por defecto
                const contentType = res.headers['content-type'] || 'image/jpeg';
                
                // Arrays y variables para acumular los datos de la imagen
                const chunks = [];  // Array para almacenar los chunks de datos
                let totalLength = 0;  // Contador del tamaño total descargado
                const maxSize = 10 * 1024 * 1024; // 10MB máximo (límite de seguridad)

                // Evento que se dispara cada vez que llega un chunk de datos
                res.on('data', (chunk) => {
                    // Suma el tamaño del chunk al total
                    totalLength += chunk.length;
                    // Verifica que no se exceda el tamaño máximo
                    if (totalLength > maxSize) {
                        console.error(`   ❌ Imagen demasiado grande (>10MB)`);
                        // Destruye la petición para detener la descarga
                        req.destroy();
                        resolve(null);
                        return;
                    }
                    // Agrega el chunk al array
                    chunks.push(chunk);
                });

                // Evento que se dispara cuando la descarga termina
                res.on('end', () => {
                    try {
                        // Verifica que se recibieron datos
                        if (chunks.length === 0) {
                            console.error(`   ❌ No se recibieron datos de la imagen`);
                            resolve(null);
                            return;
                        }
                        // Concatena todos los chunks en un solo Buffer
                        const buffer = Buffer.concat(chunks);
                        // Convierte el buffer a string Base64
                        const base64 = buffer.toString('base64');
                        // Crea el string Base64 completo con el prefijo data URI
                        const base64String = `data:${contentType};base64,${base64}`;
                        
                        // Calcula el tamaño en KB para mostrar en el log
                        const sizeKB = Math.round(base64String.length / 1024);
                        console.log(`   ✅ Imagen convertida a Base64 (${sizeKB}KB)`);
                        // Resuelve la Promise con el string Base64
                        resolve(base64String);
                    } catch (error) {
                        // Captura errores durante la conversión
                        console.error(`   ❌ Error al convertir a Base64:`, error.message);
                        resolve(null);
                    }
                });

                // Evento que se dispara si hay un error en la respuesta
                res.on('error', (error) => {
                    console.error(`   ❌ Error en la respuesta:`, error.message);
                    resolve(null);
                });
            });

            // Evento que se dispara si hay un error en la petición
            req.on('error', (error) => {
                console.error(`   ❌ Error al descargar imagen:`, error.message);
                resolve(null);
            });

            // Evento que se dispara si se excede el timeout
            req.on('timeout', () => {
                console.error(`   ❌ Timeout al descargar imagen (30s)`);
                // Destruye la petición
                req.destroy();
                resolve(null);
            });

            // Establece el timeout de 30 segundos
            req.setTimeout(30000);
            // Envía la petición
            req.end();

        } catch (error) {
            // Captura cualquier error durante el procesamiento de la URL
            console.error(`❌ Error al procesar URL ${imageUrl}:`, error.message);
            resolve(null);
        }
    });
}

/**
 * Limpiar base de datos (opcional - solo en desarrollo)
 */
// Función que elimina todos los documentos de todas las colecciones
// Esto se ejecuta antes del seed para empezar con una base de datos limpia
async function limpiarBD() {
    // Obtiene la instancia de la base de datos
    const db = obtenerBD();
    // Elimina todos los documentos de cada colección usando deleteMany({})
    // El filtro vacío {} significa que elimina todos los documentos
    await db.collection('categorias').deleteMany({});
    await db.collection('restaurantes').deleteMany({});
    await db.collection('platos').deleteMany({});
    await db.collection('usuarios').deleteMany({});
    await db.collection('reseñas').deleteMany({});
    // Mensaje confirmando que la limpieza se completó
    console.log('✅ Base de datos limpiada');
}

/**
 * Crear categorías
 */
// Función que crea las categorías de ejemplo en la base de datos
async function seedCategorias() {
    // Define un array con las categorías a crear
    // Cada categoría tiene nombre y descripción
    const categorias = [
        {
            nombre: 'Italiana',
            descripcion: 'Auténtica comida italiana con pasta, pizza y más'
        },
        {
            nombre: 'Mexicana',
            descripcion: 'Sabores tradicionales mexicanos'
        },
        {
            nombre: 'Japonesa',
            descripcion: 'Sushi, ramen y cocina japonesa auténtica'
        },
        {
            nombre: 'Comida rápida',
            descripcion: 'Hamburguesas, pizzas y opciones rápidas'
        },
        {
            nombre: 'Gourmet',
            descripcion: 'Alta cocina y platos refinados'
        },
        {
            nombre: 'Vegetariana',
            descripcion: 'Opciones saludables y vegetarianas'
        },
        {
            nombre: 'Colombiana',
            descripcion: 'Comida típica colombiana'
        },
        {
            nombre: 'Mariscos',
            descripcion: 'Pescados y mariscos frescos'
        }
    ];

    // Array para almacenar las categorías creadas o existentes
    const categoriasCreadas = [];
    // Obtiene la instancia de la base de datos
    const db = obtenerBD();
    
    // Itera sobre cada categoría a crear
    for (const categoriaData of categorias) {
        try {
            // Primero verifica si la categoría ya existe en la base de datos
            // Esto evita duplicados si el script se ejecuta múltiples veces
            const existente = await db.collection('categorias').findOne({ nombre: categoriaData.nombre });
            if (existente) {
                // Si ya existe, muestra un mensaje y la agrega al array de resultados
                console.log(`⚠️  Categoría ya existe: ${categoriaData.nombre}`);
                categoriasCreadas.push(existente);
                // Continúa con la siguiente categoría sin intentar crearla
                continue;
            }
            
            // Si no existe, crea la categoría usando el modelo
            const categoria = await crearCategoria(categoriaData);
            // Agrega la categoría creada al array de resultados
            categoriasCreadas.push(categoria);
            // Mensaje de éxito
            console.log(`✅ Categoría creada: ${categoria.nombre}`);
        } catch (error) {
            // Manejo de errores: si el error indica que ya existe
            if (error.message.includes('ya existe')) {
                console.log(`⚠️  Categoría ya existe: ${categoriaData.nombre}`);
                // Busca la categoría existente y la agrega al array
                const existente = await db.collection('categorias').findOne({ nombre: categoriaData.nombre });
                if (existente) categoriasCreadas.push(existente);
            } else {
                // Si es otro tipo de error, lo muestra en consola
                console.error(`❌ Error al crear categoría ${categoriaData.nombre}:`, error.message);
            }
        }
    }

    // Retorna el array con todas las categorías (creadas o existentes)
    return categoriasCreadas;
}

/**
 * Crear usuarios
 */
// Función que crea usuarios de ejemplo en la base de datos
// Incluye un usuario administrador y varios usuarios normales
async function seedUsuarios() {
    // Define un array con los usuarios a crear
    // El primer usuario es un administrador, los demás son usuarios normales
    const usuarios = [
        {
            nombre: 'Admin User',
            email: 'admin@foodierank.com',
            password: 'admin123',
            esAdmin: true  // Marca este usuario como administrador
        },
        {
            nombre: 'Juan Pérez',
            email: 'juan@example.com',
            password: 'password123'
        },
        {
            nombre: 'María González',
            email: 'maria@example.com',
            password: 'password123'
        },
        {
            nombre: 'Carlos Rodríguez',
            email: 'carlos@example.com',
            password: 'password123'
        }
    ];

    // Array para almacenar los usuarios creados o existentes
    const usuariosCreados = [];
    // Obtiene la instancia de la base de datos
    const db = obtenerBD();
    
    // Itera sobre cada usuario a crear
    for (const usuarioData of usuarios) {
        try {
            // Crea el usuario usando el modelo (la contraseña se hashea automáticamente)
            const usuario = await crearUsuario({
                nombre: usuarioData.nombre,
                email: usuarioData.email,
                password: usuarioData.password
            });

            // Si el usuario debe ser administrador, actualiza su rol
            if (usuarioData.esAdmin) {
                // Actualiza directamente en la base de datos el campo rol
                await db.collection('usuarios').updateOne(
                    { _id: usuario._id },  // Filtro: busca por ID
                    { $set: { rol: 'admin' } }  // Operación: establece el rol como 'admin'
                );
                // Actualiza el objeto local para reflejar el cambio
                usuario.rol = 'admin';
            }

            // Agrega el usuario al array de resultados
            usuariosCreados.push(usuario);
            // Mensaje de éxito con nombre y email
            console.log(`✅ Usuario creado: ${usuario.nombre} (${usuario.email})`);
        } catch (error) {
            // Manejo de errores: si el error indica que el email ya está registrado
            if (error.message.includes('ya está registrado')) {
                console.log(`⚠️  Usuario ya existe: ${usuarioData.email}`);
                // Busca el usuario existente y lo agrega al array
                const existente = await db.collection('usuarios').findOne({ email: usuarioData.email });
                if (existente) usuariosCreados.push(existente);
            } else {
                // Si es otro tipo de error, lo muestra en consola
                console.error(`❌ Error al crear usuario ${usuarioData.email}:`, error.message);
            }
        }
    }

    // Retorna el array con todos los usuarios (creados o existentes)
    return usuariosCreados;
}

/**
 * Crear restaurantes
 */
// Función que crea restaurantes de ejemplo con sus platos
// También convierte las imágenes de URL a Base64 antes de guardarlas
// @param {Array} categorias - Array de categorías creadas previamente
// @param {string} adminId - ID del administrador (no se usa actualmente)
async function seedRestaurantes(categorias, adminId) {
    // Define un array con los restaurantes a crear
    // Cada restaurante incluye: nombre, descripción, categoría, ubicación, imagen y platos
    const restaurantes = [
        {
            nombre: 'La Pizzería',
            descripcion: 'Pizza italiana artesanal con ingredientes frescos y sabores auténticos.',
            categoria: 'Italiana',
            ubicacion: 'Calle 123 #45-67, Bogotá',
            imagen: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
            platos: [
                { nombre: 'Pizza Margherita', descripcion: 'Tomate, mozzarella y albahaca fresca', precio: 35000, imagen: 'https://images.unsplash.com/photo-1574071318508-1cdbab80d002?w=800' },
                { nombre: 'Pizza Quattro Stagioni', descripcion: 'Cuatro estaciones con ingredientes selectos', precio: 42000, imagen: 'https://images.unsplash.com/photo-1657799831232-e9548089a643?w=800' },
                { nombre: 'Lasagna Tradicional', descripcion: 'Pasta casera con carne y bechamel', precio: 38000, imagen: 'https://images.unsplash.com/photo-1709429790175-b02bb1b19207?w=800' },
                { nombre: 'Espagueti Carbonara', descripcion: 'Pasta con pancetta y crema', precio: 32000, imagen: 'https://images.unsplash.com/photo-1588013273468-315fd88ea34c?w=800' }
            ]
        },
        {
            nombre: 'El Taco Loco',
            descripcion: 'Los mejores tacos mexicanos en la ciudad. Sabores auténticos y ambiente festivo.',
            categoria: 'Mexicana',
            ubicacion: 'Avenida 45 #78-90, Medellín',
            imagen: 'https://img.cdn4dd.com/p/fit=cover,width=1200,height=1200,format=auto,quality=90/media/photosV2/57387668-4e7d-4772-b55f-6fd76bbbfcf4-retina-large.jpg',
            platos: [
                { nombre: 'Tacos de Carne Asada', descripcion: 'Tortillas de maíz con carne asada', precio: 18000, imagen: 'https://images.unsplash.com/photo-1599974579688-8dbdd335c77f?w=800' },
                { nombre: 'Quesadillas', descripcion: 'Tortillas rellenas de queso y pollo', precio: 22000, imagen: 'https://images.unsplash.com/photo-1617990590988-895fe6cbabda?w=800' },
                { nombre: 'Nachos Supreme', descripcion: 'Nachos con carne, queso y guacamole', precio: 28000, imagen: 'https://images.unsplash.com/photo-1582169296194-e4d644c48063?w=800' },
                { nombre: 'Burritos', descripcion: 'Burrito grande con ingredientes seleccionados', precio: 25000, imagen: 'https://plus.unsplash.com/premium_photo-1664478294917-c11274b9ce79?w=800' }
            ]
        },
        {
            nombre: 'Sushi Master',
            descripcion: 'Sushi y comida japonesa preparada por chefs expertos. Ingredientes frescos del día.',
            categoria: 'Japonesa',
            ubicacion: 'Carrera 15 #93-45, Bogotá',
            imagen: 'https://images.unsplash.com/photo-1579584425555-c3ce17fd4351?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
            platos: [
                { nombre: 'Sushi Roll Premium', descripcion: '12 piezas de sushi variado', precio: 55000, imagen: 'https://images.unsplash.com/photo-1761315412759-395963440a7e?w=800' },
                { nombre: 'Ramen Tonkotsu', descripcion: 'Fideos ramen con caldo de cerdo', precio: 38000, imagen: 'https://images.unsplash.com/photo-1635379511574-bc167ca085c8?w=800' },
                { nombre: 'Tempura de Camarones', descripcion: 'Camarones rebozados y fritos', precio: 42000, imagen: 'https://images.unsplash.com/photo-1591100622264-4a2605e175a3?w=800' },
                { nombre: 'Sashimi Mix', descripcion: 'Selección de pescado crudo fresco', precio: 65000, imagen: 'https://images.unsplash.com/photo-1638866381709-071747b518c8?w=800' }
            ]
        },
        {
            nombre: 'Burger Paradise',
            descripcion: 'Hamburguesas gourmet con ingredientes premium. El mejor lugar para hamburguesas.',
            categoria: 'Comida rápida',
            ubicacion: 'Calle 70 #10-30, Bogotá',
            imagen: 'https://images.unsplash.com/photo-1550547660-d9450f859349?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
            platos: [
                { nombre: 'Burger Clásica', descripcion: 'Carne, queso, lechuga, tomate', precio: 25000, imagen: 'https://plus.unsplash.com/premium_photo-1675252369719-dd52bc69c3df?w=800' },
                { nombre: 'Burger BBQ', descripcion: 'Con salsa BBQ y cebolla caramelizada', precio: 28000, imagen: 'https://images.unsplash.com/photo-1572802419224-296b0aeee0d9?w=800' },
                { nombre: 'Burger Vegetariana', descripcion: 'Opción vegetariana con vegetales', precio: 23000, imagen: 'https://plus.unsplash.com/premium_photo-1672363353886-a106864f5cb9?w=800' },
                { nombre: 'Papas Fritas', descripcion: 'Papas fritas crujientes', precio: 12000, imagen: 'https://images.unsplash.com/photo-1630384060421-cb20d0e0649d?w=800' }
            ]
        },
        {
            nombre: 'Le Gourmet',
            descripcion: 'Restaurante de alta cocina con menú degustación. Experiencia gastronómica única.',
            categoria: 'Gourmet',
            ubicacion: 'Carrera 11 #93-80, Bogotá',
            imagen: 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
            platos: [
                { nombre: 'Menú Degustación', descripcion: '7 platos del chef', precio: 180000, imagen: 'https://www.justroyalbcn.com/wp-content/uploads/2025/02/como-crear-un-menu-degustacion-en-casa-consejos-y-recetas-scaled.jpg' },
                { nombre: 'Filete Mignon', descripcion: 'Corte premium con guarniciones', precio: 85000, imagen: 'https://images.unsplash.com/photo-1726677730666-fdc08a8da464?w=800' },
                { nombre: 'Salmón a la Plancha', descripcion: 'Salmón con verduras de temporada', precio: 72000, imagen: 'https://images.unsplash.com/photo-1611599537845-1c7aca0091c0?w=800' },
                { nombre: 'Risotto de Hongos', descripcion: 'Arroz cremoso con hongos silvestres', precio: 45000, imagen: 'https://plus.unsplash.com/premium_photo-1694850980439-61487c39be4f?w=800' }
            ]
        },
        {
            nombre: 'Veggie Delight',
            descripcion: 'Cocina vegetariana saludable y deliciosa. Todos nuestros platos son 100% vegetarianos.',
            categoria: 'Vegetariana',
            ubicacion: 'Calle 85 #12-45, Bogotá',
            imagen: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
            platos: [
                { nombre: 'Ensalada Mediterránea', descripcion: 'Ensalada fresca con vegetales', precio: 22000, imagen: 'https://plus.unsplash.com/premium_photo-1676047258557-de72954cf17c?w=800' },
                { nombre: 'Wrap Vegetariano', descripcion: 'Wrap con vegetales y hummus', precio: 25000, imagen: 'https://images.unsplash.com/photo-1592044903782-9836f74027c0?w=800' },
                { nombre: 'Quinoa Bowl', descripcion: 'Bowl de quinoa con vegetales', precio: 28000, imagen: 'https://images.unsplash.com/photo-1623428187969-5da2dcea5ebf?w=800' },
                { nombre: 'Hamburguesa de Lentejas', descripcion: 'Hamburguesa vegetal de lentejas', precio: 23000, imagen: 'https://images.unsplash.com/photo-1629680871149-434f75071693?w=800' }
            ]
        },
        {
            nombre: 'La Bandeja Paisa',
            descripcion: 'Comida típica colombiana. Sabores auténticos del campo colombiano.',
            categoria: 'Colombiana',
            ubicacion: 'Carrera 7 #32-10, Bogotá',
            imagen: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
            platos: [
                { nombre: 'Bandeja Paisa', descripcion: 'Plato tradicional colombiano', precio: 35000, imagen: 'https://comedera.com/wp-content/uploads/sites/9/2021/11/bandeja-paisa-colombiana.jpg' },
                { nombre: 'Ajiaco Santafereño', descripcion: 'Sopa tradicional bogotana', precio: 28000, imagen: 'https://www.recetasnestle.com.co/sites/default/files/srh_recipes/f78cf6630b31638994b09b3b470b085c.jpg' },
                { nombre: 'Sancocho de Gallina', descripcion: 'Sancocho tradicional', precio: 30000, imagen: 'https://images.unsplash.com/photo-1708782344071-35ed44b849a9?w=880' },
                { nombre: 'Arepas con Queso', descripcion: 'Arepas rellenas de queso', precio: 15000, imagen: 'https://plus.unsplash.com/premium_photo-1668618293956-0ba712d7f4f0?w=800' }
            ]
        },
        {
            nombre: 'Mariscos del Caribe',
            descripcion: 'Pescados y mariscos frescos del día. Especialidad en cocina costeña.',
            categoria: 'Mariscos',
            ubicacion: 'Carrera 50 #75-20, Barranquilla',
            imagen: 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
            platos: [
                { nombre: 'Ceviche de Camarón', descripcion: 'Ceviche fresco con camarones', precio: 38000, imagen: 'https://images.unsplash.com/photo-1626663011519-b42e5ee10056?w=800' },
                { nombre: 'Pescado Frito', descripcion: 'Pescado frito con arroz y patacones', precio: 42000, imagen: 'https://images.unsplash.com/photo-1665401015549-712c0dc5ef85?w=800' },
                { nombre: 'Arroz con Mariscos', descripcion: 'Arroz con mariscos frescos', precio: 45000, imagen: 'https://images.unsplash.com/photo-1554371650-4484f3a102f2?w=800' },
                { nombre: 'Paella de Mariscos', descripcion: 'Paella con mariscos selectos', precio: 85000, imagen: 'https://images.unsplash.com/photo-1623961990059-28356e226a77?w=800' }
            ]
        }
    ];

    // Array para almacenar los restaurantes creados con sus platos
    const restaurantesCreados = [];
    
    // Itera sobre cada restaurante a crear
    for (const restauranteData of restaurantes) {
        try {
            // Busca la categoría correspondiente por nombre
            // El restaurante tiene un string con el nombre de la categoría, se busca en el array
            const categoria = categorias.find(c => c.nombre === restauranteData.categoria);
            if (!categoria) {
                // Si no se encuentra la categoría, muestra un mensaje y continúa con el siguiente restaurante
                console.log(`⚠️  Categoría no encontrada: ${restauranteData.categoria}`);
                continue;
            }

            // Convierte la imagen del restaurante de URL a Base64 si es necesario
            let imagenBase64 = null;
            // Si la imagen es una URL HTTP/HTTPS, la descarga y convierte
            if (restauranteData.imagen && restauranteData.imagen.startsWith('http')) {
                imagenBase64 = await convertirImagenABase64(restauranteData.imagen);
                // Si falla la conversión, usa null (el restaurante se crea sin imagen)
                if (!imagenBase64) {
                    console.log(`⚠️  No se pudo cargar imagen para ${restauranteData.nombre}, continuando sin imagen`);
                }
            } else if (restauranteData.imagen && restauranteData.imagen.startsWith('data:image')) {
                // Si ya es Base64, lo usa directamente sin convertir
                imagenBase64 = restauranteData.imagen;
            }

            // Crea el restaurante usando el modelo
            const restaurante = await crearRestaurante({
                nombre: restauranteData.nombre,
                descripcion: restauranteData.descripcion,
                categoriaId: categoria._id.toString(),  // Convierte ObjectId a string
                ubicacion: restauranteData.ubicacion,
                imagen: imagenBase64  // Imagen en Base64 o null
            });

            // Aprueba el restaurante para que sea visible para todos los usuarios
            // Por defecto los restaurantes se crean sin aprobar
            await aprobarRestaurante(restaurante._id.toString());
            // Actualiza el objeto local para reflejar el cambio
            restaurante.aprobado = true;

            // Crea los platos asociados al restaurante
            const platosCreados = [];
            // Itera sobre cada plato definido para este restaurante
            for (const platoData of restauranteData.platos) {
                try {
                    // Convierte la imagen del plato de URL a Base64 si es necesario
                    let imagenBase64 = null;
                    // Si la imagen es una URL HTTP/HTTPS, la descarga y convierte
                    if (platoData.imagen && platoData.imagen.startsWith('http')) {
                        console.log(`   📸 Procesando imagen para plato: ${platoData.nombre}`);
                        imagenBase64 = await convertirImagenABase64(platoData.imagen);
                        // Si falla la conversión, usa null (el plato se crea sin imagen)
                        if (!imagenBase64) {
                            console.log(`   ⚠️  No se pudo cargar imagen para plato ${platoData.nombre}, continuando sin imagen`);
                        } else {
                            console.log(`   ✅ Imagen cargada exitosamente para plato: ${platoData.nombre}`);
                        }
                    } else if (platoData.imagen && platoData.imagen.startsWith('data:image')) {
                        // Si ya es Base64, lo usa directamente
                        imagenBase64 = platoData.imagen;
                        console.log(`   ✅ Imagen Base64 existente para plato: ${platoData.nombre}`);
                    } else if (platoData.imagen) {
                        // Si tiene imagen pero formato no reconocido, muestra advertencia
                        console.log(`   ⚠️  Formato de imagen no reconocido para plato ${platoData.nombre}`);
                    }

                    // Crea el plato usando el modelo
                    const plato = await crearPlato({
                        nombre: platoData.nombre,
                        descripcion: platoData.descripcion,
                        restauranteId: restaurante._id.toString(),  // ID del restaurante al que pertenece
                        precio: platoData.precio,
                        imagen: imagenBase64  // Imagen en Base64 o null
                    });
                    // Agrega el plato creado al array
                    platosCreados.push(plato);
                } catch (error) {
                    // Si hay error al crear un plato, lo muestra pero continúa con los demás
                    console.error(`❌ Error al crear plato ${platoData.nombre}:`, error.message);
                }
            }

            // Agrega el restaurante con sus platos al array de resultados
            restaurantesCreados.push({ restaurante, platos: platosCreados });
            // Mensaje de éxito indicando cuántos platos se crearon
            console.log(`✅ Restaurante creado: ${restaurante.nombre} con ${platosCreados.length} platos`);
        } catch (error) {
            // Manejo de errores al crear restaurante
            if (error.message.includes('ya existe')) {
                console.log(`⚠️  Restaurante ya existe: ${restauranteData.nombre}`);
            } else {
                console.error(`❌ Error al crear restaurante ${restauranteData.nombre}:`, error.message);
            }
        }
    }

    // Retorna el array con todos los restaurantes creados (cada uno con sus platos)
    return restaurantesCreados;
}

/**
 * Crear reseñas de ejemplo
 */
// Función que crea reseñas aleatorias para los restaurantes
// @param {Array} restaurantes - Array de restaurantes creados previamente
// @param {Array} usuarios - Array de usuarios creados previamente
async function seedReseñas(restaurantes, usuarios) {
    // Define un array con comentarios de ejemplo que se seleccionarán aleatoriamente
    const comentarios = [
        'Excelente comida y servicio. Definitivamente volveré.',
        'Muy buen restaurante, los platos son deliciosos.',
        'Ambiente agradable y comida de calidad.',
        'Recomendado! La mejor experiencia gastronómica.',
        'Buen precio y excelente calidad.',
        'La comida estaba deliciosa, pero el servicio puede mejorar.',
        'Perfecto para una cena romántica.',
        'Muy recomendado, platos exquisitos.',
        'El mejor restaurante de la zona.',
        'Comida auténtica y sabrosa.'
    ];

    // Array para almacenar las reseñas creadas
    const reseñasCreadas = [];
    // Obtiene la instancia de la base de datos
    const db = obtenerBD();

    // Itera sobre cada restaurante para crearle reseñas
    for (const { restaurante } of restaurantes) {
        // Genera un número aleatorio de reseñas entre 2 y 4 por restaurante
        const numReseñas = Math.floor(Math.random() * 3) + 2;
        
        // Crea el número determinado de reseñas para este restaurante
        for (let i = 0; i < numReseñas && i < usuarios.length; i++) {
            // Selecciona un usuario (empezando desde el segundo, que no es admin)
            // Esto evita que el admin haga reseñas
            const usuario = usuarios[i + 1]; // Empezar desde el segundo usuario (no admin)
            if (!usuario) break;  // Si no hay más usuarios, termina el bucle

            // Genera una calificación aleatoria entre 4 y 5 (solo calificaciones positivas)
            const calificacion = Math.floor(Math.random() * 2) + 4; // 4 o 5
            // Selecciona un comentario aleatorio del array
            const comentario = comentarios[Math.floor(Math.random() * comentarios.length)];

            try {
                // Crea la reseña usando el modelo
                // Se pasa null como segundo parámetro porque MongoDB standalone no soporta transacciones
                const reseña = await crearReseña({
                    comentario,  // Comentario de la reseña
                    calificacion,  // Calificación (4 o 5)
                    restauranteId: restaurante._id.toString(),  // ID del restaurante
                    usuarioId: usuario._id.toString()  // ID del usuario que hace la reseña
                }, null);

                // Actualiza el promedio de calificaciones del restaurante manualmente
                // Esto es necesario porque se crea sin transacción
                // Busca todas las reseñas del restaurante
                const reseñasDelRestaurante = await db.collection('reseñas').find(
                    { restauranteId: convertirAObjectId(restaurante._id.toString()) }
                ).toArray();
                
                // Si hay reseñas, calcula el promedio
                if (reseñasDelRestaurante.length > 0) {
                    // Suma todas las calificaciones y divide por el total
                    const promedio = reseñasDelRestaurante.reduce((sum, r) => sum + r.calificacion, 0) / reseñasDelRestaurante.length;
                    // Actualiza el promedio en el restaurante
                    await actualizarCalificacionPromedio(
                        restaurante._id.toString(),
                        promedio,  // Promedio calculado
                        reseñasDelRestaurante.length  // Total de reseñas
                    );
                }
                
                // Agrega la reseña creada al array de resultados
                reseñasCreadas.push(reseña);
                
                // Actualiza el ranking del restaurante después de cada reseña
                // El ranking se calcula basándose en el promedio y otras métricas
                await actualizarRankingRestaurante(restaurante._id.toString());
                
                // Mensaje de éxito
                console.log(`✅ Reseña creada para ${restaurante.nombre} por ${usuario.nombre}`);
            } catch (error) {
                // Manejo de errores: si el usuario ya hizo una reseña para este restaurante
                if (error.message.includes('Ya has creado')) {
                    // Ignora el error (un usuario solo puede hacer una reseña por restaurante)
                } else {
                    // Muestra otros tipos de errores
                    console.error(`❌ Error al crear reseña:`, error.message);
                }
            }
        }
    }

    // Retorna el array con todas las reseñas creadas
    return reseñasCreadas;
}

/**
 * Función principal
 */
// Función principal que orquesta todo el proceso de seed
// Ejecuta las funciones en orden: limpiar BD, crear categorías, usuarios, restaurantes y reseñas
async function main() {
    try {
        // Mensaje inicial indicando que se inicia el proceso de seed
        console.log('🌱 Iniciando seed de base de datos...\n');

        // Conecta a la base de datos MongoDB usando la configuración del archivo .env
        await conectarBD();
        console.log('✅ Conectado a la base de datos\n');

        // Limpia la base de datos primero para empezar con datos frescos
        // Esto elimina todos los documentos existentes de todas las colecciones
        console.log('🧹 Limpiando base de datos...');
        await limpiarBD();
        console.log('✅ Base de datos limpiada\n');

        // Crea las categorías de restaurantes (Italiana, Mexicana, Japonesa, etc.)
        console.log('📁 Creando categorías...');
        const categorias = await seedCategorias();
        console.log(`✅ ${categorias.length} categorías creadas\n`);

        // Crea los usuarios de ejemplo (incluyendo un administrador)
        console.log('👥 Creando usuarios...');
        const usuarios = await seedUsuarios();
        // Busca el usuario administrador en el array de usuarios creados
        // Si no encuentra uno con rol admin, usa el primer usuario como fallback
        const admin = usuarios.find(u => u.rol === 'admin') || usuarios[0];
        console.log(`✅ ${usuarios.length} usuarios creados\n`);

        // Crea los restaurantes con sus platos
        // También convierte las imágenes de URL a Base64 durante este proceso
        console.log('🍽️  Creando restaurantes (convirtiendo imágenes a Base64)...');
        const restaurantes = await seedRestaurantes(categorias, admin._id.toString());
        console.log(`✅ ${restaurantes.length} restaurantes creados con imágenes en Base64\n`);

        // Crea reseñas aleatorias para los restaurantes
        console.log('⭐ Creando reseñas...');
        const reseñas = await seedReseñas(restaurantes, usuarios);
        console.log(`✅ ${reseñas.length} reseñas creadas\n`);

        // Mensaje final de éxito
        console.log('✨ Seed completado exitosamente!');
        // Muestra un resumen de todo lo creado
        console.log('\n📊 Resumen:');
        console.log(`   - ${categorias.length} categorías`);
        console.log(`   - ${usuarios.length} usuarios`);
        console.log(`   - ${restaurantes.length} restaurantes`);
        // Calcula el total de platos sumando los platos de todos los restaurantes
        console.log(`   - ${restaurantes.reduce((sum, r) => sum + r.platos.length, 0)} platos`);
        console.log(`   - ${reseñas.length} reseñas`);
        // Muestra las credenciales de prueba para facilitar el testing
        console.log('\n💡 Credenciales de prueba:');
        console.log('   Admin: admin@foodierank.com / admin123');
        console.log('   Usuario: juan@example.com / password123');

        // Sale del proceso con código de éxito (0)
        process.exit(0);
    } catch (error) {
        // Captura cualquier error que ocurra durante el proceso
        console.error('❌ Error en el seed:', error);
        // Sale del proceso con código de error (1)
        process.exit(1);
    }
}

// Ejecuta la función principal al correr el script
main();

