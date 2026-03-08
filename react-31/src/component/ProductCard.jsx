import React from 'react';
import { Card, Button } from "react-bootstrap";
import { useNavigate } from "react-router-dom";
import { useDispatch } from "react-redux";
import { addToCart } from "../store/slices/CartSlice";
import { toast } from "react-toastify";

const ProductCard = ({ product, index }) => {
  const navigate = useNavigate();
  const dispatch = useDispatch();


  const isLeftColumn = index % 2 === 0;
  const animationType = isLeftColumn ? 'fadeInLeft' : 'fadeInRight';


  const handleAddToCart = () => {

    // Ensure the product has _id, price, and title from your MongoDB
    dispatch(addToCart(product));
    toast.success(`${product.title} added to cart!`, {
      position: "bottom-right",
      autoClose: 2000,
    });
  };

  return (
    <Card
      className="menu-item"
      style={{
        animationName: animationType,
        animationDelay: `${index * 0.4}s`
      }}
    >
      <div className="menu-item-content">

        <img
          className="menu-item-img"
          src={product.images && product.images.length > 0
            ? `http://localhost:8080/${product.images[0]}`
            : "https://via.placeholder.com/150"}
          alt={product.title}
        />

        <div className="menu-item-text">
          <h5 className="menu-item-title">{product.title}</h5>
          <div className="menu-item-price">{product.price} EGP</div>
          <p className="menu-item-desc">{product.description}</p>

          <div className="menu-item-actions">

            <Button
              className="btn-custom btn-order"
              onClick={handleAddToCart}
            >
              Order Now
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

export default ProductCard;