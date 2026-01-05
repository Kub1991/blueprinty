import React from 'react';
import { TripPoint, Blueprint } from '../../types';
import { POINT_ICONS } from '../../constants';
import { ArrowLeft, Star, Clock, Navigation, Info, PlayCircle } from 'lucide-react';

import { useMapsLibrary } from '@vis.gl/react-google-maps';

interface PointDetailProps {
    point: TripPoint;
    blueprint: Blueprint;
    onBack: () => void;
}

const PointDetail: React.FC<PointDetailProps> = ({ point, blueprint, onBack }) => {
    const googleApiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;

    // DEBUG: Check blueprint data
    console.log("[PointDetail] Blueprint:", blueprint);
    console.log("[PointDetail] Point:", point);
    const [fetchedImageUrl, setFetchedImageUrl] = React.useState<string | null>(null);
    const [photoAttribution, setPhotoAttribution] = React.useState<string | null>(null);
    const placesLib = useMapsLibrary('places');

    // Effect to fetch real photo URL via Modern JS SDK (Place class)
    React.useEffect(() => {
        if (!placesLib) return;

        const fetchWithModernSDK = async (id: string) => {
            try {
                // Use modern 'Place' class as recommended by Google (post March 2025)
                const { Place } = await google.maps.importLibrary("places") as google.maps.PlacesLibrary;
                const place = new Place({ id, requestedLanguage: 'pl' });

                // Fetch photos AND their attributions (legal requirement)
                await place.fetchFields({ fields: ['photos', 'displayName', 'authorAttributions'] });

                if (place.photos && place.photos.length > 0) {
                    const firstPhoto = place.photos[0];
                    const url = firstPhoto.getURI({ maxWidth: 800 });

                    // Documentation says attributions are mandatory
                    // They usually come as an array of objects/strings
                    if (firstPhoto.authorAttributions && firstPhoto.authorAttributions.length > 0) {
                        setPhotoAttribution(firstPhoto.authorAttributions[0].displayName);
                    }

                    console.log(`[PointDetail-V6.1] Success! Modern SDK Photo for: ${point.name}`);
                    setFetchedImageUrl(url);
                }
            } catch (e) {
                console.warn(`[PointDetail-V6.1] Modern SDK failed for ${point.name}:`, e);

                // Fallback to legacy PlacesService if Modern fails (failsafe)
                const svc = new google.maps.places.PlacesService(document.createElement('div'));
                svc.getDetails({ placeId: id, fields: ['photos', 'html_attributions'] }, (result, status) => {
                    if (status === google.maps.places.PlacesServiceStatus.OK && result?.photos?.[0]) {
                        setFetchedImageUrl(result.photos[0].getUrl({ maxWidth: 800 }));
                        if (result.photos[0].html_attributions && result.photos[0].html_attributions.length > 0) {
                            // Extract text from HTML attribution
                            const parser = new DOMParser();
                            const doc = parser.parseFromString(result.photos[0].html_attributions[0], 'text/html');
                            setPhotoAttribution(doc.body.textContent);
                        }
                    }
                });
            }
        };

        if (point.placeId) {
            fetchWithModernSDK(point.placeId);
        } else if (point.name && !point.isGeneric) {
            console.log(`[PointDetail-V6.1] Searching for place: ${point.name}`);
            const svc = new google.maps.places.PlacesService(document.createElement('div'));
            svc.findPlaceFromQuery({
                query: point.name,
                fields: ['place_id']
            }, (results, status) => {
                if (status === google.maps.places.PlacesServiceStatus.OK && results?.[0]?.place_id) {
                    fetchWithModernSDK(results[0].place_id);
                }
            });
        }
    }, [placesLib, point.placeId, point.name, point.isGeneric]);

    // Construct the URL fallback logic
    const finalImageUrl = fetchedImageUrl
        || (point.photoReference && googleApiKey
            ? `https://maps.googleapis.com/maps/api/place/photo?maxwidth=800&photoreference=${encodeURIComponent(point.photoReference)}&key=${googleApiKey}`
            : (point.imageUrl || `https://picsum.photos/seed/${point.id}/800/400`));

    console.log(`[PointDetail-V6.2] Rendering: ${point.name}. Source: ${fetchedImageUrl ? 'Modern-SDK' : (point.photoReference ? 'Legacy-Ref' : 'Static')}`);

    return (
        <div className="p-0 animate-in fade-in zoom-in-95 duration-300">
            {/* Hero Image */}
            <div className="h-48 md:h-64 w-full bg-gray-100 relative group overflow-hidden">
                <img
                    src={finalImageUrl}
                    alt={point.name}
                    className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-105"
                    onError={(e) => {
                        console.error("[PointDetail] Failed to load photo:", finalImageUrl);
                        (e.target as HTMLImageElement).src = `https://picsum.photos/seed/${point.id}/800/400`;
                    }}
                />
                <div className="absolute top-4 right-4 bg-white/90 backdrop-blur px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-wider flex items-center gap-1 shadow-sm">
                    {POINT_ICONS[point.type]} {point.type}
                </div>
                {point.imageUrl && (
                    <div className="absolute bottom-4 left-4 bg-black/50 backdrop-blur px-2 py-1 rounded text-[8px] text-white/80 font-bold uppercase tracking-widest">
                        Real Photo from Google
                    </div>
                )}
                {photoAttribution && (
                    <div className="absolute bottom-4 right-4 bg-black/40 backdrop-blur px-2 py-1 rounded text-[7px] text-white/60">
                        Foto: {photoAttribution}
                    </div>
                )}
            </div>

            <div className="p-8 space-y-8">
                {/* Desktop Back Button (Inner) */}
                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        onBack();
                    }}
                    className="hidden md:flex items-center gap-1 text-xs font-bold text-gray-500 mb-4 hover:text-black"
                >
                    <ArrowLeft size={12} /> Wróć do listy
                </button>

                {/* Quick Stats */}
                <div className="flex items-center justify-between text-sm font-medium text-gray-600">
                    <div className="flex items-center gap-2 bg-gray-50 px-3 py-2 rounded-lg">
                        <Clock size={16} /> <span>1-2h zwiedzania</span>
                    </div>
                    <div className="flex items-center gap-2 bg-gray-50 px-3 py-2 rounded-lg">
                        <Star size={16} className="text-yellow-400" fill="currentColor" />
                        <span className="text-black font-bold">{point.rating || 4.8}</span>
                    </div>
                </div>

                {/* Description */}
                <div className="relative pl-4 border-l-2 border-brand-yellow">
                    <h2 className="text-2xl font-black text-gray-900 mb-2">{point.name}</h2>
                    <p className="text-lg text-gray-800 italic leading-relaxed font-medium">
                        "{point.description}"
                    </p>
                    <div className="flex items-center gap-2 mt-3">
                        <img src={blueprint.creatorAvatar} className="w-6 h-6 rounded-full" alt="Creator" />
                        <span className="text-xs font-bold text-gray-500">Rekomendacja Twórcy</span>
                    </div>
                </div>

                {/* Metadata Grid */}
                <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 rounded-2xl bg-gray-50 border border-gray-100">
                        <span className="text-[10px] font-bold text-gray-400 uppercase">Adres</span>
                        <p className="text-xs font-bold text-gray-900 mt-1 line-clamp-2">
                            {point.address || '123 Travel St, Kyoto'}
                        </p>
                    </div>
                    {point.timestamp !== undefined ? (
                        <div className="p-4 rounded-2xl bg-gray-50 border border-gray-100">
                            <span className="text-[10px] font-bold text-gray-400 uppercase">Moment w filmie</span>
                            <p className="text-xs font-bold text-red-600 mt-1">
                                {(() => {
                                    const totalSeconds = point.timestamp > 10000 ? Math.floor(point.timestamp / 1000) : Math.floor(point.timestamp);
                                    const minutes = Math.floor(totalSeconds / 60);
                                    const seconds = totalSeconds % 60;
                                    if (minutes >= 60) {
                                        const h = Math.floor(minutes / 60);
                                        const m = minutes % 60;
                                        return `${h}:${m.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
                                    }
                                    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
                                })()}
                            </p>
                        </div>
                    ) : (
                        <div className="p-4 rounded-2xl bg-gray-50 border border-gray-100">
                            <span className="text-[10px] font-bold text-gray-400 uppercase">Godziny</span>
                            <p className="text-xs font-bold text-green-600 mt-1">Otwarte teraz</p>
                        </div>
                    )}
                </div>

                {/* Grounding Sources */}
                {point.groundingSources && point.groundingSources.length > 0 && (
                    <div className="space-y-3">
                        <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2">
                            <Info size={12} /> Źródła
                        </h4>
                        {point.groundingSources.map((source, i) => (
                            <a
                                key={i}
                                href={source.uri}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="block text-xs text-blue-600 truncate underline decoration-blue-200 underline-offset-4 hover:text-blue-800"
                            >
                                {source.title}
                            </a>
                        ))}
                    </div>
                )}

                {/* YouTube Clip Section */}
                {(() => {
                    // Debug info to console to see why it might be hidden
                    if (!blueprint.youtubeVideoId) {
                        console.warn(`[PointDetail] YouTube Video ID missing for blueprint: ${blueprint.title}`);
                    }

                    const videoId = blueprint.youtubeVideoId || (blueprint.title === "Chodzimy po Mogadiszu" ? "EtdLwsV-VP8" : null);

                    if (!videoId) return null;

                    return (
                        <div className="space-y-3">
                            <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2">
                                <PlayCircle size={12} className="text-red-500" /> Obejrzyj w filmie
                            </h4>
                            <div className="aspect-video relative rounded-2xl overflow-hidden bg-gray-900 border border-gray-100 shadow-xl group">
                                <iframe
                                    key={`${videoId}-${point.timestamp || 0}`}
                                    src={`https://www.youtube.com/embed/${videoId}?start=${point.timestamp > 10000 ? Math.floor(point.timestamp / 1000) : (point.timestamp || 0)}&autoplay=0&rel=0`}
                                    title="YouTube video player"
                                    frameBorder="0"
                                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                                    allowFullScreen
                                    className="absolute inset-0 w-full h-full"
                                ></iframe>
                            </div>
                        </div>
                    );
                })()}

                {/* Action Buttons */}
                <div className="pt-4 grid grid-cols-[1.5fr_1fr] gap-4">
                    <a
                        href={point.googleMapsUrl || '#'}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="bg-black text-white py-4 rounded-2xl font-bold flex items-center justify-center gap-2 shadow-xl active:scale-95 transition-transform hover:bg-gray-800"
                    >
                        <Navigation size={18} /> Nawiguj
                    </a>
                    <button className="bg-blue-600 text-white py-4 rounded-2xl font-bold flex items-center justify-center gap-2 shadow-xl shadow-blue-200 active:scale-95 transition-transform hover:bg-blue-700">
                        Booking
                    </button>
                </div>
            </div>
        </div>
    );
};

export default PointDetail;
