import { motion, AnimatePresence } from 'framer-motion';
import { useLocation } from 'react-router-dom';
import { useEffect, useState } from 'react';

const PageTransition = ({ children }) => {
    const location = useLocation();
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        setIsLoading(true);
        const timer = setTimeout(() => {
            setIsLoading(false);
        }, 1500); // Animation lasts 1.5 seconds

        return () => clearTimeout(timer);
    }, [location.pathname]);

    return (
        <>
            {/* Top Progress Bar */}
            <AnimatePresence>
                {isLoading && (
                    <motion.div
                        initial={{ width: 0, opacity: 1 }}
                        animate={{ width: '100%' }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 1.5, ease: "easeInOut" }}
                        className="fixed top-0 left-0 h-1 bg-gradient-to-r from-[#D4AF37] via-[#8B7355] to-[#D4AF37] z-[9999]"
                    />
                )}
            </AnimatePresence>

            {/* Subtle Floral Overlay while loading */}
            <AnimatePresence>
                {isLoading && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.3 }}
                        className="fixed inset-0 bg-[#FAF3F3]/60 backdrop-blur-[2px] z-[9998] flex items-center justify-center pointer-events-none"
                    >
                        <motion.div
                            animate={{ 
                                rotate: 360,
                                scale: [1, 1.15, 1]
                            }}
                            transition={{ 
                                rotate: { duration: 3, repeat: Infinity, ease: "linear" },
                                scale: { duration: 1.5, repeat: Infinity, ease: "easeInOut" }
                            }}
                            className="relative flex items-center justify-center"
                        >
                            {/* Symmetrical SVG Flower */}
                            <svg width="48" height="48" viewBox="0 0 100 100" className="text-[#D4AF37] opacity-90 drop-shadow-md">
                                <g fill="currentColor" transform="translate(50, 50)">
                                    <path d="M0,0 C-15,-45 15,-45 0,0" transform="rotate(0)" />
                                    <path d="M0,0 C-15,-45 15,-45 0,0" transform="rotate(45)" />
                                    <path d="M0,0 C-15,-45 15,-45 0,0" transform="rotate(90)" />
                                    <path d="M0,0 C-15,-45 15,-45 0,0" transform="rotate(135)" />
                                    <path d="M0,0 C-15,-45 15,-45 0,0" transform="rotate(180)" />
                                    <path d="M0,0 C-15,-45 15,-45 0,0" transform="rotate(225)" />
                                    <path d="M0,0 C-15,-45 15,-45 0,0" transform="rotate(270)" />
                                    <path d="M0,0 C-15,-45 15,-45 0,0" transform="rotate(315)" />
                                    <circle cx="0" cy="0" r="8" fill="#FAF3F3" />
                                    <circle cx="0" cy="0" r="4" fill="#8B7355" />
                                </g>
                            </svg>
                            
                            {/* Decorative Flower Ring */}
                            <div className="absolute inset-[-12px] border-[1.5px] border-[#8B7355] rounded-full border-dashed animate-[spin_4s_linear_infinite] opacity-40" />
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            <AnimatePresence mode="wait">
                <motion.div
                    key={location.pathname}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.4, ease: "easeOut" }}
                >
                    {children}
                </motion.div>
            </AnimatePresence>
        </>
    );
};

export default PageTransition;
