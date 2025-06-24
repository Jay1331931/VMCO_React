/**
 * Formats date strings to various formats
 * @param {string} isoDateString - Date string in ISO format (e.g., '2025-04-01T10:00:00Z')
 * @param {string} format - Output format ('YYYY-MM-DD HH:MM' by default, can be 'DD MMM YYYY', etc.)
 * @returns {string} Formatted date string according to the specified format
 */
export const formatDate = (isoDateString, format = 'YYYY-MM-DD HH:MM') => {
  if (!isoDateString) return '';
  
  const date = new Date(isoDateString);
  
  // Check if date is valid
  if (isNaN(date.getTime())) return '';
  
  // Get date components
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  
  // Month names for MMM format
  const monthNames = [
    'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
    'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
  ];
  
  // Format mapping
  switch (format) {
    case 'YYYY-MM-DD':
      return `${year}-${month}-${day}`;

    case 'YYYY-MM-DD HH:MM':
      return `${year}-${month}-${day} ${hours}:${minutes}`;
    
    case 'DD MMM YYYY':
      return `${day} ${monthNames[date.getMonth()]} ${year}`;
    
    case 'DD MMM YYYY HH:MM':
      return `${day} ${monthNames[date.getMonth()]} ${year} ${hours}:${minutes}`;
      case 'MM/DD/YYYY':
      return `${month}/${day}/${year}`;
    
    case 'DD/MM/YYYY':
      return `${day}/${month}/${year}`;
    
    case 'YYYY/MM/DD':
      return `${year}/${month}/${day}`;
    
    case 'HH:MM DD/MM/YYYY':
      return `${hours}:${minutes} ${day}/${month}/${year}`;
    
    default:
      // For unknown formats, return the default format
      return `${year}-${month}-${day} ${hours}:${minutes}`;
  }
};

export default formatDate;