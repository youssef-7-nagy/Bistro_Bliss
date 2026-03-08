import React, { useEffect, useState, useRef } from 'react';
import { useSelector } from 'react-redux';
import axios from 'axios';
import { toast } from 'react-toastify';
import { Form, Button, Row, Col } from "react-bootstrap";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import './AdminPanel.css'; 

export const AdminPanel = () => {
  const { userData } = useSelector((state) => state.user);
  const token = localStorage.getItem("token");
  
  // --- STATE ---
  const [activeTab, setActiveTab] = useState('overview'); 
  const [selectedMetric, setSelectedMetric] = useState('orders'); 

  // --- DATA ---
  const [users, setUsers] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [orders, setOrders] = useState([]);
  const [products, setProducts] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");

  // --- MENU FORM ---
  const [editingId, setEditingId] = useState(null); 
  const [formData, setFormData] = useState({ title: "", description: "", price: "", stock: "", category: "main course" });
  const imagesRef = useRef(); 

  // --- COLORS ---
  const COLORS = ['#4361ee', '#3a0ca3', '#f72585', '#4cc9f0', '#10b981', '#f59e0b'];

  // --- FETCH DATA ---
  const fetchData = async () => {
    if (!token) return;
    const config = { headers: { Authorization: `Bearer ${token}` } };
    try {
        if (activeTab === 'users' || activeTab === 'overview') {
            const res = await axios.get("http://localhost:8080/auth/users", config);
            setUsers(res.data.data);
        }
        if (activeTab === 'bookings' || activeTab === 'overview') {
            const res = await axios.get("http://localhost:8080/reservation/admin/all", config);
            setBookings(res.data.data);
        }
        if (activeTab === 'orders' || activeTab === 'overview') {
            const res = await axios.get("http://localhost:8080/order/admin/all", config);
            setOrders(res.data.data);
        }
        if (activeTab === 'menu' || activeTab === 'overview') {
            const res = await axios.get("http://localhost:8080/products");
            setProducts(res.data.data);
        }
    } catch (error) { console.error("Error fetching data", error); }
  };

  useEffect(() => { fetchData(); }, [activeTab, token]);

  // --- CHART DATA GENERATOR ---
  const getChartData = () => {
    let data = [];
    if (selectedMetric === 'orders') {
        data = [
            { name: 'Pending', value: orders.filter(o => o.status === 'pending').length },
            { name: 'Completed', value: orders.filter(o => o.status === 'completed').length },
            { name: 'Cancelled', value: orders.filter(o => o.status === 'cancelled').length },
        ];
    } else if (selectedMetric === 'bookings') {
        data = [
            { name: 'Pending', value: bookings.filter(b => b.status === 'pending' || !b.status).length },
            { name: 'Accepted', value: bookings.filter(b => b.status === 'Accepted').length },
            { name: 'Rejected', value: bookings.filter(b => b.status === 'Rejected').length },
        ];
    } else if (selectedMetric === 'users') {
        data = [
            { name: 'Admins', value: users.filter(u => u.role === 'admin').length },
            { name: 'Users', value: users.filter(u => u.role === 'user').length },
        ];
    } else if (selectedMetric === 'menu') {
        const stats = {};
        products.forEach(p => {
            const cat = p.category ? (p.category.charAt(0).toUpperCase() + p.category.slice(1)) : "Other";
            stats[cat] = (stats[cat] || 0) + 1;
        });
        data = Object.keys(stats).map(key => ({ name: key, value: stats[key] }));
    }
    return data;
  };

  const getChartTitle = () => {
      if (selectedMetric === 'orders') return "Order Status Distribution";
      if (selectedMetric === 'bookings') return "Reservation Status";
      if (selectedMetric === 'users') return "User Roles Breakdown";
      return "Menu Categories";
  };

// EXPORT CSV //
  const downloadOrdersCSV = () => {
    const headers = "Order ID,User,Total,Status\n";
    const rows = orders.map(o => `${o._id},${o.userName || 'Guest'},${o.totalAmount},${o.status}`).join("\n");
    const link = document.createElement("a");
    link.href = encodeURI("data:text/csv;charset=utf-8," + headers + rows);
    link.download = "orders_report.csv";
    link.click();
  };

  const downloadUsersCSV = () => {
    const headers = "User ID,Name,Email,Role\n";
    const rows = users.map(u => `${u._id},${u.name},${u.email},${u.role}`).join("\n");
    const link = document.createElement("a");
    link.href = encodeURI("data:text/csv;charset=utf-8," + headers + rows);
    link.download = "users_list.csv";
    link.click();
  };

  
  const filterData = (d, f) => !searchTerm ? d : d.filter(i => (i[f]?.toLowerCase().includes(searchTerm.toLowerCase()) || i._id?.includes(searchTerm)));

  const handleUserRoleChange = async (id, role) => {
    if (userData._id === id && !window.confirm("Change your own role?")) return;
    try { await axios.put(`http://localhost:8080/auth/users/${id}/role`, { role }, { headers: { Authorization: `Bearer ${token}` } }); toast.success("Updated"); fetchData(); } catch (e) { toast.error("Failed"); }
  };

  const handleMenuSubmit = async (e) => {
    e.preventDefault();
    try {
        const config = { headers: { Authorization: `Bearer ${token}` } };
        if (editingId) {
            await axios.put(`http://localhost:8080/products/${editingId}`, formData, config);
            toast.success("Updated");
        } else {
            const data = new FormData();
            Object.keys(formData).forEach(k => data.append(k, formData[k]));
            if (imagesRef.current.files[0]) for (let f of imagesRef.current.files) data.append("images", f);
            else return toast.error("Image needed");
            await axios.post("http://localhost:8080/products", data, { headers: { ...config.headers, "Content-Type": "multipart/form-data" } });
            toast.success("Created");
        }
        setFormData({ title: "", description: "", price: "", stock: "", category: "main course" }); setEditingId(null); if(imagesRef.current) imagesRef.current.value=""; fetchData();
    } catch (e) { toast.error("Failed"); }
  };

  const handleEditClick = (p) => { setEditingId(p._id); setFormData({ title: p.title, description: p.description, price: p.price, stock: p.stock, category: p.category }); window.scrollTo(0,0); };
  const handleDelete = async (id) => { if(window.confirm("Sure?")) { await axios.delete(`http://localhost:8080/products/${id}`, { headers: { Authorization: `Bearer ${token}` } }); fetchData(); }};
  const handleStatus = async (url, status) => { await axios.put(url, { status }, { headers: { Authorization: `Bearer ${token}` } }); fetchData(); };

  return (
    <div className="admin-wrapper">
      <aside className="admin-sidebar">
        <div className="admin-profile"><h3>Admin Panel</h3><p>Welcome, {userData?.name}</p></div>
        <nav className="admin-nav">
            {['overview','bookings','orders','users','menu'].map(t => (
                <button key={t} className={activeTab === t ? 'active' : ''} onClick={() => setActiveTab(t)}>{t.charAt(0).toUpperCase() + t.slice(1)}</button>
            ))}
        </nav>
      </aside>

      <main className="admin-main">
        {activeTab !== 'overview' && activeTab !== 'menu' && (
             <div className="admin-header-actions">
                <input type="text" placeholder="🔍 Search..." className="search-bar" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
                {activeTab === 'orders' && <button className="btn-export" onClick={downloadOrdersCSV}>📥 Export Orders</button>}
                {activeTab === 'users' && <button className="btn-export" onClick={downloadUsersCSV}>📥 Export Users</button>}
             </div>
        )}

        {/* OVERVIEW */}
        {activeTab === 'overview' && (
            <div className="overview-container">
                <div className="stats-grid">
                    <div className={`stat-box blue ${selectedMetric==='orders'?'active-metric':''}`} onClick={()=>setSelectedMetric('orders')}><h3>{orders.length}</h3><p>Orders</p></div>
                    <div className={`stat-box green ${selectedMetric==='bookings'?'active-metric':''}`} onClick={()=>setSelectedMetric('bookings')}><h3>{bookings.length}</h3><p>Reservations</p></div>
                    <div className={`stat-box purple ${selectedMetric==='users'?'active-metric':''}`} onClick={()=>setSelectedMetric('users')}><h3>{users.length}</h3><p>Users</p></div>
                    <div className={`stat-box orange ${selectedMetric==='menu'?'active-metric':''}`} onClick={()=>setSelectedMetric('menu')}><h3>{products.length}</h3><p>Items</p></div>
                </div>
                
                <div className="chart-section">
                    <h3>{getChartTitle()}</h3>
                    <div className="chart-wrapper">
                        <ResponsiveContainer width="100%" height={300}>
                            <PieChart>
                                <Pie data={getChartData()} cx="50%" cy="50%" innerRadius={60} outerRadius={80} fill="#8884d8" paddingAngle={5} dataKey="value">
                                    {getChartData().map((entry, index) => (<Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />))}
                                </Pie>
                                <Tooltip />
                                {/* REVERTED TO CLEAN STANDARD LEGEND */}
                                <Legend verticalAlign="bottom" height={36}/>
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>
        )}

        {/* BOOKINGS */}
        {activeTab === 'bookings' && (
            <div className="panel-section">
                <h2>Reservations</h2>
                <table className="admin-table">
                    <thead><tr><th>Name</th><th>Date</th><th>Guests</th><th>Status</th><th>Action</th></tr></thead>
                    <tbody>
                        {filterData(bookings, 'name').map(b => (
                            <tr key={b._id}><td>{b.name}</td><td>{b.date}</td><td>{b.guests}</td><td><span className={`badge ${b.status}`}>{b.status}</span></td>
                            <td><button className="btn-icon check" onClick={()=>handleStatus(`http://localhost:8080/reservation/${b._id}/status`,'Accepted')}>✓</button><button className="btn-icon cross" onClick={()=>handleStatus(`http://localhost:8080/reservation/${b._id}/status`,'Rejected')}>✕</button></td></tr>
                        ))}
                    </tbody>
                </table>
            </div>
        )}

        {/* ORDERS */}
        {activeTab === 'orders' && (
            <div className="panel-section">
                <h2>Orders</h2>
                <table className="admin-table">
                    <thead><tr><th>ID</th><th>User</th><th>Total</th><th>Status</th><th>Update</th></tr></thead>
                    <tbody>
                        {filterData(orders, 'userName').map(o => (
                            <tr key={o._id}><td>#{o._id.slice(-6)}</td><td>{o.userName||"Guest"}</td><td>{o.totalAmount}</td><td><span className={`badge ${o.status}`}>{o.status}</span></td>
                            <td><select className="status-select" value={o.status} onChange={(e)=>handleStatus(`http://localhost:8080/order/${o._id}/status`, e.target.value)}><option value="pending">Pending</option><option value="completed">Completed</option><option value="cancelled">Cancelled</option></select></td></tr>
                        ))}
                    </tbody>
                </table>
            </div>
        )}

        {/* USERS */}
        {activeTab === 'users' && (
            <div className="panel-section">
                <h2>Users</h2>
                <table className="admin-table">
                    <thead><tr><th>Name</th><th>Email</th><th>Role</th><th>Change</th></tr></thead>
                    <tbody>
                        {filterData(users, 'name').map(u => (
                            <tr key={u._id}><td>{u.name}</td><td>{u.email}</td><td><span className={`badge role ${u.role==='admin'?'admin-badge':'user-badge'}`}>{u.role}</span></td>
                            <td><select className="status-select" value={u.role} onChange={(e)=>handleUserRoleChange(u._id, e.target.value)} disabled={u._id===userData._id}><option value="user">User</option><option value="admin">Admin</option></select></td></tr>
                        ))}
                    </tbody>
                </table>
            </div>
        )}

        {/* MENU */}
        {activeTab === 'menu' && (
            <div className="panel-section">
                <div className="menu-form-card">
                    <div className="form-header">
                        <div className="form-icon">{editingId ? "✏️" : "✨"}</div>
                        <div>
                            <h3>{editingId ? "Edit Delicacy" : "Add New Dish"}</h3>
                            <p>Curate your restaurant's menu with style</p>
                        </div>
                    </div>
                    
                    <Form onSubmit={handleMenuSubmit} className="perfect-form">
                        <Row>
                            <Col md={8}>
                                <div className="input-group-modern">
                                    <label>Dish Name</label>
                                    <Form.Control type="text" placeholder="e.g. Truffle Risotto" name="title" value={formData.title} onChange={(e)=>setFormData({...formData,title:e.target.value})} required />
                                </div>
                            </Col>
                            <Col md={4}>
                                <div className="input-group-modern">
                                    <label>Price (EGP)</label>
                                    <Form.Control type="number" placeholder="0.00" name="price" value={formData.price} onChange={(e)=>setFormData({...formData,price:e.target.value})} required />
                                </div>
                            </Col>
                        </Row>

                        <Row>
                            <Col md={6}>
                                <div className="input-group-modern">
                                    <label>Category</label>
                                    <Form.Select name="category" value={formData.category} onChange={(e)=>setFormData({...formData,category:e.target.value})}>
                                        <option value="main course">Main Course</option>
                                        <option value="breakfast">Breakfast</option>
                                        <option value="desserts">Desserts</option>
                                        <option value="drinks">Drinks</option>
                                    </Form.Select>
                                </div>
                            </Col>
                            <Col md={6}>
                                <div className="input-group-modern">
                                    <label>Stock Quantity</label>
                                    <Form.Control type="number" placeholder="Available Qty" name="stock" value={formData.stock} onChange={(e)=>setFormData({...formData,stock:e.target.value})} />
                                </div>
                            </Col>
                        </Row>

                        <div className="input-group-modern file-group">
                            <label>Upload Image</label>
                            <div className="custom-file-upload">
                                <Form.Control type="file" multiple ref={imagesRef} className="file-input" />
                                <div className="upload-content">
                                    <span className="upload-icon">📂</span>
                                    <span>Drag & Drop or Click to Upload</span>
                                </div>
                            </div>
                        </div>

                        <div className="input-group-modern">
                            <label>Description</label>
                            <Form.Control as="textarea" rows={4} placeholder="Describe the flavors and ingredients..." name="description" value={formData.description} onChange={(e)=>setFormData({...formData,description:e.target.value})} />
                        </div>

                        <div className="form-actions-modern">
                            <Button type="submit" className="btn-save">{editingId ? "Save Changes" : "Publish Dish"}</Button>
                            {editingId && <Button variant="link" onClick={()=>setEditingId(null)} className="btn-cancel">Cancel</Button>}
                        </div>
                    </Form>
                </div>

                <div className="menu-grid">
                    {products.map(p => (
                        <div key={p._id} className="menu-card-mini">
                            <div className="card-img-holder">
                                <img src={p.images?.[0]?`http://localhost:8080/${p.images[0]}`:"https://via.placeholder.com/150"} alt="" />
                            </div>
                            <div className="menu-info"><h4>{p.title}</h4><span>{p.price} EGP</span></div>
                            <div className="menu-actions">
                                <button className="btn-action edit" onClick={()=>handleEditClick(p)}>✏️</button>
                                <button className="btn-action delete" onClick={()=>handleDelete(p._id)}>🗑️</button>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        )}
      </main>
    </div>
  );
};