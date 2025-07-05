import React, { useState } from 'react';
import { MdFavoriteBorder, MdFavorite } from "react-icons/md";

const FavoritesButton = ({ initialState = false, onToggle = null }) => {
    const [isFavorite, setIsFavorite] = useState(initialState);
    
    const styles = {
        favoriteBtn: {
            position: 'absolute',
            top: '10px',
            right: '10px',
            background: 'transparent',
            border: 'none',
            cursor: 'pointer',
            zIndex: 2,
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            padding: '5px',
            borderRadius: '50%',
            transition: 'background-color 0.2s'
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