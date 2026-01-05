import React from 'react';

interface FilterRailProps {
    allTags: string[];
    selectedTag: string | null;
    onSelectTag: (tag: string | null) => void;
    selectedRegion: string | null;
    onSelectRegion: (region: string | null) => void;
}

const REGIONS = ['Europe', 'Asia', 'North America'];

const FilterRail: React.FC<FilterRailProps> = ({
    allTags,
    selectedTag,
    onSelectTag,
    selectedRegion,
    onSelectRegion,
}) => {
    return (
        <div className="pl-6 overflow-x-auto no-scrollbar md:pl-6">
            <div className="flex gap-2 pr-6 pb-2">
                {/* Region Filter Group */}
                {REGIONS.map((region) => {
                    const isActive = selectedRegion === region;
                    return (
                        <button
                            key={region}
                            onClick={() => onSelectRegion(isActive ? null : region)}
                            className={`flex-shrink-0 px-5 py-2.5 rounded-full text-xs font-bold transition-all duration-300 transform active:scale-95 hover:shadow-md border ${isActive
                                    ? 'bg-black text-white border-black shadow-lg shadow-black/20'
                                    : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300 shadow-sm'
                                }`}
                        >
                            {region}
                        </button>
                    );
                })}
                <div className="w-px h-8 bg-gray-200 mx-2 self-center"></div>
                {/* Tags Filter Group */}
                {allTags.map((tag) => {
                    const isActive = selectedTag === tag;
                    return (
                        <button
                            key={tag}
                            onClick={() => onSelectTag(isActive ? null : tag)}
                            className={`flex-shrink-0 px-5 py-2.5 rounded-full text-xs font-bold transition-all duration-300 transform active:scale-95 hover:shadow-md border ${isActive
                                    ? 'bg-black text-white border-black shadow-lg shadow-black/20'
                                    : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300 shadow-sm'
                                }`}
                        >
                            #{tag}
                        </button>
                    );
                })}
            </div>
        </div>
    );
};

export default FilterRail;
