import API_URL from "../utils/api";
import axios from "axios";
import React, { useEffect, useState } from "react";
import { Container, Row, Col, Button } from "react-bootstrap";
import { toast } from "react-toastify";
import { useParams } from "react-router-dom";

import { useDispatch, useSelector } from "react-redux"; // 1. Import hook
import { useNavigate } from "react-router-dom";
import { addToCart } from "../store/slices/CartSlice";
import "./ProductDetails.css";

const ProductDetails = () => {
  const { id } = useParams();
  const [product, setProduct] = useState({});
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");


  const dispatch = useDispatch();
  const { islogged } = useSelector((state) => state.user);
  const navigate = useNavigate();

  const thumbnail = product?.images?.length > 0 && product?.images[0];

  async function getProductById() {
    try {
      setLoading(true);
      setErrorMessage("");
      const response = await axios.get(`${API_URL}/products/${id}`);
      setProduct(response.data.data);
    } catch (error) {
      console.log(error);
      setErrorMessage(error.response?.data?.message || "Failed to load product details.");
      toast.error(error.response?.data?.message || "Error");
    } finally {
      setLoading(false);
    }
  }

  // The Function to Add to Cart (Same logic as ProductCard)
  const handleAddToCart = () => {
    if (!islogged) {
      toast.error("You must be logged in to order.", { position: "bottom-right" });
      navigate("/Login");
      return;
    }

    if (product && product._id) {
      dispatch(addToCart(product));
      toast.success(`${product.title} added to cart!`, { position: "bottom-right" });
    }
  };

  useEffect(() => {

    window.scrollTo(0, 0);


    getProductById();
  }, [id]);

  if (loading) {
    return (
      <section className="details-section">
        <div className="details-card details-skeleton-card">
          <div className="details-skeleton-image"></div>
          <div className="details-skeleton-content">
            <div className="details-skeleton-line w-35"></div>
            <div className="details-skeleton-line w-80"></div>
            <div className="details-skeleton-line w-100"></div>
            <div className="details-skeleton-line w-90"></div>
            <div className="details-skeleton-line w-50"></div>
          </div>
        </div>
      </section>
    );
  }

  if (errorMessage) {
    return (
      <section className="details-section">
        <div className="details-feedback error">
          <h3>Could not load this dish</h3>
          <p>{errorMessage}</p>
          <button type="button" className="details-retry-btn" onClick={getProductById}>
            Retry
          </button>
        </div>
      </section>
    );
  }

  return (
    <section className="details-section">
      <div className="details-card">
        <Row className="g-0">


          <Col lg={6} className="img-col">
            <img
              className="product-hero-img"
              src={thumbnail ? `${API_URL}/${thumbnail}` : "https://via.placeholder.com/150"}
              alt={product?.title}
              loading="lazy"
              decoding="async"
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
