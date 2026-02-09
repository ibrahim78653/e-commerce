/**
 * Cart Context using React Context API
 * Manages shopping cart state with localStorage persistence
 */
import { createContext, useContext, useState, useEffect } from 'react';
import toast from 'react-hot-toast';

const CartContext = createContext();

export const CartProvider = ({ children }) => {
    const [cart, setCart] = useState(() => {
        const savedCart = localStorage.getItem('cart');
        return savedCart ? JSON.parse(savedCart) : [];
    });

    // Sync to localStorage whenever cart changes
    useEffect(() => {
        localStorage.setItem('cart', JSON.stringify(cart));
    }, [cart]);

    // Add item to cart
    const addToCart = (product, quantity = 1, selectedSize = null, selectedColor = null) => {
        setCart(prevCart => {
            const existingItem = prevCart.find(
                item =>
                    item.id === product.id &&
                    item.selectedSize === selectedSize &&
                    item.selectedColor === selectedColor &&
                    item.selectedVariantId === product.selectedVariantId
            );

            if (existingItem) {
                // Update quantity
                toast.success('Cart updated');
                return prevCart.map(item =>
                    item === existingItem
                        ? { ...item, quantity: item.quantity + quantity }
                        : item
                );
            }

            // Add new item
            toast.success('Added to cart');
            return [...prevCart, {
                ...product,
                quantity,
                selectedSize,
                selectedColor,
                selectedVariantId: product.selectedVariantId,
                addedAt: Date.now()
            }];
        });
    };

    // Remove item from cart
    const removeFromCart = (productId, selectedSize, selectedColor) => {
        setCart(prevCart =>
            prevCart.filter(
                item =>
                    !(item.id === productId &&
                        item.selectedSize === selectedSize &&
                        item.selectedColor === selectedColor)
            )
        );
        toast.success('Removed from cart');
    };

    // Update item quantity
    const updateQuantity = (productId, selectedSize, selectedColor, quantity) => {
        if (quantity < 1) return;

        setCart(prevCart =>
            prevCart.map(item =>
                item.id === productId &&
                    item.selectedSize === selectedSize &&
                    item.selectedColor === selectedColor
                    ? { ...item, quantity }
                    : item
            )
        );
    };

    // Clear entire cart
    const clearCart = () => {
        setCart([]);
        localStorage.removeItem('cart');
        toast.success('Cart cleared');
    };

    // Get item count
    const getItemCount = () => {
        return cart.reduce((total, item) => total + item.quantity, 0);
    };

    // Calculate total price
    const getTotal = () => {
        return cart.reduce((total, item) => {
            const price = item.discounted_price || item.original_price;
            return total + (price * item.quantity);
        }, 0);
    };

    // Calculate shipping cost
    const getShippingCost = () => {
        const total = getTotal();
        if (total === 0) return 0;
        if (total > 1200) return 0;
        if (total >= 700) return 30;
        return 50;
    };

    // Calculate grand total (subtotal + shipping)
    const getGrandTotal = () => {
        return getTotal() + getShippingCost();
    };

    const isInCart = (productId, selectedSize, selectedColor) => {
        return cart.some(
            item =>
                item.id === productId &&
                item.selectedSize === selectedSize &&
                item.selectedColor === selectedColor
        );
    };

    const value = {
        cart,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        getItemCount,
        getTotal,
        getShippingCost,
        getGrandTotal,
        isInCart,
    };

    return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};

export const useCart = () => {
    const context = useContext(CartContext);
    if (!context) {
        throw new Error('useCart must be used within CartProvider');
    }
    return context;
};

export default CartContext;
