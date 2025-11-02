/**
 * Script de Seed para poblar la base de datos con datos de ejemplo
 * Ejecutar con: node src/scripts/seed.js
 */

import { conectarBD, obtenerBD } from '../config/db.js';
import { crearCategoria } from '../models/categoria.model.js';
import { crearRestaurante, aprobarRestaurante } from '../models/restaurante.model.js';
import { crearPlato } from '../models/plato.model.js';
import { crearUsuario } from '../models/usuario.model.js';
import { crearReseña } from '../models/reseña.model.js';
import { actualizarCalificacionPromedio } from '../models/restaurante.model.js';
import { actualizarRankingRestaurante } from '../services/ranking.service.js';
import { ObjectId } from 'mongodb';
import { convertirAObjectId } from '../utils/helpers.js';
import https from 'https';
import http from 'http';
import { URL } from 'url';
import 'dotenv/config';

/**
 * Convertir URL de imagen a Base64
 * Usa módulos nativos de Node.js para soportar cualquier URL
 * @param {string} imageUrl - URL de la imagen
 * @returns {Promise<string|null>} - Base64 string o null si falla
 */
async function convertirImagenABase64(imageUrl) {
    return new Promise((resolve) => {
        try {
            console.log(`📥 Descargando imagen: ${imageUrl}`);
            
            // Parsear la URL
            const url = new URL(imageUrl);
            const protocol = url.protocol === 'https:' ? https : http;
            
            // Opciones de la petición
            const options = {
                hostname: url.hostname,
                port: url.port || (url.protocol === 'https:' ? 443 : 80),
                path: url.pathname + url.search,
                method: 'GET',
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
                    'Accept': 'image/*,*/*',
                    'Accept-Language': 'en-US,en;q=0.9',
                    'Cache-Control': 'no-cache',
                    'Connection': 'keep-alive'
                },
                timeout: 30000 // 30 segundos
            };

            const req = protocol.request(options, (res) => {
                // Manejar redirecciones (301, 302, 303, 307, 308)
                if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
                    const redirectUrl = res.headers.location.startsWith('http') 
                        ? res.headers.location 
                        : `${url.protocol}//${url.hostname}${res.headers.location}`;
                    console.log(`   ↪ Redirigiendo a: ${redirectUrl}`);
                    req.destroy();
                    // Llamar recursivamente con la nueva URL
                    convertirImagenABase64(redirectUrl).then(resolve).catch(() => resolve(null));
                    return;
                }

                // Verificar status code
                if (res.statusCode < 200 || res.statusCode >= 300) {
                    console.error(`   ❌ Error HTTP ${res.statusCode} al descargar imagen`);
                    resolve(null);
                    return;
                }

                // Obtener content type
                const contentType = res.headers['content-type'] || 'image/jpeg';
                
                // Acumular datos
                const chunks = [];
                let totalLength = 0;
                const maxSize = 10 * 1024 * 1024; // 10MB máximo

                res.on('data', (chunk) => {
                    totalLength += chunk.length;
                    if (totalLength > maxSize) {
                        console.error(`   ❌ Imagen demasiado grande (>10MB)`);
                        req.destroy();
                        resolve(null);
                        return;
                    }
                    chunks.push(chunk);
                });

                res.on('end', () => {
                    try {
                        if (chunks.length === 0) {
                            console.error(`   ❌ No se recibieron datos de la imagen`);
                            resolve(null);
                            return;
                        }
                        const buffer = Buffer.concat(chunks);
                        const base64 = buffer.toString('base64');
                        const base64String = `data:${contentType};base64,${base64}`;
                        
                        const sizeKB = Math.round(base64String.length / 1024);
                        console.log(`   ✅ Imagen convertida a Base64 (${sizeKB}KB)`);
                        resolve(base64String);
                    } catch (error) {
                        console.error(`   ❌ Error al convertir a Base64:`, error.message);
                        resolve(null);
                    }
                });

                res.on('error', (error) => {
                    console.error(`   ❌ Error en la respuesta:`, error.message);
                    resolve(null);
                });
            });

            req.on('error', (error) => {
                console.error(`   ❌ Error al descargar imagen:`, error.message);
                resolve(null);
            });

            req.on('timeout', () => {
                console.error(`   ❌ Timeout al descargar imagen (30s)`);
                req.destroy();
                resolve(null);
            });

            req.setTimeout(30000);
            req.end();

        } catch (error) {
            console.error(`❌ Error al procesar URL ${imageUrl}:`, error.message);
            resolve(null);
        }
    });
}

/**
 * Limpiar base de datos (opcional - solo en desarrollo)
 */
async function limpiarBD() {
    const db = obtenerBD();
    await db.collection('categorias').deleteMany({});
    await db.collection('restaurantes').deleteMany({});
    await db.collection('platos').deleteMany({});
    await db.collection('usuarios').deleteMany({});
    await db.collection('reseñas').deleteMany({});
    console.log('✅ Base de datos limpiada');
}

/**
 * Crear categorías
 */
