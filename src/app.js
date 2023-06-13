// Importar las dependencias
const express = require('express');
const http = require('http');
const socketIO = require('socket.io');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');
const path = require('path');

// Crear la instancia de Express
const app = express();
const server = http.createServer(app);
const io = socketIO(server);

// Configurar el motor de plantillas Handlebars
app.set('view engine', 'handlebars');
app.set('views', path.join(__dirname, 'views'));
app.engine('handlebars', require('express-handlebars')());

// Middleware para el manejo de datos en formato JSON
app.use(express.json());

// Rutas de productos
const productsRouter = express.Router();

// Ruta raíz GET /products
productsRouter.get('/', (req, res) => {
  const limit = req.query.limit;
  fs.readFile('productos.json', 'utf8', (err, data) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ error: 'Error interno del servidor' });
    }

    let products = JSON.parse(data);

    if (limit) {
      products = products.slice(0, limit);
    }

    res.json(products);
  });
});

// Ruta GET /products/:pid
productsRouter.get('/:pid', (req, res) => {
  const pid = req.params.pid;
  fs.readFile('productos.json', 'utf8', (err, data) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ error: 'Error interno del servidor' });
    }

    const products = JSON.parse(data);
    const product = products.find((p) => p.id === pid);

    if (!product) {
      return res.status(404).json({ error: 'Producto no encontrado' });
    }

    res.json(product);
  });
});

// Ruta POST /products
productsRouter.post('/', (req, res) => {
  const { title, description, code, price, stock, category, thumbnails } = req.body;
  const id = uuidv4();
  const newProduct = {
    id,
    title,
    description,
    code,
    price,
    status: true,
    stock,
    category,
    thumbnails,
  };

  fs.readFile('productos.json', 'utf8', (err, data) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ error: 'Error interno del servidor' });
    }

    const products = JSON.parse(data);
    products.push(newProduct);

    fs.writeFile('productos.json', JSON.stringify(products), (err) => {
      if (err) {
        console.error(err);
        return res.status(500).json({ error: 'Error interno del servidor' });
      }

      res.json(newProduct);
    });
  });
});

// Ruta PUT /products/:pid
productsRouter.put('/:pid', (req, res) => {
  const pid = req.params.pid;
  const updatedFields = req.body;

  fs.readFile('productos.json', 'utf8', (err, data) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ error: 'Error interno del servidor' });
    }

    const products = JSON.parse(data);
    const product = products.find((p) => p.id === pid);

    if (!product) {
      return res.status(404).json({ error: 'Producto no encontrado' });
    }

    Object.assign(product, updatedFields);

    fs.writeFile('productos.json', JSON.stringify(products), (err) => {
      if (err) {
        console.error(err);
        return res.status(500).json({ error: 'Error interno del servidor' });
      }

      res.json(product);
    });
  });
});

// Ruta DELETE /products/:pid
productsRouter.delete('/:pid', (req, res) => {
  const pid = req.params.pid;

  fs.readFile('productos.json', 'utf8', (err, data) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ error: 'Error interno del servidor' });
    }

    let products = JSON.parse(data);
    const productIndex = products.findIndex((p) => p.id === pid);

    if (productIndex === -1) {
      return res.status(404).json({ error: 'Producto no encontrado' });
    }

    const deletedProduct = products.splice(productIndex, 1)[0];

    fs.writeFile('productos.json', JSON.stringify(products), (err) => {
      if (err) {
        console.error(err);
        return res.status(500).json({ error: 'Error interno del servidor' });
      }

      res.json(deletedProduct);
    });
  });
});

app.use('/api/products', productsRouter);

// Rutas de carritos
const cartsRouter = express.Router();

// Ruta POST /carts
cartsRouter.post('/', (req, res) => {
  const newCart = {
    id: uuidv4(),
    products: [],
  };

  fs.readFile('carrito.json', 'utf8', (err, data) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ error: 'Error interno del servidor' });
    }

    const carts = JSON.parse(data);
    carts.push(newCart);

    fs.writeFile('carrito.json', JSON.stringify(carts), (err) => {
      if (err) {
        console.error(err);
        return res.status(500).json({ error: 'Error interno del servidor' });
      }

      res.json(newCart);
    });
  });
});

// Ruta GET /carts/:cid
cartsRouter.get('/:cid', (req, res) => {
  const cid = req.params.cid;

  fs.readFile('carrito.json', 'utf8', (err, data) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ error: 'Error interno del servidor' });
    }

    const carts = JSON.parse(data);
    const cart = carts.find((c) => c.id === cid);

    if (!cart) {
      return res.status(404).json({ error: 'Carrito no encontrado' });
    }

    res.json(cart);
  });
});

// Ruta POST /carts/:cid/product/:pid
cartsRouter.post('/:cid/product/:pid', (req, res) => {
  const cid = req.params.cid;
  const pid = req.params.pid;
  const quantity = req.body.quantity;

  fs.readFile('carrito.json', 'utf8', (err, data) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ error: 'Error interno del servidor' });
    }

    const carts = JSON.parse(data);
    const cart = carts.find((c) => c.id === cid);

    if (!cart) {
      return res.status(404).json({ error: 'Carrito no encontrado' });
    }

    const productIndex = cart.products.findIndex((p) => p.product === pid);

    if (productIndex !== -1) {
      // El producto ya existe en el carrito, incrementar la cantidad
      cart.products[productIndex].quantity += quantity;
    } else {
      // Agregar el producto al carrito
      cart.products.push({ product: pid, quantity });
    }

    fs.writeFile('carrito.json', JSON.stringify(carts), (err) => {
      if (err) {
        console.error(err);
        return res.status(500).json({ error: 'Error interno del servidor' });
      }

      res.json(cart);
    });
  });
});

app.use('/api/carts', cartsRouter);

// Ruta raíz
app.get('/', (req, res) => {
  res.render('index');
});

// Ruta /realtimeproducts
app.get('/realtimeproducts', (req, res) => {
  res.render('realTimeProducts');
});

// Conexión con el cliente por Websockets
io.on('connection', (socket) => {
  console.log('Cliente conectado');

  // Emitir la lista de productos al cliente cuando se conecte
  fs.readFile('productos.json', 'utf8', (err, data) => {
    if (err) {
      console.error(err);
      return;
    }

    const products = JSON.parse(data);
    socket.emit('products', products);
  });

  // Escuchar eventos desde el cliente
  socket.on('createProduct', (newProduct) => {
    fs.readFile('productos.json', 'utf8', (err, data) => {
      if (err) {
        console.error(err);
        return;
      }

      const products = JSON.parse(data);
      products.push(newProduct);

      fs.writeFile('productos.json', JSON.stringify(products), (err) => {
        if (err) {
          console.error(err);
          return;
        }

        // Emitir la lista actualizada de productos a todos los clientes
        io.emit('products', products);
      });
    });
  });

  socket.on('deleteProduct', (productId) => {
    fs.readFile('productos.json', 'utf8', (err, data) => {
      if (err) {
        console.error(err);
        return;
      }

      const products = JSON.parse(data);
      const productIndex = products.findIndex((p) => p.id === productId);

      if (productIndex !== -1) {
        products.splice(productIndex, 1);

        fs.writeFile('productos.json', JSON.stringify(products), (err) => {
          if (err) {
            console.error(err);
            return;
          }

          // Emitir la lista actualizada de productos a todos los clientes
          io.emit('products', products);
        });
      }
    });
  });
});

// Iniciar el servidor
const port = 8080;
server.listen(port, () => {
  console.log(`Servidor escuchando en el puerto ${port}`);
});
