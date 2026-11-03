import API_URL from "../utils/api";
import React, { useEffect, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { logout, setUser } from "../store/slices/userSlice";
import { resetCartSession } from "../store/slices/CartSlice";
import axios from 'axios';
import { toast } from 'react-toastify';
import './profile.css';

export const Profile = () => {
    const { islogged, userData } = useSelector((state) => state.user);
    const dispatch = useDispatch();
    const navigate = useNavigate();

    const [activeTab, setActiveTab] = useState('overview'); // 'overview', 'orders', 'reservations', 'settings', 'rewards'
    const [myBookings, setMyBookings] = useState([]);
    const [myOrders, setMyOrders] = useState([]);

    const [editForm, setEditForm] = useState({
        name: "",
        phone: "",
        password: ""
    });

    const [showToast, setShowToast] = useState(false);
    const [redeemedRewardStr, setRedeemedRewardStr] = useState("");
    const [pointsSpent, setPointsSpent] = useState(0);
    const [rewardImages, setRewardImages] = useState({ cake: null, pizza: null });

    // Determine User Role
    const userRole = userData?.role?.toLowerCase() || 'user';

    // --- ULTRA-COOL TOAST CONFIG ---
    const toastConfig = {
        position: "top-right", // Moved to the top!
        autoClose: 4000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        theme: "dark", 
        style: {
            fontFamily: "'Poppins', sans-serif",
            borderRadius: "16px",
            background: "rgba(15, 23, 42, 0.85)", // Sleek transparent dark glass
            backdropFilter: "blur(12px)", // Frosted glass effect
            border: "1px solid rgba(255, 255, 255, 0.1)", // Subtle border
            boxShadow: "0 20px 40px rgba(0,0,0,0.3)",
            fontWeight: "500",
            color: "#f8fafc",
            letterSpacing: "0.5px"
        }
    };

    useEffect(() => {
        const fetchRewardProducts = async () => {
            try {
                const res = await axios.get(`${API_URL}/products`);
                const products = res.data.data || [];
                const cake = products.find(p => p.title && p.title.toLowerCase().includes("molten lava cake"));
                const pizza = products.find(p => p.title && p.title.toLowerCase().includes("pepperoni"));
                setRewardImages({
                    cake: cake?.images?.[0] ? `${API_URL}/${cake.images[0]}` : null,
                    pizza: pizza?.images?.[0] ? `${API_URL}/${pizza.images[0]}` : null,
                });
            } catch (error) {
                console.error("Failed to fetch products for reward images", error);
            }
        };
        fetchRewardProducts();
    }, []);

    // hide custom reward toast after 8s
    useEffect(() => {
        let timer;
        if (showToast) {
            timer = setTimeout(() => setShowToast(false), 8000);
        }
        return () => clearTimeout(timer);
    }, [showToast]);

    useEffect(() => {
        if (islogged && userData) {
            setEditForm({
                name: userData.name || "",
                phone: userData.phone || "",
                password: ""
            });
            fetchMyBookings();
            fetchMyOrders();
        }
    }, [islogged, userData]);

    const fetchMyBookings = async () => {
        try {
            const token = localStorage.getItem("token");
            const res = await axios.get(`${API_URL}/reservation/user/my-reservations`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setMyBookings(res.data);
        } catch (error) { console.error(error); }
    };

    const fetchMyOrders = async () => {
        try {
            const token = localStorage.getItem("token");
            const res = await axios.get(`${API_URL}/order/user/my-orders`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setMyOrders(res.data.data);
        } catch (error) { console.error(error); }
    };

    // --- UPDATED DYNAMIC PROFILE UPDATE LOGIC ---
    const handleUpdateProfile = async (e) => {
        e.preventDefault();

        // 1. Figure out exactly what the user changed
        let changedFields = [];
        if (editForm.name.trim() !== userData.name) changedFields.push("Name");
        if (editForm.phone.trim() !== userData.phone) changedFields.push("Phone number");
        if (editForm.password.trim() !== "") changedFields.push("Password");

        // 2. If they clicked save without changing anything
        if (changedFields.length === 0) {
            return toast.info("No changes were made to your profile. 👀", toastConfig);
        }

        try {
            const token = localStorage.getItem("token");
            const res = await axios.put(`${API_URL}/auth/update`, editForm, {
                headers: { Authorization: `Bearer ${token}` }
            });
            
            // 3. Fire the dynamic success toaster
            const message = `✨ Successfully updated: ${changedFields.join(", ")}!`;
            toast.success(message, toastConfig);
            
            // 4. Update the local state
            dispatch(setUser({ ...userData, ...res.data.data.user }));
            
            // Clear password field for security after save
            setEditForm(prev => ({ ...prev, password: "" }));

        } catch (error) { 
            toast.error("❌ Update failed. Please try again.", toastConfig); 
        }
    };

    const handleLogout = () => {
        dispatch(resetCartSession());
        dispatch(logout());
        navigate("/login");
    };

    const handleRedeem = async (rewardType, cost) => {
        try {
            const token = localStorage.getItem("token");
            const res = await axios.post(`${API_URL}/auth/redeem`,
                { rewardType, cost },
                { headers: { Authorization: `Bearer ${token}` } }
            );

            // Update Context
            const updatedUserData = { ...userData, points: res.data.data.points, activeReward: res.data.data.activeReward };
            dispatch(setUser(updatedUserData));

            // Show Custom Toaster
            let rewardName = rewardType;
            if (rewardType === "FREE_MOLTEN_CAKE") rewardName = "Free Molten Lava Cake";
            if (rewardType === "FREE_PEPPERONI_PIZZA") rewardName = "Free Rustic Pepperoni Pizza";
            if (rewardType === "DISCOUNT_20") rewardName = "20% Off Next Order";

            setRedeemedRewardStr(rewardName);
            setPointsSpent(cost);
            setShowToast(true);

        } catch (error) {
            toast.error(error.response?.data?.message || "❌ Failed to redeem reward.", toastConfig);
        }
    };

    const getStatusClass = (status) => {
        const s = status?.toLowerCase() || 'pending';
        if (s === 'accepted' || s === 'completed' || s === 'delivered') return 'status-success';
        if (s === 'rejected' || s === 'cancelled') return 'status-danger';
        return 'status-warning';
    };

    if (!islogged) return <div className="centered-view">Please Log In</div>;

    const renderContent = () => {
        switch (activeTab) {
            case 'orders':
                return (
                    <div className="dashboard-card fade-in">
                        <div className="card-header">
                            <h3>Order History</h3>
                            <p>Track your past meals</p>
                        </div>
                        {myOrders.length === 0 ? <p className="empty-text">No orders yet.</p> : (
                            <div className="table-responsive">
                                <table className="dashboard-table">
                                    <thead><tr><th>Date</th><th>Items</th><th>Total</th><th>Status</th></tr></thead>
                                    <tbody>
                                        {myOrders.map(order => (
                                            <tr key={order._id}>
                                                <td>{new Date(order.createdAt).toLocaleDateString()}</td>
                                                <td>
                                                    {order.items.map((i) => (
                                                        <div key={i._id}>
                                                            {i.quantity}x {i.title}
                                                            {i.specialInstructions && (
                                                                <div className="order-item-note">
                                                                    Note: {i.specialInstructions}
                                                                </div>
                                                            )}
                                                        </div>
                                                    ))}
                                                </td>
                                                <td className="price-text">{order.totalAmount} EGP</td>
                                                <td><span className={`badge ${getStatusClass(order.status)}`}>{order.status}</span></td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                );
            case 'reservations':
                return (
                    <div className="dashboard-card fade-in">
                        <div className="card-header">
                            <h3>Reservations</h3>
                            <p>Your upcoming tables</p>
                        </div>
                        {myBookings.length === 0 ? <p className="empty-text">No bookings yet.</p> : (
                            <div className="table-responsive">
                                <table className="dashboard-table">
                                    <thead><tr><th>Date</th><th>Time</th><th>Guests</th><th>Status</th></tr></thead>
                                    <tbody>
                                        {myBookings.map(b => (
                                            <tr key={b._id}>
                                                <td>{b.date}</td>
                                                <td><span className="pill">{b.time}</span></td>
                                                <td>{b.guests}</td>
                                                <td><span className={`badge ${getStatusClass(b.status)}`}>{b.status}</span></td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                );
            case 'settings':
                return (
                    <div className="dashboard-card fade-in">
                        <div className="card-header">
                            <h3>Account Settings</h3>
                            <p>Update your profile details</p>
                        </div>
                        <form onSubmit={handleUpdateProfile} className="settings-form">
                            <div className="form-group">
                                <label>Full Name</label>
                                <input type="text" value={editForm.name} onChange={e => setEditForm({ ...editForm, name: e.target.value })} />
                            </div>
                            <div className="form-group">
                                <label>Phone Number</label>
                                <input type="text" value={editForm.phone} onChange={e => setEditForm({ ...editForm, phone: e.target.value })} />
                            </div>
                            <div className="form-group">
                                <label>New Password</label>
                                <input type="password" placeholder="Leave empty to keep current" value={editForm.password} onChange={e => setEditForm({ ...editForm, password: e.target.value })} />
                            </div>
                            <button className="btn-save pulse-btn">Save Changes</button>
                        </form>
                    </div>
                );
            case 'rewards':
                const points = userData.points || 0;
                return (
                    <div className="dashboard-card fade-in">
                        <div className="card-header">
                            <h3>My Rewards & Bonus Points</h3>
                            <p>Earn points on every order or reservation to unlock exclusive offers!</p>
                        </div>

                        <div className="points-showcase">
                            <div className="points-circle">
                                <h2>{points}</h2>
                                <span>pts</span>
                            </div>
                            <p className="points-subtitle">Your Current Balance</p>
                        </div>

                        {userData.activeReward === "FREE_MOLTEN_CAKE" && (
                            <div className="active-reward-alert">
                                🎁 You have a Free Molten Lava Cake ready! Add it to your cart and it will be completely free at checkout.
                            </div>
                        )}
                        {userData.activeReward === "FREE_PEPPERONI_PIZZA" && (
                            <div className="active-reward-alert" style={{ borderColor: '#ff6b6b', background: 'rgba(255, 107, 107, 0.1)' }}>
                                🍕 You have a Free Rustic Pepperoni & Basil Pizza ready! Add it to your cart.
                            </div>
                        )}
                        {userData.activeReward === "DISCOUNT_20" && (
                            <div className="active-reward-alert" style={{ borderColor: '#3b82f6', background: 'rgba(59, 130, 246, 0.1)' }}>
                                💸 You have a 20% Discount active! It will automatically apply to your entire cart total.
                            </div>
                        )}

                        <div className="rewards-list">
                            <div className={`reward-tier ${points >= 100 ? 'unlocked' : 'locked'}`}>
                                <div className="tier-icon" style={{ padding: rewardImages.cake ? '0' : '' }}>
                                    {rewardImages.cake ? <img src={rewardImages.cake} alt="Molten Lava Cake" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '15px' }} /> : '🧁'}
                                </div>
                                <div className="tier-info">
                                    <h4>Free Molten Lava Cake</h4>
                                    <p>100 Points</p>
                                    <div className="progress-bg"><div className="progress-fill glow-fill" style={{ width: `${Math.min((points / 100) * 100, 100)}%` }}></div></div>
                                </div>
                                <div className="tier-status">
                                    {points >= 100 ? (
                                        userData.activeReward ? (
                                            <span style={{ color: 'gold' }}>Use Active Reward First</span>
                                        ) : (
                                            <button className="btn-redeem" onClick={() => handleRedeem("FREE_MOLTEN_CAKE", 100)}>Redeem Now</button>
                                        )
                                    ) : (
                                        `${100 - points} more pts needed`
                                    )}
                                </div>
                            </div>

                            <div className={`reward-tier ${points >= 300 ? 'unlocked' : 'locked'}`}>
                                <div className="tier-icon" style={{ padding: rewardImages.pizza ? '0' : '' }}>
                                    {rewardImages.pizza ? <img src={rewardImages.pizza} alt="Pepperoni Pizza" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '15px' }} /> : '🍕'}
                                </div>
                                <div className="tier-info">
                                    <h4>Free Rustic Pepperoni & Basil Pizza</h4>
                                    <p>300 Points</p>
                                    <div className="progress-bg"><div className="progress-fill glow-fill" style={{ width: `${Math.min((points / 300) * 100, 100)}%` }}></div></div>
                                </div>
                                <div className="tier-status">
                                    {points >= 300 ? (
                                        userData.activeReward ? (
                                            <span style={{ color: 'gold' }}>Use Active Reward First</span>
                                        ) : (
                                            <button className="btn-redeem" onClick={() => handleRedeem("FREE_PEPPERONI_PIZZA", 300)}>Redeem Now</button>
                                        )
                                    ) : (
                                        `${300 - points} more pts needed`
                                    )}
                                </div>
                            </div>

                            <div className={`reward-tier ${points >= 500 ? 'unlocked' : 'locked'}`}>
                                <div className="tier-icon">🥂</div>
                                <div className="tier-info">
                                    <h4>20% Off Total Bill</h4>
                                    <p>500 Points</p>
                                    <div className="progress-bg"><div className="progress-fill glow-fill" style={{ width: `${Math.min((points / 500) * 100, 100)}%` }}></div></div>
                                </div>
                                <div className="tier-status">
                                    {points >= 500 ? (
                                        userData.activeReward ? (
                                            <span style={{ color: 'gold' }}>Use Active Reward First</span>
                                        ) : (
                                            <button className="btn-redeem" onClick={() => handleRedeem("DISCOUNT_20", 500)}>Redeem Now</button>
                                        )
                                    ) : (
                                        `${500 - points} more pts needed`
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                );
            default: // OVERVIEW
                const currentPoints = userData.points || 0;
                
                // Dynamic time of day for the greeting
                const hour = new Date().getHours();
                const greeting = hour < 12 ? "Good Morning" : hour < 18 ? "Good Afternoon" : "Good Evening";

                return (
                    <div className="overview-grid">
                        <div className="stat-card blue slide-up-1" onClick={() => setActiveTab('orders')} style={{ cursor: 'pointer' }}>
                            <h3>{myOrders.length}</h3>
                            <p>Total Orders</p>
                        </div>
                        <div className="stat-card purple slide-up-2" onClick={() => setActiveTab('reservations')} style={{ cursor: 'pointer' }}>
                            <h3>{myBookings.length}</h3>
                            <p>Reservations</p>
                        </div>
                        <div className="stat-card gold shimmer-card slide-up-3" onClick={() => setActiveTab('rewards')} style={{ cursor: 'pointer' }}>
                            <h3>{currentPoints}</h3>
                            <p>Bonus Points</p>
                        </div>

                        {/* SPLIT DASHBOARD WITH ID CARD & QUICK ACTIONS (Animated) */}
                        <div className="dashboard-card full-width split-dashboard slide-up-hero">
                            
                            {/* Left Side: Digital Membership Card */}
                            <div className="digital-card-container hover-lift">
                                <div className={`digital-id-card shimmer-card ${userRole === 'admin' ? 'admin-theme' : 'user-theme'}`}>
                                    <div className="card-top-row">
                                        <div className="card-logo">
                                            <span style={{ fontSize: '1.2rem' }}>🍜</span> Bistro Bliss
                                        </div>
                                        <div className="card-chip"></div>
                                    </div>
                                    
                                    <div className="card-middle-row">
                                        <h4>{userData.name}</h4>
                                        <span className="card-role-text">
                                            {userRole === 'admin' ? 'System Administrator' : 'Valued Customer'}
                                        </span>
                                    </div>

                                    <div className="card-bottom-row">
                                        <div className="card-stat">
                                            <span>Member Email</span>
                                            <strong>{userData.email}</strong>
                                        </div>
                                        <div className="card-stat right-align">
                                            <span>Reward Points</span>
                                            <strong>{currentPoints} pts</strong>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Right Side: Quick Actions */}
                            <div className="quick-actions-container">
                                <div className="qa-header">
                                    <h2>{greeting}, {userData.name.split(' ')[0]}! <span className="wave-emoji">👋</span></h2>
                                    <p>What would you like to do today?</p>
                                </div>
                                
                                <div className="qa-grid">
                                    <button className="qa-btn hover-lift" onClick={() => navigate('/Products')}>
                                        <div className="qa-icon" style={{ background: '#e0f2fe', color: '#0284c7' }}>🍔</div>
                                        <div className="qa-text">
                                            <strong>Order Food</strong>
                                            <span>Browse the menu</span>
                                        </div>
                                    </button>

                                    <button className="qa-btn hover-lift" onClick={() => navigate('/BookTable')}>
                                        <div className="qa-icon" style={{ background: '#f3e8ff', color: '#9333ea' }}>📅</div>
                                        <div className="qa-text">
                                            <strong>Book a Table</strong>
                                            <span>Reserve your spot</span>
                                        </div>
                                    </button>

                                    {/* Only show Admin panel button if user is an admin */}
                                    {userRole === 'admin' && (
                                        <button className="qa-btn admin-btn hover-lift" onClick={() => navigate('/admin-panel')}>
                                            <div className="qa-icon" style={{ background: '#fee2e2', color: '#dc2626' }}>⚙️</div>
                                            <div className="qa-text">
                                                <strong>Admin Panel</strong>
                                                <span>Manage restaurant</span>
                                            </div>
                                        </button>
                                    )}
                                </div>
                            </div>

                        </div>
                    </div>
                );
        }
    };

    return (
        <div className="dashboard-container">

            <aside className="dashboard-sidebar">
                <div className="user-profile-snap">
                    <img src="https://cdn-icons-png.flaticon.com/512/3135/3135715.png" alt="Profile" />
                    <h4>{userData.name}</h4>
                    
                    {/* ROLE BADGE */}
                    <span className={`sidebar-role-badge ${userRole === 'admin' ? 'admin' : 'user'}`}>
                        {userRole === 'admin' ? '👑 Admin' : '👤 Customer'}
                    </span>
                    
                    <p>{userData.email}</p>
                </div>

                <nav className="side-nav">
                    <button className={activeTab === 'overview' ? 'active' : ''} onClick={() => setActiveTab('overview')}>
                        📊 Overview
                    </button>
                    <button className={activeTab === 'orders' ? 'active' : ''} onClick={() => setActiveTab('orders')}>
                        🛒 My Orders
                    </button>
                    <button className={activeTab === 'reservations' ? 'active' : ''} onClick={() => setActiveTab('reservations')}>
                        📅 Reservations
                    </button>
                    <button className={activeTab === 'rewards' ? 'active rewards-tab-btn' : 'rewards-tab-btn'} onClick={() => setActiveTab('rewards')}>
                        🎁 Rewards & Points
                    </button>
                    <button className={activeTab === 'settings' ? 'active' : ''} onClick={() => setActiveTab('settings')}>
                        ⚙️ Settings
                    </button>
                </nav>

                <button className="btn-logout slide-bg-btn" onClick={handleLogout}>Log Out</button>
            </aside>


            <main className="dashboard-content">
                {renderContent()}
            </main>

            {/* DETAILED TOASTER FOR REWARDS */}
            <div className={"profile-toast-box " + (showToast ? "active" : "")}>
                <div className="profile-toast-icon">🎁</div>
                <div className="profile-toast-body">
                    <h4>Reward Unlocked!</h4>
                    <p>Congratulations, <strong>{userData?.name}</strong>! You successfully redeemed your points.</p>

                    <div className="profile-toast-receipt">
                        <div className="profile-receipt-row">
                            <span>Reward Item:</span>
                            <span className="profile-receipt-value profile-ref-code">{redeemedRewardStr}</span>
                        </div>
                        <div className="profile-receipt-row">
                            <span>Points Spent:</span>
                            <span className="profile-receipt-value profile-spent-points">-{pointsSpent} pts</span>
                        </div>
                        <div className="profile-receipt-row profile-receipt-total">
                            <span>Points Remaining:</span>
                            <span className="profile-receipt-value">{userData?.points} pts</span>
                        </div>
                    </div>

                    <button
                        className="profile-toast-action pulse-btn"
                        onClick={() => {
                            if (userData?.activeReward === "FREE_MOLTEN_CAKE") navigate("/Products?category=desserts");
                            else if (userData?.activeReward === "FREE_PEPPERONI_PIZZA") navigate("/Products?category=main-course");
                            else navigate("/Products");
                        }}
                    >
                        Go to Menu 🍽️
                    </button>
                </div>

                <button className="profile-toast-close" onClick={() => setShowToast(false)}>&times;</button>
                <div className={"profile-toast-progress " + (showToast ? "run" : "")}></div>
            </div>

        </div>
    );
};


