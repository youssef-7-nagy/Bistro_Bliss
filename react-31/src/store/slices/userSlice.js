import { createSlice } from "@reduxjs/toolkit";

const userSlice = createSlice({
  name: "user",
  initialState: {
    
    userData: null, 
    islogged: false,
  },

  reducers: {
    setUser: (state, action) => {
     
      state.userData = action.payload;
      state.islogged = true;
    },

    logout: (state) => {
      state.userData = null;
      state.islogged = false;
      localStorage.removeItem("token");
    },
  },
});

export const { setUser, logout } = userSlice.actions;
export default userSlice.reducer;