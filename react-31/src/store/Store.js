import { configureStore } from "@reduxjs/toolkit";


import UserReducer from "./slices/userSlice"; 
import productReducer from "./slices/productSlice";
import cartReducer, { saveCartItemsForOwner } from "./slices/CartSlice";

export const Store = configureStore({
  reducer: {
    user: UserReducer,
    products: productReducer,
    cart: cartReducer,
  },
});

let previousCartItems = Store.getState().cart.items;
let previousCartOwnerKey = Store.getState().cart.ownerKey;

Store.subscribe(() => {
  const { items: currentCartItems, ownerKey: currentCartOwnerKey } = Store.getState().cart;
  if (
    currentCartItems === previousCartItems &&
    currentCartOwnerKey === previousCartOwnerKey
  ) return;

  previousCartItems = currentCartItems;
  previousCartOwnerKey = currentCartOwnerKey;
  saveCartItemsForOwner(currentCartOwnerKey, currentCartItems);
});
