import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axios from "axios";

const API_URL = "http://localhost:8080/order";
export const CART_STORAGE_KEY = "bistro_bliss_cart_items";
const CART_STORAGE_PREFIX = `${CART_STORAGE_KEY}_`;

function normalizeStoredCartItems(rawItems) {
  if (!Array.isArray(rawItems)) return [];

  return rawItems
    .map((item) => {
      if (!item || typeof item !== "object") return null;
      if (!item._id) return null;

      const quantity = Math.max(1, Number(item.quantity) || 1);
      const specialInstructions = String(item.specialInstructions || "").slice(0, 200);

      return {
        ...item,
        quantity,
        specialInstructions,
      };
    })
    .filter(Boolean);
}

export function getCartOwnerKey(userData) {
  if (!userData || typeof userData !== "object") return null;

  const email = String(userData.email || "")
    .trim()
    .toLowerCase();
  if (email) return `email:${email}`;

  const userId = String(userData._id || "").trim();
  if (userId) return `id:${userId}`;

  return null;
}

function getScopedStorageKey(ownerKey) {
  if (!ownerKey) return null;
  return `${CART_STORAGE_PREFIX}${encodeURIComponent(ownerKey)}`;
}

export function loadCartItemsForOwner(ownerKey) {
  if (typeof window === "undefined" || !ownerKey) return [];

  try {
    const scopedStorageKey = getScopedStorageKey(ownerKey);
    const rawScopedValue = scopedStorageKey
      ? localStorage.getItem(scopedStorageKey)
      : null;
    if (rawScopedValue) {
      return normalizeStoredCartItems(JSON.parse(rawScopedValue));
    }

    // Backward compatibility with previous single-key cart storage.
    const legacyRawValue = localStorage.getItem(CART_STORAGE_KEY);
    if (!legacyRawValue) return [];

    const migratedItems = normalizeStoredCartItems(JSON.parse(legacyRawValue));

    if (scopedStorageKey) {
      localStorage.setItem(scopedStorageKey, JSON.stringify(migratedItems));
    }
    localStorage.removeItem(CART_STORAGE_KEY);

    return migratedItems;
  } catch (error) {
    return [];
  }
}

export function saveCartItemsForOwner(ownerKey, cartItems) {
  if (typeof window === "undefined" || !ownerKey) return;

  const scopedStorageKey = getScopedStorageKey(ownerKey);
  if (!scopedStorageKey) return;

  try {
    localStorage.setItem(
      scopedStorageKey,
      JSON.stringify(normalizeStoredCartItems(cartItems))
    );
  } catch (error) {
    // Ignore storage write issues (private mode, quota, etc.)
  }
}

//Send order to Backend
export const placeOrder = createAsyncThunk(
  "cart/placeOrder",
  async (payload, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem("token"); // Get JWT token
      const normalizedPayload = Array.isArray(payload) ? { cartItems: payload } : payload || {};
      const {
        cartItems = [],
        paymentMethod = "cash",
        paymentIntentId = null,
      } = normalizedPayload;

      if (!Array.isArray(cartItems) || cartItems.length === 0) {
        return rejectWithValue("Your cart is empty.");
      }

      // Prepare data to match your Mongoose Schema
      const orderData = {
        items: cartItems.map((item) => ({
          product: item._id, // MongoDB ID
          quantity: item.quantity,
          price: item.price,
          specialInstructions: item.specialInstructions || "",
        })),
        paymentMethod,
        paymentIntentId,
      };

      const response = await axios.post(API_URL, orderData, {
        headers: { Authorization: `Bearer ${token}` },
      });

      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || "Order Failed");
    }
  }
);

const cartSlice = createSlice({
  name: "cart",
  initialState: {
    items: [],
    ownerKey: null,
    loading: false,
    error: null,
  },
  reducers: {
    hydrateCartForUser: (state, action) => {
      const { ownerKey, items } = action.payload || {};
      state.ownerKey = ownerKey || null;
      state.items = normalizeStoredCartItems(items);
      state.error = null;
    },
    resetCartSession: (state) => {
      state.ownerKey = null;
      state.items = [];
      state.error = null;
    },
    addToCart: (state, action) => {
      const existing = state.items.find((i) => i._id === action.payload._id);
      if (existing) {
        existing.quantity += 1;
      } else {
        state.items.push({
          ...action.payload,
          quantity: 1,
          specialInstructions: action.payload.specialInstructions || "",
        });
      }
    },
    setItemSpecialInstructions: (state, action) => {
      const { itemId, specialInstructions } = action.payload || {};
      const item = state.items.find((i) => i._id === itemId);
      if (!item) return;
      item.specialInstructions = String(specialInstructions || "").slice(0, 200);
    },
    removeFromCart: (state, action) => {
      state.items = state.items.filter((i) => i._id !== action.payload);
    },
    increaseQuantity: (state, action) => {
      const item = state.items.find((i) => i._id === action.payload);
      if (item) item.quantity += 1;
    },
    decreaseQuantity: (state, action) => {
      const item = state.items.find((i) => i._id === action.payload);
      if (item && item.quantity > 1) {
        item.quantity -= 1;
      } else {
        state.items = state.items.filter((i) => i._id !== action.payload);
      }
    },
    clearCart: (state) => {
      state.items = [];
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(placeOrder.pending, (state) => {
        state.loading = true;
      })
      .addCase(placeOrder.fulfilled, (state) => {
        state.loading = false;
        state.items = []; // Clear cart on success
      })
      .addCase(placeOrder.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export const {
  hydrateCartForUser,
  resetCartSession,
  addToCart,
  setItemSpecialInstructions,
  removeFromCart,
  increaseQuantity,
  decreaseQuantity,
  clearCart,
} = cartSlice.actions;
export default cartSlice.reducer;
