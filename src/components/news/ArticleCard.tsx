import React, { useState } from 'react';
import { motion, Variants } from 'framer-motion';
import Image from 'next/image';
import { Globe } from 'lucide-react'; // Using lucide-react for a clean icon

interface ArticleCardProps {
  article: {
    source: { name: string };
    title: string;
    description: string | null;
    url: string;
    urlToImage: string | null;
    publishedAt: string;
  };
  isFeatured?: boolean;
  showImages: boolean;
  showDescription: boolean;
}

const cardVariants: Variants = {
  initial: { opacity: 0, y: 20, scale: 0.98 },
  animate: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { type: 'spring', stiffness: 300, damping: 30 }
  },
  hover: {
    scale: 1.03,
    transition: { type: 'spring', stiffness: 400, damping: 20 }
  }
};

const imageVariants = {
  hover: {
    scale: 1.1,
  }
};

const FallbackImage = () => (
  <div className="w-full h-full bg-slate-800 flex items-center justify-center">
    <Globe className="w-10 h-10 text-slate-500" />
  </div>
);

const ArticleCard: React.FC<ArticleCardProps> = ({
  article,
  isFeatured = false,
  showImages,
  showDescription,
}) => {
  const [imageError, setImageError] = useState(false);
  const handleImageError = () => setImageError(true);

  return (
    <motion.a
      href={article.url}
      target="_blank"
      rel="noopener noreferrer"
      className="block rounded-xl overflow-hidden relative group border border-slate-700/80 bg-slate-800/50 backdrop-blur-xl shadow-lg h-full flex flex-col"
      variants={cardVariants}
      initial="initial"
      animate="animate"
      whileHover="hover"
      layout
    >
      {/* Image */}
      {showImages && (
        <motion.div
          className={`relative w-full overflow-hidden ${isFeatured ? 'h-64' : 'h-40'}`}
          variants={imageVariants}
        >
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
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
        </motion.div>
      )}

      {/* Content */}
      <div className="flex flex-col flex-grow p-4">
        <h3 className={`font-bold text-slate-50 group-hover:text-accent-primary transition-colors duration-200 ${isFeatured ? 'text-2xl' : 'text-lg'}`}>
          {article.title}
        </h3>
        {showDescription && article.description && (
          <p className={`mt-2 text-sm text-slate-300 flex-grow ${isFeatured ? 'line-clamp-3' : 'line-clamp-2'}`}>
            {article.description}
          </p>
        )}
        <div className="mt-auto pt-4 text-xs text-slate-400 flex justify-between items-center">
          <span className="font-semibold uppercase tracking-wider">{article.source.name}</span>
          <span>{new Date(article.publishedAt).toLocaleDateString()}</span>
        </div>
      </div>

      {/* Hover Accent */}
      <div className="absolute bottom-0 left-0 right-0 h-1 bg-accent-primary origin-left scale-x-0 group-hover:scale-x-100 transition-transform duration-300 ease-out"></div>
    </motion.a>
  );
};

export default ArticleCard;
