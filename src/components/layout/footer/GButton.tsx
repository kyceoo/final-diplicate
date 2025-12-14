import React, { useState, useEffect, useRef } from 'react';

type TGButton = {
    onAdminFormOpen: () => void;
};

const GButton = ({ onAdminFormOpen }: TGButton) => {
    const [clickCount, setClickCount] = useState(0);
    const timeoutRef = useRef<NodeJS.Timeout | null>(null);

    useEffect(() => {
        return () => {
            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current);
            }
        };
    }, []);

    const handleClick = () => {
        // Clear existing timeout
        if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
        }

        const newCount = clickCount + 1;
        setClickCount(newCount);

        // If we've reached 4 clicks, open admin panel
        if (newCount >= 4) {
            onAdminFormOpen();
            setClickCount(0); // Reset count after opening
        } else {
            // Reset count after 2 seconds of no clicks
            timeoutRef.current = setTimeout(() => {
                setClickCount(0);
            }, 2000);
        }
    };

    return (
        <button
            className='app-footer__icon app-footer__g-button app-footer__admin-dot'
            onClick={handleClick}
            aria-label='Admin access'
            type='button'
        >
            <span className='app-footer__admin-dot-red'></span>
        </button>
    );
};

export default GButton;