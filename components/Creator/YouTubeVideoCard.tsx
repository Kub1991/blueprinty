import React from 'react';
import { Sparkles, Clock, Globe, Loader2 } from 'lucide-react';

export interface YouTubeVideo {
  _id: string; // Convex ID
  youtubeVideoId: string;
  title: string;
  thumbnailUrl: string;
  duration: string;
  publishedAt: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
}

interface YouTubeVideoCardProps {
  video: YouTubeVideo;
  onProcess: (video: YouTubeVideo) => void;
}

const formatDate = (isoString: string) => {
  try {
    const date = new Date(isoString);
    return new Intl.DateTimeFormat('pl-PL', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    }).format(date);
  } catch (_e) {
    return isoString;
  }
};

const YouTubeVideoCard: React.FC<YouTubeVideoCardProps> = ({ video, onProcess }) => {
  return (
    <div className="h-full flex flex-col bg-white rounded-2xl overflow-hidden border border-gray-100 shadow-[0_2px_8px_rgba(0,0,0,0.04)] transition-shadow hover:shadow-md">
      {/* Thumbnail */}
      <div className="relative aspect-video bg-gray-100">
        <img src={video.thumbnailUrl} alt={video.title} className="w-full h-full object-cover" />

        {/* Duration Badge */}
        <div className="absolute bottom-2 right-2 bg-black/80 backdrop-blur text-white px-2 py-0.5 rounded text-[10px] font-bold">
          {video.duration}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 flex flex-col p-4 space-y-3">
        <div className="flex-1">
          <h4 className="font-bold text-sm text-gray-900 line-clamp-2 leading-tight mb-2">
            {video.title}
          </h4>

          <div className="flex items-center gap-3 text-[10px] text-gray-400 font-bold uppercase tracking-wider">
            <span className="flex items-center gap-1">
              <Clock size={10} />
              {formatDate(video.publishedAt)}
            </span>
            {video.status === 'completed' && (
              <span className="flex items-center gap-1 text-green-500">
                <Globe size={10} /> Opublikowano
              </span>
            )}
            {video.status === 'processing' && (
              <span className="flex items-center gap-1 text-blue-500 animate-pulse">
                <Sparkles size={10} /> Przetwarzanie...
              </span>
            )}
          </div>
        </div>

        <div className="pt-2">
          <button
            onClick={() => onProcess(video)}
            disabled={video.status === 'processing' || video.status === 'completed'}
            className={`w-full py-2.5 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all 
                            ${
                              video.status === 'completed'
                                ? 'bg-gray-50 text-gray-400 cursor-not-allowed border border-gray-100'
                                : video.status === 'processing'
                                  ? 'bg-blue-50 text-blue-600 border border-blue-100 cursor-wait'
                                  : 'bg-black text-white hover:bg-gray-800 active:scale-95'
                            }`}
          >
            {video.status === 'completed' ? (
              'Plan Aktywny'
            ) : video.status === 'processing' ? (
              <>
                <Loader2 size={14} className="animate-spin" />
                AI Analizuje...
              </>
            ) : (
              <>
                <Sparkles size={14} className="text-yellow-400" />
                Stwórz Blueprint
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default YouTubeVideoCard;
