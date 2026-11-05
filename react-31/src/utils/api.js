const defaultProdApi = "https://bistro-bliss-cyqt-jmn7dxh7f-youssefn899-2561s-projects.vercel.app";

const isProductionDomain =
  typeof window !== "undefined" &&
  window.location.hostname !== "localhost" &&
  window.location.hostname !== "127.0.0.1";

const rawUrl =
  import.meta.env.VITE_API_URL ||
  (isProductionDomain ? defaultProdApi : "http://localhost:8080");

// In production, never let a localhost URL leak through
const API_URL =
  isProductionDomain && rawUrl.includes("localhost")
    ? defaultProdApi
    : rawUrl.replace(/\/$/, "");

export default API_URL;
