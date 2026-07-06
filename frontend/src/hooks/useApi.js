import { useState, useCallback } from 'react';
import { useToast } from '../context/ToastContext';

/**
 * Reusable React Hook to handle Axios API requests.
 * Manages loading states, error states, and routes errors directly to the Toast system.
 * 
 * @param {Function} apiFunc - Async function making the Axios call.
 * @param {string} successMessage - Optional toast message to show on success.
 */
export const useApi = (apiFunc, successMessage = null) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const { showToast } = useToast();

  const execute = useCallback(async (...args) => {
    setLoading(true);
    setError(null);
    try {
      const response = await apiFunc(...args);
      setData(response.data);
      if (successMessage) {
        showToast(successMessage, 'success');
      }
      return response.data;
    } catch (err) {
      const errorMsg = err.response?.data?.message || err.response?.data?.error || err.message || 'API request failed';
      setError(errorMsg);
      showToast(errorMsg, 'error');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [apiFunc, successMessage, showToast]);

  return { data, loading, error, execute, setData };
};
