const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const dbPath = path.join(__dirname, 'trendstore.db');

const db = new sqlite3.Database(dbPath);

// Initialize tables if they don't exist
db.serialize(() => {
  // NOTE: The duplicate 'images TEXT' in older schema is cleaned up for new setups.
  db.run(`CREATE TABLE IF NOT EXISTS products (
    id TEXT PRIMARY KEY,
    title TEXT,
    brand TEXT,
    price REAL,
    description TEXT,
    images TEXT,
    stock TEXT,
    created_at INTEGER
  )`);

  // Brands table to allow admin-managed brands
  db.run(`CREATE TABLE IF NOT EXISTS brands (
    id TEXT PRIMARY KEY,
    name TEXT UNIQUE,
    created_at INTEGER
  )`);

  // Payment sessions (created at checkout, before payment confirmation)
  db.run(`CREATE TABLE IF NOT EXISTS payment_sessions (
    id TEXT PRIMARY KEY,
    items TEXT,
    total REAL,
    status TEXT,
    redirect_url TEXT,
    created_at INTEGER
  )`);

  // Migration: ensure 'stock' column exists on products table (for older DBs)
  db.get("PRAGMA table_info('products')", (err, info) => {
    // We'll query full table_info to check columns
  });
  db.all("PRAGMA table_info('products')", (err, cols) => {
    if (err) return; // silent
    const names = (cols || []).map(c => c.name);
    if (!names.includes('stock')) {
      try {
        db.run('ALTER TABLE products ADD COLUMN stock TEXT', () => {});
      } catch (e) {
        // ignore
      }
    }
  });

  db.run(`CREATE TABLE IF NOT EXISTS orders (
    id TEXT PRIMARY KEY,
    items TEXT,
    total REAL,
    status TEXT,
    created_at INTEGER
  )`);
});

module.exports = db;
