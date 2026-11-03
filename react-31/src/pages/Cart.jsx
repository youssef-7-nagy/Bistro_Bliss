import API_URL from "../utils/api";
import React, { useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import {
  removeFromCart,
  increaseQuantity,
  decreaseQuantity,
  setItemSpecialInstructions,
  clearCart,
  placeOrder,
} from "../store/slices/CartSlice";
import { addPoints, setUser } from "../store/slices/userSlice";
import { FaMoneyBillWave, FaCreditCard, FaCheck, FaChevronRight } from "react-icons/fa";
import { toast } from "react-toastify";
import "./Cart.css";

const initialVisaForm = {
  cardNumber: "",
  cardHolder: "",
  expMonth: "",
  expYear: "",
  cvv: "",
};

// FIXED: Added onBack prop to render back button inside the dark theme
const VisaPaymentPanel = ({ loading, onVisaConfirmed, onBack }) => {
  const [form, setForm] = useState(initialVisaForm);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCardFlipped, setIsCardFlipped] = useState(false);

  const cardDigits = form.cardNumber.replace(/\D/g, "");
  const cardGroups = [
    cardDigits.slice(0, 4),
    cardDigits.slice(4, 8),
    cardDigits.slice(8, 12),
    cardDigits.slice(12, 16),
  ];

  const handleCardNumberChange = (event) => {
    const digits = event.target.value.replace(/\D/g, "").slice(0, 16);
    const formatted = digits.replace(/(\d{4})(?=\d)/g, "$1 ");
    setForm((prev) => ({ ...prev, cardNumber: formatted }));
  };

  const handleCardHolderChange = (event) => {
    setForm((prev) => ({ ...prev, cardHolder: event.target.value }));
  };

  const handleMonthChange = (event) => {
    setForm((prev) => ({ ...prev, expMonth: event.target.value }));
  };

  const handleYearChange = (event) => {
    setForm((prev) => ({ ...prev, expYear: event.target.value }));
  };

  const handleCvvChange = (event) => {
    const digits = event.target.value.replace(/\D/g, "").slice(0, 4);
    setForm((prev) => ({ ...prev, cvv: digits }));
  };

  const validateForm = () => {
    if (!/^\d{16}$/.test(cardDigits)) {
      return "Please enter a full 16-digit card number.";
    }
    if (form.cardHolder.trim().length < 3) {
      return "Please enter card holder name.";
    }
    if (!form.expMonth || !form.expYear) {
      return "Please select card expiry month and year.";
    }
    if (!/^\d{3,4}$/.test(form.cvv)) {
      return "Please enter a valid CVC.";
    }

    return "";
  };

  const handleSubmit = async () => {
    const errorMessage = validateForm();
    if (errorMessage) {
      toast.error(errorMessage);
      return;
    }

    try {
      setIsSubmitting(true);
      await onVisaConfirmed();
    } finally {
      setIsSubmitting(false);
    }
  };

  const holderDisplay = form.cardHolder.trim() ? form.cardHolder.toUpperCase() : "FULL NAME";
  const expiryDisplay = `${form.expMonth || "MM"}/${form.expYear || "YY"}`;
  const cvvDisplay = form.cvv ? "*".repeat(form.cvv.length) : "***";

  return (
    <div className="visa-theme">
      <div className="visa-bg">
        <div className="visa-blob visa-blob-1"></div>
        <div className="visa-blob visa-blob-2"></div>
        <div className="visa-blob visa-blob-3"></div>
      </div>

      <div className="visa-wrapper">
        <div className="visa-card-scene">
          <div className={`visa-card-inner ${isCardFlipped ? "flipped" : ""}`}>
            <div className="visa-card-front">
              <div className="visa-card-top">
                <div>
                  <div className="visa-card-brand">CreditCard</div>
                  <div className="visa-chip"></div>
                </div>
                <div className="visa-mastercard-logo">
                  <div className="visa-mc-circle visa-mc-left"></div>
                  <div className="visa-mc-circle visa-mc-right"></div>
                </div>
              </div>

              <div className="visa-card-number-display">
                <span>{cardGroups[0].padEnd(4, "#")}</span>
                <span>{cardGroups[1].padEnd(4, "#")}</span>
                <span>{cardGroups[2].padEnd(4, "#")}</span>
                <span>{cardGroups[3].padEnd(4, "#")}</span>
              </div>

              <div className="visa-card-bottom">
                <div>
                  <div className="visa-card-info-label">Card Holder</div>
                  <div className="visa-card-info-value">{holderDisplay}</div>
                </div>
                <div>
                  <div className="visa-card-info-label">Expires</div>
                  <div className="visa-card-info-value">{expiryDisplay}</div>
                </div>
              </div>
            </div>

            <div className="visa-card-back">
              <div className="visa-magnetic-stripe"></div>
              <div className="visa-cvv-section">
                <div className="visa-cvv-label">CVV</div>
                <div className="visa-cvv-band">
                  <span className="visa-cvv-dots">{cvvDisplay}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="visa-form-card">
          <div className="visa-field">
            <label htmlFor="cardNumber">Card Number</label>
            <input
              id="cardNumber"
              type="text"
              value={form.cardNumber}
              onChange={handleCardNumberChange}
              placeholder="1234 5678 9012 3456"
              maxLength={19}
              inputMode="numeric"
              autoComplete="cc-number"
            />
          </div>

          <div className="visa-field">
            <label htmlFor="cardHolder">Card Holder</label>
            <input
              id="cardHolder"
              type="text"
              value={form.cardHolder}
              onChange={handleCardHolderChange}
              placeholder="Full Name"
              autoComplete="cc-name"
            />
          </div>

          <div className="visa-row">
            <div className="visa-field visa-field-tight">
              <label htmlFor="expMonth">Month</label>
              <select id="expMonth" value={form.expMonth} onChange={handleMonthChange}>
                <option value="">MM</option>
                <option value="01">01</option>
                <option value="02">02</option>
                <option value="03">03</option>
                <option value="04">04</option>
                <option value="05">05</option>
                <option value="06">06</option>
                <option value="07">07</option>
                <option value="08">08</option>
                <option value="09">09</option>
                <option value="10">10</option>
                <option value="11">11</option>
                <option value="12">12</option>
              </select>
            </div>

            <div className="visa-field visa-field-tight">
              <label htmlFor="expYear">Year</label>
              <select id="expYear" value={form.expYear} onChange={handleYearChange}>
                <option value="">YY</option>
                <option value="26">26</option>
                <option value="27">27</option>
                <option value="28">28</option>
                <option value="29">29</option>
                <option value="30">30</option>
                <option value="31">31</option>
                <option value="32">32</option>
                <option value="33">33</option>
              </select>
            </div>

            <div className="visa-field visa-field-tight visa-cvv-field">
              <label htmlFor="cvv">CVV</label>
              <input
                id="cvv"
                type="password"
                value={form.cvv}
                onFocus={() => setIsCardFlipped(true)}
                onBlur={() => setIsCardFlipped(false)}
                onChange={handleCvvChange}
                placeholder="***"
                maxLength={4}
                inputMode="numeric"
                autoComplete="cc-csc"
              />
            </div>
          </div>
        </div>
      </div>

      <button
        type="button"
        className="visa-pay-btn"
        onClick={handleSubmit}
        disabled={loading || isSubmitting}
      >
        {isSubmitting ? "Confirming order..." : loading ? "Processing..." : "Pay & Confirm"}
      </button>

      {/* FIXED: Placed back button inside the dark theme so it is fully visible */}
      {onBack && (
        <button
          type="button"
          className="payment-back-btn visa-back-btn"
          onClick={onBack}
          disabled={loading || isSubmitting}
          style={{ marginTop: "12px" }}
        >
          Back to payment methods
        </button>
      )}
    </div>
  );
};