async function seedCategorias() {
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

    const categoriasCreadas = [];
    const db = obtenerBD();
    
    for (const categoriaData of categorias) {
        try {
            // Primero verificar si ya existe
            const existente = await db.collection('categorias').findOne({ nombre: categoriaData.nombre });
            if (existente) {
                console.log(`⚠️  Categoría ya existe: ${categoriaData.nombre}`);
                categoriasCreadas.push(existente);
                continue;
            }
            
            const categoria = await crearCategoria(categoriaData);
            categoriasCreadas.push(categoria);
            console.log(`✅ Categoría creada: ${categoria.nombre}`);
        } catch (error) {
            if (error.message.includes('ya existe')) {
                console.log(`⚠️  Categoría ya existe: ${categoriaData.nombre}`);
                // Buscar la categoría existente
                const existente = await db.collection('categorias').findOne({ nombre: categoriaData.nombre });
                if (existente) categoriasCreadas.push(existente);
            } else {
                console.error(`❌ Error al crear categoría ${categoriaData.nombre}:`, error.message);
            }
        }
    }

    return categoriasCreadas;
}

/**
 * Crear usuarios
 */
async function seedUsuarios() {
    const usuarios = [
        {
            nombre: 'Admin User',
            email: 'admin@foodierank.com',
            password: 'admin123',
            esAdmin: true
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

    const usuariosCreados = [];
    const db = obtenerBD();
    
    for (const usuarioData of usuarios) {
        try {
            const usuario = await crearUsuario({
                nombre: usuarioData.nombre,
                email: usuarioData.email,
                password: usuarioData.password
            });

            // Si es admin, actualizar el rol
            if (usuarioData.esAdmin) {
                await db.collection('usuarios').updateOne(
                    { _id: usuario._id },
                    { $set: { rol: 'admin' } }
                );
                usuario.rol = 'admin';
            }

            usuariosCreados.push(usuario);
            console.log(`✅ Usuario creado: ${usuario.nombre} (${usuario.email})`);
        } catch (error) {
            if (error.message.includes('ya está registrado')) {
                console.log(`⚠️  Usuario ya existe: ${usuarioData.email}`);
                const existente = await db.collection('usuarios').findOne({ email: usuarioData.email });
                if (existente) usuariosCreados.push(existente);
            } else {
                console.error(`❌ Error al crear usuario ${usuarioData.email}:`, error.message);
            }
        }
    }

    return usuariosCreados;
}

/**
 * Crear restaurantes
 */
async function seedRestaurantes(categorias, adminId) {
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

    const restaurantesCreados = [];
    
    for (const restauranteData of restaurantes) {
        try {
            // Buscar la categoría correspondiente
            const categoria = categorias.find(c => c.nombre === restauranteData.categoria);
            if (!categoria) {
                console.log(`⚠️  Categoría no encontrada: ${restauranteData.categoria}`);
                continue;
            }

            // Convertir imagen URL a Base64 si existe
            let imagenBase64 = null;
            if (restauranteData.imagen && restauranteData.imagen.startsWith('http')) {
                imagenBase64 = await convertirImagenABase64(restauranteData.imagen);
                // Si falla la conversión, usar null (sin imagen)
                if (!imagenBase64) {
                    console.log(`⚠️  No se pudo cargar imagen para ${restauranteData.nombre}, continuando sin imagen`);
                }
            } else if (restauranteData.imagen && restauranteData.imagen.startsWith('data:image')) {
                // Ya es Base64
                imagenBase64 = restauranteData.imagen;
            }

            // Crear restaurante
            const restaurante = await crearRestaurante({
                nombre: restauranteData.nombre,
                descripcion: restauranteData.descripcion,
                categoriaId: categoria._id.toString(),
                ubicacion: restauranteData.ubicacion,
                imagen: imagenBase64
            });

            // Aprobar restaurante
            await aprobarRestaurante(restaurante._id.toString());
            restaurante.aprobado = true;

            // Crear platos
            const platosCreados = [];
            for (const platoData of restauranteData.platos) {
                try {
                    // Convertir imagen URL a Base64 si existe
                    let imagenBase64 = null;
                    if (platoData.imagen && platoData.imagen.startsWith('http')) {
                        console.log(`   📸 Procesando imagen para plato: ${platoData.nombre}`);
                        imagenBase64 = await convertirImagenABase64(platoData.imagen);
                        // Si falla la conversión, usar null (sin imagen)
                        if (!imagenBase64) {
                            console.log(`   ⚠️  No se pudo cargar imagen para plato ${platoData.nombre}, continuando sin imagen`);
                        } else {
                            console.log(`   ✅ Imagen cargada exitosamente para plato: ${platoData.nombre}`);
                        }
                    } else if (platoData.imagen && platoData.imagen.startsWith('data:image')) {
                        // Ya es Base64
                        imagenBase64 = platoData.imagen;
                        console.log(`   ✅ Imagen Base64 existente para plato: ${platoData.nombre}`);
                    } else if (platoData.imagen) {
                        console.log(`   ⚠️  Formato de imagen no reconocido para plato ${platoData.nombre}`);
                    }

                    const plato = await crearPlato({
                        nombre: platoData.nombre,
                        descripcion: platoData.descripcion,
                        restauranteId: restaurante._id.toString(),
                        precio: platoData.precio,
                        imagen: imagenBase64
                    });
                    platosCreados.push(plato);
                } catch (error) {
                    console.error(`❌ Error al crear plato ${platoData.nombre}:`, error.message);
                }
            }

            restaurantesCreados.push({ restaurante, platos: platosCreados });
            console.log(`✅ Restaurante creado: ${restaurante.nombre} con ${platosCreados.length} platos`);
        } catch (error) {
            if (error.message.includes('ya existe')) {
                console.log(`⚠️  Restaurante ya existe: ${restauranteData.nombre}`);
            } else {
                console.error(`❌ Error al crear restaurante ${restauranteData.nombre}:`, error.message);
            }
        }
    }

    return restaurantesCreados;
}

/**
 * Crear reseñas de ejemplo
 */
async function seedReseñas(restaurantes, usuarios) {
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

    const reseñasCreadas = [];
    const db = obtenerBD();

    // Crear algunas reseñas para cada restaurante
    for (const { restaurante } of restaurantes) {
        // Crear 2-4 reseñas por restaurante
        const numReseñas = Math.floor(Math.random() * 3) + 2;
        
        for (let i = 0; i < numReseñas && i < usuarios.length; i++) {
            const usuario = usuarios[i + 1]; // Empezar desde el segundo usuario (no admin)
            if (!usuario) break;

            const calificacion = Math.floor(Math.random() * 2) + 4; // 4 o 5
            const comentario = comentarios[Math.floor(Math.random() * comentarios.length)];

            try {
                // Crear reseña sin transacción (MongoDB standalone no soporta transacciones)
                const reseña = await crearReseña({
                    comentario,
                    calificacion,
                    restauranteId: restaurante._id.toString(),
                    usuarioId: usuario._id.toString()
                }, null);

                // Actualizar calificación promedio manualmente
                const reseñasDelRestaurante = await db.collection('reseñas').find(
                    { restauranteId: convertirAObjectId(restaurante._id.toString()) }
                ).toArray();
                
                if (reseñasDelRestaurante.length > 0) {
                    const promedio = reseñasDelRestaurante.reduce((sum, r) => sum + r.calificacion, 0) / reseñasDelRestaurante.length;
                    await actualizarCalificacionPromedio(
                        restaurante._id.toString(),
                        promedio,
                        reseñasDelRestaurante.length
                    );
                }
                
                reseñasCreadas.push(reseña);
                
                // Actualizar ranking después de cada reseña
                await actualizarRankingRestaurante(restaurante._id.toString());
                
                console.log(`✅ Reseña creada para ${restaurante.nombre} por ${usuario.nombre}`);
            } catch (error) {
                if (error.message.includes('Ya has creado')) {
                    // Ignorar si el usuario ya hizo reseña
                } else {
                    console.error(`❌ Error al crear reseña:`, error.message);
                }
            }
        }
    }

    return reseñasCreadas;
}

/**
 * Función principal
 */
async function main() {
    try {
        console.log('🌱 Iniciando seed de base de datos...\n');

        // Conectar a la base de datos
        await conectarBD();
        console.log('✅ Conectado a la base de datos\n');

        // Limpiar base de datos primero
        console.log('🧹 Limpiando base de datos...');
        await limpiarBD();
        console.log('✅ Base de datos limpiada\n');

        // Crear categorías
        console.log('📁 Creando categorías...');
        const categorias = await seedCategorias();
        console.log(`✅ ${categorias.length} categorías creadas\n`);

        // Crear usuarios
        console.log('👥 Creando usuarios...');
        const usuarios = await seedUsuarios();
        const admin = usuarios.find(u => u.rol === 'admin') || usuarios[0];
        console.log(`✅ ${usuarios.length} usuarios creados\n`);

        // Crear restaurantes
        console.log('🍽️  Creando restaurantes (convirtiendo imágenes a Base64)...');
        const restaurantes = await seedRestaurantes(categorias, admin._id.toString());
        console.log(`✅ ${restaurantes.length} restaurantes creados con imágenes en Base64\n`);

        // Crear reseñas
        console.log('⭐ Creando reseñas...');
        const reseñas = await seedReseñas(restaurantes, usuarios);
        console.log(`✅ ${reseñas.length} reseñas creadas\n`);

        console.log('✨ Seed completado exitosamente!');
        console.log('\n📊 Resumen:');
        console.log(`   - ${categorias.length} categorías`);
        console.log(`   - ${usuarios.length} usuarios`);
        console.log(`   - ${restaurantes.length} restaurantes`);
        console.log(`   - ${restaurantes.reduce((sum, r) => sum + r.platos.length, 0)} platos`);
        console.log(`   - ${reseñas.length} reseñas`);
        console.log('\n💡 Credenciales de prueba:');
        console.log('   Admin: admin@foodierank.com / admin123');
        console.log('   Usuario: juan@example.com / password123');

        process.exit(0);
    } catch (error) {
        console.error('❌ Error en el seed:', error);
        process.exit(1);
    }
}

// Ejecutar
main();

