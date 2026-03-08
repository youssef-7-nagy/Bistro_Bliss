import { useEffect, useState } from "react";
import { Route, Routes } from 'react-router-dom';
import './App.css';
import axios from "axios";
import { useDispatch, useSelector } from "react-redux";


import { setUser } from "./store/slices/userSlice";


import { Navbar } from './component/Navbar';
import { Footer } from './component/Footer';
import { Home } from './pages/Home';
import { Login } from './pages/Login';
import { ForgotPassword } from './pages/ForgotPassword';
import { Profile } from './pages/Profile';
import { Dashboard } from './pages/Dashboard';
import { AdminPanel } from './pages/AdminPanel';
import { NotFound } from './pages/NotFound';
import { BookTable } from './pages/BookTable';
import Products from './pages/Products';
import ProductDetails from './pages/Productdetails';
import Cart from "./pages/Cart";
import { AboutUs } from "./pages/AboutUs";

import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

function App() {
  const { islogged: isLoggedIn, userData } = useSelector((state) => state.user);
  const token = localStorage.getItem("token");
  const dispatch = useDispatch();
  const [isLoading, setIsLoading] = useState(!!token);

  async function checkIsloggedIn() {
    try {
      const response = await axios.get("http://localhost:8080/auth/me", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      dispatch(setUser(response.data.data.user));
    } catch (error) {
      console.log(error);
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    if (token) {
      checkIsloggedIn();
    } else {
      setIsLoading(false);
    }
  }, [token]); // Added token to dependency array to follow best practices

  return (
    <>
      <Navbar />

      {isLoading ? (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }}>
          <h2>Loading...</h2>
        </div>
      ) : (
        <Routes>
          <Route path="/" element={<Home />} />

          <Route path="/AboutUs" element={<AboutUs />} />

          <Route path="/product-details/:id" element={<ProductDetails />} />
          <Route path="/BookTable" element={<BookTable />} />
          <Route path="/products" element={<Products />} />
          <Route path="/products_details/:id" element={<ProductDetails />} />

          <Route path="/Cart" element={<Cart />} />

          {!isLoggedIn && (
            <>
              <Route path="/Login" element={<Login />} />
              <Route path="/forgot-password" element={<ForgotPassword />} />
            </>
          )}

          {isLoggedIn && (
            <Route path="/Profile" element={<Profile />} />
          )}

          {/*ADMIN ROUTES */}
          {isLoggedIn && userData?.role === "admin" && (
            <>
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/admin-panel" element={<AdminPanel />} /> {/* 👈 ADDED HERE */}
            </>
          )}

          <Route path="*" element={<NotFound />} />
        </Routes>
      )}

      <ToastContainer
        position="top-center"
        autoClose={2500}
        hideProgressBar={false}
        newestOnTop
        closeOnClick
        pauseOnHover
        draggable
        theme="colored"
      />

      <Footer />
    </>
  );
}

export default App;