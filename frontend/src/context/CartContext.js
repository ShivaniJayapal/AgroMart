import { createContext, useContext, useEffect, useState, useCallback } from "react";
import api from "../services/api";

const CartContext = createContext();

export function CartProvider({ children }) {
  const [cartItems, setCartItems] = useState([]);
  const [favorites, setFavorites] = useState([]);
  const loading = false;

  const token = localStorage.getItem("token");

  const loadFavorites = useCallback(async () => {
    if (!token) return;
    const headers = { Authorization: `Bearer ${token}` };
    try {
      const res = await api.get("/favorites/my", { headers });
      setFavorites(res.data);
    } catch (err) {
      console.error("Favorites fetch error", err);
      setFavorites([]);
    }
  }, [token]);

  const persistFavorites = useCallback(async (productId, add) => {
    const currentToken = localStorage.getItem("token");
    if (!currentToken) return;
    const headers = { Authorization: `Bearer ${currentToken}` };
    try {
      if (add) {
        await api.post("/favorites/add", { productId }, { headers });
      } else {
        await api.delete("/favorites/remove", { data: { productId }, headers });
      }
    } catch (err) {
      console.error("Favorite persist error", err);
    }
  }, []);

  // Wrap fetchCart in useCallback to prevent infinite loops
  // Inside CartProvider, get the token FRESH inside each function
  const fetchCart = useCallback(async () => {
    const currentToken = localStorage.getItem("token"); // Get it here!
    if (!currentToken) return;
  
    const headers = { Authorization: `Bearer ${currentToken}` };
    try {
      const res = await api.get("/cart/my", { headers });
      setCartItems(res.data);
    } catch (err) {
      console.error("Cart fetch error", err);
      setCartItems([]);}
    }, []);

  const addToCart = async (productId, quantity = 1) => {
    if (!token) throw new Error("Login required");
    const headers = { Authorization: `Bearer ${token}` };
    const qty = Number(quantity);
    if (qty < 1) throw new Error("Quantity must be at least 1");
    
    const res = await api.post(
      "/cart/add",
      { productId, quantity: qty },
      { headers }
    );
    await fetchCart();
    return res.data;
  };

  const removeFromCart = async (cartId) => {
    const headers = { Authorization: `Bearer ${token}` };
    await api.delete(`/cart/remove/${cartId}`, { headers });
    await fetchCart();
  };

  const updateQuantity = async (cartId, quantity) => {
    const headers = { Authorization: `Bearer ${token}` };
    const qty = Number(quantity);
    if (qty < 1) throw new Error("Quantity must be at least 1");
    
    await api.put(
      `/cart/update/${cartId}`,
      { quantity: qty },
      { headers }
    );
    await fetchCart();
  };

  const toggleFavorite = useCallback(async (product) => {
    const exists = favorites.find((x) => x._id === product._id);
    let next;
    if (exists) {
      next = favorites.filter((x) => x._id !== product._id);
      await persistFavorites(product._id, false);
    } else {
      next = [...favorites, product];
      await persistFavorites(product._id, true);
    }
    setFavorites(next);
  }, [favorites, persistFavorites]);

  useEffect(() => {
    loadFavorites();
  }, [loadFavorites]);

  useEffect(() => {
    fetchCart();
  }, [fetchCart]);

  return (
    <CartContext.Provider
      value={{
        cartItems,
        favorites,
        loading,
        fetchCart,
        addToCart,
        removeFromCart,
        updateQuantity,
        toggleFavorite,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  return useContext(CartContext);
}