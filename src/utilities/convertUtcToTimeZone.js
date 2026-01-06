import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import timezone from "dayjs/plugin/timezone";
import customParseFormat from "dayjs/plugin/customParseFormat";

dayjs.extend(utc);
dayjs.extend(timezone);
dayjs.extend(customParseFormat);

export const getTimeOnly = (
  dateInput,
  zone = "Asia/Riyadh",
  format = "HH:mm:ss"
) => {
  if (!dateInput) return "";

  try {
    console.log("Processing:", dateInput); // Debug

    let dateObj;

    // Check format and parse accordingly:

    // 1. If it's already in Riyadh display format: "01/02/2026, 08:03:17"
    if (
      dateInput.includes("/") &&
      dateInput.includes(",") &&
      dateInput.includes(":")
    ) {
      // Remove comma and parse as MM/DD/YYYY HH:mm:ss (already in Riyadh time)
      const cleanDate = dateInput.replace(",", "");
      dateObj = dayjs(cleanDate, "MM/DD/YYYY HH:mm:ss", true);

      if (dateObj.isValid()) {
        // This is already in Riyadh time, just format it
        return dateObj.format(format);
      }
    }

    // 2. If it's database UTC format: "2026-01-02 05:03:17.724959"
    else if (
      dateInput.includes("-") &&
      dateInput.includes(":") &&
      !dateInput.includes(",")
    ) {
      // Remove milliseconds and parse as UTC
      const cleanDate = dateInput.split(".")[0];
      dateObj = dayjs.utc(cleanDate, "YYYY-MM-DD HH:mm:ss", true);

      if (dateObj.isValid()) {
        // Convert UTC to Riyadh
        const riyadhDate = dateObj.tz(zone);
        return riyadhDate.format(format);
      }
    }

    // 3. Default parsing
    dateObj = dayjs(dateInput);

    if (dateObj.isValid()) {
      // Assume it's in local time, convert to requested zone
      const zonedDate = dateObj.tz(zone);
      return zonedDate.format(format);
    }

    return dateInput; // Return original if can't parse
  } catch (error) {
    console.error("Date error:", error);
    return dateInput;
  }
};

export const getDateOnly = (
  dateInput,
  zone = "Asia/Riyadh",
  format = "DD/MM/YYYY"
) => {
  if (!dateInput) return "";

  try {
    let dateObj;

    // Riyadh display format
    if (
      dateInput.includes("/") &&
      dateInput.includes(",") &&
      dateInput.includes(":")
    ) {
      const cleanDate = dateInput.replace(",", "");
      dateObj = dayjs(cleanDate, "MM/DD/YYYY HH:mm:ss", true);

      if (dateObj.isValid()) {
        return dateObj.format(format);
      }
    }

    // Database UTC format
    else if (
      dateInput.includes("-") &&
      dateInput.includes(":") &&
      !dateInput.includes(",")
    ) {
      const cleanDate = dateInput.split(".")[0];
      dateObj = dayjs.utc(cleanDate, "YYYY-MM-DD HH:mm:ss", true);

      if (dateObj.isValid()) {
        const riyadhDate = dateObj.tz(zone);
        return riyadhDate.format(format);
      }
    }

    // Default
    dateObj = dayjs(dateInput);

    if (dateObj.isValid()) {
      const zonedDate = dateObj.tz(zone);
      return zonedDate.format(format);
    }

    return dateInput;
  } catch (error) {
    return dateInput;
  }
};
