// Cart operations with local storage
const CART_STORAGE_KEY = 'medcare_cart';

export const getCartItems = () => {
    const cartItems = localStorage.getItem(CART_STORAGE_KEY);
    return cartItems ? JSON.parse(cartItems) : [];
};

export const getCartCount = () => {
    const cartItems = getCartItems();
    return cartItems.reduce((sum, item) => sum + (item.quantity || 1), 0);
};

export const addToCart = (product) => {
    const cartItems = getCartItems();
    const existingItem = cartItems.find(item => item._id === product._id);

    if (existingItem) {
        existingItem.quantity = (existingItem.quantity || 1) + 1;
    } else {
        cartItems.push({
            _id: product._id,
            name: product.name,
            price: product.price,
            quantity: 1,
            image: product.image,
            brand: product.brand,
            category: product.category,
            prescriptionRequired: product.prescriptionRequired,
            expiryDate: product.expiryDate
        });
    }

    localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cartItems));
    // Dispatch cart update event
    window.dispatchEvent(new CustomEvent('cartUpdate'));
    return cartItems;
};

export const updateCartItemQuantity = (productId, quantity) => {
    if (quantity < 1) return getCartItems();

    const cartItems = getCartItems();
    const updatedItems = cartItems.map(item =>
        item._id === productId ? { ...item, quantity: quantity } : item
    );

    localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(updatedItems));
    // Dispatch cart update event
    window.dispatchEvent(new CustomEvent('cartUpdate'));
    return updatedItems;
};

export const removeFromCart = (productId) => {
    const cartItems = getCartItems();
    const updatedItems = cartItems.filter(item => item._id !== productId);
    localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(updatedItems));
    // Dispatch cart update event
    window.dispatchEvent(new CustomEvent('cartUpdate'));
    return updatedItems;
};

export const clearCart = () => {
    localStorage.removeItem(CART_STORAGE_KEY);
    // Dispatch cart update event
    window.dispatchEvent(new CustomEvent('cartUpdate'));
    return [];
};

export const getCartTotal = () => {
    const cartItems = getCartItems();
    return cartItems.reduce((total, item) => total + (item.price * (item.quantity || 1)), 0);
};

export const getCartItemQuantity = (productId) => {
    const cartItems = getCartItems();
    const item = cartItems.find(item => item._id === productId);
    return item ? (item.quantity || 1) : 0;
}; 