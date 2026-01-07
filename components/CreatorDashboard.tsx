import React, { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { Wallet, Clock, ArrowRight, PlayCircle, Map, TrendingUp, Youtube, Search, Sparkles, Loader2, Trash } from 'lucide-react';
import YouTubeVideoCard, { YouTubeVideo } from './Creator/YouTubeVideoCard';
import { useQuery, useMutation, useAction } from 'convex/react';
import { api } from '../convex/_generated/api';
import { Id } from '../convex/_generated/dataModel';

interface CreatorDashboardProps {
  onVerifyClick: (blueprintId?: string, startInMap?: boolean) => void;
}

const data = [
  { name: 'Pon', sales: 120 },
  { name: 'Wt', sales: 200 },
  { name: 'Śr', sales: 150 },
  { name: 'Czw', sales: 300 },
  { name: 'Pt', sales: 250 },
  { name: 'Sob', sales: 380 },
  { name: 'Ndz', sales: 420 },
];

const CreatorDashboard: React.FC<CreatorDashboardProps> = ({ onVerifyClick }) => {
  const [channelUrl, setChannelUrl] = useState('');
  const [isConnecting, setIsConnecting] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<Id<"users"> | null>(null);

  // Convex Hooks
  const videos = useQuery(api.videos.listByUser, currentUserId ? { userId: currentUserId } : "skip") as YouTubeVideo[] | undefined;
  const createUser = useMutation(api.users.create);
  const disconnectChannel = useMutation(api.users.disconnectYouTubeChannel);
  const clearVideos = useMutation(api.videos.clearUserVideos);
  const deleteBlueprint = useMutation(api.blueprints.remove);

  const myBlueprints = useQuery(api.blueprints.listByUser, currentUserId ? { userId: currentUserId } : "skip");
  const fetchChannelVideosAction = useAction(api.actions.ytProcessor.fetchChannelVideos);
  const processVideoAction = useAction(api.actions.ytProcessor.processVideo);

  // Get current user
  const userData = useQuery(api.users.get, currentUserId ? { userId: currentUserId } : "skip");

  useEffect(() => {
    const storedId = localStorage.getItem("blueprinty_user_id");

    if (storedId) {
      setCurrentUserId(storedId as Id<"users">);
    } else {
      createUser({ name: "Felix D.", avatarUrl: "https://api.dicebear.com/7.x/avataaars/svg?seed=Felix" })
        .then(id => {
          localStorage.setItem("blueprinty_user_id", id);
          setCurrentUserId(id);
        });
    }
  }, [createUser]);

  // Handle cases where ID exists but document was deleted
  useEffect(() => {
    if (currentUserId && userData === null) {
      console.warn("User ID not found in database, resetting...");
      localStorage.removeItem("blueprinty_user_id");
      setCurrentUserId(null); // This will trigger the first useEffect to create a new user
    }
  }, [currentUserId, userData]);

  const handleConnect = async (isLoadMore = false) => {
    // If loading more, ALWAYS use the stored connected handle to match the page token.
    // Otherwise, prefer input, fall back to stored.
    const handleToUse = isLoadMore
      ? userData?.youtubeChannelHandle
      : (channelUrl || userData?.youtubeChannelHandle);

    if (!currentUserId || !handleToUse) return;

    setIsConnecting(true);

    try {
      const handle = handleToUse.includes('youtube.com/')
        ? `@${handleToUse.split('/').pop()}`
        : (handleToUse.startsWith('@') ? handleToUse : `@${handleToUse}`);

      await fetchChannelVideosAction({
        userId: currentUserId,
        channelHandle: handle,
        loadMore: isLoadMore
      });

    } catch (e) {
      console.error("Failed to fetch videos", e);
      alert("Failed to fetch channel data.");
    } finally {
      setIsConnecting(false);
    }
  };

  const handleDisconnect = async () => {
    if (!currentUserId) return;
    if (confirm("Czy na pewno chcesz odłączyć kanał i usunąć zaimportowane filmy? Plany podróży pozostaną nienaruszone.")) {
      try {
        await disconnectChannel({ userId: currentUserId });
        await clearVideos({ userId: currentUserId });
        setChannelUrl('');
      } catch (e) {
        console.error("Failed to disconnect", e);
      }
    }
  };

  const handleDeleteBlueprint = async (id: Id<"blueprints">) => {
    if (confirm("Czy na pewno chcesz usunąć ten plan? Zniknie on również z widoku podróżników.")) {
      try {
        await deleteBlueprint({ blueprintId: id });
      } catch (e) {
        console.error("Failed to delete blueprint", e);
      }
    }
  };

  const handleProcessVideo = async (video: YouTubeVideo) => {
    console.log("Processing video:", video);
    try {
      const result: any = await (processVideoAction as any)({
        videoId: video._id as Id<"videos">,
        youtubeUrl: `https://youtube.com/watch?v=${video.youtubeVideoId}`
      });

      console.log("AI Result:", result);
      if (result.success && result.blueprintId) {
        onVerifyClick(result.blueprintId);
      }
    } catch (e) {
      console.error("AI Processing failed", e);
      alert("AI Processing failed. Check your API keys and ensure video has transcript.");
    }
  };

  const handleLoadMore = () => handleConnect(true);

  const isConnected = !!userData?.youtubeChannelHandle;
  const hasMore = !!userData?.nextPageToken;

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-12 pb-32 font-sans animate-in fade-in duration-700">
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

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-black text-white p-8 rounded-[2rem] shadow-2xl relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:scale-110 group-hover:rotate-12 transition-transform duration-700">
            <Wallet size={160} />
          </div>
          <div className="relative z-10">
            <p className="text-xs text-gray-400 uppercase font-black tracking-[0.2em]">Dostępne środki</p>
            <div className="flex items-baseline gap-2 mt-2">
              <h2 className="text-5xl font-black tracking-tighter">3 450</h2>
              <span className="text-xl font-bold text-gray-500">PLN</span>
            </div>
            <div className="flex gap-3 mt-8">
              <button className="bg-white text-black px-8 py-3 rounded-2xl font-bold text-sm hover:shadow-[0_0_30px_rgba(255,255,255,0.3)] transition-all active:scale-95 leading-none">
                Wypłać
              </button>
              <button className="bg-white/10 backdrop-blur border border-white/20 text-white px-8 py-3 rounded-2xl font-bold text-sm hover:bg-white/20 transition-all leading-none">
                Historia
              </button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4">
          <div className="bg-white border border-gray-100 p-6 rounded-[2rem] shadow-sm flex items-center gap-4 hover:shadow-md transition group">
            <div className="w-14 h-14 rounded-2xl bg-blue-50 flex items-center justify-center text-blue-600 transition-transform group-hover:scale-110">
              <Map size={28} />
            </div>
            <div>
              <p className="text-[10px] text-gray-400 font-black uppercase tracking-[0.1em]">Opublikowane</p>
              <h3 className="text-3xl font-black">14</h3>
            </div>
          </div>
          <div className="bg-white border border-gray-100 p-6 rounded-[2rem] shadow-sm flex items-center gap-4 hover:shadow-md transition group">
            <div className="w-14 h-14 rounded-2xl bg-green-50 flex items-center justify-center text-green-600 transition-transform group-hover:scale-110">
              <TrendingUp size={28} />
            </div>
            <div>
              <p className="text-[10px] text-gray-400 font-black uppercase tracking-[0.1em]">Zarobki (30D)</p>
              <h3 className="text-3xl font-black">48.2k</h3>
            </div>
          </div>
        </div>
      </div>

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
              <YouTubeVideoCard key={video._id} video={video} onProcess={handleProcessVideo} />
            ))}
            {isConnected && hasMore && (
              <div className="col-span-full flex justify-center pt-4">
                <button
                  onClick={handleLoadMore}
                  disabled={isConnecting}
                  className="bg-gray-100 text-gray-900 px-8 py-3 rounded-2xl font-bold text-sm hover:bg-gray-200 transition-all active:scale-95 flex items-center gap-2 group"
                >
                  {isConnecting ? (
                    <Loader2 size={16} className="animate-spin" />
                  ) : (
                    <Sparkles size={16} className="text-purple-500 group-hover:rotate-12 transition-transform" />
                  )}
                  Pobierz więcej filmów
                </button>
              </div>
            )}
            {(!videos || videos.length === 0) && (
              <div className="col-span-full py-20 text-center text-gray-400">
                <Loader2 size={32} className="animate-spin mx-auto mb-4 opacity-20" />
                <p className="font-bold">Skanowanie kanału...</p>
              </div>
            )}
          </div>
        ) : (
          <div className="bg-gray-50/50 border-2 border-dashed border-gray-200 rounded-[2rem] p-12 text-center space-y-4">
            <div className="w-16 h-16 bg-white rounded-2xl shadow-xl flex items-center justify-center mx-auto text-gray-300">
              <Youtube size={32} />
            </div>
            <div>
              <h4 className="font-bold text-gray-900">Połącz swój kanał</h4>
              <p className="text-sm text-gray-500 max-w-xs mx-auto">AI przeanalizuje Twoje materiały i przygotuje gotowe propozycje planów podróży.</p>
            </div>
          </div>
        )}
      </div>

      {/* JEDYNA SEKCJA: Wszystkie Plany (Sprzedaż i Weryfikacja) */}
      <div className="space-y-4 pt-4">
        <h3 className="text-xl font-black tracking-tight flex items-center gap-2">
          Twoje Plany Podróży
          <span className="text-xs font-medium text-gray-400 font-sans tracking-normal">(AI & Premium)</span>
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {myBlueprints?.map((bp) => (
            <div key={bp._id} className="bg-white border border-gray-100 rounded-2xl p-4 flex items-center gap-4 hover:shadow-md transition group overflow-hidden relative">
              {/* Subtle top indicator based on status/verification */}
              <div className={`absolute top-0 left-0 w-full h-1 ${bp.creatorVerified === true ? 'bg-green-400' : 'bg-purple-400'
                }`}></div>

              <div className="w-20 h-20 rounded-xl overflow-hidden flex-shrink-0 relative">
                <img src={bp.thumbnailUrl} alt={bp.title} className="w-full h-full object-cover" />
                {bp.creatorVerified === true ? (
                  <div className="absolute bottom-1 right-1 bg-green-500 text-white text-[8px] font-bold px-1.5 py-0.5 rounded-full uppercase">
                    ✓ Premium
                  </div>
                ) : (
                  <div className="absolute bottom-1 right-1 bg-purple-500 text-white text-[8px] font-bold px-1.5 py-0.5 rounded-full uppercase">
                    AI
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="font-bold text-sm text-gray-900 truncate">{bp.title}</h4>
                <div className="flex items-center gap-2 mt-1">
                  <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded uppercase ${bp.creatorVerified === true ? 'bg-green-50 text-green-600' : 'bg-purple-50 text-purple-600'
                    }`}>
                    {bp.creatorVerified === true ? 'Zweryfikowany' : 'Tylko AI'}
                  </span>
                  <span className="text-[10px] text-gray-400 font-medium">{bp.points.length} punktów</span>
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => onVerifyClick(bp._id, true)}
                  className={`p-2 rounded-lg transition-all ${bp.creatorVerified === true
                    ? 'text-gray-400 hover:text-blue-500 hover:bg-blue-50'
                    : 'text-purple-400 hover:text-purple-600 hover:bg-purple-50'
                    }`}
                  title={bp.creatorVerified === true ? "Edytuj plan" : "Weryfikuj plan"}
                >
                  <Map size={18} />
                </button>
                <button
                  onClick={() => handleDeleteBlueprint(bp._id)}
                  className="p-2 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                  title="Usuń plan całkowicie"
                >
                  <Trash size={18} />
                </button>
              </div>
            </div>
          ))}
          {(!myBlueprints || myBlueprints.length === 0) && (
            <div className="col-span-full py-12 bg-gray-50/50 border border-dashed border-gray-200 rounded-2xl text-center text-gray-400 text-sm font-medium">
              Nie masz jeszcze żadnych planów. Wygeneruj plan z filmu powyżej.
            </div>
          )}
        </div>

        <div className="h-64 bg-white border border-gray-100 rounded-[2rem] p-8 shadow-sm">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data}>
              <XAxis dataKey="name" fontSize={12} fontWeight="bold" tickLine={false} axisLine={false} tick={{ fill: '#9CA3AF' }} />
              <Tooltip
                cursor={{ fill: 'rgba(0,0,0,0.02)' }}
                contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 20px 50px rgba(0,0,0,0.1)', padding: '12px' }}
              />
              <Bar dataKey="sales" radius={[8, 8, 8, 8]} barSize={40}>
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={index === 6 ? '#000000' : '#F3F4F6'} className="transition-all duration-300 hover:fill-black/80" />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

export default CreatorDashboard;