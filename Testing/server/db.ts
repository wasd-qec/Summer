import * as sqlite3 from 'sqlite3';
import { open } from 'sqlite';

/**
 * Initializes and returns the database connection object.
 * The database file will be created in the root of the server directory (d:\Testing\server).
 */
let db: any; 

export async function initializeDatabase() {
    if (db) return db; // Avoid re-initializing if already done

    try {
        // Open the SQLite database connection. 'sqlite' wrapper is easier to use than raw sqlite3.
        db = await open({
            filename: './ecommerce_demo.db', 
            driver: sqlite3.Database
        });
        console.log('Database connected successfully.');

        // --- Schema Setup ---

        await db.run(`CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            email TEXT UNIQUE NOT NULL,
            password_hash TEXT NOT NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );`);

        await db.run(`CREATE TABLE IF NOT EXISTS products (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            description TEXT,
            price REAL NOT NULL,
            stock INTEGER NOT NULL,
            image_url TEXT
        );`);

        await db.run(`CREATE TABLE IF NOT EXISTS orders (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            total_amount REAL NOT NULL,
            status TEXT NOT NULL DEFAULT 'PENDING', -- PENDING, PAID, SHIPPED
            order_date DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY(user_id) REFERENCES users(id)
        );`);

        await db.run(`CREATE TABLE IF NOT EXISTS order_items (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            order_id INTEGER NOT NULL,
            product_id INTEGER NOT NULL,
            name TEXT NOT NULL,
            price REAL NOT NULL, -- Price at time of purchase
            quantity INTEGER NOT NULL,
            FOREIGN KEY(order_id) REFERENCES orders(id),
            FOREIGN KEY(product_id) REFERENCES products(id)
        );`);

        console.log('Database schema verified/created successfully.');

    } catch (error) {
        console.error('Error initializing database:', error);
        process.exit(1); // Exit if DB connection fails critically
    }

    return db;
}

/**
 * Helper function to seed the database with initial product data for the demo.
 */
export async function seedProducts() {
    const products = [
        { name: 'Wireless Headphones', description: 'Noise-cancelling over-ear headphones.', price: 199.99, stock: 50, image_url: '/images/headphones.jpg' },
        { name: 'Mechanical Keyboard', description: 'Tactile mechanical keyboard with customizable RGB.', price: 120.50, stock: 30, image_url: '/images/keyboard.jpg' },
        { name: 'Portable SSD 1TB', description: 'High-speed external solid state drive.', price: 89.99, stock: 75, image_url: '/images/ssd.jpg' }
    ];

    for (const product of products) {
        await db.run(`INSERT OR IGNORE INTO products (id, name, description, price, stock, image_url) 
                      VALUES ((SELECT id FROM products WHERE name = ?), ?, ?, ?, ?, ?)`, 
                      [product.name, product.name, product.description, product.price, product.stock, product.image_url]);
    }
    console.log('Product seeding completed.');
}

export async function run(sql: string, params?: any[]) {
    const database = await initializeDatabase();
    return database.run(sql, params);
}

export async function get(sql: string, params?: any[]) {
    const database = await initializeDatabase();
    return database.get(sql, params);
}

export async function query(sql: string, params?: any[]) {
    const database = await initializeDatabase();
    return database.all(sql, params);
}