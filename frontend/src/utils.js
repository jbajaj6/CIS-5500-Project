// Utility Functions for Disease Tracking App

/**
 * Format a number as per-capita rate
 * @param {number} value - The per-capita value
 * @param {number} decimals - Number of decimal places
 */
export function formatPerCapita(value, decimals = 6) {
  if (value == null || isNaN(value)) return 'N/A';
  return Number(value).toFixed(decimals);
}

/**
 * Format a number as cases per 100k
 * @param {number} value - The rate value
 * @param {number} decimals - Number of decimal places
 */
export function formatPer100k(value, decimals = 2) {
  if (value == null || isNaN(value)) return 'N/A';
  return Number(value).toFixed(decimals);
}

/**
 * Format a large number with commas
 * @param {number} value - The number to format
 */
export function formatNumber(value) {
  if (value == null || isNaN(value)) return 'N/A';
  return Number(value).toLocaleString('en-US');
}

/**
 * Format a percentage
 * @param {number} value - The percentage value (0-100)
 * @param {number} decimals - Number of decimal places
 */
export function formatPercent(value, decimals = 2) {
  if (value == null || isNaN(value)) return 'N/A';
  return `${Number(value).toFixed(decimals)}%`;
}

/**
 * Get a color based on a value and range (for heatmaps)
 * @param {number} value - The value to map
 * @param {number} min - Minimum value in range
 * @param {number} max - Maximum value in range
 * @param {string} colorScheme - Color scheme ('blue', 'red', 'green', 'purple')
 */
export function getColorForValue(value, min, max, colorScheme = 'blue') {
  if (value == null || isNaN(value)) return 'rgba(100, 100, 100, 0.3)';
  
  const normalized = (value - min) / (max - min);
  const intensity = Math.max(0.3, Math.min(1, normalized));
  
  const colorMaps = {
    blue: `rgba(79, 172, 254, ${intensity})`,
    red: `rgba(255, 8, 68, ${intensity})`,
    green: `rgba(0, 242, 254, ${intensity})`,
    purple: `rgba(102, 126, 234, ${intensity})`,
  };
  
  return colorMaps[colorScheme] || colorMaps.blue;
}

/**
 * Generate a year range array
 * @param {number} startYear
 * @param {number} endYear
 */
export function generateYearRange(startYear, endYear) {
  const years = [];
  for (let year = startYear; year <= endYear; year++) {
    years.push(year);
  }
  return years;
}

/**
 * Debounce function for search inputs
 * @param {Function} func - Function to debounce
 * @param {number} wait - Wait time in ms
 */
export function debounce(func, wait = 300) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

/**
 * Sort array by property
 * @param {Array} array - Array to sort
 * @param {string} property - Property to sort by
 * @param {string} direction - 'asc' or 'desc'
 */
export function sortBy(array, property, direction = 'asc') {
  return [...array].sort((a, b) => {
    const aVal = a[property];
    const bVal = b[property];
    
    if (aVal == null) return 1;
    if (bVal == null) return -1;
    
    const comparison = aVal < bVal ? -1 : aVal > bVal ? 1 : 0;
    return direction === 'asc' ? comparison : -comparison;
  });
}

/**
 * Calculate percentage change
 * @param {number} oldValue
 * @param {number} newValue
 */
export function percentChange(oldValue, newValue) {
  if (oldValue === 0 || oldValue == null) return null;
  return ((newValue - oldValue) / oldValue) * 100;
}

/**
 * Get trend indicator (up, down, stable)
 * @param {number} change - Percentage change
 */
export function getTrendIndicator(change) {
  if (change == null || isNaN(change)) return 'stable';
  if (change > 5) return 'up';
  if (change < -5) return 'down';
  return 'stable';
}

/**
 * Safely fetch data with error handling
 * @param {string} url - URL to fetch
 * @param {object} options - Fetch options
 */
export async function safeFetch(url, options = {}) {
  try {
    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Fetch error:', error);
    throw error;
  }
}

/**
 * Get top N items from array
 * @param {Array} array - Source array
 * @param {number} n - Number of items
 * @param {string} sortProperty - Property to sort by
 */
export function topN(array, n, sortProperty) {
  return sortBy(array, sortProperty, 'desc').slice(0, n);
}

/**
 * Get bottom N items from array
 * @param {Array} array - Source array
 * @param {number} n - Number of items
 * @param {string} sortProperty - Property to sort by
 */
export function bottomN(array, n, sortProperty) {
  return sortBy(array, sortProperty, 'asc').slice(0, n);
}

/**
 * Calculate basic statistics
 * @param {Array<number>} values - Array of numbers
 */
export function calculateStats(values) {
  const validValues = values.filter(v => v != null && !isNaN(v));
  
  if (validValues.length === 0) {
    return { mean: 0, median: 0, min: 0, max: 0, stdDev: 0 };
  }
  
  const sorted = [...validValues].sort((a, b) => a - b);
  const sum = validValues.reduce((a, b) => a + b, 0);
  const mean = sum / validValues.length;
  
  const variance = validValues.reduce((acc, val) => {
    return acc + Math.pow(val - mean, 2);
  }, 0) / validValues.length;
  
  const stdDev = Math.sqrt(variance);
  
  const median = validValues.length % 2 === 0
    ? (sorted[validValues.length / 2 - 1] + sorted[validValues.length / 2]) / 2
    : sorted[Math.floor(validValues.length / 2)];
  
  return {
    mean,
    median,
    min: sorted[0],
    max: sorted[sorted.length - 1],
    stdDev,
  };
}
