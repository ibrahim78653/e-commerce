/**
 * Home Page - Product Listing
 * Features: search, filters, pagination, sorting
 */
import { useState, useEffect, useRef, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Search, SlidersHorizontal, ArrowUpDown, Check, RefreshCw } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { productsAPI, categoriesAPI } from '../services/api';
import ProductCard from '../components/ProductCard';
import { ProductCardSkeleton } from '../components/ui/Skeleton';
import HeroCarousel from '../components/HeroCarousel';
import CategoryShowcase from '../components/CategoryShowcase';

const Home = () => {
    const [searchParams, setSearchParams] = useSearchParams();
    const [products, setProducts] = useState([]);
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 });

    const [filters, setFilters] = useState({
        search: searchParams.get('search') || '',
        category_id: searchParams.get('category_id') || '',
        sort_by: searchParams.get('sort') || 'created_at',
        sort_order: searchParams.get('order') || 'desc',
        is_featured: searchParams.get('featured') === 'true' || null,
    });

    // Sync search params to filters
    useEffect(() => {
        setFilters({
            search: searchParams.get('search') || '',
            category_id: searchParams.get('category_id') || '',
            sort_by: searchParams.get('sort') || 'created_at',
            sort_order: searchParams.get('order') || 'desc',
            is_featured: searchParams.get('featured') === 'true' || null,
        });
        setPagination(prev => ({ ...prev, page: 1 }));
    }, [searchParams]);

    // Fetch categories
    useEffect(() => {
        const loadCategories = async () => {
            try {
                const response = await categoriesAPI.getAll();
                setCategories(response.data);
            } catch (error) {
                console.error('Failed to load categories:', error);
            }
        };
        loadCategories();
    }, []);

    // Fetch products
    useEffect(() => {
        const loadProducts = async () => {
            setLoading(true);
            try {
                const params = {
                    page: pagination.page,
                    page_size: 20,
                    ...filters,
                };

                // Remove empty filters
                Object.keys(params).forEach(key => {
                    if (params[key] === '' || params[key] === null) {
                        delete params[key];
                    }
                });

                const response = await productsAPI.getAll(params);
                setProducts(response.data.items);
                setPagination({
                    page: response.data.page,
                    pages: response.data.pages,
                    total: response.data.total,
                });
            } catch (error) {
                console.error('Failed to load products:', error);
            } finally {
                setLoading(false);
            }
        };

        loadProducts();
    }, [filters, pagination.page]);

    const handleFilterChange = (keyOrUpdates, value) => {
        const updates = typeof keyOrUpdates === 'string'
            ? { [keyOrUpdates]: value }
            : keyOrUpdates;

        setFilters(prev => ({ ...prev, ...updates }));
        setPagination(prev => ({ ...prev, page: 1 }));

        // Map filter keys to URL param keys
        const MAP_KEYS = {
            search: 'search',
            category_id: 'category_id',
            sort_by: 'sort',
            sort_order: 'order',
            is_featured: 'featured'
        };

        const params = new URLSearchParams(searchParams);
        Object.entries(updates).forEach(([key, val]) => {
            const urlKey = MAP_KEYS[key] || key;
            if (val !== null && val !== '') {
                params.set(urlKey, String(val));
            } else {
                params.delete(urlKey);
            }
        });
        setSearchParams(params);
    };

    // Debounce ref for search input — prevents API spam on every keystroke
    const searchDebounceRef = useRef(null);
    const handleSearchChange = useCallback((value) => {
        // Update UI state immediately for snappy feel
        setFilters(prev => ({ ...prev, search: value }));
        // Debounce the actual API call + URL update
        if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current);
        searchDebounceRef.current = setTimeout(() => {
            handleFilterChange('search', value);
        }, 350);
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    return (
        <div className="min-h-screen bg-[#FDFBF7]">
            {/* Hero Section */}
            <HeroCarousel />

            {/* Category Showcase Section */}
            <CategoryShowcase />

            {/* Filters & Products */}
            <div id="products-section" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 lg:py-16 scroll-mt-20">
                <div className="flex flex-col lg:flex-row gap-10">

                    {/* Sidebar Filters — desktop only */}
                    <aside className="hidden lg:block lg:w-64 space-y-6 flex-shrink-0">
                        <div className="bg-white rounded-2xl border border-[#D4AF37]/25 p-6 shadow-sm hover:shadow-md transition-shadow duration-300">
                            <h3 className="font-bold text-[#A94A4A] text-lg uppercase tracking-wider mb-6 flex items-center border-b border-[#D4AF37]/25 pb-3" style={{ fontFamily: '"Times New Roman", Times, serif' }}>
                                <SlidersHorizontal className="mr-2.5 text-[#D4AF37]" size={18} />
                                Filters
                            </h3>

                            {/* Categories */}
                            <div className="mb-8">
                                <h4 className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-4">Category</h4>
                                <div className="space-y-3">
                                    <label className="flex items-center cursor-pointer group">
                                        <input
                                            type="radio"
                                            name="category"
                                            checked={!filters.category_id}
                                            onChange={() => handleFilterChange('category_id', '')}
                                            className="hidden"
                                        />
                                        <span className={`w-4 h-4 rounded-full border flex items-center justify-center mr-3 transition-all duration-300 ${!filters.category_id ? 'border-[#A94A4A] bg-[#A94A4A]/10 scale-105' : 'border-gray-300 group-hover:border-[#A94A4A]'}`}>
                                            {!filters.category_id && <span className="w-1.5 h-1.5 rounded-full bg-[#A94A4A]" />}
                                        </span>
                                        <span className={`text-sm tracking-wide transition-colors ${!filters.category_id ? 'font-bold text-[#A94A4A]' : 'text-gray-600 group-hover:text-gray-900'}`}>All Collections</span>
                                    </label>
                                    {categories.map((category) => {
                                        const isSelected = filters.category_id == category.id;
                                        return (
                                            <label key={category.id} className="flex items-center cursor-pointer group">
                                                <input
                                                    type="radio"
                                                    name="category"
                                                    checked={isSelected}
                                                    onChange={() => handleFilterChange('category_id', category.id)}
                                                    className="hidden"
                                                />
                                                <span className={`w-4 h-4 rounded-full border flex items-center justify-center mr-3 transition-all duration-300 ${isSelected ? 'border-[#A94A4A] bg-[#A94A4A]/10 scale-105' : 'border-gray-300 group-hover:border-[#A94A4A]'}`}>
                                                    {isSelected && <span className="w-1.5 h-1.5 rounded-full bg-[#A94A4A]" />}
                                                </span>
                                                <span className={`text-sm tracking-wide transition-colors ${isSelected ? 'font-bold text-[#A94A4A]' : 'text-gray-600 group-hover:text-gray-900'}`}>{category.name}</span>
                                            </label>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* Sort */}
                            <div className="mb-6">
                                <h4 className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-4 flex items-center">
                                    <ArrowUpDown className="mr-2 text-[#D4AF37]" size={14} />
                                    Sort By
                                </h4>
                                <select
                                    value={`${filters.sort_by}_${filters.sort_order}`}
                                    onChange={(e) => {
                                        const [sortBy, sortOrder] = e.target.value.split('_');
                                        handleFilterChange({ sort_by: sortBy, sort_order: sortOrder });
                                    }}
                                    className="w-full text-sm bg-gray-50 border border-gray-200 rounded-lg p-2.5 text-gray-700 focus:outline-none focus:ring-1 focus:ring-[#D4AF37] focus:border-[#D4AF37] transition-all"
                                >
                                    <option value="created_at_desc">Newest First</option>
                                    <option value="created_at_asc">Oldest First</option>
                                    <option value="price_asc">Price: Low to High</option>
                                    <option value="price_desc">Price: High to Low</option>
                                    <option value="name_asc">Name: A to Z</option>
                                    <option value="name_desc">Name: Z to A</option>
                                </select>
                            </div>

                            {/* Featured */}
                            <div className="pt-5 border-t border-gray-100">
                                <label className="flex items-center cursor-pointer group">
                                    <input
                                        type="checkbox"
                                        checked={filters.is_featured === true}
                                        onChange={(e) => handleFilterChange('is_featured', e.target.checked ? true : null)}
                                        className="hidden"
                                    />
                                    <span className={`w-4 h-4 rounded border flex items-center justify-center mr-3 transition-all duration-300 ${filters.is_featured === true ? 'border-[#A94A4A] bg-[#A94A4A] text-white scale-105' : 'border-gray-300 group-hover:border-[#A94A4A]'}`}>
                                        {filters.is_featured === true && <Check size={12} strokeWidth={3} />}
                                    </span>
                                    <span className={`text-sm tracking-wide transition-colors ${filters.is_featured === true ? 'font-bold text-[#A94A4A]' : 'text-gray-600 group-hover:text-gray-900'}`}>Featured Only</span>
                                </label>
                            </div>
                        </div>
                    </aside>

                    {/* Products Grid */}
                    <main className="flex-grow min-w-0">
                        {/* Search Bar */}
                        <div className="mb-4 relative">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 transition-colors" size={18} />
                            <input
                                type="text"
                                value={filters.search}
                                onChange={(e) => handleSearchChange(e.target.value)}
                                placeholder="Search our premium boutique collections..."
                                className="w-full pl-12 pr-4 py-3.5 rounded-xl border border-[#D4AF37]/20 bg-white text-gray-900 focus:outline-none focus:ring-1 focus:ring-[#D4AF37] focus:border-[#D4AF37] shadow-sm transition-all text-sm tracking-wide"
                            />
                        </div>

                        {/* ── Mobile Sort Pills (hidden on lg+) ─────────────── */}
                        <div className="lg:hidden mb-5 -mx-1">
                            <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide px-1">
                                {[
                                    { label: 'Newest',        sort_by: 'created_at', sort_order: 'desc' },
                                    { label: 'Oldest',        sort_by: 'created_at', sort_order: 'asc'  },
                                    { label: 'Price ↑',       sort_by: 'price',      sort_order: 'asc'  },
                                    { label: 'Price ↓',       sort_by: 'price',      sort_order: 'desc' },
                                    { label: 'A → Z',         sort_by: 'name',       sort_order: 'asc'  },
                                    { label: 'Z → A',         sort_by: 'name',       sort_order: 'desc' },
                                ].map(({ label, sort_by, sort_order }) => {
                                    const isActive = filters.sort_by === sort_by && filters.sort_order === sort_order;
                                    return (
                                        <button
                                            key={label}
                                            onClick={() => {
                                                handleFilterChange({ sort_by, sort_order });
                                            }}
                                            className={`flex-shrink-0 px-4 py-2 rounded-full text-xs font-bold uppercase tracking-wider border transition-all duration-200 whitespace-nowrap ${
                                                isActive
                                                    ? 'bg-[#1a0a00] text-[#D4AF37] border-[#1a0a00] shadow-sm'
                                                    : 'bg-white text-gray-600 border-[#D4AF37]/30 hover:border-[#D4AF37] hover:text-[#1a0a00]'
                                            }`}
                                        >
                                            {label}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Results Header */}
                        <div className="flex items-center justify-between mb-6 pb-3 border-b border-gray-100">
                            <h2
                                className="text-lg md:text-2xl font-bold text-gray-900 tracking-wide"
                                style={{ fontFamily: '"Times New Roman", Times, serif' }}
                            >
                                {filters.search ? `Results for "${filters.search}"` : 'Shop Collection'}
                            </h2>
                            <p className="text-sm font-semibold text-gray-400">
                                {pagination.total} item{pagination.total !== 1 ? 's' : ''}
                            </p>
                        </div>

                        {/* Products Grid */}
                        {loading ? (
                            <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
                                {[...Array(8)].map((_, i) => (
                                    <ProductCardSkeleton key={i} />
                                ))}
                            </div>
                        ) : products.length > 0 ? (
                            <>
                                <AnimatePresence mode="wait">
                                    <motion.div
                                        key={pagination.page}
                                        initial={{ opacity: 0, x: 20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        exit={{ opacity: 0, x: -20 }}
                                        transition={{ duration: 0.3 }}
                                        className="grid grid-cols-2 lg:grid-cols-4 gap-6"
                                    >
                                        {products.map((product) => (
                                            <ProductCard key={product.id} product={product} />
                                        ))}
                                    </motion.div>
                                </AnimatePresence>

                                {/* Pagination */}
                                {pagination.pages > 1 && (
                                    <div className="flex justify-center items-center gap-2 mt-12 pt-6 border-t border-gray-100">
                                        <button
                                            onClick={() => setPagination(prev => ({ ...prev, page: Math.max(1, prev.page - 1) }))}
                                            disabled={pagination.page === 1}
                                            className="px-4 py-2 border border-gray-200 rounded-lg text-sm font-semibold text-gray-600 hover:bg-gray-50 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                                        >
                                            Previous
                                        </button>
                                        <span className="text-xs font-bold tracking-widest uppercase text-gray-400 px-4">
                                            Page {pagination.page} of {pagination.pages}
                                        </span>
                                        <button
                                            onClick={() => setPagination(prev => ({ ...prev, page: Math.min(prev.pages, prev.page + 1) }))}
                                            disabled={pagination.page === pagination.pages}
                                            className="px-4 py-2 border border-gray-200 rounded-lg text-sm font-semibold text-gray-600 hover:bg-gray-50 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                                        >
                                            Next
                                        </button>
                                    </div>
                                )}
                            </>
                        ) : (
                            <div className="text-center py-20 bg-white rounded-2xl border border-dashed border-gray-200">
                                <p className="text-gray-400 font-semibold mb-4">No products found matching your selection.</p>
                                <button
                                    onClick={() => {
                                        setFilters({
                                            search: '',
                                            category_id: '',
                                            sort_by: 'created_at',
                                            sort_order: 'desc',
                                            is_featured: null,
                                        });
                                        setSearchParams({});
                                    }}
                                    className="inline-flex items-center gap-2 px-5 py-2.5 border border-[#A94A4A] text-[#A94A4A] hover:bg-[#A94A4A] hover:text-white rounded-full font-bold text-xs uppercase tracking-wider transition-all duration-300"
                                >
                                    <RefreshCw size={14} />
                                    Clear Filters
                                </button>
                            </div>
                        )}
                    </main>
                </div>
            </div>
        </div>
    );
};

export default Home;
