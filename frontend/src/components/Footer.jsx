import React from 'react';
import { Link } from 'react-router-dom';
import { Facebook, Instagram, Twitter, MapPin, Phone, Mail, Sparkles } from 'lucide-react';

const Footer = () => {
    return (
        <footer className="bg-[#1a0a00] text-gray-300 pt-16 pb-8 border-t border-[#D4AF37]/20">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">
                    {/* Brand Column */}
                    <div className="space-y-4">
                        <div className="flex items-center space-x-3">
                            <span 
                                className="text-2xl font-bold tracking-widest text-[#D4AF37]"
                                style={{ fontFamily: '"Times New Roman", Times, serif' }}
                            >
                                BC
                            </span>
                            <span className="text-[#D4AF37]/40">|</span>
                            <span 
                                className="text-lg font-medium tracking-wide text-white uppercase"
                                style={{ fontFamily: '"Times New Roman", Times, serif' }}
                            >
                                Burhani
                            </span>
                        </div>
                        <p className="text-gray-400 text-sm leading-relaxed">
                            Curation of premium luxury attire designed to inspire confidence, elegance, and timeless style. Experience the craftsmanship of heritage collections.
                        </p>
                        <div className="flex space-x-4 pt-2">
                            <a href="#" className="text-gray-400 hover:text-[#D4AF37] transition-colors">
                                <Instagram size={20} />
                            </a>
                            <a href="#" className="text-gray-400 hover:text-[#D4AF37] transition-colors">
                                <Facebook size={20} />
                            </a>
                            <a href="#" className="text-gray-400 hover:text-[#D4AF37] transition-colors">
                                <Twitter size={20} />
                            </a>
                        </div>
                    </div>

                    {/* Quick Collections */}
                    <div>
                        <h4 
                            className="text-white text-base font-bold uppercase tracking-wider mb-6 flex items-center gap-1.5"
                            style={{ fontFamily: '"Times New Roman", Times, serif' }}
                        >
                            <Sparkles size={16} className="text-[#D4AF37]" />
                            Collections
                        </h4>
                        <ul className="space-y-3 text-sm">
                            <li>
                                <Link to="/?category_id=1" className="text-gray-400 hover:text-[#D4AF37] transition-colors">
                                    Ladies' Wear
                                </Link>
                            </li>
                            <li>
                                <Link to="/?category_id=2" className="text-gray-400 hover:text-[#D4AF37] transition-colors">
                                    Gents' Wear
                                </Link>
                            </li>
                            <li>
                                <Link to="/?category_id=3" className="text-gray-400 hover:text-[#D4AF37] transition-colors">
                                    Kids' Wear
                                </Link>
                            </li>
                        </ul>
                    </div>

                    {/* Customer Support */}
                    <div>
                        <h4 
                            className="text-white text-base font-bold uppercase tracking-wider mb-6"
                            style={{ fontFamily: '"Times New Roman", Times, serif' }}
                        >
                            Customer Care
                        </h4>
                        <ul className="space-y-3 text-sm">
                            <li>
                                <Link to="/orders" className="text-gray-400 hover:text-[#D4AF37] transition-colors">
                                    Track Order
                                </Link>
                            </li>
                            <li>
                                <Link to="/profile" className="text-gray-400 hover:text-[#D4AF37] transition-colors">
                                    My Account
                                </Link>
                            </li>
                            <li>
                                <Link to="/wishlist" className="text-gray-400 hover:text-[#D4AF37] transition-colors">
                                    Wishlist
                                </Link>
                            </li>
                        </ul>
                    </div>

                    {/* Boutique Info */}
                    <div className="space-y-4">
                        <h4 
                            className="text-white text-base font-bold uppercase tracking-wider mb-6"
                            style={{ fontFamily: '"Times New Roman", Times, serif' }}
                        >
                            Boutique
                        </h4>
                        <ul className="space-y-3 text-sm text-gray-400">
                            <li className="flex items-start gap-2.5">
                                <MapPin size={18} className="text-[#D4AF37] flex-shrink-0 mt-0.5" />
                                <span>Burhani Collection, Main Street, India</span>
                            </li>
                            <li className="flex items-center gap-2.5">
                                <Phone size={18} className="text-[#D4AF37] flex-shrink-0" />
                                <span>+91 98765 43210</span>
                            </li>
                            <li className="flex items-center gap-2.5">
                                <Mail size={18} className="text-[#D4AF37] flex-shrink-0" />
                                <span>support@burhanicollection.com</span>
                            </li>
                        </ul>
                    </div>
                </div>

                {/* Divider Line */}
                <div className="border-t border-[#D4AF37]/10 pt-8 mt-8 flex flex-col sm:flex-row items-center justify-between text-xs text-gray-500">
                    <p>© {new Date().getFullYear()} Burhani Collection. All Rights Reserved.</p>
                    <p className="mt-2 sm:mt-0 tracking-widest uppercase text-[#D4AF37]/50 font-bold">
                        Crafted For Excellence
                    </p>
                </div>
            </div>
        </footer>
    );
};

export default Footer;
