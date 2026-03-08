import React from "react";
import { useSelector, useDispatch } from "react-redux";
import {
  removeFromCart,
  increaseQuantity,
  decreaseQuantity,
  clearCart,
  placeOrder,
} from "../store/slices/CartSlice";
import { toast } from "react-toastify";
import "./Cart.css";

const Cart = () => {
  const { items: cartItems, loading } = useSelector((state) => state.cart);
  const dispatch = useDispatch();

  const totalPrice = cartItems.reduce(
    (acc, item) => acc + (item.price || 0) * item.quantity,
    0
  );

  const handleConfirmOrder = async () => {
    if (!cartItems.length) {
      toast.info("Your cart is empty.");
      return;
    }

    try {
      // 1. AWAIT the API response 
      await dispatch(placeOrder(cartItems)).unwrap();
      
      // Success Actions
      toast.success("✅ Your order has been confirmed and saved!");
    } catch (err) {
      // Error Handling
      toast.error(err || "Something went wrong. Are you logged in?");
    }
  };

  return (
    <div className="cart-page">
      <h1 className="cart-header">🛒Order Now</h1>

      {cartItems.length === 0 ? (
        <div className="empty-state-container">
          <p className="empty-state">Your cart is currently empty.</p>
        </div>
      ) : (
        <div className="cart-content">
          <div className="cart-items-list">
            {cartItems.map((item) => (
              <div key={item._id} className="cart-item">
                <div className="cart-img-wrapper">
                  <img
                    src={item.images?.[0] ? `http://localhost:8080/${item.images[0]}` : "https://via.placeholder.com/150"}
                    alt={item.title}
                    className="cart-image"
                  />
                </div>

                <div className="cart-details">
                  <h2 className="cart-title">{item.title}</h2>
                  <p className="cart-price-line">
                    {item.price?.toFixed(2)} EGP x {item.quantity}
                  </p>
                  <p className="cart-subtotal">
                    = <strong>{((item.price || 0) * item.quantity).toFixed(2)} EGP</strong>
                  </p>
                </div>

                <div className="quantity-controls">
                  <button
                    onClick={() => dispatch(decreaseQuantity(item._id))}
                    className="btn-qty minus"
                  > – </button>
                  <span className="qty">{item.quantity}</span>
                  <button
                    onClick={() => dispatch(increaseQuantity(item._id))}
                    className="btn-qty plus"
                  > + </button>
                </div>

                <button
                  className="remove-btn"
                  onClick={() => dispatch(removeFromCart(item._id))}
                > Remove </button>
              </div>
            ))}
          </div>

          <div className="cart-footer">
            <h2 className="total-price">Total: {totalPrice.toFixed(2)} EGP</h2>
            <div className="actions">
              <button 
                className="btn-outline-danger" 
                onClick={() => dispatch(clearCart())}
                disabled={loading}
              > Clear Cart </button>
              
              <button 
                className="btn-primary-confirm" 
                onClick={handleConfirmOrder}
                disabled={loading}
              >
                {loading ? "Processing..." : "Confirm Order Now"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Cart;