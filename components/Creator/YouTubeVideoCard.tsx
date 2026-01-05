import React from 'react';
import { Play, Sparkles, Clock, Globe, Loader2 } from 'lucide-react';

export interface YouTubeVideo {
    _id: string; // Convex ID
    youtubeVideoId: string;
    title: string;
    thumbnailUrl: string;
    duration: string;
    publishedAt: string;
    status: "pending" | "processing" | "completed" | "failed";
}

interface YouTubeVideoCardProps {
    video: YouTubeVideo;
    onProcess: (video: YouTubeVideo) => void;
}

const YouTubeVideoCard: React.FC<YouTubeVideoCardProps> = ({ video, onProcess }) => {
    return (
        <div className="group relative bg-white rounded-2xl overflow-hidden border border-gray-100 shadow-sm hover:shadow-xl transition-all duration-500 hover:-translate-y-1">
            {/* Thumbnail */}
            <div className="relative aspect-video overflow-hidden">
                <img
                    src={video.thumbnailUrl}
                    alt={video.title}
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                />
                <div className="absolute inset-0 bg-black/20 group-hover:bg-black/40 transition-colors"></div>

                {/* Play Icon Overly */}
                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <div className="w-12 h-12 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center border border-white/30">
                        <Play className="text-white fill-current w-5 h-5 ml-1" />
                    </div>
                </div>

                {/* Duration Badge */}
                <div className="absolute bottom-2 right-2 bg-black/80 backdrop-blur text-white px-2 py-0.5 rounded text-[10px] font-bold">
                    {video.duration}
                </div>
            </div>

            {/* Content */}
            <div className="p-4 space-y-3">
                <div className="flex justify-between items-start gap-2">
                    <h4 className="font-bold text-sm text-gray-900 line-clamp-2 leading-tight group-hover:text-brand-purple transition-colors">
                        {video.title}
                    </h4>
                </div>

                <div className="flex items-center gap-3 text-[10px] text-gray-400 font-bold uppercase tracking-wider">
                    <span className="flex items-center gap-1"><Clock size={10} /> {video.publishedAt}</span>
                    {video.status === "completed" && (
                        <span className="flex items-center gap-1 text-green-500"><Globe size={10} /> Opublikowano</span>
                    )}
                    {video.status === "processing" && (
                        <span className="flex items-center gap-1 text-blue-500 animate-pulse"><Sparkles size={10} /> Przetwarzanie...</span>
                    )}
                </div>

                <button
                    onClick={() => onProcess(video)}
                    disabled={video.status === "processing" || video.status === "completed"}
                    className={`w-full py-2.5 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all 
            ${video.status === "completed"
                            ? 'bg-gray-50 text-gray-400 cursor-not-allowed border border-gray-100'
                            : video.status === "processing"
                                ? 'bg-blue-50 text-blue-600 border border-blue-100 cursor-wait'
                                : 'bg-black text-white hover:bg-gray-800 shadow-lg shadow-black/5 hover:shadow-black/20 active:scale-95'
                        }`}
                >
                    {video.status === "completed" ? (
                        'Plan Aktywny'
                    ) : video.status === "processing" ? (
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
    );
};

export default YouTubeVideoCard;
