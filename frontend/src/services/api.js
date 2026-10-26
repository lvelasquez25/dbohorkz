import axios from 'axios';

// Cliente HTTP base — apunta al backend Flask
const API_URL = process.env.REACT_APP_API_URL || 'https://api.dbohorkz.com';
const api = axios.create({
  baseURL: API_URL,
});

// Interceptor: adjunta el token JWT a cada request.
// En /cliente* usa el token del cliente preferencial; en el resto usa el del admin.
api.interceptors.request.use((config) => {
  const isClientePath = typeof window !== 'undefined' && window.location.pathname.startsWith('/cliente');
  const token = isClientePath
    ? (localStorage.getItem('customerToken') || localStorage.getItem('token'))
    : localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Interceptor: si el token expiró, limpiar sesión y redirigir al login
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('adminToken');
      if (window.location.pathname === '/admin') {
        window.location.reload();
      }
    }
    return Promise.reject(error);
  }
);

// ─── API de Productos ──────────────────────────────────────────────────────────
export const productosAPI = {
  getAll: (page = 1, perPage = 20) =>
    api.get('/api/products/', { params: { page, per_page: perPage } }),
  getOne: (id)   => api.get(`/api/products/${id}`),
  create: (data) => api.post('/api/products/', data),
  update: (id, data) => api.put(`/api/products/${id}`, data),
  remove: (id)   => api.delete(`/api/products/${id}`),
  getImages: (id) => api.get(`/api/products/${id}/images`),
  addImage: (id, formData) => api.post(`/api/products/${id}/images`, formData),
  removeImage: (productId, imageId) => api.delete(`/api/products/${productId}/images/${imageId}`),
};

// ─── API de Autenticación ─────────────────────────────────────────────────────
export const authAPI = {
  register: (data) => api.post('/api/auth/register', data),
  login:    (data) => api.post('/api/auth/login', data),
};

// ─── API del Chatbot / Contacto ───────────────────────────────────────────────
export const chatbotAPI = {
  // Envía un mensaje al chatbot; también dispara la notificación de correo al admin
  sendMessage: (message, userId = null, platform = 'web') =>
    api.post('/api/chatbot/message', { message, user_id: userId, platform }),
  getFaq: () => api.get('/api/chatbot/faq'),
};

// ─── API de Pedidos ───────────────────────────────────────────────────────────
export const ordersAPI = {
  create: (data) => api.post('/api/orders/', data),
  getAll: (page = 1, perPage = 20, status = '') =>
    api.get('/api/orders/', { params: { page, per_page: perPage, status } }),
  update: (id, data) => api.put(`/api/orders/${id}`, data),
};

// ─── API de Clientes Preferenciales ───────────────────────────────────────────
export const customerAuthAPI = {
  login: (data) => api.post('/api/customers/login', data),
  me:    () => api.get('/api/customers/me'),
};

export const customersAPI = {
  getAll: () => api.get('/api/customers/'),
  create: (data) => api.post('/api/customers/', data),
  update: (id, data) => api.put(`/api/customers/${id}`, data),
  remove: (id) => api.delete(`/api/customers/${id}`),
};

// ─── API de Catálogo Preferencial ─────────────────────────────────────────────
export const catalogAPI = {
  list:       () => api.get('/api/catalog/'),          // cliente
  listAdmin:  () => api.get('/api/catalog/admin'),     // admin
  create:     (data) => api.post('/api/catalog/', data),
  update:     (id, data) => api.put(`/api/catalog/${id}`, data),
  remove:     (id) => api.delete(`/api/catalog/${id}`),
};

export const preferencialOrdersAPI = {
  create: (data) => api.post('/api/orders/preferencial', data),
};

// ─── API de Testimonios ───────────────────────────────────────────────────────
export const testimonialsAPI = {
  getAll: (includeInactive = false) =>
    api.get('/api/testimonials/', { params: includeInactive ? { all: 1 } : {} }),
  create: (data) => api.post('/api/testimonials/', data),
  update: (id, data) => api.put(`/api/testimonials/${id}`, data),
  remove: (id) => api.delete(`/api/testimonials/${id}`),
};

// Helper: resuelve URL de imagen.
// Imágenes con UUID (subidas via admin) se cargan desde Railway.
// Imágenes originales (nombres descriptivos) se cargan desde Cloudflare Pages.
export function imageUrl(path) {
  if (!path) return '';
  if (path.startsWith('http')) return path;
  // UUIDs: 32 chars hex — identifica imágenes subidas via admin
  const filename = path.split('/').pop().split('.')[0];
  if (/^[a-f0-9]{32}$/.test(filename)) return `${API_URL}${path}`;
  return path;
}

export default api;
