import API_URL from "../utils/api";
import React, { memo, useEffect, useMemo, useState } from "react";
import { useLocation } from "react-router-dom";
import axios from "axios";
import ProductCard from "../component/ProductCard";
import "./Products.css";

const CategorySection = memo(function CategorySection({ title, items, id }) {
  if (!items || items.length === 0) return null;

  return (
    <div id={id} className="products-category-section mb-5">
      <h2 className="products-category-title">{title}</h2>

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
});

const Products = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [reloadKey, setReloadKey] = useState(0);
  const location = useLocation();

  useEffect(() => {
    const controller = new AbortController();

    async function getAllProducts() {
      try {
        setLoading(true);
        setErrorMessage("");
        const response = await axios.get(`${API_URL}/products`, {
          signal: controller.signal,
        });

        setProducts(response.data.data || []);
      } catch (error) {
        if (error?.code === "ERR_CANCELED") return;
        console.error("Error fetching products:", error);
        setErrorMessage(error.response?.data?.message || "Failed to load menu items.");
      } finally {
        setLoading(false);
      }
    }

    getAllProducts();

    return () => {
      controller.abort();
    };
  }, [reloadKey]);

  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    const categoryParam = searchParams.get("category");

    if (!categoryParam) {
      window.scrollTo(0, 0);
      return;
    }

    const scrollTimer = window.setTimeout(() => {
      const element = document.getElementById(categoryParam);
      if (!element) return;

      const yOffset = -80;
      const y = element.getBoundingClientRect().top + window.scrollY + yOffset;
      window.scrollTo({ top: y, behavior: "smooth" });
    }, 180);

    return () => window.clearTimeout(scrollTimer);
  }, [location.search, products.length]);

  const categorizedProducts = useMemo(() => {
    const grouped = {
      breakfast: [],
      mainCourse: [],
      desserts: [],
      drinks: [],
    };

    products.forEach((product) => {
      const category = product?.category?.toLowerCase().trim();

      if (category === "breakfast") grouped.breakfast.push(product);
      if (category === "main course" || category === "main-course") grouped.mainCourse.push(product);
      if (category === "desserts") grouped.desserts.push(product);
      if (category === "drinks") grouped.drinks.push(product);
    });

    return grouped;
  }, [products]);

  return (
    <section className="menu-section">
      <div className="menu-board">
        <div className="menu-header">
          <span className="menu-header-subtitle">THE</span>
          <h1 className="menu-header-title">MENU</h1>
        </div>
        {loading ? (
          <div className="menu-board__grid">
            {Array.from({ length: 6 }).map((_, idx) => (
              <article key={idx} className="menu-item menu-item-skeleton">
                <div className="menu-item-content">
                  <div className="menu-skeleton-circle"></div>
                  <div className="menu-skeleton-lines">
                    <div className="menu-skeleton-line w-70"></div>
                    <div className="menu-skeleton-line w-40"></div>
                    <div className="menu-skeleton-line w-100"></div>
                    <div className="menu-skeleton-line w-85"></div>
                  </div>
                </div>
              </article>
            ))}
          </div>
        ) : errorMessage ? (
          <div className="products-feedback error">
            <h3>Could not load menu</h3>
            <p>{errorMessage}</p>
            <button className="products-retry-btn" onClick={() => setReloadKey((prev) => prev + 1)}>
              Retry
            </button>
          </div>
        ) : products.length === 0 ? (
          <div className="products-feedback">
            <h3>No dishes available</h3>
            <p>Check back soon for fresh items.</p>
          </div>
        ) : (
          <>
            <CategorySection id="breakfast" title="Breakfast" items={categorizedProducts.breakfast} />
            <CategorySection id="main-course" title="Main Course" items={categorizedProducts.mainCourse} />
            <CategorySection id="desserts" title="Desserts" items={categorizedProducts.desserts} />
            <CategorySection id="drinks" title="Drinks" items={categorizedProducts.drinks} />
          </>
        )}
      </div>
    </section>
  );
};

export default Products;
