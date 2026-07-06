import api from './api';

export const authService = {
  /**
   * Verifies the active user session on the backend.
   * 
   * @param {string} token - The authorization bearer token.
   */
  getSession: (token) => {
    return api.get('/api/auth/session', {
      headers: { Authorization: `Bearer ${token}` }
    });
  },

  /**
   * Performs mock login to obtain a token for development.
   * 
   * @param {string} email 
   * @param {string} password 
   */
  loginMock: (email, password) => {
    return api.post('/api/auth/login-mock', { email, password });
  },

  /**
   * Fetches user profile settings.
   */
  getProfile: () => {
    return api.get('/api/study/profile');
  },

  /**
   * Updates user profile settings.
   * 
   * @param {Object} profileData 
   */
  updateProfile: (profileData) => {
    return api.put('/api/study/profile', profileData);
  }
};

export default authService;
