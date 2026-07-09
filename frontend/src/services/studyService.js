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
  },

  /**
   * Deletes a study material by ID.
   * 
   * @param {string} materialId - ID of the study material to delete.
   */
  deleteMaterial: (materialId) => {
    return api.delete(`/api/study/materials/${materialId}`);
  }
};

export default studyService;
