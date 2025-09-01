import React, { useState, useEffect } from 'react';
import { ShoppingCart, Package, Tag, Plus, Edit3, Trash2, BarChart3, X } from 'lucide-react';

// Components
import Navigation from './components/common/Navigation';
import SearchBar from './components/common/SearchBar';
import Notification from './components/common/Notification';
import AuthModal from './components/common/AuthModal';
import ProductCard from './components/common/ProductCard';
import CategoryCard from './components/common/CategoryCard';
import AdminProductForm from './components/admin/AdminProductForm';
import AdminCategoryForm from './components/admin/AdminCategoryForm';

// Services and Hooks
import { api, API_BASE_URL } from './services/api';
import { useProductSearch } from './hooks/useProductSearch';
import { useAdminData } from './hooks/useAdminData';

const EcommerceApp = () => {
  // User and App State
  const [user, setUser] = useState(null);
  const [currentPage, setCurrentPage] = useState('products');
  const [notification, setNotification] = useState(null);
  
  // Modal States
  const [authModal, setAuthModal] = useState({ isOpen: false, mode: 'login' });
  const [productModal, setProductModal] = useState({ isOpen: false, product: null });
  const [categoryModal, setCategoryModal] = useState({ isOpen: false, category: null });
  
  // UI States
  const [cart, setCart] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({
    category_id: '',
    min_price: '',
    max_price: '',
    in_stock: false
  });
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('products');

  // Custom Hooks
  const showNotification = (message, type = 'info') => {
    setNotification({ message, type });
  };

  const { products, loading, pagination, searchProducts } = useProductSearch(showNotification);
  const { 
    adminProducts, 
    categories, 
    loading: adminLoading, 
    loadAdminData, 
    deleteProduct, 
    deleteCategory 
  } = useAdminData(showNotification);

  // Initialize app
  useEffect(() => {
    const checkAuth = () => {
      const authData = JSON.parse(localStorage.getItem('auth') || '{}');
      if (authData.user) {
        setUser(authData.user);
      }
    };

    const loadInitialData = async () => {
      try {
        const categoriesData = await api.categories.list();
        // Categories are loaded in the admin hook, but we need them for search too
        // We'll sync this later
      } catch (error) {
        showNotification('Failed to load data', 'error');
      }
    };

    checkAuth();
    loadInitialData();
  }, []);

  // Load admin data when switching to admin page
  useEffect(() => {
    if (currentPage === 'admin' && user?.role?.toLowerCase() === 'admin') {
      loadAdminData(user);
    }
  }, [currentPage, user, loadAdminData]);

  // Trigger search when filters change or component loads
  useEffect(() => {
    if (currentPage === 'products') {
      searchProducts(searchTerm, filters, 1);
    }
  }, [searchProducts, currentPage, searchTerm, filters]);

  // Event Handlers
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
    await loadAdminData(user);
    showNotification('Product saved successfully!', 'success');
  };

  const saveCategory = async () => {
    setCategoryModal({ isOpen: false, category: null });
    await loadAdminData(user);
    showNotification('Category saved successfully!', 'success');
  };

  const handleDeleteProduct = async (productId) => {
    const success = await deleteProduct(productId);
    if (success) {
      await loadAdminData(user);
    }
  };

  const handleDeleteCategory = async (categoryId) => {
    const success = await deleteCategory(categoryId);
    if (success) {
      await loadAdminData(user);
    }
  };

  // Render Functions
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
                    onClick={() => searchProducts(searchTerm, filters, pagination.current_page - 1)}
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
                        onClick={() => searchProducts(searchTerm, filters, 1)}
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
                          onClick={() => searchProducts(searchTerm, filters, i)}
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
                        onClick={() => searchProducts(searchTerm, filters, totalPages)}
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
                    onClick={() => searchProducts(searchTerm, filters, pagination.current_page + 1)}
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

  const renderCategories = () => (
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
                setTimeout(() => searchProducts(searchTerm, { ...filters, category_id: categoryId }), 100);
              }}
            />
          ))}
        </div>
      )}
    </div>
  );

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
                          onClick={() => handleDeleteProduct(product.id)}
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
                            onClick={() => handleDeleteCategory(category.id)}
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
      <Navigation
        user={user}
        currentPage={currentPage}
        setCurrentPage={setCurrentPage}
        handleLogout={handleLogout}
        setAuthModal={setAuthModal}
        cart={cart}
        setMobileMenuOpen={setMobileMenuOpen}
      />
      
      {currentPage === 'products' && (
        <SearchBar
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
          filters={filters}
          setFilters={setFilters}
          categories={categories}
          onSearch={() => searchProducts(searchTerm, filters)}
        />
      )}
      
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
