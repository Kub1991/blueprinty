import React from 'react';
import { Star } from 'lucide-react';

interface CreatorRailProps {
  creators: { name: string; avatar: string }[];
  selectedCreator: string | null;
  onSelectCreator: (name: string | null) => void;
}

const CreatorRail: React.FC<CreatorRailProps> = ({
  creators,
  selectedCreator,
  onSelectCreator,
}) => {
  return (
    <div className="pl-6 overflow-x-auto no-scrollbar pb-2 md:pl-6">
      <div className="flex gap-4 pr-6">
        {creators.map((creator) => {
          const isSelected = selectedCreator === creator.name;
          return (
            <button
              key={creator.name}
              onClick={() => onSelectCreator(isSelected ? null : creator.name)}
              className="flex flex-col items-center gap-2 group min-w-[72px]"
            >
              <div
                className={`relative p-[3px] rounded-full transition-all duration-300 ${
                  isSelected
                    ? 'bg-gradient-to-tr from-yellow-400 to-purple-600'
                    : 'bg-transparent group-hover:bg-gray-200'
                }`}
              >
                <div className="bg-white p-[2px] rounded-full">
                  <img
                    src={creator.avatar}
                    alt={creator.name}
                    className={`w-14 h-14 rounded-full object-cover border border-gray-100 transition-transform duration-300 ${
                      isSelected ? 'scale-95' : 'group-hover:scale-105'
                    }`}
                  />
                </div>
                {isSelected && (
                  <div className="absolute bottom-0 right-0 bg-black text-white rounded-full p-1 border-2 border-white">
                    <Star size={8} fill="white" />
                  </div>
                )}
              </div>
              <span
                className={`text-[11px] text-center truncate w-full ${
                  isSelected ? 'font-bold text-black' : 'font-medium text-gray-500'
                }`}
              >
                {creator.name}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default CreatorRail;
