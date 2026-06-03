const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');
const db = require('./db');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Ensure uploads dir exists
const UPLOAD_DIR = path.join(__dirname, '..', 'uploads');
if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR);

// Multer setup
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, UPLOAD_DIR);
  },
  filename: function (req, file, cb) {
    const unique = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const safe = file.originalname.replace(/[^a-zA-Z0-9.\-_çşığüÇŞİĞÜÖö]/g, '_');
    cb(null, unique + '-' + safe);
  }
});
const upload = multer({ storage: storage });

// Serve uploads and admin & static site
app.use('/uploads', express.static(path.join(__dirname, '..', 'uploads')));
app.use('/', express.static(path.join(__dirname, '..')));

// API: products
app.get('/api/products', (req, res) => {
  db.all('SELECT * FROM products ORDER BY created_at DESC', [], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    const out = rows.map(r => ({
      id: r.id,
      title: r.title,
      brand: r.brand,
      price: r.price,
      description: r.description,
      images: r.images ? JSON.parse(r.images) : [],
      stock: r.stock ? JSON.parse(r.stock) : {},
      created_at: r.created_at
    }));
    res.json(out);
  });
});

// API: brands
app.get('/api/brands', (req, res) => {
  db.all('SELECT id,name,created_at FROM brands ORDER BY name COLLATE NOCASE', [], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows || []);
  });
});

app.post('/api/brands', express.json(), (req, res) => {
  const { name } = req.body || {};
  if (!name || !name.trim()) return res.status(400).json({ error: 'Brand name required' });
  const id = 'b-' + Date.now();
  const created_at = Date.now();
  db.run('INSERT OR IGNORE INTO brands (id,name,created_at) VALUES (?,?,?)', [id, name.trim(), created_at], function(err){
    if (err) return res.status(500).json({ error: err.message });
    // If insert ignored due to uniqueness, try to fetch existing
    db.get('SELECT id,name,created_at FROM brands WHERE name = ?', [name.trim()], (e, row) => {
      if (e) return res.status(500).json({ error: e.message });
      res.json(row || { id, name: name.trim(), created_at });
    });
  });
});

app.delete('/api/brands/:id', (req, res) => {
  const id = req.params.id;
  db.run('DELETE FROM brands WHERE id = ?', [id], function(err){
    if (err) return res.status(500).json({ error: err.message });
    res.json({ success: true });
  });
});

app.post('/api/products', upload.array('images', 6), (req, res) => {
  const { title, brand, price, description } = req.body;
  let stock = {};
  try { stock = req.body.stock ? JSON.parse(req.body.stock) : {}; } catch(e){ stock = {}; }
  const id = 'p-' + Date.now();
  const created_at = Date.now();
  const images = (req.files || []).map(f => `/uploads/${path.basename(f.path)}`);
  db.run('INSERT INTO products (id,title,brand,price,description,images,stock,created_at) VALUES (?,?,?,?,?,?,?,?)',
    [id, title, brand, price || 0, description || '', JSON.stringify(images), JSON.stringify(stock), created_at], function(err){
      if (err) return res.status(500).json({ error: err.message });
      res.json({ id, title, brand, price, description, images, stock, created_at });
  });
});

app.put('/api/products/:id', upload.array('images', 12), (req, res) => {
  const id = req.params.id;
  const { title, brand, price, description } = req.body;
  const newImages = (req.files || []).map(f => `/uploads/${path.basename(f.path)}`);
  let incomingStock = {};
  try { incomingStock = req.body.stock ? JSON.parse(req.body.stock) : {}; } catch(e){ incomingStock = {}; }
  let existingImagesOverride = [];
  if (req.body.existingImages) {
    try { existingImagesOverride = JSON.parse(req.body.existingImages) || []; } catch(e){ existingImagesOverride = []; }
  }

  // Fetch current images and merge
  db.get('SELECT images, stock FROM products WHERE id = ?', [id], (err, row) => {
    if (err) return res.status(500).json({ error: err.message });
    if (!row) return res.status(404).json({ error: 'Ürün bulunamadı' });
    let images = [];
    if (existingImagesOverride.length > 0) {
      images = existingImagesOverride; // user-specified retained list
    } else {
      try { images = row.images ? JSON.parse(row.images) : []; } catch(e){ images = []; }
    }
    // append new images
    images = images.concat(newImages);
    // merge existing stock with incoming stock
    let existingStock = {};
    try { existingStock = row.stock ? JSON.parse(row.stock) : {}; } catch(e){ existingStock = {}; }
    const mergedStock = Object.assign({}, existingStock, incomingStock);

    db.run('UPDATE products SET title=?,brand=?,price=?,description=?,images=? WHERE id=?',
      [title, brand, price || 0, description || '', JSON.stringify(images), id], function(err){
        if (err) return res.status(500).json({ error: err.message });
        // update stock separately (SQLite requires separate update when altering columns may not be present in older DB)
        db.run('UPDATE products SET stock = ? WHERE id = ?', [JSON.stringify(mergedStock), id], function(err2){
          if (err2) return res.status(500).json({ error: err2.message });
          res.json({ id, title, brand, price, description, images, stock: mergedStock });
        });
    });
  });
});

app.delete('/api/products/:id', (req, res) => {
  const id = req.params.id;
  db.run('DELETE FROM products WHERE id = ?', [id], function(err){
    if (err) return res.status(500).json({ error: err.message });
    res.json({ success: true });
  });
});

// API: orders
app.get('/api/orders', (req, res) => {
  db.all('SELECT * FROM orders ORDER BY created_at DESC', [], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    const out = rows.map(r => ({
      id: r.id,
      items: r.items ? JSON.parse(r.items) : [],
      total: r.total,
      status: r.status,
      created_at: r.created_at
    }));
    res.json(out);
  });
});

app.post('/api/orders', (req, res) => {
  const { items, total } = req.body;
  const id = 'o-' + Date.now();
  const created_at = Date.now();
  const status = 'pending';
  db.run('INSERT INTO orders (id,items,total,status,created_at) VALUES (?,?,?,?,?)', [id, JSON.stringify(items||[]), total||0, status, created_at], function(err){
    if (err) return res.status(500).json({ error: err.message });
    res.json({ id, items, total, status, created_at });
  });
});

// Placeholder checkout to integrate with Shopiere later
app.post('/api/checkout', (req, res) => {
  // Expected: items, total, returnUrl, cancelUrl
  // Create a payment session (do NOT insert an order yet). Orders will be inserted after payment confirmation/webhook.
  const { items, total, returnUrl, cancelUrl } = req.body || {};
  const sessionId = 'ps-' + Date.now();
  const created_at = Date.now();
  const status = 'pending';
  // build a fake redirect URL for now (replace with Shopiere payment URL when integrated)
  const redirectUrl = `/pay/redirect.html?sessionId=${sessionId}`;
  db.run('INSERT INTO payment_sessions (id,items,total,status,redirect_url,created_at) VALUES (?,?,?,?,?,?)', [sessionId, JSON.stringify(items||[]), total||0, status, redirectUrl, created_at], function(err){
    if (err) return res.status(500).json({ error: err.message });
    res.json({ sessionId, redirectUrl });
  });
});

app.listen(PORT, () => {
  console.log(`TrendStore server listening on http://localhost:${PORT}`);
});
