import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, ArrowRight, Sparkles } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const SLIDES = [
    {
        id: 1,
        title: 'Elevate Your\nStyle',
        subtitle: 'Where timeless tradition meets modern elegance.',
        cta: 'Explore Collection',
        image: 'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?q=80&w=2070&auto=format&fit=crop',
        accent: '#D4AF37',
        gradient: 'from-black/80 via-black/50 to-transparent',
        tag: 'New Arrivals',
    },
    {
        id: 2,
        title: 'Ladies\nCollection',
        subtitle: 'Crafted for the woman who knows her worth.',
        cta: 'Shop Ladies',
        image: 'https://images.unsplash.com/photo-1529139574466-a303027c1d8b?q=80&w=2070&auto=format&fit=crop',
        accent: '#E8C4C4',
        gradient: 'from-rose-950/80 via-rose-900/40 to-transparent',
        tag: 'Ladies Wear',
    },
    {
        id: 3,
        title: 'Timeless\nElegance',
        subtitle: 'Classic pieces for every occasion.',
        cta: 'Discover Now',
        image: 'https://images.unsplash.com/photo-1539109136881-3be0616acf4b?q=80&w=2070&auto=format&fit=crop',
        accent: '#C9A96E',
        gradient: 'from-neutral-950/80 via-neutral-900/40 to-transparent',
        tag: 'Bestsellers',
    },
    {
        id: 4,
        title: 'Gents\nCollection',
        subtitle: 'Bold, refined, and effortlessly sophisticated.',
        cta: 'Shop Gents',
        image: 'https://images.unsplash.com/photo-1617127365659-c47fa864d8bc?q=80&w=1974&auto=format&fit=crop',
        accent: '#A8B9C8',
        gradient: 'from-slate-950/80 via-slate-900/40 to-transparent',
        tag: 'Gents Wear',
    },
    {
        id: 5,
        title: 'Kids\nCollection',
        subtitle: 'Playful styles that grow with your little ones.',
        cta: 'Shop Kids',
        image: 'https://images.unsplash.com/photo-1622290291468-a28f7a7dc6a8?q=80&w=2072&auto=format&fit=crop',
        accent: '#B5D5C5',
        gradient: 'from-emerald-950/80 via-emerald-900/40 to-transparent',
        tag: 'Kids Wear',
    },
];

// Floating gold particle
const Particle = ({ delay, x, y, size }) => (
    <motion.div
        className="absolute rounded-full pointer-events-none"
        style={{
            width: size,
            height: size,
            left: `${x}%`,
            top: `${y}%`,
            background: 'radial-gradient(circle, rgba(212,175,55,0.8) 0%, transparent 70%)',
        }}
        animate={{
            y: [-10, 10, -10],
            opacity: [0.2, 0.6, 0.2],
            scale: [1, 1.2, 1],
        }}
        transition={{ duration: 3 + delay, repeat: Infinity, delay }}
    />
);

const PARTICLES = [
    { delay: 0, x: 80, y: 20, size: 6 },
    { delay: 0.5, x: 85, y: 60, size: 4 },
    { delay: 1, x: 90, y: 40, size: 8 },
    { delay: 1.5, x: 75, y: 75, size: 5 },
    { delay: 2, x: 92, y: 85, size: 3 },
];

