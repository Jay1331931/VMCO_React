/**
 * Converts a date to the specified timezone
 * @param {string|Date} dateInput - Date string or Date object
 * @param {string} timezone - Target timezone (e.g., 'Asia/Riyadh', 'America/New_York')
 * @param {string} format - Output format (same options as formatDate function)
 * @param {string} locale - Locale for formatting (e.g., 'en-US', 'ar-SA')
 * @returns {string} Formatted date string in the specified timezone
 */
export const convertToTimezone = (
  dateInput,
  timezone = "Asia/Riyadh",
  format = "YYYY-MM-DD HH:MM",
  locale = "en-US"
) => {
  if (!dateInput) return "";

  const date = new Date(dateInput);

  // Check if date is valid
  if (isNaN(date.getTime())) return "";

  // Convert to target timezone
  const dateInTimezone = new Date(
    date.toLocaleString("en-US", { timeZone: timezone })
  );

  // Get date components in the target timezone
  const year = dateInTimezone.getFullYear();
  const month = String(dateInTimezone.getMonth() + 1).padStart(2, "0");
  const day = String(dateInTimezone.getDate()).padStart(2, "0");
  const hours = String(dateInTimezone.getHours()).padStart(2, "0");
  const minutes = String(dateInTimezone.getMinutes()).padStart(2, "0");
  const seconds = String(dateInTimezone.getSeconds()).padStart(2, "0");

  // Month names for different locales
  const monthNamesEn = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
  ];

  const monthNamesAr = [
    "يناير",
    "فبراير",
    "مارس",
    "أبريل",
    "مايو",
    "يونيو",
    "يوليو",
    "أغسطس",
    "سبتمبر",
    "أكتوبر",
    "نوفمبر",
    "ديسمبر",
  ];

  const monthNames = locale.startsWith("ar") ? monthNamesAr : monthNamesEn;

  // Format mapping
  switch (format) {
    case "YYYY-MM-DD":
      return `${year}-${month}-${day}`;

    case "YYYY-MM-DD HH:MM":
      return `${year}-${month}-${day} ${hours}:${minutes}`;

    case "YYYY-MM-DD HH:MM:SS":
      return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;

    case "DD MMM YYYY":
      return `${day} ${monthNames[dateInTimezone.getMonth()]} ${year}`;

    case "DD MMM YYYY HH:MM":
      return `${day} ${
        monthNames[dateInTimezone.getMonth()]
      } ${year} ${hours}:${minutes}`;

    case "MM/DD/YYYY":
      return `${month}/${day}/${year}`;

    case "DD/MM/YYYY":
      return `${day}/${month}/${year}`;

    case "YYYY/MM/DD":
      return `${year}/${month}/${day}`;

    case "HH:MM DD/MM/YYYY":
      return `${hours}:${minutes} ${day}/${month}/${year}`;

    case "HH:MM":
      return `${hours}:${minutes}`;

    case "DD/MM/YYYY HH:MM":
      return `${day}/${month}/${year} ${hours}:${minutes}`;

    default:
      return `${year}-${month}-${day} ${hours}:${minutes}`;
  }
};

/**
 * Alternative function using Intl.DateTimeFormat for more robust timezone conversion
 * @param {string|Date} dateInput - Date string or Date object
 * @param {string} timezone - Target timezone (e.g., 'Asia/Riyadh', 'America/New_York')
 * @param {Object} options - Intl.DateTimeFormat options
 * @returns {string} Formatted date string in the specified timezone
 */
export const convertToTimezoneIntl = (
  dateInput,
  timezone = "Asia/Riyadh",
  options = {}
) => {
  if (!dateInput) return "";

  const date = new Date(dateInput);

  // Check if date is valid
  if (isNaN(date.getTime())) return "";

  // Default options
  const defaultOptions = {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZone: timezone,
  };

  // Merge with provided options
  const formatOptions = { ...defaultOptions, ...options };

  // Use Intl.DateTimeFormat for conversion
  return new Intl.DateTimeFormat("en-GB", formatOptions).format(date);
};

/**
 * Get timezone offset for a specific timezone
 * @param {string} timezone - Target timezone (e.g., 'Asia/Riyadh')
 * @param {string|Date} date - Date to get offset for (optional, defaults to now)
 * @returns {string} Timezone offset (e.g., '+03:00')
 */
export const getTimezoneOffset = (
  timezone = "Asia/Riyadh",
  date = new Date()
) => {
  const targetDate = new Date(date);

  if (isNaN(targetDate.getTime())) return "";

  // Get timezone offset in minutes
  const utc = targetDate.getTime() + targetDate.getTimezoneOffset() * 60000;
  const targetTime = new Date(
    utc + getTimezoneOffsetMinutes(timezone, targetDate) * 60000
  );

  const offsetMinutes = (targetTime.getTime() - utc) / 60000;
  const hours = Math.floor(Math.abs(offsetMinutes) / 60);
  const minutes = Math.abs(offsetMinutes) % 60;
  const sign = offsetMinutes >= 0 ? "+" : "-";

  return `${sign}${String(hours).padStart(2, "0")}:${String(minutes).padStart(
    2,
    "0"
  )}`;
};

/**
 * Helper function to get timezone offset in minutes
 */
const getTimezoneOffsetMinutes = (timezone, date) => {
  const a = new Date(date.toLocaleString("en-US", { timeZone: "UTC" }));
  const b = new Date(date.toLocaleString("en-US", { timeZone: timezone }));
  return (b.getTime() - a.getTime()) / 60000;
};

// Common timezone constants
export const TIMEZONES = {
  SAUDI_ARABIA: "Asia/Riyadh",
  UAE: "Asia/Dubai",
  KUWAIT: "Asia/Kuwait",
  QATAR: "Asia/Qatar",
  BAHRAIN: "Asia/Bahrain",
  OMAN: "Asia/Muscat",
  UTC: "UTC",
  EASTERN: "America/New_York",
  PACIFIC: "America/Los_Angeles",
  CENTRAL_EUROPE: "Europe/Berlin",
  LONDON: "Europe/London",
  TOKYO: "Asia/Tokyo",
};

export default convertToTimezone;
