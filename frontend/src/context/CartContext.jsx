import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { getCart } from '../services/api';
import { useAuth } from './AuthContext';

const CartContext = createContext();

export function CartProvider({ children }) {
  const [cartItems, setCartItems] = useState([]);
  const [cartTotal, setCartTotal] = useState(0);
  const [cartCount, setCartCount] = useState(0);
  const { user } = useAuth();

  const fetchCart = useCallback(async () => {
    if (!user) {
      setCartItems([]);
      setCartTotal(0);
      setCartCount(0);
      return;
    }
    try {
      const { data } = await getCart();
      setCartItems(data.items || []);
      setCartTotal(data.total || 0);
      setCartCount(data.items?.reduce((sum, i) => sum + i.quantity, 0) || 0);
    } catch {
      setCartItems([]);
      setCartTotal(0);
      setCartCount(0);
    }
  }, [user]);

  useEffect(() => {
    fetchCart();
  }, [fetchCart]);

  return (
    <CartContext.Provider value={{ cartItems, cartTotal, cartCount, fetchCart }}>
      {children}
    </CartContext.Provider>
  );
}

export const useCart = () => useContext(CartContext);