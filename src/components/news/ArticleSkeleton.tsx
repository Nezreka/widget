import React from 'react';

const ShimmerBlock = () => (
  <div className="absolute inset-0 -translate-x-full animate-[shimmer_2s_infinite] bg-gradient-to-r from-transparent via-slate-700/50 to-transparent"></div>
);

interface ArticleSkeletonProps {
  isFeatured?: boolean;
}

const ArticleSkeleton: React.FC<ArticleSkeletonProps> = ({ isFeatured = false }) => {
  const imageHeight = isFeatured ? 'h-64' : 'h-40';
  const titleHeight = isFeatured ? 'h-6' : 'h-5';
  const textLines = isFeatured
    ? <>
        <div className="h-4 bg-slate-700 rounded w-full"></div>
        <div className="h-4 bg-slate-700 rounded w-5/6"></div>
      </>
    : <div className="h-4 bg-slate-700 rounded w-full"></div>;

  return (
    <div className="relative block p-4 rounded-xl bg-slate-800/80 overflow-hidden border border-slate-700/80">
      <div className="relative animate-pulse">
        {/* Image Placeholder */}
        <div className={`w-full mb-4 rounded-lg bg-slate-700 ${imageHeight}`}></div>
        {/* Text Placeholders */}
        <div className="space-y-3">
          <div className={`bg-slate-700 rounded w-3/4 ${titleHeight}`}></div>
          {textLines}
        </div>
      </div>
      <ShimmerBlock />
    </div>
  );
};

export default ArticleSkeleton;
