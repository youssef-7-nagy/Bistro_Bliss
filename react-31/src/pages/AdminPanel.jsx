import API_URL from "../utils/api";
import React, { useEffect, useState, useRef, useMemo, useCallback } from 'react';
import { useSelector } from 'react-redux';
import axios from 'axios';
import { toast } from 'react-toastify';
import { Form, Button, Row, Col } from "react-bootstrap";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { FiCheck, FiChevronLeft, FiChevronRight, FiEdit2, FiImage, FiPlus, FiTrash2, FiUploadCloud, FiX } from "react-icons/fi";
import './AdminPanel.css'; 

const ORDER_STATUS_WEIGHT = { pending: 0, delivered: 1, completed: 2, cancelled: 3 };
const MAX_UPLOAD_IMAGES = 5;
const normalize = (value) => String(value || "").toLowerCase();
const hasCustomizationNotes = (order) =>
  (order.items || []).some((item) => String(item.specialInstructions || "").trim().length > 0);
const escapeCsv = (value) => `"${String(value ?? "").replace(/"/g, '""')}"`;
const ExportFileIcon = () => (
  <svg fill="#fff" xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 50 50" aria-hidden="true">
    <path d="M28.8125 .03125L.8125 5.34375C.339844 5.433594 0 5.863281 0 6.34375L0 43.65625C0 44.136719 .339844 44.566406 .8125 44.65625L28.8125 49.96875C28.875 49.980469 28.9375 50 29 50C29.230469 50 29.445313 49.929688 29.625 49.78125C29.855469 49.589844 30 49.296875 30 49L30 1C30 .703125 29.855469 .410156 29.625 .21875C29.394531 .0273438 29.105469 -.0234375 28.8125 .03125ZM32 6L32 13L34 13L34 15L32 15L32 20L34 20L34 22L32 22L32 27L34 27L34 29L32 29L32 35L34 35L34 37L32 37L32 44L47 44C48.101563 44 49 43.101563 49 42L49 8C49 6.898438 48.101563 6 47 6ZM36 13L44 13L44 15L36 15ZM6.6875 15.6875L11.8125 15.6875L14.5 21.28125C14.710938 21.722656 14.898438 22.265625 15.0625 22.875L15.09375 22.875C15.199219 22.511719 15.402344 21.941406 15.6875 21.21875L18.65625 15.6875L23.34375 15.6875L17.75 24.9375L23.5 34.375L18.53125 34.375L15.28125 28.28125C15.160156 28.054688 15.035156 27.636719 14.90625 27.03125L14.875 27.03125C14.8125 27.316406 14.664063 27.761719 14.4375 28.34375L11.1875 34.375L6.1875 34.375L12.15625 25.03125ZM36 20L44 20L44 22L36 22ZM36 27L44 27L44 29L36 29ZM36 35L44 35L44 37L36 37Z"></path>
  </svg>
);

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
  const [fetchError, setFetchError] = useState("");
  const [loading, setLoading] = useState({
    users: false,
    bookings: false,
    orders: false,
    products: false,
  });
  const [statusBusyId, setStatusBusyId] = useState("");

  // Orders operations controls
  const [orderStatusFilter, setOrderStatusFilter] = useState("all");
  const [orderPaymentFilter, setOrderPaymentFilter] = useState("all");
  const [orderCustomizationFilter, setOrderCustomizationFilter] = useState("all");
  const [orderSortBy, setOrderSortBy] = useState("newest");

  // --- MENU FORM ---
  const [editingId, setEditingId] = useState(null); 
  const [formData, setFormData] = useState({ title: "", description: "", price: "", stock: "", category: "main course" });
  const [selectedImages, setSelectedImages] = useState([]);
  const [isDragActive, setIsDragActive] = useState(false);
  const imagesRef = useRef();

  // --- COLORS ---
  const COLORS = ['#4361ee', '#3a0ca3', '#f72585', '#4cc9f0', '#10b981', '#f59e0b'];

  const setLoadingFor = useCallback((keys, value) => {
    setLoading((prev) => {
      const next = { ...prev };
      keys.forEach((key) => {
        next[key] = value;
      });
      return next;
    });
  }, []);

  const syncFileInputWithSelection = useCallback((files) => {
    if (!imagesRef.current) return;
    try {
      const transfer = new DataTransfer();
      files.forEach((file) => transfer.items.add(file));
      imagesRef.current.files = transfer.files;
    } catch (error) {
      if (files.length === 0) {
        imagesRef.current.value = "";
      }
    }
  }, []);

  const clearMenuUploadFiles = useCallback(() => {
    setSelectedImages([]);
    setIsDragActive(false);
    if (imagesRef.current) {
      imagesRef.current.value = "";
    }
  }, []);

  const setMenuUploadFiles = useCallback((incomingFiles) => {
    const rawFiles = Array.from(incomingFiles || []);
    if (!rawFiles.length) {
      clearMenuUploadFiles();
      return;
    }

    const imageFiles = rawFiles.filter((file) => String(file.type || "").startsWith("image/"));
    if (rawFiles.length !== imageFiles.length) {
      toast.warning("Only image files are allowed.");
    }

    const limitedFiles = imageFiles.slice(0, MAX_UPLOAD_IMAGES);
    if (imageFiles.length > MAX_UPLOAD_IMAGES) {
      toast.info(`Only the first ${MAX_UPLOAD_IMAGES} images were selected.`);
    }

    setSelectedImages(limitedFiles);
    syncFileInputWithSelection(limitedFiles);
  }, [clearMenuUploadFiles, syncFileInputWithSelection]);

  const imagePreviews = useMemo(() => {
    return selectedImages.map((file, index) => ({
      id: `${file.name}-${file.lastModified}-${index}`,
      name: file.name,
      size: file.size,
      url: URL.createObjectURL(file),
    }));
  }, [selectedImages]);

  useEffect(() => {
    return () => {
      imagePreviews.forEach((preview) => URL.revokeObjectURL(preview.url));
    };
  }, [imagePreviews]);

  const formatFileSize = useCallback((bytes) => {
    if (bytes >= 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  }, []);

  // --- FETCH DATA ---
  const fetchData = useCallback(async (tabName = activeTab) => {
    if (!token) return;

    const config = { headers: { Authorization: `Bearer ${token}` } };
    const loadingMap = {
      overview: ["users", "bookings", "orders", "products"],
      users: ["users"],
      bookings: ["bookings"],
      orders: ["orders"],
      menu: ["products"],
    };

    setFetchError("");
    setLoadingFor(loadingMap[tabName] || [], true);

    try {
      if (tabName === "overview") {
        const [usersRes, bookingsRes, ordersRes, productsRes] = await Promise.all([
          axios.get(`${API_URL}/auth/users`, config),
          axios.get(`${API_URL}/reservation/admin/all`, config),
          axios.get(`${API_URL}/order/admin/all`, config),
          axios.get(`${API_URL}/products`),
        ]);
        setUsers(usersRes.data.data || []);
        setBookings(bookingsRes.data.data || []);
        setOrders(ordersRes.data.data || []);
        setProducts(productsRes.data.data || []);
      } else if (tabName === "users") {
        const usersRes = await axios.get(`${API_URL}/auth/users`, config);
        setUsers(usersRes.data.data || []);
      } else if (tabName === "bookings") {
        const bookingsRes = await axios.get(`${API_URL}/reservation/admin/all`, config);
        setBookings(bookingsRes.data.data || []);
      } else if (tabName === "orders") {
        const ordersRes = await axios.get(`${API_URL}/order/admin/all`, config);
        setOrders(ordersRes.data.data || []);
      } else if (tabName === "menu") {
        const productsRes = await axios.get(`${API_URL}/products`);
        setProducts(productsRes.data.data || []);
      }
    } catch (error) {
      console.error("Error fetching data", error);
      setFetchError(error.response?.data?.message || "Failed to load data. Please try again.");
    } finally {
      setLoadingFor(loadingMap[tabName] || [], false);
    }
  }, [activeTab, setLoadingFor, token]);

  useEffect(() => {
    fetchData(activeTab);
  }, [activeTab, fetchData]);

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

  const formatConfirmedDateTime = (dateValue) => {
    if (!dateValue) return "-";
    const parsedDate = new Date(dateValue);
    if (Number.isNaN(parsedDate.getTime())) return "-";

    return parsedDate.toLocaleString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
  };

  const normalizedSearch = useMemo(() => normalize(searchTerm).trim(), [searchTerm]);

  const filteredUsers = useMemo(() => {
    if (!normalizedSearch) return users;
    return users.filter((user) =>
      `${user._id} ${user.name} ${user.email} ${user.role}`.toLowerCase().includes(normalizedSearch)
    );
  }, [users, normalizedSearch]);

  const filteredBookings = useMemo(() => {
    if (!normalizedSearch) return bookings;
    return bookings.filter((booking) =>
      `${booking._id} ${booking.name} ${booking.date} ${booking.status || ""}`
        .toLowerCase()
        .includes(normalizedSearch)
    );
  }, [bookings, normalizedSearch]);

  const filteredOrders = useMemo(() => {
    const filtered = orders.filter((order) => {
      const orderStatus = normalize(order.status);
      const paymentMethod = normalize(order.paymentMethod || "cash");
      const noteExists = hasCustomizationNotes(order);

      if (orderStatusFilter !== "all" && orderStatus !== orderStatusFilter) return false;
      if (orderPaymentFilter !== "all" && paymentMethod !== orderPaymentFilter) return false;
      if (orderCustomizationFilter === "with-notes" && !noteExists) return false;
      if (orderCustomizationFilter === "without-notes" && noteExists) return false;

      if (!normalizedSearch) return true;

      const itemsText = (order.items || [])
        .map((item) => `${item.title || ""} ${item.specialInstructions || ""}`)
        .join(" ")
        .toLowerCase();

      return `${order._id} ${order.userName || ""} ${itemsText} ${orderStatus} ${paymentMethod}`
        .toLowerCase()
        .includes(normalizedSearch);
    });

    return filtered.sort((a, b) => {
      const aDate = new Date(a.createdAt || 0).getTime();
      const bDate = new Date(b.createdAt || 0).getTime();
      const aTotal = Number(a.totalAmount || 0);
      const bTotal = Number(b.totalAmount || 0);
      const aUser = String(a.userName || "");
      const bUser = String(b.userName || "");

      switch (orderSortBy) {
        case "oldest":
          return aDate - bDate;
        case "total-high":
          return bTotal - aTotal;
        case "total-low":
          return aTotal - bTotal;
        case "user-az":
          return aUser.localeCompare(bUser);
        case "user-za":
          return bUser.localeCompare(aUser);
        case "status":
          return (
            (ORDER_STATUS_WEIGHT[normalize(a.status)] ?? 99) -
            (ORDER_STATUS_WEIGHT[normalize(b.status)] ?? 99)
          );
        case "newest":
        default:
          return bDate - aDate;
      }
    });
  }, [
    orders,
    orderStatusFilter,
    orderPaymentFilter,
    orderCustomizationFilter,
    normalizedSearch,
    orderSortBy,
  ]);

  const orderSummary = useMemo(() => {
    const withNotes = filteredOrders.filter((order) => hasCustomizationNotes(order)).length;
    const totalRevenue = filteredOrders.reduce((sum, order) => sum + Number(order.totalAmount || 0), 0);
    return { count: filteredOrders.length, withNotes, totalRevenue };
  }, [filteredOrders]);

  const downloadOrdersCSV = () => {
    const headers = "Order ID,User,Items,Custom Notes,Total,Payment,Status,Confirmed Time\n";
    const rows = filteredOrders
      .map((order) => {
        const items = (order.items || []).map((item) => `${item.quantity}x ${item.title}`).join(" | ");
        const notes = (order.items || [])
          .filter((item) => String(item.specialInstructions || "").trim())
          .map((item) => `${item.title}: ${item.specialInstructions}`)
          .join(" | ");

        return [order._id, order.userName || "Guest", items, notes, order.totalAmount, order.paymentMethod || "cash", order.status, formatConfirmedDateTime(order.createdAt)]
          .map(escapeCsv)
          .join(",");
      })
      .join("\n");

    const link = document.createElement("a");
    link.href = encodeURI(`data:text/csv;charset=utf-8,${headers}${rows}`);
    link.download = "orders_report.csv";
    link.click();
    toast.info("Orders exported successfully.");
  };

  const downloadUsersCSV = () => {
    const headers = "User ID,Name,Email,Role\n";
    const rows = filteredUsers
      .map((user) => [user._id, user.name, user.email, user.role].map(escapeCsv).join(","))
      .join("\n");
    const link = document.createElement("a");
    link.href = encodeURI(`data:text/csv;charset=utf-8,${headers}${rows}`);
    link.download = "users_list.csv";
    link.click();
    toast.info("Users exported successfully.");
  };

  const handleUserRoleChange = async (id, role) => {
    if (userData._id === id && !window.confirm("Change your own role?")) return;
    try {
      await axios.put(`${API_URL}/auth/users/${id}/role`, { role }, { headers: { Authorization: `Bearer ${token}` } });
      setUsers((prev) => prev.map((user) => (user._id === id ? { ...user, role } : user)));
      toast.success(`Role changed to ${role}.`);
    } catch (error) {
      toast.error("Failed to update user role.");
    }
  };

  const handleMenuSubmit = async (e) => {
    e.preventDefault();
    try {
      const config = { headers: { Authorization: `Bearer ${token}` } };
      if (editingId) {
        await axios.put(`${API_URL}/products/${editingId}`, formData, config);
        toast.success("Dish updated.");
      } else {
        const data = new FormData();
        Object.keys(formData).forEach((key) => data.append(key, formData[key]));
        if (selectedImages.length > 0) {
          selectedImages.forEach((file) => data.append("images", file));
        } else {
          return toast.error("At least one image is required.");
        }
        await axios.post(`${API_URL}/products`, data, {
          headers: { ...config.headers, "Content-Type": "multipart/form-data" },
        });
        toast.success("Dish created.");
      }

      setFormData({ title: "", description: "", price: "", stock: "", category: "main course" });
      setEditingId(null);
      clearMenuUploadFiles();
      fetchData("menu");
    } catch (error) {
      toast.error("Failed to save dish.");
    }
  };

  const handleEditClick = (product) => {
    clearMenuUploadFiles();
    setEditingId(product._id);
    setFormData({
      title: product.title,
      description: product.description,
      price: product.price,
      stock: product.stock,
      category: product.category,
    });
    window.scrollTo(0, 0);
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this dish?")) return;
    try {
      await axios.delete(`${API_URL}/products/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setProducts((prev) => prev.filter((product) => product._id !== id));
      toast.success("Dish removed.");
    } catch (error) {
      toast.error("Failed to delete dish.");
    }
  };

  const handleMoveProduct = async (index, direction) => {
    if (direction === -1 && index === 0) return;
    if (direction === 1 && index === products.length - 1) return;

    const reordered = [...products];
    const temp = reordered[index];
    reordered[index] = reordered[index + direction];
    reordered[index + direction] = temp;
    reordered.forEach((product, orderIndex) => {
      product.order = orderIndex;
    });

    setProducts(reordered);

    try {
      const payload = reordered.map((product) => ({ id: product._id, order: product.order }));
      await axios.put(
        `${API_URL}/products/reorder`,
        { items: payload },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success("Menu order updated.");
    } catch (error) {
      toast.error("Failed to reorder menu.");
      fetchData("menu");
    }
  };

  const updateOrderStatus = async (orderId, status) => {
    try {
      setStatusBusyId(orderId);
      await axios.put(
        `${API_URL}/order/${orderId}/status`,
        { status },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setOrders((prev) => prev.map((order) => (order._id === orderId ? { ...order, status } : order)));
      toast.success(`Order marked as ${status}.`);
    } catch (error) {
      toast.error("Failed to update order.");
    } finally {
      setStatusBusyId("");
    }
  };

  const updateReservationStatus = async (reservationId, status) => {
    try {
      await axios.put(
        `${API_URL}/reservation/${reservationId}/status`,
        { status },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setBookings((prev) =>
        prev.map((booking) => (booking._id === reservationId ? { ...booking, status } : booking))
      );
      toast.success(`Reservation set to ${status}.`);
    } catch (error) {
      toast.error("Failed to update reservation.");
    }
  };

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
                <input
                  type="text"
                  placeholder={activeTab === "orders" ? "Search order ID, user, item, or note" : "Search"}
                  className="search-bar"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
                <div className="admin-header-buttons">
                  <button className="btn-export btn-refresh" onClick={() => fetchData(activeTab)}>Refresh</button>
                  {activeTab === 'orders' && (
                    <button className="container-btn-file" onClick={downloadOrdersCSV}>
                      <ExportFileIcon />
                      Export Orders
                    </button>
                  )}
                  {activeTab === 'users' && (
                    <button className="container-btn-file" onClick={downloadUsersCSV}>
                      <ExportFileIcon />
                      Export Users
                    </button>
                  )}
                </div>
             </div>
        )}

        {/* OVERVIEW */}
        {activeTab === 'overview' && (
            <div className="overview-container">
                {fetchError ? (
                  <div className="admin-state-card error">
                    <h3>Failed to load dashboard data</h3>
                    <p>{fetchError}</p>
                    <button type="button" onClick={() => fetchData("overview")}>Retry</button>
                  </div>
                ) : (loading.users || loading.bookings || loading.orders || loading.products) ? (
                  <>
                    <div className="stats-grid">
                      {Array.from({ length: 4 }).map((_, idx) => (
                        <div key={idx} className="stat-box stat-skeleton"></div>
                      ))}
                    </div>
                    <div className="chart-section chart-skeleton"></div>
                  </>
                ) : (
                  <>
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
                                    <Legend verticalAlign="bottom" height={36}/>
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                  </>
                )}
            </div>
        )}

        {/* BOOKINGS */}
        {activeTab === 'bookings' && (
            <div className="panel-section">
                <h2>Reservations</h2>
                {loading.bookings ? (
                  <div className="admin-skeleton-table">
                    {Array.from({ length: 6 }).map((_, idx) => <div key={idx} className="admin-skeleton-row"></div>)}
                  </div>
                ) : fetchError ? (
                  <div className="admin-state-card error">
                    <h3>Failed to load reservations</h3>
                    <p>{fetchError}</p>
                    <button type="button" onClick={() => fetchData("bookings")}>Retry</button>
                  </div>
                ) : filteredBookings.length === 0 ? (
                  <div className="admin-state-card">
                    <h3>No reservations found</h3>
                    <p>Try changing the search term.</p>
                  </div>
                ) : (
                  <table className="admin-table">
                      <thead><tr><th>Name</th><th>Date</th><th>Guests</th><th>Status</th><th>Action</th></tr></thead>
                      <tbody>
                          {filteredBookings.map(b => (
                              <tr key={b._id}>
                                <td>{b.name}</td>
                                <td>{b.date}</td>
                                <td>{b.guests}</td>
                                <td><span className={`badge ${b.status}`}>{b.status}</span></td>
                                <td>
                                  <button
                                    className="btn-icon check"
                                    onClick={() => updateReservationStatus(b._id, 'Accepted')}
                                    title="Accept reservation"
                                    aria-label="Accept reservation"
                                  >
                                    <FiCheck />
                                  </button>
                                  <button
                                    className="btn-icon cross"
                                    onClick={() => updateReservationStatus(b._id, 'Rejected')}
                                    title="Reject reservation"
                                    aria-label="Reject reservation"
                                  >
                                    <FiX />
                                  </button>
                                </td>
                              </tr>
                          ))}
                      </tbody>
                  </table>
                )}
            </div>
        )}

        {/* ORDERS */}
        {activeTab === 'orders' && (
            <div className="panel-section">
                <div className="orders-title-row">
                  <h2>Orders</h2>
                  <div className="orders-summary-pills">
                    <span className="orders-summary-pill">{orderSummary.count} filtered</span>
                    <span className="orders-summary-pill">{orderSummary.withNotes} with notes</span>
                    <span className="orders-summary-pill">{orderSummary.totalRevenue.toFixed(2)} EGP</span>
                  </div>
                </div>

                <div className="orders-toolbar">
                  <div className="orders-filter-group">
                    <label>Status</label>
                    <select value={orderStatusFilter} onChange={(e) => setOrderStatusFilter(e.target.value)}>
                      <option value="all">All</option>
                      <option value="pending">Pending</option>
                      <option value="delivered">Delivered</option>
                      <option value="completed">Completed</option>
                      <option value="cancelled">Cancelled</option>
                    </select>
                  </div>

                  <div className="orders-filter-group">
                    <label>Payment</label>
                    <select value={orderPaymentFilter} onChange={(e) => setOrderPaymentFilter(e.target.value)}>
                      <option value="all">All</option>
                      <option value="cash">Cash</option>
                      <option value="visa">Visa</option>
                    </select>
                  </div>

                  <div className="orders-filter-group">
                    <label>Customization</label>
                    <select value={orderCustomizationFilter} onChange={(e) => setOrderCustomizationFilter(e.target.value)}>
                      <option value="all">All</option>
                      <option value="with-notes">With notes</option>
                      <option value="without-notes">Without notes</option>
                    </select>
                  </div>

                  <div className="orders-filter-group">
                    <label>Sort by</label>
                    <select value={orderSortBy} onChange={(e) => setOrderSortBy(e.target.value)}>
                      <option value="newest">Newest</option>
                      <option value="oldest">Oldest</option>
                      <option value="total-high">Total: High to low</option>
                      <option value="total-low">Total: Low to high</option>
                      <option value="user-az">User: A to Z</option>
                      <option value="user-za">User: Z to A</option>
                      <option value="status">Status</option>
                    </select>
                  </div>

                  <button
                    className="orders-reset-btn"
                    onClick={() => {
                      setOrderStatusFilter("all");
                      setOrderPaymentFilter("all");
                      setOrderCustomizationFilter("all");
                      setOrderSortBy("newest");
                      setSearchTerm("");
                    }}
                  >
                    Reset
                  </button>
                </div>

                {loading.orders ? (
                  <div className="admin-skeleton-table">
                    {Array.from({ length: 7 }).map((_, idx) => <div key={idx} className="admin-skeleton-row"></div>)}
                  </div>
                ) : fetchError ? (
                  <div className="admin-state-card error">
                    <h3>Failed to load orders</h3>
                    <p>{fetchError}</p>
                    <button type="button" onClick={() => fetchData("orders")}>Retry</button>
                  </div>
                ) : filteredOrders.length === 0 ? (
                  <div className="admin-state-card">
                    <h3>No orders found</h3>
                    <p>Try changing filters or search text.</p>
                  </div>
                ) : (
                  <>
                    <div className="orders-desktop-view">
                      <table className="admin-table orders-table">
                          <thead><tr><th>ID</th><th>User</th><th>Items</th><th>Total</th><th>Payment</th><th>Status</th><th>Confirmed</th><th>Kitchen</th></tr></thead>
                          <tbody>
                              {filteredOrders.map(o => (
                                  <tr key={o._id}>
                                    <td>#{o._id.slice(-6)}</td>
                                    <td>{o.userName || "Guest"}</td>
                                    <td className="order-items-cell">
                                      {(o.items || []).map((item, idx) => (
                                        <div key={item._id || `${o._id}-${idx}`} className="order-item-row">
                                          <span>{item.quantity}x {item.title}</span>
                                          {item.specialInstructions && (
                                            <small className="order-item-custom-note">Customization: {item.specialInstructions}</small>
                                          )}
                                        </div>
                                      ))}
                                    </td>
                                    <td>{Number(o.totalAmount || 0).toFixed(2)} EGP</td>
                                    <td><span className="payment-pill">{o.paymentMethod || "cash"}</span></td>
                                    <td><span className={`badge ${o.status}`}>{o.status}</span></td>
                                    <td className="order-confirmed-time">{formatConfirmedDateTime(o.createdAt)}</td>
                                    <td>
                                      <div className="kitchen-actions-cell">
                                        <select
                                          className="status-select"
                                          value={o.status}
                                          onChange={(e) => updateOrderStatus(o._id, e.target.value)}
                                          disabled={statusBusyId === o._id}
                                        >
                                          <option value="pending">Pending</option>
                                          <option value="delivered">Delivered</option>
                                          <option value="completed">Completed</option>
                                          <option value="cancelled">Cancelled</option>
                                        </select>
                                        <div className="quick-action-group">
                                          <button className="btn-quick neutral" onClick={() => updateOrderStatus(o._id, "delivered")} disabled={statusBusyId === o._id || normalize(o.status) === "delivered"}>Deliver</button>
                                          <button className="btn-quick success" onClick={() => updateOrderStatus(o._id, "completed")} disabled={statusBusyId === o._id || normalize(o.status) === "completed"}>Complete</button>
                                          <button className="btn-quick danger" onClick={() => updateOrderStatus(o._id, "cancelled")} disabled={statusBusyId === o._id || normalize(o.status) === "cancelled"}>Cancel</button>
                                        </div>
                                      </div>
                                    </td>
                                  </tr>
                              ))}
                          </tbody>
                      </table>
                    </div>

                    <div className="orders-mobile-view">
                      {filteredOrders.map((order) => (
                        <article key={order._id} className="order-mobile-card">
                          <header className="order-mobile-header">
                            <strong>#{order._id.slice(-6)}</strong>
                            <span className={`badge ${order.status}`}>{order.status}</span>
                          </header>
                          <div className="order-mobile-meta">
                            <span>{order.userName || "Guest"}</span>
                            <span>{Number(order.totalAmount || 0).toFixed(2)} EGP</span>
                            <span>{order.paymentMethod || "cash"}</span>
                            <span>{formatConfirmedDateTime(order.createdAt)}</span>
                          </div>
                          <div className="order-mobile-items">
                            {(order.items || []).map((item, idx) => (
                              <div key={item._id || `${order._id}-m-${idx}`} className="order-item-row">
                                <span>{item.quantity}x {item.title}</span>
                                {item.specialInstructions && (
                                  <small className="order-item-custom-note">Customization: {item.specialInstructions}</small>
                                )}
                              </div>
                            ))}
                          </div>
                          <div className="quick-action-group mobile">
                            <button className="btn-quick neutral" onClick={() => updateOrderStatus(order._id, "delivered")} disabled={statusBusyId === order._id || normalize(order.status) === "delivered"}>Deliver</button>
                            <button className="btn-quick success" onClick={() => updateOrderStatus(order._id, "completed")} disabled={statusBusyId === order._id || normalize(order.status) === "completed"}>Complete</button>
                            <button className="btn-quick danger" onClick={() => updateOrderStatus(order._id, "cancelled")} disabled={statusBusyId === order._id || normalize(order.status) === "cancelled"}>Cancel</button>
                          </div>
                        </article>
                      ))}
                    </div>
                  </>
                )}
            </div>
        )}

        {/* USERS */}
        {activeTab === 'users' && (
            <div className="panel-section">
                <h2>Users</h2>
                {loading.users ? (
                  <div className="admin-skeleton-table">
                    {Array.from({ length: 6 }).map((_, idx) => <div key={idx} className="admin-skeleton-row"></div>)}
                  </div>
                ) : fetchError ? (
                  <div className="admin-state-card error">
                    <h3>Failed to load users</h3>
                    <p>{fetchError}</p>
                    <button type="button" onClick={() => fetchData("users")}>Retry</button>
                  </div>
                ) : filteredUsers.length === 0 ? (
                  <div className="admin-state-card">
                    <h3>No users found</h3>
                    <p>Try changing the search term.</p>
                  </div>
                ) : (
                  <table className="admin-table">
                      <thead><tr><th>Name</th><th>Email</th><th>Role</th><th>Change</th></tr></thead>
                      <tbody>
                          {filteredUsers.map(u => (
                              <tr key={u._id}>
                                <td>{u.name}</td>
                                <td>{u.email}</td>
                                <td><span className={`badge role ${u.role==='admin'?'admin-badge':'user-badge'}`}>{u.role}</span></td>
                                <td><select className="status-select" value={u.role} onChange={(e)=>handleUserRoleChange(u._id, e.target.value)} disabled={u._id===userData._id}><option value="user">User</option><option value="admin">Admin</option></select></td>
                              </tr>
                          ))}
                      </tbody>
                  </table>
                )}
            </div>
        )}

        {/* MENU */}
        {activeTab === 'menu' && (
            <div className="panel-section">
                <div className="menu-form-card">
                    <div className="form-header">
                        <div className="form-icon" aria-hidden="true">
                          {editingId ? <FiEdit2 /> : <FiPlus />}
                        </div>
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
                            <div
                              className={`custom-file-upload ${isDragActive ? "drag-active" : ""} ${selectedImages.length ? "has-files" : ""}`}
                              onDragEnter={(event) => {
                                event.preventDefault();
                                setIsDragActive(true);
                              }}
                              onDragOver={(event) => {
                                event.preventDefault();
                                setIsDragActive(true);
                              }}
                              onDragLeave={(event) => {
                                event.preventDefault();
                                if (event.currentTarget.contains(event.relatedTarget)) return;
                                setIsDragActive(false);
                              }}
                              onDrop={(event) => {
                                event.preventDefault();
                                setIsDragActive(false);
                                setMenuUploadFiles(event.dataTransfer.files);
                              }}
                            >
                                <Form.Control
                                  type="file"
                                  multiple
                                  accept="image/*"
                                  ref={imagesRef}
                                  className="file-input"
                                  onChange={(event) => setMenuUploadFiles(event.target.files)}
                                />
                                <div className="upload-content">
                                    <span className="upload-icon" aria-hidden="true">
                                      {isDragActive ? <FiUploadCloud /> : <FiImage />}
                                    </span>
                                    <span>
                                      {isDragActive
                                        ? "Drop images here"
                                        : selectedImages.length
                                          ? `${selectedImages.length} image${selectedImages.length > 1 ? "s" : ""} selected`
                                          : "Drag & Drop or Click to Upload"}
                                    </span>
                                </div>
                                {selectedImages.length > 0 && (
                                  <button type="button" className="clear-upload-btn" onClick={clearMenuUploadFiles}>
                                    Clear
                                  </button>
                                )}
                            </div>
                            {imagePreviews.length > 0 && (
                              <div className="upload-preview-grid">
                                {imagePreviews.map((preview) => (
                                  <figure key={preview.id} className="upload-preview-card">
                                    <img src={preview.url} alt={preview.name} loading="lazy" decoding="async" />
                                    <figcaption>
                                      <span title={preview.name}>{preview.name}</span>
                                      <small>{formatFileSize(preview.size)}</small>
                                    </figcaption>
                                  </figure>
                                ))}
                              </div>
                            )}
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

                {loading.products ? (
                  <div className="admin-skeleton-table menu-skeleton">
                    {Array.from({ length: 5 }).map((_, idx) => <div key={idx} className="admin-skeleton-row"></div>)}
                  </div>
                ) : fetchError ? (
                  <div className="admin-state-card error">
                    <h3>Failed to load menu</h3>
                    <p>{fetchError}</p>
                    <button type="button" onClick={() => fetchData("menu")}>Retry</button>
                  </div>
                ) : products.length === 0 ? (
                  <div className="admin-state-card">
                    <h3>No dishes yet</h3>
                    <p>Add your first dish from the form above.</p>
                  </div>
                ) : (
                  <div className="menu-grid">
                      {products.map((p, index) => (
                          <div key={p._id} className="menu-card-mini">
                              <div className="card-img-holder">
                                  <img src={p.images?.[0]?`${API_URL}/${p.images[0]}`:"https://via.placeholder.com/150"} alt={p.title} loading="lazy" decoding="async" />
                              </div>
                              <div className="menu-info"><h4>{p.title}</h4><span>{p.price} EGP</span></div>
                              <div className="menu-actions" style={{ display: 'flex', gap: '5px', justifyContent: 'center' }}>
                                  <button
                                    className="btn-action move"
                                    onClick={() => handleMoveProduct(index, -1)}
                                    disabled={index === 0}
                                    title="Move Left"
                                    aria-label="Move dish left"
                                  >
                                    <FiChevronLeft />
                                  </button>
                                  <button
                                    className="btn-action move"
                                    onClick={() => handleMoveProduct(index, 1)}
                                    disabled={index === products.length - 1}
                                    title="Move Right"
                                    aria-label="Move dish right"
                                  >
                                    <FiChevronRight />
                                  </button>
                                  <button
                                    className="btn-action edit"
                                    onClick={() => handleEditClick(p)}
                                    title="Edit"
                                    aria-label="Edit dish"
                                  >
                                    <FiEdit2 />
                                  </button>
                                  <button
                                    className="btn-action delete"
                                    onClick={() => handleDelete(p._id)}
                                    title="Delete"
                                    aria-label="Delete dish"
                                  >
                                    <FiTrash2 />
                                  </button>
                              </div>
                          </div>
                      ))}
                  </div>
                )}
            </div>
        )}
      </main>
    </div>
  );
};
