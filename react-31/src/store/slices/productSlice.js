import { createSlice } from "@reduxjs/toolkit"


const productSlice = createSlice({
name: "products",
initialState: {
    products: [
  { title: "product 1", description: "d", price: 10},
  { title: "product 2", description: "d", price: 20 },
  { title: "product 3", description: "d", price: 30 },
  { title: "product 4", description: "d", price: 40 },
  ],
  },
});
export default productSlice.reducer;