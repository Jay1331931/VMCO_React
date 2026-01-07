import React from "react";
import "../styles/home.css";
import { useNavigate } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import { useTranslation } from "react-i18next";
import Constants from "../constants";
import InfoIcon from '@mui/icons-material/Info';
// import { RotateCcw, Star, Grid, Info } from "lucide-react"; // Optional icon library
const initialCategories = [
  {
    value: Constants.ENTITY.SHC,
    entity: Constants.ENTITY.SHC,
    label: Constants.TAB_NAMES.SHC,
    imageUrlEN:"https://vmcowebportal.blob.core.windows.net/vmco-homeimages/SandwichesEN.png",
    imageUrlAR:"https://vmcowebportal.blob.core.windows.net/vmco-homeimages/SandwichesAr.png"
  },
  {
    value: Constants.CATEGORY.VMCO_CONSUMABLES,
    entity: Constants.ENTITY.VMCO,
    label: Constants.TAB_NAMES.VMCO_CONSUMABLES,
    imageUrlEN: "https://vmcowebportal.blob.core.windows.net/vmco-homeimages/FoodingredientsEn.png",
    imageUrlAR:"https://vmcowebportal.blob.core.windows.net/vmco-homeimages/FoodingredientsAr.png"
  },
  {
    value: Constants.ENTITY.GMTC,
    entity: Constants.ENTITY.GMTC,
    label: Constants.TAB_NAMES.GMTC,
    imageUrlEN:"https://vmcowebportal.blob.core.windows.net/vmco-homeimages/FreshVegetablesEN.png",
    imageUrlAR:"https://vmcowebportal.blob.core.windows.net/vmco-homeimages/FreshVegetablesAr.png"
 },
  {
    value: Constants.ENTITY.NAQI,
    entity: Constants.ENTITY.NAQI,
    label: Constants.TAB_NAMES.NAQI,
     imageUrlEN:"https://vmcowebportal.blob.core.windows.net/vmco-homeimages/HygieneChemicalsEN.png",
    imageUrlAR:"https://vmcowebportal.blob.core.windows.net/vmco-homeimages/HygieneChemicalsAr.png"
 },
  {
    value: Constants.CATEGORY.VMCO_MACHINES,
    entity: Constants.ENTITY.VMCO,
    label: Constants.TAB_NAMES.VMCO_MACHINES,
     imageUrlEN:"https://vmcowebportal.blob.core.windows.net/vmco-homeimages/MachinesEN.png",
    imageUrlAR:"https://vmcowebportal.blob.core.windows.net/vmco-homeimages/MachinesAr.png"
},
//   {
//     value: Constants.ENTITY.DAR,
//     entity: Constants.ENTITY.DAR,
//     label: Constants.TAB_NAMES.DAR,
//     imageUrlEN:"https://vmcowebportal.blob.core.windows.net/vmco-homeimages/SandwichesEN.png",
//     imageUrlAR:"https://vmcowebportal.blob.core.windows.net/vmco-homeimages/SandwichesAr.png"
//  },
  {
    value: "SPECIAL_PRODUCTS",
    entity: "",
    label: "Special Products",
   imageUrlEN:"https://vmcowebportal.blob.core.windows.net/vmco-homeimages/SpeacialProductsEn.png",
    imageUrlAR:"https://vmcowebportal.blob.core.windows.net/vmco-homeimages/SpeacialProductsAr.png"
 },
  // {
  //   value: "FAVORITES",
  //   entity: "",
  //   label: "Favorites",
  //   imageUrl: Constants.TAB_IMAGES.FAVORITES
  // },
];
const HomePage = () => {
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === "ar";

  // ... (Keep your initialCategories array as is)

  return (
    <Sidebar>
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
          <div className="categories-grid">
            {initialCategories.map((cat, idx) => (
              <div key={idx} className="category-card" onClick={() => navigate(`/catalog/${cat.value}`)}>
                <img src={isRTL ? cat.imageUrlAR : cat.imageUrlEN} alt={cat.label} className="category-img" />
              </div>
            ))}
          </div>

          {/* Action Buttons Row */}
          {/* <div className="action-buttons-row">
            <button className="action-btn"><RotateCcw size={18} /> {t("Reorder Last Order")}</button>
            <button className="action-btn"><Star size={18} color="#EF7C00" /> {t("My Frequent Items")}</button>
            <button className="action-btn"><Grid size={18} /> {t("Browse Full Catalog")}</button>
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
              {t("Orders placed after 6:00 PM will be delivered next day")}
            </div>
          </div>
           
        </div>
      </div>
    </Sidebar>
  );
};

export default HomePage;