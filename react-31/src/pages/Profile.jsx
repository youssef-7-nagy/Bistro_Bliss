import React, { useEffect, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { logout, setUser } from "../store/slices/userSlice";
import axios from 'axios';
import './Profile.css';

export const Profile = () => {
    const { islogged, userData } = useSelector((state) => state.user);
    const dispatch = useDispatch();
    const navigate = useNavigate();


    const [activeTab, setActiveTab] = useState('overview'); // 'overview', 'orders', 'reservations', 'settings'
    const [myBookings, setMyBookings] = useState([]);
    const [myOrders, setMyOrders] = useState([]);

    const [editForm, setEditForm] = useState({
        name: "",
        phone: "",
        password: ""
    });


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
            const res = await axios.get(`http://localhost:8080/reservation/user/my-reservations`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setMyBookings(res.data);
        } catch (error) { console.error(error); }
    };

    const fetchMyOrders = async () => {
        try {
            const token = localStorage.getItem("token");
            const res = await axios.get(`http://localhost:8080/order/user/my-orders`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setMyOrders(res.data.data);
        } catch (error) { console.error(error); }
    };


    const handleUpdateProfile = async (e) => {
        e.preventDefault();
        try {
            const token = localStorage.getItem("token");
            const res = await axios.put("http://localhost:8080/auth/update", editForm, {
                headers: { Authorization: `Bearer ${token}` }
            });
            alert(res.data.message);
            dispatch(setUser({ ...userData, ...res.data.data.user }));
        } catch (error) { alert("Update failed"); }
    };

    const handleLogout = () => {
        dispatch(logout());
        navigate("/login");
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
                                                <td>{order.items.map(i => <div key={i._id}>{i.quantity}x {i.title}</div>)}</td>
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
                            <button className="btn-save">Save Changes</button>
                        </form>
                    </div>
                );
            default: // OVERVIEW
                return (
                    <div className="overview-grid fade-in">

                        <div className="stat-card blue" onClick={() => setActiveTab('orders')} style={{ cursor: 'pointer' }}>
                            <h3>{myOrders.length}</h3>
                            <p>Total Orders</p>
                        </div>
                        <div className="stat-card purple" onClick={() => setActiveTab('reservations')} style={{ cursor: 'pointer' }}>
                            <h3>{myBookings.length}</h3>
                            <p>Reservations</p>
                        </div>
                        <div className="stat-card orange">
                            <h3>{userData.role}</h3>
                            <p>Account Type</p>
                        </div>


                        <div className="dashboard-card full-width">
                            <div className="card-header">
                                <h3>Welcome Back, {userData.name}!</h3>
                                <p>Manage your orders and bookings from the menu.</p>
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
                    <button className={activeTab === 'settings' ? 'active' : ''} onClick={() => setActiveTab('settings')}>
                        ⚙️ Settings
                    </button>
                </nav>

                <button className="btn-logout" onClick={handleLogout}>Log Out</button>
            </aside>


            <main className="dashboard-content">
                {renderContent()}
            </main>
        </div>
    );
};