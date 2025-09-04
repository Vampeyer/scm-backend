import express from 'express';
import mysql from 'mysql2/promise';
import cors from 'cors';

// Load .env variables in development
if (process.env.NODE_ENV !== 'production') {
  import('dotenv').then(dotenv => dotenv.config());
}

const app = express();
const port = process.env.PORT || 3006;

app.use(cors());
app.use(express.json());

const createDbConnection = async () => {
  return await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'scm_system',
    port: process.env.DB_PORT || 3306
  });
};

// Get all products
app.get('/api/products', async (req, res) => {
  try {
    const db = await createDbConnection();
    const [rows] = await db.execute('SELECT * FROM products');
    await db.end();
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch products' });
  }
});

// Create a product
app.post('/api/products', async (req, res) => {
  const { name, description, price, stock_quantity, supplier_id } = req.body;
  try {
    const db = await createDbConnection();
    const query = 'INSERT INTO products (name, description, price, stock_quantity, supplier_id) VALUES (?, ?, ?, ?, ?)';
    const params = [name, description || null, price, stock_quantity, supplier_id || null];
    const [result] = await db.execute(query, params);
    await db.end();
    res.json({ message: 'Product added', productId: result.insertId });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to add product' });
  }
});

// Update a product
app.put('/api/products/:id', async (req, res) => {
  const { id } = req.params;
  const { name, description, price, stock_quantity, supplier_id } = req.body;
  try {
    const db = await createDbConnection();
    const query = 'UPDATE products SET name = ?, description = ?, price = ?, stock_quantity = ?, supplier_id = ? WHERE product_id = ?';
    const params = [name, description || null, price, stock_quantity, supplier_id || null, id];
    const [result] = await db.execute(query, params);
    await db.end();
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Product not found' });
    }
    res.json({ message: 'Product updated' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to update product' });
  }
});

// Delete a product
app.delete('/api/products/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const db = await createDbConnection();
    const [result] = await db.execute('DELETE FROM products WHERE product_id = ?', [id]);
    await db.end();
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Product not found' });
    }
    res.json({ message: 'Product deleted' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to delete product' });
  }
});

// Get all suppliers
app.get('/api/suppliers', async (req, res) => {
  try {
    const db = await createDbConnection();
    const [rows] = await db.execute('SELECT * FROM suppliers');
    await db.end();
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch suppliers' });
  }
});

// Create a supplier
app.post('/api/suppliers', async (req, res) => {
  const { supplier_id, name, contact_info } = req.body;
  try {
    const db = await createDbConnection();
    const query = supplier_id
      ? 'INSERT INTO suppliers (supplier_id, name, contact_info) VALUES (?, ?, ?)'
      : 'INSERT INTO suppliers (name, contact_info) VALUES (?, ?)';
    const params = supplier_id ? [supplier_id, name, contact_info || null] : [name, contact_info || null];
    const [result] = await db.execute(query, params);
    await db.end();
    res.json({ message: 'Supplier added', supplierId: result.insertId });
  } catch (err) {
    console.error(err);
    if (err.code === 'ER_DUP_ENTRY') {
      res.status(400).json({ error: 'Supplier ID already exists' });
    } else {
      res.status(500).json({ error: 'Failed to add supplier' });
    }
  }
});

// Update a supplier (fixed query)
app.put('/api/suppliers/:id', async (req, res) => {
  const { id } = req.params;
  const { name, contact_info } = req.body;
  try {
    const db = await createDbConnection();
    const query = 'UPDATE suppliers SET name = ?, contact_info = ? WHERE supplier_id = ?';
    const [result] = await db.execute(query, [name, contact_info || null, id]);
    await db.end();
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Supplier not found' });
    }
    res.json({ message: 'Supplier updated' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to update supplier' });
  }
});

// Delete a supplier
app.delete('/api/suppliers/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const db = await createDbConnection();
    const [result] = await db.execute('DELETE FROM suppliers WHERE supplier_id = ?', [id]);
    await db.end();
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Supplier not found' });
    }
    res.json({ message: 'Supplier deleted' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to delete supplier' });
  }
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
  createDbConnection()
    .then(() => console.log('MySQL connected'))
    .catch(err => console.error('MySQL connection error:', err));
});