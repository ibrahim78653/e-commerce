import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Heart, ShoppingBag } from 'lucide-react';
import useWishlistStore from '../store/wishlistStore';
import ProductCard from '../components/ProductCard';

const WishlistPage = () => {
    const { items, loading, fetchWishlist } = useWishlistStore();

    useEffect(() => {
        fetchWishlist();
    }, [fetchWishlist]);

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600"></div>
            </div>
        );
    }

    return (
        <div className="container min-h-[70vh] py-10">
            <div className="flex items-center gap-3 mb-8">
                <Heart size={28} className="text-red-500 fill-red-500" />
                <h1 className="text-3xl font-bold text-gray-900">My Wishlist</h1>
                <span className="text-gray-500 bg-gray-100 px-3 py-1 rounded-full text-sm font-medium ml-2">
                    {items.length} Items
                </span>
            </div>

            {items.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 bg-white rounded-2xl shadow-sm border border-gray-100 text-center">
                    <div className="w-24 h-24 bg-red-50 rounded-full flex items-center justify-center mb-6">
                        <Heart size={40} className="text-red-400" />
                    </div>
                    <h2 className="text-2xl font-semibold text-gray-900 mb-3">Your wishlist is empty</h2>
                    <p className="text-gray-500 max-w-md mb-8">
                        Found something you like? Tap on the heart icon next to the item to add it to your wishlist.
                    </p>
                    <Link
                        to="/"
                        className="inline-flex items-center gap-2 px-6 py-3 bg-red-600 text-white font-semibold rounded-lg hover:bg-red-700 transition-colors shadow-sm"
                    >
                        <ShoppingBag size={20} />
                        Start Shopping
                    </Link>
                </div>
            ) : (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
                    {items.map((product) => (
                        <ProductCard key={product.id} product={product} />
                    ))}
                </div>
            )}
        </div>
    );
};

export default WishlistPage;
