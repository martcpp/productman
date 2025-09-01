import { useState, useCallback } from 'react';
import { api } from '../services/api';

export const useProductSearch = (showNotification) => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState({ current_page: 1, total_pages: 1 });

  const searchProducts = useCallback(async (searchTerm, filters, page = 1) => {
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
  }, [showNotification]);

  return {
    products,
    loading,
    pagination,
    searchProducts,
    setProducts
  };
};
