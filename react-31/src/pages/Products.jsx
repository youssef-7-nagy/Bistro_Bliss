import React, { useEffect, useState, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import axios from "axios";
import ProductCard from "../component/ProductCard";
import './Products.css';

const Products = () => {
  const [products, setProducts] = useState([]);

  const location = useLocation();

  useEffect(() => {
    // Check if there is a category query param
    const searchParams = new URLSearchParams(location.search);
    const categoryParam = searchParams.get("category");

    if (categoryParam) {
      // Find the specific category container and scroll to it smoothly
      setTimeout(() => {
        const element = document.getElementById(categoryParam);
        if (element) {
          const yOffset = -80; // Account for sticky navbar
          const y = element.getBoundingClientRect().top + window.scrollY + yOffset;
          window.scrollTo({ top: y, behavior: 'smooth' });
        }
      }, 300); // Slight delay to ensure elements are rendered
    } else {
      window.scrollTo(0, 0); // Default to top if no category specified
    }

    //Fetch Data
    async function getAllProducts() {
      try {
        const response = await axios.get("http://localhost:8080/products");

        setProducts(response.data.data || []);
      } catch (error) {
        console.error("Error fetching products:", error);
      }
    }
    getAllProducts();
  }, [location.search]);


  const breakfast = products.filter((p) => p.category === "breakfast");
  const mainCourse = products.filter((p) => p.category === "main course");
  const desserts = products.filter((p) => p.category === "desserts");
  const drinks = products.filter((p) => p.category === "drinks");


  const CategorySection = ({ title, items, id }) => {
    if (!items || items.length === 0) return null; // Hide empty sections

    return (
      <div id={id} className="products-category-section mb-5">

        <h2 className="products-category-title">
          {title}
        </h2>

        {/* Reuse your existing grid layout */}
        <div className="menu-board__grid">
          {items.map((product, index) => (
            <ProductCard
              key={product._id}
              product={product}
              index={index}
            />
          ))}
        </div>
      </div>
    );
  };

  return (
    <section className="menu-section">
      <div className="menu-board">

        {/* Main Header */}
        <div className="menu-header">
          <span className="menu-header-subtitle">THE</span>
          <h1 className="menu-header-title">MENU</h1>
        </div>

        {/*Render the 4 Sections */}
        <CategorySection id="breakfast" title="Breakfast" items={breakfast} />
        <CategorySection id="main-course" title="Main Course" items={mainCourse} />
        <CategorySection id="desserts" title="Desserts" items={desserts} />
        <CategorySection id="drinks" title="Drinks" items={drinks} />

      </div>
    </section>
  );
};

export default Products;