import React, { useEffect } from 'react';
import './AboutUs.css';
import { FiPhone, FiMail, FiMapPin } from 'react-icons/fi';
import AOS from 'aos';
import 'aos/dist/aos.css';

export const AboutUs = () => {

  useEffect(() => {
    if ('scrollRestoration' in window.history) {
      window.history.scrollRestoration = 'manual';
    }
    window.scrollTo(0, 0);

    AOS.init({
      duration: 1000,
      once: true,
      easing: 'ease-out-cubic'
    });
  }, []);

  const testimonials = [
    {
      id: 1,
      title: "“The best restaurant”",
      text: "Last night, we dined at place and were simply blown away. From the moment we stepped in, we were enveloped in an inviting atmosphere and greeted with warm smiles.",
      name: "Sophire Robson",
      location: "Los Angeles, CA",
      image: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=200&auto=format&fit=crop"
    },
    {
      id: 2,
      title: "“Simply delicious”",
      text: "Place exceeded my expectations on all fronts. The ambiance was cozy and relaxed, making it a perfect venue for our anniversary dinner. Each dish was prepared and beautifully presented.",
      name: "Matt Cannon",
      location: "San Diego, CA",
      image: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?q=80&w=200&auto=format&fit=crop"
    },
    {
      id: 3,
      title: "“One of a kind restaurant”",
      text: "The culinary experience at place is first to none. The atmosphere is vibrant, the food – nothing short of extraordinary. The food was the highlight of our evening. Highly recommended.",
      name: "Andy Smith",
      location: "San Francisco, CA",
      image: "https://images.unsplash.com/photo-1580489944761-15a19d654956?q=80&w=200&auto=format&fit=crop"
    }
  ];

  return (
    <div className="about-us-container animated-entrance">

      {/* SECTION 1 */}
      <section className="about-section">
        <div className="about-image-wrapper" data-aos="fade-right">
          <img
            src="https://images.unsplash.com/photo-1546069901-ba9599a7e63c?q=80&w=1000&auto=format&fit=crop"
            alt="Healthy Food"
            className="about-image"
          />

          <div className="contact-card-overlay" data-aos="fade-up" data-aos-delay="300">
            <h3>Come and visit us</h3>
            <ul className="contact-list">
              <li>
                <FiPhone className="c-icon" /> <span>(414) 857 - 0107</span>
              </li>
              <li>
                <FiMail className="c-icon" /> <span>happyyummy@restaurant.com</span>
              </li>
              <li>
                <FiMapPin className="c-icon" />
                <span>837 W. Marshall Lane Marshalltown, IA 50158, Los Angeles</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="about-content" data-aos="fade-left" data-aos-delay="200">
          <h1 className="main-heading">We provide healthy food for your family.</h1>
          <p className="sub-text">
            Our story began with a vision to create a unique dining experience that merges fine dining, exceptional service, and a vibrant ambiance. Rooted in city's rich culinary culture, we aim to honor our local roots while infusing a global palate.
          </p>
          <p className="sub-text">
            At place, we believe that dining is not just about food, but also about the overall experience. Our staff, renowned for their warmth and dedication, strives to make every visit an unforgettable event.
          </p>
        </div>
      </section>

      {/* SECTION 2 (With the Chef Image fix) */}
      <section className="about-section reverse-layout">
        <div className="about-content about-content-info" data-aos="fade-right">
          <h1 className="main-heading">A little information for our valuable guest</h1>
          <p className="sub-text">
            At place, we believe that dining is not just about food, but also about the overall experience. Our staff, renowned for their warmth and dedication, strives to make every visit an unforgettable event.
          </p>

          <div className="stats-grid">
            <div className="stat-card" data-aos="zoom-in" data-aos-delay="200">
              <h2>3</h2>
              <p>Locations</p>
            </div>
            <div className="stat-card" data-aos="zoom-in" data-aos-delay="300">
              <h2>1995</h2>
              <p>Founded</p>
            </div>
            <div className="stat-card" data-aos="zoom-in" data-aos-delay="400">
              <h2>65+</h2>
              <p>Staff Members</p>
            </div>
            <div className="stat-card" data-aos="zoom-in" data-aos-delay="500">
              <h2>100%</h2>
              <p>Satisfied Customers</p>
            </div>
          </div>
        </div>

        <div className="about-image-wrapper about-image-wrapper-chef" data-aos="fade-left" data-aos-delay="200">
          <img
            src="https://images.unsplash.com/photo-1577219491135-ce391730fb2c?q=80&w=1000&auto=format"
            alt="Chef Cooking"
            className="about-image about-image-chef-full"
          />
        </div>
      </section>

      {/* TESTIMONIALS */}
      <section className="testimonials-section">
        <h1 className="main-heading center-text" data-aos="fade-up">What Our Customers Say</h1>

        <div className="testimonials-grid">
          {testimonials.map((item, index) => (
            <div key={item.id} className="testimonial-card" data-aos="fade-up" data-aos-delay={index * 200}>
              <h3 className="t-title">{item.title}</h3>
              <p className="t-text">{item.text}</p>

              <div className="t-separator"></div>

              <div className="t-profile">
                <img src={item.image} alt={item.name} className="t-avatar" />
                <div className="t-info">
                  <h4>{item.name}</h4>
                  <span>{item.location}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

    </div>
  );
};