import React, { useState } from 'react';
import { Blueprint } from '../types';
import { POINT_COLORS, POINT_ICONS } from '../constants';
import { useBlueprintFilters, useDrawerGestures, useActivePoint } from '../hooks';
import {
  CreatorRail,
  FilterRail,
  BlueprintCard,
  ReviewList,
  PointTimeline,
  PointDetail,
  MapView,
} from './UserApp/index';
import {
  Search,
  SlidersHorizontal,
  X,
  Share2,
  Star,
  Lock,
  ArrowLeft,
  Check,
  ShieldCheck,
  Info,
} from 'lucide-react';
import { MOCK_REVIEWS } from '../data/mockData';

interface UserAppProps {
  onBackToHome: () => void;
}

const UserApp: React.FC<UserAppProps> = ({ onBackToHome }) => {
  const [selectedBlueprint, setSelectedBlueprint] = useState<Blueprint | null>(null);
  const [activeMode, setActiveMode] = useState(false);

  // Use custom hooks
  const {
    filters,
    setSearchQuery,
    setSelectedTag,
    setSelectedCreator,
    setSelectedRegion,
    resetFilters,
    hasActiveFilters,
    filteredBlueprints,
    allTags,
    uniqueCreators,
  } = useBlueprintFilters();

  const {
    sheetHeight,
    setSheetHeight,
    sheetRef,
    handleTouchStart,
    handleTouchMove,
    handleTouchEnd,
  } = useDrawerGestures(45);

  const { selectedPoint, selectPoint, clearSelection } = useActivePoint(setSheetHeight);

  // =========== SCREEN U1: DISCOVERY FEED ===========
  if (!selectedBlueprint) {
    return (
      <div className="pb-32 bg-gray-50 min-h-screen font-sans">
        {/* TOP NAVIGATION & SEARCH (Sticky Glass) */}
        <div className="sticky top-0 z-40 w-full">
          <div className="absolute inset-0 bg-white/80 backdrop-blur-xl border-b border-white/20 shadow-sm"></div>
          <div className="relative max-w-7xl mx-auto px-6 py-4 flex flex-col md:flex-row md:items-center gap-4 md:gap-8">
            {/* Header Row */}
            <div className="flex items-center justify-between md:w-auto">
              <div className="flex items-center gap-2 cursor-pointer" onClick={onBackToHome}>
                <div className="w-8 h-8 bg-black rounded-full flex items-center justify-center text-white font-bold text-xs tracking-tighter hover:scale-105 transition-transform">
                  BP
                </div>
                <h1 className="text-lg font-bold tracking-tight text-gray-900 hidden md:block">
                  Blueprinty
                </h1>
              </div>
              {/* Mobile User Profile (Hidden on Desktop) */}
              <div className="md:hidden w-9 h-9 rounded-full bg-gray-100 border border-gray-200 overflow-hidden cursor-pointer">
                <img
                  src="https://api.dicebear.com/7.x/avataaars/svg?seed=Felix"
                  alt="User"
                  className="w-full h-full object-cover"
                />
              </div>
            </div>

            {/* Search Bar Input */}
            <div className="flex gap-3 flex-1 w-full md:max-w-2xl">
              <div className="flex-1 relative group">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4 transition group-focus-within:text-black" />
                <input
                  type="text"
                  placeholder="Gdzie chcesz pojechać?"
                  className="w-full h-12 bg-gray-100/80 border border-transparent rounded-2xl pl-11 pr-4 text-sm font-medium placeholder:text-gray-400 focus:bg-white focus:border-black/10 focus:ring-4 focus:ring-black/5 focus:outline-none transition-all shadow-inner"
                  value={filters.searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <button
                onClick={resetFilters}
                className={`w-12 h-12 flex items-center justify-center rounded-2xl border transition-all duration-300 ${
                  hasActiveFilters
                    ? 'bg-black text-white border-black shadow-lg shadow-black/20'
                    : 'bg-white text-gray-900 border-gray-200 hover:bg-gray-50'
                }`}
              >
                <SlidersHorizontal size={18} strokeWidth={2.5} />
              </button>
            </div>

            {/* Desktop User Profile */}
            <div className="hidden md:flex items-center gap-3 ml-auto border-l border-gray-200 pl-6 h-8">
              <div className="text-right hidden lg:block">
                <p className="text-xs font-bold text-gray-900">Felix D.</p>
                <p className="text-xs text-gray-500 font-medium">Explorer Pro</p>
              </div>
              <div className="w-9 h-9 rounded-full bg-gray-100 border border-gray-200 overflow-hidden cursor-pointer hover:ring-2 hover:ring-black transition-all">
                <img
                  src="https://api.dicebear.com/7.x/avataaars/svg?seed=Felix"
                  alt="User"
                  className="w-full h-full object-cover"
                />
              </div>
            </div>
          </div>
        </div>

        {/* HERO FILTER SECTION */}
        <div className="space-y-6 pt-6 max-w-7xl mx-auto">
          <CreatorRail
            creators={uniqueCreators}
            selectedCreator={filters.selectedCreator}
            onSelectCreator={setSelectedCreator}
          />
          <FilterRail
            allTags={allTags}
            selectedTag={filters.selectedTag}
            onSelectTag={setSelectedTag}
            selectedRegion={filters.selectedRegion}
            onSelectRegion={setSelectedRegion}
          />
        </div>

        {/* CONTENT FEED */}
        <div className="px-6 mt-8 space-y-8 animate-in fade-in slide-in-from-bottom-8 duration-700 max-w-7xl mx-auto">
          <div className="flex items-center justify-between">
            <h2 className="text-xl md:text-2xl font-bold text-gray-900 tracking-tight">
              {filters.selectedRegion
                ? `Kierunek: ${filters.selectedRegion}`
                : 'Polecane dla Ciebie'}
            </h2>
            <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">
              {filteredBlueprints.length} PLANS
            </span>
          </div>

          {filteredBlueprints.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                <Search className="w-8 h-8 text-gray-300" />
              </div>
              <h3 className="text-lg font-bold text-gray-900">Brak wyników</h3>
              <p className="text-gray-500 text-sm mt-1 max-w-[200px]">
                Spróbuj zmienić filtry lub wyszukaj inny region.
              </p>
              <button
                onClick={resetFilters}
                className="mt-6 px-6 py-3 bg-black text-white rounded-xl text-sm font-bold shadow-lg hover:shadow-xl transition"
              >
                Wyczyść filtry
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
              {filteredBlueprints.map((bp) => (
                <BlueprintCard
                  key={bp.id}
                  blueprint={bp}
                  onClick={() => setSelectedBlueprint(bp)}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  // =========== SCREEN U2: BLUEPRINT PREVIEW ===========
  if (!activeMode && selectedBlueprint) {
    return (
      <div className="fixed inset-0 z-50 bg-white overflow-y-auto animate-in fade-in zoom-in-95 duration-500 font-sans">
        {/* Navigation & Actions (Floating Sticky) */}
        <div className="fixed top-0 left-0 right-0 z-[60] p-6 flex justify-between items-start pointer-events-none max-w-[1920px] mx-auto">
          <button
            onClick={() => setSelectedBlueprint(null)}
            className="pointer-events-auto w-12 h-12 bg-white/10 backdrop-blur-xl border border-white/20 rounded-full flex items-center justify-center text-white hover:bg-black hover:text-white hover:border-black transition-all duration-300 shadow-xl group"
          >
            <X size={24} className="group-hover:rotate-90 transition-transform duration-300" />
          </button>
          <button className="pointer-events-auto w-12 h-12 bg-white/10 backdrop-blur-xl border border-white/20 rounded-full flex items-center justify-center text-white hover:bg-white hover:text-black transition-all duration-300 shadow-xl">
            <Share2 size={20} />
          </button>
        </div>

        {/* HERO SECTION */}
        <div className="relative h-[75vh] w-full">
          <img
            src={selectedBlueprint.thumbnailUrl}
            className="w-full h-full object-cover"
            alt={selectedBlueprint.title}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-black/10"></div>

          {/* Play Button Mockup */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="w-24 h-24 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center border border-white/30 shadow-[0_0_60px_rgba(0,0,0,0.4)]">
              <div className="w-0 h-0 border-t-[16px] border-t-transparent border-l-[28px] border-l-white border-b-[16px] border-b-transparent ml-2"></div>
            </div>
          </div>

          {/* Bottom Content Overlay */}
          <div className="absolute bottom-0 left-0 w-full p-6 md:p-12 lg:p-16 max-w-7xl mx-auto">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
              <div className="space-y-4 max-w-3xl">
                <div className="flex gap-2 mb-4">
                  {selectedBlueprint.tags.map((tag) => (
                    <span
                      key={tag}
                      className="px-3 py-1 bg-white/20 backdrop-blur-md border border-white/10 text-white text-xs font-bold rounded-lg uppercase tracking-wider"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
                <h1 className="text-4xl md:text-5xl lg:text-7xl font-black text-white leading-[1.1] tracking-tight shadow-black drop-shadow-lg">
                  {selectedBlueprint.title}
                </h1>
                <div className="flex items-center gap-6 text-white pt-2">
                  <div className="flex items-center gap-3">
                    <img
                      src={selectedBlueprint.creatorAvatar}
                      className="w-10 h-10 rounded-full border-2 border-white"
                      alt={selectedBlueprint.creatorName}
                    />
                    <div className="flex flex-col">
                      <span className="font-bold text-base leading-none">
                        {selectedBlueprint.creatorName}
                      </span>
                      <span className="text-xs opacity-80 font-medium mt-1">Verified Creator</span>
                    </div>
                  </div>
                  <div className="w-px h-8 bg-white/20"></div>
                  <div className="flex items-center gap-2">
                    <Star size={20} className="text-yellow-400" fill="currentColor" />
                    <span className="text-xl font-bold">{selectedBlueprint.rating.toFixed(1)}</span>
                    <span className="text-sm opacity-60">(124 reviews)</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* CONTENT BODY */}
        <div className="max-w-7xl mx-auto px-6 md:px-12 py-16 pb-32 md:pb-16">
          <div className="grid grid-cols-1 lg:grid-cols-[1.5fr_1fr] gap-12 lg:gap-24 relative">
            {/* LEFT COLUMN */}
            <div className="space-y-16">
              {/* Description */}
              <div className="space-y-6">
                <h3 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                  <Info size={24} className="text-gray-400" />O tej podróży
                </h3>
                <p className="text-xl text-gray-600 leading-relaxed font-serif">
                  {selectedBlueprint.description}
                </p>
              </div>

              {/* Timeline Preview */}
              <div className="space-y-8">
                <div className="flex items-center justify-between border-b border-gray-100 pb-4">
                  <h3 className="text-2xl font-bold text-gray-900">Plan Podróży</h3>
                  <span className="text-xs font-bold bg-black text-white px-3 py-1.5 rounded-full uppercase tracking-wider">
                    {selectedBlueprint.points.length} Stopów
                  </span>
                </div>

                <div className="relative border-l-2 border-dashed border-gray-200 ml-4 space-y-12 pb-12">
                  {selectedBlueprint.points.slice(0, 3).map((point) => (
                    <div key={point.id} className="relative pl-10 group">
                      <div
                        className={`absolute -left-[17px] top-1 w-9 h-9 rounded-full border-4 border-white shadow-md flex items-center justify-center text-sm z-10 ${
                          POINT_COLORS[point.type]
                        }`}
                      >
                        {POINT_ICONS[point.type]}
                      </div>
                      <div>
                        <div className="flex items-center gap-3 mb-1">
                          <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">
                            Dzień {point.day || 1}
                          </span>
                          <div className="h-px bg-gray-100 flex-1"></div>
                        </div>
                        <h4 className="text-lg font-bold text-gray-900">{point.name}</h4>
                        <p className="text-gray-500 mt-2 leading-relaxed">{point.description}</p>
                      </div>
                    </div>
                  ))}

                  {/* Teaser Items (Blurred) */}
                  <div className="relative pl-10 opacity-40 blur-[2px] select-none grayscale space-y-12">
                    <div className="relative">
                      <div className="absolute -left-[17px] top-1 w-9 h-9 rounded-full bg-gray-200 border-4 border-white shadow-sm flex items-center justify-center text-sm z-10">
                        🔒
                      </div>
                      <div>
                        <h4 className="text-lg font-bold text-gray-900">Ukryty Wodospad</h4>
                        <p className="text-gray-500 mt-2">Dostępne po odblokowaniu...</p>
                      </div>
                    </div>
                    <div className="relative">
                      <div className="absolute -left-[17px] top-1 w-9 h-9 rounded-full bg-gray-200 border-4 border-white shadow-sm flex items-center justify-center text-sm z-10">
                        🔒
                      </div>
                      <div>
                        <h4 className="text-lg font-bold text-gray-900">Sekretna Plaża</h4>
                        <p className="text-gray-500 mt-2">Dostępne po odblokowaniu...</p>
                      </div>
                    </div>
                  </div>

                  <div className="absolute bottom-0 left-0 w-full h-40 bg-gradient-to-t from-white to-transparent pointer-events-none"></div>
                </div>
              </div>

              {/* Reviews */}
              <ReviewList reviews={MOCK_REVIEWS} />
            </div>

            {/* RIGHT COLUMN: Sticky Sidebar */}
            <div className="relative">
              <div className="sticky top-8 space-y-6">
                {/* Desktop Unlock Card */}
                <div className="hidden md:block bg-white rounded-[2rem] shadow-[0_20px_60px_-15px_rgba(0,0,0,0.1)] border border-gray-100 p-8">
                  <div className="flex justify-between items-start mb-6">
                    <div>
                      <span className="text-sm text-gray-400 font-bold uppercase tracking-wider block mb-1">
                        Cena Pakietu
                      </span>
                      <div className="flex items-baseline gap-1">
                        <span className="text-4xl font-black text-gray-900">
                          {selectedBlueprint.price}
                        </span>
                        <span className="text-xl font-bold text-gray-500">PLN</span>
                      </div>
                    </div>
                    <div className="bg-green-50 text-green-700 p-2 rounded-full">
                      <ShieldCheck size={24} />
                    </div>
                  </div>

                  <div className="space-y-4 mb-8">
                    <div className="flex items-center gap-3 text-sm text-gray-600">
                      <Check size={18} className="text-black" />
                      <span>Pełna, interaktywna mapa</span>
                    </div>
                    <div className="flex items-center gap-3 text-sm text-gray-600">
                      <Check size={18} className="text-black" />
                      <span>{selectedBlueprint.points.length} zweryfikowanych punktów</span>
                    </div>
                    <div className="flex items-center gap-3 text-sm text-gray-600">
                      <Check size={18} className="text-black" />
                      <span>Nawigacja Google Maps & Tips</span>
                    </div>
                    <div className="flex items-center gap-3 text-sm text-gray-600">
                      <Check size={18} className="text-black" />
                      <span>Dożywotni dostęp</span>
                    </div>
                  </div>

                  <button
                    onClick={() => setActiveMode(true)}
                    className="w-full bg-black text-white py-5 rounded-2xl font-bold text-lg hover:bg-gray-800 transition-all shadow-xl hover:shadow-2xl hover:-translate-y-1 active:scale-95 flex items-center justify-center gap-2 group"
                  >
                    <Lock size={20} className="group-hover:hidden" />
                    <span className="hidden group-hover:inline">Rozpocznij Podróż</span>
                    <span className="group-hover:hidden">Odblokuj</span>
                  </button>

                  <p className="text-center text-xs text-gray-400 mt-4 font-medium">
                    Bezpieczna płatność przez Stripe / BLIK
                  </p>
                </div>

                {/* Creator Mini Profile */}
                <div className="bg-gray-50 rounded-3xl p-6 flex items-center gap-4 border border-gray-100">
                  <img
                    src={selectedBlueprint.creatorAvatar}
                    className="w-12 h-12 rounded-full border border-gray-200"
                    alt="Creator"
                  />
                  <div>
                    <p className="text-xs text-gray-500 font-bold uppercase tracking-wider mb-0.5">
                      Stworzone przez
                    </p>
                    <p className="font-bold text-gray-900">{selectedBlueprint.creatorName}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* MOBILE STICKY BOTTOM ACTION BAR */}
        <div className="fixed bottom-0 left-0 right-0 z-[60] p-4 bg-white/90 backdrop-blur-xl border-t border-gray-200 shadow-[0_-10px_40px_rgba(0,0,0,0.1)] md:hidden pb-safe animate-in slide-in-from-bottom-full duration-500">
          <div className="flex items-center justify-between gap-4 max-w-md mx-auto">
            <div className="flex flex-col">
              <span className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">
                Cena za dostęp
              </span>
              <div className="flex items-baseline gap-1">
                <span className="text-2xl font-black text-gray-900">{selectedBlueprint.price}</span>
                <span className="text-sm font-bold text-gray-500">PLN</span>
              </div>
            </div>
            <button
              onClick={() => setActiveMode(true)}
              className="flex-1 bg-black text-white px-6 py-4 rounded-xl font-bold text-sm shadow-xl active:scale-95 transition-all flex items-center justify-center gap-2"
            >
              <Lock size={16} /> Odblokuj mapę
            </button>
          </div>
        </div>
      </div>
    );
  }

  // =========== SCREEN U3: ACTIVE TRIP MODE ===========
  if (activeMode && selectedBlueprint) {
    // Shared content for both Desktop Sidebar and Mobile Drawer
    const ActiveContent = () => (
      <>
        {selectedPoint ? (
          <PointDetail
            point={selectedPoint}
            blueprint={selectedBlueprint}
            onBack={() => clearSelection()}
          />
        ) : (
          <div className="px-8 pb-12 pt-6">
            <div className="mb-8 hidden md:block">
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-1">
                Twój Plan
              </span>
              <h2 className="text-3xl font-black text-gray-900 leading-none">
                {selectedBlueprint.title}
              </h2>
            </div>
            <PointTimeline
              points={selectedBlueprint.points}
              onSelectPoint={(point) => selectPoint(point)}
            />
          </div>
        )}
      </>
    );

    return (
      <div className="h-screen w-full flex flex-col md:flex-row relative bg-white font-sans overflow-hidden">
        {/* DESKTOP SIDEBAR */}
        <div className="hidden md:flex flex-col w-[400px] lg:w-[480px] h-full bg-white border-r border-gray-200 z-30 shadow-2xl relative overflow-hidden">
          {/* Sidebar Header */}
          <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-white z-20">
            <button
              onClick={() => setActiveMode(false)}
              className="flex items-center gap-2 text-sm font-bold text-gray-500 hover:text-black transition-colors"
            >
              <ArrowLeft size={16} /> Wyjdź
            </button>
            <div className="bg-black/5 px-3 py-1.5 rounded-full text-[10px] font-bold flex items-center gap-2">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              ACTIVE TRIP
            </div>
          </div>

          {/* Sidebar Content */}
          <div className="flex-1 overflow-y-auto">
            <ActiveContent />
          </div>
        </div>

        {/* MAP AREA */}
        <div className="flex-1 relative h-full">
          {/* Mobile Top Bar */}
          <div className="md:hidden absolute top-0 left-0 right-0 p-4 z-20 flex justify-between items-start pointer-events-none">
            <button
              onClick={() => setActiveMode(false)}
              className="pointer-events-auto bg-white/90 backdrop-blur-xl px-4 py-3 rounded-full shadow-[0_4px_12px_rgba(0,0,0,0.1)] text-xs font-bold hover:bg-white flex items-center gap-2 border border-white/50 transition-transform active:scale-95"
            >
              <ArrowLeft size={16} /> Wyjdź
            </button>
            <div className="bg-black/80 backdrop-blur-md text-white px-4 py-3 rounded-full shadow-lg text-xs font-bold flex items-center gap-2 pointer-events-auto animate-pulse">
              <div className="w-2 h-2 bg-green-400 rounded-full"></div>
              Live Map
            </div>
          </div>

          <MapView
            points={selectedBlueprint.points}
            selectedPoint={selectedPoint}
            onSelectPoint={(point) => selectPoint(point)}
            onClearSelection={() => clearSelection()}
          />
        </div>

        {/* MOBILE DRAWER */}
        <div
          ref={sheetRef}
          className="md:hidden absolute bottom-0 left-0 right-0 bg-white/90 backdrop-blur-2xl rounded-t-[2.5rem] shadow-[0_-10px_60px_rgba(0,0,0,0.15)] flex flex-col z-30 overflow-hidden border-t border-white/50"
          style={{
            height: `${sheetHeight}%`,
            transition: 'height 0.4s cubic-bezier(0.2, 0.8, 0.2, 1)',
          }}
        >
          {/* Drag Handle & Header */}
          <div
            className="w-full flex-shrink-0 cursor-grab active:cursor-grabbing bg-transparent pt-3 pb-2 touch-none relative z-50"
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
          >
            <div className="w-16 h-1.5 bg-gray-300 rounded-full mx-auto mb-4 opacity-70"></div>

            {/* Header Content */}
            <div className="px-8 pb-4 flex justify-between items-end border-b border-gray-100/50">
              {selectedPoint ? (
                <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      clearSelection();
                    }}
                    className="flex items-center gap-1 text-xs font-bold text-gray-500 mb-1 hover:text-black"
                  >
                    <ArrowLeft size={12} /> Wróć do listy
                  </button>
                  <h2 className="text-xl font-black text-gray-900 truncate max-w-[250px]">
                    {selectedPoint.name}
                  </h2>
                </div>
              ) : (
                <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-1">
                    Twój Plan
                  </span>
                  <h2 className="text-2xl font-black text-gray-900 leading-none">
                    {selectedBlueprint.title}
                  </h2>
                </div>
              )}

              {/* Visual Indicator of Height */}
              <div className="text-[10px] font-bold text-gray-400 bg-gray-100 px-2 py-1 rounded">
                {sheetHeight < 30 ? 'PEEK' : sheetHeight > 80 ? 'FULL' : 'MAP'}
              </div>
            </div>
          </div>

          {/* Scrollable Content Area */}
          <div className="flex-1 overflow-y-auto bg-transparent relative overscroll-contain">
            <ActiveContent />
          </div>
        </div>
      </div>
    );
  }

  return null;
};

export default UserApp;
