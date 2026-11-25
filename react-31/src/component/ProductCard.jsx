import API_URL from "../utils/api";
import React, { memo, useCallback } from 'react';
import { Card, Button } from "react-bootstrap";
import { useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { addToCart } from "../store/slices/CartSlice";
import { toast } from "react-toastify";

const ProductCard = ({ product, index }) => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { islogged } = useSelector((state) => state.user);

  const isLeftColumn = index % 2 === 0;
  const animationType = isLeftColumn ? 'fadeInLeft' : 'fadeInRight';


  const isAvailable = product.isAvailable !== false;

  const handleAddToCart = useCallback(() => {
    if (!isAvailable) {
      toast.info(`${product.title} is currently unavailable.`, { position: "bottom-right" });
      return;
    }
    if (!islogged) {
      toast.error("You must be logged in to order.", { position: "bottom-right" });
      navigate("/Login");
      return;
    }

    // Ensure the product has _id, price, and title from your MongoDB
    dispatch(addToCart(product));
    toast.success(`${product.title} added to cart!`, {
      position: "bottom-right"
    });
  }, [dispatch, isAvailable, islogged, navigate, product]);

  return (
    <Card
      className={`menu-item ${!isAvailable ? "menu-item-unavailable" : ""}`}
      style={{
        animationName: animationType,
        animationDelay: `${Math.min(index, 6) * 0.12}s`
      }}
    >
      <div className="menu-item-content">

        <img
          className="menu-item-img"
          src={product.images && product.images.length > 0
            ? `${API_URL}/${product.images[0]}`
            : "https://via.placeholder.com/150"}
          alt={product.title}
          loading="lazy"
          decoding="async"
        />

        <div className="menu-item-text">
          <h5 className="menu-item-title">
            <span>{product.title}</span>
            {!isAvailable && <span className="menu-unavailable-tag">Unavailable</span>}
          </h5>
          <div className="menu-item-price">{product.price} EGP</div>
          <p className="menu-item-desc">{product.description}</p>

          <div className="menu-item-actions">

            <Button
              className="btn-custom btn-order"
              onClick={handleAddToCart}
              disabled={!isAvailable}
            >
              {isAvailable ? "Order Now" : "Unavailable"}
            </Button>

            <Button
              className="btn-custom btn-more"
              onClick={() => navigate(`/product-details/${product._id}`)}
            >
              Show More
            </Button>
          </div>
        </div>
      </div>
    </Card>
  );
};

export default memo(ProductCard);
