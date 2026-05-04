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

    addPoints: (state, action) => {
      if (state.userData) {
        state.userData.points = (state.userData.points || 0) + action.payload;
      }
    },
  },
});

export const { setUser, logout, addPoints } = userSlice.actions;
export default userSlice.reducer;
