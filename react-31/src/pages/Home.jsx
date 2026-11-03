import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import AOS from 'aos';
import 'aos/dist/aos.css';
import {
    FaMugHot, FaUtensils, FaGlassMartiniAlt,
    FaBirthdayCake, FaClock, FaReceipt, FaShoppingCart
} from "react-icons/fa";
import "./Home.css";

export const Home = () => {
    useEffect(() => {
        AOS.init({
            duration: 1000,
            once: true,
            easing: 'ease-out-cubic'
        });
    }, []);

    return (
        <div className="home-container">

            {/* HERO SECTION */}
            <header className="hero-section">
                <div className="hero-content" data-aos="fade-up" data-aos-duration="1200">
                    <h1 className="hero-title" data-aos="zoom-in" data-aos-delay="200">
                        Best food for <br /> your taste
                    </h1>

                    <p className="hero-subtitle" data-aos="fade-up" data-aos-delay="400">
                        Discover delectable cuisine and unforgettable moments
                        in our welcoming, culinary haven.
                    </p>
                    <div className="hero-buttons" data-aos="fade-up" data-aos-delay="600">
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
                <h2 className="bom-section-title" data-aos="fade-down">Browse Our Menu</h2>

                <div className="bom-grid-container">
                    {/* Breakfast Card */}
                    <div className="bom-card-item" data-aos="fade-up" data-aos-delay="100">
                        <div className="bom-icon-box"><FaMugHot /></div>
                        <h3 className="bom-card-heading">Breakfast</h3>
                        <p className="bom-card-text">Start your day with our selection of fresh coffees and hearty morning meals.</p>
                        <Link to="/products?category=breakfast" className="bom-action-link">Explore Menu</Link>
                    </div>

                    {/* Main Dishes Card */}
                    <div className="bom-card-item" data-aos="fade-up" data-aos-delay="300">
                        <div className="bom-icon-box"><FaUtensils /></div>
                        <h3 className="bom-card-heading">Main Dishes</h3>
                        <p className="bom-card-text">From grilled meats to vegan delights, our main courses are crafted to perfection.</p>
                        <Link to="/products?category=main-course" className="bom-action-link">Explore Menu</Link>
                    </div>

                    {/* Drinks Card */}
                    <div className="bom-card-item" data-aos="fade-up" data-aos-delay="500">
                        <div className="bom-icon-box"><FaGlassMartiniAlt /></div>
                        <h3 className="bom-card-heading">Drinks</h3>
                        <p className="bom-card-text">Refresh yourself with our signature cocktails and non-alcoholic beverages.</p>
                        <Link to="/products?category=drinks" className="bom-action-link">Explore Menu</Link>
                    </div>

                    {/* Desserts Card */}
                    <div className="bom-card-item" data-aos="fade-up" data-aos-delay="700">
                        <div className="bom-icon-box"><FaBirthdayCake /></div>
                        <h3 className="bom-card-heading">Desserts</h3>
                        <p className="bom-card-text">Satisfy your sweet tooth with our chef's daily selection of cakes and treats.</p>
                        <Link to="/products?category=desserts" className="bom-action-link">Explore Menu</Link>
                    </div>
                </div>
            </section>

            {/* DELIVERY SECTION */}
            <section className="delivery-section">
                <div className="delivery-content">
                    {/* Left Side: Images */}
                    <div className="delivery-images" data-aos="fade-right">
                        <div className="img-tall">
                            <img src="/Thechef.jpg" alt="Chef Cooking" loading="lazy" decoding="async" />
                        </div>
                        <div className="img-stack">
                            <img src="/shrimpo.jpg" alt="Special Dish" loading="lazy" decoding="async" />
                            <img src="/fahita5.jpg" alt="Kebabs" loading="lazy" decoding="async" />
                        </div>
                    </div>

                    {/* Right Side: Text & Features */}
                    <div className="delivery-text" data-aos="fade-left" data-aos-delay="0">
                        <h2 className="section-title text-left">
                            Fastest Food <br /> Delivery in City
                        </h2>
                        
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

            {/* GALLERY SECTION */}
            <section className="gallery-animation-section" data-aos="gallery-entrance" data-aos-offset="80">
                <div className="gallery-animation-content">
                    <div className="gallery-text-side">
                        <h2 className="section-title gallery-main-title">
                            <span className="gallery-word">Our</span>
                            <span className="gallery-word">Culinary</span>
                            <span className="gallery-word">Masterpieces</span>
                        </h2>
                        <p
                            className="section-desc gallery-main-desc"
                            style={{ margin: "0 auto" }}
                        >
                            A feast for the eyes and the palate.
                        </p>
                    </div>

                    <div className="expanding-gallery-wrapper">
                        <div className="expanding-item" style={{ backgroundImage: "url('/blue.jpg')" }}></div>
                        <div className="expanding-item" style={{ backgroundImage: "url('/bor.jpg')" }}></div>
                        <div className="expanding-item" style={{ backgroundImage: "url('/chicken.jpg')" }}></div>
                        <div className="expanding-item" style={{ backgroundImage: "url('/pizza4.jpg')" }}></div>
                        <div className="expanding-item" style={{ backgroundImage: "url('/pasta2.jpg')" }}></div>
                        <div className="expanding-item" style={{ backgroundImage: "url('/crepe1.jpg')" }}></div>
                        <div className="expanding-item" style={{ backgroundImage: "url('/porito.jpg')" }}></div>
                    </div>
                </div>
            </section>
        </div>
    );
};
