import express, { Request, Response } from 'express';
import bodyParser from 'body-parser';
import dotenv from 'dotenv';
import * as db from './db'; // Import our initialized DB functions

// Load environment variables (e.g., PORT)
dotenv.config(); 

const app = express();
const port = process.env.PORT || 5000;

// Middleware setup
app.use(bodyParser.json());
app.use(express.urlencoded({ extended: true }));


/**
 * Root Route and Server Initialization
 */
async function startServer() {
    try {
        // 1. Initialize Database and Seed Data
        await db.initializeDatabase();
        await db.seedProducts();

        // --- API Routes ---

        // Product Endpoints (Read-only for listing)
        app.get('/api/products', async (req: Request, res: Response) => {
            try {
                const products = await db.query('SELECT * FROM products ORDER BY id ASC');
                res.status(200).json(products);
            } catch (error) {
                console.error('Error fetching products:', error);
                res.status(500).json({ message: 'Failed to fetch products.' });
            }
        });

        app.get('/api/products/:id', async (req: Request, res: Response) => {
            try {
                const product = await db.query('SELECT * FROM products WHERE id = ? LIMIT 1', [req.params.id]);
                if (!product) return res.status(404).json({ message: 'Product not found.' });
                res.status(200).json(product);
            } catch (error) {
                console.error('Error fetching single product:', error);
                res.status(500).json({ message: 'Failed to fetch product details.' });
            }
        });

        // User Endpoints (Simple registration placeholder)
        app.post('/api/users/register', async (req: Request, res: Response) => {
            const { email, password } = req.body;

            if (!email || !password) {
                return res.status(400).json({ message: 'Email and password are required.' });
            }

            try {
                // NOTE: In a real app, use proper hashing (e.g., bcrypt) here!
                const result = await db.run('INSERT INTO users (email, password_hash) VALUES (?, ?)', [email, password]); 
                res.status(201).json({ message: 'User registered successfully.', userId: result.lastID });
            } catch (error) {
                console.error('Registration error:', error);
                if ((error as any)?.message?.includes('UNIQUE constraint failed')) {
                     return res.status(409).json({ message: 'Email already exists.' });
                }
                res.status(500).json({ message: 'Server error during registration.' });
            }
        });

        // Order Endpoints (The core commerce logic)
        app.post('/api/orders', async (req: Request, res: Response) => {
            const user_id = 1; // Placeholder: Assume user is logged in with ID 1 for demo purposes
            const cartItems = req.body.cartItems || [];

            if (!user_id || !cartItems || cartItems.length === 0) {
                return res.status(400).json({ message: 'Missing user ID or empty cart.' });
            }

            let totalAmount = 0;
            const orderItemsToInsert: any[] = [];
            const productIdsUsed: number[] = [];

            try {
                // 1. Calculate Total and Validate Stock
                for (const item of cartItems) {
                    const productId = parseInt(item.productId);
                    const quantity = parseInt(item.quantity);

                    if (!productId || !quantity || quantity <= 0) continue;

                    // Check current product availability and get price
                    const product = await db.get('SELECT * FROM products WHERE id = ?', [productId]);
                    if (!product || product.stock < quantity) {
                        return res.status(409).json({ message: `Product ID ${productId} out of stock or invalid.` });
                    }

                    const itemTotal = product.price * quantity;
                    totalAmount += itemTotal;
                    
                    // Prepare for transaction logging and stock reduction
                    orderItemsToInsert.push({ 
                        product_id: productId, 
                        name: product.name, 
                        price: product.price, // Use current price
                        quantity: quantity 
                    });
                    productIdsUsed.push(productId);

                }

                // 2. Start Transaction and Process Order (Atomic Operation)
                await db.run('BEGIN TRANSACTION');
                
                // Insert the main order record
                const orderResult = await db.run('INSERT INTO orders (user_id, total_amount, status) VALUES (?, ?, ?)', [user_id, totalAmount, 'PAID']);
                const orderId = orderResult.lastID;

                // Insert all individual items for tracking
                for (const item of orderItemsToInsert) {
                    await db.run('INSERT INTO order_items (order_id, product_id, name, price, quantity) VALUES (?, ?, ?, ?, ?)', 
                                [orderId, item.product_id, item.name, item.price, item.quantity]);
                }

                // 3. Update Stock Levels and Finalize
                for (const productId of productIdsUsed) {
                    await db.run('UPDATE products SET stock = stock - ? WHERE id = ? AND stock >= ?', [cartItems.find((c: any) => c.productId == productId)?.quantity || 0, productId, cartItems.find((c: any) => c.productId == productId)?.quantity || 0]);
                }

                // Mark the order as PAID (Simulating successful payment)
                await db.run('UPDATE orders SET status = "PAID" WHERE id = ?', [orderId]);
                await db.run('COMMIT');

                res.status(201).json({ 
                    message: 'Order placed successfully and paid!', 
                    orderId, 
                    totalAmount, 
                    details: orderItemsToInsert 
                });

            } catch (error) {
                await db.run('ROLLBACK'); // Rollback if anything fails
                console.error('Transaction error:', error);
                res.status(500).json({ message: 'Failed to place order due to a server transaction error.' });
            }
        });


        // Start listening on the defined port
        app.listen(port, () => {
            console.log(`\n====================================================`);
            console.log(`✅ Server running on http://localhost:${port}`);
            console.log(`   Backend initialized with SQLite and seeded data.`);
            console.log(`====================================================\n`);
        });

    } catch (error) {
        console.error('\n--- FATAL SERVER STARTUP ERROR ---');
        console.error('Could not start the server due to a critical error:', error);
        process.exit(1);
    }
}

startServer();