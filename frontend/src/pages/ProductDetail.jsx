/**
 * Product Detail Page
 * Display product info, image gallery, add to cart, and similar products scroll
 */
import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, useSearchParams, Link } from 'react-router-dom';
import { Carousel } from 'react-bootstrap';
import {
    ShoppingCart, Heart, Package, Truck, Shield,
    ChevronLeft, ChevronRight, Star, ArrowRight
} from 'lucide-react';
import { motion } from 'framer-motion';
import { productsAPI } from '../services/api';
import { useCart } from '../context/CartContext';
import Button from '../components/ui/Button';
import Skeleton from '../components/ui/Skeleton';
import toast from 'react-hot-toast';
import CONFIG from '../config';

// ─── Similar Product Card ────────────────────────────────────────────────────
const SimilarProductCard = ({ product }) => {
    const navigate = useNavigate();
    const { addToCart } = useCart();

    const price = product.discounted_price || product.original_price;
    const hasDiscount = product.discounted_price && product.discounted_price < product.original_price;
    const discount = hasDiscount
        ? Math.round(((product.original_price - product.discounted_price) / product.original_price) * 100)
        : 0;

    // Get first available image
    const firstVariant = product.color_variants?.find(v => v.is_active && v.images?.length > 0);
    const firstImage = firstVariant?.images?.[0] || product.images?.find(img => !img.color_variant_id);
    const imageUrl = firstImage?.image_url?.startsWith('http')
        ? firstImage.image_url
        : firstImage?.image_url
            ? `${CONFIG.IMAGE_BASE_URL}${firstImage.image_url}`
            : CONFIG.PLACEHOLDER_URL;

    const handleAddToCart = (e) => {
        e.preventDefault();
        e.stopPropagation();
        addToCart(product, 1, '', '');
        toast.success(`${product.name} added to cart!`);
    };

    return (
        <motion.div
            whileHover={{ y: -4, shadow: 'lg' }}
            transition={{ duration: 0.2 }}
            className="flex-shrink-0 w-52 bg-white rounded-lg border border-gray-100 shadow-sm hover:shadow-lg transition-all cursor-pointer overflow-hidden group"
            onClick={() => navigate(`/product/${product.id}`)}
        >
            {/* Image */}
            <div className="relative h-52 bg-gray-50 overflow-hidden">
                <img
                    src={imageUrl}
                    alt={product.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-400"
                    onError={(e) => { e.target.src = CONFIG.PLACEHOLDER_URL; }}
                />
                {hasDiscount && (
                    <div className="absolute top-2 left-2 bg-red-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">
                        -{discount}%
                    </div>
                )}
                {product.stock === 0 && (
                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                        <span className="text-white font-bold text-xs bg-black/50 px-2 py-1 rounded">Out of Stock</span>
                    </div>
                )}
            </div>

            {/* Info */}
            <div className="p-3">
                {product.category && (
                    <p className="text-xs text-indigo-500 font-semibold mb-1">{product.category.name}</p>
                )}
                <h3 className="text-sm font-semibold text-gray-900 leading-snug mb-1 line-clamp-2">
                    {product.name}
                </h3>
                <div className="flex items-baseline gap-1.5 mb-3">
                    <span className="font-bold text-gray-900">₹{price.toFixed(2)}</span>
                    {hasDiscount && (
                        <span className="text-xs text-gray-400 line-through">₹{product.original_price.toFixed(2)}</span>
                    )}
                </div>
                <button
                    onClick={handleAddToCart}
                    disabled={product.stock === 0}
                    className="w-full flex items-center justify-center gap-1.5 py-2 px-3 bg-red-600 hover:bg-red-700 text-white text-xs font-semibold rounded-md transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
                >
                    <ShoppingCart size={13} />
                    Add to Cart
                </button>
            </div>
        </motion.div>
    );
};

// ─── Main Component ───────────────────────────────────────────────────────────
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

    // Similar products state
    const [similarProducts, setSimilarProducts] = useState([]);
    const [loadingSimilar, setLoadingSimilar] = useState(false);
    const scrollRef = useRef(null);

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
                        initialVariant = fetchedProduct.color_variants.find(v => v.is_active) || fetchedProduct.color_variants[0];
                    }
                    setSelectedVariant(initialVariant);
                    setSelectedColor(initialVariant.color_name);
                } else {
                    const colors = fetchedProduct.colors?.split(',').map(c => c.trim()) || [];
                    if (colors.length > 0) setSelectedColor(colors[0]);
                }

                const sizes = fetchedProduct.sizes?.split(',').map(s => s.trim()) || [];
                if (sizes.length > 0) setSelectedSize(sizes[0]);

                // Load similar products
                loadSimilarProducts(fetchedProduct);
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

    const loadSimilarProducts = async (currentProduct) => {
        setLoadingSimilar(true);
        try {
            const params = { page_size: 20 };
            if (currentProduct.category?.id) {
                params.category_id = currentProduct.category.id;
            }
            const res = await productsAPI.getAll(params);
            // API returns { items: [...], total, page, pages }
            const all = res.data?.items || [];
            // Exclude current product; shuffle and take up to 12
            const filtered = all
                .filter(p => p.id !== currentProduct.id)
                .sort(() => Math.random() - 0.5)
                .slice(0, 12);

            // If category returned fewer than 4, fall back to all products
            if (filtered.length < 4 && currentProduct.category?.id) {
                const fallback = await productsAPI.getAll({ page_size: 20 });
                const allProducts = fallback.data?.items || [];
                const fallbackFiltered = allProducts
                    .filter(p => p.id !== currentProduct.id)
                    .sort(() => Math.random() - 0.5)
                    .slice(0, 12);
                setSimilarProducts(fallbackFiltered);
            } else {
                setSimilarProducts(filtered);
            }
        } catch (err) {
            console.error('Failed to load similar products:', err);
        } finally {
            setLoadingSimilar(false);
        }
    };

    // Update selected variant when color changes
    useEffect(() => {
        if (product?.color_variants && selectedColor) {
            const variant = product.color_variants.find(v => v.color_name === selectedColor);
            if (variant) {
                setSelectedVariant(variant);
                setSelectedImage(0);
            }
        }
    }, [selectedColor, product]);

    const handleAddToCart = () => {
        if (!product) return;
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

    // Scroll similar products
    const scrollLeft = () => {
        scrollRef.current?.scrollBy({ left: -280, behavior: 'smooth' });
    };
    const scrollRight = () => {
        scrollRef.current?.scrollBy({ left: 280, behavior: 'smooth' });
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

    const getCurrentImages = () => {
        if (selectedVariant && selectedVariant.images && selectedVariant.images.length > 0) {
            return selectedVariant.images;
        }
        return product.images?.filter(img => !img.color_variant_id) || [];
    };

    const currentImages = getCurrentImages();
    const currentStock = selectedVariant ? selectedVariant.stock : product.stock;

    const colorOptions = product.color_variants && product.color_variants.length > 0
        ? product.color_variants.filter(v => v.is_active)
        : (product.colors?.split(',').map(c => ({ color_name: c.trim() })) || []);

    return (
        <div className="container py-8">
            {/* ── Main Product Detail ───────────────────────────────────── */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 mb-16">
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
                                            : `${CONFIG.IMAGE_BASE_URL}${image.image_url || '/placeholder.jpg'}`
                                    }
                                    alt={`${product.name} ${index + 1}`}
                                    className="w-full h-full object-contain"
                                    onError={(e) => { e.target.src = CONFIG.PLACEHOLDER_URL; }}
                                />
                            </Carousel.Item>
                        ))}
                    </Carousel>

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
                                                : `${CONFIG.IMAGE_BASE_URL}${image.image_url}`
                                        }
                                        alt={`${product.name} thumb ${index + 1}`}
                                        className="w-full h-full object-cover"
                                        onError={(e) => { e.target.src = CONFIG.PLACEHOLDER_URL; }}
                                    />
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                {/* Product Info */}
                <div className="space-y-6">
                    {product.category && (
                        <span className="badge-category inline-block mb-2">
                            {product.category.name}
                        </span>
                    )}

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
                                >-</button>
                                <span className="px-6 py-2 font-semibold">{quantity}</span>
                                <button
                                    onClick={() => setQuantity(quantity + 1)}
                                    className="px-4 py-2 hover:bg-gray-100"
                                >+</button>
                            </div>
                            <p className="text-gray-600">{currentStock} items available</p>
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-4 mb-8">
                        <Button
                            variant="danger"
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

            {/* ── Similar / You May Also Like Section ─────────────────────── */}
            {(loadingSimilar || similarProducts.length > 0) && (
                <div className="border-t border-gray-100 pt-12">
                    {/* Section Header */}
                    <div className="flex items-center justify-between mb-6">
                        <div>
                            <h2 className="text-2xl font-bold text-gray-900">
                                {product.category ? `More from ${product.category.name}` : 'You May Also Like'}
                            </h2>
                            <p className="text-gray-500 text-sm mt-1">Discover more products you'll love</p>
                        </div>
                        <div className="flex items-center gap-2">
                            {/* Scroll Arrows */}
                            <button
                                id="similar-scroll-left"
                                onClick={scrollLeft}
                                className="w-9 h-9 flex items-center justify-center rounded-full border border-gray-200 bg-white hover:bg-gray-50 hover:border-indigo-300 shadow-sm transition-all"
                            >
                                <ChevronLeft size={18} className="text-gray-600" />
                            </button>
                            <button
                                id="similar-scroll-right"
                                onClick={scrollRight}
                                className="w-9 h-9 flex items-center justify-center rounded-full border border-gray-200 bg-white hover:bg-gray-50 hover:border-indigo-300 shadow-sm transition-all"
                            >
                                <ChevronRight size={18} className="text-gray-600" />
                            </button>
                            <Link
                                to="/"
                                className="hidden sm:flex items-center gap-1 text-sm font-semibold text-indigo-600 hover:text-indigo-700 ml-2"
                            >
                                View All <ArrowRight size={15} />
                            </Link>
                        </div>
                    </div>

                    {/* Horizontal Scroll Container */}
                    {loadingSimilar ? (
                        <div className="flex gap-4 overflow-hidden">
                            {[...Array(5)].map((_, i) => (
                                <div key={i} className="flex-shrink-0 w-52">
                                    <Skeleton className="h-52 rounded-2xl mb-3" />
                                    <Skeleton className="h-4 w-3/4 mb-2" />
                                    <Skeleton className="h-4 w-1/2" />
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div
                            ref={scrollRef}
                            className="flex gap-4 overflow-x-auto scroll-smooth pb-4"
                            style={{
                                scrollbarWidth: 'thin',
                                scrollbarColor: '#c7d2fe #f1f5f9',
                            }}
                        >
                            {similarProducts.map((p) => (
                                <SimilarProductCard key={p.id} product={p} />
                            ))}
                        </div>
                    )}

                    {/* Mobile View All link */}
                    <div className="sm:hidden mt-4 text-center">
                        <Link
                            to="/"
                            className="inline-flex items-center gap-1 text-sm font-semibold text-indigo-600 hover:text-indigo-700"
                        >
                            View All Products <ArrowRight size={15} />
                        </Link>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ProductDetail;
