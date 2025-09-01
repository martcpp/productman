import { useState } from 'react';
import { api } from '../services/api';

export const useAdminData = (showNotification) => {
  const [adminProducts, setAdminProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);

  const loadAdminData = async (user) => {
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
      showNotification('Product deleted successfully!', 'success');
      return true;
    } catch (error) {
      showNotification('Failed to delete product', 'error');
      return false;
    }
  };

  const deleteCategory = async (categoryId) => {
    // Check if category has products
    const hasProducts = adminProducts.some(p => p.category_id === categoryId);
    if (hasProducts) {
      showNotification('Cannot delete category that contains products', 'error');
      return false;
    }

    if (!confirm('Are you sure you want to delete this category?')) return;
    
    try {
      await api.categories.delete(categoryId);
      showNotification('Category deleted successfully!', 'success');
      return true;
    } catch (error) {
      showNotification('Failed to delete category', 'error');
      return false;
    }
  };

  return {
    adminProducts,
    categories,
    loading,
    loadAdminData,
    deleteProduct,
    deleteCategory,
    setCategories,
    setAdminProducts
  };
};
