/**
 * About Page - Luxury Redesign
 * Burhani Collection — Premium Boutique
 */
import React from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Sparkles, Star, Shield, Heart } from 'lucide-react';

const promises = [
    {
        icon: Star,
        title: 'Unmatched Quality',
        desc: 'Every piece is hand-curated from premium fabrics, tailored with meticulous craftsmanship for a flawless finish.',
        color: '#D4AF37',
    },
    {
        icon: Sparkles,
        title: 'Timeless Style',
        desc: 'Blending heritage aesthetics with modern silhouettes, our designs speak to both tradition and contemporary elegance.',
        color: '#A94A4A',
    },
    {
        icon: Shield,
        title: 'Heritage Service',
        desc: 'We stand behind every purchase with dedicated support, effortless returns, and a commitment to your satisfaction.',
        color: '#9E7E47',
    },
    {
        icon: Heart,
        title: 'Crafted with Love',
        desc: 'Born from a passion for fashion, each collection is assembled with care for you and the ones you love.',
        color: '#D4AF37',
    },
];

const About = () => {
    return (
        <div className="min-h-screen bg-[#FDFBF7]">

            {/* ── Hero Section ─────────────────────────────────────────────── */}
            <div className="relative bg-[#1a0a00] overflow-hidden">
                {/* Decorative background pattern */}
                <div className="absolute inset-0 opacity-[0.04]"
                    style={{
                        backgroundImage: `repeating-linear-gradient(45deg, #D4AF37 0, #D4AF37 1px, transparent 0, transparent 50%)`,
                        backgroundSize: '20px 20px',
                    }}
                />
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-[#D4AF37]/8 rounded-full blur-3xl" />

                <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-20 md:py-28 text-center">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.7 }}
                    >
                        <p className="text-[#D4AF37] text-xs font-bold uppercase tracking-[0.4em] mb-5">
                            Est. 2026 · Our Story
                        </p>
                        <h1
                            className="text-4xl md:text-6xl font-black text-[#FDFBF7] leading-tight mb-6"
                            style={{ fontFamily: '"Times New Roman", Times, serif' }}
                        >
                            About Burhani<br />
                            <span className="text-[#D4AF37]">Collection</span>
                        </h1>
                        <div className="w-16 h-[2px] bg-gradient-to-r from-transparent via-[#D4AF37] to-transparent mx-auto mb-6" />
                        <p className="text-gray-400 text-base md:text-lg leading-relaxed max-w-2xl mx-auto">
                            Your premium destination for exquisite Ladies', Gents', and Kids' wear — where elegance meets tradition.
                        </p>
                    </motion.div>
                </div>
            </div>

            {/* ── Story Section ─────────────────────────────────────────────── */}
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-24">
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.7 }}
                    className="text-center mb-16"
                >
                    <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-[#A94A4A] mb-3">Who We Are</p>
                    <h2
                        className="text-3xl md:text-4xl font-black text-[#1a0a00] mb-6"
                        style={{ fontFamily: '"Times New Roman", Times, serif' }}
                    >
                        Fashion for Everyone
                    </h2>
                    <div className="space-y-4 text-gray-600 text-sm md:text-base leading-relaxed max-w-2xl mx-auto">
                        <p>
                            Welcome to <strong className="text-[#1a0a00]">Burhani Collection</strong>, founded in 2026 with a single,
                            unwavering mission — to bring premium, curated fashion to every household. What started as a passion
                            for beautiful clothing has grown into a boutique brand trusted by thousands.
                        </p>
                        <p>
                            Every piece in our collection is thoughtfully selected, honouring the rich textile heritage of our
                            culture while embracing contemporary design. We believe that style should be accessible, quality should
                            be non-negotiable, and shopping should be a joy.
                        </p>
                        <p>
                            We hope you enjoy our products as much as we enjoy curating them. If you have any questions or feedback,
                            we'd love to hear from you.
                        </p>
                    </div>
                </motion.div>

                {/* ── Divider ──────────────────────────────────────────────── */}
                <div className="flex items-center gap-4 mb-16">
                    <div className="flex-1 h-px bg-gradient-to-r from-transparent to-[#D4AF37]/30" />
                    <Sparkles size={18} className="text-[#D4AF37]" />
                    <div className="flex-1 h-px bg-gradient-to-l from-transparent to-[#D4AF37]/30" />
                </div>

                {/* ── Promises Grid ─────────────────────────────────────────── */}
                <motion.div
                    initial={{ opacity: 0 }}
                    whileInView={{ opacity: 1 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.6 }}
                    className="mb-16"
                >
                    <div className="text-center mb-10">
                        <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-[#A94A4A] mb-2">Our Promise</p>
                        <h2
                            className="text-3xl font-black text-[#1a0a00]"
                            style={{ fontFamily: '"Times New Roman", Times, serif' }}
                        >
                            Why Choose Us
                        </h2>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                        {promises.map(({ icon: Icon, title, desc, color }, i) => (
                            <motion.div
                                key={title}
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ duration: 0.5, delay: i * 0.1 }}
                                className="group bg-white rounded-2xl border border-[#D4AF37]/15 hover:border-[#D4AF37]/40 p-6 shadow-sm hover:shadow-lg hover:shadow-[#1a0a00]/5 transition-all duration-300"
                            >
                                <div
                                    className="w-11 h-11 rounded-xl flex items-center justify-center mb-4 transition-transform duration-300 group-hover:scale-110"
                                    style={{ background: `${color}15` }}
                                >
                                    <Icon size={20} style={{ color }} />
                                </div>
                                <h3
                                    className="font-bold text-[#1a0a00] text-lg mb-2"
                                    style={{ fontFamily: '"Times New Roman", Times, serif' }}
                                >
                                    {title}
                                </h3>
                                <p className="text-gray-500 text-sm leading-relaxed">{desc}</p>
                            </motion.div>
                        ))}
                    </div>
                </motion.div>

                {/* ── CTA ──────────────────────────────────────────────────── */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.6 }}
                    className="text-center bg-[#1a0a00] rounded-3xl p-10 border border-[#D4AF37]/20"
                >
                    <p className="text-[#D4AF37] text-xs font-bold uppercase tracking-[0.3em] mb-3">Begin Your Journey</p>
                    <h2
                        className="text-2xl md:text-3xl font-black text-[#FDFBF7] mb-4"
                        style={{ fontFamily: '"Times New Roman", Times, serif' }}
                    >
                        Discover Our Collection
                    </h2>
                    <p className="text-gray-400 text-sm mb-7 max-w-md mx-auto">
                        From everyday elegance to festive grandeur, explore styles crafted for every moment.
                    </p>
                    <Link
                        to="/"
                        className="inline-flex items-center gap-2 px-8 py-3.5 bg-[#D4AF37] text-[#1a0a00] font-black text-sm uppercase tracking-[0.15em] rounded-full hover:bg-[#c9a832] transition-all duration-300 shadow-lg shadow-[#D4AF37]/20 hover:shadow-xl"
                    >
                        <Sparkles size={16} />
                        Shop Now
                    </Link>
                </motion.div>
            </div>
        </div>
    );
};

export default About;
