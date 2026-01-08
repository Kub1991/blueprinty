import React from 'react';
import { Youtube, Search, Trash, Loader2 } from 'lucide-react';
import YouTubeVideoCard, { YouTubeVideo } from './Creator/YouTubeVideoCard';
import CreatorStats from './Creator/CreatorStats';
import { useCreatorVideos } from '../hooks/useCreatorVideos';
import { Id } from '../convex/_generated/dataModel';

interface CreatorDashboardProps {
  onVerifyClick: (blueprintId?: string, startInMap?: boolean) => void;
}

const CreatorDashboard: React.FC<CreatorDashboardProps> = ({ onVerifyClick }) => {
  const {
    channelUrl,
    setChannelUrl,
    isConnecting,
    videos,
    myBlueprints,
    userData,
    isConnected,
    hasMore,
    handleConnect,
    handleDisconnect,
    handleDeleteBlueprint,
    handleProcessVideo,
    handleLoadMore,
  } = useCreatorVideos();

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-12 pb-32 font-sans animate-in fade-in duration-700">
      {/* Header */}
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-gray-900 leading-none">Creator Studio</h1>
          <p className="text-gray-500 mt-2 font-medium">Zarządzaj swoją marką i planami</p>
        </div>
        <div className="flex -space-x-2">
          {[1, 2, 3].map(i => (
            <img key={i} src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${i + 10}`} className="w-8 h-8 rounded-full border-2 border-white shadow-sm" alt="Fan" />
          ))}
          <div className="w-8 h-8 rounded-full bg-gray-100 border-2 border-white shadow-sm flex items-center justify-center text-[10px] font-bold text-gray-400">+12k</div>
        </div>
      </div>

      {/* Stats Section (Extracted Component) */}
      <CreatorStats />

      {/* YouTube Feed Section */}
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-red-50 text-red-600 rounded-xl flex items-center justify-center">
              <Youtube size={24} />
            </div>
            <h3 className="text-xl font-black tracking-tight">Twój Feed YouTube</h3>
          </div>

          {!isConnected ? (
            <div className="flex gap-2 max-w-md w-full">
              <div className="relative flex-1 group">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4 transition group-focus-within:text-red-500" />
                <input
                  type="text"
                  placeholder="Wklej handle kanału (np. @BezPlanu)..."
                  className="w-full h-11 bg-gray-50 border border-gray-100 rounded-xl pl-10 pr-4 text-xs font-bold outline-none focus:bg-white focus:border-red-200 focus:ring-4 focus:ring-red-500/5 transition-all"
                  value={channelUrl}
                  onChange={(e) => setChannelUrl(e.target.value)}
                />
              </div>
              <button
                onClick={() => handleConnect()}
                disabled={isConnecting}
                className="bg-black text-white px-6 rounded-xl text-xs font-bold hover:bg-gray-800 transition disabled:opacity-50 flex items-center gap-2 whitespace-nowrap leading-none"
              >
                {isConnecting ? 'Łączenie...' : 'Połącz Kanał'}
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-3 bg-gray-50 px-4 py-2 rounded-xl border border-gray-100">
              <img src={userData?.avatarUrl || ""} className="w-6 h-6 rounded-full" alt="Creator" />
              <span className="text-xs font-bold">{userData?.youtubeChannelHandle}</span>
              <button
                onClick={handleDisconnect}
                className="text-[10px] font-bold text-gray-400 hover:text-red-500 uppercase tracking-tight transition-colors"
                title="Odłącz kanał i wyczyść filmy"
              >
                Odłącz
              </button>
            </div>
          )}
        </div>

        {isConnected ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 animate-in slide-in-from-bottom-4 duration-700">
            {videos?.map((video) => (
              <YouTubeVideoCard
                key={video._id}
                video={video}
                onProcess={(v) => handleProcessVideo(v, (blueprintId) => onVerifyClick(blueprintId))}
              />
            ))}
            {isConnected && hasMore && (
              <div className="col-span-full flex justify-center pt-4">
                <button
                  onClick={handleLoadMore}
                  disabled={isConnecting}
                  className="bg-gray-100 text-gray-700 px-8 py-3 rounded-xl text-sm font-bold hover:bg-gray-200 transition disabled:opacity-50 flex items-center gap-2"
                >
                  {isConnecting ? (
                    <>
                      <Loader2 className="animate-spin" size={16} />
                      Ładowanie...
                    </>
                  ) : (
                    'Załaduj więcej filmów'
                  )}
                </button>
              </div>
            )}
          </div>
        ) : (
          <div className="text-center py-16 text-gray-400 bg-gray-50/50 rounded-2xl border border-dashed border-gray-200">
            <Youtube className="mx-auto mb-4 opacity-30" size={48} />
            <p className="font-medium">Połącz swój kanał YouTube</p>
            <p className="text-xs mt-1">aby zaimportować filmy i generować plany podróży</p>
          </div>
        )}
      </div>

      {/* Blueprints Section */}
      <div className="space-y-6">
        <h3 className="text-xl font-black tracking-tight">Twoje Aktywne Plany (Sprzedaż)</h3>
        {myBlueprints && myBlueprints.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {myBlueprints.map((bp: any) => (
              <div
                key={bp._id}
                className="group relative bg-white border border-gray-100 rounded-2xl overflow-hidden shadow-sm hover:shadow-lg transition-all duration-300 cursor-pointer"
                onClick={() => onVerifyClick(bp._id, true)}
              >
                <div className="aspect-video relative">
                  <img src={bp.thumbnailUrl} className="w-full h-full object-cover" alt={bp.title} />
                  <div className="absolute top-3 left-3 flex gap-2">
                    {bp.status === 'published' && bp.creatorVerified && (
                      <span className="bg-emerald-500 text-white text-[10px] px-2 py-1 rounded-full font-bold uppercase tracking-tight">
                        Zweryfikowany
                      </span>
                    )}
                    {bp.status === 'published' && !bp.creatorVerified && (
                      <span className="bg-purple-500 text-white text-[10px] px-2 py-1 rounded-full font-bold uppercase tracking-tight">
                        AI Plan
                      </span>
                    )}
                    {bp.status === 'draft' && (
                      <span className="bg-amber-500 text-white text-[10px] px-2 py-1 rounded-full font-bold uppercase tracking-tight">
                        Wersja robocza
                      </span>
                    )}
                  </div>
                </div>
                <div className="p-4">
                  <h4 className="font-bold text-sm line-clamp-2">{bp.title}</h4>
                  <p className="text-xs text-gray-400 mt-1">{bp.points?.length || 0} punktów</p>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDeleteBlueprint(bp._id);
                  }}
                  className="absolute top-3 right-3 w-8 h-8 bg-red-500/80 backdrop-blur text-white rounded-full items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hidden group-hover:flex"
                  title="Usuń plan"
                >
                  <Trash size={14} />
                </button>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-16 text-gray-400 bg-gray-50/50 rounded-2xl border border-dashed border-gray-200">
            <p className="font-medium">Brak planów do wyświetlenia</p>
            <p className="text-xs mt-1">Przetwórz film z YouTube, aby wygenerować pierwszy plan</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default CreatorDashboard;