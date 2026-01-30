import React, { useEffect, useState } from "react";
import "../styles/home.css";
import { useNavigate } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import { useTranslation } from "react-i18next";
import Constants from "../constants";
import InfoIcon from "@mui/icons-material/Info";
import StarIcon from "@mui/icons-material/Star";
import WindowIcon from "@mui/icons-material/Window";
import ThreeSixtyIcon from "@mui/icons-material/ThreeSixty";
import { useAuth } from "../context/AuthContext";
import SkeletonWrapper from "../components/SkeletonWrapper";
import { useLoading } from "../hooks/useLoading";
import Swal from "sweetalert2";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import { getTimeOnly } from "../utilities/convertUtcToTimeZone";
import timezone from "dayjs/plugin/timezone";
dayjs.extend(utc);
dayjs.extend(timezone);
const userTimezone = dayjs.tz.guess();
const BLOB_STORAGE_URL = process.env.REACT_APP_BLOB_STORAGE_URL;
// import { RotateCcw, Star, Grid, Info } from "lucide-react"; // Optional icon library
const initialCategories = [
  {
    value: Constants.ENTITY.SHC,
    entity: Constants.ENTITY.SHC,
    label: Constants.TAB_NAMES.SHC,
    imageUrlEN: `${BLOB_STORAGE_URL}/vmco-homeimages/SandwichesEN.png`,
    imageUrlAR: `${BLOB_STORAGE_URL}/vmco-homeimages/SandwichesAr.png`,
  },
  {
    value: Constants.CATEGORY.VMCO_CONSUMABLES,
    entity: Constants.ENTITY.VMCO,
    label: Constants.TAB_NAMES.VMCO_CONSUMABLES,
    imageUrlEN: `${BLOB_STORAGE_URL}/vmco-homeimages/FoodingredientsEn.png`,
    imageUrlAR: `${BLOB_STORAGE_URL}/vmco-homeimages/FoodingredientsAr.png`,
  },
  {
    value: Constants.ENTITY.GMTC,
    entity: Constants.ENTITY.GMTC,
    label: Constants.TAB_NAMES.GMTC,
    imageUrlEN: `${BLOB_STORAGE_URL}/vmco-homeimages/FreshVegetablesEN.png`,
    imageUrlAR: `${BLOB_STORAGE_URL}/vmco-homeimages/FreshVegetablesAr.png`,
  },
  {
    value: Constants.ENTITY.NAQI,
    entity: Constants.ENTITY.NAQI,
    label: Constants.TAB_NAMES.NAQI,
    imageUrlEN: `${BLOB_STORAGE_URL}/vmco-homeimages/HygieneChemicalsEN.png`,
    imageUrlAR: `${BLOB_STORAGE_URL}/vmco-homeimages/HygieneChemicalsAr.png`,
  },
  {
    value: Constants.CATEGORY.VMCO_MACHINES,
    entity: Constants.ENTITY.VMCO,
    label: Constants.TAB_NAMES.VMCO_MACHINES,
    imageUrlEN: `${BLOB_STORAGE_URL}/vmco-homeimages/MachinesEN.png`,
    imageUrlAR: `${BLOB_STORAGE_URL}/vmco-homeimages/MachinesAr.png`,
  },
  //   {
  //     value: Constants.ENTITY.DAR,
  //     entity: Constants.ENTITY.DAR,
  //     label: Constants.TAB_NAMES.DAR,
  //     imageUrlEN:`${BLOB_STORAGE_URL}/vmco-homeimages/SandwichesEN.png`,
  //     imageUrlAR:`${BLOB_STORAGE_URL}/vmco-homeimages/SandwichesAr.png`
  //  },
  {
    value: "SPECIAL_PRODUCTS",
    entity: "",
    label: "Special Products",
    imageUrlEN: `${BLOB_STORAGE_URL}/vmco-homeimages/SpeacialProductsEn.png`,
    imageUrlAR: `${BLOB_STORAGE_URL}/vmco-homeimages/SpeacialProductsAr.png`,
  },
  // {
  //   value: "FAVORITES",
  //   entity: "",
  //   label: "Favorites",
  //   imageUrl: Constants.TAB_IMAGES.FAVORITES
  // },
];
const API_BASE_URL = process.env.REACT_APP_API_BASE_URL;
const getEntityFromCategory = (categoryName) => {
  // Check if categoryName is null or undefined
  if (!categoryName) {
    return null;
  }

  // Just use the fallback logic which doesn't require cartItems
  const category = categoryName.toLowerCase();

  // Direct mapping from section to entity
  if (
    category.includes(Constants.ENTITY.VMCO.toLowerCase()) ||
    category.includes("vending machine company")
  ) {
    return Constants.ENTITY.VMCO;
  } else if (
    category.includes(Constants.ENTITY.SHC.toLowerCase()) ||
    category.includes("saudi hospitality company")
  ) {
    return Constants.ENTITY.SHC;
  } else if (
    category.includes(Constants.ENTITY.GMTC.toLowerCase()) ||
    category.includes("green mast factory ltd")
  ) {
    return Constants.ENTITY.GMTC;
  } else if (
    category.includes(Constants.ENTITY.NAQI.toLowerCase()) ||
    category.includes("naqi company")
  ) {
    return Constants.ENTITY.NAQI;
  } else if (
    category.includes(Constants.ENTITY.DAR.toLowerCase()) ||
    category.includes("dar company")
  ) {
    return Constants.ENTITY.DAR;
  }

  // If no match is found, return null or a default entity
  return null;
};
const HomePage = () => {
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const { token } = useAuth();
  const isRTL = i18n.language === "ar";
  const [coolingPeriodData, setCoolingPeriodData] = useState([]);
  const [disabledEntities, setDisabledEntities] = useState([]);
  const { loading, startLoading, stopLoading } = useLoading();
  const handleCatalog = () => {
    navigate("/catalog");
  };

  useEffect(() => {
    const fetchCoolingPeriod = async () => {
      if (!token) return;
      try {
        startLoading();
        const response = await fetch(`${API_BASE_URL}/cooling-period/now`, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        });

        if (response.ok) {
          const result = await response.json();
          if (result.status === "Ok" && Array.isArray(result.data)) {
            // Store full data for toTime access
            setCoolingPeriodData(result.data);

            // Extract entities for disabling logic
            const entities = [
              ...new Set(result.data.map((item) => item.entity)),
            ];
            console.log("entitiesentitiesentities", entities);
            setDisabledEntities(entities);
          }
        }
      } catch (error) {
        console.error("Error fetching cooling period:", error);
      } finally {
        stopLoading();
      }
    };

    fetchCoolingPeriod();
  }, [token, startLoading, stopLoading]);
  return (
    <Sidebar title={t("Home")} homePage={"home-page"}>
      <div className="home-page-container">
        <div className="home-hero">
          <div className="hero-content">
            <h1 className="catalog_header">
              {t("Order supplies quickly from your approved catalog")}
            </h1>
            <p className="catalog-subHeader">
              {t("Sandwiches, bakery, ingredients, fresh produce & more.")}
            </p>
          </div>
        </div>

        <div className="categories-section">
          <SkeletonWrapper loading={loading} type="home_card" count={7}>
            <div className="categories-grid">
              {initialCategories.map((cat, idx) => {
                const isDisabled = disabledEntities?.some(
                  (entity) => entity?.toLowerCase() === cat?.entity?.toLowerCase()
                );
                // const isDisabled = disabledEntities.includes(cat.value);
               const categoryEntity= getEntityFromCategory(cat?.entity?.toLowerCase())
                  const coolingInfo = isDisabled
                  ? coolingPeriodData.find((cp) => cp.entity === categoryEntity)
                  : null;

                return (
                  <div
                    key={idx}
                    className={`category-card ${
                      isDisabled ? "disabled-card" : ""
                    }`}
                    onClick={() => {
                                            if (isDisabled) {
                                              
                                              const todayUTC = new Date().toISOString().split("T")[0];
                                              const utcDateTime = `${todayUTC}T${coolingInfo?.toTime}Z`;
                      
                                              const timezone = userTimezone;
                                                  const localTime =getTimeOnly(utcDateTime,userTimezone,"HH:mm:ss")
                                              // const localTime = new Date(utcDateTime).toLocaleTimeString("en-IN", {
                                              //   timeZone: timezone,
                                              //   hour: "2-digit",
                                              //   minute: "2-digit",
                                              //   hour12: true,
                                              // });
                                              Swal.fire({
                                                icon: "warning",
                                                title: t("Ordering Window Closed"),
                                                text: `${t("Ordering window is closed.")} ${t(
                                                  "You may place an order after"
                                                )} ${localTime}`,
                                                confirmButtonText: t("OK"),
                                              });
                                            } else {
                                              navigate(`/catalog/${cat.value}`)
                                            }
                                          }}
                     
                    
                  >
                    <img
                      src={isRTL ? cat.imageUrlAR : cat.imageUrlEN}
                      alt={cat.label}
                      className="category-img"
                    />
                  </div>
                );
              })}
              {/* {initialCategories.map((cat, idx) => (
                <div key={idx} className="category-card" onClick={() => navigate(`/catalog/${cat.value}`)}>
                  <img src={isRTL ? cat.imageUrlAR : cat.imageUrlEN} alt={cat.label} className="category-img" />
                </div>
              ))} */}
            </div>
          </SkeletonWrapper>
        </div>
        {/* <div className="action-buttons-row">
            <button className="action-btn"><ThreeSixtyIcon size={18} /> {t("Reorder Last Order")}</button>
            <button className="action-btn"><StarIcon size={18} style={{ color: "#EF7C00" }} /> {t("My Frequent Items")}</button>
            <button className="action-btn" onClick={()=>handleCatalog()}><WindowIcon size={18} style={{ color: "#0B4C45" }} /> {t("Browse Full Catalog")}</button>
    
          </div> */}

        {/* Featured Section */}
        <div className="featured-section">
          {/* <h3 className="featured-title">{t("New & Featured Products")}</h3> */}
          {/* <div className="product-carousel">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="product-card-placeholder">
                  {t("Product Card")} {i === 5 && "→"}
                </div>
              ))}
            </div> */}

          <div className="delivery-note">
            <InfoIcon size={16} />
            {t(
              "Chilled & fresh items ordered before 12:00 PM qualify for next-day dispatch"
            )}
          </div>
        </div>
      </div>
    </Sidebar>
  );
};

export default HomePage;
