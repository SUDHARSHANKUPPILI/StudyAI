import api from './api';

export const studyService = {
  /**
   * Retrieves all study materials uploaded by the user.
   */
  getMaterials: () => {
    return api.get('/api/study/materials');
  },

  /**
   * Handles uploading a document to the server.
   * 
   * @param {FormData} formData - Multipart data containing files.
   * @param {Object} config - Optional Axios request config (e.g. progress bar).
   */
  uploadDocument: (formData, config = {}) => {
    const headers = {
      ...(config.headers || {}),
      'Content-Type': 'multipart/form-data'
    };
    return api.post('/api/uploads/document', formData, { ...config, headers });
  }
};

export default studyService;
