import React, { useState, useEffect, useCallback } from 'react';
import { Search, ShoppingCart, User, Plus, Edit3, Trash2, Filter, Grid3X3, BarChart3, Package, Tag, Upload, Eye, LogOut, Menu, X } from 'lucide-react';

const API_BASE_URL = 'http://localhost:3000';

// API Helper Functions
const api = {
  async call(endpoint, options = {}) {
    const token = JSON.parse(localStorage.getItem('auth') || '{}').access_token;
    
    // Check if body is FormData - if so, don't set Content-Type
    const isFormData = options.body instanceof FormData;
    
    const defaultOptions = {
      headers: {
        ...(!isFormData && { 'Content-Type': 'application/json' }),
        ...(token && { 'Authorization': `Bearer ${token}` })
      }
    };

    const mergedOptions = {
      ...defaultOptions,
      ...options,
      headers: { 
        ...defaultOptions.headers, 
        ...options.headers 
      }
    };

    const response = await fetch(`${API_BASE_URL}${endpoint}`, mergedOptions);
    
    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: { message: 'Network error' } }));
      throw new Error(error.error?.message || 'Request failed');
    }
    
    return await response.json();
  },

  auth: {
    async login(credentials) {
      return await api.call('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify(credentials)
      });
    },

    async register(userData) {
      return await api.call('/api/auth/register', {
        method: 'POST',
        body: JSON.stringify(userData)
      });
    },

    async logout() {
      return await api.call('/api/auth/logout', {
        method: 'POST'
      });
    }
  },

  products: {
    async list(params = {}) {
      const queryString = new URLSearchParams(params).toString();
      const endpoint = queryString ? `/api/products?${queryString}` : '/api/products';
      return await api.call(endpoint);
    },

    async get(id) {
      return await api.call(`/api/products/${id}`);
    },

    async create(productData) {
      return await api.call('/api/products', {
        method: 'POST',
        body: JSON.stringify(productData)
      });
    },

    async update(id, productData) {
      return await api.call(`/api/products/${id}`, {
        method: 'PUT',
        body: JSON.stringify(productData)
      });
    },

    async delete(id) {
      return await api.call(`/api/products/${id}`, {
        method: 'DELETE'
      });
    },

    async uploadImage(id, formData) {
      // For FormData uploads, don't use api.call as it sets Content-Type
      const token = JSON.parse(localStorage.getItem('auth') || '{}').access_token;
      
      const options = {
        method: 'POST',
        body: formData,
        ...(token && { 
          headers: { 'Authorization': `Bearer ${token}` }
        })
      };

      const response = await fetch(`${API_BASE_URL}/api/products/${id}/upload-image`, options);
      
      if (!response.ok) {
        const error = await response.json().catch(() => ({ error: { message: 'Upload failed' } }));
        throw new Error(error.error?.message || 'Upload failed');
      }
      
      return await response.json();
    }
  },

  categories: {
    async list() {
      return await api.call('/api/categories');
    },

    async create(categoryData) {
      return await api.call('/api/categories', {
        method: 'POST',
        body: JSON.stringify(categoryData)
      });
    },

    async update(id, categoryData) {
      return await api.call(`/api/categories/${id}`, {
        method: 'PUT',
        body: JSON.stringify(categoryData)
      });
    },

    async delete(id) {
      return await api.call(`/api/categories/${id}`, {
        method: 'DELETE'
      });
    }
  }
};

