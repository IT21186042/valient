import React from 'react';

function Spinner({ size = 'md', text = 'Loading...', className = '' }) {
    const sizeClasses = {
        sm: 'h-5 w-5',
        md: 'h-8 w-8',
        lg: 'h-12 w-12'
    };

    return (
        <div className={`flex flex-col items-center ${className}`}>
            <div className={`animate-spin rounded-full border-b-2 border-blue-600 ${sizeClasses[size]}`}></div>
            {text && <p className="mt-2 text-gray-600">{text}</p>}
        </div>
    );
}

export default Spinner; 