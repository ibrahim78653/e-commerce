import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const SplashScreen = ({ onComplete }) => {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(false);
      if (onComplete) onComplete();
    }, 5500); // Show for 5.5 seconds

    return () => clearTimeout(timer);
  }, [onComplete]);

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.8, ease: "easeInOut" }}
          className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-[#FAF3F3] text-[#4A4A4A]"
        >
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 1, ease: "easeOut" }}
            className="flex flex-col items-center text-center"
          >
            {/* Logo */}
            <motion.img
              src="/logo.jpeg"
              alt="Burhani Collection Logo"
              className="w-64 h-64 mb-8 object-cover rounded-full shadow-[0_0_40px_rgba(212,175,55,0.4)] border-4 border-[#D4AF37]"
              initial={{ y: 20, opacity: 0, scale: 0.8 }}
              animate={{ y: 0, opacity: 1, scale: 1 }}
              transition={{ delay: 0.2, duration: 1, ease: "easeOut" }}
            />

            {/* Main Title */}
            <motion.h1
              className="text-4xl md:text-5xl font-serif tracking-widest uppercase mb-2 text-[#4A4A4A] drop-shadow-sm"
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.6, duration: 0.8 }}
            >
              BURHANI COLLECTION
            </motion.h1>

            {/* Subtext */}
            <motion.p
              className="text-sm md:text-base tracking-[0.4em] font-medium uppercase mb-8 text-[#8B7355]"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1.2, duration: 1 }}
            >
              BY HIH
            </motion.p>

            {/* Decorative Divider */}
            <motion.div
              className="w-16 h-[2px] bg-gradient-to-r from-transparent via-[#D4AF37] to-transparent mb-6"
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: 64, opacity: 1 }}
              transition={{ delay: 1.8, duration: 0.8 }}
            />
            
            {/* Tagline */}
            <motion.p
              className="text-lg md:text-xl font-light italic text-[#8B7355]"
              initial={{ y: 10, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 2, duration: 1 }}
            >
              "Where Style Meets Tradition"
            </motion.p>
          </motion.div>

          {/* Loading Indicator */}
          <motion.div
            className="absolute bottom-12 flex space-x-3"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 2.5 }}
          >
            {[0, 1, 2].map((i) => (
              <motion.div
                key={i}
                className="w-2.5 h-2.5 bg-[#D4AF37] rounded-full"
                animate={{
                  scale: [1, 1.5, 1],
                  opacity: [0.3, 1, 0.3],
                }}
                transition={{
                  repeat: Infinity,
                  duration: 1.5,
                  delay: i * 0.2,
                }}
              />
            ))}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default SplashScreen;
