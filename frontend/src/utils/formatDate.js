/**
 * Formats an ISO date string into a localized short date string.
 * Falls back to 'recently' if invalid or missing.
 * 
 * @param {string} dateString - ISO date format string.
 */
export const formatDate = (dateString) => {
  if (!dateString) return 'recently';
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) {
      return 'recently';
    }
    return date.toLocaleDateString();
  } catch (e) {
    return 'recently';
  }
};
