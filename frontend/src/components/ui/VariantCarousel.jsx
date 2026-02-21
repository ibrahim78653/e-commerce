import React, { useState } from 'react';
import { Carousel } from 'react-bootstrap';
import CONFIG from '../../config';


const VariantCarousel = ({ variants = [], images = [], productName, onVariantChange }) => {
    const [index, setIndex] = useState(0);

    // Collect images
    let displayImages = [];

    if (variants && variants.length > 0) {
        variants.forEach(variant => {
            if (variant.show_in_carousel && variant.images) {
                variant.images.forEach(img => {
                    displayImages.push({
                        ...img,
                        variantInfo: variant
                    });
                });
            }
        });
    }

    // If no variant images, use base images
    if (displayImages.length === 0 && images && images.length > 0) {
        displayImages = images.map(img => ({
            ...img,
            variantInfo: null
        }));
    }

    const handleSelect = (selectedIndex) => {
        setIndex(selectedIndex);
        const selectedImg = displayImages[selectedIndex];
        if (selectedImg && onVariantChange && selectedImg.variantInfo) {
            onVariantChange(selectedImg.variantInfo);
        }
    };

    if (displayImages.length === 0) return null;

    return (
        <Carousel
            activeIndex={index}
            onSelect={handleSelect}
            interval={3000}
            pause="hover"
            fade
            className="w-full h-full"
            indicators={displayImages.length > 1}
            controls={displayImages.length > 1}
        >
            {displayImages.map((img, idx) => {
                const fullImageUrl = img.image_url.startsWith('http')
                    ? img.image_url
                    : `${CONFIG.IMAGE_BASE_URL}${img.image_url}`;

                return (
                    <Carousel.Item key={idx} className="h-64">
                        <img
                            className="d-block w-100 h-100 object-cover"
                            src={fullImageUrl}
                            alt={`${productName} ${img.variantInfo ? ` - ${img.variantInfo.color_name}` : ''}`}
                            onError={(e) => {
                                e.target.src = 'https://via.placeholder.com/400x300?text=Product+Image';
                            }}
                        />
                    </Carousel.Item>
                );
            })}
        </Carousel>
    );
};

export default VariantCarousel;
