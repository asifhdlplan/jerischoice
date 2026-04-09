export interface Product {
  id: string;
  name: string;
  category: string;
  price: number;
  discount: number; // percentage
  description: string;
  image: string;
  stock: number;
  sizes: string[];
  colors: string[];
}

export interface Order {
  id: string;
  customerName: string;
  phoneNumber: string;
  address: string;
  products: { product: Product; quantity: number; selectedSize?: string; selectedColor?: string }[];
  totalPrice: number;
  paymentMethod: string;
  paymentDetails: string; // e.g., txn id or bKash number
  status: 'Pending' | 'Confirmed' | 'Delivered';
  date: string;
}

export const initialProducts: Product[] = [
  {
    id: 'p1',
    name: 'Premium Oxford Cotton Shirt',
    category: 'Shirts',
    price: 1850,
    discount: 15,
    description: 'Crisp, high-quality Oxford cotton shirt suitable for office wear and smart-casual outings. Crafted in Bangladesh with finest export-grade fabrics.',
    image: '/images/cotton-shirt.jpg',
    stock: 25,
    sizes: ['M', 'L', 'XL', 'XXL'],
    colors: ['Navy Blue', 'White', 'Black']
  },
  {
    id: 'p2',
    name: 'Classic Black Panjabi with Embroidery',
    category: 'Panjabi & Ethnic',
    price: 2450,
    discount: 10,
    description: 'Elegant modern fit panjabi crafted from premium soft blended cotton. Features subtle thread-work embroidery perfect for festive and casual traditional occasions.',
    image: '/images/panjabi.jpg',
    stock: 40,
    sizes: ['40', '42', '44'],
    colors: ['Black']
  },
  {
    id: 'p3',
    name: 'Slim Fit Denim Jeans',
    category: 'Pants & Trousers',
    price: 2100,
    discount: 0,
    description: 'Stretchable slim fit denim jeans in medium blue wash. Highly durable, comfortable waist line, perfect for daily wear.',
    image: 'https://images.unsplash.com/photo-1542272604-787c3835535d?auto=format&fit=crop&q=80&w=600',
    stock: 30,
    sizes: ['30', '32', '34', '36'],
    colors: ['Blue Wash', 'Dark Indigo']
  },
  {
    id: 'p4',
    name: 'Cotton Casual Summer T-Shirt',
    category: 'T-Shirts',
    price: 650,
    discount: 20,
    description: '100% pure combed cotton round neck T-shirt. Soft, breathable, and pre-shrunk for maximum comfort during hot and humid days.',
    image: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&q=80&w=600',
    stock: 60,
    sizes: ['S', 'M', 'L', 'XL'],
    colors: ['Olive Green', 'Maroon', 'Charcoal']
  },
  {
    id: 'p5',
    name: 'Formal Pleated Trousers',
    category: 'Pants & Trousers',
    price: 1950,
    discount: 5,
    description: 'Tailored fit pleated trousers made from premium twill fabric. Excellent drape, suitable for corporate workwear or formal evenings.',
    image: 'https://images.unsplash.com/photo-1594938298603-c8148c4dae35?auto=format&fit=crop&q=80&w=600',
    stock: 15,
    sizes: ['30', '32', '34', '36'],
    colors: ['Charcoal Grey', 'Navy', 'Tan']
  },
  {
    id: 'p6',
    name: 'Kids Graphic Printed T-Shirt',
    category: 'Kids Wear',
    price: 450,
    discount: 0,
    description: 'Playful cartoon and pattern graphic printed tees for kids. Premium soft knit cotton perfect for delicate skin.',
    image: 'https://images.unsplash.com/photo-1519457431-44ccd64a579b?auto=format&fit=crop&q=80&w=600',
    stock: 20,
    sizes: ['2-4Y', '4-6Y', '6-8Y'],
    colors: ['Yellow', 'Red', 'Sky Blue']
  }
];

export const paymentGateways = [
  {
    id: 'bkash',
    name: 'bKash',
    color: 'bg-pink-600',
    logo: '৳ bKash',
    instructions: 'Send money/payment to bKash Merchant Number: 01748460707. Then enter your Transaction ID and Sender Number below.',
  },
  {
    id: 'nagad',
    name: 'Nagad',
    color: 'bg-orange-600',
    logo: '৳ Nagad',
    instructions: 'Send money to Nagad Merchant: 016XXXXXXXX. Provide the Sender Number & TXN ID.',
  },
  {
    id: 'upay',
    name: 'Upay',
    color: 'bg-blue-600',
    logo: '৳ Upay',
    instructions: 'Make payment via Upay to 018XXXXXXXX. Enter your transaction details for verification.',
  },
  {
    id: 'rocket',
    name: 'Rocket',
    color: 'bg-purple-600',
    logo: '৳ Rocket',
    instructions: 'Make DBBL Rocket payment to 019XXXXXXXX. Input the exact 12-digit mobile number and TXN ID.',
  },
  {
    id: 'dbbl',
    name: 'DBBL Nexus / Visa',
    color: 'bg-indigo-600',
    logo: '💳 DBBL Card/Net Banking',
    instructions: 'Select DBBL for direct bank transfer/gateway simulation. Enter card details or transaction reference.',
  },
  {
    id: 'cod',
    name: 'Cash On Delivery',
    color: 'bg-emerald-600',
    logo: '📦 COD',
    instructions: 'Pay directly via Cash when the delivery man arrives at your doorstep.',
  }
];