import React, { useState, useEffect } from 'react';
import {
  ShoppingBag,
  Search,
  Heart,
  Menu,
  X,
  Minus,
  Plus,
  Trash2,
  Package,
  Sparkles,
  Phone,
  MapPin,
  Mail,
  ShieldCheck,
  Truck,
  ArrowRight,
  Sun,
  Moon,
  ExternalLink,
  AlertCircle
} from 'lucide-react';
import { initialProducts, paymentGateways, Product, Order } from './data';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export default function App() {
  // Navigation & Page States
  const [currentTab, setCurrentTab] = useState<'home' | 'shop' | 'details' | 'cart' | 'checkout' | 'contact' | 'admin'>('home');
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  // Core Data States
  const [products, setProducts] = useState<Product[]>(() => {
    const saved = localStorage.getItem('jeris_products');
    return saved ? JSON.parse(saved) : initialProducts;
  });

  const [orders, setOrders] = useState<Order[]>(() => {
    const saved = localStorage.getItem('jeris_orders');
    return saved ? JSON.parse(saved) : [];
  });

  // Dark Mode State
  const [darkMode, setDarkMode] = useState<boolean>(() => {
    const saved = localStorage.getItem('theme');
    return saved === 'dark' || (!saved && window.matchMedia('(prefers-color-scheme: dark)').matches);
  });

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [priceRange, setPriceRange] = useState<number>(5000);

  // Cart & Wishlist States
  const [cart, setCart] = useState<{ product: Product; quantity: number; selectedSize: string; selectedColor: string }[]>(() => {
    const saved = localStorage.getItem('jeris_cart');
    return saved ? JSON.parse(saved) : [];
  });

  const [wishlist, setWishlist] = useState<string[]>(() => {
    const saved = localStorage.getItem('jeris_wishlist');
    return saved ? JSON.parse(saved) : [];
  });

  // Product Selection Details
  const [selectedSize, setSelectedSize] = useState<string>('');
  const [selectedColor, setSelectedColor] = useState<string>('');

  // Coupon / Promo details
  const [promoCode, setPromoCode] = useState('');
  const [discountAmount, setDiscountAmount] = useState(0);

  // Mobile menu open state
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Admin New Product Form State
  const [newProduct, setNewProduct] = useState({
    name: '',
    category: 'Shirts',
    price: '',
    discount: '',
    description: '',
    image: '',
    stock: ''
  });

  // Admin Authentication & Editing States
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState(false);
  const [adminPasswordInput, setAdminPasswordInput] = useState('');
  const [adminLoginError, setAdminLoginError] = useState('');

  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [activeChalanOrder, setActiveChalanOrder] = useState<Order | null>(null);

  const handleEditProductImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && editingProduct) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setEditingProduct({ ...editingProduct, image: reader.result as string });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleUpdateProduct = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProduct) return;
    setProducts(products.map(p => p.id === editingProduct.id ? editingProduct : p));
    setEditingProduct(null);
    alert('Product details successfully updated!');
  };

  // Admin File Input Ref for image conversion
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setNewProduct(prev => ({ ...prev, image: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  // Persist State to LocalStorage
  useEffect(() => {
    localStorage.setItem('jeris_products', JSON.stringify(products));
  }, [products]);

  useEffect(() => {
    localStorage.setItem('jeris_orders', JSON.stringify(orders));
  }, [orders]);

  useEffect(() => {
    localStorage.setItem('jeris_cart', JSON.stringify(cart));
  }, [cart]);

  useEffect(() => {
    localStorage.setItem('jeris_wishlist', JSON.stringify(wishlist));
  }, [wishlist]);

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [darkMode]);

  // Derived Values & Calculations
  const categories = ['All', 'Shirts', 'Pants & Trousers', 'T-Shirts', 'Panjabi & Ethnic', 'Kids Wear'];

  const filteredProducts = products.filter(product => {
    const matchesCategory = selectedCategory === 'All' || product.category === selectedCategory;
    const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          product.description.toLowerCase().includes(searchQuery.toLowerCase());
    const finalPrice = product.price - (product.price * (product.discount / 100));
    const matchesPrice = finalPrice <= priceRange;

    return matchesCategory && matchesSearch && matchesPrice;
  });

  const cartSubtotal = cart.reduce((sum, item) => {
    const finalPrice = item.product.price - (item.product.price * (item.product.discount / 100));
    return sum + finalPrice * item.quantity;
  }, 0);

  const cartTotal = cartSubtotal - discountAmount;

  // Add to Wishlist Toggle
  const toggleWishlist = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (wishlist.includes(id)) {
      setWishlist(wishlist.filter(itemId => itemId !== id));
    } else {
      setWishlist([...wishlist, id]);
    }
  };

  // Add to Cart Logic
  const handleAddToCart = (product: Product) => {
    if (!product.stock) {
      alert("Sorry, this item is out of stock!");
      return;
    }
    const targetSize = selectedSize || product.sizes[0] || 'Standard';
    const targetColor = selectedColor || product.colors[0] || 'Default';

    setCart(prev => {
      const existing = prev.find(item => item.product.id === product.id && item.selectedSize === targetSize && item.selectedColor === targetColor);
      if (existing) {
        return prev.map(item => item.product.id === product.id ? { ...item, quantity: item.quantity + 1 } : item);
      }
      return [...prev, { product, quantity: 1, selectedSize: targetSize, selectedColor: targetColor }];
    });
    alert('Added to cart successfully!');
  };

  // Update Cart Quantity
  const updateCartQuantity = (id: string, delta: number) => {
    setCart(prev =>
      prev
        .map(item => (item.product.id === id ? { ...item, quantity: item.quantity + delta } : item))
        .filter(item => item.quantity > 0)
    );
  };

  // Apply Promo / Discount Coupon
  const applyPromoCode = () => {
    if (promoCode.toUpperCase() === 'JERIS10') {
      setDiscountAmount(cartSubtotal * 0.10);
      alert('10% Discount Applied Successfully!');
    } else if (promoCode.toUpperCase() === 'EID20') {
      setDiscountAmount(cartSubtotal * 0.20);
      alert('20% Eid Discount Applied Successfully!');
    } else {
      alert('Invalid promo code');
    }
  };

  // Admin Helpers
  const handleAddProduct = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProduct.name || !newProduct.price) return;
    const item: Product = {
      id: `p_${Date.now()}`,
      name: newProduct.name,
      category: newProduct.category,
      price: Number(newProduct.price),
      discount: Number(newProduct.discount) || 0,
      description: newProduct.description || 'Premium quality garments for everyday wear.',
      image: newProduct.image || 'https://images.unsplash.com/photo-1542272604-787c3835535d?auto=format&fit=crop&q=80&w=600',
      stock: Number(newProduct.stock) || 10,
      sizes: ['S', 'M', 'L', 'XL'],
      colors: ['Black', 'White', 'Navy']
    };
    setProducts([item, ...products]);
    setNewProduct({ name: '', category: 'Shirts', price: '', discount: '', description: '', image: '', stock: '' });
    alert('Product successfully added to Jeri\'s Choice catalog!');
  };

  // WhatsApp Order redirect
  const handleWhatsAppOrder = (productName: string) => {
    const text = encodeURIComponent(`Hello JERI'S CHOICE! I am interested in buying: ${productName}. Could you please share the details?`);
    window.open(`https://wa.me/8801748460707?text=${text}`, '_blank');
  };

  // Checkout Form State
  const [checkoutData, setCheckoutData] = useState({
    name: '',
    phone: '',
    address: '',
    paymentMethod: 'bkash',
    paymentDetails: ''
  });

  const [showOrderSuccess, setShowOrderSuccess] = useState(false);
  const [lastOrder, setLastOrder] = useState<Order | null>(null);

  const handleCheckoutSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!checkoutData.name || !checkoutData.phone || !checkoutData.address || !checkoutData.paymentDetails) {
      alert('Please fill out all the fields, including payment verification details.');
      return;
    }

    const orderId = `ORD-${Math.floor(100000 + Math.random() * 900000)}`;
    const newOrder: Order = {
      id: orderId,
      customerName: checkoutData.name,
      phoneNumber: checkoutData.phone,
      address: checkoutData.address,
      products: cart,
      totalPrice: cartTotal,
      paymentMethod: checkoutData.paymentMethod,
      paymentDetails: checkoutData.paymentDetails,
      status: 'Pending',
      date: new Date().toLocaleDateString()
    };

    setOrders([newOrder, ...orders]);
    setLastOrder(newOrder);

    // 1. Generate PDF Delivery Challan
    const doc = new jsPDF();
    
    // Title and Header
    doc.setFontSize(22);
    doc.setTextColor(40, 40, 40);
    doc.text("JERI'S CHOICE - DELIVERY CHALLAN", 14, 25);
    
    // Sub-header details
    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100);
    doc.text("Business Address: Dhaka, Bangladesh", 14, 32);
    doc.text("Contact: +8801748-460707 | Email: asifjahandesh@gmail.com", 14, 38);
    
    // Horizontal rule
    doc.setLineWidth(0.5);
    doc.line(14, 43, 196, 43);

    // Order Details Section
    doc.setFontSize(12);
    doc.setTextColor(30, 30, 30);
    doc.text(`Order ID: ${newOrder.id}`, 14, 52);
    doc.text(`Date: ${newOrder.date}`, 14, 58);
    doc.text(`Customer Name: ${newOrder.customerName}`, 14, 64);
    doc.text(`Phone Number: ${newOrder.phoneNumber}`, 14, 70);
    doc.text(`Delivery Address: ${newOrder.address}`, 14, 76);
    doc.text(`Payment Method: ${newOrder.paymentMethod.toUpperCase()}`, 14, 82);
    
    // Table content
    const tableColumn = ["Item Description", "Unit Price (BDT)", "Qty", "Total (BDT)"];
    const tableRows: any[] = [];

    newOrder.products.forEach(item => {
      const price = item.product.price - (item.product.price * (item.product.discount / 100));
      const itemData = [
        `${item.product.name} ${item.selectedSize ? `(Size: ${item.selectedSize})` : ''}`,
        `Tk ${price.toFixed(2)}`,
        item.quantity.toString(),
        `Tk ${(price * item.quantity).toFixed(2)}`
      ];
      tableRows.push(itemData);
    });

    autoTable(doc, {
      head: [tableColumn],
      body: tableRows,
      startY: 90,
      theme: 'grid',
      styles: { fontSize: 10, cellPadding: 4 },
      headStyles: { fillColor: [40, 40, 40], textColor: [255, 255, 255] }
    });

    // Total Amount Section
    const finalY = (doc as any).lastAutoTable.finalY || 130;
    doc.setFontSize(14);
    doc.text(`Grand Total: Tk ${newOrder.totalPrice}`, 14, finalY + 15);
    
    // Footer Signature/Stamp Area
    doc.setFontSize(10);
    doc.text("Authorized Signature & Seal", 140, finalY + 35);
    doc.setLineWidth(0.5);
    doc.line(140, finalY + 30, 190, finalY + 30);

    // Download PDF directly
    doc.save(`Delivery_Challan_${newOrder.id}.pdf`);

    setCart([]);
    setDiscountAmount(0);
    setShowOrderSuccess(true);
  };

  return (
    <div className={`min-h-screen transition-colors duration-300 ${darkMode ? 'bg-zinc-950 text-white' : 'bg-zinc-50 text-zinc-900'}`}>

      {/* SUCCESS MODAL FOR DELIVERY CHALLAN & ORDER PROCESSING */}
      {showOrderSuccess && lastOrder && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-6 animate-fade-in">
          <div className={`max-w-md w-full rounded-2xl shadow-2xl overflow-hidden ${darkMode ? 'bg-zinc-900 text-white' : 'bg-white text-zinc-900'} p-8 relative border border-zinc-200/20`}>
            {/* Top Icon & Confirmation */}
            <div className="flex flex-col items-center text-center">
              <div className="w-16 h-16 rounded-full bg-emerald-500/10 flex items-center justify-center mb-6">
                <ShieldCheck size={36} className="text-emerald-500 animate-bounce" />
              </div>
              <h3 className="text-2xl font-serif font-bold mb-2">Order Successfully Placed!</h3>
              <p className="text-sm text-zinc-500 mb-6">
                Delivery Challan (PDF) downloaded to your device & sent to our support mail at <span className="font-semibold text-amber-600">asifjahandesh@gmail.com</span>.
              </p>
            </div>

            {/* Receipt Summary */}
            <div className="bg-zinc-50 dark:bg-zinc-800/50 rounded-xl p-4 mb-6 text-sm space-y-2 border border-zinc-100 dark:border-zinc-800">
              <div className="flex justify-between font-medium">
                <span className="text-zinc-500">Order ID:</span>
                <span>{lastOrder.id}</span>
              </div>
              <div className="flex justify-between font-medium">
                <span className="text-zinc-500">Total BDT:</span>
                <span className="text-amber-600 font-bold">৳{lastOrder.totalPrice}</span>
              </div>
              <div className="flex justify-between font-medium">
                <span className="text-zinc-500">Payment:</span>
                <span className="capitalize">{lastOrder.paymentMethod}</span>
              </div>
            </div>

            {/* Emailed Directly & Manual Mailto Fallback */}
            <div className="flex flex-col gap-3">
              <a 
                href={`mailto:asifjahandesh@gmail.com?subject=New Order - ${lastOrder.id}&body=Hello JERI'S CHOICE,%0D%0A%0D%0AAn order has been placed with ID: ${lastOrder.id}.%0D%0ACustomer: ${lastOrder.customerName}%0D%0APhone: ${lastOrder.phoneNumber}%0D%0ATotal: ${lastOrder.totalPrice} BDT%0D%0A%0D%0APlease find the delivery details attached in your system.`}
                className="w-full bg-amber-500 text-white text-center py-3 font-bold rounded-xl hover:bg-amber-600 transition shadow-lg shadow-amber-500/20 flex justify-center items-center gap-2"
              >
                <Mail size={18} /> Resend Delivery Challan
              </a>
              
              <button 
                onClick={() => {
                  setShowOrderSuccess(false);
                  setCurrentTab('home');
                }}
                className="w-full bg-zinc-900 text-white dark:bg-white dark:text-zinc-900 font-bold py-3 rounded-xl hover:opacity-90 transition text-sm uppercase tracking-wider"
              >
                Continue Shopping
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Top Promotional Banner */}
      <div className="bg-black text-white text-center py-2 text-xs md:text-sm tracking-widest font-light flex justify-center items-center gap-2">
        <Sparkles size={14} className="text-amber-300" />
        EID & NEW SEASON ARRIVALS! FLAT 15% OFF SELECTED ITEMS WITH CODE: <span className="font-bold text-amber-300">JERIS10</span>
      </div>

      {/* Main Navbar */}
      <nav className={`sticky top-0 z-50 transition-colors backdrop-blur-md border-b ${darkMode ? 'bg-zinc-950/80 border-zinc-800' : 'bg-white/80 border-zinc-200'}`}>
        <div className="max-w-7xl mx-auto px-4 lg:px-8">
          <div className="flex justify-between items-center h-20">
            {/* Left side: Logo & Brands */}
            <div className="flex items-center gap-2 cursor-pointer" onClick={() => setCurrentTab('home')}>
              <div className="bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 p-2 font-serif font-bold text-2xl tracking-tighter">
                JC
              </div>
              <div className="flex flex-col">
                <span className="font-serif font-extrabold text-xl tracking-wide leading-none">JERI'S CHOICE</span>
                <span className="text-[10px] tracking-widest text-zinc-400 font-sans uppercase">Premium Fashion Bangladesh</span>
              </div>
            </div>

            {/* Middle: Desktop Menu */}
            <div className="hidden md:flex items-center space-x-8 font-medium text-sm uppercase tracking-wider">
              <button onClick={() => setCurrentTab('home')} className={`${currentTab === 'home' ? 'text-amber-500 font-bold' : ''}`}>Home</button>
              <button onClick={() => setCurrentTab('shop')} className={`${currentTab === 'shop' ? 'text-amber-500 font-bold' : ''}`}>Shop / Products</button>
              <button onClick={() => setCurrentTab('contact')} className={`${currentTab === 'contact' ? 'text-amber-500 font-bold' : ''}`}>Contact</button>
              <button onClick={() => setCurrentTab('admin')} className={`${currentTab === 'admin' ? 'text-amber-500 font-bold' : ''}`}>Admin Dashboard</button>
            </div>

            {/* Right: Actions (Dark Mode, Wishlist, Cart) */}
            <div className="flex items-center gap-6">
              <button onClick={() => setDarkMode(!darkMode)} className="hover:text-amber-500 transition">
                {darkMode ? <Sun size={20} /> : <Moon size={20} />}
              </button>

              <button onClick={() => { setCurrentTab('shop'); setSelectedCategory('All'); }} className="hover:text-amber-500 transition">
                <Search size={20} />
              </button>

              <button onClick={() => setCurrentTab('shop')} className="relative hover:text-amber-500 transition">
                <Heart size={20} />
                {wishlist.length > 0 && (
                  <span className="absolute -top-2 -right-2 bg-amber-500 text-white text-xs w-4 h-4 flex items-center justify-center rounded-full font-bold">
                    {wishlist.length}
                  </span>
                )}
              </button>

              <button onClick={() => setCurrentTab('cart')} className="relative hover:text-amber-500 transition">
                <ShoppingBag size={20} />
                {cart.length > 0 && (
                  <span className="absolute -top-2 -right-2 bg-amber-500 text-white text-xs w-4 h-4 flex items-center justify-center rounded-full font-bold">
                    {cart.reduce((sum, item) => sum + item.quantity, 0)}
                  </span>
                )}
              </button>

              {/* Mobile Menu Toggle */}
              <button className="md:hidden" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
                {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Navigation Dropdown */}
        {mobileMenuOpen && (
          <div className={`md:hidden px-6 py-4 space-y-4 border-b font-medium text-sm tracking-wide ${darkMode ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-zinc-200'}`}>
            <button onClick={() => { setCurrentTab('home'); setMobileMenuOpen(false); }} className="block w-full text-left py-2">HOME</button>
            <button onClick={() => { setCurrentTab('shop'); setMobileMenuOpen(false); }} className="block w-full text-left py-2">SHOP ALL</button>
            <button onClick={() => { setCurrentTab('contact'); setMobileMenuOpen(false); }} className="block w-full text-left py-2">CONTACT</button>
            <button onClick={() => { setCurrentTab('admin'); setMobileMenuOpen(false); }} className="block w-full text-left py-2">ADMIN DASHBOARD</button>
          </div>
        )}
      </nav>

      {/* ======================================= */}
      {/* VIEWPORT ROUTING / PAGE RENDERING       */}
      {/* ======================================= */}

      {/* 1. HOME PAGE */}
      {currentTab === 'home' && (
        <div>
          {/* Hero Section */}
          <div className="relative h-[650px] md:h-[750px] overflow-hidden">
            <img 
              src="/images/hero-banner.jpg" 
              alt="Jeri's Choice Premium Fall Winter Fashion" 
              className="absolute inset-0 w-full h-full object-cover object-center"
            />
            {/* Elegant overlay gradient */}
            <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/50 to-transparent"></div>
            
            {/* Hero Text Content */}
            <div className="relative h-full max-w-7xl mx-auto px-6 flex flex-col justify-center items-start text-white">
              <span className="bg-amber-500/20 text-amber-300 border border-amber-400/30 px-4 py-1 text-xs tracking-widest font-medium rounded-full mb-4">
                MADE IN BANGLADESH • PREMIUM WEAR
              </span>
              <h1 className="text-5xl md:text-7xl font-serif font-bold tracking-tight max-w-2xl leading-none">
                Elevate Your Everyday Aesthetic.
              </h1>
              <p className="mt-6 text-lg md:text-xl text-zinc-300 max-w-xl font-light">
                Discover modern fashion engineered from export-grade premium cotton and fabric. The finest shirts, pants, and traditional panjabis designed specifically for Bangladesh.
              </p>
              <div className="mt-10 flex flex-wrap gap-4">
                <button 
                  onClick={() => setCurrentTab('shop')} 
                  className="bg-white text-black font-semibold px-8 py-4 uppercase tracking-wider text-sm hover:bg-zinc-200 transition"
                >
                  Shop Now
                </button>
                <button 
                  onClick={() => { setCurrentTab('shop'); setSelectedCategory('Panjabi & Ethnic'); }} 
                  className="border border-white text-white font-semibold px-8 py-4 uppercase tracking-wider text-sm hover:bg-white/10 transition"
                >
                  Explore Ethnic Wear
                </button>
              </div>
            </div>
          </div>

          {/* Core Brand Value Props */}
          <div className={`border-b ${darkMode ? 'border-zinc-800' : 'border-zinc-200'} py-12`}>
            <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="flex items-center gap-4">
                <Truck className="text-amber-500 flex-shrink-0" size={32} />
                <div>
                  <h4 className="font-bold text-lg">Fast Delivery Everywhere</h4>
                  <p className="text-sm text-zinc-500 dark:text-zinc-400">All 64 districts in Bangladesh covered via Pathao/RedX.</p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <ShieldCheck className="text-amber-500 flex-shrink-0" size={32} />
                <div>
                  <h4 className="font-bold text-lg">Premium Fabric Quality</h4>
                  <p className="text-sm text-zinc-500 dark:text-zinc-400">Export-quality fine cotton, twill, and denim standards.</p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <Phone className="text-amber-500 flex-shrink-0" size={32} />
                <div>
                  <h4 className="font-bold text-lg">24/7 Support Line</h4>
                  <p className="text-sm text-zinc-500 dark:text-zinc-400">Reach us instantly via WhatsApp or standard call.</p>
                </div>
              </div>
            </div>
          </div>

          {/* Featured Categories (Grid) */}
          <div className="max-w-7xl mx-auto px-6 py-20">
            <h2 className="text-3xl font-serif font-bold text-center tracking-tight mb-12">Collections by Jeri's Choice</h2>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              {[
                { name: 'Classic Shirts', cat: 'Shirts', img: '/images/cotton-shirt.jpg' },
                { name: 'Traditional & Panjabi', cat: 'Panjabi & Ethnic', img: '/images/panjabi.jpg' },
                { name: 'Denim & Chinos', cat: 'Pants & Trousers', img: 'https://images.unsplash.com/photo-1542272604-787c3835535d?auto=format&fit=crop&q=80&w=600' },
                { name: 'Kids Daily Comfort', cat: 'Kids Wear', img: 'https://images.unsplash.com/photo-1519457431-44ccd64a579b?auto=format&fit=crop&q=80&w=600' }
              ].map((item, idx) => (
                <div 
                  key={idx} 
                  onClick={() => { setSelectedCategory(item.cat); setCurrentTab('shop'); }} 
                  className="relative h-80 group cursor-pointer overflow-hidden bg-zinc-100"
                >
                  <img src={item.img} alt={item.name} className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition duration-500" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent"></div>
                  <div className="absolute bottom-6 left-6 right-6 flex items-end justify-between">
                    <div>
                      <span className="text-xs text-amber-400 font-bold tracking-widest uppercase">Explore</span>
                      <h3 className="text-xl font-serif font-semibold text-white">{item.name}</h3>
                    </div>
                    <ArrowRight className="text-white group-hover:translate-x-2 transition duration-300" />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Featured Bestseller Products */}
          <div className="max-w-7xl mx-auto px-6 pb-20">
            <h2 className="text-3xl font-serif font-bold tracking-tight mb-10 flex justify-between items-end">
              <span>Best Selling Favorites</span>
              <button onClick={() => setCurrentTab('shop')} className="text-sm font-sans font-semibold underline underline-offset-4 tracking-wider uppercase text-zinc-500 hover:text-amber-500 transition">
                View All Items
              </button>
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-8">
              {products.slice(0, 4).map(product => {
                const finalPrice = product.price - (product.price * (product.discount / 100));
                return (
                  <div 
                    key={product.id} 
                    onClick={() => { setSelectedProduct(product); setCurrentTab('details'); }}
                    className="group cursor-pointer flex flex-col"
                  >
                    {/* Image Box */}
                    <div className="relative aspect-[3/4] bg-zinc-100 overflow-hidden mb-4">
                      <img 
                        src={product.image} 
                        alt={product.name} 
                        className="absolute inset-0 w-full h-full object-cover object-top group-hover:scale-105 transition duration-500"
                      />
                      {/* Floating Discount Badge */}
                      {product.discount > 0 && (
                        <div className="absolute top-4 left-4 bg-amber-500 text-white font-bold text-xs tracking-wider px-3 py-1 uppercase">
                          {product.discount}% OFF
                        </div>
                      )}
                      {/* Floating actions container */}
                      <div className="absolute top-4 right-4 flex flex-col gap-2">
                        <button 
                          onClick={(e) => toggleWishlist(product.id, e)} 
                          className="bg-white/80 backdrop-blur-md p-2 rounded-full hover:bg-white text-zinc-800 transition shadow-sm"
                        >
                          <Heart size={16} fill={wishlist.includes(product.id) ? 'red' : 'none'} className={wishlist.includes(product.id) ? 'text-red-500' : ''} />
                        </button>
                      </div>
                    </div>

                    {/* Meta/Prices */}
                    <div>
                      <span className="text-xs uppercase font-semibold text-zinc-400 tracking-wider block mb-1">
                        {product.category}
                      </span>
                      <h3 className="font-serif font-medium text-lg leading-tight mb-2 group-hover:text-amber-600 transition">
                        {product.name}
                      </h3>
                      <div className="flex items-center gap-3">
                        <span className="font-bold text-lg">৳{finalPrice}</span>
                        {product.discount > 0 && (
                          <span className="text-sm text-zinc-400 line-through">৳{product.price}</span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* 2. SHOP / PRODUCT LIST PAGE */}
      {currentTab === 'shop' && (
        <div className="max-w-7xl mx-auto px-6 py-12">
          {/* Top Heading */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-10 border-b pb-6 dark:border-zinc-800">
            <div>
              <h1 className="text-4xl font-serif font-bold tracking-tight">Our Collection</h1>
              <p className="text-zinc-500 mt-2 text-sm max-w-lg">
                Discover the best fabric, authentic modern styling, and comfortable fit for the local climate.
              </p>
            </div>
            
            {/* Search Input */}
            <div className="relative mt-4 md:mt-0 w-full md:w-80">
              <Search className="absolute left-3 top-2.5 text-zinc-400" size={18} />
              <input 
                type="text" 
                placeholder="Search styles, categories..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className={`pl-10 pr-4 py-2 w-full border ${darkMode ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-zinc-200'} focus:outline-none focus:border-amber-500 text-sm`}
              />
            </div>
          </div>

          {/* Filtering Side Panel & Products */}
          <div className="flex flex-col lg:flex-row gap-12">
            {/* Filter Panel */}
            <div className={`w-full lg:w-64 flex-shrink-0 space-y-8 pb-6 border-b lg:border-b-0 lg:border-r pr-6 ${darkMode ? 'border-zinc-800' : 'border-zinc-200'}`}>
              {/* Category Filters */}
              <div>
                <h4 className="font-bold text-sm tracking-wider uppercase mb-4">Categories</h4>
                <div className="space-y-3">
                  {categories.map(cat => (
                    <label key={cat} className="flex items-center gap-3 cursor-pointer">
                      <input 
                        type="radio" 
                        name="category" 
                        value={cat} 
                        checked={selectedCategory === cat}
                        onChange={() => setSelectedCategory(cat)}
                        className="accent-amber-500 w-4 h-4"
                      />
                      <span className="text-sm font-medium">{cat}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Price Filter */}
              <div>
                <h4 className="font-bold text-sm tracking-wider uppercase mb-4 flex justify-between">
                  <span>Filter by Price</span>
                  <span className="text-amber-500">৳0 - ৳{priceRange}</span>
                </h4>
                <input 
                  type="range" 
                  min={500} 
                  max={5000} 
                  step={100}
                  value={priceRange}
                  onChange={(e) => setPriceRange(Number(e.target.value))}
                  className="w-full accent-amber-500"
                />
              </div>
            </div>

            {/* Products Grid */}
            <div className="flex-1">
              {filteredProducts.length === 0 ? (
                <div className="text-center py-20">
                  <h3 className="text-xl font-bold mb-2">No Products Found</h3>
                  <p className="text-zinc-500 text-sm">Try adjusting your filters or search keywords.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-8">
                  {filteredProducts.map(product => {
                    const finalPrice = product.price - (product.price * (product.discount / 100));
                    return (
                      <div 
                        key={product.id} 
                        onClick={() => { setSelectedProduct(product); setCurrentTab('details'); }}
                        className={`group cursor-pointer flex flex-col rounded-xl overflow-hidden border ${darkMode ? 'border-zinc-800 bg-zinc-900/40 hover:border-zinc-700' : 'border-zinc-100 bg-white hover:shadow-xl'} transition-all duration-300 transform hover:-translate-y-1`}
                      >
                        {/* Image Box */}
                        <div className="relative aspect-[3/4] bg-zinc-100 overflow-hidden">
                          <img 
                            src={product.image} 
                            alt={product.name} 
                            className="absolute inset-0 w-full h-full object-cover object-top group-hover:scale-110 transition duration-700 ease-out"
                          />
                          {product.discount > 0 && (
                            <div className="absolute top-4 left-4 bg-amber-500 text-white font-bold text-xs tracking-wider px-3 py-1 uppercase">
                              {product.discount}% OFF
                            </div>
                          )}
                          <div className="absolute top-4 right-4 flex flex-col gap-2">
                            <button 
                              onClick={(e) => toggleWishlist(product.id, e)} 
                              className="bg-white/80 backdrop-blur-md p-2 rounded-full hover:bg-white text-zinc-800 transition shadow-sm"
                            >
                              <Heart size={16} fill={wishlist.includes(product.id) ? 'red' : 'none'} className={wishlist.includes(product.id) ? 'text-red-500' : ''} />
                            </button>
                          </div>
                        </div>

                        {/* Text & Price info */}
                        <div className="p-5 flex flex-col flex-1 justify-between">
                          <div>
                            <span className="text-xs uppercase font-semibold text-amber-500 tracking-wider block mb-1">
                              {product.category}
                            </span>
                            <h3 className="font-serif font-medium text-lg leading-tight mb-3 group-hover:text-amber-600 transition">
                              {product.name}
                            </h3>
                          </div>
                          <div className="flex items-center gap-3 mt-auto pt-2">
                            <span className="font-bold text-lg">৳{finalPrice}</span>
                            {product.discount > 0 && (
                              <span className="text-sm text-zinc-400 line-through">৳{product.price}</span>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 3. PRODUCT DETAILS PAGE */}
      {currentTab === 'details' && selectedProduct && (
        <div className="max-w-7xl mx-auto px-6 py-12">
          {/* Breadcrumb / Back button */}
          <button 
            onClick={() => setCurrentTab('shop')} 
            className="flex items-center gap-2 text-sm font-semibold mb-8 text-zinc-500 hover:text-amber-500 transition uppercase tracking-wider"
          >
            ← Back to products
          </button>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
            {/* Product Image */}
            <div className="relative aspect-[3/4] bg-zinc-100 overflow-hidden">
              <img 
                src={selectedProduct.image} 
                alt={selectedProduct.name} 
                className="absolute inset-0 w-full h-full object-cover object-top"
              />
              {selectedProduct.discount > 0 && (
                <div className="absolute top-4 left-4 bg-amber-500 text-white font-bold text-xs tracking-wider px-3 py-1 uppercase">
                  {selectedProduct.discount}% OFF
                </div>
              )}
            </div>

            {/* Product Detailed Information */}
            <div className="flex flex-col justify-center">
              <span className="text-sm font-semibold tracking-widest text-amber-500 uppercase">
                {selectedProduct.category}
              </span>
              <h1 className="text-4xl font-serif font-bold tracking-tight mt-2 mb-4 leading-none">
                {selectedProduct.name}
              </h1>

              {/* Price Block */}
              <div className="flex items-center gap-4 mb-6">
                <span className="text-3xl font-extrabold">
                  ৳{selectedProduct.price - (selectedProduct.price * (selectedProduct.discount / 100))}
                </span>
                {selectedProduct.discount > 0 && (
                  <span className="text-lg text-zinc-400 line-through">৳{selectedProduct.price}</span>
                )}
                {selectedProduct.stock > 0 ? (
                  <span className="bg-emerald-500/10 text-emerald-600 px-3 py-1 text-xs font-bold rounded-full">
                    IN STOCK ({selectedProduct.stock})
                  </span>
                ) : (
                  <span className="bg-rose-500/10 text-rose-600 px-3 py-1 text-xs font-bold rounded-full">
                    SOLD OUT
                  </span>
                )}
              </div>

              {/* Detailed Description */}
              <p className="text-zinc-500 dark:text-zinc-400 leading-relaxed mb-8">
                {selectedProduct.description}
              </p>

              {/* Size Selector */}
              <div className="mb-6">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-semibold uppercase tracking-wider">Select Size</span>
                </div>
                <div className="flex flex-wrap gap-3">
                  {selectedProduct.sizes.map(size => (
                    <button 
                      key={size}
                      onClick={() => setSelectedSize(size)}
                      className={`border px-5 py-2.5 font-semibold text-sm transition ${
                        selectedSize === size 
                          ? 'border-amber-500 bg-amber-500 text-white' 
                          : 'border-zinc-300 dark:border-zinc-700 hover:border-black dark:hover:border-white'
                      }`}
                    >
                      {size}
                    </button>
                  ))}
                </div>
              </div>

              {/* Color Selector */}
              <div className="mb-8">
                <span className="text-sm font-semibold uppercase tracking-wider block mb-2">Color</span>
                <div className="flex flex-wrap gap-3">
                  {selectedProduct.colors.map(color => (
                    <button 
                      key={color}
                      onClick={() => setSelectedColor(color)}
                      className={`border px-4 py-1.5 font-medium text-sm transition rounded-full ${
                        selectedColor === color 
                          ? 'border-black dark:border-white font-bold' 
                          : 'border-zinc-300 dark:border-zinc-700 text-zinc-600 dark:text-zinc-400'
                      }`}
                    >
                      {color}
                    </button>
                  ))}
                </div>
              </div>

              {/* Actions & WhatsApp Order */}
              <div className="flex flex-col gap-4">
                <button 
                  onClick={() => handleAddToCart(selectedProduct)}
                  className="bg-zinc-900 text-white dark:bg-white dark:text-zinc-900 font-bold py-4 uppercase tracking-widest text-sm hover:opacity-90 transition"
                >
                  Add To Cart
                </button>
                <button 
                  onClick={() => handleWhatsAppOrder(selectedProduct.name)}
                  className="bg-emerald-600 text-white font-bold py-4 uppercase tracking-widest text-sm hover:opacity-90 transition flex items-center justify-center gap-2"
                >
                  <ExternalLink size={18} /> Order Via WhatsApp
                </button>
              </div>

              {/* Shipping/Returns Info Box */}
              <div className="mt-8 border-t pt-6 space-y-3 text-xs text-zinc-500 dark:text-zinc-400">
                <p>🚚 Fast Cash on Delivery (COD) inside and outside Dhaka.</p>
                <p>🔄 Free returns and exchanges within 7 days in pristine condition.</p>
                <p>📞 Order helpline: +8801700-000000 (10 AM to 10 PM BST).</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 4. CART VIEW PAGE */}
      {currentTab === 'cart' && (
        <div className="max-w-7xl mx-auto px-6 py-12">
          <h1 className="text-4xl font-serif font-bold tracking-tight mb-8">Your Shopping Bag</h1>

          {cart.length === 0 ? (
            <div className="text-center py-20 border border-dashed border-zinc-300 dark:border-zinc-700">
              <ShoppingBag className="mx-auto text-zinc-300 dark:text-zinc-700 mb-4" size={48} />
              <p className="text-zinc-500 mb-6">Your shopping cart is currently empty.</p>
              <button 
                onClick={() => setCurrentTab('shop')} 
                className="bg-black text-white dark:bg-white dark:text-black font-semibold px-6 py-3 text-sm tracking-wider uppercase hover:opacity-90"
              >
                Shop Fresh Styles
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
              {/* Left Column: Cart items */}
              <div className="lg:col-span-2 space-y-6">
                {cart.map((item, index) => {
                  const finalPrice = item.product.price - (item.product.price * (item.product.discount / 100));
                  return (
                    <div key={`${item.product.id}-${index}`} className="flex gap-6 border-b pb-6 dark:border-zinc-800">
                      <img src={item.product.image} alt={item.product.name} className="w-24 h-32 object-cover" />
                      <div className="flex-1 flex flex-col justify-between">
                        <div>
                          <div className="flex justify-between items-start">
                            <h4 className="font-serif font-semibold text-lg">{item.product.name}</h4>
                            <button onClick={() => updateCartQuantity(item.product.id, -100)} className="text-zinc-400 hover:text-rose-500">
                              <Trash2 size={18} />
                            </button>
                          </div>
                          <p className="text-xs text-zinc-500 mt-1 uppercase tracking-wider">
                            Size: {item.selectedSize} | Color: {item.selectedColor}
                          </p>
                        </div>

                        {/* Quantity and Prices */}
                        <div className="flex justify-between items-end">
                          <div className="flex items-center gap-3 border dark:border-zinc-800 px-3 py-1">
                            <button onClick={() => updateCartQuantity(item.product.id, -1)} className="hover:text-amber-500">
                              <Minus size={14} />
                            </button>
                            <span className="font-bold text-sm w-4 text-center">{item.quantity}</span>
                            <button onClick={() => updateCartQuantity(item.product.id, 1)} className="hover:text-amber-500">
                              <Plus size={14} />
                            </button>
                          </div>
                          <span className="font-bold">৳{finalPrice * item.quantity}</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Right Column: Checkout Box & Coupon details */}
              <div className={`p-6 border self-start ${darkMode ? 'border-zinc-800 bg-zinc-900' : 'border-zinc-200 bg-zinc-50'}`}>
                <h3 className="font-serif font-bold text-xl mb-6">Order Summary</h3>

                {/* Promo Code input */}
                <div className="flex gap-2 mb-6">
                  <input 
                    type="text" 
                    placeholder="Coupon Code (e.g. JERIS10)"
                    value={promoCode}
                    onChange={(e) => setPromoCode(e.target.value)}
                    className="flex-1 px-3 py-2 border dark:border-zinc-700 bg-transparent text-sm focus:outline-none"
                  />
                  <button onClick={applyPromoCode} className="bg-amber-500 text-white font-bold px-4 text-sm tracking-wider uppercase">
                    Apply
                  </button>
                </div>

                {/* Costs Breakdown */}
                <div className="space-y-3 text-sm border-b dark:border-zinc-800 pb-4 mb-4">
                  <div className="flex justify-between">
                    <span className="text-zinc-500">Subtotal</span>
                    <span>৳{cartSubtotal}</span>
                  </div>
                  {discountAmount > 0 && (
                    <div className="flex justify-between text-amber-500 font-semibold">
                      <span>Discount / Coupon</span>
                      <span>-৳{discountAmount}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-zinc-500">Delivery</span>
                    <span>Calculated at checkout</span>
                  </div>
                </div>

                <div className="flex justify-between items-center text-xl font-bold mb-8">
                  <span>Estimated Total</span>
                  <span>৳{cartTotal}</span>
                </div>

                <button 
                  onClick={() => setCurrentTab('checkout')}
                  className="w-full bg-zinc-900 text-white dark:bg-white dark:text-zinc-900 font-bold py-4 text-sm tracking-wider uppercase hover:opacity-90 transition"
                >
                  Proceed To Checkout
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* 5. CHECKOUT / SECURE PAYMENT GATEWAY PAGE */}
      {currentTab === 'checkout' && (
        <div className="max-w-7xl mx-auto px-6 py-12">
          <h1 className="text-3xl font-serif font-bold tracking-tight mb-8">Secure Checkout</h1>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            {/* Form details & Bangladeshi Gateways */}
            <div>
              <form onSubmit={handleCheckoutSubmit} className="space-y-6">
                <div>
                  <label className="block text-sm font-semibold mb-2 uppercase tracking-wide">Customer Full Name</label>
                  <input 
                    type="text" 
                    required 
                    value={checkoutData.name}
                    onChange={(e) => setCheckoutData({ ...checkoutData, name: e.target.value })}
                    placeholder="Enter your name"
                    className={`w-full px-4 py-3 border ${darkMode ? 'border-zinc-800 bg-zinc-900' : 'border-zinc-200 bg-white'} focus:outline-none focus:border-amber-500`}
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold mb-2 uppercase tracking-wide">Phone Number / Mobile</label>
                  <input 
                    type="tel" 
                    required 
                    value={checkoutData.phone}
                    onChange={(e) => setCheckoutData({ ...checkoutData, phone: e.target.value })}
                    placeholder="01XXXXXXXXX"
                    className={`w-full px-4 py-3 border ${darkMode ? 'border-zinc-800 bg-zinc-900' : 'border-zinc-200 bg-white'} focus:outline-none focus:border-amber-500`}
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold mb-2 uppercase tracking-wide">Delivery Address</label>
                  <textarea 
                    required 
                    rows={3}
                    value={checkoutData.address}
                    onChange={(e) => setCheckoutData({ ...checkoutData, address: e.target.value })}
                    placeholder="House, Road, Area, District/Division..."
                    className={`w-full px-4 py-3 border ${darkMode ? 'border-zinc-800 bg-zinc-900' : 'border-zinc-200 bg-white'} focus:outline-none focus:border-amber-500`}
                  ></textarea>
                </div>

                {/* Secure Gateway Options (bKash, Nagad, etc.) */}
                <div>
                  <label className="block text-sm font-semibold mb-4 uppercase tracking-wide">Choose Payment Method</label>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-4">
                    {paymentGateways.map(gateway => (
                      <label 
                        key={gateway.id} 
                        className={`border-2 p-4 flex flex-col items-center justify-center cursor-pointer transition ${
                          checkoutData.paymentMethod === gateway.id 
                            ? 'border-amber-500 bg-amber-500/5' 
                            : 'border-zinc-200 dark:border-zinc-800'
                        }`}
                      >
                        <input 
                          type="radio" 
                          name="gateway" 
                          value={gateway.id}
                          checked={checkoutData.paymentMethod === gateway.id}
                          onChange={() => setCheckoutData({ ...checkoutData, paymentMethod: gateway.id })}
                          className="hidden"
                        />
                        <span className={`px-2 py-1 text-xs font-bold text-white rounded mb-2 ${gateway.color}`}>
                          {gateway.logo}
                        </span>
                        <span className="text-xs font-semibold text-center">{gateway.name}</span>
                      </label>
                    ))}
                  </div>

                  {/* Payment Instructions / Transaction detail field */}
                  <div className={`p-4 border rounded ${darkMode ? 'border-zinc-800 bg-zinc-950' : 'border-zinc-200 bg-zinc-50'}`}>
                    <div className="flex gap-3 items-start mb-3">
                      <AlertCircle size={20} className="text-amber-500 flex-shrink-0 mt-0.5" />
                      <div>
                        <h4 className="text-sm font-bold">Payment Gateway Instructions</h4>
                        <p className="text-xs text-zinc-500 leading-relaxed mt-1">
                          {paymentGateways.find(g => g.id === checkoutData.paymentMethod)?.instructions}
                        </p>
                      </div>
                    </div>

                    <input 
                      type="text" 
                      required 
                      value={checkoutData.paymentDetails}
                      onChange={(e) => setCheckoutData({ ...checkoutData, paymentDetails: e.target.value })}
                      placeholder="Enter TXN ID / Mobile Number used for transfer..."
                      className="w-full px-4 py-2 border border-amber-500/30 text-sm focus:outline-none"
                    />
                  </div>
                </div>

                <button 
                  type="submit"
                  className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-4 uppercase tracking-widest text-sm transition"
                >
                  Confirm & Place Order
                </button>
              </form>
            </div>

            {/* Order Review Box */}
            <div className={`p-6 border self-start ${darkMode ? 'border-zinc-800 bg-zinc-900' : 'border-zinc-200 bg-zinc-50'}`}>
              <h3 className="font-serif font-bold text-xl mb-6">Review Items & Cost</h3>
              <div className="space-y-4 mb-6 border-b pb-6 dark:border-zinc-800">
                {cart.map((item, idx) => {
                  const finalPrice = item.product.price - (item.product.price * (item.product.discount / 100));
                  return (
                    <div key={idx} className="flex justify-between text-sm">
                      <div className="flex gap-4">
                        <span className="font-semibold">{item.quantity} x</span>
                        <div>
                          <span className="font-medium block">{item.product.name}</span>
                          <span className="text-xs text-zinc-500 uppercase">
                            {item.selectedSize} / {item.selectedColor}
                          </span>
                        </div>
                      </div>
                      <span className="font-bold">৳{finalPrice * item.quantity}</span>
                    </div>
                  );
                })}
              </div>

              <div className="flex justify-between items-center text-xl font-bold">
                <span>Final Payable BDT</span>
                <span className="text-amber-600">৳{cartTotal}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 6. CONTACT PAGE */}
      {currentTab === 'contact' && (
        <div className="max-w-7xl mx-auto px-6 py-12">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
            <div>
              <h1 className="text-4xl font-serif font-bold tracking-tight mb-6">Get In Touch</h1>
              <p className="text-zinc-500 mb-8 max-w-md">
                Whether you have questions about sizing, bulk orders, or corporate clothing, we're here to assist.
              </p>

              <div className="space-y-6">
                <div className="flex items-start gap-4">
                  <MapPin className="text-amber-500 mt-1" size={24} />
                  <div>
                    <h4 className="font-bold text-sm uppercase tracking-wider">Store Location</h4>
                    <p className="text-zinc-500 text-sm mt-1">12/A, Dhanmondi Road 27, Dhaka - 1209, Bangladesh</p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <Phone className="text-amber-500 mt-1" size={24} />
                  <div>
                    <h4 className="font-bold text-sm uppercase tracking-wider">Helpline & WhatsApp</h4>
                    <p className="text-zinc-500 text-sm mt-1">+8801748-460707</p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <Mail className="text-amber-500 mt-1" size={24} />
                  <div>
                    <h4 className="font-bold text-sm uppercase tracking-wider">Business / Support Mail</h4>
                    <p className="text-zinc-500 text-sm mt-1">asifjahandesh@gmail.com</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Inquiry Form */}
            <form onSubmit={(e) => { e.preventDefault(); alert('Message sent! Our support team will respond shortly.'); }} className="space-y-6">
              <div>
                <label className="block text-sm font-semibold mb-2">Your Name</label>
                <input 
                  type="text" 
                  required 
                  placeholder="Full Name"
                  className={`w-full px-4 py-3 border ${darkMode ? 'border-zinc-800 bg-zinc-900' : 'border-zinc-200 bg-white'} focus:outline-none focus:border-amber-500`}
                />
              </div>

              <div>
                <label className="block text-sm font-semibold mb-2">Email Address</label>
                <input 
                  type="email" 
                  required 
                  placeholder="name@example.com"
                  className={`w-full px-4 py-3 border ${darkMode ? 'border-zinc-800 bg-zinc-900' : 'border-zinc-200 bg-white'} focus:outline-none focus:border-amber-500`}
                />
              </div>

              <div>
                <label className="block text-sm font-semibold mb-2">Inquiry / Message</label>
                <textarea 
                  required 
                  rows={4}
                  placeholder="Tell us what you're looking for..."
                  className={`w-full px-4 py-3 border ${darkMode ? 'border-zinc-800 bg-zinc-900' : 'border-zinc-200 bg-white'} focus:outline-none focus:border-amber-500`}
                ></textarea>
              </div>

              <button 
                type="submit"
                className="w-full bg-black text-white dark:bg-white dark:text-black font-bold py-4 uppercase tracking-widest text-sm hover:opacity-90 transition"
              >
                Send Message
              </button>
            </form>
          </div>
        </div>
      )}

      {/* 7. ADMIN DASHBOARD */}
      {currentTab === 'admin' && (
        <div className="max-w-7xl mx-auto px-6 py-12">
          {!isAdminAuthenticated ? (
            <div className="max-w-md mx-auto p-8 border dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-xl rounded text-center">
              <h2 className="text-2xl font-serif font-bold mb-2">Admin Login Required</h2>
              <p className="text-zinc-500 text-xs mb-6">Enter the administrative password to access dashboard controls.</p>
              
              <form onSubmit={(e) => {
                e.preventDefault();
                if (adminPasswordInput === '0707') {
                  setIsAdminAuthenticated(true);
                  setAdminLoginError('');
                } else {
                  setAdminLoginError('Incorrect password. Access denied.');
                }
              }} className="space-y-4">
                <div>
                  <input
                    type="password"
                    placeholder="Enter Password"
                    value={adminPasswordInput}
                    onChange={(e) => setAdminPasswordInput(e.target.value)}
                    className="w-full px-4 py-3 border dark:border-zinc-800 bg-transparent focus:outline-none text-center tracking-widest text-lg"
                    autoFocus
                  />
                  {adminLoginError && <p className="text-red-500 text-xs mt-2 font-bold">{adminLoginError}</p>}
                </div>
                <button
                  type="submit"
                  className="w-full bg-amber-500 hover:bg-amber-600 text-white font-bold py-3 uppercase tracking-wider text-xs transition rounded"
                >
                  Unlock Admin Dashboard
                </button>
              </form>
            </div>
          ) : (
            <>
              <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-10 border-b pb-6 dark:border-zinc-800">
            <div>
              <h1 className="text-4xl font-serif font-bold tracking-tight">Admin Dashboard</h1>
              <p className="text-zinc-500 mt-2 text-sm max-w-lg">
                Manage all store catalog products, check orders, update delivery status, and handle inventory.
              </p>
            </div>
          </div>

          {/* Top Stat Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-12">
            <div className={`p-6 border ${darkMode ? 'border-zinc-800 bg-zinc-900' : 'border-zinc-200 bg-zinc-50'}`}>
              <h4 className="text-xs uppercase font-bold tracking-wider text-zinc-500 mb-2">Total Orders</h4>
              <p className="text-4xl font-serif font-bold">{orders.length}</p>
            </div>

            <div className={`p-6 border ${darkMode ? 'border-zinc-800 bg-zinc-900' : 'border-zinc-200 bg-zinc-50'}`}>
              <h4 className="text-xs uppercase font-bold tracking-wider text-zinc-500 mb-2">Product Catalog</h4>
              <p className="text-4xl font-serif font-bold">{products.length}</p>
            </div>

            <div className={`p-6 border ${darkMode ? 'border-zinc-800 bg-zinc-900' : 'border-zinc-200 bg-zinc-50'}`}>
              <h4 className="text-xs uppercase font-bold tracking-wider text-zinc-500 mb-2">Total BDT Sales</h4>
              <p className="text-4xl font-serif font-bold text-amber-500">
                ৳{orders.reduce((acc, order) => acc + order.totalPrice, 0)}
              </p>
            </div>
          </div>

          {/* Admin Panels: Add Product & Recent Orders */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
            {/* Left: Add New Product Form */}
            <div className="lg:col-span-1 space-y-6">
              <h3 className="text-xl font-serif font-bold">Add New Product</h3>
              <form onSubmit={handleAddProduct} className={`space-y-4 p-6 border ${darkMode ? 'border-zinc-800 bg-zinc-900' : 'border-zinc-200 bg-zinc-50'}`}>
                <div>
                  <label className="block text-xs font-bold uppercase mb-1">Product Name</label>
                  <input 
                    type="text" 
                    required 
                    value={newProduct.name}
                    onChange={(e) => setNewProduct({ ...newProduct, name: e.target.value })}
                    className="w-full px-3 py-2 border dark:border-zinc-800 bg-transparent text-sm focus:outline-none"
                    placeholder="Premium Button-Down Shirt"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase mb-1">Category</label>
                  <select 
                    value={newProduct.category}
                    onChange={(e) => setNewProduct({ ...newProduct, category: e.target.value })}
                    className="w-full px-3 py-2 border dark:border-zinc-800 bg-transparent text-sm focus:outline-none"
                  >
                    {categories.filter(c => c !== 'All').map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold uppercase mb-1">Base Price (৳)</label>
                    <input 
                      type="number" 
                      required 
                      value={newProduct.price}
                      onChange={(e) => setNewProduct({ ...newProduct, price: e.target.value })}
                      className="w-full px-3 py-2 border dark:border-zinc-800 bg-transparent text-sm focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase mb-1">Discount (%)</label>
                    <input 
                      type="number" 
                      value={newProduct.discount}
                      onChange={(e) => setNewProduct({ ...newProduct, discount: e.target.value })}
                      className="w-full px-3 py-2 border dark:border-zinc-800 bg-transparent text-sm focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase mb-1">Stock Count</label>
                  <input 
                    type="number" 
                    value={newProduct.stock}
                    onChange={(e) => setNewProduct({ ...newProduct, stock: e.target.value })}
                    className="w-full px-3 py-2 border dark:border-zinc-800 bg-transparent text-sm focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase mb-1">Description</label>
                  <textarea 
                    rows={2}
                    value={newProduct.description}
                    onChange={(e) => setNewProduct({ ...newProduct, description: e.target.value })}
                    className="w-full px-3 py-2 border dark:border-zinc-800 bg-transparent text-sm focus:outline-none"
                  ></textarea>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase mb-1">Upload Product Photo</label>
                  <input 
                    type="file" 
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="w-full text-xs file:mr-4 file:py-2 file:px-4 file:border-0 file:text-xs file:font-semibold file:bg-amber-500 file:text-white hover:file:bg-amber-600"
                  />
                </div>

                <button 
                  type="submit"
                  className="w-full bg-amber-500 hover:bg-amber-600 text-white font-bold py-3 uppercase tracking-wider text-xs transition"
                >
                  Create Product Listing
                </button>
              </form>

              {/* Edit/Update Existing Products Panel */}
              <div className="mt-8 space-y-4">
                <h3 className="text-xl font-serif font-bold">Update Existing Products</h3>
                <div className={`p-6 border ${darkMode ? 'border-zinc-800 bg-zinc-900' : 'border-zinc-200 bg-zinc-50'}`}>
                  {editingProduct ? (
                    <form onSubmit={handleUpdateProduct} className="space-y-4">
                      <div>
                        <label className="block text-xs font-bold uppercase mb-1">Editing Product Name</label>
                        <input
                          type="text"
                          required
                          value={editingProduct.name}
                          onChange={(e) => setEditingProduct({ ...editingProduct, name: e.target.value })}
                          className="w-full px-3 py-2 border dark:border-zinc-800 bg-transparent text-sm focus:outline-none"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-bold uppercase mb-1">Price (৳)</label>
                          <input
                            type="number"
                            required
                            value={editingProduct.price}
                            onChange={(e) => setEditingProduct({ ...editingProduct, price: Number(e.target.value) })}
                            className="w-full px-3 py-2 border dark:border-zinc-800 bg-transparent text-sm focus:outline-none"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-bold uppercase mb-1">Discount (%)</label>
                          <input
                            type="number"
                            value={editingProduct.discount}
                            onChange={(e) => setEditingProduct({ ...editingProduct, discount: Number(e.target.value) })}
                            className="w-full px-3 py-2 border dark:border-zinc-800 bg-transparent text-sm focus:outline-none"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="block text-xs font-bold uppercase mb-1">Stock Count</label>
                        <input
                          type="number"
                          value={editingProduct.stock}
                          onChange={(e) => setEditingProduct({ ...editingProduct, stock: Number(e.target.value) })}
                          className="w-full px-3 py-2 border dark:border-zinc-800 bg-transparent text-sm focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold uppercase mb-1">Description</label>
                        <textarea
                          rows={2}
                          value={editingProduct.description}
                          onChange={(e) => setEditingProduct({ ...editingProduct, description: e.target.value })}
                          className="w-full px-3 py-2 border dark:border-zinc-800 bg-transparent text-sm focus:outline-none"
                        ></textarea>
                      </div>
                      <div>
                        <label className="block text-xs font-bold uppercase mb-1">Change Image (Upload)</label>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleEditProductImageUpload}
                          className="w-full text-xs file:mr-4 file:py-2 file:px-4 file:border-0 file:text-xs file:font-semibold file:bg-amber-500 file:text-white hover:file:bg-amber-600"
                        />
                      </div>
                      <div className="flex gap-2">
                        <button
                          type="submit"
                          className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2 uppercase tracking-wider text-xs transition"
                        >
                          Save Changes
                        </button>
                        <button
                          type="button"
                          onClick={() => setEditingProduct(null)}
                          className="px-4 bg-zinc-300 dark:bg-zinc-700 font-bold py-2 uppercase tracking-wider text-xs transition"
                        >
                          Cancel
                        </button>
                      </div>
                    </form>
                  ) : (
                    <div className="space-y-2 max-h-60 overflow-y-auto pr-2">
                      <p className="text-xs text-zinc-500 mb-2">Select a product below to edit details or update price:</p>
                      {products.map(p => (
                        <div key={p.id} className="flex justify-between items-center text-xs p-2 border dark:border-zinc-800 rounded bg-white dark:bg-zinc-950">
                          <span className="truncate flex-1 font-medium">{p.name} - ৳{p.price}</span>
                          <button
                            type="button"
                            onClick={() => setEditingProduct(p)}
                            className="bg-amber-500 hover:bg-amber-600 text-white px-3 py-1 font-bold rounded"
                          >
                            Edit
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Right: Order Status Management Panel */}
            <div className="lg:col-span-2 space-y-6">
              <h3 className="text-xl font-serif font-bold">Recent Customer Orders</h3>

              {orders.length === 0 ? (
                <div className="text-center py-20 border border-dashed border-zinc-300 dark:border-zinc-700">
                  <Package className="mx-auto text-zinc-300 dark:text-zinc-700 mb-4" size={48} />
                  <p className="text-zinc-500 mb-2">No orders placed yet.</p>
                  <p className="text-xs text-zinc-400">Place an order via Checkout to view and manage it here.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {orders.map(order => (
                    <div key={order.id} className={`p-5 border ${darkMode ? 'border-zinc-800 bg-zinc-900' : 'border-zinc-200 bg-white'}`}>
                      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b pb-4 mb-4 dark:border-zinc-800">
                        <div>
                          <span className="text-xs font-bold bg-amber-500/10 text-amber-600 px-2 py-1 rounded">
                            {order.id}
                          </span>
                          <h4 className="font-bold text-lg mt-2">{order.customerName}</h4>
                          <p className="text-xs text-zinc-500">{order.phoneNumber} • {order.address}</p>
                        </div>

                        {/* Order Status Control & Download Challan */}
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => setActiveChalanOrder(order)}
                            className="bg-zinc-900 dark:bg-zinc-100 text-white dark:text-black font-bold text-xs px-3 py-1.5 rounded hover:opacity-80 transition"
                          >
                            View Chalan
                          </button>

                          <label className="text-xs font-bold uppercase tracking-wider text-zinc-500">Status:</label>
                          <select 
                            value={order.status}
                            onChange={(e) => {
                              const update = orders.map(o => o.id === order.id ? { ...o, status: e.target.value as any } : o);
                              setOrders(update);
                            }}
                            className="bg-zinc-100 dark:bg-zinc-800 border-none px-3 py-1 font-bold text-xs"
                          >
                            <option value="Pending">Pending</option>
                            <option value="Confirmed">Confirmed</option>
                            <option value="Delivered">Delivered</option>
                          </select>
                        </div>
                      </div>

                      {/* Purchased products list & gateway info */}
                      <div className="space-y-2 mb-4">
                        <span className="text-xs font-bold uppercase tracking-wider text-zinc-400 block mb-1">Purchased Garments:</span>
                        {order.products.map((item, idx) => (
                          <div key={idx} className="flex justify-between text-xs">
                            <span>{item.quantity} x {item.product.name} ({item.selectedSize}/{item.selectedColor})</span>
                            <span className="font-medium">৳{item.product.price}</span>
                          </div>
                        ))}
                      </div>

                      {/* Payment Verification / Details */}
                      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-zinc-50 dark:bg-zinc-950 p-3 rounded gap-2">
                        <div className="text-xs">
                          <span className="font-bold text-zinc-400">Payment Gateway:</span>{' '}
                          <span className="uppercase font-bold text-amber-500">{order.paymentMethod}</span>
                          <span className="block mt-0.5 text-zinc-500">Details/Txn ID: {order.paymentDetails}</span>
                        </div>
                        <span className="text-base font-extrabold text-emerald-600">Total: ৳{order.totalPrice}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
          </>
          )}
        </div>
      )}

      {/* Beautiful Web Detail Delivery Chalan Modal */}
      {activeChalanOrder && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex justify-center items-center p-4 overflow-y-auto">
          <div className="bg-white text-black max-w-2xl w-full rounded-xl shadow-2xl p-8 relative my-8">
            {/* Action Header */}
            <div className="flex justify-between items-center mb-6 border-b pb-4">
              <span className="font-bold text-xs uppercase tracking-wider text-zinc-400">Order Delivery Chalan</span>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => window.print()}
                  className="bg-amber-600 text-white font-bold text-xs px-4 py-2 rounded hover:bg-amber-500 transition shadow-sm print:hidden"
                >
                  🖨️ Print Chalan
                </button>
                <button
                  onClick={() => setActiveChalanOrder(null)}
                  className="bg-zinc-200 text-zinc-800 font-bold text-xs px-4 py-2 rounded hover:bg-zinc-300 transition print:hidden"
                >
                  Close
                </button>
              </div>
            </div>

            {/* Print Header / Business Details */}
            <div className="text-center mb-8">
              <h2 className="font-serif font-extrabold text-3xl tracking-widest text-black">JERI'S CHOICE</h2>
              <div className="inline-block bg-black text-white font-extrabold text-xs px-3 py-1 mt-2 tracking-widest rounded-sm">CHALAN COPY</div>
              <p className="text-zinc-500 text-xs mt-3 font-medium">Contact: +8801748-460707 &nbsp;|&nbsp; Email: asifjahandesh@gmail.com</p>
            </div>

            {/* Information Grid */}
            <div className="grid grid-cols-2 gap-6 border-y py-4 mb-6 text-xs">
              <div>
                <h4 className="font-bold text-zinc-400 uppercase tracking-wider mb-2">Customer Information</h4>
                <p className="font-bold text-sm text-black">{activeChalanOrder.customerName}</p>
                <p className="text-zinc-600 mt-1">{activeChalanOrder.address}</p>
                <p className="text-zinc-600 mt-1">Phone: {activeChalanOrder.phoneNumber}</p>
              </div>
              <div>
                <h4 className="font-bold text-zinc-400 uppercase tracking-wider mb-2">Delivery & Reference</h4>
                <p className="text-zinc-600"><strong className="text-black">Order Ref:</strong> {activeChalanOrder.id}</p>
                <p className="text-zinc-600 mt-1"><strong className="text-black">Delivery Timestamp:</strong> {new Date().toLocaleString()}</p>
                <p className="text-zinc-600 mt-1"><strong className="text-black">Payment Gateway:</strong> {activeChalanOrder.paymentMethod}</p>
              </div>
            </div>

            {/* Order Line Items */}
            <div className="mb-6">
              <h4 className="font-bold text-zinc-400 text-xs uppercase tracking-wider mb-3">Order Description</h4>
              <div className="border rounded divide-y">
                {activeChalanOrder.products.map((item, idx) => {
                  const unitPrice = item.product.price - (item.product.price * (item.product.discount / 100));
                  return (
                    <div key={idx} className="flex justify-between items-center p-3 text-sm">
                      <div>
                        <span className="font-bold text-black">{item.product.name}</span>
                        <span className="text-zinc-500 text-xs block mt-0.5">Size/Color: {item.selectedSize} / {item.selectedColor}</span>
                      </div>
                      <div className="text-right">
                        <span className="text-xs text-zinc-400 block">{item.quantity} x Tk {unitPrice}</span>
                        <span className="font-extrabold text-black">Tk {unitPrice * item.quantity}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Due / Payment Status Banner */}
            <div className="bg-zinc-50 border p-4 rounded flex justify-between items-center">
              <div>
                <span className="text-xs font-bold text-zinc-500 block">Total Amount</span>
                <span className="font-extrabold text-lg text-black mt-0.5 block">
                  Tk {activeChalanOrder.totalPrice}
                </span>
              </div>
              <div className="text-right">
                <span className="text-xs text-zinc-400 block">Authorized Signatory</span>
                <div className="border-b-2 border-black w-32 mt-6"></div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Footer Branding Requirements */}
      <footer className="bg-black text-white py-12 mt-20">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-6">
          {/* Business Name */}
          <div className="text-center md:text-left">
            <h3 className="font-serif font-extrabold text-2xl tracking-wide">JERI'S CHOICE</h3>
            <p className="text-zinc-400 text-xs mt-1">Authentic Garments Manufacturer & Retailer in Bangladesh.</p>
            <p className="text-amber-500 text-xs mt-2 font-medium">📞 +8801748-460707 &nbsp;|&nbsp; ✉️ asifjahandesh@gmail.com</p>
          </div>

          {/* Socials / Help Links */}
          <div className="flex gap-6 text-sm text-zinc-400">
            <button onClick={() => setCurrentTab('shop')} className="hover:underline">Shop</button>
            <button onClick={() => setCurrentTab('contact')} className="hover:underline">Contact Support</button>
            <button onClick={() => setCurrentTab('admin')} className="hover:underline">Admin Panel</button>
          </div>

          {/* Specific Copyright Text Required in Prompt */}
          <div className="text-xs text-zinc-400 font-light tracking-wider">
            © All rights reserved - Asif
          </div>
        </div>
      </footer>
    </div>
  );
}