import React, { useRef, useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faChevronLeft, faChevronRight, faArrowLeftLong, faArrowRightLong } from "@fortawesome/free-solid-svg-icons";

const Tabs = ({
  tabs,
  activeTab,
  onTabChange,
  className = "",
  variant = "pc",
  catalog = false,
}) => {
  const { t, i18n } = useTranslation();
  const tabsRef = useRef(null);
  const currentLanguage = i18n.language;
  const activeIndex = tabs.findIndex(t => t.value === activeTab);
  // const canScrollLeft = activeIndex > 0;
  // const canScrollRight = activeIndex < tabs.length - 1;
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const checkScroll = () => {
    const el = tabsRef.current;
    if (!el) return;
    const threshold = 5;
    console.log("el.scrollLeft", el.scrollLeft)
    console.log("el.clientWidth", el.clientWidth)
    console.log("el.scrollWidth", el.scrollWidth)
    console.log("scrollLeft", el.scrollLeft > 0)
    console.log("scrollRight", el.scrollLeft + el.clientWidth < el.scrollWidth - threshold)
    i18n.language === "en" ? setCanScrollLeft(el.scrollLeft > 0) : setCanScrollRight(el.scrollLeft < 0);
    i18n.language === "en" ? setCanScrollRight(
      el.scrollLeft + el.clientWidth < el.scrollWidth - threshold
    ) : setCanScrollLeft(
      (-el.scrollLeft) + el.clientWidth < el.scrollWidth - threshold
    );
  };

  const scrollTabs = (direction) => {
    tabsRef.current?.scrollBy({
      left: direction === "left" ? -150 : 150,
      behavior: "smooth",
    });
  };

  useEffect(() => {
    const el = tabsRef.current;
    if (!el) return;

    requestAnimationFrame(checkScroll);

    el.addEventListener("scroll", checkScroll);
    window.addEventListener("resize", checkScroll);

    return () => {
      el.removeEventListener("scroll", checkScroll);
      window.removeEventListener("resize", checkScroll);
    };
  }, [tabs]);
  const moveTab = (direction) => {
    let nextIndex = activeIndex;

    if (direction === "left") {
      nextIndex = Math.max(0, activeIndex - 1);
    } else {
      nextIndex = Math.min(tabs.length - 1, activeIndex + 1);
    }

    const nextTab = tabs[nextIndex];
    if (!nextTab || nextTab.disabled) return;

    onTabChange(nextTab.value);
  };

  //   useEffect(() => {
  //   const container = tabsRef.current;
  //   if (!container) return;

  //   const activeButton = container.querySelector(".active");
  //   if (!activeButton) return;

  //   activeButton.scrollIntoView({
  //     behavior: "smooth",
  //     inline: "center",
  //     block: "nearest",
  //   });
  // }, [activeTab]);

  console.log("tabs", tabs);
  return (
    <div className={`tab-container ${className}`}>
      {/* {variant === "mobile" 
      && catalog &&
      canScrollLeft && 
      <div className="scroll-gradient left" />}
  {variant === "mobile" 
      && catalog &&
  canScrollRight && 
  <div className="scroll-gradient right" />}  */}
      {/* LEFT ARROW */}

      {
        variant === "mobile"
        && catalog &&
        canScrollLeft
        && (
          <button className="scroll-arrow left" onClick={() => scrollTabs("left")}>
            <FontAwesomeIcon icon={faChevronLeft} />
          </button>
        )}
      <div
        ref={tabsRef}
        className={`tabs ${catalog && variant === "pc" ? "category-tabs" : "category-tabs-mobile"
          } ${catalog ? "with-catalog" : "without-catalog"}`}
      >
        {tabs.map((tab) => (
          <button
            key={tab.value}
            className={`
              ${variant === "mobile" ? "category-tab-mobile" : "category-tab"}
              ${catalog ? "catalog" : ""}
              ${activeTab === tab.value ? "active" : ""}
              ${tab.disabled ? "disabled" : ""}
            `}
            onClick={() => onTabChange(tab.value)}
            title={tab.disabled ? "This tab is currently disabled" : ""}
          >
            {catalog && (
              <div
                className={`${variant === "mobile" ? "tab-image-mobile" : "tab-image"
                  }`}
              >
                <img
                  src={
                    currentLanguage == "ar" ? tab.imageUrlAR : tab.imageUrlEN
                  }
                  alt={t(tab.label)}
                />
              </div>
            )}
            {!catalog && (
              <span className="tab-text">{t(tab.label)}</span>
            )}
          </button>
        ))}
      </div>
      {/* RIGHT ARROW */}
      {
        variant === "mobile"
        && catalog &&
        canScrollRight
        && (
          <button
            className="scroll-arrow right"
            onClick={() => scrollTabs("right")}
          >
            <FontAwesomeIcon icon={faChevronRight} />
          </button>
        )}

      <style>{`
        .tabs {
          display: flex;
          gap: 10px;
          border-bottom: 2px solid #D9D9D6;
          overflow-x: auto;
          width: 100%;
          white-space: nowrap;
          box-sizing: border-box;
          scroll-behavior: smooth;
          background: #ffffff
        }

        .tabs::-webkit-scrollbar {
          display: none;
        }
        .tabs {
          scrollbar-width: none;
        }

        .tab-button {
          padding: 12px 24px;
          background: none;
          border: none;
          font-size: 1rem;
          color: #6D787D;
          cursor: pointer;
          transition: color 0.3s ease;
        }

        .tab-button.active {
          color: #00205B;
          border-bottom: 2px solid #00205B;
          font-weight: 600;
        }

        .tab-button:hover {
          color: #00205B;
        }

        /* PC catalog tabs - with images */
        .category-tabs.with-catalog {
          border-bottom: 1px solid #D9D9D6;
          height: 148px;
          display: flex;
          gap: 20px;
          white-space: nowrap;
        }

        /* Mobile catalog tabs - with images */
        .category-tabs-mobile.with-catalog {
          border-bottom: 1px solid #D9D9D6;
          height: 158px;
          display: flex;
          gap: 10px;
          white-space: nowrap;
        }

        /* Tabs without catalog - no images */
        .category-tabs.without-catalog,
        .category-tabs-mobile.without-catalog {
          border-bottom: 1px solid #D9D9D6;
          height: 48px;
          display: flex;
          gap: 2px;
          white-space: nowrap;
        }

        /* BASE BUTTONS */
        .category-tab,
        .category-tab-mobile {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          text-align: center;
          background: none;
          border: none;
          cursor: pointer;
          color: rgb(99, 107, 110);
          transition: all 0.3s ease;
          flex-shrink: 0;
        }

        /* With catalog (has images) - fixed width and smaller font */
        // .category-tab.catalog,
        // .category-tab-mobile.catalog {
        //   // width: 80px;
        //   // min-width: 80px;
        //   // max-width: 80px;
        //   // min-height: 80px;
        //   // max-height: 80px;
        //   padding: 4px;
        //   font-size: 0.55rem;
        //   font-weight: 600;
        //   justify-content: flex-start;
        // }

        /* Without catalog (no images) - auto width and larger font */
        .category-tab:not(.catalog) {
          width: auto;
          min-width: auto;
          max-width: none;
          padding: 12px 24px;
          min-height: 48px;
          height: 48px;
          font-size: 0.875rem;
          font-weight: 500;
          justify-content: center;
        }

        .category-tab-mobile:not(.catalog) {
          width: auto;
          min-width: auto;
          max-width: none;
          padding: 10px 20px;
          min-height: 48px;
          height: 48px;
          font-size: 0.8rem;
          font-weight: 500;
          justify-content: center;
        }

        .category-tab-mobile.catalog {
          font-size: 0.7rem;
        }

        /* Active states */
        .category-tab.active {
          color: #00205B;
          font-weight: 600;
          border-bottom: 2px solid #00205B;
         
        }

        .category-tab-mobile.active {
          color: #0b4c45;
          font-weight: 600;
        }

        /* Non-catalog active state */
        .category-tab:not(.catalog).active {
          border-bottom: 2px solid #00205B;
        }

        /* Hover effects */
        .category-tab:hover,
        .category-tab-mobile:hover {
          color: #00205B;
        }
.category-tab.active .tab-image,.category-tab-mobile.active.tab-image-mobile {
margin-bottom:10px;}
        /* FIXED SQUARE IMAGE AREAS */
        .tab-image,
        .tab-image-mobile {
          width: 140px;
          height: 140px;
          display: flex;
          align-items: center;
          justify-content: center;
          margin-bottom: 4px;
          overflow: hidden;
          transition: transform 0.2s ease;
        }

.tab-image  .active{
}
        .tab-image:hover{
        transform: scale(1.02);
        }
        .tab-image img,
        .tab-image-mobile img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          display: block;
          border-radius: 6px;
        }

        .category-tab.active .tab-image {
          // border: 2px solid #00205B;
          border-radius: 8px;
        }

        .category-tab-mobile.active .tab-image-mobile {
          border: 2px solid #0b4c45;
          border-radius: 8px;
        }

        /* TEXT STYLING */
        .tab-text {
          line-height: 1.2;
          text-wrap: auto;
        }

        /* Text for catalog mode - 2 line clamp */
        .catalog .tab-text {
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
          text-overflow: ellipsis;
          max-height: calc(1.2em * 2);
        }

        /* Text for non-catalog mode - single line */
        .category-tab:not(.catalog) .tab-text,
        .category-tab-mobile:not(.catalog) .tab-text {
          display: block;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        /* Disabled state */
        .tab-button.disabled,
        .category-tab.disabled {
          opacity: 0.5;
          cursor: not-allowed;
          color: #999;
        }

        .tab-button.disabled:hover,
        .category-tab.disabled:hover {
          color: #999;
        }

        @media (max-width: 768px) {
          .tabs {
            width: 100%;
            justify-content: flex-start;
            display: flex;
            gap: 10px;
          }

          /* Adjust height for mobile without catalog */
          .category-tabs-mobile.without-catalog {
            height: 44px;
          }

          .tab-button {
            width: 100%;
            padding: 8px 16px;
            font-size: 0.9rem;
            color: #6D787D;
            cursor: pointer;
            transition: color 0.3s ease;
          }

          .category-tab-mobile.catalog {
            padding: 4px;
            font-size: 0.7rem;
            border-radius: 4px;
          }

          .category-tabs-mobile.with-catalog {
            border-bottom: none;
          }

          .category-tab-mobile.catalog .tab-text {
            font-size: 0.55rem;
            font-weight: 600;
          }

          .category-tab-mobile:not(.catalog) {
            min-height: 44px;
            height: 44px;
            padding: 8px 16px;
            font-size: 0.75rem;
          }
        }
          @media (max-width: 768px) {
          .scroll-arrow {
            position: absolute;
            top: 30%;
            // transform: translateY(-50%);
            z-index: 10;
            background: #99aaaab8;
            border: 1px solid #ccc;
            width: 25px;
            height: 25px;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 12px;
            cursor: pointer;
          }

          .scroll-arrow.left {
            left: 1px;
          }

          .scroll-arrow.right {
            right: 2px;
          }
        }
.scroll-gradient {
  position: absolute;
  top: 0;
  height: 100%;
  width: 36px;
  z-index: 6;
  pointer-events: none; /* IMPORTANT */
}

.scroll-gradient.left {
  left: 0;
  background: linear-gradient(
    90deg, #b9dcee, transparent
  );
  border-radius: 5px;
}

.scroll-gradient.right {
  right: 0;
  background: linear-gradient(
    -90deg, #b9dcee, transparent
  );
  border-radius: 5px;
}
  @media (max-width: 768px) {
  .scroll-gradient {
    display: block;
  }
}
  .tab-container {
  position: relative;
  width: 100%;
  overflow: hidden;
}
  @media (max-width:500px){

    .tabs {
        justify-content:flex-start;
        max-height: 100px;
    }

  .category-tabs.with-catalog {
          border-bottom: 1px solid #D9D9D6;
          height: 80px !important;
          display: flex;
          gap: 20px;
          white-space: nowrap;
        }
          .tab-image, .tab-image-mobile {
          width: 80px;
          height: 80px;
          object-fit: fill;
          object-position: center;
        }
        .category-tab-mobile.disabled {
            filter: grayscale(100%);
            opacity: 0.6;
            cursor: not-allowed;
          }

        .category-tab-mobile.disabled:hover {
          filter: grayscale(100%);
          opacity: 0.6;
            cursor: not-allowed;
          }
        }
      }
      `}</style>
    </div>
  );
};

export default Tabs;
