import React from 'react';
import { Blueprint } from '../../types';
import { Star } from 'lucide-react';

interface BlueprintCardProps {
  blueprint: Blueprint;
  onClick: () => void;
}

const BlueprintCard: React.FC<BlueprintCardProps> = ({ blueprint, onClick }) => {
  return (
    <div onClick={onClick} className="group cursor-pointer flex flex-col gap-3">
      {/* Card Image Container */}
      <div className="relative aspect-[4/3] rounded-[1.5rem] overflow-hidden bg-gray-200 isolate">
        <img
          src={blueprint.thumbnailUrl}
          alt={blueprint.title}
          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
        />

        {/* Dark gradient for mobile readability */}
        <div className="absolute inset-0 bg-black/10 transition-opacity group-hover:bg-black/0"></div>

        {/* Badges - Floating on Image */}
        <div className="absolute top-3 left-3 flex gap-2">
          <div className="bg-white/90 backdrop-blur-md px-2.5 py-1 rounded-full flex items-center gap-1.5 shadow-sm">
            <div className="w-1.5 h-1.5 rounded-full bg-green-500"></div>
            <span className="text-[10px] font-bold text-gray-900 uppercase tracking-wide">
              Verified
            </span>
          </div>
        </div>

        {/* Mobile Only: Overlay Content (Hidden on Desktop) */}
        <div className="absolute inset-0 p-5 flex flex-col justify-end md:hidden bg-gradient-to-t from-black/80 via-black/20 to-transparent">
          <div className="flex items-center gap-2 mb-2">
            <div className="flex gap-1 flex-wrap">
              {blueprint.tags.slice(0, 2).map((tag) => (
                <span
                  key={tag}
                  className="text-[9px] font-bold text-white bg-white/20 backdrop-blur px-2 py-0.5 rounded-md uppercase"
                >
                  {tag}
                </span>
              ))}
            </div>
            <div className="flex items-center gap-1 ml-auto">
              <Star size={12} className="text-yellow-400" fill="currentColor" />
              <span className="text-xs font-bold text-white">{blueprint.rating.toFixed(1)}</span>
            </div>
          </div>
          <h3 className="text-lg font-bold text-white leading-tight mb-1">{blueprint.title}</h3>
          <p className="text-xs text-white/80 font-medium">{blueprint.creatorName}</p>
        </div>

        {/* Price Tag (Universal) */}
        <div className="absolute bottom-3 right-3 md:top-3 md:bottom-auto md:right-3">
          <div className="bg-black/80 backdrop-blur text-white px-3 py-1.5 rounded-xl font-bold text-xs shadow-lg group-hover:bg-black transition-colors">
            {blueprint.price} PLN
          </div>
        </div>
      </div>

      {/* Desktop Only: Clean Detail View Below Image */}
      <div className="hidden md:block space-y-2 px-1">
        <div className="flex justify-between items-start gap-4">
          <h3 className="text-lg font-bold text-gray-900 leading-tight group-hover:underline decoration-2 underline-offset-4 decoration-gray-200 transition-all line-clamp-2">
            {blueprint.title}
          </h3>
          <div className="flex items-center gap-1 shrink-0 mt-0.5">
            <Star size={14} className="text-black" fill="currentColor" />
            <span className="text-sm font-bold">{blueprint.rating.toFixed(1)}</span>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-gray-500">
            <img src={blueprint.creatorAvatar} className="w-5 h-5 rounded-full" alt="Creator" />
            <span className="text-xs font-medium">{blueprint.creatorName}</span>
          </div>
          <div className="text-xs text-gray-400 font-medium">{blueprint.region}</div>
        </div>

        {/* Tags Row */}
        <div className="flex gap-2 pt-1 opacity-60 group-hover:opacity-100 transition-opacity">
          {blueprint.tags.slice(0, 3).map((tag) => (
            <span
              key={tag}
              className="text-[10px] uppercase font-bold text-gray-500 tracking-wider"
            >
              {tag}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
};

export default BlueprintCard;
