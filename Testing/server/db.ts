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
        { 
            name: 'Apex Pro Wireless Headphones', 
            description: 'Active noise-cancelling over-ear headphones with 40-hour battery life and spatial audio.', 
            price: 249.99, 
            stock: 45, 
            image_url: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=600&auto=format&fit=crop&q=80' 
        },
        { 
            name: 'CyberType Mechanical Keyboard', 
            description: 'Customizable hot-swappable RGB mechanical keyboard with lubricated tactile switches.', 
            price: 139.50, 
            stock: 28, 
            image_url: 'https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=600&auto=format&fit=crop&q=80' 
        },
        { 
            name: 'Velocity Ultra NVMe SSD 2TB', 
            description: 'Blazing-fast PCIe 4.0 NVMe SSD with read speeds up to 7300MB/s and aluminum heatsink.', 
            price: 149.99, 
            stock: 60, 
            image_url: 'https://images.unsplash.com/photo-1597872200969-2b65d56bd16b?w=600&auto=format&fit=crop&q=80' 
        },
        { 
            name: 'UltraWide 34" Curved Gaming Monitor', 
            description: '144Hz 1ms WQHD HDR curved display for immersive gaming and multi-task productivity.', 
            price: 599.99, 
            stock: 15, 
            image_url: 'https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?w=600&auto=format&fit=crop&q=80' 
        },
        { 
            name: 'AeroPulse Wireless Gaming Mouse', 
            description: 'Ultra-lightweight 58g ergonomic wireless mouse with 26k DPI optical sensor.', 
            price: 79.99, 
            stock: 50, 
            image_url: 'https://images.unsplash.com/photo-1527864550417-7fd91fc51a46?w=600&auto=format&fit=crop&q=80' 
        },
        { 
            name: 'Horizon Smart Fitness Watch', 
            description: 'AMOLED display fitness tracker with heart rate, SpO2, GPS navigation, and 7-day battery.', 
            price: 179.00, 
            stock: 35, 
            image_url: 'https://images.unsplash.com/photo-1508685096489-7aacd43bd3b1?w=600&auto=format&fit=crop&q=80' 
        },
        { 
            name: 'SoundSphere True Wireless Earbuds', 
            description: 'Compact IPX7 waterproof Bluetooth earbuds with active noise transparency mode.', 
            price: 119.99, 
            stock: 40, 
            image_url: 'https://images.unsplash.com/photo-1590658268037-6bf12165a8df?w=600&auto=format&fit=crop&q=80' 
        },
        { 
            name: 'OmniDock 12-in-1 Thunderbolt Hub', 
            description: 'Dual 4K HDMI, 100W Power Delivery, SD Card reader, and Ethernet docking station.', 
            price: 129.95, 
            stock: 22, 
            image_url: 'https://images.unsplash.com/photo-1616440347437-b1c73416efc2?w=600&auto=format&fit=crop&q=80' 
        },
        { 
            name: 'Lumina RGB Desk Mat Extra Large', 
            description: 'Micro-woven cloth mousepad with ambient RGB edge lighting and non-slip rubber base.', 
            price: 34.99, 
            stock: 80, 
            image_url: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=600&auto=format&fit=crop&q=80' 
        },
        { 
            name: 'ErgoPro Executive Mesh Chair', 
            description: '3D adjustable lumbar support ergonomic desk chair with breathable mesh backrest.', 
            price: 349.99, 
            stock: 12, 
            image_url: 'https://images.unsplash.com/photo-1580481072645-022f9a6d1270?w=600&auto=format&fit=crop&q=80' 
        }
    ];

    for (const product of products) {
        // Upsert product (update image_url, description, price, stock if exists, else insert)
        const existing = await db.get('SELECT id FROM products WHERE name = ?', [product.name]);
        if (existing) {
            await db.run(
                `UPDATE products SET description = ?, price = ?, stock = ?, image_url = ? WHERE id = ?`,
                [product.description, product.price, product.stock, product.image_url, existing.id]
            );
        } else {
            await db.run(
                `INSERT INTO products (name, description, price, stock, image_url) VALUES (?, ?, ?, ?, ?)`, 
                [product.name, product.description, product.price, product.stock, product.image_url]
            );
        }
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