import React, { useState, useEffect } from 'react';
import { authAPI, productosAPI, ordersAPI, testimonialsAPI, imageUrl } from '../services/api';
import CatalogoTab from '../components/admin/CatalogoTab';
import ClientesTab from '../components/admin/ClientesTab';

const CATEGORIAS_LISTA = ['Uniformes y Vestimenta','Uniforme #3','Gorras','Chapuzas','Linternas','Bolsos','Presillas','Correaje y Cinturones','Portatiles y Fundas','Insignias y Bordados','Defensa y Seguridad','Equipos y Accesorios','Elementos para Curso'];
const EMPTY_PRODUCT = { name: '', description: '', price: '', stock: '', image_url: '', codigo: '', categoria: '', sizes: '', colors: '' };
const fmt = (n) => new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(n);
const API_URL = process.env.REACT_APP_API_URL || 'https://api.dbohorkz.com';

export default function AdminPage() {
  const [token, setToken] = useState(localStorage.getItem('adminToken') || '');
  const [loginData, setLoginData] = useState({ username: '', password: '' });
  const [loginError, setLoginError] = useState('');
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState({});
  const [uploading, setUploading] = useState({});
  const [deleting, setDeleting] = useState({});
  const [edits, setEdits] = useState({});
  const [mensaje, setMensaje] = useState('');
  const [showCrear, setShowCrear] = useState(false);
  const [nuevoProducto, setNuevoProducto] = useState(EMPTY_PRODUCT);
  const [creando, setCreando] = useState(false);
  const [nuevaImagen, setNuevaImagen] = useState(null);
  const [activeTab, setActiveTab] = useState('productos');
  const [orders, setOrders] = useState([]);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [testimonials, setTestimonials] = useState([]);
  const [testimonialsLoading, setTestimonialsLoading] = useState(false);

  useEffect(() => {
    if (token) loadProducts();
  }, [token]);

  useEffect(() => {
    if (token && activeTab === 'pedidos') loadOrders();
    if (token && activeTab === 'testimonios') loadTestimonials();
  }, [token, activeTab]);

  function loadTestimonials() {
    setTestimonialsLoading(true);
    testimonialsAPI.getAll(true)
      .then(res => setTestimonials(res.data.testimonials || []))
      .finally(() => setTestimonialsLoading(false));
  }

  async function toggleTestimonialActive(t) {
    try {
      await testimonialsAPI.update(t.id, { active: !t.active });
      loadTestimonials();
    } catch {
      showMensaje('Error al actualizar', true);
    }
  }

  async function deleteTestimonial(t) {
    if (!window.confirm(`¿Eliminar testimonio de "${t.customer_name}"?`)) return;
    try {
      await testimonialsAPI.remove(t.id);
      showMensaje('Testimonio eliminado');
      loadTestimonials();
    } catch {
      showMensaje('Error al eliminar', true);
    }
  }

  function loadOrders() {
    setOrdersLoading(true);
    ordersAPI.getAll(1, 100)
      .then(res => setOrders(res.data.orders))
      .finally(() => setOrdersLoading(false));
  }

  async function updateOrderStatus(orderId, status) {
    try {
      await ordersAPI.update(orderId, { status });
      showMensaje(`Pedido actualizado a "${status}"`);
      loadOrders();
    } catch {
      showMensaje('Error al actualizar pedido', true);
    }
  }

  function loadProducts() {
    setLoading(true);
    productosAPI.getAll(1, 100)
      .then(res => {
        setProducts(res.data.products);
        const initial = {};
        res.data.products.forEach(p => {
          initial[p.id] = {
            name: p.name || '',
            description: p.description || '',
            price: p.price,
            stock: p.stock,
            codigo: p.codigo || '',
            categoria: p.categoria || '',
            sizes: (p.sizes || []).join(', '),
            colors: (p.colors || []).join(', '),
          };
        });
        setEdits(initial);
      })
      .finally(() => setLoading(false));
  }

  async function handleLogin(e) {
    e.preventDefault();
    setLoginError('');
    try {
      const res = await authAPI.login(loginData);
      const t = res.data.token;
      localStorage.setItem('adminToken', t);
      localStorage.setItem('token', t);
      setToken(t);
    } catch {
      setLoginError('Usuario o contraseña incorrectos');
    }
  }

  function handleLogout() {
    localStorage.removeItem('adminToken');
    localStorage.removeItem('token');
    setToken('');
  }

  function handleEdit(id, field, value) {
    setEdits(prev => ({ ...prev, [id]: { ...prev[id], [field]: value } }));
  }

  async function handleSave(product) {
    setSaving(prev => ({ ...prev, [product.id]: true }));
    try {
      await productosAPI.update(product.id, {
        name: edits[product.id].name,
        description: edits[product.id].description,
        price: parseFloat(edits[product.id].price),
        stock: parseInt(edits[product.id].stock, 10),
        codigo: edits[product.id].codigo,
        categoria: edits[product.id].categoria,
        sizes: edits[product.id].sizes || '',
        colors: edits[product.id].colors || '',
      });
      showMensaje(`"${product.name}" actualizado`);
      loadProducts();
    } catch {
      showMensaje('Error al guardar los cambios', true);
    } finally {
      setSaving(prev => ({ ...prev, [product.id]: false }));
    }
  }

  async function handleDelete(product) {
    if (!window.confirm(`¿Eliminar "${product.name}"? Esta acción no se puede deshacer.`)) return;
    setDeleting(prev => ({ ...prev, [product.id]: true }));
    try {
      await productosAPI.remove(product.id);
      showMensaje(`"${product.name}" eliminado`);
      loadProducts();
    } catch {
      showMensaje('Error al eliminar el producto', true);
    } finally {
      setDeleting(prev => ({ ...prev, [product.id]: false }));
    }
  }

  async function uploadImage(file) {
    const MAX_SIZE = 5 * 1024 * 1024; // 5 MB
    if (file.size > MAX_SIZE) throw new Error('La imagen no puede superar 5 MB');
    const ALLOWED = ['image/jpeg', 'image/png', 'image/webp'];
    if (!ALLOWED.includes(file.type)) throw new Error('Formato no permitido. Use JPG, PNG o WEBP');
    const formData = new FormData();
    formData.append('image', file);
    const res = await fetch(`${API_URL}/api/products/upload-image`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body: formData,
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error);
    return data.image_url;
  }

  async function handleImageUpload(product, file) {
    if (!file) return;
    setUploading(prev => ({ ...prev, [product.id]: true }));
    try {
      const image_url = await uploadImage(file);
      await productosAPI.update(product.id, { image_url });
      showMensaje(`Imagen de "${product.name}" actualizada`);
      loadProducts();
    } catch (err) {
      showMensaje(err.message || 'Error al subir la imagen', true);
    } finally {
      setUploading(prev => ({ ...prev, [product.id]: false }));
    }
  }

  async function handleGalleryUpload(product, file) {
    if (!file) return;
    setUploading(prev => ({ ...prev, [`gallery_${product.id}`]: true }));
    try {
      const formData = new FormData();
      formData.append('image', file);
      await productosAPI.addImage(product.id, formData);
      showMensaje(`Foto agregada a "${product.name}"`);
      loadProducts();
    } catch (err) {
      showMensaje(err.message || 'Error al subir foto', true);
    } finally {
      setUploading(prev => ({ ...prev, [`gallery_${product.id}`]: false }));
    }
  }

  async function handleGalleryDelete(product, imageId) {
    if (!window.confirm('¿Eliminar esta foto?')) return;
    try {
      await productosAPI.removeImage(product.id, imageId);
      showMensaje('Foto eliminada');
      loadProducts();
    } catch {
      showMensaje('Error al eliminar foto', true);
    }
  }

  async function handleCrear(e) {
    e.preventDefault();
    if (!nuevoProducto.name || nuevoProducto.price === '') return;
    setCreando(true);
    try {
      let image_url = '';
      if (nuevaImagen) image_url = await uploadImage(nuevaImagen);
      await productosAPI.create({
        name: nuevoProducto.name,
        description: nuevoProducto.description,
        price: parseFloat(nuevoProducto.price),
        stock: parseInt(nuevoProducto.stock || 0, 10),
        image_url,
        codigo: nuevoProducto.codigo,
        categoria: nuevoProducto.categoria,
        sizes: nuevoProducto.sizes || '',
        colors: nuevoProducto.colors || '',
      });
      showMensaje(`"${nuevoProducto.name}" creado exitosamente`);
      setNuevoProducto(EMPTY_PRODUCT);
      setNuevaImagen(null);
      setShowCrear(false);
      loadProducts();
    } catch (err) {
      showMensaje(err.message || 'Error al crear el producto', true);
    } finally {
      setCreando(false);
    }
  }

  function exportarExcel() {
    const headers = ['ID', 'Nombre', 'Descripción', 'Precio', 'Stock', 'Imagen'];
    const rows = products.map(p => [p.id, p.name, p.description, p.price, p.stock, p.image_url]);
    const csv = [headers, ...rows].map(r => r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'catalogo_intendencia.csv';
    a.click();
    URL.revokeObjectURL(url);
  }

  function imprimirCatalogo() {
    window.print();
  }

  function showMensaje(msg, isError = false) {
    setMensaje({ text: msg, error: isError });
    setTimeout(() => setMensaje(''), 3000);
  }

  if (!token) {
    return (
      <div className="min-h-screen bg-navy flex items-center justify-center px-4">
        <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-sm">
          <div className="text-center mb-6">
            <img src="/Images/logo.png" alt="Logo" className="h-16 mx-auto mb-3"
              onError={e => e.target.style.display = 'none'} />
            <h1 className="text-2xl font-bold text-navy">Panel Administrativo</h1>
            <p className="text-sm text-gray-500 mt-1">Ingresa tus credenciales para continuar</p>
          </div>
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Usuario</label>
              <input type="text" value={loginData.username}
                onChange={e => setLoginData(p => ({ ...p, username: e.target.value }))}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-gold"
                required />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Contraseña</label>
              <input type="password" value={loginData.password}
                onChange={e => setLoginData(p => ({ ...p, password: e.target.value }))}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-gold"
                required />
            </div>
            {loginError && <p className="text-red-500 text-sm">{loginError}</p>}
            <button type="submit" className="w-full bg-gold text-navy font-bold py-2 rounded-lg hover:bg-gold-dark transition-colors">
              Ingresar
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <header className="bg-navy text-white px-6 py-4 flex justify-between items-center print:hidden">
        <div className="flex items-center gap-3">
          <img src="/Images/logo.png" alt="Logo" className="h-10 w-auto"
            onError={e => e.target.style.display = 'none'} />
          <div>
            <div className="font-bold text-gold tracking-widest uppercase text-sm">Panel Admin</div>
            <div className="text-xs text-gray-400">Gestión de inventario</div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <a href="/" className="text-sm text-gray-300 hover:text-gold transition-colors">← Ver tienda</a>
          <button onClick={handleLogout} className="text-sm bg-red-600 hover:bg-red-700 px-3 py-1 rounded transition-colors">
            Cerrar sesión
          </button>
        </div>
      </header>

      {/* Toast */}
      {mensaje && (
        <div className={`fixed top-4 right-4 z-50 px-5 py-3 rounded-lg shadow-lg text-white text-sm font-medium print:hidden ${mensaje.error ? 'bg-red-600' : 'bg-green-600'}`}>
          {mensaje.text}
        </div>
      )}

      {/* Tabs */}
      <div className="bg-white border-b print:hidden">
        <div className="container mx-auto px-4 flex gap-1">
          <button onClick={() => setActiveTab('productos')}
            className={`px-6 py-3 font-bold text-sm uppercase tracking-wide border-b-2 transition-colors ${activeTab === 'productos' ? 'border-gold text-navy' : 'border-transparent text-gray-400 hover:text-navy'}`}>
            Productos ({products.length})
          </button>
          <button onClick={() => setActiveTab('pedidos')}
            className={`px-6 py-3 font-bold text-sm uppercase tracking-wide border-b-2 transition-colors ${activeTab === 'pedidos' ? 'border-gold text-navy' : 'border-transparent text-gray-400 hover:text-navy'}`}>
            Pedidos ({orders.length})
          </button>
          <button onClick={() => setActiveTab('testimonios')}
            className={`px-6 py-3 font-bold text-sm uppercase tracking-wide border-b-2 transition-colors ${activeTab === 'testimonios' ? 'border-gold text-navy' : 'border-transparent text-gray-400 hover:text-navy'}`}>
            Testimonios ({testimonials.length})
          </button>
          <button onClick={() => setActiveTab('catalogo')}
            className={`px-6 py-3 font-bold text-sm uppercase tracking-wide border-b-2 transition-colors ${activeTab === 'catalogo' ? 'border-gold text-navy' : 'border-transparent text-gray-400 hover:text-navy'}`}>
            Catálogo Preferencial
          </button>
          <button onClick={() => setActiveTab('clientes')}
            className={`px-6 py-3 font-bold text-sm uppercase tracking-wide border-b-2 transition-colors ${activeTab === 'clientes' ? 'border-gold text-navy' : 'border-transparent text-gray-400 hover:text-navy'}`}>
            Clientes
          </button>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">

        {/* ═══ PESTAÑA PEDIDOS ═══ */}
        {activeTab === 'pedidos' && (
          <div>
            <h2 className="text-2xl font-bold text-navy mb-6">Pedidos</h2>
            {ordersLoading ? (
              <div className="flex justify-center py-20">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gold"></div>
              </div>
            ) : orders.length === 0 ? (
              <p className="text-center text-gray-400 py-12">No hay pedidos aún</p>
            ) : (
              <div className="space-y-4">
                {orders.map(order => (
                  <div key={order.id} className="bg-white rounded-xl shadow p-4">
                    <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
                      <div>
                        <span className="font-bold text-navy text-lg">{order.order_number}</span>
                        {order.source === 'preferencial' && (
                          <span className="ml-2 text-xs bg-gold/20 text-gold-dark font-bold px-2 py-0.5 rounded-full">PREFERENCIAL</span>
                        )}
                        {order.contingente && (
                          <span className="ml-2 text-xs bg-navy/10 text-navy font-bold px-2 py-0.5 rounded-full">Cont. {order.contingente}</span>
                        )}
                        <span className="ml-3 text-xs text-gray-400">{new Date(order.created_at).toLocaleString('es-CO')}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <select value={order.status} onChange={e => updateOrderStatus(order.id, e.target.value)}
                          className={`text-xs font-bold px-3 py-1 rounded-full border ${
                            order.status === 'pendiente' ? 'bg-yellow-50 text-yellow-700 border-yellow-200' :
                            order.status === 'confirmado' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                            order.status === 'enviado' ? 'bg-purple-50 text-purple-700 border-purple-200' :
                            order.status === 'entregado' ? 'bg-green-50 text-green-700 border-green-200' :
                            'bg-red-50 text-red-700 border-red-200'
                          }`}>
                          <option value="pendiente">Pendiente</option>
                          <option value="confirmado">Confirmado</option>
                          <option value="enviado">Enviado</option>
                          <option value="entregado">Entregado</option>
                          <option value="cancelado">Cancelado</option>
                        </select>
                        <span className="font-bold text-navy text-lg">{fmt(order.total)}</span>
                      </div>
                    </div>
                    {order.customer_name && <p className="text-sm text-gray-600 mb-1">Cliente: <strong>{order.customer_name}</strong> {order.customer_phone && `· ${order.customer_phone}`}</p>}
                    <div className="border-t pt-2 mt-2">
                      {order.items.map(item => (
                        <div key={item.id} className="flex justify-between text-sm py-1">
                          <span className="text-gray-700">
                            {item.product_name}
                            {(item.size || item.color) && (
                              <span className="text-xs text-gray-500 ml-1">
                                {item.size && ` · Talla ${item.size}`}
                                {item.color && ` · Color ${item.color}`}
                              </span>
                            )}
                            <span className="text-gray-400 ml-1">x{item.qty}</span>
                          </span>
                          <span className="font-semibold text-navy">{fmt(item.subtotal)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ═══ PESTAÑA TESTIMONIOS (moderación) ═══ */}
        {activeTab === 'testimonios' && (
          <div>
            <h2 className="text-2xl font-bold text-navy mb-2">Calificaciones de clientes</h2>
            <p className="text-gray-500 text-sm mb-6">Los clientes dejan sus calificaciones desde la página. Desde aquí puedes ocultar comentarios inapropiados o eliminarlos.</p>

            {testimonialsLoading ? (
              <div className="flex justify-center py-12">
                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-gold"></div>
              </div>
            ) : testimonials.length === 0 ? (
              <p className="text-center text-gray-400 py-8">Aún no hay calificaciones</p>
            ) : (
              <div className="space-y-3">
                {testimonials.map(t => (
                  <div key={t.id} className={`bg-white rounded-xl shadow p-4 ${!t.active ? 'opacity-50' : ''}`}>
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3 mb-2">
                          <span className="font-bold text-navy">{t.customer_name}</span>
                          <div className="flex gap-0.5">
                            {[1,2,3,4,5].map(n => (
                              <svg key={n} className={`w-4 h-4 ${n <= t.rating ? 'text-gold' : 'text-gray-300'}`} fill="currentColor" viewBox="0 0 20 20">
                                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                              </svg>
                            ))}
                          </div>
                          <span className="text-xs text-gray-400">{new Date(t.created_at).toLocaleDateString('es-CO')}</span>
                        </div>
                        {t.comment && <p className="text-gray-600 text-sm italic">"{t.comment}"</p>}
                      </div>
                      <div className="flex gap-2 flex-shrink-0">
                        <button onClick={() => toggleTestimonialActive(t)}
                          className={`text-xs font-bold px-3 py-1.5 rounded ${t.active ? 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200' : 'bg-green-100 text-green-700 hover:bg-green-200'}`}>
                          {t.active ? 'Ocultar' : 'Mostrar'}
                        </button>
                        <button onClick={() => deleteTestimonial(t)}
                          className="bg-red-100 text-red-600 font-bold text-xs px-3 py-1.5 rounded hover:bg-red-200">
                          Eliminar
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ═══ PESTAÑA CATÁLOGO PREFERENCIAL ═══ */}
        {activeTab === 'catalogo' && <CatalogoTab showMensaje={showMensaje} />}

        {/* ═══ PESTAÑA CLIENTES ═══ */}
        {activeTab === 'clientes' && <ClientesTab showMensaje={showMensaje} />}

        {/* ═══ PESTAÑA PRODUCTOS ═══ */}
        {activeTab === 'productos' && <>
        {/* Barra de acciones */}
        <div className="flex flex-wrap justify-between items-center mb-6 gap-3 print:hidden">
          <h2 className="text-2xl font-bold text-navy">Productos ({products.length})</h2>
          <div className="flex gap-2 flex-wrap">
            <button onClick={() => setShowCrear(true)}
              className="bg-gold text-navy font-bold px-4 py-2 rounded-lg hover:bg-gold-dark transition-colors text-sm flex items-center gap-1">
              + Nuevo producto
            </button>
            <button onClick={exportarExcel}
              className="bg-green-600 text-white font-bold px-4 py-2 rounded-lg hover:bg-green-700 transition-colors text-sm flex items-center gap-1">
              ↓ Exportar Excel
            </button>
            <button onClick={imprimirCatalogo}
              className="bg-navy text-gold font-bold px-4 py-2 rounded-lg hover:bg-navy-light transition-colors text-sm flex items-center gap-1">
              ⎙ Imprimir catálogo
            </button>
          </div>
        </div>

        {/* Modal crear producto */}
        {showCrear && (
          <div className="fixed inset-0 bg-black bg-opacity-50 z-40 flex items-center justify-center px-4 print:hidden">
            <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-md">
              <h3 className="text-xl font-bold text-navy mb-4">Nuevo producto</h3>
              <form onSubmit={handleCrear} className="space-y-3">
                <div>
                  <label className="text-xs font-medium text-gray-600 uppercase tracking-wide">Nombre *</label>
                  <input type="text" required value={nuevoProducto.name}
                    onChange={e => setNuevoProducto(p => ({ ...p, name: e.target.value }))}
                    className="w-full mt-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gold" />
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-600 uppercase tracking-wide">Descripción</label>
                  <textarea rows={2} value={nuevoProducto.description}
                    onChange={e => setNuevoProducto(p => ({ ...p, description: e.target.value }))}
                    className="w-full mt-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gold" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-medium text-gray-600 uppercase tracking-wide">Precio *</label>
                    <input type="number" min="0" required value={nuevoProducto.price}
                      onChange={e => setNuevoProducto(p => ({ ...p, price: e.target.value }))}
                      className="w-full mt-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gold" />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-gray-600 uppercase tracking-wide">Stock</label>
                    <input type="number" min="0" value={nuevoProducto.stock}
                      onChange={e => setNuevoProducto(p => ({ ...p, stock: e.target.value }))}
                      className="w-full mt-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gold" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-medium text-gray-600 uppercase tracking-wide">Código</label>
                    <input type="text" value={nuevoProducto.codigo}
                      onChange={e => setNuevoProducto(p => ({ ...p, codigo: e.target.value }))}
                      placeholder="Ej: UNI-001"
                      className="w-full mt-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gold" />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-gray-600 uppercase tracking-wide">Categoría</label>
                    <select value={nuevoProducto.categoria}
                      onChange={e => setNuevoProducto(p => ({ ...p, categoria: e.target.value }))}
                      className="w-full mt-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gold">
                      <option value="">Sin categoría</option>
                      {CATEGORIAS_LISTA.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-600 uppercase tracking-wide">Tallas (opcional, separadas por coma)</label>
                  <input type="text" value={nuevoProducto.sizes}
                    onChange={e => setNuevoProducto(p => ({ ...p, sizes: e.target.value }))}
                    placeholder="S, M, L, XL  o  38, 40, 42"
                    className="w-full mt-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gold" />
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-600 uppercase tracking-wide">Colores (opcional, separados por coma)</label>
                  <input type="text" value={nuevoProducto.colors}
                    onChange={e => setNuevoProducto(p => ({ ...p, colors: e.target.value }))}
                    placeholder="Negro, Azul, Verde"
                    className="w-full mt-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gold" />
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-600 uppercase tracking-wide">Imagen</label>
                  <input type="file" accept="image/*"
                    onChange={e => setNuevaImagen(e.target.files[0])}
                    className="w-full mt-1 text-sm text-gray-500 file:mr-3 file:py-1 file:px-3 file:rounded file:border-0 file:bg-gold file:text-navy file:font-bold file:cursor-pointer" />
                </div>
                <div className="flex gap-3 pt-2">
                  <button type="button" onClick={() => { setShowCrear(false); setNuevoProducto(EMPTY_PRODUCT); setNuevaImagen(null); }}
                    className="flex-1 border border-gray-300 text-gray-600 font-bold py-2 rounded-lg hover:bg-gray-50 text-sm">
                    Cancelar
                  </button>
                  <button type="submit" disabled={creando}
                    className="flex-1 bg-gold text-navy font-bold py-2 rounded-lg hover:bg-gold-dark text-sm disabled:opacity-50">
                    {creando ? 'Creando...' : 'Crear producto'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Cabecera de impresión */}
        <div className="hidden print:block text-center mb-8">
          <img src="/Images/logo.png" alt="Logo" className="h-20 mx-auto mb-2" />
          <h1 className="text-3xl font-bold">Catálogo de Productos</h1>
          <p className="text-gray-500">dbohorkz Intendencia Militar · 314 218 70 98</p>
          <p className="text-gray-400 text-sm mt-1">{new Date().toLocaleDateString('es-CO')}</p>
        </div>

        {loading ? (
          <div className="flex justify-center py-20 print:hidden">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gold"></div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 print:grid-cols-3 print:gap-3">
            {products.map(product => (
              <div key={product.id} className="bg-white rounded-xl shadow p-4 flex flex-col gap-3 print:shadow-none print:border print:border-gray-200 print:rounded-lg print:p-3">
                {/* Imagen */}
                <div className="relative print:static">
                  <img src={imageUrl(product.image_url)} alt={product.name}
                    className="w-full h-40 object-cover rounded-lg bg-gray-100 print:h-32"
                    onError={e => { e.target.style.display = 'none'; }} />
                  <label className="absolute bottom-2 right-2 cursor-pointer bg-navy text-gold text-xs font-bold px-3 py-1 rounded-lg hover:bg-navy-light transition-colors print:hidden">
                    {uploading[product.id] ? 'Subiendo...' : 'Cambiar foto'}
                    <input type="file" accept="image/*" className="hidden"
                      disabled={uploading[product.id]}
                      onChange={e => handleImageUpload(product, e.target.files[0])} />
                  </label>
                </div>

                {/* Galería de fotos extras */}
                <div className="print:hidden">
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs text-gray-500 font-medium uppercase tracking-wide">Galería ({product.images?.length || 0})</label>
                    <label className="cursor-pointer text-xs bg-gold text-navy font-bold px-2 py-1 rounded hover:bg-gold-dark">
                      {uploading[`gallery_${product.id}`] ? 'Subiendo...' : '+ Foto'}
                      <input type="file" accept="image/*" className="hidden"
                        disabled={uploading[`gallery_${product.id}`]}
                        onChange={e => handleGalleryUpload(product, e.target.files[0])} />
                    </label>
                  </div>
                  {product.images?.length > 0 && (
                    <div className="flex gap-1 overflow-x-auto">
                      {product.images.map(img => (
                        <div key={img.id} className="relative flex-shrink-0 w-14 h-14">
                          <img src={imageUrl(img.image_url)} alt="" className="w-full h-full object-cover rounded" />
                          <button onClick={() => handleGalleryDelete(product, img.id)}
                            className="absolute -top-1 -right-1 bg-red-500 text-white w-4 h-4 rounded-full text-xs leading-none flex items-center justify-center hover:bg-red-600">&times;</button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* ID badge */}
                <div className="flex items-center justify-end print:hidden">
                  <span className="text-xs font-mono bg-gray-100 text-gray-500 px-2 py-0.5 rounded">
                    ID #{String(product.id).padStart(4,'0')}
                  </span>
                </div>

                {/* Nombre */}
                <div className="print:hidden">
                  <label className="text-xs text-gray-500 font-medium uppercase tracking-wide">Nombre</label>
                  <input type="text"
                    value={edits[product.id]?.name ?? ''}
                    onChange={e => handleEdit(product.id, 'name', e.target.value)}
                    className="w-full mt-1 border border-gray-300 rounded px-2 py-1 text-sm font-bold text-navy focus:outline-none focus:ring-2 focus:ring-gold" />
                </div>

                {/* Nombre solo impresión */}
                <h3 className="hidden print:block font-bold text-navy text-sm leading-tight">{product.name}</h3>

                {/* Descripción */}
                <div className="print:hidden">
                  <label className="text-xs text-gray-500 font-medium uppercase tracking-wide">Descripción</label>
                  <textarea rows={2}
                    value={edits[product.id]?.description ?? ''}
                    onChange={e => handleEdit(product.id, 'description', e.target.value)}
                    className="w-full mt-1 border border-gray-300 rounded px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-gold" />
                </div>

                {/* Código */}
                <div>
                  <label className="text-xs text-gray-500 font-medium uppercase tracking-wide">Código</label>
                  <input type="text"
                    value={edits[product.id]?.codigo ?? ''}
                    onChange={e => handleEdit(product.id, 'codigo', e.target.value)}
                    placeholder={`#${String(product.id).padStart(4,'0')}`}
                    className="w-full mt-1 border border-gray-300 rounded px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-gold print:hidden" />
                </div>

                {/* Categoría */}
                <div>
                  <label className="text-xs text-gray-500 font-medium uppercase tracking-wide">Categoría</label>
                  <select
                    value={edits[product.id]?.categoria ?? ''}
                    onChange={e => handleEdit(product.id, 'categoria', e.target.value)}
                    className="w-full mt-1 border border-gray-300 rounded px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-gold print:hidden">
                    <option value="">Sin categoría</option>
                    {CATEGORIAS_LISTA.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>

                {/* Tallas */}
                <div className="print:hidden">
                  <label className="text-xs text-gray-500 font-medium uppercase tracking-wide">Tallas (separadas por coma)</label>
                  <input type="text"
                    value={edits[product.id]?.sizes ?? ''}
                    onChange={e => handleEdit(product.id, 'sizes', e.target.value)}
                    placeholder="S, M, L, XL  o  38, 40, 42"
                    className="w-full mt-1 border border-gray-300 rounded px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-gold" />
                </div>

                {/* Colores */}
                <div className="print:hidden">
                  <label className="text-xs text-gray-500 font-medium uppercase tracking-wide">Colores (separados por coma)</label>
                  <input type="text"
                    value={edits[product.id]?.colors ?? ''}
                    onChange={e => handleEdit(product.id, 'colors', e.target.value)}
                    placeholder="Negro, Azul, Verde"
                    className="w-full mt-1 border border-gray-300 rounded px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-gold" />
                </div>

                {/* Precio (editable en pantalla, solo lectura en impresión) */}
                <div>
                  <label className="text-xs text-gray-500 font-medium uppercase tracking-wide print:hidden">Precio</label>
                  <div className="flex items-center gap-2 mt-1 print:hidden">
                    <span className="text-xs text-gray-400">$</span>
                    <input type="number" min="0"
                      value={edits[product.id]?.price ?? product.price}
                      onChange={e => handleEdit(product.id, 'price', e.target.value)}
                      className="flex-1 border border-gray-300 rounded px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-gold" />
                  </div>
                  <p className="text-sm font-bold text-gold mt-1">{fmt(edits[product.id]?.price ?? product.price)}</p>
                </div>

                {/* Stock */}
                <div>
                  <label className="text-xs text-gray-500 font-medium uppercase tracking-wide print:hidden">Stock</label>
                  <input type="number" min="0"
                    value={edits[product.id]?.stock ?? product.stock}
                    onChange={e => handleEdit(product.id, 'stock', e.target.value)}
                    className="w-full mt-1 border border-gray-300 rounded px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-gold print:hidden" />
                  <p className="text-xs text-gray-500 hidden print:block">Stock: {product.stock}</p>
                </div>

                {/* Botones */}
                <div className="flex gap-2 print:hidden">
                  <button onClick={() => handleSave(product)} disabled={saving[product.id]}
                    className="flex-1 bg-gold text-navy font-bold py-2 rounded-lg hover:bg-gold-dark transition-colors text-sm disabled:opacity-50">
                    {saving[product.id] ? 'Guardando...' : 'Guardar'}
                  </button>
                  <button onClick={() => handleDelete(product)} disabled={deleting[product.id]}
                    className="bg-red-100 text-red-600 font-bold px-3 py-2 rounded-lg hover:bg-red-200 transition-colors text-sm disabled:opacity-50">
                    {deleting[product.id] ? '...' : 'Eliminar'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
        </>}
      </div>
    </div>
  );
}
