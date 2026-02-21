import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { productsAPI } from '../services/api';
import { useCart } from '../context/CartContext';
import toast from 'react-hot-toast';
import CONFIG from '../config';

const ProductDetails = () => {
    const { id } = useParams();
    const [product, setProduct] = useState(null);
    const [loading, setLoading] = useState(true);
    const [selectedSize, setSelectedSize] = useState('');
    const [selectedColor, setSelectedColor] = useState('');
    const { addToCart } = useCart();

    useEffect(() => {
        const fetchProduct = async () => {
            try {
                const res = await productsAPI.getById(id);
                setProduct(res.data);
                // Default selections
                if (res.data.sizes && res.data.sizes.length > 0) setSelectedSize(res.data.sizes[0]);
                if (res.data.colors && res.data.colors.length > 0) setSelectedColor(res.data.colors[0]);
            } catch (err) {
                console.error("Error fetching product", err);
            } finally {
                setLoading(false);
            }
        };
        fetchProduct();
    }, [id]);

    const handleAddToCart = () => {
        addToCart(product, 1, selectedSize, selectedColor);
        toast.success("Added to Cart!");
    };

    if (loading) return <div className="container" style={{ padding: '2rem' }}>Loading...</div>;
    if (!product) return <div className="container" style={{ padding: '2rem' }}>Product not found</div>;

    const imageUrl = product.images?.[0]?.image_url || '/placeholder.jpg';
    const finalImage = imageUrl.startsWith('http') ? imageUrl : `${CONFIG.IMAGE_BASE_URL}${imageUrl}`;

    return (
        <div className="container" style={{ padding: '2rem 1rem' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }} className="product-layout">
                {/* Responsive Layout handled by CSS Grid ideally, doing manual style for now */}
                {/* Better to use className grid from index.css logic, let's make it grid-cols-2 on desktop */}
                <div className="grid grid-cols-1 grid-cols-2" style={{ alignItems: 'start' }}>

                    {/* Image Section */}
                    <div style={{ background: '#f9f9f9', borderRadius: '8px', overflow: 'hidden' }}>
                        <img
                            src={finalImage}
                            alt={product.name}
                            style={{ width: '100%', height: 'auto', objectFit: 'contain', maxHeight: '500px' }}
                            onError={(e) => {
                                e.target.src = 'https://via.placeholder.com/600?text=Product+Image';
                            }}
                        />
                        <div style={{ display: 'flex', gap: '0.5rem', padding: '1rem', overflowX: 'auto' }}>
                            {/* Thumbnails logic would go here */}
                        </div>
                    </div>

                    {/* Details Section */}
                    <div>
                        <h1 style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>{product.name}</h1>
                        <p style={{ color: '#666', marginBottom: '1rem' }}>{product.subcategory}</p>

                        <div style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '1.5rem', color: 'var(--primary)' }}>
                            ₹{product.discounted_price || product.original_price}
                            {product.discounted_price > 0 && product.discounted_price < product.original_price && (
                                <span style={{ textDecoration: 'line-through', color: '#999', fontSize: '1rem', marginLeft: '1rem', fontWeight: 'normal' }}>
                                    ₹{product.original_price}
                                </span>
                            )}
                        </div>

                        <p style={{ lineHeight: '1.6', marginBottom: '2rem' }}>{product.description}</p>

                        {/* Size Selector */}
                        {product.sizes && product.sizes.length > 0 && (
                            <div style={{ marginBottom: '1.5rem' }}>
                                <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '0.5rem' }}>Size</label>
                                <div style={{ display: 'flex', gap: '0.5rem' }}>
                                    {product.sizes.map(size => (
                                        <button
                                            key={size}
                                            onClick={() => setSelectedSize(size)}
                                            style={{
                                                padding: '0.5rem 1rem',
                                                border: selectedSize === size ? '2px solid var(--primary)' : '1px solid #ddd',
                                                background: 'white',
                                                cursor: 'pointer',
                                                borderRadius: '4px'
                                            }}
                                        >
                                            {size}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Color Selector */}
                        {product.colors && product.colors.length > 0 && (
                            <div style={{ marginBottom: '2rem' }}>
                                <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '0.5rem' }}>Color</label>
                                <div style={{ display: 'flex', gap: '0.5rem' }}>
                                    {product.colors.map(color => (
                                        <button
                                            key={color}
                                            onClick={() => setSelectedColor(color)}
                                            style={{
                                                padding: '0.5rem 1rem',
                                                border: selectedColor === color ? '2px solid var(--primary)' : '1px solid #ddd',
                                                background: 'white',
                                                cursor: 'pointer',
                                                borderRadius: '4px'
                                            }}
                                        >
                                            {color}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}

                        <button
                            className="btn btn-primary"
                            style={{ width: '100%', padding: '1rem' }}
                            onClick={handleAddToCart}
                        >
                            Add to Cart
                        </button>

                        <div style={{ marginTop: '2rem', fontSize: '0.9rem', color: '#666' }}>
                            <p>Material: {product.material}</p>
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
};

export default ProductDetails;
