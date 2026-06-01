import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const SLIDES = [
    {
        id: 1,
        title: 'Elevate Your Style',
        subtitle: 'Discover our premium collection of handcrafted apparel.',
        image: 'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?q=80&w=2070&auto=format&fit=crop',
        color: 'from-black/70 to-black/30'
    },
    {
        id: 2,
        title: 'Summer Essentials',
        subtitle: 'Breathable, stylish, and perfect for the season.',
        image: 'https://images.unsplash.com/photo-1523381210434-271e8be1f52b?q=80&w=2070&auto=format&fit=crop',
        color: 'from-blue-900/70 to-blue-900/30'
    },
    {
        id: 3,
        title: 'Timeless Elegance',
        subtitle: 'Classic pieces that never go out of style.',
        image: 'https://images.unsplash.com/photo-1539109136881-3be0616acf4b?q=80&w=2070&auto=format&fit=crop',
        color: 'from-red-900/70 to-red-900/30'
    }
];

const HeroCarousel = () => {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isHovered, setIsHovered] = useState(false);
    const navigate = useNavigate();

    useEffect(() => {
        if (isHovered) return;
        const timer = setInterval(() => {
            setCurrentIndex((prev) => (prev + 1) % SLIDES.length);
        }, 5000);
        return () => clearInterval(timer);
    }, [isHovered]);

    const nextSlide = () => setCurrentIndex((prev) => (prev + 1) % SLIDES.length);
    const prevSlide = () => setCurrentIndex((prev) => (prev === 0 ? SLIDES.length - 1 : prev - 1));

    return (
        <div 
            className="relative h-[60vh] md:h-[70vh] lg:h-[80vh] w-full overflow-hidden bg-gray-900 group"
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
        >
            <AnimatePresence mode="wait">
                <motion.div
                    key={currentIndex}
                    initial={{ opacity: 0, scale: 1.05 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.7 }}
                    className="absolute inset-0"
                >
                    <img 
                        src={SLIDES[currentIndex].image} 
                        alt={SLIDES[currentIndex].title}
                        className="w-full h-full object-cover object-center"
                    />
                    <div className={`absolute inset-0 bg-gradient-to-r ${SLIDES[currentIndex].color}`} />
                </motion.div>
            </AnimatePresence>

            <div className="absolute inset-0 flex items-center">
                <div className="container mx-auto px-4 sm:px-6 lg:px-8">
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={`text-${currentIndex}`}
                            initial={{ opacity: 0, y: 30 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -30 }}
                            transition={{ duration: 0.5, delay: 0.2 }}
                            className="max-w-2xl text-white"
                        >
                            <h1 
                                className="text-5xl md:text-7xl font-black mb-4 tracking-tight leading-tight"
                                style={{ fontFamily: '"Times New Roman", Times, serif' }}
                            >
                                {SLIDES[currentIndex].title}
                            </h1>
                            <p className="text-lg md:text-2xl mb-8 text-gray-200 font-medium">
                                {SLIDES[currentIndex].subtitle}
                            </p>
                            <button 
                                onClick={() => {
                                    const productsSection = document.getElementById('products-section');
                                    if (productsSection) {
                                        productsSection.scrollIntoView({ behavior: 'smooth' });
                                    }
                                }}
                                className="group/btn flex items-center gap-2 bg-white text-black px-8 py-4 rounded-full font-bold text-lg transition-all hover:bg-red-600 hover:text-white hover:scale-105 shadow-xl"
                            >
                                Shop Collection
                                <ArrowRight size={20} className="transition-transform group-hover/btn:translate-x-1" />
                            </button>
                        </motion.div>
                    </AnimatePresence>
                </div>
            </div>

            {/* Navigation Arrows */}
            <button 
                onClick={prevSlide}
                className="absolute left-4 top-1/2 -translate-y-1/2 p-3 rounded-full bg-white/10 text-white backdrop-blur-sm border border-white/20 opacity-0 group-hover:opacity-100 transition-all hover:bg-white hover:text-black focus:outline-none"
            >
                <ChevronLeft size={24} />
            </button>
            <button 
                onClick={nextSlide}
                className="absolute right-4 top-1/2 -translate-y-1/2 p-3 rounded-full bg-white/10 text-white backdrop-blur-sm border border-white/20 opacity-0 group-hover:opacity-100 transition-all hover:bg-white hover:text-black focus:outline-none"
            >
                <ChevronRight size={24} />
            </button>

            {/* Indicators */}
            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-3">
                {SLIDES.map((_, idx) => (
                    <button
                        key={idx}
                        onClick={() => setCurrentIndex(idx)}
                        className={`w-12 h-1.5 rounded-full transition-all ${
                            idx === currentIndex ? 'bg-white' : 'bg-white/30 hover:bg-white/50'
                        }`}
                        aria-label={`Go to slide ${idx + 1}`}
                    />
                ))}
            </div>
        </div>
    );
};

export default HeroCarousel;
