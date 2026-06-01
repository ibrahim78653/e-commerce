import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, X, Loader2 } from 'lucide-react';
import { productsAPI } from '../services/api';
import CONFIG from '../config';

const GlobalSearch = () => {
    const navigate = useNavigate();
    const [query, setQuery] = useState('');
    const [results, setResults] = useState([]);
    const [loading, setLoading] = useState(false);
    const [isOpen, setIsOpen] = useState(false);
    const containerRef = useRef(null);

    // Close on click outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (containerRef.current && !containerRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Debounced search
    useEffect(() => {
        if (!query.trim()) {
            setResults([]);
            setLoading(false);
            return;
        }

        const fetchResults = async () => {
            setLoading(true);
            try {
                const res = await productsAPI.getAll({ search: query, page_size: 5 });
                setResults(res.data?.items || []);
            } catch (error) {
                console.error("Search failed:", error);
            } finally {
                setLoading(false);
            }
        };

        const timeoutId = setTimeout(fetchResults, 300);
        return () => clearTimeout(timeoutId);
    }, [query]);

    const handleSelect = (productId) => {
        setIsOpen(false);
        setQuery('');
        navigate(`/product/${productId}`);
    };

    const handleSearchSubmit = (e) => {
        e.preventDefault();
        if (query.trim()) {
            setIsOpen(false);
            navigate(`/?search=${encodeURIComponent(query)}`);
            setQuery('');
        }
    };

    return (
        <div className="relative" ref={containerRef}>
            <form 
                onSubmit={handleSearchSubmit}
                className={`flex items-center transition-all duration-300 ${isOpen ? 'w-64 sm:w-80 bg-gray-100 rounded-full px-3 py-1.5' : 'w-10 h-10 rounded-full hover:bg-gray-100 justify-center cursor-pointer'}`}
                onClick={() => !isOpen && setIsOpen(true)}
            >
                <Search size={20} className="text-gray-500 shrink-0" />
                {isOpen && (
                    <>
                        <input
                            type="text"
                            autoFocus
                            placeholder="Search products..."
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            className="bg-transparent border-none outline-none text-sm ml-2 w-full text-gray-900 placeholder-gray-500"
                        />
                        {query && (
                            <button type="button" onClick={() => setQuery('')} className="p-1 hover:text-red-500">
                                <X size={16} className="text-gray-400" />
                            </button>
                        )}
                    </>
                )}
            </form>

            {/* Results Dropdown */}
            {isOpen && query.trim() && (
                <div className="absolute top-full right-0 mt-2 w-80 bg-white rounded-xl shadow-xl border border-gray-100 overflow-hidden z-50">
                    {loading ? (
                        <div className="flex items-center justify-center p-4">
                            <Loader2 className="animate-spin text-primary-600" size={24} />
                        </div>
                    ) : results.length > 0 ? (
                        <div>
                            {results.map((product) => {
                                const price = product.discounted_price || product.original_price;
                                const imgUrl = product.images?.[0]?.image_url 
                                    ? (product.images[0].image_url.startsWith('http') ? product.images[0].image_url : `${CONFIG.IMAGE_BASE_URL}${product.images[0].image_url}`)
                                    : CONFIG.PLACEHOLDER_URL;
                                
                                return (
                                    <button
                                        key={product.id}
                                        onClick={() => handleSelect(product.id)}
                                        className="w-full text-left flex items-center gap-3 p-3 hover:bg-gray-50 transition-colors border-b border-gray-50 last:border-none"
                                    >
                                        <img 
                                            src={imgUrl} 
                                            alt={product.name} 
                                            className="w-12 h-12 object-cover rounded border border-gray-100"
                                            onError={(e) => { e.target.src = CONFIG.PLACEHOLDER_URL; }}
                                        />
                                        <div className="flex-1 overflow-hidden">
                                            <p className="text-sm font-medium text-gray-900 truncate">{product.name}</p>
                                            <p className="text-sm font-bold text-primary-600">₹{price.toFixed(2)}</p>
                                        </div>
                                    </button>
                                );
                            })}
                            <button
                                onClick={handleSearchSubmit}
                                className="w-full p-3 text-sm text-center font-medium text-primary-600 hover:bg-primary-50 transition-colors border-t border-gray-100"
                            >
                                View all results for "{query}"
                            </button>
                        </div>
                    ) : (
                        <div className="p-4 text-center text-sm text-gray-500">
                            No products found for "{query}"
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default GlobalSearch;