// Notification Component
const Notification = ({ message, type, onClose }) => {
  useEffect(() => {
    const timer = setTimeout(onClose, 3000);
    return () => clearTimeout(timer);
  }, [onClose]);

  const bgColors = {
    success: 'bg-green-500',
    error: 'bg-red-500',
    warning: 'bg-yellow-500',
    info: 'bg-blue-500'
  };

  return (
    <div className={`fixed top-4 right-4 ${bgColors[type]} text-white px-6 py-4 rounded-lg shadow-lg z-50 transform transition-all duration-300 animate-pulse`}>
      <div className="flex items-center space-x-2">
        <span>{message}</span>
        <button onClick={onClose} className="ml-2 hover:text-gray-200">
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

// Auth Modal Component
const AuthModal = ({ isOpen, mode, onClose, onAuth }) => {
  const [formData, setFormData] = useState({ username: '', email: '', password: '' });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const result = mode === 'login' 
        ? await api.auth.login({ email: formData.email, password: formData.password })
        : await api.auth.register(formData);
      
      localStorage.setItem('auth', JSON.stringify({
        access_token: result.access_token,
        refresh_token: result.refresh_token,
        user: result.user
      }));
      
      onAuth(result.user);
      onClose();
    } catch (error) {
      alert(error.message);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white p-8 rounded-xl w-96 transform transition-all duration-300 scale-100">
        <h3 className="text-2xl font-bold mb-6 text-gray-800">
          {mode === 'login' ? 'Welcome Back' : 'Create Account'}
        </h3>
        <form onSubmit={handleSubmit} className="space-y-4">
          {mode === 'register' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Username</label>
              <input
                type="text"
                value={formData.username}
                onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                required
              />
            </div>
          )}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Password</label>
            <input
              type="password"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              required
            />
          </div>
          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-3 text-gray-600 hover:text-gray-800 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg hover:from-blue-600 hover:to-purple-700 transform hover:scale-105 transition-all duration-200 disabled:opacity-50"
            >
              {loading ? 'Processing...' : (mode === 'login' ? 'Sign In' : 'Create Account')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// Product Card Component
const ProductCard = ({ product, onAddToCart }) => {
  const [imageError, setImageError] = useState(false);
  
  const imageUrl = product.image_url && !imageError 
    ? `${API_BASE_URL}${product.image_url}` 
    : null;

  return (
    <div className="bg-white rounded-xl shadow-lg overflow-hidden transform transition-all duration-300 hover:scale-105 hover:shadow-2xl group">
      <div className="h-48 bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center overflow-hidden relative">
        {imageUrl ? (
          <img 
            src={imageUrl} 
            alt={product.name} 
            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
            onError={() => setImageError(true)}
          />
        ) : (
          <div className="text-gray-400 text-center">
            <Package className="w-12 h-12 mx-auto mb-2" />
            <span className="text-sm">No Image</span>
          </div>
        )}
        <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all duration-300" />
      </div>
      
      <div className="p-6">
        <h3 className="font-bold text-lg mb-2 text-gray-800 group-hover:text-blue-600 transition-colors">
          {product.name}
        </h3>
        <p className="text-gray-600 text-sm mb-4 line-clamp-2">{product.description}</p>
        
        <div className="flex justify-between items-center mb-4">
          <span className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            ${parseFloat(product.price).toFixed(2)}
          </span>
          <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
            product.stock > 10 ? 'bg-green-100 text-green-700' :
            product.stock > 0 ? 'bg-yellow-100 text-yellow-700' :
            'bg-red-100 text-red-700'
          }`}>
            {product.stock > 10 ? 'In Stock' : product.stock > 0 ? `${product.stock} left` : 'Out of Stock'}
          </span>
        </div>
        
        <button
          onClick={() => onAddToCart(product)}
          disabled={product.stock === 0}
          className="w-full bg-gradient-to-r from-blue-500 to-purple-600 text-white py-3 rounded-lg hover:from-blue-600 hover:to-purple-700 transform hover:scale-105 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none font-semibold"
        >
          {product.stock === 0 ? 'Out of Stock' : 'Add to Cart'}
        </button>
      </div>
    </div>
  );
};

// Category Card Component
const CategoryCard = ({ category, onSelect }) => (
  <div 
    onClick={() => onSelect(category.id)}
    className="bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 text-white p-6 rounded-xl shadow-lg cursor-pointer transform transition-all duration-300 hover:scale-105 hover:shadow-2xl group"
  >
    <div className="flex items-center justify-between mb-4">
      <h3 className="text-xl font-bold">{category.name}</h3>
      <div className="bg-white bg-opacity-20 p-2 rounded-lg group-hover:bg-opacity-30 transition-all">
        <Tag className="w-6 h-6" />
      </div>
    </div>
    <p className="text-indigo-100 mb-4">{category.description}</p>
    <div className="flex items-center justify-between">
      <span className="text-sm opacity-75">Click to explore</span>
      <div className="transform group-hover:translate-x-2 transition-transform">
        <span className="text-sm font-medium">View Products →</span>
      </div>
    </div>
  </div>
);

// Admin Category Form Component
const AdminCategoryForm = ({ category, onSave, onCancel }) => {
  const [formData, setFormData] = useState({
    name: category?.name || '',
    description: category?.description || ''
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      if (category) {
        await api.categories.update(category.id, formData);
      } else {
        await api.categories.create(formData);
      }
      onSave();
    } catch (error) {
      alert(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl p-8 w-full max-w-md">
        <h3 className="text-2xl font-bold mb-6 text-gray-800">
          {category ? 'Edit Category' : 'Add New Category'}
        </h3>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Category Name</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows="3"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              required
            />
          </div>

          <div className="flex justify-end space-x-4 pt-6">
            <button
              type="button"
              onClick={onCancel}
              className="px-6 py-3 text-gray-600 hover:text-gray-800 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg hover:from-blue-600 hover:to-purple-700 transform hover:scale-105 transition-all duration-200 disabled:opacity-50 font-semibold"
            >
              {loading ? 'Saving...' : 'Save Category'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
const AdminProductForm = ({ product, categories, onSave, onCancel }) => {
  const [formData, setFormData] = useState({
    name: product?.name || '',
    description: product?.description || '',
    price: product?.price || '',
    category_id: product?.category_id || '',
    stock: product?.stock || ''
  });
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(product?.image_url ? `${API_BASE_URL}${product.image_url}` : null);
  const [loading, setLoading] = useState(false);

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onload = (e) => setImagePreview(e.target.result);
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      // Convert string values to appropriate types for the API
      const price = parseFloat(formData.price);
      const stock = parseInt(formData.stock, 10);
      
      // Validate numeric values
      if (isNaN(price) || price < 0) {
        alert('Please enter a valid price (must be a positive number)');
        setLoading(false);
        return;
      }
      
      if (isNaN(stock) || stock < 0) {
        alert('Please enter a valid stock quantity (must be a non-negative integer)');
        setLoading(false);
        return;
      }

      const apiData = {
        ...formData,
        price: formData.price,  // Keep as string for backend
        stock: stock,           // Convert to integer
        category_id: formData.category_id
      };

      let savedProduct;
      if (product) {
        savedProduct = await api.products.update(product.id, apiData);
      } else {
        savedProduct = await api.products.create(apiData);
      }

      if (imageFile) {
        const imageFormData = new FormData();
        imageFormData.append('image', imageFile);
        const productId = savedProduct.id || (product && product.id);
        if (productId) {
          await api.products.uploadImage(productId, imageFormData);
        }
      }

      onSave();
    } catch (error) {
      alert(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl p-8 w-full max-w-2xl max-h-screen overflow-y-auto">
        <h3 className="text-2xl font-bold mb-6 text-gray-800">
          {product ? 'Edit Product' : 'Add New Product'}
        </h3>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Product Name</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Price</label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={formData.price}
                onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows="3"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
              <select
                value={formData.category_id}
                onChange={(e) => setFormData({ ...formData, category_id: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                required
              >
                <option value="">Select Category</option>
                {categories.map(cat => (
                  <option key={cat.id} value={cat.id}>{cat.name}</option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Stock Quantity</label>
              <input
                type="number"
                min="0"
                value={formData.stock}
                onChange={(e) => setFormData({ ...formData, stock: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Product Image</label>
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 hover:border-blue-400 transition-colors">
              <input
                type="file"
                accept="image/*"
                onChange={handleImageChange}
                className="hidden"
                id="image-upload"
              />
              
              {imagePreview ? (
                <div className="text-center">
                  <img src={imagePreview} alt="Preview" className="max-w-full h-32 object-cover mx-auto mb-4 rounded-lg" />
                  <div className="space-x-2">
                    <label htmlFor="image-upload" className="cursor-pointer text-blue-600 hover:text-blue-800">
                      Change Image
                    </label>
                    <button type="button" onClick={() => setImagePreview(null)} className="text-red-600 hover:text-red-800">
                      Remove
                    </button>
                  </div>
                </div>
              ) : (
                <label htmlFor="image-upload" className="cursor-pointer block text-center">
                  <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <span className="text-blue-600 hover:text-blue-800 font-medium">
                    Click to upload image
                  </span>
                  <p className="text-xs text-gray-500 mt-2">PNG, JPG, WebP up to 5MB</p>
                </label>
              )}
            </div>
          </div>

          <div className="flex justify-end space-x-4 pt-6">
            <button
              type="button"
              onClick={onCancel}
              className="px-6 py-3 text-gray-600 hover:text-gray-800 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg hover:from-blue-600 hover:to-purple-700 transform hover:scale-105 transition-all duration-200 disabled:opacity-50 font-semibold"
            >
              {loading ? 'Saving...' : 'Save Product'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// Main App Component
const EcommerceApp = () => {
  const [user, setUser] = useState(null);
  const [currentPage, setCurrentPage] = useState('products');
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [adminProducts, setAdminProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [notification, setNotification] = useState(null);
  const [authModal, setAuthModal] = useState({ isOpen: false, mode: 'login' });
  const [productModal, setProductModal] = useState({ isOpen: false, product: null });
  const [categoryModal, setCategoryModal] = useState({ isOpen: false, category: null });
  const [cart, setCart] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({
    category_id: '',
    min_price: '',
    max_price: '',
    in_stock: false
  });
  const [pagination, setPagination] = useState({ current_page: 1, total_pages: 1 });
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('products');

  // Initialize app
  useEffect(() => {
    const checkAuth = () => {
      const authData = JSON.parse(localStorage.getItem('auth') || '{}');
      if (authData.user) {
        setUser(authData.user);
      }
    };

    const loadInitialData = async () => {
      setLoading(true);
      try {
        console.log('Loading initial data...');
        const [categoriesData, productsData] = await Promise.all([
          api.categories.list().catch(err => {
            console.error('Categories error:', err);
            return [];
          }),
          api.products.list({ page: 1, per_page: 12 }).catch(err => {
            console.error('Products error:', err);
            return { data: [], pagination: { current_page: 1, total_pages: 1 } };
          })
        ]);
        
        console.log('Categories data:', categoriesData);
        console.log('Products data:', productsData);
        
        setCategories(Array.isArray(categoriesData) ? categoriesData : []);
        
        if (productsData.data) {
          setProducts(productsData.data);
          setPagination(productsData.pagination || { current_page: 1, total_pages: 1 });
        } else {
          setProducts(Array.isArray(productsData) ? productsData : []);
        }
      } catch (error) {
        console.error('Failed to load data:', error);
        showNotification('Failed to load data', 'error');
        // Set default empty states on error
        setCategories([]);
        setProducts([]);
        setPagination({ current_page: 1, total_pages: 1 });
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
    loadInitialData();
  }, []);

  const showNotification = (message, type = 'info') => {
    setNotification({ message, type });
  };

  const closeNotification = () => {
    setNotification(null);
  };

  const handleAuth = (userData) => {
    setUser(userData);
    showNotification(`Welcome, ${userData.username}!`, 'success');
  };

  const handleLogout = async () => {
    try {
      await api.auth.logout();
    } catch (error) {
      console.warn('Logout API call failed:', error);
    } finally {
      localStorage.removeItem('auth');
      setUser(null);
      setCurrentPage('products');
      showNotification('Logged out successfully', 'info');
    }
  };

  const searchProducts = useCallback(async (page = 1) => {
    setLoading(true);
    try {
      const params = {
        page: page,
        per_page: 12,
        ...(searchTerm && { search: searchTerm }),
        ...(filters.category_id && { category_id: filters.category_id }),
        ...(filters.min_price && { min_price: parseFloat(filters.min_price) }),
        ...(filters.max_price && { max_price: parseFloat(filters.max_price) }),
        ...(filters.in_stock && { in_stock: true })
      };

      const data = await api.products.list(params);
      
      if (data.data) {
        setProducts(data.data);
        setPagination(data.pagination || { current_page: page, total_pages: 1 });
      } else {
        setProducts(Array.isArray(data) ? data : []);
        setPagination({ current_page: page, total_pages: 1 });
      }
    } catch (error) {
      showNotification('Search failed', 'error');
    } finally {
      setLoading(false);
    }
  }, [searchTerm, filters]);

  const addToCart = (product) => {
    if (!user) {
      setAuthModal({ isOpen: true, mode: 'login' });
      return;
    }

    const existingItem = cart.find(item => item.id === product.id);
    if (existingItem) {
      setCart(cart.map(item => 
        item.id === product.id 
          ? { ...item, quantity: item.quantity + 1 }
          : item
      ));
    } else {
      setCart([...cart, { ...product, quantity: 1 }]);
    }
    
    showNotification(`${product.name} added to cart!`, 'success');
  };

  const saveProduct = async () => {
    setProductModal({ isOpen: false, product: null });
    await loadAdminData(); // Reload all admin data
    showNotification('Product saved successfully!', 'success');
  };

  const saveCategory = async () => {
    setCategoryModal({ isOpen: false, category: null });
    await loadAdminData(); // Reload all admin data
    showNotification('Category saved successfully!', 'success');
  };

  const loadAdminData = async () => {
    if (!user || user.role?.toLowerCase() !== 'admin') return;
    
    setLoading(true);
    try {
      const [categoriesData, productsData] = await Promise.all([
        api.categories.list(),
        api.products.list({ per_page: 100 }) // Get more products for admin
      ]);
      
      setCategories(categoriesData);
      
      if (productsData.data) {
        setAdminProducts(productsData.data);
      } else {
        setAdminProducts(Array.isArray(productsData) ? productsData : []);
      }
    } catch (error) {
      showNotification('Failed to load admin data', 'error');
    } finally {
      setLoading(false);
    }
  };

  const deleteProduct = async (productId) => {
    if (!confirm('Are you sure you want to delete this product?')) return;
    
    try {
      await api.products.delete(productId);
      await loadAdminData();
      showNotification('Product deleted successfully!', 'success');
    } catch (error) {
      showNotification('Failed to delete product', 'error');
    }
  };

  const deleteCategory = async (categoryId) => {
    // Check if category has products
    const hasProducts = adminProducts.some(p => p.category_id === categoryId);
    if (hasProducts) {
      showNotification('Cannot delete category that contains products', 'error');
      return;
    }

    if (!confirm('Are you sure you want to delete this category?')) return;
    
    try {
      await api.categories.delete(categoryId);
      await loadAdminData();
      showNotification('Category deleted successfully!', 'success');
    } catch (error) {
      showNotification('Failed to delete category', 'error');
    }
  };

  // Load admin data when switching to admin page
  useEffect(() => {
    if (currentPage === 'admin' && user?.role?.toLowerCase() === 'admin') {
      loadAdminData();
    }
  }, [currentPage, user]);

  // Trigger search when filters change or component loads
  useEffect(() => {
    if (currentPage === 'products') {
      searchProducts(1);
    }
  }, [searchProducts, currentPage]);

  const renderNavigation = () => (
    <nav className="bg-white shadow-lg sticky top-0 z-40 backdrop-blur-lg bg-opacity-95">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex justify-between items-center py-4">
          <div className="flex items-center space-x-8">
            <h1 
              className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent cursor-pointer"
              onClick={() => setCurrentPage('products')}
            >
              ModernShop
            </h1>
            
            <div className="hidden md:flex space-x-6">
              <button
                onClick={() => setCurrentPage('products')}
                className={`px-4 py-2 rounded-lg font-medium transition-all ${
                  currentPage === 'products' 
                    ? 'bg-blue-100 text-blue-700' 
                    : 'text-gray-600 hover:text-blue-600 hover:bg-gray-100'
                }`}
              >
                Products
              </button>
              <button
                onClick={() => {
                  console.log('Categories button clicked, categories count:', categories.length);
                  setCurrentPage('categories');
                }}
                className={`px-4 py-2 rounded-lg font-medium transition-all ${
                  currentPage === 'categories' 
                    ? 'bg-blue-100 text-blue-700' 
                    : 'text-gray-600 hover:text-blue-600 hover:bg-gray-100'
                }`}
              >
                Categories
              </button>
              {user?.role?.toLowerCase() === 'admin' && (
                <button
                  onClick={() => setCurrentPage('admin')}
                  className={`px-4 py-2 rounded-lg font-medium transition-all ${
                    currentPage === 'admin' 
                      ? 'bg-purple-100 text-purple-700' 
                      : 'text-gray-600 hover:text-purple-600 hover:bg-gray-100'
                  }`}
                >
                  Admin Panel
                </button>
              )}
            </div>
          </div>

          <div className="flex items-center space-x-4">
            {user ? (
              <div className="flex items-center space-x-4">
                <div className="relative cursor-pointer">
                  <ShoppingCart className="w-6 h-6 text-gray-600 hover:text-blue-600 transition-colors" />
                  {cart.length > 0 && (
                    <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                      {cart.reduce((sum, item) => sum + item.quantity, 0)}
                    </span>
                  )}
                </div>
                <span className="text-gray-700 font-medium">{user.username}</span>
                <button
                  onClick={handleLogout}
                  className="bg-gradient-to-r from-red-500 to-pink-600 text-white px-4 py-2 rounded-lg hover:from-red-600 hover:to-pink-700 transform hover:scale-105 transition-all duration-200"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="flex space-x-2">
                <button
                  onClick={() => setAuthModal({ isOpen: true, mode: 'login' })}
                  className="bg-gradient-to-r from-blue-500 to-purple-600 text-white px-6 py-2 rounded-lg hover:from-blue-600 hover:to-purple-700 transform hover:scale-105 transition-all duration-200 font-medium"
                >
                  Sign In
                </button>
                <button
                  onClick={() => setAuthModal({ isOpen: true, mode: 'register' })}
                  className="border-2 border-blue-500 text-blue-600 px-6 py-2 rounded-lg hover:bg-blue-50 transform hover:scale-105 transition-all duration-200 font-medium"
                >
                  Sign Up
                </button>
              </div>
            )}
            
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden text-gray-600"
            >
              <Menu className="w-6 h-6" />
            </button>
          </div>
        </div>
      </div>
    </nav>
  );

  const renderSearchBar = () => (
    <div className="bg-white shadow-sm border-b">
      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="flex flex-col md:flex-row gap-4 items-center">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search products..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && searchProducts()}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all shadow-sm"
            />
          </div>
          
          <div className="flex gap-3 flex-wrap">
            <select
              value={filters.category_id}
              onChange={(e) => setFilters({ ...filters, category_id: e.target.value })}
              className="px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 transition-all"
            >
              <option value="">All Categories</option>
              {categories.map(cat => (
                <option key={cat.id} value={cat.id}>{cat.name}</option>
              ))}
            </select>
            
            <input
              type="number"
              min="0"
              step="0.01"
              placeholder="Min Price"
              value={filters.min_price}
              onChange={(e) => setFilters({ ...filters, min_price: e.target.value })}
              className="w-24 px-3 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 transition-all"
            />
            
            <input
              type="number"
              min="0"
              step="0.01"
              placeholder="Max Price"
              value={filters.max_price}
              onChange={(e) => setFilters({ ...filters, max_price: e.target.value })}
              className="w-24 px-3 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 transition-all"
            />
            
            <label className="flex items-center space-x-2 bg-gray-50 px-4 py-3 rounded-xl">
              <input
                type="checkbox"
                checked={filters.in_stock}
                onChange={(e) => setFilters({ ...filters, in_stock: e.target.checked })}
                className="rounded text-blue-600"
              />
              <span className="text-sm font-medium">In Stock</span>
            </label>
            
            <button
              onClick={searchProducts}
              className="bg-gradient-to-r from-blue-500 to-purple-600 text-white px-6 py-3 rounded-xl hover:from-blue-600 hover:to-purple-700 transform hover:scale-105 transition-all duration-200 font-semibold"
            >
              <Filter className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  const renderProducts = () => (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {loading ? (
        <div className="flex justify-center items-center py-20">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      ) : products.length === 0 ? (
        <div className="text-center py-20">
          <Package className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-xl font-medium text-gray-900 mb-2">No products found</h3>
          <p className="text-gray-500">Try adjusting your search or filters</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {products.map(product => (
              <ProductCard
                key={product.id}
                product={product}
                onAddToCart={addToCart}
              />
            ))}
          </div>
          
          {pagination.total_pages > 1 && (
            <div className="flex justify-center mt-12">
              <div className="flex items-center space-x-2">
                {pagination.current_page > 1 && (
                  <button
                    onClick={() => searchProducts(pagination.current_page - 1)}
                    className="px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors font-medium"
                  >
                    Previous
                  </button>
                )}
                
                {/* Page Numbers */}
                {(() => {
                  const pages = [];
                  const totalPages = pagination.total_pages;
                  const currentPage = pagination.current_page;
                  
                  // Show first page
                  if (totalPages > 0) {
                    pages.push(
                      <button
                        key={1}
                        onClick={() => searchProducts(1)}
                        className={`px-4 py-2 rounded-lg transition-colors font-medium ${
                          1 === currentPage
                            ? 'bg-blue-600 text-white'
                            : 'bg-white border border-gray-300 hover:bg-gray-50'
                        }`}
                      >
                        1
                      </button>
                    );
                  }
                  
                  // Show ellipsis if needed
                  if (currentPage > 4) {
                    pages.push(
                      <span key="ellipsis1" className="px-2 py-2 text-gray-500">...</span>
                    );
                  }
                  
                  // Show pages around current
                  const start = Math.max(2, currentPage - 1);
                  const end = Math.min(totalPages - 1, currentPage + 1);
                  
                  for (let i = start; i <= end; i++) {
                    if (i !== 1 && i !== totalPages) {
                      pages.push(
                        <button
                          key={i}
                          onClick={() => searchProducts(i)}
                          className={`px-4 py-2 rounded-lg transition-colors font-medium ${
                            i === currentPage
                              ? 'bg-blue-600 text-white'
                              : 'bg-white border border-gray-300 hover:bg-gray-50'
                          }`}
                        >
                          {i}
                        </button>
                      );
                    }
                  }
                  
                  // Show ellipsis if needed
                  if (currentPage < totalPages - 3) {
                    pages.push(
                      <span key="ellipsis2" className="px-2 py-2 text-gray-500">...</span>
                    );
                  }
                  
                  // Show last page
                  if (totalPages > 1) {
                    pages.push(
                      <button
                        key={totalPages}
                        onClick={() => searchProducts(totalPages)}
                        className={`px-4 py-2 rounded-lg transition-colors font-medium ${
                          totalPages === currentPage
                            ? 'bg-blue-600 text-white'
                            : 'bg-white border border-gray-300 hover:bg-gray-50'
                        }`}
                      >
                        {totalPages}
                      </button>
                    );
                  }
                  
                  return pages;
                })()}
                
                {pagination.current_page < pagination.total_pages && (
                  <button
                    onClick={() => searchProducts(pagination.current_page + 1)}
                    className="px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors font-medium"
                  >
                    Next
                  </button>
                )}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );

  const renderCategories = () => {
    console.log('Rendering categories, count:', categories.length, 'categories:', categories);
    return (
      <div className="max-w-7xl mx-auto px-4 py-8">
        <h2 className="text-4xl font-bold text-gray-800 mb-8 text-center">
          Explore <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">Categories</span>
        </h2>
        
        {categories.length === 0 ? (
          <div className="text-center py-20">
            <Tag className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-medium text-gray-900 mb-2">No categories available</h3>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {categories.map(category => (
              <CategoryCard
                key={category.id}
                category={category}
                onSelect={(categoryId) => {
                  setFilters({ ...filters, category_id: categoryId });
                  setCurrentPage('products');
                  setTimeout(searchProducts, 100);
                }}
              />
            ))}
          </div>
        )}
      </div>
    );
  };

  const renderAdminPanel = () => {
    if (!user || user.role?.toLowerCase() !== 'admin') {
      return (
        <div className="max-w-4xl mx-auto px-4 py-20 text-center">
          <div className="bg-red-50 border border-red-200 rounded-xl p-8">
            <h3 className="text-xl font-medium text-red-800 mb-2">Access Denied</h3>
            <p className="text-red-600">You need admin privileges to access this panel.</p>
          </div>
        </div>
      );
    }

    return (
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-4xl font-bold text-gray-800">
            Admin <span className="bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">Dashboard</span>
          </h2>
        </div>

        {/* Dashboard Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-gradient-to-br from-blue-500 to-blue-700 text-white p-6 rounded-xl shadow-lg transform hover:scale-105 transition-all duration-200">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold mb-2">Total Products</h3>
                <p className="text-3xl font-bold">{adminProducts.length}</p>
              </div>
              <Package className="w-12 h-12 opacity-80" />
            </div>
          </div>
          
          <div className="bg-gradient-to-br from-green-500 to-green-700 text-white p-6 rounded-xl shadow-lg transform hover:scale-105 transition-all duration-200">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold mb-2">Categories</h3>
                <p className="text-3xl font-bold">{categories.length}</p>
              </div>
              <Tag className="w-12 h-12 opacity-80" />
            </div>
          </div>
          
          <div className="bg-gradient-to-br from-yellow-500 to-yellow-700 text-white p-6 rounded-xl shadow-lg transform hover:scale-105 transition-all duration-200">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold mb-2">Low Stock</h3>
                <p className="text-3xl font-bold">{adminProducts.filter(p => p.stock <= 5).length}</p>
              </div>
              <BarChart3 className="w-12 h-12 opacity-80" />
            </div>
          </div>
        </div>

        {/* Admin Tabs */}
        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          <div className="border-b border-gray-200">
            <nav className="flex space-x-8 px-6">
              <button
                onClick={() => setActiveTab('products')}
                className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === 'products'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                Products Management
              </button>
              <button
                onClick={() => setActiveTab('categories')}
                className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === 'categories'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                Categories Management
              </button>
            </nav>
          </div>

          {/* Products Tab */}
          {activeTab === 'products' && (
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-semibold text-gray-800">Manage Products</h3>
                <button
                  onClick={() => setProductModal({ isOpen: true, product: null })}
                  className="bg-gradient-to-r from-green-500 to-teal-600 text-white px-6 py-3 rounded-xl hover:from-green-600 hover:to-teal-700 transform hover:scale-105 transition-all duration-200 font-semibold flex items-center space-x-2"
                >
                  <Plus className="w-5 h-5" />
                  <span>Add Product</span>
                </button>
              </div>
              
              {adminProducts.length === 0 ? (
                <div className="text-center py-12">
                  <Package className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No products yet</h3>
                  <p className="text-gray-500 mb-6">Start building your catalog by adding your first product.</p>
                  <button
                    onClick={() => setProductModal({ isOpen: true, product: null })}
                    className="bg-gradient-to-r from-blue-500 to-purple-600 text-white px-6 py-3 rounded-lg hover:from-blue-600 hover:to-purple-700 transform hover:scale-105 transition-all duration-200 font-semibold"
                  >
                    Add First Product
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  {adminProducts.map(product => (
                    <div key={product.id} className="flex items-center space-x-4 p-4 border border-gray-200 rounded-xl hover:shadow-md transition-all duration-200 bg-gray-50">
                      <div className="flex-shrink-0">
                        {product.image_url ? (
                          <img 
                            src={`${API_BASE_URL}${product.image_url}`} 
                            alt={product.name} 
                            className="w-16 h-16 object-cover rounded-lg"
                          />
                        ) : (
                          <div className="w-16 h-16 bg-gray-200 rounded-lg flex items-center justify-center">
                            <Package className="w-8 h-8 text-gray-400" />
                          </div>
                        )}
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <h4 className="font-semibold text-lg text-gray-800 truncate">{product.name}</h4>
                        <p className="text-gray-600 text-sm truncate">{product.description}</p>
                        <div className="flex items-center space-x-4 mt-2 text-sm">
                          <span className="font-medium text-green-600">${parseFloat(product.price).toFixed(2)}</span>
                          <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                            product.stock > 10 ? 'bg-green-100 text-green-700' :
                            product.stock > 0 ? 'bg-yellow-100 text-yellow-700' :
                            'bg-red-100 text-red-700'
                          }`}>
                            Stock: {product.stock}
                          </span>
                          <span className="text-gray-500">
                            Category: {categories.find(c => c.id === product.category_id)?.name || 'Unknown'}
                          </span>
                        </div>
                      </div>
                      
                      <div className="flex space-x-2">
                        <button
                          onClick={() => setProductModal({ isOpen: true, product })}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="Edit Product"
                        >
                          <Edit3 className="w-5 h-5" />
                        </button>
                        <button
                          onClick={() => deleteProduct(product.id)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Delete Product"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Categories Tab */}
          {activeTab === 'categories' && (
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-semibold text-gray-800">Manage Categories</h3>
                <button
                  onClick={() => setCategoryModal({ isOpen: true, category: null })}
                  className="bg-gradient-to-r from-purple-500 to-pink-600 text-white px-6 py-3 rounded-xl hover:from-purple-600 hover:to-pink-700 transform hover:scale-105 transition-all duration-200 font-semibold flex items-center space-x-2"
                >
                  <Plus className="w-5 h-5" />
                  <span>Add Category</span>
                </button>
              </div>
              
              {categories.length === 0 ? (
                <div className="text-center py-12">
                  <Tag className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No categories yet</h3>
                  <p className="text-gray-500 mb-6">Start organizing your products by adding categories.</p>
                  <button
                    onClick={() => setCategoryModal({ isOpen: true, category: null })}
                    className="bg-gradient-to-r from-purple-500 to-pink-600 text-white px-6 py-3 rounded-lg hover:from-purple-600 hover:to-pink-700 transform hover:scale-105 transition-all duration-200 font-semibold"
                  >
                    Add First Category
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {categories.map(category => (
                    <div key={category.id} className="p-4 border border-gray-200 rounded-xl hover:shadow-md transition-all duration-200 bg-gray-50">
                      <div className="flex justify-between items-start">
                        <div className="flex-1 min-w-0">
                          <h4 className="font-semibold text-lg text-gray-800 mb-2">{category.name}</h4>
                          <p className="text-gray-600 text-sm mb-3">{category.description}</p>
                          <div className="text-xs text-gray-500">
                            Products in category: {adminProducts.filter(p => p.category_id === category.id).length}
                          </div>
                        </div>
                        
                        <div className="flex space-x-2 ml-4">
                          <button
                            onClick={() => setCategoryModal({ isOpen: true, category })}
                            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            title="Edit Category"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => deleteCategory(category.id)}
                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            title="Delete Category"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    );
  };

  // Mobile Menu Component
  const renderMobileMenu = () => mobileMenuOpen && (
    <div className="md:hidden fixed inset-0 z-50 bg-black bg-opacity-50">
      <div className="fixed right-0 top-0 h-full w-64 bg-white shadow-xl transform transition-transform duration-300">
        <div className="p-4 border-b">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-gray-800">Menu</h3>
            <button onClick={() => setMobileMenuOpen(false)}>
              <X className="w-6 h-6 text-gray-600" />
            </button>
          </div>
        </div>
        
        <div className="p-4 space-y-2">
          <button
            onClick={() => { setCurrentPage('products'); setMobileMenuOpen(false); }}
            className="w-full text-left px-4 py-3 rounded-lg hover:bg-gray-100 transition-colors"
          >
            Products
          </button>
          <button
            onClick={() => { setCurrentPage('categories'); setMobileMenuOpen(false); }}
            className="w-full text-left px-4 py-3 rounded-lg hover:bg-gray-100 transition-colors"
          >
            Categories
          </button>
          {user?.role?.toLowerCase() === 'admin' && (
            <button
              onClick={() => { setCurrentPage('admin'); setMobileMenuOpen(false); }}
              className="w-full text-left px-4 py-3 rounded-lg hover:bg-gray-100 transition-colors"
            >
              Admin Panel
            </button>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50">
      {renderNavigation()}
      {currentPage === 'products' && renderSearchBar()}
      {renderMobileMenu()}
      
      <main className="relative">
        {currentPage === 'products' && renderProducts()}
        {currentPage === 'categories' && renderCategories()}
        {currentPage === 'admin' && renderAdminPanel()}
      </main>

      {/* Modals */}
      <AuthModal
        isOpen={authModal.isOpen}
        mode={authModal.mode}
        onClose={() => setAuthModal({ isOpen: false, mode: 'login' })}
        onAuth={handleAuth}
      />

      {productModal.isOpen && (
        <AdminProductForm
          product={productModal.product}
          categories={categories}
          onSave={saveProduct}
          onCancel={() => setProductModal({ isOpen: false, product: null })}
        />
      )}

      {categoryModal.isOpen && (
        <AdminCategoryForm
          category={categoryModal.category}
          onSave={saveCategory}
          onCancel={() => setCategoryModal({ isOpen: false, category: null })}
        />
      )}

      {/* Notification */}
      {notification && (
        <Notification
          message={notification.message}
          type={notification.type}
          onClose={closeNotification}
        />
      )}

      {/* Cart Floating Button */}
      {user && cart.length > 0 && (
        <div className="fixed bottom-6 right-6 z-40">
          <button className="bg-gradient-to-r from-green-500 to-teal-600 text-white p-4 rounded-full shadow-2xl hover:from-green-600 hover:to-teal-700 transform hover:scale-110 transition-all duration-300 group">
            <div className="relative">
              <ShoppingCart className="w-6 h-6" />
              <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-bold">
                {cart.reduce((sum, item) => sum + item.quantity, 0)}
              </span>
            </div>
          </button>
        </div>
      )}

      {/* Background Animation */}
      <div className="fixed inset-0 -z-10 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-purple-300 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-blue-300 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse"></div>
        <div className="absolute top-40 left-1/2 w-80 h-80 bg-pink-300 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse"></div>
      </div>
    </div>
  );
};

export default EcommerceApp;