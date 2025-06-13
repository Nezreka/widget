"use client";

import React from 'react';
import { motion } from 'framer-motion';

interface CategoryTabsProps {
  categories: string[];
  selectedCategory: string;
  onSelectCategory: (category: string) => void;
}

const CategoryTabs: React.FC<CategoryTabsProps> = ({ categories, selectedCategory, onSelectCategory }) => {
  return (
    <div className="flex-shrink-0 overflow-x-auto pb-2 -mx-4 px-4 custom-scrollbar-horizontal">
      <div className="flex items-center gap-2">
        {categories.map(cat => (
          <div
            key={cat}
            onClick={() => onSelectCategory(cat)}
            className={`relative cursor-pointer flex-shrink-0 px-4 py-2 rounded-full text-sm font-semibold transition-all duration-300 ease-in-out whitespace-nowrap
              ${selectedCategory === cat
                ? 'text-slate-50'
                : 'text-slate-400 hover:text-slate-200'
              }`}
          >
            {cat.charAt(0).toUpperCase() + cat.slice(1)}
            {selectedCategory === cat && (
              <motion.div
                className="absolute bottom-0 left-0 right-0 h-0.5 bg-accent-primary"
                layoutId="underline"
                initial={false}
                transition={{ type: 'spring', stiffness: 500, damping: 30 }}
              />
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default CategoryTabs;
