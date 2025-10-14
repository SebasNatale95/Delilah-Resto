//--------------------------------------------------------- DEPENDENCIAS 'N STUFF

const express = require("express");
const parser = require("body-parser");
const cors = require("cors");
const sequelize = require("sequelize");
const jwt = require("jsonwebtoken");
const key = require("./shh");

const server = express();
server.use(cors());
server.use(parser.json());
server.listen(3000, () => console.log("Servidor iniciado!"));
const sql = new sequelize("mysql://blahblahblah.etc");
sql.authenticate().then(() => console.log("DB conectada!"));

//--------------------------------------------------------- MIDDLEWARES Y FUNCIONES

//Para autenticar roles de usuario administrador
function adminAuth(req, res, next) {
    var token = req.headers.authorization
    if (!token) {
        res.status(400).send("No se detectó token de autorizacion!")
    } else {
        var verificar = jwt.verify(token, key)
        var rol = verificar.admin
        if (rol === "false") {
            res.status(500).send("No tiene privilegios de administrador!")
        } else {
            return next()
        }
    }
};

//Para agregar productos a lista de ordenes
async function productSort(i) {
    var [product] = await sql.query(`
        SELECT productosPorOrden.product_id, productosPorOrden.cantidadProducto, productos.nombre, productos.precio
        FROM productosPorOrden
        JOIN productos
        ON productos.product_id = productosPorOrden.product_id
        WHERE productosPorOrden.order_id = "${i}"`)
    return product
};

//Para generar descripciones de los pedidos
async function orderInfo(product_id, cantidad, i) {
    var [nombre] = await sql.query(`SELECT nombre FROM productos WHERE product_id = "${product_id}"`)
    return `${cantidad}x ${nombre[0].nombre}`
};

//--------------------------------------------------------- ENDPOINTS
//----------------------- PRODUCTOS

//Obtener lista de productos
server.get("/productos", async function(req, res) {
    try {
        var token = req.headers.authorization
        jwt.verify(token, key)
        var [lista] = await sql.query("SELECT * FROM productos")
        res.status(200).json(lista)
    } catch (error) {
        res.status(401).send("Token no encontrado o expirado. Inicie sesion antes de continuar!")
    }
});

//Obtener producto por ID
server.get("/productos/:id", async function(req, res) {
    try {
        var token = req.headers.authorization
        jwt.verify(token, key)
        var [lista] = await sql.query(`SELECT * FROM productos WHERE product_id = "${req.params.id}"`)
        res.status(200).json(lista)
    } catch(error) {
        res.status(401).send("Token no encontrado o expirado. Inicie sesion antes de continuar!")
    }
});

//Crear items
server.post("/productos", adminAuth, async function(req, res) {
    var {nombre, precio, link_foto} = req.body
    try {
        await sql.query(`
            INSERT INTO productos (nombre, precio, link_foto) 
            VALUES ("${nombre}", "${precio}", "${link_foto}")`)
        var [id] = await sql.query("SELECT * FROM productos ORDER BY product_id DESC LIMIT 1")
        res.status(200).json(id)
    } catch(error) {
        res.status(400).send("Error en solicitud! Los datos solicitados son nombre, precio y link_foto!")
    }
});

//Editar item por ID
server.put("/productos/:id", adminAuth, async function(req, res) {
    var {nombre, precio, link_foto} = req.body
    async function edicion(llave, valor) {
        await sql.query(`UPDATE productos SET ${llave} = "${valor}" WHERE product_id = "${req.params.id}"`)
    }
    try {
        if (nombre) {
            edicion(Object.getOwnPropertyNames(req.body), nombre)
            var [actualizado] = await sql.query(`SELECT * FROM productos WHERE product_id = "${req.params.id}"`)
            res.status(200).json(actualizado)
        } else if (precio) {
            edicion(Object.getOwnPropertyNames(req.body), precio)
            var [actualizado] = await sql.query(`SELECT * FROM productos WHERE product_id = "${req.params.id}"`)
            res.status(200).json(actualizado)
        } else if (link_foto) {
            edicion(Object.getOwnPropertyNames(req.body), link_foto)
            var [actualizado] = await sql.query(`SELECT * FROM productos WHERE product_id = "${req.params.id}"`)
            res.status(200).json(actualizado)
        } else {
            res.status(404).send("No se encontraron datos para actualizar!")
        }
    } catch(error) {
        res.status(400).send("Solo se puede actualizar un dato a la vez!")
    }
});

//Borrar item por ID
server.delete("/productos/:id", adminAuth, async function(req, res) {
    try {
        await sql.query(`DELETE FROM productos WHERE product_id = "${req.params.id}"`)
        res.status(200).send("Producto eliminado!")
    } catch(error) {
        res.status(404).send("Item no encontrado!")
    }
});

//----------------------- USUARIOS

//Ver lista de usuarios
server.get("/usuarios", adminAuth, async function(req, res) {
    try {
        var [lista] = await sql.query("SELECT * FROM usuarios")
        res.status(200).json(lista)
    } catch(error) {
        res.status(500).send("I honestly don't know...")
    }
});

