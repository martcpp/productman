import { ShoppingCart, LogOut, Menu } from 'lucide-react';

const Navigation = ({ 
  user, 
  currentPage, 
  setCurrentPage, 
  handleLogout, 
  setAuthModal, 
  cart, 
  setMobileMenuOpen 
}) => (
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
              onClick={() => setCurrentPage('categories')}
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
            onClick={() => setMobileMenuOpen(true)}
            className="md:hidden text-gray-600"
          >
            <Menu className="w-6 h-6" />
          </button>
        </div>
      </div>
    </div>
  </nav>
);

export default Navigation;
