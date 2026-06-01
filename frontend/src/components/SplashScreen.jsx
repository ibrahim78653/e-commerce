import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const SplashScreen = ({ onComplete }) => {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    // Always show for 3 seconds on every page load
    const timer = setTimeout(() => {
      setIsVisible(false);
      if (onComplete) onComplete();
    }, 3000);

    return () => clearTimeout(timer);
  }, [onComplete]);

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          key="splash"
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.6, ease: 'easeInOut' }}
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 99999,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'linear-gradient(135deg, #1a0a00 0%, #3b1a05 40%, #2a1000 100%)',
          }}
        >
          {/* Soft radial glow behind logo */}
          <div style={{
            position: 'absolute',
            width: '380px',
            height: '380px',
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(212,175,55,0.18) 0%, transparent 70%)',
            pointerEvents: 'none',
          }} />

          {/* Logo */}
          <motion.img
            src="/logo-best.jpeg"
            alt="Burhani Collection Logo"
            initial={{ scale: 0.6, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.9, ease: 'easeOut' }}
            style={{
              width: '160px',
              height: '160px',
              borderRadius: '50%',
              objectFit: 'cover',
              border: '3px solid rgba(212,175,55,0.6)',
              boxShadow: '0 0 40px rgba(212,175,55,0.3)',
              marginBottom: '28px',
            }}
          />

          {/* Brand Name */}
          <motion.h1
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.5, duration: 0.8 }}
            style={{
              fontFamily: '"Times New Roman", Times, serif',
              fontSize: 'clamp(22px, 5vw, 38px)',
              letterSpacing: '0.35em',
              paddingLeft: '0.35em',
              padding: '0 20px',
              textAlign: 'center',
              color: '#D4AF37',
              textTransform: 'uppercase',
              margin: '0 0 10px 0',
              fontWeight: 700,
              textShadow: '0 2px 20px rgba(212,175,55,0.4)',
            }}
          >
            BURHANI COLLECTION
          </motion.h1>

          {/* Gold divider line */}
          <motion.div
            initial={{ scaleX: 0, opacity: 0 }}
            animate={{ scaleX: 1, opacity: 1 }}
            transition={{ delay: 1.0, duration: 0.7 }}
            style={{
              width: '120px',
              height: '1px',
              background: 'linear-gradient(90deg, transparent, #D4AF37, transparent)',
              margin: '0 0 12px 0',
            }}
          />

          {/* By HIH Coders */}
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.3, duration: 0.8 }}
            style={{
              fontFamily: '"Georgia", serif',
              fontSize: 'clamp(12px, 2vw, 15px)',
              color: 'rgba(212,175,55,0.75)',
              letterSpacing: '0.25em',
              paddingLeft: '0.25em',
              textAlign: 'center',
              fontStyle: 'italic',
              margin: 0,
            }}
          >
            BY HIH CODERS
          </motion.p>

          {/* Animated dots at bottom */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.8 }}
            style={{
              position: 'absolute',
              bottom: '48px',
              display: 'flex',
              gap: '10px',
            }}
          >
            {[0, 1, 2].map((i) => (
              <motion.div
                key={i}
                animate={{ scale: [1, 1.6, 1], opacity: [0.3, 1, 0.3] }}
                transition={{ repeat: Infinity, duration: 1.4, delay: i * 0.2 }}
                style={{
                  width: '8px',
                  height: '8px',
                  borderRadius: '50%',
                  background: '#D4AF37',
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
