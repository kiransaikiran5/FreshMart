import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { getWishlist } from '../services/api';
import { useAuth } from './AuthContext';

const WishlistContext = createContext();

export function WishlistProvider({ children }) {
  const [wishlistItems, setWishlistItems] = useState([]);
  const [wishlistIds, setWishlistIds] = useState(new Set());
  const { user } = useAuth();

  const fetchWishlist = useCallback(async () => {
    if (!user) {
      setWishlistItems([]);
      setWishlistIds(new Set());
      return;
    }
    try {
      const { data } = await getWishlist();
      setWishlistItems(data);
      setWishlistIds(new Set(data.map(item => item.product_id)));
    } catch {
      setWishlistItems([]);
      setWishlistIds(new Set());
    }
  }, [user]);

  useEffect(() => {
    fetchWishlist();
  }, [fetchWishlist]);

  const isInWishlist = (productId) => wishlistIds.has(productId);
  const wishlistCount = wishlistItems.length;

  return (
    <WishlistContext.Provider value={{ wishlistItems, wishlistIds, wishlistCount, isInWishlist, fetchWishlist }}>
      {children}
    </WishlistContext.Provider>
  );
}

export const useWishlist = () => useContext(WishlistContext);