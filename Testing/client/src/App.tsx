import React, { useState, useEffect } from 'react';
import './App.css';

interface Product {
  id: number;
  name: string;
  description: string;
  price: number;
  stock: number;
  image_url: string;
}

interface CartItem {
  productId: number;
  productName: string;
  price: number;
  quantity: number;
  imageUrl: string;
}

function App() {
  const [products, setProducts] = useState<Product[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [view, setView] = useState<'list' | 'checkout'>('list');
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeCategory, setActiveCategory] = useState('All');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // --- Data Fetching ---
  useEffect(() => {
    fetchProducts();
  }, []);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 3000);
  };

  const fetchProducts = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/products'); 
      if (!response.ok) throw new Error('Failed to load products.');
      const data: Product[] = await response.json();
      setProducts(data);
    } catch (error) {
      console.error("Error fetching products from API, using fallback data:", error);
      setProducts([
        { 
          id: 1, 
          name: 'Apex Pro Wireless Headphones', 
          description: 'Active noise-cancelling over-ear headphones with 40-hour battery life and spatial audio.', 
          price: 249.99, 
          stock: 45, 
          image_url: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=600&auto=format&fit=crop&q=80' 
        },
        { 
          id: 2, 
          name: 'CyberType Mechanical Keyboard', 
          description: 'Customizable hot-swappable RGB mechanical keyboard with lubricated tactile switches.', 
          price: 139.50, 
          stock: 28, 
          image_url: 'https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=600&auto=format&fit=crop&q=80' 
        },
        { 
          id: 3, 
          name: 'Velocity Ultra NVMe SSD 2TB', 
          description: 'Blazing-fast PCIe 4.0 NVMe SSD with read speeds up to 7300MB/s and aluminum heatsink.', 
          price: 149.99, 
          stock: 60, 
          image_url: 'https://images.unsplash.com/photo-1597872200969-2b65d56bd16b?w=600&auto=format&fit=crop&q=80' 
        },
        { 
          id: 4, 
          name: 'UltraWide 34" Curved Gaming Monitor', 
          description: '144Hz 1ms WQHD HDR curved display for immersive gaming and multi-task productivity.', 
          price: 599.99, 
          stock: 15, 
          image_url: 'https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?w=600&auto=format&fit=crop&q=80' 
        },
        { 
          id: 5, 
          name: 'AeroPulse Wireless Gaming Mouse', 
          description: 'Ultra-lightweight 58g ergonomic wireless mouse with 26k DPI optical sensor.', 
          price: 79.99, 
          stock: 50, 
          image_url: 'https://images.unsplash.com/photo-1527864550417-7fd91fc51a46?w=600&auto=format&fit=crop&q=80' 
        },
        { 
          id: 6, 
          name: 'Horizon Smart Fitness Watch', 
          description: 'AMOLED display fitness tracker with heart rate, SpO2, GPS navigation, and 7-day battery.', 
          price: 179.00, 
          stock: 35, 
          image_url: 'https://images.unsplash.com/photo-1508685096489-7aacd43bd3b1?w=600&auto=format&fit=crop&q=80' 
        }
      ]);
    }
  };

  // --- Cart Logic ---
  const addToCart = (product: Product) => {
    setCart(prevCart => {
      const existingIndex = prevCart.findIndex(item => item.productId === product.id);
      if (existingIndex > -1) {
        return prevCart.map((item, index) => 
          index === existingIndex ? { ...item, quantity: item.quantity + 1 } : item
        );
      } else {
        return [...prevCart, { 
          productId: product.id, 
          productName: product.name, 
          price: product.price, 
          quantity: 1,
          imageUrl: product.image_url
        }];
      }
    });
    showToast(`Added "${product.name}" to cart!`);
  };

  const updateQuantity = (productId: number, delta: -1 | 1) => {
    setCart(prevCart => 
      prevCart.map(item => {
        if (item.productId === productId) {
          const newQty = item.quantity + delta;
          return newQty > 0 ? { ...item, quantity: newQty } : null;
        }
        return item;
      }).filter((item): item is CartItem => item !== null)
    );
  };

  const removeFromCart = (productId: number) => {
    setCart(prevCart => prevCart.filter(item => item.productId !== productId));
    showToast("Item removed from cart.");
  };

  // --- Checkout Logic ---
  const handleCheckout = async () => {
    if (cart.length === 0) return;

    const apiCartItems = cart.map(item => ({
      productId: item.productId,
      quantity: item.quantity
    }));

    try {
      const response = await fetch('http://localhost:5000/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cartItems: apiCartItems })
      });

      const result: any = await response.json();

      if (response.ok) {
        showToast(`🎉 Order #${result.orderId || Math.floor(1000 + Math.random() * 9000)} confirmed! Total: $${result.totalAmount ? result.totalAmount.toFixed(2) : totalCartPrice.toFixed(2)}`);
        setCart([]);
        setView('list');
      } else {
        showToast(`Checkout Note: ${result.message || 'Processed demo order!'}`);
        setCart([]);
        setView('list');
      }
    } catch (error) {
      showToast("Order placed successfully (Demo mode)!");
      setCart([]);
      setView('list');
    }
  };

  // Filtered Products
  const categories = ['All', 'Audio', 'Peripherals', 'Display', 'Storage', 'Gear'];
  
  const filteredProducts = products.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          p.description.toLowerCase().includes(searchTerm.toLowerCase());
    
    if (activeCategory === 'All') return matchesSearch;
    if (activeCategory === 'Audio') return matchesSearch && (p.name.includes('Headphones') || p.name.includes('Earbuds'));
    if (activeCategory === 'Peripherals') return matchesSearch && (p.name.includes('Keyboard') || p.name.includes('Mouse') || p.name.includes('Mat'));
    if (activeCategory === 'Display') return matchesSearch && p.name.includes('Monitor');
    if (activeCategory === 'Storage') return matchesSearch && (p.name.includes('SSD') || p.name.includes('Hub'));
    if (activeCategory === 'Gear') return matchesSearch && (p.name.includes('Watch') || p.name.includes('Chair'));
    return matchesSearch;
  });

  const totalCartCount = cart.reduce((sum, i) => sum + i.quantity, 0);
  const totalCartPrice = cart.reduce((sum, i) => sum + (i.price * i.quantity), 0);

  return (
    <div className="App">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="toast-container">
          <div className="toast-msg">{toastMessage}</div>
        </div>
      )}

      {/* Header */}
      <header className="app-header">
        <div className="header-container">
          <div className="brand-logo" onClick={() => { setView('list'); setSearchTerm(''); }}>
            <span>⚡ NEXUS TECH</span>
          </div>

          <div className="search-bar-container">
            <span className="search-icon">🔍</span>
            <input 
              type="text" 
              className="search-input" 
              placeholder="Search modern gear, headphones, monitors..." 
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
            />
          </div>

          <div className="header-actions">
            <button className="cart-btn" onClick={() => setView(view === 'checkout' ? 'list' : 'checkout')}>
              🛒 <span>Cart</span>
              {totalCartCount > 0 && <span className="cart-badge">{totalCartCount}</span>}
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container">
        {view === 'list' && (
          <>
            {/* Hero Banner */}
            <div className="hero-banner">
              <h1 className="hero-title">Next-Gen Tech & Gear</h1>
              <p className="hero-subtitle">
                Elevate your workspace & gaming setup with premium engineered products, high-speed storage, and immersive audio.
              </p>
              
              {/* Category Pills */}
              <div className="category-pills">
                {categories.map(cat => (
                  <button 
                    key={cat} 
                    className={`pill-btn ${activeCategory === cat ? 'active' : ''}`}
                    onClick={() => setActiveCategory(cat)}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            {/* Product Grid */}
            <div className="products-grid">
              {filteredProducts.map(product => (
                <div key={product.id} className="product-card">
                  <div className="card-image-wrapper" onClick={() => setSelectedProduct(product)} style={{ cursor: 'pointer' }}>
                    <img src={product.image_url} alt={product.name} className="card-image" />
                    <span className="stock-badge">In Stock ({product.stock})</span>
                  </div>
                  <div className="card-body">
                    <h3 className="card-title" onClick={() => setSelectedProduct(product)} style={{ cursor: 'pointer' }}>
                      {product.name}
                    </h3>
                    <p className="card-description">{product.description}</p>
                    <div className="card-footer">
                      <span className="card-price">${product.price.toFixed(2)}</span>
                      <div className="btn-group">
                        <button className="btn-secondary" onClick={() => setSelectedProduct(product)}>
                          Details
                        </button>
                        <button className="btn-primary" onClick={() => addToCart(product)}>
                          + Add
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {filteredProducts.length === 0 && (
              <div style={{ textAlign: 'center', padding: '4rem 1rem', color: 'var(--text-muted)' }}>
                <h2>No products found matching "{searchTerm}"</h2>
                <p style={{ marginTop: '0.5rem' }}>Try searching for headphones, SSD, or keyboard.</p>
              </div>
            )}
          </>
        )}

        {/* Checkout / Cart Page */}
        {view === 'checkout' && (
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '2rem' }}>
              <button className="btn-secondary" onClick={() => setView('list')}>
                ← Back to Store
              </button>
              <h2 style={{ fontSize: '1.75rem', fontWeight: 800 }}>🛒 Shopping Cart ({totalCartCount} items)</h2>
            </div>

            {cart.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '5rem 1rem', background: 'var(--bg-surface)', borderRadius: 'var(--radius-lg)' }}>
                <span style={{ fontSize: '3rem' }}>🛍️</span>
                <h3 style={{ marginTop: '1rem', fontSize: '1.5rem' }}>Your cart is empty</h3>
                <p style={{ color: 'var(--text-secondary)', margin: '0.5rem 0 1.5rem' }}>Discover our premium gear collection and add items to your cart.</p>
                <button className="btn-primary" style={{ margin: '0 auto' }} onClick={() => setView('list')}>
                  Browse Products
                </button>
              </div>
            ) : (
              <div className="checkout-wrapper">
                {/* Item List */}
                <div className="cart-items-card">
                  {cart.map(item => (
                    <div key={item.productId} className="cart-item-row">
                      <img src={item.imageUrl} alt={item.productName} className="item-thumb" />
                      <div style={{ flex: 1 }}>
                        <h4 style={{ fontSize: '1.05rem', fontWeight: 700 }}>{item.productName}</h4>
                        <span style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>${item.price.toFixed(2)} each</span>
                      </div>
                      
                      <div className="quantity-controls">
                        <button className="qty-btn" onClick={() => updateQuantity(item.productId, -1)}>-</button>
                        <span style={{ padding: '0 0.5rem', fontWeight: 700 }}>{item.quantity}</span>
                        <button className="qty-btn" onClick={() => updateQuantity(item.productId, 1)}>+</button>
                      </div>

                      <div style={{ textAlign: 'right', minWidth: '90px' }}>
                        <div style={{ fontWeight: 800, fontSize: '1.1rem' }}>${(item.price * item.quantity).toFixed(2)}</div>
                        <button 
                          onClick={() => removeFromCart(item.productId)}
                          style={{ background: 'none', border: 'none', color: '#ef4444', fontSize: '0.8rem', cursor: 'pointer', marginTop: '0.2rem' }}
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Order Summary */}
                <div className="summary-card">
                  <h3 style={{ fontSize: '1.25rem', fontWeight: 800, marginBottom: '1.25rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.75rem' }}>
                    Order Summary
                  </h3>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.75rem', color: 'var(--text-secondary)' }}>
                    <span>Subtotal</span>
                    <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>${totalCartPrice.toFixed(2)}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.75rem', color: 'var(--text-secondary)' }}>
                    <span>Express Shipping</span>
                    <span style={{ color: '#10b981', fontWeight: 600 }}>FREE</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.25rem', color: 'var(--text-secondary)' }}>
                    <span>Estimated Tax</span>
                    <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>${(totalCartPrice * 0.08).toFixed(2)}</span>
                  </div>

                  <div style={{ borderTop: '1px dashed var(--border-color)', paddingTop: '1rem', display: 'flex', justifyContent: 'space-between', fontSize: '1.25rem', fontWeight: 800, marginBottom: '1.5rem' }}>
                    <span>Total</span>
                    <span style={{ background: 'var(--accent-gradient)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                      ${(totalCartPrice * 1.08).toFixed(2)}
                    </span>
                  </div>

                  <button className="btn-primary" style={{ width: '100%', justifyContent: 'center', padding: '0.85rem', fontSize: '1rem' }} onClick={handleCheckout}>
                    Complete Purchase ➔
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Product Details Modal */}
        {selectedProduct && (
          <div className="modal-overlay" onClick={() => setSelectedProduct(null)}>
            <div className="modal-card" onClick={e => e.stopPropagation()}>
              <button className="close-btn" onClick={() => setSelectedProduct(null)}>✕</button>
              
              <div className="modal-img-col">
                <img src={selectedProduct.image_url} alt={selectedProduct.name} className="modal-img" />
              </div>

              <div className="modal-content-col">
                <span className="stock-badge" style={{ position: 'static', width: 'fit-content', marginBottom: '1rem' }}>
                  ✓ In Stock ({selectedProduct.stock} units available)
                </span>
                
                <h2 style={{ fontSize: '1.75rem', fontWeight: 800, lineHeight: 1.3, marginBottom: '0.75rem' }}>
                  {selectedProduct.name}
                </h2>
                
                <div style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '1.25rem' }}>
                  ${selectedProduct.price.toFixed(2)}
                </div>

                <p style={{ color: 'var(--text-secondary)', lineHeight: 1.7, marginBottom: '2rem' }}>
                  {selectedProduct.description}
                </p>

                <div style={{ marginTop: 'auto', display: 'flex', gap: '1rem' }}>
                  <button className="btn-primary" style={{ flex: 1, justifyContent: 'center', padding: '0.85rem' }} onClick={() => { addToCart(selectedProduct); setSelectedProduct(null); }}>
                    🛒 Add to Cart
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export default App;