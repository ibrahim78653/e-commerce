/**
 * Home Page - Product Listing
 * Features: search, filters, pagination, sorting
 */
import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Search, SlidersHorizontal, ArrowUpDown } from 'lucide-react';
import { motion } from 'framer-motion';
import { productsAPI, categoriesAPI } from '../services/api';
import ProductCard from '../components/ProductCard';
import { ProductCardSkeleton } from '../components/ui/Skeleton';

const Home = () => {
    const [searchParams, setSearchParams] = useSearchParams();
    const [products, setProducts] = useState([]);
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 });

    const [filters, setFilters] = useState({
        search: searchParams.get('search') || '',
        category_id: searchParams.get('category') || '',
        sort_by: searchParams.get('sort') || 'created_at',
        sort_order: searchParams.get('order') || 'desc',
        is_featured: searchParams.get('featured') === 'true' || null,
    });

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
                    page_size: 12,
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

    const handleFilterChange = (key, value) => {
        setFilters(prev => ({ ...prev, [key]: value }));
        setPagination(prev => ({ ...prev, page: 1 }));

        // Update URL params
        const params = new URLSearchParams(searchParams);
        if (value) {
            params.set(key, value);
        } else {
            params.delete(key);
        }
        setSearchParams(params);
    };

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Hero Section */}
            <div className="bg-gradient-premium py-20 relative overflow-hidden">
                <div className="absolute inset-0 opacity-10">
                    <div className="absolute top-10 left-10 w-64 h-64 bg-primary-300 rounded-full blur-3xl animate-pulse"></div>
                    <div className="absolute bottom-10 right-10 w-96 h-96 bg-accent-300 rounded-full blur-3xl animate-pulse delay-700"></div>
                </div>
                <div className="container relative z-10">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-center"
                    >
                        <h1 className="text-6xl md:text-7xl font-display font-black mb-6 animate-float">
                            <span className="text-gradient">Burhani Collection</span>
                        </h1>
                        <p className="text-xl text-gray-600 mb-10 max-w-2xl mx-auto font-medium">
                            Experience the pinnacle of premium fashion. Curated collections for those who appreciate quality and style.
                        </p>

                        {/* Search Bar */}
                        <div className="max-w-2xl mx-auto">
                            <div className="relative">
                                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={24} />
                                <input
                                    type="text"
                                    value={filters.search}
                                    onChange={(e) => handleFilterChange('search', e.target.value)}
                                    placeholder="Search for products..."
                                    className="w-full pl-14 pr-4 py-4 rounded-xl text-gray-900 text-lg focus:outline-none focus:ring-4 focus:ring-white/30"
                                />
                            </div>
                        </div>
                    </motion.div>
                </div>
            </div>

            {/* Filters & Products */}
            <div className="container py-8">
                <div className="flex flex-col lg:flex-row gap-8">
                    {/* Sidebar Filters */}
                    <aside className="lg:w-64 space-y-6">
                        <div className="card">
                            <h3 className="font-semibold text-lg mb-4 flex items-center">
                                <SlidersHorizontal className="mr-2" size={20} />
                                Filters
                            </h3>

                            {/* Categories */}
                            <div className="mb-6">
                                <h4 className="font-medium text-gray-700 mb-3">Category</h4>
                                <div className="space-y-2">
                                    <label className="flex items-center">
                                        <input
                                            type="radio"
                                            name="category"
                                            checked={!filters.category_id}
                                            onChange={() => handleFilterChange('category_id', '')}
                                            className="mr-2"
                                        />
                                        <span className="text-gray-700">All Categories</span>
                                    </label>
                                    {categories.map((category) => (
                                        <label key={category.id} className="flex items-center">
                                            <input
                                                type="radio"
                                                name="category"
                                                checked={filters.category_id == category.id}
                                                onChange={() => handleFilterChange('category_id', category.id)}
                                                className="mr-2"
                                            />
                                            <span className="text-gray-700">{category.name}</span>
                                        </label>
                                    ))}
                                </div>
                            </div>

                            {/* Sort */}
                            <div>
                                <h4 className="font-medium text-gray-700 mb-3 flex items-center">
                                    <ArrowUpDown className="mr-2" size={18} />
                                    Sort By
                                </h4>
                                <select
                                    value={`${filters.sort_by}_${filters.sort_order}`}
                                    onChange={(e) => {
                                        const [sortBy, sortOrder] = e.target.value.split('_');
                                        handleFilterChange('sort_by', sortBy);
                                        handleFilterChange('sort_order', sortOrder);
                                    }}
                                    className="w-full input"
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
                            <div className="pt-4 border-t border-gray-200">
                                <label className="flex items-center">
                                    <input
                                        type="checkbox"
                                        checked={filters.is_featured === true}
                                        onChange={(e) => handleFilterChange('is_featured', e.target.checked ? true : null)}
                                        className="mr-2"
                                    />
                                    <span className="text-gray-700 font-medium">Featured Only</span>
                                </label>
                            </div>
                        </div>
                    </aside>

                    {/* Products Grid */}
                    <main className="flex-1">
                        {/* Results Header */}
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-2xl font-bold text-gray-900">
                                {filters.search ? `Search results for "${filters.search}"` : 'All Products'}
                            </h2>
                            <p className="text-gray-600">
                                {pagination.total} product{pagination.total !== 1 ? 's' : ''}
                            </p>
                        </div>

                        {/* Products Grid */}
                        {loading ? (
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                                {[...Array(6)].map((_, i) => (
                                    <ProductCardSkeleton key={i} />
                                ))}
                            </div>
                        ) : products.length > 0 ? (
                            <>
                                <motion.div
                                    initial="hidden"
                                    animate="visible"
                                    variants={{
                                        visible: {
                                            transition: {
                                                staggerChildren: 0.1,
                                            },
                                        },
                                    }}
                                    className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6"
                                >
                                    {products.map((product) => (
                                        <motion.div
                                            key={product.id}
                                            variants={{
                                                hidden: { opacity: 0, y: 20 },
                                                visible: { opacity: 1, y: 0 },
                                            }}
                                        >
                                            <ProductCard product={product} />
                                        </motion.div>
                                    ))}
                                </motion.div>

                                {/* Pagination */}
                                {pagination.pages > 1 && (
                                    <div className="flex justify-center gap-2 mt-8">
                                        <button
                                            onClick={() => setPagination(prev => ({ ...prev, page: Math.max(1, prev.page - 1) }))}
                                            disabled={pagination.page === 1}
                                            className="btn btn-outline disabled:opacity-50"
                                        >
                                            Previous
                                        </button>
                                        <span className="flex items-center px-4 py-2 text-gray-700">
                                            Page {pagination.page} of {pagination.pages}
                                        </span>
                                        <button
                                            onClick={() => setPagination(prev => ({ ...prev, page: Math.min(prev.pages, prev.page + 1) }))}
                                            disabled={pagination.page === pagination.pages}
                                            className="btn btn-outline disabled:opacity-50"
                                        >
                                            Next
                                        </button>
                                    </div>
                                )}
                            </>
                        ) : (
                            <div className="text-center py-16">
                                <p className="text-gray-500 text-lg">No products found</p>
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
                                    className="btn btn-primary mt-4"
                                >
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