const HeroCarousel = () => {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isHovered, setIsHovered] = useState(false);
    const [direction, setDirection] = useState(1);
    const navigate = useNavigate();

    useEffect(() => {
        if (isHovered) return;
        const timer = setInterval(() => {
            setDirection(1);
            setCurrentIndex((prev) => (prev + 1) % SLIDES.length);
        }, 5500);
        return () => clearInterval(timer);
    }, [isHovered]);

    const nextSlide = () => {
        setDirection(1);
        setCurrentIndex((prev) => (prev + 1) % SLIDES.length);
    };
    const prevSlide = () => {
        setDirection(-1);
        setCurrentIndex((prev) => (prev === 0 ? SLIDES.length - 1 : prev - 1));
    };

    const slide = SLIDES[currentIndex];

    const slideVariants = {
        enter: (dir) => ({ opacity: 0, scale: 1.08, x: dir > 0 ? 60 : -60 }),
        center: { opacity: 1, scale: 1, x: 0 },
        exit: (dir) => ({ opacity: 0, scale: 0.96, x: dir > 0 ? -60 : 60 }),
    };

    return (
        <div
            className="relative overflow-hidden group"
            style={{ height: 'calc(100vh - 64px)', minHeight: '520px' }}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
        >
            {/* Background Image */}
            <AnimatePresence custom={direction} mode="wait">
                <motion.div
                    key={`bg-${currentIndex}`}
                    custom={direction}
                    variants={slideVariants}
                    initial="enter"
                    animate="center"
                    exit="exit"
                    transition={{ duration: 0.85, ease: [0.25, 0.46, 0.45, 0.94] }}
                    className="absolute inset-0"
                >
                    <img
                        src={slide.image}
                        alt={slide.title}
                        className="w-full h-full object-cover object-center"
                    />
                    <div className={`absolute inset-0 bg-gradient-to-r ${slide.gradient}`} />
                    {/* Bottom vignette */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                </motion.div>
            </AnimatePresence>

            {/* Floating Gold Particles */}
            {PARTICLES.map((p, i) => (
                <Particle key={i} {...p} />
            ))}

            {/* BC Watermark */}
            <div
                className="absolute right-6 top-1/2 -translate-y-1/2 select-none pointer-events-none hidden lg:block"
                style={{
                    fontFamily: '"Times New Roman", Times, serif',
                    fontSize: '220px',
                    fontWeight: 900,
                    color: 'rgba(212,175,55,0.06)',
                    lineHeight: 1,
                    letterSpacing: '-0.04em',
                }}
            >
                BC
            </div>

            {/* Slide Counter + Tag */}
            <div className="absolute top-6 right-8 hidden md:flex flex-col items-end gap-2 z-20">
                <AnimatePresence mode="wait">
                    <motion.span
                        key={`tag-${currentIndex}`}
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 10 }}
                        className="text-xs font-bold uppercase tracking-[0.2em] px-3 py-1 rounded-full border"
                        style={{
                            color: slide.accent,
                            borderColor: `${slide.accent}50`,
                            background: `${slide.accent}15`,
                        }}
                    >
                        {slide.tag}
                    </motion.span>
                </AnimatePresence>
                <span className="text-white/40 text-sm font-mono">
                    {String(currentIndex + 1).padStart(2, '0')} / {String(SLIDES.length).padStart(2, '0')}
                </span>
            </div>

            {/* Main Text Content */}
            <div className="absolute inset-0 flex items-center z-10">
                <div className="max-w-7xl mx-auto px-6 sm:px-10 lg:px-16 w-full">
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={`text-${currentIndex}`}
                            initial={{ opacity: 0, y: 40 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            transition={{ duration: 0.65, delay: 0.15, ease: 'easeOut' }}
                            className="max-w-2xl"
                        >
                            {/* Gold accent line */}
                            <motion.div
                                initial={{ scaleX: 0 }}
                                animate={{ scaleX: 1 }}
                                transition={{ duration: 0.6, delay: 0.3 }}
                                className="h-[2px] w-16 mb-6 origin-left"
                                style={{ background: slide.accent }}
                            />

                            <h1
                                className="font-black text-white leading-[1.0] mb-5"
                                style={{
                                    fontFamily: '"Times New Roman", Times, serif',
                                    fontSize: 'clamp(52px, 9vw, 110px)',
                                    letterSpacing: '-0.02em',
                                    whiteSpace: 'pre-line',
                                    textShadow: '0 4px 40px rgba(0,0,0,0.4)',
                                }}
                            >
                                {slide.title}
                            </h1>

                            <p className="text-lg md:text-xl text-white/80 mb-10 font-light max-w-md leading-relaxed">
                                {slide.subtitle}
                            </p>

                            <div className="flex items-center gap-4">
                                <button
                                    onClick={() => {
                                        document.getElementById('products-section')?.scrollIntoView({ behavior: 'smooth' });
                                    }}
                                    className="group/btn flex items-center gap-3 px-8 py-4 rounded-full font-bold text-base transition-all duration-300 hover:scale-105 shadow-2xl"
                                    style={{
                                        background: slide.accent,
                                        color: '#1a0a00',
                                    }}
                                >
                                    <Sparkles size={18} />
                                    {slide.cta}
                                    <ArrowRight size={18} className="transition-transform group-hover/btn:translate-x-1" />
                                </button>
                                <button
                                    onClick={() => {
                                        document.getElementById('products-section')?.scrollIntoView({ behavior: 'smooth' });
                                    }}
                                    className="text-white/70 hover:text-white text-sm font-medium tracking-wide transition-colors border-b border-white/30 hover:border-white pb-0.5"
                                >
                                    View All
                                </button>
                            </div>
                        </motion.div>
                    </AnimatePresence>
                </div>
            </div>

            {/* Progress Bar */}
            <div className="absolute bottom-0 left-0 right-0 h-[3px] bg-white/10 z-20">
                <motion.div
                    key={currentIndex}
                    initial={{ scaleX: 0 }}
                    animate={{ scaleX: 1 }}
                    transition={{ duration: 5.5, ease: 'linear' }}
                    className="h-full origin-left"
                    style={{ background: slide.accent }}
                />
            </div>

            {/* Dot Indicators */}
            <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex gap-3 z-20">
                {SLIDES.map((s, idx) => (
                    <button
                        key={idx}
                        onClick={() => {
                            setDirection(idx > currentIndex ? 1 : -1);
                            setCurrentIndex(idx);
                        }}
                        className="rounded-full transition-all duration-300"
                        style={{
                            width: idx === currentIndex ? '32px' : '8px',
                            height: '8px',
                            background: idx === currentIndex ? slide.accent : 'rgba(255,255,255,0.35)',
                        }}
                        aria-label={`Slide ${idx + 1}`}
                    />
                ))}
            </div>

            {/* Nav Arrows */}
            <button
                onClick={prevSlide}
                className="absolute left-4 top-1/2 -translate-y-1/2 z-20 p-3 rounded-full border border-white/20 bg-black/20 text-white backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-all hover:bg-white hover:text-black focus:outline-none"
            >
                <ChevronLeft size={22} />
            </button>
            <button
                onClick={nextSlide}
                className="absolute right-4 top-1/2 -translate-y-1/2 z-20 p-3 rounded-full border border-white/20 bg-black/20 text-white backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-all hover:bg-white hover:text-black focus:outline-none"
            >
                <ChevronRight size={22} />
            </button>
        </div>
    );
};

export default HeroCarousel;
