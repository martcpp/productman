import React, { useState } from 'react';
import { Upload } from 'lucide-react';
import { api, API_BASE_URL } from '../../services/api';

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

export default AdminProductForm;
