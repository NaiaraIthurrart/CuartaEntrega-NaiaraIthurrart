const express = require('express');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');

const app = express();
app.use(express.json());

const productsFilePath = './productos.json';
const cartsFilePath = './carrito.json';

class ProductManager {
  constructor(path) {
    this.path = path;
    if (!fs.existsSync(path)) {
      fs.writeFileSync(path, JSON.stringify([]));
    }
  }

  addProduct(product) {
    const { title, description, price, thumbnail, code, stock, category, thumbnails } = product;

    if (!title || !description || !price || !thumbnail || !code || !stock || !category || !thumbnails) {
      console.log("Error: Todos los campos son obligatorios");
      return;
    }

    const products = this.getProducts();
    if (products.some(p => p.code === code)) {
      console.log(`Error: El producto con código ${code} ya existe`);
      return;
    }

    const newProduct = {
      id: uuidv4(),
      title,
      description,
      price,
      thumbnail,
      code,
      stock,
      category,
      thumbnails
    };

    products.push(newProduct);
    fs.writeFileSync(this.path, JSON.stringify(products));
  }

  getProducts() {
    const data = fs.readFileSync(this.path, 'utf-8');
    return JSON.parse(data);
  }

  getProductById(id) {
    const products = this.getProducts();
    const product = products.find(p => p.id === id);
    if (product) {
      return product;
    } else {
      console.log("Error: Producto no encontrado");
      return null;
    }
  }

  updateProduct(id, fieldsToUpdate) {
    const products = this.getProducts();
    const productIndex = products.findIndex(p => p.id === id);
    if (productIndex === -1) {
      console.log("Error: Producto no encontrado");
      return;
    }

    const updatedProduct = {
      ...products[productIndex],
      ...fieldsToUpdate,
      id
    };
    products[productIndex] = updatedProduct;
    fs.writeFileSync(this.path, JSON.stringify(products));
  }

  deleteProduct(id) {
    const products = this.getProducts();
    const updatedProducts = products.filter(p => p.id !== id);
    if (products.length === updatedProducts.length) {
      console.log("Error: Producto no encontrado");
      return;
    }
    fs.writeFileSync(this.path, JSON.stringify(updatedProducts));
  }
}

const productManager = new ProductManager(productsFilePath);


app.get('/api/products', (req, res) => {
  const products = productManager.getProducts();
  res.json(products);
});

app.get('/api/products/:pid', (req, res) => {
  const { pid } = req.params;
  const product = productManager.getProductById(pid);
  if (product) {
    res.json(product);
  } else {
    res.status(404).json({ error: 'Producto no encontrado' });
  }
});

app.post('/api/products', (req, res) => {
  const product = req.body;
  productManager.addProduct(product);
  res.json(product);
});

app.put('/api/products/:pid', (req, res) => {
  const { pid } = req.params;
  const fieldsToUpdate = req.body;
  productManager.updateProduct
  productManager.updateProduct(pid, fieldsToUpdate);
  const updatedProduct = productManager.getProductById(pid);
  if (updatedProduct) {
    res.json(updatedProduct);
  } else {
    res.status(404).json({ error: 'Producto no encontrado' });
  }
});

app.delete('/api/products/:pid', (req, res) => {
  const { pid } = req.params;
  productManager.deleteProduct(pid);
  res.sendStatus(204);
});


class CartManager {
  constructor(path) {
    this.path = path;
    if (!fs.existsSync(path)) {
      fs.writeFileSync(path, JSON.stringify([]));
    }
  }

  createCart() {
    const newCart = {
      id: uuidv4(),
      products: []
    };

    const carts = this.getCarts();
    carts.push(newCart);
    fs.writeFileSync(this.path, JSON.stringify(carts));

    return newCart;
  }

  getCarts() {
    const data = fs.readFileSync(this.path, 'utf-8');
    return JSON.parse(data);
  }

  getCartById(id) {
    const carts = this.getCarts();
    const cart = carts.find(c => c.id === id);
    if (cart) {
      return cart;
    } else {
      console.log("Error: Carrito no encontrado");
      return null;
    }
  }

  updateCart(id, fieldsToUpdate) {
    const carts = this.getCarts();
    const cartIndex = carts.findIndex(c => c.id === id);
    if (cartIndex === -1) {
      console.log("Error: Carrito no encontrado");
      return;
    }

    const updatedCart = {
      ...carts[cartIndex],
      ...fieldsToUpdate,
      id
    };
    carts[cartIndex] = updatedCart;
    fs.writeFileSync(this.path, JSON.stringify(carts));
  }

  addProductToCart(cartId, productId, quantity) {
    const carts = this.getCarts();
    const cartIndex = carts.findIndex(c => c.id === cartId);
    if (cartIndex === -1) {
      console.log("Error: Carrito no encontrado");
      return;
    }

    const cart = carts[cartIndex];
    const productIndex = cart.products.findIndex(p => p.productId === productId);

    if (productIndex === -1) {
      cart.products.push({ productId, quantity });
    } else {
      cart.products[productIndex].quantity += quantity;
    }

    fs.writeFileSync(this.path, JSON.stringify(carts));
  }
}

const cartManager = new CartManager(cartsFilePath);


app.post('/api/carts', (req, res) => {
  const newCart = cartManager.createCart();
  res.json(newCart);
});

app.get('/api/carts/:cid', (req, res) => {
  const { cid } = req.params;
  const cart = cartManager.getCartById(cid);
  if (cart) {
    res.json(cart.products);
  } else {
    res.status(404).json({ error: 'Carrito no encontrado' });
  }
});

app.post('/api/carts/:cid/product/:pid', (req, res) => {
  const { cid, pid } = req.params;
  const { quantity } = req.body;

  cartManager.addProductToCart(cid, pid, quantity);
  res.sendStatus(200);
});


app.listen(8080, () => {
    console.log('Servidor escuchando en el puerto 8080');
});
