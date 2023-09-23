# Delilah-Resto
**Una API para el manejo de restaurantes.**

Este proyecto consiste en una API RESTful basada en Node.JS y MySQL para la administracion de restaurantes online que permite que usuarios regulares puedan crear una cuenta, ver distintos productos, tener platos favoritos y crear ordenes, mientras los usuarios administradores controlan accesos y manejo de operaciones CRUD en cuanto a ordenes, usuarios y productos.

# Primeros pasos
**Clonar la repo.**
````
git clone https://github.com/SebasNatale/Delilah-Resto
````
_La base de datos está alojada en remotemysql.com y el acceso a la misma ya está incluido en la API. No es necesario construirla desde cero!_

[Queries para crear las tablas](/estructuraDB.sql)

**Instalar las dependencias.**
````
npm install
````

**Ejecutar la API**
````
node index
````

_El dominio de la API es "localhost:3000"_

# Especificacion de la API
[Documento](/spec.yaml)

**Indicaciónes especiales!**

- Al registrar un usuario nuevo, esta API pedirá un booleano para la key "admin". Esto es unicamente con propositos demonstrativos y no representa el comportamiento indicado en un entorno de produccion.

- Al enviar el token, NO usar la keyword "bearer" en el valor del header "Authorization".
