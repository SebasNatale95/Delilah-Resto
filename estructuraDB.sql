-- Estructura de la tabla "usuarios"
CREATE TABLE usuarios (
    User_ID INT PRIMARY KEY AUTO_INCREMENT,
    nombreUser VARCHAR (255) NOT NULL,
    NombreCompleto VARCHAR (255) NOT NULL,
    Email VARCHAR (255) UNIQUE NOT NULL,
    Telefono INT UNIQUE NOT NULL,
    Direccion VARCHAR (255) NOT NULL,
    password VARCHAR (255) UNIQUE NOT NULL,
    Admin VARCHAR (10) NOT NULL,
    Platos_Favoritos TEXT
);

-- Estructura de la tabla "ordenes"
CREATE TABLE ordenes (
    order_id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT,
    estado VARCHAR(255) NOT NUll,
    hora VARCHAR(255) NOT NULL,
    descripcion VARCHAR(255) NOT NULL,
    precio INT UNSIGNED NOT NULL,
    metodoPago VARCHAR(50) NOT NULL,
    FOREIGN KEY (user_id) REFERENCES usuarios(user_id)
);

-- Estructura de la tabla "productos"
CREATE TABLE productos (
    Product_ID INT PRIMARY KEY AUTO_INCREMENT,
    Nombre VARCHAR(255) UNIQUE NOT NULL,
    Precio INT NOT NULL,
    link_foto VARCHAR(255) UNIQUE
);

-- Estructura de la tabla "productosPorOrden"
CREATE TABLE ordenes_productos (
    manyToManyID INT PRIMARY KEY AUTO_INCREMENT,
    order_id INT,
    product_id INT,
    FOREIGN KEY (order_id) REFERENCES ordenes(order_id),
    FOREIGN KEY (product_id) REFERENCES productos(product_id),
    cantidadProducto INT UNSIGNED NOT NULL,
    metodoPago VARCHAR(50) NOT NULL
);
