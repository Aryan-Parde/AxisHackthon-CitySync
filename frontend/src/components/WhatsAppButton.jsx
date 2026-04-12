'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageCircle, X } from 'lucide-react';

export default function WhatsAppButton() {
  const [showTooltip, setShowTooltip] = useState(true);

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-3 font-[Inter,system-ui,sans-serif]">
      {/* "New Feature" Tooltip */}
      <AnimatePresence>
        {showTooltip && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="relative bg-white text-gray-900 px-4 py-3 rounded-2xl shadow-xl border border-gray-100 max-w-xs origin-bottom-right"
          >
            <button 
              onClick={() => setShowTooltip(false)}
              className="absolute -top-2 -right-2 bg-gray-900 text-white p-1 rounded-full hover:bg-gray-700 transition-colors"
            >
              <X className="w-3 h-3" />
            </button>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2 py-0.5 bg-[#25D366]/20 text-[#25D366] text-xs font-bold rounded-full uppercase tracking-wider">
                New Feature
              </span>
            </div>
            <p className="text-sm font-medium pr-2">
              Connect with us directly on WhatsApp! 
            </p>
            {/* Tooltip triangle tail */}
            <div className="absolute -bottom-2 right-6 w-4 h-4 bg-white border-b border-r border-gray-100 transform rotate-45"></div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main WhatsApp Button */}
      <a
        href="https://wa.me/14155238886"
        target="_blank"
        rel="noopener noreferrer"
        className="relative group flex items-center justify-center"
        onMouseEnter={() => setShowTooltip(false)}
      >
        {/* Pulse effect behind the button */}
        <span className="absolute w-full h-full rounded-full bg-[#25D366] opacity-30 animate-ping"></span>
        
        <div className="relative z-10 w-16 h-16 bg-[#25D366] hover:bg-[#20bd5a] text-white rounded-full flex items-center justify-center shadow-2xl transition-transform transform group-hover:scale-110 active:scale-95">
          <MessageCircle className="w-8 h-8 fill-current" />
        </div>
      </a>
    </div>
  );
}