const Cart = () => {
  const { items: cartItems, loading } = useSelector((state) => state.cart);
  const { islogged, userData } = useSelector((state) => state.user);
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const [orderRef, setOrderRef] = useState("");
  const [toastTotal, setToastTotal] = useState(0);
  const [showPaymentPopup, setShowPaymentPopup] = useState(false);
  const [popupPaymentMethod, setPopupPaymentMethod] = useState("cash");
  const [paymentStep, setPaymentStep] = useState("method");
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState("");

  const totalPrice = cartItems.reduce(
    (acc, item) => acc + (item.price || 0) * item.quantity,
    0
  );

  let discountAmount = 0;
  let discountLabel = "";
  let preventCheckout = false;
  let preventReason = "";

  if (userData?.activeReward === "FREE_MOLTEN_CAKE") {
    const cakeItem = cartItems.find((item) =>
      item.title.toLowerCase().includes("molten lava cake")
    );
    if (cakeItem) {
      discountAmount = cakeItem.price;
      discountLabel = "Free Molten Lava Cake Applied";
    } else {
      preventCheckout = true;
      preventReason =
        "You have a Free Molten Lava Cake reward. Please add it to your cart to checkout.";
    }
  } else if (userData?.activeReward === "FREE_PEPPERONI_PIZZA") {
    const pizzaItem = cartItems.find((item) =>
      item.title.toLowerCase().includes("pepperoni")
    );
    if (pizzaItem) {
      discountAmount = pizzaItem.price;
      discountLabel = "Free Rustic Pepperoni Pizza Applied";
    } else {
      preventCheckout = true;
      preventReason =
        "You have a Free Rustic Pepperoni Pizza reward. Please add it to your cart to checkout.";
    }
  } else if (userData?.activeReward === "DISCOUNT_20") {
    discountAmount = totalPrice * 0.2;
    discountLabel = "20% Off Total Order Applied";
  }

  const finalPrice = Math.max(0, totalPrice - discountAmount);

  const ensureCanCheckout = () => {
    if (!islogged) {
      toast.error("You must be logged in to place an order.");
      navigate("/Login");
      return false;
    }

    if (!cartItems.length) {
      toast.info("Your cart is empty.");
      return false;
    }

    if (preventCheckout) {
      toast.error(preventReason, { position: "top-center", autoClose: 5000 });
      return false;
    }

    return true;
  };

  const processOrder = async (paymentMethod, paymentIntentId = null) => {
    if (!ensureCanCheckout()) return false;

    try {
      const response = await dispatch(
        placeOrder({
          cartItems,
          paymentMethod,
          paymentIntentId,
        })
      ).unwrap();

      dispatch(addPoints(5));

      if (userData?.activeReward && response?.data?.activeReward === null) {
        dispatch(setUser({ ...userData, activeReward: null }));
      }

      const generatedRef = Math.random().toString(36).substring(2, 10).toUpperCase();
      setOrderRef(generatedRef);
      setToastTotal(finalPrice);
      setSelectedPaymentMethod(paymentMethod);

      setPaymentStep("receipt");
      return true;
    } catch (err) {
      console.error(err);
      toast.error(
        typeof err === "string" ? err : "Something went wrong. Are you logged in?"
      );
      return false;
    }
  };

  const closePaymentPopup = () => {
    setShowPaymentPopup(false);
    setPopupPaymentMethod("cash");
    setPaymentStep("method");
  };

  const handleConfirmOrder = () => {
    if (!ensureCanCheckout()) return;
    setPopupPaymentMethod("cash");
    setPaymentStep("method");
    setShowPaymentPopup(true);
  };

  const handleCashPayment = async () => {
    await processOrder("cash");
  };

  return (
    <div className="cart-page">
      <h1 className="cart-header">Order Now</h1>

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
                    src={
                      item.images?.[0]
                        ? `${API_URL}/${item.images[0]}`
                        : "https://via.placeholder.com/150"
                    }
                    alt={item.title}
                    className="cart-image"
                    loading="lazy"
                    decoding="async"
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
                  <div className="cart-customization">
                    <label htmlFor={`special-${item._id}`}>Customization note</label>
                    <textarea
                      id={`special-${item._id}`}
                      className="cart-note-input"
                      placeholder="Example: No tomatoes, no onions, extra spicy..."
                      value={item.specialInstructions || ""}
                      onChange={(event) =>
                        dispatch(
                          setItemSpecialInstructions({
                            itemId: item._id,
                            specialInstructions: event.target.value,
                          })
                        )
                      }
                      maxLength={200}
                    />
                  </div>
                </div>

                <div className="quantity-controls">
                  <button
                    onClick={() => dispatch(decreaseQuantity(item._id))}
                    className="btn-qty minus"
                  >
                    -
                  </button>
                  <span className="qty">{item.quantity}</span>
                  <button
                    onClick={() => dispatch(increaseQuantity(item._id))}
                    className="btn-qty plus"
                  >
                    +
                  </button>
                </div>

                <button
                  className="remove-btn"
                  onClick={() => dispatch(removeFromCart(item._id))}
                >
                  Remove
                </button>
              </div>
            ))}
          </div>

          <div className="cart-footer">
            {discountAmount > 0 && (
              <div
                style={{
                  color: "#e63946",
                  backgroundColor: "#fee2e2",
                  padding: "12px",
                  borderRadius: "8px",
                  marginBottom: "15px",
                  fontWeight: "600",
                  border: "1px solid #e63946",
                }}
              >
                {discountLabel}: -{discountAmount.toFixed(2)} EGP
              </div>
            )}

            <div className="total-breakdown" style={{ textAlign: "right", marginBottom: "15px" }}>
              <h3 style={{ margin: "5px 0", color: "#666", fontSize: "1.2rem" }}>
                Subtotal: {totalPrice.toFixed(2)} EGP
              </h3>
              {discountAmount > 0 && (
                <h3 style={{ margin: "5px 0", color: "#e63946", fontSize: "1.2rem" }}>
                  Discount ({userData?.activeReward === "DISCOUNT_20" ? "20%" : "Item"}): -
                  {discountAmount.toFixed(2)} EGP
                </h3>
              )}
              <hr style={{ margin: "10px 0", borderColor: "#eee" }} />
              <h2
                className="total-price"
                style={{
                  margin: "10px 0 0",
                  color: "#2b2d42",
                  fontSize: "1.8rem",
                  fontWeight: "800",
                }}
              >
                Final Total: {finalPrice.toFixed(2)} EGP
              </h2>
            </div>
            <div className="actions">
              <button
                className="btn-outline-danger"
                onClick={() => dispatch(clearCart())}
                disabled={loading}
              >
                Clear Cart
              </button>

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

      {showPaymentPopup && (
        <div className="payment-overlay" role="dialog" aria-modal="true" aria-label="Payment options">
          <div className="payment-modal payment-modal-dribbble">
            <button
              className="payment-close"
              onClick={closePaymentPopup}
              aria-label="Close payment popup"
            >
              &times;
            </button>

            <div className="payment-canvas">
              {paymentStep === "method" && (
                <section className="payment-card payment-method-panel payment-step-panel">
                  <h3 className="payment-title">Payment method</h3>
                  <p className="payment-subtitle">Choose how you would like to pay</p>

                  <div className="payment-method-list">
                    {/* FIXED: Clicking the method buttons now merely selects the state, not submits */}
                    <button
                      type="button"
                      className={`method-option ${popupPaymentMethod === "cash" ? "active" : ""}`}
                      onClick={() => setPopupPaymentMethod("cash")}
                      disabled={loading}
                    >
                      <span className="method-main">
                        <span className="method-icon">
                          <FaMoneyBillWave />
                        </span>
                        Cash on Delivery
                      </span>
                      <FaChevronRight className="method-arrow" />
                    </button>

                    <button
                      type="button"
                      className={`method-option ${popupPaymentMethod === "visa" ? "active" : ""}`}
                      onClick={() => setPopupPaymentMethod("visa")}
                      disabled={loading}
                    >
                      <span className="method-main">
                        <span className="method-icon">
                          <FaCreditCard />
                        </span>
                        Visa Card
                      </span>
                      <FaChevronRight className="method-arrow" />
                    </button>
                  </div>

                  <div className="payment-mini-row">
                    <span>{cartItems.length} item(s) in order</span>
                    <strong>{finalPrice.toFixed(2)} EGP</strong>
                  </div>

                  {/* FIXED: Added a Continue button to prevent abrupt navigation */}
                  <button
                    type="button"
                    className="payment-save-btn"
                    onClick={() => {
                      if (popupPaymentMethod === "cash") {
                        handleCashPayment();
                      } else {
                        setPaymentStep("visa");
                      }
                    }}
                    disabled={loading}
                    style={{ marginTop: "20px" }}
                  >
                    Continue
                  </button>
                </section>
              )}

              {paymentStep === "visa" && (
                <section className="payment-card payment-form-panel payment-step-panel visa-step-shell">
                  <VisaPaymentPanel
                    loading={loading}
                    onVisaConfirmed={async () => {
                      await processOrder("visa");
                    }}
                    onBack={() => {
                      setPopupPaymentMethod("cash");
                      setPaymentStep("method");
                    }}
                  />
                  {/* The rogue back button was removed from here as it is now inside the Visa Panel */}
                </section>
              )}

              {paymentStep === "receipt" && (
                <section className="payment-card payment-summary-panel payment-step-panel">
                  <div className="summary-check">
                    <FaCheck />
                  </div>
                  <h4>{toastTotal.toFixed(2)} EGP</h4>
                  <p>
                    {selectedPaymentMethod === "visa"
                      ? "Visa payment accepted and your order is confirmed."
                      : "Cash on Delivery selected and your order is confirmed."}
                  </p>

                  <div className="summary-sheet">
                    <div className="summary-row">
                      <span>Recipient</span>
                      <strong>{userData?.name || "Guest"}</strong>
                    </div>
                    <div className="summary-row">
                      <span>Order Ref</span>
                      <strong>{orderRef ? `#${orderRef}` : "Will be generated"}</strong>
                    </div>
                    <div className="summary-row">
                      <span>Method</span>
                      <strong>{selectedPaymentMethod === "visa" ? "Visa Card" : "Cash on Delivery"}</strong>
                    </div>
                  </div>

                  <small className="summary-footnote">You will receive confirmation shortly.</small>

                  <button
                    type="button"
                    className="payment-save-btn payment-done-btn"
                    onClick={closePaymentPopup}
                  >
                    Done
                  </button>
                </section>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Cart;