import { Search, Filter } from 'lucide-react';

const SearchBar = ({ 
  searchTerm, 
  setSearchTerm, 
  filters, 
  setFilters, 
  categories, 
  onSearch 
}) => (
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
            onKeyPress={(e) => e.key === 'Enter' && onSearch()}
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
            onClick={onSearch}
            className="bg-gradient-to-r from-blue-500 to-purple-600 text-white px-6 py-3 rounded-xl hover:from-blue-600 hover:to-purple-700 transform hover:scale-105 transition-all duration-200 font-semibold"
          >
            <Filter className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  </div>
);

export default SearchBar;
