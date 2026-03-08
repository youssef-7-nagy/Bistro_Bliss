import React from 'react';
import { useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import {
    FaMugHot, FaUtensils, FaGlassMartiniAlt,
    FaBirthdayCake, FaClock, FaReceipt, FaShoppingCart
} from "react-icons/fa";
import "./Home.css";

export const Home = () => {

    const { products } = useSelector((state) => state.products);

    return (
        <div className="home-container">

            {/* HERO SECTION */}
            <header className="hero-section">
                <div className="hero-content">
                    <h1 className="hero-title">
                        Best food for <br /> your taste
                    </h1>

                    <p className="hero-subtitle">
                        Discover delectable cuisine and unforgettable moments
                        in our welcoming, culinary haven.
                    </p>
                    <div className="hero-buttons">
                        <Link to="/BookTable">
                            <button className="btn-secondary">Book A Table</button>
                        </Link>

                        <Link to="/products">
                            <button className="btn-secondary">Explore Menu</button>
                        </Link>
                    </div>
                </div>
            </header>

            {/* BROWSE OUR MENU SECTION */}
            <section className="bom-main-wrapper">
                <h2 className="bom-section-title">Browse Our Menu</h2>

                <div className="bom-grid-container">
                    {/* Breakfast Card */}
                    <div className="bom-card-item">
                        <div className="bom-icon-box"><FaMugHot /></div>
                        <h3 className="bom-card-heading">Breakfast</h3>
                        <p className="bom-card-text">Start your day with our selection of fresh coffees and hearty morning meals.</p>
                        <Link to="/products?category=breakfast" className="bom-action-link">Explore Menu</Link>
                    </div>

                    {/* Main Dishes Card */}
                    <div className="bom-card-item">
                        <div className="bom-icon-box"><FaUtensils /></div>
                        <h3 className="bom-card-heading">Main Dishes</h3>
                        <p className="bom-card-text">From grilled meats to vegan delights, our main courses are crafted to perfection.</p>
                        <Link to="/products?category=main-course" className="bom-action-link">Explore Menu</Link>
                    </div>

                    {/* Drinks Card */}
                    <div className="bom-card-item">
                        <div className="bom-icon-box"><FaGlassMartiniAlt /></div>
                        <h3 className="bom-card-heading">Drinks</h3>
                        <p className="bom-card-text">Refresh yourself with our signature cocktails and non-alcoholic beverages.</p>
                        <Link to="/products?category=drinks" className="bom-action-link">Explore Menu</Link>
                    </div>

                    {/* Desserts Card */}
                    <div className="bom-card-item">
                        <div className="bom-icon-box"><FaBirthdayCake /></div>
                        <h3 className="bom-card-heading">Desserts</h3>
                        <p className="bom-card-text">Satisfy your sweet tooth with our chef's daily selection of cakes and treats.</p>
                        <Link to="/products?category=desserts" className="bom-action-link">Explore Menu</Link>
                    </div>
                </div>
            </section>

            <section className="delivery-section">
                <div className="delivery-content">
                    <div className="delivery-images">
                        <div className="img-tall">
                            <img src="Thechef.jpg" alt="Chef Cooking" />
                        </div>
                        <div className="img-stack">
                            <img src="shrimpo.jpg" alt="Special Dish" />
                            <img src="fahita5.jpg" alt="Kebabs" />
                        </div>
                    </div>

                    <div className="delivery-text">
                        <h2 className="section-title text-left">Fastest Food <br /> Delivery in City</h2>
                        <p className="section-desc">
                            Experience restaurant-quality food delivered straight to your door.
                            Fresh, hot, and always on time.
                        </p>

                        <div className="delivery-features">
                            <div className="feature-item">
                                <div className="feature-icon"><FaClock /></div>
                                <span>Delivery within 30 minutes</span>
                            </div>
                            <div className="feature-item">
                                <div className="feature-icon"><FaReceipt /></div>
                                <span>Best Offer & Prices</span>
                            </div>
                            <div className="feature-item">
                                <div className="feature-icon"><FaShoppingCart /></div>
                                <span>Online Services Available</span>
                            </div>
                        </div>
                    </div>
                </div>
            </section>


            <section className="gallery-animation-section">
                <div className="gallery-animation-content">
                    <div className="gallery-text-side">
                        <h2 className="section-title">Our Culinary Masterpieces</h2>
                        <p className="section-desc" style={{ margin: "0 auto" }}>
                            A feast for the eyes and the palate.
                        </p>
                    </div>

                    <div className="expanding-gallery-wrapper">
                        <div className="expanding-item" style={{ backgroundImage: "url('blue.jpg')" }}></div>
                        <div className="expanding-item" style={{ backgroundImage: "url('bor.jpg')" }}></div>
                        <div className="expanding-item" style={{ backgroundImage: "url('chicken.jpg')" }}></div>
                        <div className="expanding-item" style={{ backgroundImage: "url('pizza4.jpg')" }}></div>
                        <div className="expanding-item" style={{ backgroundImage: "url('pasta2.jpg')" }}></div>
                        <div className="expanding-item" style={{ backgroundImage: "url('crepe1.jpg')" }}></div>
                        <div className="expanding-item" style={{ backgroundImage: "url('porito.jpg')" }}></div>
                    </div>
                </div>
            </section>
        </div>
    );
};