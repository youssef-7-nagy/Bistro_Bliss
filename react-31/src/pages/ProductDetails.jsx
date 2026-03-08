import axios from "axios";
import React, { useEffect, useState } from "react";
import { Container, Row, Col, Button } from "react-bootstrap";
import toast from "react-hot-toast";
import { useParams } from "react-router-dom";

import { useDispatch } from "react-redux"; // 1. Import hook
import { addToCart } from "../store/slices/CartSlice"; 
import "./ProductDetails.css"; 

const ProductDetails = () => {
  const { id } = useParams();
  const [product, setProduct] = useState({});
  
 
  const dispatch = useDispatch(); 

  const thumbnail = product?.images?.length > 0 && product?.images[0];

  async function getProductById() {
    try {
      const response = await axios.get(`http://localhost:8080/products/${id}`);
      setProduct(response.data.data);
    } catch (error) {
      console.log(error);
      toast.error(error.response?.data?.message || "Error");
    }
  }

  // The Function to Add to Cart (Same logic as ProductCard)
  const handleAddToCart = () => {
    if (product && product._id) {
      dispatch(addToCart(product));
      toast.success(`${product.title} added to cart!`);
    }
  };

  useEffect(() => {
    
    window.scrollTo(0, 0);
    
   
    getProductById();
  }, [id]);

  return (
    <section className="details-section">
      <div className="details-card">
        <Row className="g-0">
          
         
          <Col lg={6} className="img-col">
            <img
              className="product-hero-img"
              src={thumbnail ? `http://localhost:8080/${thumbnail}` : "https://via.placeholder.com/150"}
              alt={product?.title}
            />
          </Col>

        
          <Col lg={6} className="info-col">
            
            <span className="product-category">Signature Dish</span>

            <h1 className="product-title">{product?.title}</h1>

            <p className="product-desc">
              {product?.description || "A delicious handcrafted dish made with fresh ingredients. Experience the taste of luxury."}
            </p>

            {/* Price Box */}
            <div className="product-price-box">
              <span className="product-price">{product?.price} EGP</span>
              
              <span className="product-stock">
                {product?.stock > 0 
                  ? `${product.stock} left in stock` 
                  : "Out of Stock"
                }
              </span>
            </div>

          
            <Button 
                className="btn-order-large" 
                disabled={product?.stock === 0}
                onClick={handleAddToCart} 
            >
              {product?.stock === 0 ? "Sold Out" : "Add to Order"}
            </Button>
          </Col>
          
        </Row>
      </div>
    </section>
  );
};

export default ProductDetails;