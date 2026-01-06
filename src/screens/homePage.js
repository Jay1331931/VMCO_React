import React, { useEffect, useRef } from "react";
import "../styles/home.css";
import Constants from "../constants";
import { useNavigate } from "react-router-dom";
import  Sidebar from "../components/Sidebar"
import { useTranslation } from "react-i18next";
const initialCategories = [
  {
    value: Constants.ENTITY.SHC,
    entity: Constants.ENTITY.SHC,
    label: Constants.TAB_NAMES.SHC,
    imageUrl: Constants.TAB_IMAGES.SHC
  },
  {
    value: Constants.CATEGORY.VMCO_CONSUMABLES,
    entity: Constants.ENTITY.VMCO,
    label: Constants.TAB_NAMES.VMCO_CONSUMABLES,
    imageUrl: Constants.TAB_IMAGES.VMCO_CONSUMABLES
  },
  {
    value: Constants.ENTITY.GMTC,
    entity: Constants.ENTITY.GMTC,
    label: Constants.TAB_NAMES.GMTC,
    imageUrl: Constants.TAB_IMAGES.GMTC
  },
  {
    value: Constants.ENTITY.NAQI,
    entity: Constants.ENTITY.NAQI,
    label: Constants.TAB_NAMES.NAQI,
    imageUrl: Constants.TAB_IMAGES.NAQI
  },
  {
    value: Constants.CATEGORY.VMCO_MACHINES,
    entity: Constants.ENTITY.VMCO,
    label: Constants.TAB_NAMES.VMCO_MACHINES,
    imageUrl: Constants.TAB_IMAGES.VMCO_MACHINES
  },
  {
    value: Constants.ENTITY.DAR,
    entity: Constants.ENTITY.DAR,
    label: Constants.TAB_NAMES.DAR,
    imageUrl: Constants.TAB_IMAGES.DAR
  },
  // {
  //   value: "SPECIAL_PRODUCTS",
  //   entity: "",
  //   label: "Special Products",
  //   imageUrl: Constants.TAB_IMAGES.SPECIAL_PRODUCTS
  // },
  // {
  //   value: "FAVORITES",
  //   entity: "",
  //   label: "Favorites",
  //   imageUrl: Constants.TAB_IMAGES.FAVORITES
  // },
];

const HomePage = () => {
    const navigate=useNavigate()
      const { t, i18n } = useTranslation();
        const isRTL = i18n.language === "ar";
    const getCategorySubtitle = (val) => {
    const subs = {
      [Constants.ENTITY.SHC]: "Bakery & Pastry",
      [Constants.CATEGORY.VMCO_CONSUMABLES]: "Vending Snacks",
      [Constants.ENTITY.GMTC]: "Fresh Fruits",
      [Constants.ENTITY.NAQI]: "Hygiene",
      [Constants.CATEGORY.VMCO_MACHINES]: "Vending Co.",
      [Constants.ENTITY.DAR]: "DAR Co.",
      SPECIAL_PRODUCTS: "Exclusive",
      FAVORITES: "Saved",
    };
    return subs[val] || "Supplies";
  };
  const handleNavigate =(entity)=>{
navigate(`/catalog/${entity}`)
  }
  return (
    <Sidebar>
    <div className="home-page-container">
      <div className="home-hero">
        <img src="https://file.aiquickdraw.com/imgcompressed/img/compressed_f12bfc31c5abcb70cc17f027dc2d5ac6.webp" className={`hero-side-img ${isRTL ? "right-hide":"left-hide" }`} alt="" />
        <div className="hero-content">
          <h1 className="catalog_header">
            {t("Get fresh groceries, vending-machine snacks & hygiene supplies delivered")}
          </h1>
        </div>
        <img src="https://file.aiquickdraw.com/imgcompressed/img/compressed_f9079acf433635e754c0ea1e584fc1cc.webp" className={`hero-side-img ${isRTL ? "left-hide" : "right-hide"}`}  alt="" />
      </div>

      <div className="categories-section">
        <div className="categories-grid">
          {initialCategories.map((cat, idx) => (
            <div key={idx} className="category-card" onClick={()=>handleNavigate(cat.value)}>
              <img src={cat.imageUrl} alt={cat.label} className="category-img" />
              <div className="category-overlay">
                <span className="cat-title">{cat.label}</span>
                
                <div className="card-subtitle">{cat.value}</div>
                <span className="cat-tag">Shop Now</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
    </Sidebar>
  );
};

export default HomePage;