//Crear un nuevo usuario
server.post("/usuarios", async function(req, res) {
    var {nombreUser, nombreCompleto, email, telefono, direccion, password, admin} = req.body
    try {
        await sql.query(`
            INSERT INTO usuarios (nombreUser, nombreCompleto, email, telefono, direccion, password, admin) 
            VALUES ("${nombreUser}", "${nombreCompleto}", "${email}", "${telefono}", "${direccion}", "${password}", "${admin}")`)
        var [id] = await sql.query("SELECT user_id FROM usuarios ORDER BY user_id DESC LIMIT 1")
        res.status(200).json(id)
    } catch(error) {
        res.status(400).send("Error en el tipo de valor en algun registro! Los items solicitados son: nombreUser, nombreCompleto, email, telefono, direccion, password y admin!")
    }
});

//Iniciar sesion
server.post("/usuarios/login", async function(req, res) {
    var {nombreUser, password} = req.body
    var [comparacion] = await sql.query(`SELECT * FROM usuarios WHERE nombreUser = "${nombreUser}" AND password = "${password}"`)
    var isAdmin = comparacion[0].Admin
    if (comparacion.length == 0) {
        res.status(401).send("Credenciales incorrectas!")
    } else {
        var token = jwt.sign({usuario: nombreUser, admin: isAdmin}, key, {expiresIn: "60m"})
        res.status(200).send("Usuario autenticado! Token: " + token)
    }
});

//----------------------- PEDIDOS

//Ver lista de ordenes
server.get("/pedidos", adminAuth, async function(req, res) {
    try {
        var [orders] = await sql.query(`
                SELECT ordenes.*, usuarios.nombreUser, usuarios.direccion
                FROM ordenes
                JOIN usuarios
                ON ordenes.user_id = usuarios.user_id`)
        for(var i = 0; i < orders.length; i++) {
            orders[i].productos = await productSort(orders[i].order_id)
        }
        res.status(200).json(orders)
    } catch(error) {
        res.status(500).send("I honestly don't know...")
    }
});

//Crear una nueva orden
server.post("/pedidos", async function(req, res) {
    try {
        var token = req.headers.authorization
        var verificar = jwt.verify(token, key)
        var user = verificar.usuario
        var {productos, precio, metodoPago} = req.body
        var [userData] = await sql.query(`SELECT * FROM usuarios WHERE nombreUser = "${user}"`)
        if (userData.length == 0) {
            res.send("Error al autenticar usuario!")
        } else {
            var descripcion = []
            for(var i = 0; i < productos.length; i++) {
                descripcion[i] = await orderInfo(productos[i].product_id, productos[i].cantidad)
            }
            var [ordenID] = await sql.query(`
                INSERT INTO ordenes(user_id, hora, descripcion, precio, metodoPago)
                VALUES ("${userData[0].user_id}", "${new Date().toLocaleTimeString()}", "${descripcion.toString()}", "${precio}", "${metodoPago}")`)
            for(var i = 0; i < productos.length; i++) {
                await sql.query(`
                    INSERT INTO productosPorOrden(order_id, product_id, cantidadProducto, metodoPago)
                    VALUES ("${ordenID}", "${productos[i].product_id}", "${productos[i].cantidad}", "${metodoPago}")`)
            }
        }
        var [response] = await sql.query(`
            SELECT ordenes.order_id, ordenes.descripcion, ordenes.precio, ordenes.metodoPago, usuarios.nombreUser, usuarios.direccion
            FROM ordenes
            JOIN usuarios
            ON ordenes.user_id = usuarios.user_id
            WHERE ordenes.order_id = "${ordenID}"`)
        var [products] = await sql.query(`
            SELECT productosPorOrden.product_id, productosPorOrden.cantidadProducto, productos.nombre, productos.precio
            FROM productosPorOrden
            JOIN productos
            ON productosPorOrden.product_id = productos.product_id
            WHERE productosPorOrden.order_id = "${ordenID}"`)
        response[0].productos = products
        res.status(200).send(response[0])
    } catch(error) {
        res.status(401).send("Token no encontrado o expirado. Inicie sesion antes de continuar!")
    }
});

//Actualizar el estado de una orden
server.put("/pedidos/:id", adminAuth, async function(req, res) {
    var edit = req.body
    try {
        await sql.query(`UPDATE ordenes SET estado = "${edit.estado}" WHERE order_id = "${req.params.id}"`)
        var [respo] = await sql.query(`SELECT * FROM ordenes WHERE order_id = "${req.params.id}"`)
        res.status(200).json(respo)
    } catch(error) {
        res.status(500).send("I honestly don't know...")
    }
});

//Eliminar pedido
server.delete("/pedidos/:id", adminAuth, async function(req, res) {
    try {
        await sql.query(`DELETE FROM ordenes WHERE order_id = "${req.params.id}"`)
        res.status(200).send("Pedido eliminado!")
    } catch(error) {
        res.status(404).send("Pedido no encontrado!")
    }
});
