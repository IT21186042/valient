export const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
};

export const validatePhone = (phone) => {
    const phoneRegex = /^\+?[\d\s-]{10,}$/;
    return phoneRegex.test(phone);
};

export const validateRequired = (value) => {
    return value && value.trim().length > 0;
};

export const validateMinLength = (value, minLength) => {
    return value && value.length >= minLength;
};

export const validateMaxLength = (value, maxLength) => {
    return value && value.length <= maxLength;
};

export const validateDate = (date) => {
    const selectedDate = new Date(date);
    const today = new Date();
    return selectedDate >= today;
};

export const validateTime = (time) => {
    return time && time.trim().length > 0;
};

export const validateAddress = (address) => {
    return address && address.trim().length >= 10;
};

export const validateNotes = (notes) => {
    return !notes || notes.length <= 500;
};

export const validatePrice = (price) => {
    return price && price > 0;
};

export const validateQuantity = (quantity) => {
    return quantity && quantity > 0 && Number.isInteger(quantity);
};

export const validateName = (name) => {
    // Only allows letters and spaces
    const nameRegex = /^[A-Za-z\s]+$/;
    return nameRegex.test(name);
}; 