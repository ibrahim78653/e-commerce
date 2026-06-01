import React from 'react';
import { motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const CATEGORIES = [
    {
        id: 1,
        name: "Ladies' Wear",
        description: 'Elegant styles for every occasion',
        image: '/ladies_category.png',
        accent: '#A94A4A',
        query: '?category_id=1',
    },
    {
        id: 2,
        name: "Gents' Wear",
        description: 'Refined looks for the modern man',
        image: '/gents_category.png',
        accent: '#D4AF37',
        query: '?category_id=2',
    },
    {
        id: 3,
        name: "Kids' Wear",
        description: 'Playful & comfortable for little ones',
        image: '/kids_category.png',
        accent: '#9E7E47',
        query: '?category_id=3',
    },
];

const container = {
    hidden: {},
    show: { transition: { staggerChildren: 0.12 } },
};

const item = {
    hidden: { opacity: 0, y: 30 },
    show: { opacity: 1, y: 0, transition: { duration: 0.6, ease: 'easeOut' } },
};

const CategoryShowcase = () => {
    const navigate = useNavigate();

    return (
        <section className="py-10 bg-[#FDFBF7] md:hidden">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* Header */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.6 }}
                    className="text-center mb-8 md:mb-12"
                >
                    <p className="text-[10px] md:text-xs font-bold uppercase tracking-[0.3em] text-[#A94A4A] mb-2 md:mb-3">
                        Shop by Category
                    </p>
                    <h2
                        className="text-3xl md:text-5xl font-black text-gray-900 leading-tight"
                        style={{ fontFamily: '"Times New Roman", Times, serif' }}
                    >
                        Find Your Style
                    </h2>
                    <div className="mx-auto mt-3 md:mt-4 h-[2px] w-12 md:w-16 bg-gradient-to-r from-transparent via-[#A94A4A] to-transparent" />
                </motion.div>

                {/* Grid - 3 columns on all screen sizes, max-width restricted to make them smaller on desktop */}
                <motion.div
                    variants={container}
                    initial="hidden"
                    whileInView="show"
                    viewport={{ once: true }}
                    className="grid grid-cols-3 gap-3 md:gap-6 max-w-4xl mx-auto"
                >
                    {CATEGORIES.map((cat) => (
                        <motion.div
                            key={cat.id}
                            variants={item}
                            className="relative overflow-hidden rounded-xl md:rounded-2xl cursor-pointer group aspect-square w-full"
                            onClick={() => navigate(`/${cat.query}`)}
                            whileHover={{ scale: 1.02 }}
                            transition={{ duration: 0.3 }}
                        >
                            {/* Image */}
                            <img
                                src={cat.image}
                                alt={cat.name}
                                className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                            />

                            {/* Gradient overlay */}
                            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent" />

                            {/* Accent border on hover */}
                            <div
                                className="absolute inset-0 border rounded-xl md:rounded-2xl md:border-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                                style={{ borderColor: cat.accent }}
                            />

                            {/* Content */}
                            <div className="absolute bottom-0 left-0 right-0 p-3 md:p-6">
                                <motion.div
                                    initial={false}
                                    className="flex items-end justify-between"
                                >
                                    <div>
                                        <p className="text-[8px] md:text-xs font-bold uppercase tracking-[0.1em] md:tracking-[0.2em] mb-0.5 md:mb-1"
                                            style={{ color: cat.accent }}>
                                            Collection
                                        </p>
                                        <h3
                                            className="text-xs sm:text-base md:text-2xl font-black text-white leading-tight"
                                            style={{ fontFamily: '"Times New Roman", Times, serif' }}
                                        >
                                            {cat.name}
                                        </h3>
                                        <p className="hidden md:block text-white/60 text-xs md:text-sm mt-1 translate-y-2 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-300">
                                            {cat.description}
                                        </p>
                                    </div>
                                    <div
                                        className="hidden sm:flex p-2 md:p-3 rounded-full flex-shrink-0 ml-4 opacity-0 group-hover:opacity-100 translate-x-4 group-hover:translate-x-0 transition-all duration-300"
                                        style={{ background: cat.accent }}
                                    >
                                        <ArrowRight size={16} className="text-white" />
                                    </div>
                                </motion.div>
                            </div>
                        </motion.div>
                    ))}
                </motion.div>
            </div>
        </section>
    );
};

export default CategoryShowcase;
