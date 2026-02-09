/**
 * Product Detail Page
 * Display product info, image gallery, and add to cart
 */
import { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { Carousel } from 'react-bootstrap';
import { ShoppingCart, Heart, Package, Truck, Shield } from 'lucide-react';
import { motion } from 'framer-motion';
import { productsAPI } from '../services/api';
import { useCart } from '../context/CartContext';
import Button from '../components/ui/Button';
import Skeleton from '../components/ui/Skeleton';
import toast from 'react-hot-toast';

const ProductDetail = () => {
    const { id } = useParams();
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const { addToCart } = useCart();

    const [product, setProduct] = useState(null);
    const [loading, setLoading] = useState(true);
    const [selectedImage, setSelectedImage] = useState(0);
    const [selectedSize, setSelectedSize] = useState('');
    const [selectedColor, setSelectedColor] = useState('');
    const [selectedVariant, setSelectedVariant] = useState(null);
    const [quantity, setQuantity] = useState(1);

    const variantIdParam = searchParams.get('variant');

    useEffect(() => {
        const loadProduct = async () => {
            setLoading(true);
            try {
                const response = await productsAPI.getById(id);
                const fetchedProduct = response.data;
                setProduct(fetchedProduct);

                // Handle variant pre-selection
                if (fetchedProduct.color_variants && fetchedProduct.color_variants.length > 0) {
                    let initialVariant = null;

                    if (variantIdParam) {
                        initialVariant = fetchedProduct.color_variants.find(v => v.id === parseInt(variantIdParam));
                    }

                    if (!initialVariant) {
                        // Select first active variant by default
                        initialVariant = fetchedProduct.color_variants.find(v => v.is_active) || fetchedProduct.color_variants[0];
                    }

                    setSelectedVariant(initialVariant);
                    setSelectedColor(initialVariant.color_name);
                } else {
                    // Fallback to old color system
                    const colors = fetchedProduct.colors?.split(',').map(c => c.trim()) || [];
                    if (colors.length > 0) setSelectedColor(colors[0]);
                }

                // Set default size
                const sizes = fetchedProduct.sizes?.split(',').map(s => s.trim()) || [];
                if (sizes.length > 0) setSelectedSize(sizes[0]);
            } catch (error) {
                console.error('Failed to load product:', error);
                toast.error('Product not found');
                navigate('/');
            } finally {
                setLoading(false);
            }
        };

        loadProduct();
    }, [id, navigate, variantIdParam]);

    // Update selected variant when color changes
    useEffect(() => {
        if (product?.color_variants && selectedColor) {
            const variant = product.color_variants.find(v => v.color_name === selectedColor);
            if (variant) {
                setSelectedVariant(variant);
                setSelectedImage(0); // Reset to first image of the variant
            }
        }
    }, [selectedColor, product]);

    const handleAddToCart = () => {
        if (!product) return;

        // Create a cart item with variant information
        const cartProduct = {
            ...product,
            selectedVariantId: selectedVariant?.id,
            selectedVariantStock: selectedVariant?.stock
        };

        addToCart(cartProduct, quantity, selectedSize, selectedColor);
    };

    const handleBuyNow = () => {
        handleAddToCart();
        navigate('/checkout');
    };

    if (loading) {
        return (
            <div className="container py-8">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    <Skeleton variant="card" className="h-96" />
                    <div className="space-y-4">
                        <Skeleton className="h-8 w-3/4" />
                        <Skeleton className="h-6 w-1/2" />
                        <Skeleton className="h-20" />
                        <Skeleton className="h-12 w-1/3" />
                    </div>
                </div>
            </div>
        );
    }

    if (!product) return null;

    const price = product.discounted_price || product.original_price;
    const hasDiscount = product.discounted_price && product.discounted_price < product.original_price;
    const discount = hasDiscount
        ? Math.round(((product.original_price - product.discounted_price) / product.original_price) * 100)
        : 0;

    const sizes = product.sizes?.split(',').map(s => s.trim()) || [];

    // Get current images based on selected variant or fallback to product images
    const getCurrentImages = () => {
        if (selectedVariant && selectedVariant.images && selectedVariant.images.length > 0) {
            return selectedVariant.images;
        }
        // Fallback to base product images (those without variant_id)
        return product.images?.filter(img => !img.color_variant_id) || [];
    };

    const currentImages = getCurrentImages();
    const currentStock = selectedVariant ? selectedVariant.stock : product.stock;

    // Get color options - prefer variants over old color string
    const colorOptions = product.color_variants && product.color_variants.length > 0
        ? product.color_variants.filter(v => v.is_active)
        : (product.colors?.split(',').map(c => ({ color_name: c.trim() })) || []);

    return (
        <div className="container py-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                {/* Image Gallery */}
                <div className="product-carousel-container">
                    <Carousel
                        interval={null}
                        indicators={currentImages.length > 1}
                        controls={currentImages.length > 1}
                        activeIndex={selectedImage}
                        onSelect={(index) => setSelectedImage(index)}
                        className="bg-gray-100 rounded-2xl overflow-hidden mb-4 shadow-sm"
                    >
                        {currentImages.map((image, index) => (
                            <Carousel.Item key={index} className="h-[500px]">
                                <img
                                    src={
                                        image.image_url?.startsWith('http')
                                            ? image.image_url
                                            : `http://localhost:8000${image.image_url || '/placeholder.jpg'}`
                                    }
                                    alt={`${product.name} ${index + 1}`}
                                    className="w-full h-full object-contain"
                                    onError={(e) => {
                                        e.target.src = 'https://via.placeholder.com/600x400?text=Product+Image';
                                    }}
                                />
                            </Carousel.Item>
                        ))}
                    </Carousel>

                    {/* Thumbnails */}
                    {currentImages.length > 1 && (
                        <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
                            {currentImages.map((image, index) => (
                                <button
                                    key={index}
                                    onClick={() => setSelectedImage(index)}
                                    className={`rounded-lg overflow-hidden border-2 transition-all h-20 ${selectedImage === index
                                        ? 'border-primary-600 ring-2 ring-primary-200'
                                        : 'border-gray-200 hover:border-gray-300'
                                        }`}
                                >
                                    <img
                                        src={
                                            image.image_url?.startsWith('http')
                                                ? image.image_url
                                                : `http://localhost:8000${image.image_url}`
                                        }
                                        alt={`${product.name} thumb ${index + 1}`}
                                        className="w-full h-full object-cover"
                                    />
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                {/* Product Info */}
                <div className="space-y-6">
                    {/* Category */}
                    {product.category && (
                        <span className="badge-category inline-block mb-2">
                            {product.category.name}
                        </span>
                    )}

                    {/* Title */}
                    <h1 className="text-5xl font-display font-black text-gray-900 tracking-tight leading-tight">
                        {product.name}
                    </h1>

                    {/* Price */}
                    <div className="flex items-baseline gap-4 mb-6">
                        <span className="text-4xl font-bold text-gray-900">₹{price.toFixed(2)}</span>
                        {hasDiscount && (
                            <>
                                <span className="text-2xl text-gray-400 line-through decoration-2 decoration-gray-400 opacity-70">
                                    ₹{product.original_price.toFixed(2)}
                                </span>
                                <span className="bg-red-600 text-white px-3 py-1 rounded-full font-semibold text-sm">
                                    {discount}% OFF
                                </span>
                            </>
                        )}
                    </div>

                    {/* Description */}
                    <p className="text-gray-700 text-lg mb-6 leading-relaxed">
                        {product.description || product.short_description}
                    </p>

                    {/* Size Selection */}
                    {sizes.length > 0 && (
                        <div className="mb-6">
                            <h3 className="font-semibold text-gray-900 mb-3">Select Size</h3>
                            <div className="flex gap-2 flex-wrap">
                                {sizes.map((size) => (
                                    <button
                                        key={size}
                                        onClick={() => setSelectedSize(size)}
                                        className={`px-6 py-2 rounded-lg border-2 font-medium transition-all ${selectedSize === size
                                            ? 'border-primary-600 bg-primary-50 text-primary-600'
                                            : 'border-gray-300 hover:border-gray-400'
                                            }`}
                                    >
                                        {size}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Color Selection */}
                    {colorOptions.length > 0 && (
                        <div className="mb-6">
                            <h3 className="font-semibold text-gray-900 mb-3">Select Color</h3>
                            <div className="flex gap-3 flex-wrap">
                                {colorOptions.map((colorOption) => (
                                    <button
                                        key={colorOption.color_name}
                                        onClick={() => setSelectedColor(colorOption.color_name)}
                                        className={`flex items-center gap-2 px-4 py-2 rounded-lg border-2 font-medium transition-all ${selectedColor === colorOption.color_name
                                            ? 'border-primary-600 bg-primary-50 text-primary-600 ring-2 ring-primary-200'
                                            : 'border-gray-300 hover:border-gray-400'
                                            }`}
                                    >
                                        {colorOption.color_code && (
                                            <div
                                                className="w-5 h-5 rounded-full border-2 border-gray-300"
                                                style={{ backgroundColor: colorOption.color_code }}
                                            />
                                        )}
                                        <span>{colorOption.color_name}</span>
                                        {colorOption.stock !== undefined && (
                                            <span className="text-xs text-gray-500">({colorOption.stock} left)</span>
                                        )}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Quantity */}
                    <div className="mb-6">
                        <h3 className="font-semibold text-gray-900 mb-3">Quantity</h3>
                        <div className="flex items-center gap-4">
                            <div className="flex items-center border-2 border-gray-300 rounded-lg">
                                <button
                                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                                    className="px-4 py-2 hover:bg-gray-100"
                                >
                                    -
                                </button>
                                <span className="px-6 py-2 font-semibold">{quantity}</span>
                                <button
                                    onClick={() => setQuantity(quantity + 1)}
                                    className="px-4 py-2 hover:bg-gray-100"
                                >
                                    +
                                </button>
                            </div>
                            <p className="text-gray-600">
                                {currentStock} items available
                            </p>
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-4 mb-8">
                        <Button
                            variant="primary"
                            size="lg"
                            className="flex-1"
                            icon={ShoppingCart}
                            onClick={handleAddToCart}
                            disabled={currentStock === 0}
                        >
                            Add to Cart
                        </Button>
                        <Button
                            variant="outline"
                            size="lg"
                            className="flex-1"
                            onClick={handleBuyNow}
                            disabled={currentStock === 0}
                        >
                            Buy Now
                        </Button>
                        <button className="p-3 border-2 border-gray-300 rounded-lg hover:border-red-500 hover:text-red-500 transition-colors">
                            <Heart size={24} />
                        </button>
                    </div>

                    {/* Features */}
                    <div className="grid grid-cols-3 gap-4 mb-8 p-6 bg-gray-50 rounded-xl">
                        <div className="text-center">
                            <Package className="mx-auto mb-2 text-primary-600" size={32} />
                            <p className="text-sm font-medium text-gray-700">Easy Returns</p>
                        </div>
                        <div className="text-center">
                            <Truck className="mx-auto mb-2 text-primary-600" size={32} />
                            <p className="text-sm font-medium text-gray-700">Minimum Shipping</p>
                        </div>
                        <div className="text-center">
                            <Shield className="mx-auto mb-2 text-primary-600" size={32} />
                            <p className="text-sm font-medium text-gray-700">Secure Payment</p>
                        </div>
                    </div>

                    {/* Product Details */}
                    {product.material && (
                        <div className="border-t border-gray-200 pt-6">
                            <h3 className="font-semibold text-gray-900 mb-3">Product Details</h3>
                            <div className="space-y-2 text-gray-700">
                                <p><span className="font-medium">Material:</span> {product.material}</p>
                                {product.sku && <p><span className="font-medium">SKU:</span> {product.sku}</p>}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ProductDetail;
