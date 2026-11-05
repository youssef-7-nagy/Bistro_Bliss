import API_URL from "./utils/api";
import { Suspense, lazy, useEffect, useRef, useState } from "react";
import { Navigate, Route, Routes, useLocation } from 'react-router-dom';
import './App.css';
import axios from "axios";
import { useDispatch, useSelector } from "react-redux";


import { setUser } from "./store/slices/userSlice";
import {
  getCartOwnerKey,
  hydrateCartForUser,
  loadCartItemsForOwner,
  resetCartSession,
} from "./store/slices/CartSlice";


import { Navbar } from './component/Navbar';
import { Footer } from './component/Footer';

import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const Home = lazy(() => import("./pages/Home").then((module) => ({ default: module.Home })));
const Login = lazy(() => import("./pages/Login").then((module) => ({ default: module.Login })));
const ForgotPassword = lazy(() => import("./pages/ForgotPassword").then((module) => ({ default: module.ForgotPassword })));
const ResetPassword = lazy(() => import("./pages/ResetPassword").then((module) => ({ default: module.ResetPassword })));
const Profile = lazy(() => import("./pages/Profile").then((module) => ({ default: module.Profile })));
const Dashboard = lazy(() => import("./pages/Dashboard").then((module) => ({ default: module.Dashboard })));
const AdminPanel = lazy(() => import("./pages/AdminPanel").then((module) => ({ default: module.AdminPanel })));
const NotFound = lazy(() => import("./pages/NotFound").then((module) => ({ default: module.NotFound })));
const BookTable = lazy(() => import("./pages/BookTable").then((module) => ({ default: module.BookTable })));
const AboutUs = lazy(() => import("./pages/AboutUs").then((module) => ({ default: module.AboutUs })));
const Products = lazy(() => import("./pages/Products"));
const ProductDetails = lazy(() => import("./pages/ProductDetails"));
const Cart = lazy(() => import("./pages/Cart"));

const ScrollToTop = () => {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  return null;
};

const PageLoader = ({ label }) => (
  <div className="app-loader">
    <div className="app-loader__spinner" />
    <p>{label}</p>
  </div>
);

function App() {
  const { islogged: isLoggedIn, userData } = useSelector((state) => state.user);
  const token = localStorage.getItem("token");
  const dispatch = useDispatch();
  const [isLoading, setIsLoading] = useState(!!token);
  const activeCartOwnerRef = useRef(null);

  async function checkIsloggedIn() {
    try {
      const response = await axios.get(`${API_URL}/auth/me`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      dispatch(setUser(response.data.data.user));
    } catch (error) {
      console.log(error);
      if (error.response?.status === 401) {
        localStorage.removeItem("token");
        dispatch(setUser(null));
      }
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
  }, [token]);

  useEffect(() => {
    if (isLoading) return;

    const currentOwnerKey = isLoggedIn ? getCartOwnerKey(userData) : null;
    const previousOwnerKey = activeCartOwnerRef.current;

    if (!currentOwnerKey) {
      if (previousOwnerKey !== null) {
        dispatch(resetCartSession());
        activeCartOwnerRef.current = null;
      }
      return;
    }

    if (previousOwnerKey === currentOwnerKey) return;

    const restoredItems = loadCartItemsForOwner(currentOwnerKey);
    dispatch(hydrateCartForUser({ ownerKey: currentOwnerKey, items: restoredItems }));
    activeCartOwnerRef.current = currentOwnerKey;
  }, [dispatch, isLoading, isLoggedIn, userData]);

  useEffect(() => {
    const warmupPages = () => {
      import("./pages/Products");
      import("./pages/ProductDetails");
      import("./pages/Cart");
      import("./pages/AboutUs");
    };

    if ("requestIdleCallback" in window) {
      const idleId = window.requestIdleCallback(warmupPages, { timeout: 1800 });
      return () => window.cancelIdleCallback(idleId);
    }

    const timer = window.setTimeout(warmupPages, 1000);
    return () => window.clearTimeout(timer);
  }, []);

  return (
    <>
      <ScrollToTop />
      <Navbar />

      {isLoading ? (
        <PageLoader label="Checking your session..." />
      ) : (
        <Suspense fallback={<PageLoader label="Loading page..." />}>
          <Routes>
            <Route path="/" element={<Home />} />

            <Route path="/AboutUs" element={<AboutUs />} />

            <Route path="/product-details/:id" element={<ProductDetails />} />
            <Route path="/BookTable" element={<BookTable />} />
            <Route path="/products" element={<Products />} />
            <Route path="/products_details/:id" element={<ProductDetails />} />

            <Route path="/Cart" element={<Cart />} />
            <Route path="/reset-password" element={<ResetPassword />} />

            <Route
              path="/Login"
              element={
                isLoggedIn
                  ? (userData?.role === "admin" ? <Navigate to="/admin-panel" replace /> : <Navigate to="/Profile" replace />)
                  : <Login />
              }
            />
            <Route
              path="/login"
              element={
                isLoggedIn
                  ? (userData?.role === "admin" ? <Navigate to="/admin-panel" replace /> : <Navigate to="/Profile" replace />)
                  : <Login />
              }
            />
            <Route
              path="/forgot-password"
              element={isLoggedIn ? <Navigate to="/Profile" replace /> : <ForgotPassword />}
            />

            <Route
              path="/Profile"
              element={isLoggedIn ? <Profile /> : <Navigate to="/Login" replace />}
            />
            <Route
              path="/profile"
              element={isLoggedIn ? <Profile /> : <Navigate to="/Login" replace />}
            />

            {/*ADMIN ROUTES */}
            <Route
              path="/dashboard"
              element={
                isLoggedIn && userData?.role === "admin"
                  ? <Dashboard />
                  : <Navigate to={isLoggedIn ? "/Profile" : "/Login"} replace />
              }
            />
            <Route
              path="/admin-panel"
              element={
                isLoggedIn && userData?.role === "admin"
                  ? <AdminPanel />
                  : <Navigate to={isLoggedIn ? "/Profile" : "/Login"} replace />
              }
            />

            <Route path="*" element={<NotFound />} />
          </Routes>
        </Suspense>
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
