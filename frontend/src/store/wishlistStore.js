import { create } from 'zustand';
import { wishlistAPI } from '../services/api';
import toast from 'react-hot-toast';

const useWishlistStore = create((set, get) => ({
    items: [],
    loading: false,
    
    fetchWishlist: async () => {
        const authStore = JSON.parse(localStorage.getItem('auth-storage') || '{}');
        const token = localStorage.getItem('access_token');
        
        if (!token) {
            set({ items: [], loading: false });
            return;
        }
        
        set({ loading: true });
        try {
            const res = await wishlistAPI.get();
            set({ items: res.data.items || [] });
        } catch (error) {
            console.error('Failed to fetch wishlist:', error);
        } finally {
            set({ loading: false });
        }
    },
    
    toggleItem: async (product) => {
        const { items } = get();
        const exists = items.find((item) => item.id === product.id);
        const token = localStorage.getItem('access_token');
        
        if (!token) {
            toast.error('Please login to add to wishlist');
            return false;
        }

        try {
            if (exists) {
                // Optimistic update
                set({ items: items.filter((item) => item.id !== product.id) });
                await wishlistAPI.remove(product.id);
                toast.success('Removed from wishlist');
            } else {
                // Optimistic update
                set({ items: [...items, product] });
                await wishlistAPI.add(product.id);
                toast.success('Added to wishlist');
            }
            return true;
        } catch (error) {
            // Revert optimistic update on failure
            get().fetchWishlist();
            toast.error('Failed to update wishlist');
            return false;
        }
    },
    
    isInWishlist: (productId) => {
        const { items } = get();
        return items.some((item) => item.id === productId);
    },
    
    clearWishlist: () => set({ items: [] })
}));

export default useWishlistStore;
