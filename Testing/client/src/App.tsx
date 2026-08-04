import React, { useState, useEffect } from 'react';
import './App.css';

// Define types for clarity (assuming TypeScript context)
interface Product {
  id: number;
  name: string;
  description: string;
  price: number;
  stock: number;
  image_url: string;
}

interface CartItem {
    productId: number | string; // Use string/number based on how it comes from URL/state
    productName: string;
    price: number;
    quantity: number;
}


function App() {
  const [products, setProducts] = useState<Product[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [view, setView] = useState<'list' | 'detail' | 'checkout'>('list');
  const [selectedProductId, setSelectedProductId] = useState<number | null>(null);

  // --- Data Fetching (Simulates API interaction) ---
  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      // This URL assumes the backend is running on localhost:5000
      const response = await fetch('http://localhost:5000/api/products'); 
      if (!response.ok) throw new Error('Failed to load products from API.');
      const data: Product[] = await response.json();
      setProducts(data);
    } catch (error) {
      console.error("Error fetching products:", error);
      // Fallback for local testing if backend is not running
      setProducts([
          { id: 1, name: 'Wireless Headphones', description: 'Noise-cancelling over-ear headphones.', price: 199.99, stock: 50, image_url: '/images/headphones.jpg' },
          { id: 2, name: 'Mechanical Keyboard', description: 'Tactile mechanical keyboard with customizable RGB.', price: 120.50, stock: 30, image_url: '/images/keyboard.jpg' },
          { id: 3, name: 'Portable SSD 1TB', description: 'High-speed external solid state drive.', price: 89.99, stock: 75, image_url: '/images/ssd.jpg' }
      ]);
    }
  };

  // --- Cart Logic ---
  const addToCart = (product: Product) => {
    setCart(prevCart => {
      const existingItemIndex = prevCart.findIndex(item => item.productId === product.id);
      if (existingItemIndex > -1) {
        return prevCart.map((item, index) => 
            index === existingItemIndex ? { ...item, quantity: item.quantity + 1 } : item
        );
      } else {
        // Add new item to cart
        return [...prevCart, { 
          productId: product.id, 
          productName: product.name, 
          price: product.price, 
          quantity: 1 
        }];
      }
    });
  };

  const updateQuantity = (productId: number | string, delta: -1 | 1) => {
    setCart(prevCart => 
        prevCart.map(item => {
            if (item.productId === productId && item.quantity + delta > 0) {
                return { ...item, quantity: item.quantity + delta };
            } else if (item.productId === productId && item.quantity + delta <= 0) {
                 // Effectively removes the item if quantity hits zero/negative
                return null; 
            }
            return item;
        }).filter((item): item is CartItem => item !== null)
    );
  };

  const removeFromCart = (productId: number | string) => {
      setCart(prevCart => prevCart.filter(item => item.productId !== productId));
  };


  // --- Checkout Logic (API Call Simulation) ---
  const handleCheckout = async () => {
    if (cart.length === 0) {
        alert("Your cart is empty.");
        return;
    }

    // Prepare payload for the backend API: Need productId and quantity for every item in cart
    const apiCartItems = cart.map(item => ({
      productId: item.productId,
      quantity: item.quantity
    }));

    console.log("Attempting to place order with items:", apiCartItems);

    try {
        // Simulate API call to the backend /api/orders endpoint
        const response = await fetch('http://localhost:5000/api/orders', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ cartItems: apiCartItems })
        });

        const result: any = await response.json();

        if (response.ok) {
            alert(`Success! Order ${result.orderId} placed for $${result.totalAmount.toFixed(2)}. Thank you!`);
            // Clear cart and reset view on successful checkout
            setCart([]);
            setView('list'); 
        } else {
             alert(`Checkout Failed: ${result.message || 'Unknown error.'}`);
        }

    } catch (error) {
        console.error("Network error during checkout:", error);
        alert("Could not connect to the server. Please ensure the backend is running.");
    }
  };


  // --- Component Rendering ---

  const renderProductList = () => (
    <div className="container">
      <h1>Featured Products</h1>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '20px' }}>
        {products.map(product => (
          <ProductCard key={product.id} product={product} onAddToCart={addToCart} />
        ))}
      </div>
    </div>
  );

  const renderProductDetail = () => {
    const product = products.find(p => p.id === selectedProductId);
    if (!product) return <div>Loading or Product Not Found...</div>;

    return (
        <div className="container" style={{ maxWidth: '900px', margin: '20px auto' }}>
            <button onClick={() => setView('list')} className="back-button">← Back to Shopping</button>
            <div style={{ display: 'flex', gap: '40px', alignItems: 'center' }}>
                <img src={product.image_url} alt={product.name} style={{ width: '45%', height: 'auto', objectFit: 'cover', borderRadius: '8px' }} />
                <div style={{ width: '55%' }}>
                    <h1>{product.name}</h1>
                    <p className="price">${product.price.toFixed(2)}</p>
                    <h3 className="description">{product.description}</h3>
                    <p>In Stock: {product.stock}</p>
                    <button onClick={() => addToCart(product)}>Add to Cart</button>
                </div>
            </div>
        </div>
    );
  };

  const renderCheckout = () => {
    const totalItems = cart.reduce((acc, item) => acc + item.quantity, 0);
    const subtotal = cart.reduce((acc, item) => acc + (item.price * item.quantity), 0);
    const shippingCost = totalItems > 0 ? 15.00 : 0; // Fixed demo cost
    const grandTotal = subtotal + shippingCost;

    return (
        <div className="container" style={{ maxWidth: '800px', margin: '20px auto' }}>
            <h2>🛒 Your Shopping Cart</h2>
            <div style={{ display: 'flex', gap: '30px', flexWrap: 'wrap' }}>
                {/* Cart Items List */}
                <div style={{ flexBasis: '65%', paddingRight: '30px' }}>
                    {cart.length === 0 ? (
                        <p>Your cart is empty.</p>
                    ) : (
                         cart.map(item => (
                            <div key={item.productId} style={{ borderBottom: '1px solid #eee', padding: '10px 0' }}>
                                <span style={{ display: 'inline-block', width: '30%', fontSize: '1.1em' }}>{item.productName}</span>
                                <div style={{ width: '25%' }}>
                                    <button onClick={() => updateQuantity(item.productId, -1)}>-</button>
                                    <span>{item.quantity}</span>
                                    <button onClick={() => updateQuantity(item.productId, 1)}>+</button>
                                </div>
                                <span style={{ width: '30%', textAlign: 'right' }}>${(item.price * item.quantity).toFixed(2)}</span>
                            </div>
                        ))
                    )}
                </div>

                {/* Summary & Checkout */}
                <div style={{ flexBasis: '30%' }}>
                    <h3>Order Summary</h3>
                    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '5px 0' }}>
                        <span>Subtotal:</span> <span className="total">${subtotal.toFixed(2)}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '5px 0' }}>
                        <span>Shipping Estimate:</span> <span className="total">${shippingCost.toFixed(2)}</span>
                    </div>
                    <hr />
                    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', fontWeight: 'bold', fontSize: '1.2em' }}>
                        <span>Order Total:</span> <span className="total">${grandTotal.toFixed(2)}</span>
                    </div>

                    <button 
                        onClick={handleCheckout} 
                        style={{ width: '100%', padding: '15px', marginTop: '20px', backgroundColor: '#007bff', color: 'white', border: 'none', cursor: 'pointer' }}
                        disabled={cart.length === 0}
                    >
                        Proceed to Checkout
                    </button>
                </div>
            </div>
        </div>
    );
  };


  return (
    <div className="App">
      <header style={{ background: '#333', color: 'white', padding: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h1>E-Shop Demo</h1>
          <div>
              <button onClick={() => {setCart([]); setView('list');}} style={{marginRight: '15px'}}>Clear Cart</button>
              <button onClick={() => setView('checkout')} className="cart-button">
                  🛒 Cart ({cart.reduce((acc, item) => acc + item.quantity, 0)})
              </button>
          </div>
      </header>

      <main style={{ padding: '20px' }}>
        {view === 'list' && renderProductList()}
        {view === 'detail' && renderProductDetail()}
        {view === 'checkout' && renderCheckout()}
      </main>
    </div>
  );
}


// --- Reusable Components ---

const ProductCard: React.FC<{ product: Product, onAddToCart: (p: Product) => void }> = ({ product, onAddToCart }) => (
    <div style={{ border: '1px solid #ddd', padding: '20px', borderRadius: '8px', boxShadow: '0 2px 5px rgba(0,0,0,0.1)' }}>
        <img src={product.image_url} alt={product.name} style={{ width: '100%', height: '200px', objectFit: 'cover', borderRadius: '4px' }} />
        <div style={{ padding: '10px 0' }}>
            <h3 style={{ margin: '5px 0' }}>{product.name}</h3>
            <p className="price">${product.price.toFixed(2)}</p>
            <p>{product.description.substring(0, 80)}...</p>
            <div style={{ display: 'flex', gap: '10px', marginTop: '15px' }}>
                <button onClick={() => onAddToCart(product)}>Add to Cart</button>
                {/* Placeholder button for viewing detail */}
                <button onClick={() => {/* In a real app, navigate here */}}>View Details</button> 
            </div>
        </div>
    </div>
);

export default App;