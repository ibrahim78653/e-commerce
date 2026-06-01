/**
 * Product Detail Page
 * Display product info, image gallery, add to cart, and similar products scroll
 */
import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, useSearchParams, Link } from 'react-router-dom';
import { Carousel } from 'react-bootstrap';
import {
    ShoppingCart, Heart, Package, Truck, Shield,
    ChevronLeft, ChevronRight, Star, ArrowRight, Sparkles
} from 'lucide-react';
import { motion } from 'framer-motion';
import { productsAPI } from '../services/api';
import useWishlistStore from '../store/wishlistStore';
import { useCart } from '../context/CartContext';
import Button from '../components/ui/Button';
import ReviewSection from '../components/ReviewSection';
import Skeleton from '../components/ui/Skeleton';
import toast from 'react-hot-toast';
import CONFIG from '../config';

// ─── Similar Product Card ────────────────────────────────────────────────────
const SimilarProductCard = ({ product }) => {
    const navigate = useNavigate();
    const { addToCart } = useCart();
    const { toggleItem, isInWishlist } = useWishlistStore();

    const isWishlisted = isInWishlist(product.id);
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
            whileHover={{ y: -6 }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
            className="flex-shrink-0 w-56 relative bg-[#FDFBF7] rounded-2xl border border-[#D4AF37]/15 hover:border-[#D4AF37]/45 hover:shadow-xl hover:shadow-[#1a0a00]/5 transition-all cursor-pointer overflow-hidden group"
            onClick={() => navigate(`/product/${product.id}`)}
        >
            {/* Shimmer line */}
            <div className="absolute inset-0 w-full h-full pointer-events-none overflow-hidden z-10">
                <div className="absolute -top-1/2 -left-1/2 w-[200%] h-[200%] bg-gradient-to-tr from-transparent via-[#D4AF37]/5 to-transparent rotate-45 -translate-x-[110%] group-hover:translate-x-[110%] transition-transform duration-1000 ease-out" />
            </div>

            {/* Image */}
            <div className="relative h-56 bg-gray-50 overflow-hidden">
                <img
                    src={imageUrl}
                    alt={product.name}
                    loading="lazy"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    onError={(e) => { e.target.src = CONFIG.PLACEHOLDER_URL; }}
                />
                
                {/* Badges */}
                <div className="absolute top-2.5 left-2.5 flex flex-col gap-1 z-20">
                    {hasDiscount && (
                        <div className="bg-[#A94A4A] text-white text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full shadow-sm">
                            -{discount}%
                        </div>
                    )}
                    {product.is_featured && (
                        <div className="bg-[#D4AF37] text-[#1a0a00] text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full shadow-sm">
                            Featured
                        </div>
                    )}
                </div>

                {/* Wishlist Button */}
                <div className="absolute top-2.5 right-2.5 opacity-0 group-hover:opacity-100 transition-opacity z-20">
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            toggleItem(product);
                        }}
                        className="bg-[#FDFBF7]/80 backdrop-blur-md p-1.5 rounded-full border border-white/20 hover:bg-[#FDFBF7] transition-all"
                    >
                        <Heart size={14} className={`${isWishlisted ? 'text-[#A94A4A] fill-[#A94A4A]' : 'text-gray-700'}`} />
                    </button>
                </div>

                {product.stock === 0 && (
                    <div className="absolute inset-0 bg-[#1a0a00]/40 backdrop-blur-[1px] flex items-center justify-center z-10">
                        <span className="text-gray-900 font-bold text-[10px] bg-[#FDFBF7]/95 px-2.5 py-1 rounded-md border border-[#D4AF37]/40 uppercase tracking-widest">Out of Stock</span>
                    </div>
                )}
            </div>

            {/* Info */}
            <div className="p-4 flex flex-col flex-1">
                {product.category && (
                    <p className="text-[10px] text-[#D4AF37] font-bold uppercase tracking-[0.15em] mb-1">{product.category.name}</p>
                )}
                <h3 className="text-xs font-bold text-gray-900 leading-snug mb-2 line-clamp-2 h-8 group-hover:text-[#A94A4A] transition-colors">
                    {product.name}
                </h3>
                <div className="flex items-baseline gap-1.5 mb-3">
                    <span className="font-bold text-gray-900 text-sm">₹{price.toLocaleString()}</span>
                    {hasDiscount && (
                        <span className="text-[10px] text-gray-400 line-through">₹{product.original_price.toLocaleString()}</span>
                    )}
                </div>
                <button
                    onClick={handleAddToCart}
                    disabled={product.stock === 0}
                    className="w-full flex items-center justify-center gap-1.5 py-2 px-3 border border-[#A94A4A] text-[#A94A4A] hover:bg-[#A94A4A] hover:text-[#FDFBF7] text-[10px] font-black uppercase tracking-wider rounded-lg transition-all duration-300 disabled:bg-gray-100 disabled:border-gray-200 disabled:text-gray-400 disabled:cursor-not-allowed"
                >
                    <ShoppingCart size={12} className="stroke-[2.5]" />
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
    const { toggleItem, isInWishlist } = useWishlistStore();

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
    const isWishlisted = product ? isInWishlist(product.id) : false;

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
            const res = await productsAPI.getRelated(currentProduct.id, 12);
            setSimilarProducts(res.data?.items || []);
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
        toast.success(`${product.name} added to cart!`);
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
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                    <Skeleton variant="card" className="h-[450px] rounded-2xl" />
                    <div className="space-y-6">
                        <Skeleton className="h-4 w-1/4 rounded" />
                        <Skeleton className="h-10 w-3/4 rounded-lg" />
                        <Skeleton className="h-6 w-1/3 rounded" />
                        <Skeleton className="h-24 rounded-xl" />
                        <Skeleton className="h-12 w-1/2 rounded" />
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
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 bg-[#FDFBF7]">
            {/* ── Main Product Detail ───────────────────────────────────── */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 mb-20">
                
                {/* Image Gallery */}
                <div className="product-carousel-container space-y-4">
                    <div className="relative bg-white rounded-3xl border border-[#D4AF37]/20 p-2 shadow-sm overflow-hidden">
                        <Carousel
                            interval={null}
                            indicators={currentImages.length > 1}
                            controls={currentImages.length > 1}
                            activeIndex={selectedImage}
                            onSelect={(index) => setSelectedImage(index)}
                            className="bg-transparent rounded-2xl overflow-hidden shadow-inner"
                        >
                            {currentImages.map((image, index) => (
                                <Carousel.Item key={index} className="h-[480px]">
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
                    </div>

                    {currentImages.length > 1 && (
                        <div className="grid grid-cols-4 sm:grid-cols-6 gap-3 pt-2">
                            {currentImages.map((image, index) => (
                                <button
                                    key={index}
                                    onClick={() => setSelectedImage(index)}
                                    className={`rounded-xl overflow-hidden border-2 transition-all h-20 bg-white ${selectedImage === index
                                        ? 'border-[#A94A4A] ring-2 ring-[#A94A4A]/10'
                                        : 'border-gray-200/70 hover:border-gray-300'
                                        }`}
                                >
                                    <img
                                        src={
                                            image.image_url?.startsWith('http')
                                                ? image.image_url
                                                : `${CONFIG.IMAGE_BASE_URL}${image.image_url}`
                                        }
                                        alt={`${product.name} thumb ${index + 1}`}
                                        loading="lazy"
                                        className="w-full h-full object-cover"
                                        onError={(e) => { e.target.src = CONFIG.PLACEHOLDER_URL; }}
                                    />
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                {/* Product Info */}
                <div className="space-y-8 flex flex-col justify-center">
                    <div>
                        {product.category && (
                            <span className="bg-[#D4AF37]/10 text-[#A94A4A] border border-[#D4AF37]/35 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-[0.2em] inline-block mb-3">
                                {product.category.name}
                            </span>
                        )}

                        <h1 
                            className="text-4xl md:text-5xl font-black text-gray-900 tracking-wide leading-tight"
                            style={{ fontFamily: '"Times New Roman", Times, serif' }}
                        >
                            {product.name}
                        </h1>
                    </div>

                    {/* Price */}
                    <div className="flex items-center gap-5 border-y border-gray-100 py-5">
                        <span className="text-3xl font-black text-gray-900">₹{price.toLocaleString()}</span>
                        {hasDiscount && (
                            <>
                                <span className="text-xl text-gray-400 line-through decoration-1 decoration-gray-400">
                                    ₹{product.original_price.toLocaleString()}
                                </span>
                                <span className="bg-[#A94A4A] text-white px-3 py-1 rounded-full font-black text-xs uppercase tracking-wider">
                                    {discount}% OFF
                                </span>
                            </>
                        )}
                    </div>

                    {/* Description */}
                    <p className="text-gray-600 text-base leading-relaxed font-light">
                        {product.description || product.short_description}
                    </p>

                    {/* Size Selection */}
                    {sizes.length > 0 && (
                        <div>
                            <h3 className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-3">Select Size</h3>
                            <div className="flex gap-2.5 flex-wrap">
                                {sizes.map((size) => (
                                    <button
                                        key={size}
                                        onClick={() => setSelectedSize(size)}
                                        className={`px-5 py-2.5 rounded-xl border text-sm font-semibold tracking-wide transition-all duration-300 ${selectedSize === size
                                            ? 'border-[#A94A4A] bg-[#A94A4A]/5 text-[#A94A4A] font-bold shadow-sm'
                                            : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'
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
                        <div>
                            <h3 className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-3">Select Color</h3>
                            <div className="flex gap-3 flex-wrap">
                                {colorOptions.map((colorOption) => (
                                    <button
                                        key={colorOption.color_name}
                                        onClick={() => setSelectedColor(colorOption.color_name)}
                                        className={`flex items-center gap-2.5 px-4 py-2.5 rounded-xl border text-sm font-semibold transition-all duration-300 ${selectedColor === colorOption.color_name
                                            ? 'border-[#A94A4A] bg-[#A94A4A]/5 text-[#A94A4A] font-bold shadow-sm'
                                            : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'
                                            }`}
                                    >
                                        {colorOption.color_code && (
                                            <div
                                                className="w-4 h-4 rounded-full border border-gray-300 shadow-sm"
                                                style={{ backgroundColor: colorOption.color_code }}
                                            />
                                        )}
                                        <span>{colorOption.color_name}</span>
                                        {colorOption.stock !== undefined && (
                                            <span className="text-[10px] font-bold text-[#D4AF37]">({colorOption.stock} left)</span>
                                        )}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Quantity */}
                    <div>
                        <h3 className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-3">Quantity</h3>
                        <div className="flex items-center gap-4">
                            <div className="flex items-center border border-gray-200 bg-white rounded-xl overflow-hidden">
                                <button
                                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                                    className="px-4 py-2.5 hover:bg-gray-50 text-gray-600 font-bold transition-colors"
                                >-</button>
                                <span className="px-6 py-2.5 font-bold text-gray-800">{quantity}</span>
                                <button
                                    onClick={() => setQuantity(quantity + 1)}
                                    className="px-4 py-2.5 hover:bg-gray-50 text-gray-600 font-bold transition-colors"
                                >+</button>
                            </div>
                            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">{currentStock} items in stock</p>
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="flex flex-col sm:flex-row gap-4 border-t border-gray-100 pt-8">
                        <button
                            onClick={handleAddToCart}
                            disabled={currentStock === 0}
                            className="flex-grow flex-1 flex items-center justify-center gap-2.5 py-4 px-6 bg-[#A94A4A] hover:bg-[#8A3A3A] disabled:bg-gray-200 disabled:border-gray-200 disabled:text-gray-400 disabled:cursor-not-allowed text-white rounded-xl font-bold uppercase tracking-wider text-xs shadow-md shadow-[#A94A4A]/10 transition-all duration-300 hover:shadow-lg active:scale-98"
                        >
                            <ShoppingCart size={16} className="stroke-[2.5]" />
                            Add to Cart
                        </button>
                        <button
                            onClick={handleBuyNow}
                            disabled={currentStock === 0}
                            className="flex-grow flex-1 flex items-center justify-center gap-2.5 py-4 px-6 border border-[#A94A4A] text-[#A94A4A] hover:bg-[#A94A4A] hover:text-white disabled:bg-gray-100 disabled:border-gray-200 disabled:text-gray-400 disabled:cursor-not-allowed rounded-xl font-bold uppercase tracking-wider text-xs transition-all duration-300 active:scale-98"
                        >
                            Buy It Now
                        </button>
                        <button 
                            onClick={() => toggleItem(product)}
                            className="p-4 border border-gray-200 hover:border-[#A94A4A] hover:text-[#A94A4A] bg-white rounded-xl transition-colors duration-300 flex items-center justify-center"
                        >
                            <Heart size={20} className={isWishlisted ? 'text-[#A94A4A] fill-[#A94A4A]' : 'text-gray-700'} />
                        </button>
                    </div>

                    {/* Features Strip */}
                    <div className="grid grid-cols-3 gap-6 p-6 bg-white border border-[#D4AF37]/20 rounded-2xl shadow-sm">
                        <div className="text-center space-y-1">
                            <Package className="mx-auto text-[#D4AF37]" size={28} />
                            <p className="text-[10px] font-bold uppercase tracking-wider text-gray-500">Easy Returns</p>
                        </div>
                        <div className="text-center space-y-1 border-x border-gray-100">
                            <Truck className="mx-auto text-[#D4AF37]" size={28} />
                            <p className="text-[10px] font-bold uppercase tracking-wider text-gray-500">Fast Shipping</p>
                        </div>
                        <div className="text-center space-y-1">
                            <Shield className="mx-auto text-[#D4AF37]" size={28} />
                            <p className="text-[10px] font-bold uppercase tracking-wider text-gray-500">Secured Pay</p>
                        </div>
                    </div>

                    {/* Product Details (SKU, Material) */}
                    {product.material && (
                        <div className="border-t border-gray-100 pt-6 space-y-3">
                            <h3 
                                className="font-bold text-gray-900 text-lg uppercase tracking-wider"
                                style={{ fontFamily: '"Times New Roman", Times, serif' }}
                            >
                                Details & Fabric
                            </h3>
                            <div className="space-y-1.5 text-sm text-gray-600">
                                <p><span className="font-semibold text-gray-700">Material:</span> {product.material}</p>
                                {product.sku && <p><span className="font-semibold text-gray-700">SKU:</span> {product.sku}</p>}
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* ── Similar / You May Also Like Section ─────────────────────── */}
            {(loadingSimilar || similarProducts.length > 0) && (
                <div className="border-t border-gray-100 pt-16 mt-16">
                    {/* Section Header */}
                    <div className="flex items-center justify-between mb-8 pb-3 border-b border-gray-100">
                        <div>
                            <h2 
                                className="text-2xl font-black text-gray-900 tracking-wider flex items-center gap-2"
                                style={{ fontFamily: '"Times New Roman", Times, serif' }}
                            >
                                <Sparkles size={18} className="text-[#D4AF37]" />
                                {product.category ? `More from ${product.category.name}` : 'You May Also Like'}
                            </h2>
                            <p className="text-gray-400 text-xs mt-1 uppercase tracking-widest font-bold">Discover more products you'll love</p>
                        </div>
                        <div className="flex items-center gap-2">
                            {/* Scroll Arrows */}
                            <button
                                id="similar-scroll-left"
                                onClick={scrollLeft}
                                className="w-9 h-9 flex items-center justify-center rounded-full border border-[#D4AF37]/30 bg-white hover:bg-gray-50 shadow-sm transition-all"
                            >
                                <ChevronLeft size={16} className="text-gray-600" />
                            </button>
                            <button
                                id="similar-scroll-right"
                                onClick={scrollRight}
                                className="w-9 h-9 flex items-center justify-center rounded-full border border-[#D4AF37]/30 bg-white hover:bg-gray-50 shadow-sm transition-all"
                            >
                                <ChevronRight size={16} className="text-gray-600" />
                            </button>
                            <Link
                                to="/"
                                className="hidden sm:flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-[#A94A4A] hover:text-[#8A3A3A] ml-4"
                            >
                                View All <ArrowRight size={14} />
                            </Link>
                        </div>
                    </div>

                    {/* Horizontal Scroll Container */}
                    {loadingSimilar ? (
                        <div className="flex gap-6 overflow-hidden">
                            {[...Array(5)].map((_, i) => (
                                <div key={i} className="flex-shrink-0 w-56">
                                    <Skeleton className="h-56 rounded-2xl mb-3" />
                                    <Skeleton className="h-4 w-3/4 mb-2" />
                                    <Skeleton className="h-4 w-1/2" />
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div
                            ref={scrollRef}
                            className="flex gap-6 overflow-x-auto scroll-smooth pb-4"
                            style={{
                                scrollbarWidth: 'thin',
                                scrollbarColor: '#D4AF37 #f1f5f9',
                            }}
                        >
                            {similarProducts.map((p) => (
                                <SimilarProductCard key={p.id} product={p} />
                            ))}
                        </div>
                    )}

                    {/* Mobile View All link */}
                    <div className="sm:hidden mt-6 text-center">
                        <Link
                            to="/"
                            className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-[#A94A4A] hover:text-[#8A3A3A]"
                        >
                            View All Products <ArrowRight size={14} />
                        </Link>
                    </div>
                </div>
            )}

            {/* Reviews Section */}
            {product && <ReviewSection productId={product.id} />}
        </div>
    );
};

export default ProductDetail;
