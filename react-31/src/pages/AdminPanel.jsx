import API_URL from "../utils/api";
import React, { useEffect, useState, useRef, useMemo, useCallback } from 'react';
import { useSelector } from 'react-redux';
import axios from 'axios';
import { toast } from 'react-toastify';
import { Form, Button, Row, Col } from "react-bootstrap";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { FiBookOpen, FiCalendar, FiCheck, FiChevronLeft, FiChevronRight, FiEdit2, FiGrid, FiImage, FiMenu, FiPlus, FiRefreshCw, FiShoppingBag, FiTrash2, FiUploadCloud, FiUsers, FiX } from "react-icons/fi";
import { MenuCategoryOrganizer } from '../component/MenuCategoryOrganizer';
import './AdminPanel.css'; 

const ORDER_STATUS_WEIGHT = { pending: 0, delivered: 1, completed: 2, cancelled: 3 };
const MAX_UPLOAD_IMAGES = 5;
const MAX_IMAGE_SIZE_BYTES = 4 * 1024 * 1024;
const ALLOWED_IMAGE_TYPES = new Set(["image/png", "image/jpeg", "image/jpg", "image/webp"]);
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
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [confirmDialog, setConfirmDialog] = useState({
    open: false,
    title: "",
    message: "",
    confirmLabel: "Confirm",
    tone: "danger",
    onConfirm: null,
  });
  const [expandedOrderIds, setExpandedOrderIds] = useState({});
  const [formError, setFormError] = useState("");

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
  const [existingImages, setExistingImages] = useState([]);
  const [selectedImages, setSelectedImages] = useState([]);
  const [isDragActive, setIsDragActive] = useState(false);
  const [savingCategory, setSavingCategory] = useState("");
  const [busyToggleId, setBusyToggleId] = useState("");
  const [dishUploadState, setDishUploadState] = useState({
    visible: false,
    progress: 0,
    phase: "idle",
    dishTitle: "",
    message: "",
  });
  const imagesRef = useRef();
  const uploadHideTimerRef = useRef(null);
  const formCardRef = useRef(null);
  const replaceModeRef = useRef(false);

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
    } catch {
      if (files.length === 0) {
        imagesRef.current.value = "";
      }
    }
  }, []);

  const clearMenuUploadFiles = useCallback(() => {
    setSelectedImages([]);
    setIsDragActive(false);
    replaceModeRef.current = false;
    if (imagesRef.current) {
      imagesRef.current.value = "";
    }
  }, []);

  const setMenuUploadFiles = useCallback((incomingFiles, options = {}) => {
    const rawFiles = Array.from(incomingFiles || []);
    if (!rawFiles.length) {
      replaceModeRef.current = false;
      return;
    }

    const validFiles = [];
    let hasInvalidType = false;
    let hasOversized = false;

    rawFiles.forEach((file) => {
      const mime = String(file.type || "").toLowerCase();
      if (!ALLOWED_IMAGE_TYPES.has(mime)) {
        hasInvalidType = true;
        return;
      }
      if (file.size > MAX_IMAGE_SIZE_BYTES) {
        hasOversized = true;
        return;
      }
      validFiles.push(file);
    });

    if (hasInvalidType) {
      const msg = "Only PNG, JPG, and WEBP image files are allowed.";
      setFormError(msg);
      toast.warning(msg);
    }
    if (hasOversized) {
      const msg = "Each image must be 4 MB or smaller.";
      setFormError(msg);
      toast.warning(msg);
    }

    if (!validFiles.length) {
      replaceModeRef.current = false;
      if (imagesRef.current) imagesRef.current.value = "";
      return;
    }

    setFormError("");
    const shouldReplace = Boolean(options.replaceExisting || replaceModeRef.current || (editingId && existingImages.length > 0));
    replaceModeRef.current = false;

    if (shouldReplace) {
      setExistingImages([]);
    }

    const availableSlots = shouldReplace
      ? MAX_UPLOAD_IMAGES
      : Math.max(0, MAX_UPLOAD_IMAGES - existingImages.length);
    const limitedFiles = validFiles.slice(0, availableSlots);

    if (validFiles.length > availableSlots) {
      toast.info(`Maximum ${MAX_UPLOAD_IMAGES} images allowed per dish.`);
    }

    setSelectedImages(limitedFiles);
    syncFileInputWithSelection(limitedFiles);
  }, [editingId, existingImages.length, syncFileInputWithSelection]);

  const handleRemoveExistingImage = useCallback((imgPath) => {
    setExistingImages((prev) => prev.filter((item) => item !== imgPath));
  }, []);

  const handleRemoveSelectedImage = useCallback((indexToRemove) => {
    setSelectedImages((prev) => {
      const next = prev.filter((_, idx) => idx !== indexToRemove);
      syncFileInputWithSelection(next);
      return next;
    });
  }, [syncFileInputWithSelection]);

  const handleRemoveAllImages = useCallback(() => {
    setExistingImages([]);
    clearMenuUploadFiles();
  }, [clearMenuUploadFiles]);

  const handleTriggerReplaceImage = useCallback(() => {
    replaceModeRef.current = true;
    if (imagesRef.current) {
      imagesRef.current.value = "";
      imagesRef.current.click();
    }
  }, []);

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

  useEffect(() => {
    const shouldLockScroll = isSidebarOpen || confirmDialog.open;
    if (!shouldLockScroll) return undefined;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        if (confirmDialog.open) {
          setConfirmDialog((prev) => ({ ...prev, open: false }));
        } else if (isSidebarOpen) {
          setIsSidebarOpen(false);
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isSidebarOpen, confirmDialog.open]);

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1025) {
        setIsSidebarOpen(false);
      }
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const ADMIN_TABS = useMemo(() => [
    { id: "overview", label: "Overview", icon: FiGrid },
    { id: "bookings", label: "Bookings", icon: FiCalendar },
    { id: "orders", label: "Orders", icon: FiShoppingBag },
    { id: "users", label: "Users", icon: FiUsers },
    { id: "menu", label: "Menu", icon: FiBookOpen },
  ], []);

  const handleSelectTab = useCallback((tabId) => {
    setActiveTab(tabId);
    setIsSidebarOpen(false);
  }, []);

  const closeConfirmDialog = useCallback(() => {
    setConfirmDialog((prev) => ({ ...prev, open: false, onConfirm: null }));
  }, []);

  const openConfirmDialog = useCallback(({ title, message, confirmLabel = "Confirm", tone = "danger", onConfirm }) => {
    setConfirmDialog({
      open: true,
      title,
      message,
      confirmLabel,
      tone,
      onConfirm,
    });
  }, []);

  const toggleExpandOrder = useCallback((orderId) => {
    setExpandedOrderIds((prev) => ({
      ...prev,
      [orderId]: !prev[orderId],
    }));
  }, []);

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

  const executeUserRoleChange = async (id, role) => {
    try {
      setStatusBusyId(id);
      await axios.put(`${API_URL}/auth/users/${id}/role`, { role }, { headers: { Authorization: `Bearer ${token}` } });
      setUsers((prev) => prev.map((user) => (user._id === id ? { ...user, role } : user)));
      toast.success(`Role changed to ${role}.`);
    } catch {
      toast.error("Failed to update user role.");
    } finally {
      setStatusBusyId("");
    }
  };

  const handleUserRoleChange = (id, role) => {
    if (userData?._id === id) {
      openConfirmDialog({
        title: "Change your own role?",
        message: "Changing your own role may revoke access to the Admin Panel immediately.",
        confirmLabel: "Change Role",
        tone: "danger",
        onConfirm: () => executeUserRoleChange(id, role),
      });
      return;
    }
    executeUserRoleChange(id, role);
  };

  const resetMenuForm = useCallback(() => {
    setFormData({ title: "", description: "", price: "", stock: "", category: "main course" });
    setEditingId(null);
    setExistingImages([]);
    setFormError("");
    clearMenuUploadFiles();
  }, [clearMenuUploadFiles]);

  const handleMenuSubmit = async (e) => {
    e.preventDefault();
    setFormError("");
    if (uploadHideTimerRef.current) {
      clearTimeout(uploadHideTimerRef.current);
      uploadHideTimerRef.current = null;
    }

    const savedTitle = formData.title?.trim() || "Dish";

    try {
      const authHeaders = { Authorization: `Bearer ${token}` };
      if (editingId) {
        const data = new FormData();
        Object.keys(formData).forEach((key) => data.append(key, formData[key] ?? ""));
        data.append("retainedImages", JSON.stringify(existingImages));
        selectedImages.forEach((file) => data.append("images", file));

        setDishUploadState({
          visible: true,
          progress: selectedImages.length > 0 ? 0 : 60,
          phase: selectedImages.length > 0 ? "uploading" : "processing",
          dishTitle: savedTitle,
          message: selectedImages.length > 0 ? "Uploading replacement image..." : "Saving dish changes...",
        });

        const res = await axios.put(`${API_URL}/products/${editingId}`, data, {
          headers: authHeaders,
          onUploadProgress: (progressEvent) => {
            if (selectedImages.length === 0) return;
            const total = progressEvent.total || 0;
            const percent = total > 0 ? Math.min(100, Math.round((progressEvent.loaded * 100) / total)) : 50;
            setDishUploadState((prev) => ({
              ...prev,
              progress: percent,
              phase: percent >= 100 ? "processing" : "uploading",
              message: percent >= 100 ? "Updating dish & optimizing image..." : `Uploading image... ${percent}%`,
            }));
          },
        });

        const updatedProduct = res.data?.data;
        if (updatedProduct?._id) {
          setProducts((prev) =>
            prev.map((item) => (item._id === updatedProduct._id ? { ...item, ...updatedProduct } : item))
          );
        }
        toast.success("Dish updated.");
      } else {
        const data = new FormData();
        Object.keys(formData).forEach((key) => data.append(key, formData[key] ?? ""));
        if (selectedImages.length > 0) {
          selectedImages.forEach((file) => data.append("images", file));
        } else {
          const msg = "Please upload at least one dish image before publishing.";
          setFormError(msg);
          toast.error(msg);
          return;
        }

        setDishUploadState({
          visible: true,
          progress: 0,
          phase: "uploading",
          dishTitle: savedTitle,
          message: "Uploading dish data & images...",
        });

        await axios.post(`${API_URL}/products`, data, {
          headers: authHeaders,
          onUploadProgress: (progressEvent) => {
            const total = progressEvent.total || 0;
            const percent = total > 0 ? Math.min(100, Math.round((progressEvent.loaded * 100) / total)) : 50;
            setDishUploadState((prev) => ({
              ...prev,
              progress: percent,
              phase: percent >= 100 ? "processing" : "uploading",
              message: percent >= 100 ? "Saving dish & optimizing image..." : `Uploading dish data... ${percent}%`,
            }));
          },
        });
        toast.success("Dish created.");
      }

      setDishUploadState({
        visible: true,
        progress: 100,
        phase: "done",
        dishTitle: savedTitle,
        message: editingId ? "Done! Dish updated successfully." : "Done! Dish published & ready.",
      });
      uploadHideTimerRef.current = setTimeout(() => {
        setDishUploadState((prev) => ({ ...prev, visible: false }));
      }, 4500);

      resetMenuForm();
      fetchData("menu");
    } catch (error) {
      const errorMsg = error.response?.data?.message || "Failed to save dish.";
      setFormError(errorMsg);
      setDishUploadState({
        visible: true,
        progress: 0,
        phase: "error",
        dishTitle: savedTitle,
        message: errorMsg,
      });
      toast.error(errorMsg);
    }
  };

  const handleEditClick = (product) => {
    clearMenuUploadFiles();
    setFormError("");
    setEditingId(product._id);
    setExistingImages(Array.isArray(product.images) ? product.images.filter(Boolean) : []);
    setFormData({
      title: product.title || "",
      description: product.description || "",
      price: product.price ?? "",
      stock: product.stock ?? "",
      category: product.category || "main course",
    });
    if (formCardRef.current) {
      formCardRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
    } else {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const executeDeleteDish = async (id) => {
    try {
      await axios.delete(`${API_URL}/products/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setProducts((prev) => prev.filter((product) => product._id !== id));
      toast.success("Dish removed.");
    } catch {
      toast.error("Failed to delete dish.");
    }
  };

  const handleDelete = (id) => {
    openConfirmDialog({
      title: "Delete this dish?",
      message: "This will permanently remove the dish from your menu and cannot be undone.",
      confirmLabel: "Delete Dish",
      tone: "danger",
      onConfirm: () => executeDeleteDish(id),
    });
  };

  const handleReorderCategory = async (categoryName, reorderedCategoryItems) => {
    const previousProducts = products;
    const orderById = new Map();
    reorderedCategoryItems.forEach((item, idx) => {
      orderById.set(item._id, idx);
    });

    setProducts((prev) =>
      prev.map((item) => {
        if (!orderById.has(item._id)) return item;
        const nextOrder = orderById.get(item._id);
        return { ...item, displayOrder: nextOrder, order: nextOrder };
      })
    );

    try {
      setSavingCategory(categoryName);
      const payload = reorderedCategoryItems.map((product, idx) => ({
        id: product._id,
        displayOrder: idx,
        order: idx,
      }));
      await axios.put(
        `${API_URL}/products/reorder`,
        { category: categoryName, items: payload },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success(`${categoryName} order saved.`);
    } catch {
      setProducts(previousProducts);
      toast.error("Failed to save category order.");
    } finally {
      setSavingCategory("");
    }
  };

  const handleToggleDishAvailability = async (product) => {
    const nextAvailable = product.isAvailable === false;
    try {
      setBusyToggleId(product._id);
      await axios.put(
        `${API_URL}/products/${product._id}`,
        { isAvailable: nextAvailable },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setProducts((prev) =>
        prev.map((item) =>
          item._id === product._id ? { ...item, isAvailable: nextAvailable } : item
        )
      );
      toast.success(nextAvailable ? "Dish marked as available." : "Dish marked as unavailable.");
    } catch {
      toast.error("Failed to update availability.");
    } finally {
      setBusyToggleId("");
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
    } catch {
      toast.error("Failed to update order.");
    } finally {
      setStatusBusyId("");
    }
  };

  const updateReservationStatus = async (reservationId, status) => {
    try {
      setStatusBusyId(reservationId);
      await axios.put(
        `${API_URL}/reservation/${reservationId}/status`,
        { status },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setBookings((prev) =>
        prev.map((booking) => (booking._id === reservationId ? { ...booking, status } : booking))
      );
      toast.success(`Reservation set to ${status}.`);
    } catch {
      toast.error("Failed to update reservation.");
    } finally {
      setStatusBusyId("");
    }
  };

  const chartData = getChartData();
  const chartTotal = chartData.reduce((sum, entry) => sum + Number(entry.value || 0), 0);
  const activeTabMeta = ADMIN_TABS.find((tab) => tab.id === activeTab) || ADMIN_TABS[0];

  return (
    <div className="admin-wrapper">
      {isSidebarOpen && (
        <div
          className="admin-drawer-backdrop"
          onClick={() => setIsSidebarOpen(false)}
          aria-hidden="true"
        />
      )}

      <aside
        id="admin-navigation-drawer"
        className={`admin-sidebar ${isSidebarOpen ? "is-open" : ""}`}
        aria-label="Admin navigation"
      >
        <div className="admin-profile">
          <div className="admin-profile-text">
            <h3>Admin Panel</h3>
            <p>Welcome, {userData?.name}</p>
          </div>
          <button
            type="button"
            className="admin-drawer-close"
            onClick={() => setIsSidebarOpen(false)}
            aria-label="Close navigation menu"
          >
            <FiX />
          </button>
        </div>
        <nav className="admin-nav">
            {ADMIN_TABS.map(({ id, label, icon }) => (
                <button
                  key={id}
                  type="button"
                  className={activeTab === id ? 'active' : ''}
                  aria-current={activeTab === id ? 'page' : undefined}
                  onClick={() => handleSelectTab(id)}
                >
                  {React.createElement(icon, { className: "admin-nav-icon", "aria-hidden": true })}
                  <span>{label}</span>
                </button>
            ))}
        </nav>
      </aside>

      <main className="admin-main">
        <div className="admin-mobile-topbar">
          <button
            type="button"
            className="admin-mobile-menu-btn"
            onClick={() => setIsSidebarOpen(true)}
            aria-label="Open admin navigation"
            aria-expanded={isSidebarOpen}
            aria-controls="admin-navigation-drawer"
          >
            <FiMenu />
          </button>
          <div className="admin-mobile-topbar-title">
            <span className="admin-mobile-kicker">Admin Panel</span>
            <strong>{activeTabMeta.label}</strong>
          </div>
          <button
            type="button"
            className="admin-mobile-refresh-btn"
            onClick={() => fetchData(activeTab)}
            aria-label={`Refresh ${activeTabMeta.label}`}
          >
            <FiRefreshCw />
          </button>
        </div>
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
                        <div className="chart-section-header">
                          <h3>{getChartTitle()}</h3>
                          <span className="chart-total-pill">{chartTotal} total</span>
                        </div>
                        {chartTotal === 0 ? (
                          <div className="category-empty-state">
                            <p>No analytics data available for this metric yet.</p>
                          </div>
                        ) : (
                          <div className="chart-content-grid">
                            <div className="chart-wrapper">
                                <ResponsiveContainer width="100%" height={280}>
                                    <PieChart>
                                        <Pie data={chartData} cx="50%" cy="50%" innerRadius={58} outerRadius={84} fill="#8884d8" paddingAngle={4} dataKey="value">
                                            {chartData.map((entry, index) => (<Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />))}
                                        </Pie>
                                        <Tooltip />
                                        <Legend verticalAlign="bottom" wrapperStyle={{ fontSize: "12px", paddingTop: "8px" }} />
                                    </PieChart>
                                </ResponsiveContainer>
                            </div>
                            <ul className="chart-breakdown-list" aria-label={`${getChartTitle()} breakdown`}>
                              {chartData.map((entry, index) => {
                                const pct = chartTotal > 0 ? Math.round((Number(entry.value || 0) / chartTotal) * 100) : 0;
                                return (
                                  <li key={entry.name} className="chart-breakdown-item">
                                    <div className="chart-breakdown-label">
                                      <span
                                        className="chart-breakdown-dot"
                                        style={{ backgroundColor: COLORS[index % COLORS.length] }}
                                        aria-hidden="true"
                                      />
                                      <span>{entry.name}</span>
                                    </div>
                                    <div className="chart-breakdown-values">
                                      <strong>{entry.value}</strong>
                                      <small>{pct}%</small>
                                    </div>
                                  </li>
                                );
                              })}
                            </ul>
                          </div>
                        )}
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
                  <>
                    <div className="admin-table-scroll bookings-desktop-view">
                      <table className="admin-table">
                          <thead><tr><th>Name</th><th>Date</th><th>Guests</th><th>Status</th><th>Action</th></tr></thead>
                          <tbody>
                              {filteredBookings.map(b => (
                                  <tr key={b._id}>
                                    <td>{b.name}</td>
                                    <td>{b.date}</td>
                                    <td>{b.guests}</td>
                                    <td><span className={`badge ${b.status}`}>{b.status || "pending"}</span></td>
                                    <td>
                                      <button
                                        type="button"
                                        className="btn-icon check"
                                        onClick={() => updateReservationStatus(b._id, 'Accepted')}
                                        disabled={statusBusyId === b._id}
                                        title="Accept reservation"
                                        aria-label={`Accept reservation for ${b.name}`}
                                      >
                                        <FiCheck />
                                      </button>
                                      <button
                                        type="button"
                                        className="btn-icon cross"
                                        onClick={() => updateReservationStatus(b._id, 'Rejected')}
                                        disabled={statusBusyId === b._id}
                                        title="Reject reservation"
                                        aria-label={`Reject reservation for ${b.name}`}
                                      >
                                        <FiX />
                                      </button>
                                    </td>
                                  </tr>
                              ))}
                          </tbody>
                      </table>
                    </div>

                    <div className="bookings-mobile-view">
                      {filteredBookings.map((b) => (
                        <article key={b._id} className="admin-mobile-card booking-mobile-card">
                          <header className="admin-mobile-card__header">
                            <strong>{b.name}</strong>
                            <span className={`badge ${b.status}`}>{b.status || "pending"}</span>
                          </header>
                          <div className="admin-mobile-card__meta">
                            <span>Date: <strong>{b.date}</strong></span>
                            <span>Guests: <strong>{b.guests}</strong></span>
                          </div>
                          <div className="booking-mobile-actions">
                            <button
                              type="button"
                              className="btn-mobile-action accept"
                              onClick={() => updateReservationStatus(b._id, 'Accepted')}
                              disabled={statusBusyId === b._id || b.status === 'Accepted'}
                            >
                              <FiCheck /> Accept
                            </button>
                            <button
                              type="button"
                              className="btn-mobile-action reject"
                              onClick={() => updateReservationStatus(b._id, 'Rejected')}
                              disabled={statusBusyId === b._id || b.status === 'Rejected'}
                            >
                              <FiX /> Reject
                            </button>
                          </div>
                        </article>
                      ))}
                    </div>
                  </>
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
                    <div className="admin-table-scroll orders-desktop-view">
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
                      {filteredOrders.map((order) => {
                        const itemsList = order.items || [];
                        const isExpanded = Boolean(expandedOrderIds[order._id]);
                        const visibleItems = isExpanded ? itemsList : itemsList.slice(0, 3);
                        const hiddenCount = Math.max(0, itemsList.length - 3);

                        return (
                          <article key={order._id} className="order-mobile-card">
                            <header className="order-mobile-header">
                              <strong>#{order._id.slice(-6)}</strong>
                              <span className={`badge ${order.status}`}>{order.status}</span>
                            </header>
                            <div className="order-mobile-meta">
                              <span>{order.userName || "Guest"}</span>
                              <span><strong>{Number(order.totalAmount || 0).toFixed(2)} EGP</strong></span>
                              <span className="payment-pill">{order.paymentMethod || "cash"}</span>
                              <span>{formatConfirmedDateTime(order.createdAt)}</span>
                            </div>
                            <div className="order-mobile-items">
                              {visibleItems.map((item, idx) => (
                                <div key={item._id || `${order._id}-m-${idx}`} className="order-item-row">
                                  <span>{item.quantity}x {item.title}</span>
                                  {item.specialInstructions && (
                                    <small className="order-item-custom-note">Customization: {item.specialInstructions}</small>
                                  )}
                                </div>
                              ))}
                              {hiddenCount > 0 && (
                                <button
                                  type="button"
                                  className="order-items-toggle-btn"
                                  onClick={() => toggleExpandOrder(order._id)}
                                >
                                  {isExpanded ? "Show fewer items" : `Show ${hiddenCount} more item${hiddenCount > 1 ? "s" : ""}`}
                                </button>
                              )}
                            </div>
                            <div className="order-mobile-status-row">
                              <select
                                className="status-select order-mobile-select"
                                aria-label={`Status for order ${order._id.slice(-6)}`}
                                value={order.status}
                                onChange={(e) => updateOrderStatus(order._id, e.target.value)}
                                disabled={statusBusyId === order._id}
                              >
                                <option value="pending">Pending</option>
                                <option value="delivered">Delivered</option>
                                <option value="completed">Completed</option>
                                <option value="cancelled">Cancelled</option>
                              </select>
                            </div>
                            <div className="quick-action-group mobile">
                              <button type="button" className="btn-quick neutral" onClick={() => updateOrderStatus(order._id, "delivered")} disabled={statusBusyId === order._id || normalize(order.status) === "delivered"}>Deliver</button>
                              <button type="button" className="btn-quick success" onClick={() => updateOrderStatus(order._id, "completed")} disabled={statusBusyId === order._id || normalize(order.status) === "completed"}>Complete</button>
                              <button type="button" className="btn-quick danger" onClick={() => updateOrderStatus(order._id, "cancelled")} disabled={statusBusyId === order._id || normalize(order.status) === "cancelled"}>Cancel</button>
                            </div>
                          </article>
                        );
                      })}
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
                  <>
                    <div className="admin-table-scroll users-desktop-view">
                      <table className="admin-table">
                          <thead><tr><th>Name</th><th>Email</th><th>Role</th><th>Change</th></tr></thead>
                          <tbody>
                              {filteredUsers.map(u => (
                                  <tr key={u._id}>
                                    <td>{u.name}</td>
                                    <td className="admin-email-cell">{u.email}</td>
                                    <td><span className={`badge role ${u.role==='admin'?'admin-badge':'user-badge'}`}>{u.role}</span></td>
                                    <td><select className="status-select" aria-label={`Role for ${u.name}`} value={u.role} onChange={(e)=>handleUserRoleChange(u._id, e.target.value)} disabled={u._id===userData._id || statusBusyId===u._id}><option value="user">User</option><option value="admin">Admin</option></select></td>
                                  </tr>
                              ))}
                          </tbody>
                      </table>
                    </div>

                    <div className="users-mobile-view">
                      {filteredUsers.map((u) => (
                        <article key={u._id} className="admin-mobile-card user-mobile-card">
                          <header className="admin-mobile-card__header">
                            <strong>{u.name}</strong>
                            <span className={`badge role ${u.role==='admin'?'admin-badge':'user-badge'}`}>{u.role}</span>
                          </header>
                          <p className="user-mobile-email">{u.email}</p>
                          <div className="user-mobile-role-row">
                            <label htmlFor={`mobile-role-${u._id}`}>Account Role</label>
                            <select
                              id={`mobile-role-${u._id}`}
                              className="status-select user-mobile-select"
                              value={u.role}
                              onChange={(e) => handleUserRoleChange(u._id, e.target.value)}
                              disabled={u._id === userData._id || statusBusyId === u._id}
                            >
                              <option value="user">User</option>
                              <option value="admin">Admin</option>
                            </select>
                          </div>
                        </article>
                      ))}
                    </div>
                  </>
                )}
            </div>
        )}

        {/* MENU */}
        {activeTab === 'menu' && (
            <div className="panel-section">
                <div className="menu-form-card" ref={formCardRef}>
                    <div className="form-header">
                        <div className="form-icon" aria-hidden="true">
                          {editingId ? <FiEdit2 /> : <FiPlus />}
                        </div>
                        <div>
                            <h3>{editingId ? "Edit Delicacy" : "Add New Dish"}</h3>
                            <p>Curate your restaurant's menu with style</p>
                        </div>
                    </div>
                    
                    <Form onSubmit={handleMenuSubmit} className="perfect-form dish-builder-form">
                        {/* Row 1: Dish Name + Price */}
                        <div className="dish-form-row row-name-price">
                            <div className="input-group-modern col-name">
                                <label htmlFor="dish-title">Dish Name</label>
                                <Form.Control
                                  id="dish-title"
                                  type="text"
                                  placeholder="e.g. Truffle Risotto"
                                  name="title"
                                  value={formData.title}
                                  onChange={(e)=>setFormData({...formData,title:e.target.value})}
                                  required
                                />
                            </div>
                            <div className="input-group-modern col-price">
                                <label htmlFor="dish-price">Price (EGP)</label>
                                <Form.Control
                                  id="dish-price"
                                  type="number"
                                  inputMode="decimal"
                                  step="0.01"
                                  min="0"
                                  placeholder="0.00"
                                  name="price"
                                  value={formData.price}
                                  onChange={(e)=>setFormData({...formData,price:e.target.value})}
                                  required
                                />
                            </div>
                        </div>

                        {/* Row 2: Category (Left) + Stock Quantity (Right) */}
                        <div className="dish-form-row row-cat-stock">
                            <div className="input-group-modern col-category">
                                <label htmlFor="dish-category">Category</label>
                                <Form.Select
                                  id="dish-category"
                                  name="category"
                                  value={formData.category}
                                  onChange={(e)=>setFormData({...formData,category:e.target.value})}
                                >
                                    <option value="main course">Main Course</option>
                                    <option value="breakfast">Breakfast</option>
                                    <option value="desserts">Desserts</option>
                                    <option value="drinks">Drinks</option>
                                </Form.Select>
                            </div>
                            <div className="input-group-modern col-stock">
                                <label htmlFor="dish-stock">Stock Quantity</label>
                                <Form.Control
                                  id="dish-stock"
                                  type="number"
                                  inputMode="numeric"
                                  min="0"
                                  placeholder="Available Qty"
                                  name="stock"
                                  value={formData.stock}
                                  onChange={(e)=>setFormData({...formData,stock:e.target.value})}
                                />
                            </div>
                        </div>

                        {/* Row 3: Upload Image (Left) + Description (Right) */}
                        <div className="dish-form-row row-media-desc">
                            <div className="input-group-modern col-upload file-group">
                                <div className="col-upload-header">
                                    <label>Upload Image</label>
                                </div>
                                <div
                                  className={`custom-file-upload ${isDragActive ? "drag-active" : ""} ${(existingImages.length > 0 || selectedImages.length > 0) ? "has-files" : ""}`}
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
                                    setMenuUploadFiles(event.dataTransfer.files, { replaceExisting: Boolean(editingId) });
                                  }}
                                >
                                    <Form.Control
                                      type="file"
                                      multiple
                                      accept="image/png,image/jpeg,image/webp"
                                      ref={imagesRef}
                                      className={`file-input ${(existingImages.length > 0 || imagePreviews.length > 0) ? "is-hidden-overlay" : ""}`}
                                      onChange={(event) => setMenuUploadFiles(event.target.files)}
                                    />

                                    {(existingImages.length === 0 && imagePreviews.length === 0) ? (
                                      <div className="upload-content">
                                          <span className="upload-icon" aria-hidden="true">
                                            {isDragActive ? <FiUploadCloud /> : <FiImage />}
                                          </span>
                                          <div className="upload-text-wrap">
                                              <strong>
                                                {isDragActive
                                                  ? "Drop images here"
                                                  : "Drag & Drop or Click to Upload"}
                                              </strong>
                                              <small>Supports PNG, JPG, WEBP (Max 5, up to 4 MB each)</small>
                                          </div>
                                      </div>
                                    ) : (
                                      <div className="upload-preview-stage">
                                        <div className="upload-preview-grid">
                                          {existingImages.map((imgPath, idx) => (
                                            <figure key={`existing-${imgPath}-${idx}`} className="upload-preview-card">
                                              <button
                                                type="button"
                                                className="upload-preview-remove"
                                                onClick={() => handleRemoveExistingImage(imgPath)}
                                                aria-label="Remove existing dish image"
                                                title="Remove image"
                                              >
                                                <FiX />
                                              </button>
                                              <img
                                                src={`${API_URL}/${imgPath}`}
                                                alt={`${formData.title || "Dish"} preview ${idx + 1}`}
                                                loading="lazy"
                                                decoding="async"
                                              />
                                              <figcaption>
                                                <span title={imgPath}>{imgPath.split("/").pop()}</span>
                                                <small>Saved on dish</small>
                                              </figcaption>
                                            </figure>
                                          ))}
                                          {imagePreviews.map((preview, idx) => (
                                            <figure key={preview.id} className="upload-preview-card is-new">
                                              <button
                                                type="button"
                                                className="upload-preview-remove"
                                                onClick={() => handleRemoveSelectedImage(idx)}
                                                aria-label={`Remove ${preview.name}`}
                                                title="Remove selected image"
                                              >
                                                <FiX />
                                              </button>
                                              <img src={preview.url} alt={preview.name} loading="lazy" decoding="async" />
                                              <figcaption>
                                                <span title={preview.name}>{preview.name}</span>
                                                <small>{formatFileSize(preview.size)}</small>
                                              </figcaption>
                                            </figure>
                                          ))}
                                        </div>
                                        <div className="upload-stage-footer">
                                          <button
                                            type="button"
                                            className="btn-upload-stage-action replace"
                                            onClick={handleTriggerReplaceImage}
                                          >
                                            <FiUploadCloud aria-hidden="true" />
                                            <span>Replace Image</span>
                                          </button>
                                          <button
                                            type="button"
                                            className="btn-upload-stage-action remove"
                                            onClick={handleRemoveAllImages}
                                          >
                                            <FiTrash2 aria-hidden="true" />
                                            <span>Remove Image</span>
                                          </button>
                                        </div>
                                      </div>
                                    )}
                                </div>
                            </div>

                            <div className="input-group-modern col-desc">
                                <label htmlFor="dish-description">Description</label>
                                <Form.Control
                                  id="dish-description"
                                  as="textarea"
                                  rows={5}
                                  placeholder="Describe the flavors, ingredients, and culinary style..."
                                  name="description"
                                  value={formData.description}
                                  onChange={(e)=>setFormData({...formData,description:e.target.value})}
                                />
                            </div>
                        </div>

                        {dishUploadState.visible && (
                            <div className={`dish-upload-panel phase-${dishUploadState.phase}`} role="status" aria-live="polite">
                                <div className="dish-upload-panel__header">
                                    <div className="dish-upload-panel__title">
                                        <span className="dish-upload-panel__icon" aria-hidden="true">
                                            {dishUploadState.phase === "done" ? <FiCheck /> : dishUploadState.phase === "error" ? <FiX /> : <FiUploadCloud />}
                                        </span>
                                        <div>
                                            <strong>{dishUploadState.dishTitle}</strong>
                                            <p>{dishUploadState.message}</p>
                                        </div>
                                    </div>
                                    <div className="dish-upload-panel__meta">
                                        <span className="dish-upload-panel__percent">
                                            {dishUploadState.phase === "done" ? "100%" : dishUploadState.phase === "error" ? "Failed" : `${dishUploadState.progress}%`}
                                        </span>
                                        <button
                                            type="button"
                                            className="dish-upload-panel__close"
                                            aria-label="Dismiss upload status"
                                            onClick={() => setDishUploadState((prev) => ({ ...prev, visible: false }))}
                                        >
                                            <FiX />
                                        </button>
                                    </div>
                                </div>
                                <div className="dish-upload-panel__track">
                                    <div
                                        className="dish-upload-panel__bar"
                                        style={{ width: `${dishUploadState.phase === "error" ? 100 : dishUploadState.progress}%` }}
                                    />
                                </div>
                            </div>
                        )}

                        {formError && (
                            <p className="dish-form-error" role="alert">
                                {formError}
                            </p>
                        )}

                        <div className="form-actions-modern">
                            <Button
                                type="submit"
                                className="btn-save"
                                disabled={dishUploadState.phase === "uploading" || dishUploadState.phase === "processing"}
                            >
                                {dishUploadState.phase === "uploading" || dishUploadState.phase === "processing"
                                    ? "Uploading..."
                                    : editingId
                                      ? "Save Changes"
                                      : "Publish Dish"}
                            </Button>
                            {editingId && <Button type="button" variant="link" onClick={resetMenuForm} className="btn-cancel">Cancel</Button>}
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
                  <MenuCategoryOrganizer
                    products={products}
                    savingCategory={savingCategory}
                    busyToggleId={busyToggleId}
                    onReorderCategory={handleReorderCategory}
                    onEdit={handleEditClick}
                    onDelete={handleDelete}
                    onToggleAvailability={handleToggleDishAvailability}
                  />
                )}
            </div>
        )}
      </main>

      {confirmDialog.open && (
        <div
          className="admin-modal-backdrop"
          role="presentation"
          onClick={closeConfirmDialog}
        >
          <div
            className="admin-confirm-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="admin-confirm-title"
            onClick={(e) => e.stopPropagation()}
          >
            <header className="admin-confirm-modal__header">
              <h4 id="admin-confirm-title">{confirmDialog.title}</h4>
              <button
                type="button"
                className="admin-confirm-modal__close"
                onClick={closeConfirmDialog}
                aria-label="Close confirmation dialog"
              >
                <FiX />
              </button>
            </header>
            <div className="admin-confirm-modal__body">
              <p>{confirmDialog.message}</p>
            </div>
            <footer className="admin-confirm-modal__footer">
              <button
                type="button"
                className="admin-confirm-btn cancel"
                onClick={closeConfirmDialog}
              >
                Cancel
              </button>
              <button
                type="button"
                className={`admin-confirm-btn ${confirmDialog.tone}`}
                onClick={() => {
                  const action = confirmDialog.onConfirm;
                  closeConfirmDialog();
                  if (typeof action === "function") action();
                }}
              >
                {confirmDialog.confirmLabel}
              </button>
            </footer>
          </div>
        </div>
      )}
    </div>
  );
};
