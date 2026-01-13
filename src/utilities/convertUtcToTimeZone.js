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
  is12Hour = false 
) => {
  if (!dateInput) return "";
  const format = is12Hour ? "hh:mm:ss A" : "HH:mm:ss";

  try {
    let dateObj;

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

    else if (
      dateInput.includes("-") &&
      dateInput.includes(":") &&
      !dateInput.includes(",")
    ) {
      const cleanDate = dateInput.split(".")[0];
      dateObj = dayjs.utc(cleanDate, "YYYY-MM-DD HH:mm:ss", true);

      if (dateObj.isValid()) {
        return dateObj.tz(zone).format(format);
      }
    }

    dateObj = dayjs(dateInput);

    if (dateObj.isValid()) {
      return dateObj.tz(zone).format(format);
    }

    return dateInput;
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
