"use client";
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  selected: boolean;
  image?: string;
  unit?: string;
  storeId?: string;
}

interface CartContextType {
  items: CartItem[];
  addToCart: (product: any) => void;
  removeFromCart: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  toggleSelection: (productId: string) => void;
  clearCart: () => void;
  clearSelected: () => void;
  totalItems: number;
  totalPrice: number;
  selectedItemsCount: number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);

  useEffect(() => {
    const savedCart = localStorage.getItem('afrigari_cart');
    if (savedCart) {
      try {
        setItems(JSON.parse(savedCart));
      } catch (e) {
        console.error("Erreur chargement panier", e);
      }
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('afrigari_cart', JSON.stringify(items));
  }, [items]);

  const addToCart = (product: any) => {
    setItems(prev => {
      const existing = prev.find(item => item.id === product.id);
      if (existing) {
        return prev.map(item => 
          item.id === product.id ? { ...item, quantity: item.quantity + 1, selected: true } : item
        );
      }
      return [...prev, { 
        id: product.id, 
        name: product.name, 
        price: Number(product.price), 
        quantity: 1, 
        selected: true,
        image: product.image,
        unit: product.unit,
        storeId: product.storeId || product.store?.id
      }];
    });
  };

  const removeFromCart = (productId: string) => {
    setItems(prev => prev.filter(item => item.id !== productId));
  };

  const updateQuantity = (productId: string, quantity: number) => {
    if (quantity < 1) return;
    setItems(prev => prev.map(item => 
      item.id === productId ? { ...item, quantity } : item
    ));
  };

  const toggleSelection = (productId: string) => {
    setItems(prev => prev.map(item => 
      item.id === productId ? { ...item, selected: !item.selected } : item
    ));
  };

  const clearCart = () => setItems([]);
  
  const clearSelected = () => {
    setItems(prev => prev.filter(item => !item.selected));
  };

  const totalItems = items.reduce((acc, item) => acc + item.quantity, 0);
  const selectedItemsCount = items.reduce((acc, item) => acc + (item.selected ? item.quantity : 0), 0);
  const totalPrice = items.reduce((acc, item) => acc + (item.selected ? (item.price * item.quantity) : 0), 0);

  return (
    <CartContext.Provider value={{ items, addToCart, removeFromCart, updateQuantity, toggleSelection, clearCart, clearSelected, totalItems, totalPrice, selectedItemsCount }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}
