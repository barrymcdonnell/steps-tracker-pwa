// utils.js
/**
 * Formats a Date object into YYYY-MM-DD string.
 * @param {Date} date - The date object.
 * @returns {string} The formatted date string.
 */
export function formatDate(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0'); // Months are 0-indexed
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}
