"use client";

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ArrowLeft, ExternalLink, Globe } from 'lucide-react';
import Image from 'next/image';
import { NewsArticle } from '../NewsWidget'; // Assuming NewsArticle is exported from NewsWidget

interface ArticleViewerProps {
  article: NewsArticle;
  onClose: () => void;
}

const FallbackImage = () => (
  <div className="w-full h-full bg-slate-800 flex items-center justify-center">
    <Globe className="w-16 h-16 text-slate-500" />
  </div>
);

const ArticleViewer: React.FC<ArticleViewerProps> = ({ article, onClose }) => {
  const [imageError, setImageError] = useState(false);
  const handleImageError = () => setImageError(true);

  if (!article) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ backdropFilter: 'blur(0px)', backgroundColor: 'rgba(0,0,0,0)' }}
        animate={{ backdropFilter: 'blur(16px)', backgroundColor: 'rgba(10, 12, 16, 0.7)' }}
        exit={{ backdropFilter: 'blur(0px)', backgroundColor: 'rgba(0,0,0,0)' }}
        transition={{ duration: 0.3 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          className="relative w-full max-w-3xl max-h-[90vh] bg-slate-900/80 border border-slate-700 rounded-2xl shadow-2xl flex flex-col overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Close Button */}
          <button
            onClick={onClose}
            className="absolute top-3 right-3 z-20 p-2 text-slate-400 bg-slate-800/50 rounded-full hover:text-white hover:bg-slate-700/80 transition-all"
            aria-label="Close article preview"
          >
            <X size={20} />
          </button>

          {/* Image */}
          <div className="relative w-full h-64 md:h-80 flex-shrink-0">
            {article.urlToImage && !imageError ? (
              <Image
                src={article.urlToImage}
                alt={article.title}
                layout="fill"
                objectFit="cover"
                className="transform"
                onError={handleImageError}
              />
            ) : (
              <FallbackImage />
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/70 to-transparent"></div>
          </div>

          {/* Content */}
          <div className="flex flex-col flex-grow p-6 md:p-8 overflow-y-auto custom-scrollbar">
            <span className="font-semibold uppercase tracking-wider text-accent-primary text-sm">
              {article.source.name}
            </span>
            <h1 className="text-2xl md:text-3xl font-bold text-slate-50 mt-2">
              {article.title}
            </h1>
            <p className="text-sm text-slate-400 mt-2">
              {new Date(article.publishedAt).toLocaleString()}
            </p>
            <p className="mt-6 text-slate-300 leading-relaxed">
              {article.description || article.content || "No detailed description available. Click the button below to read the full story."}
            </p>
          </div>

          {/* Footer */}
          <div className="p-6 bg-slate-900/80 border-t border-slate-700 flex-shrink-0 flex flex-col sm:flex-row items-center justify-between gap-4">
             <button
              onClick={onClose}
              className="flex w-full sm:w-auto items-center justify-center gap-2 text-slate-300 hover:text-white transition-colors rounded-md px-4 py-2 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-900 focus:ring-accent-primary"
            >
              <ArrowLeft size={18} />
              <span>Back to News</span>
            </button>
            <a
              href={article.url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex w-full sm:w-auto items-center justify-center gap-2 bg-accent-primary text-on-accent rounded-md px-6 py-3 font-semibold hover:bg-accent-primary-hover focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-900 focus:ring-accent-primary transition-all shadow-lg"
            >
              <span>Read Full Story</span>
              <ExternalLink size={18} />
            </a>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default ArticleViewer;
