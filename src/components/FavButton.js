import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { MdFavoriteBorder, MdFavorite } from "react-icons/md";
import usePlatform from "../utilities/platform";
const FavoritesButton = ({ initialState = false, onToggle = null,isPopup=null }) => {
    const [isFavorite, setIsFavorite] = useState(initialState);
     const { t, i18n } = useTranslation();
     const isMobile=usePlatform()
    // Update when initialState changes (for example when the product changes)
    useEffect(() => {
        setIsFavorite(initialState);
    }, [initialState]);
        const dir = i18n.dir();
    const isRTL = dir === 'rtl';
    const styles = {
        favoriteBtn: {
            position: 'absolute',
            top: '10px',
                 ...(isRTL ? { left: '10px' } : isMobile && isPopup ? {left: '10px' }:{ right: '10px'} ),
            background: 'transparent',
            border: 'none',
            cursor: 'pointer',
            zIndex: 10,  // Ensure high z-index
            display: 'flex',
            justifyContent: 'end',
            alignItems: 'center',
            padding: '5px',  // Slightly larger padding
            borderRadius: '50%',
            transition: 'transform 0.2s, background-color 0.2s',
            opacity: 1,  // Ensure it's fully visible
            visibility: 'visible',  // Explicitly set visibility
            ':hover': {
                transform: 'scale(1.1)',
                backgroundColor: 'rgba(255, 255, 255, 1)',
                boxShadow: '0 2px 4px rgba(0,0,0,0.1)',  // Add subtle shadow
            }
        },
        favoriteIcon: {
            fontSize: '24px',
            color: '#6c7584'
        },
        filled: {
            color: 'red'
        }
    };

    const handleToggleFavorite = (e) => {
        e.stopPropagation();
        const newState = !isFavorite;
        setIsFavorite(newState);
        
        if (onToggle) {
            onToggle(newState);
        }
    };

    return (
        <button 
            style={styles.favoriteBtn}
            onClick={handleToggleFavorite}
        >
            {isFavorite ? 
                <MdFavorite style={{...styles.favoriteIcon, ...styles.filled}} /> : 
                <MdFavoriteBorder style={styles.favoriteIcon} />
            }
        </button>
    );
};

export default FavoritesButton;