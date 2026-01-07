
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Map, AdvancedMarker, Pin, useMap, useMapsLibrary } from '@vis.gl/react-google-maps';
import { TripPoint, PointType } from '../../types';
import { POINT_COLORS_HEX, POINT_ICONS, POINT_TYPES } from '../../constants';
import { Search, Plus, MapPin, X, Save, Trash2, Link as LinkIcon, Check, Loader2 } from 'lucide-react';

interface MapVerifierProps {
    points: TripPoint[];
    setPoints: React.Dispatch<React.SetStateAction<TripPoint[]>>;
    onSaveAndContinue: () => void;
    isPublishing: boolean;
}

const DEFAULT_CENTER = { lat: 35.6762, lng: 139.6503 }; // Tokyo default

const MapVerifier: React.FC<MapVerifierProps> = ({ points, setPoints, onSaveAndContinue, isPublishing }) => {
    const map = useMap();
    const placesLib = useMapsLibrary('places');

    const [selectedPointId, setSelectedPointId] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [isSearching, setIsSearching] = useState(false);
    const [searchResults, setSearchResults] = useState<google.maps.places.AutocompletePrediction[]>([]);
    const [autocompleteService, setAutocompleteService] = useState<google.maps.places.AutocompleteService | null>(null);
    const [placesService, setPlacesService] = useState<google.maps.places.PlacesService | null>(null);

    // Edit State
    const [editForm, setEditForm] = useState<Partial<TripPoint>>({});
    const [isDirty, setIsDirty] = useState(false);

    // Initialize Services
    useEffect(() => {
        if (!placesLib || !map) return;
        setAutocompleteService(new placesLib.AutocompleteService());
        setPlacesService(new placesLib.PlacesService(map));
    }, [placesLib, map]);

    // Fit Bounds
    useEffect(() => {
        if (!map || points.length === 0) return;
        const bounds = new google.maps.LatLngBounds();
        let valid = false;
        points.forEach(p => {
            if (p.lat && p.lng) {
                bounds.extend({ lat: p.lat, lng: p.lng });
                valid = true;
            }
        });
        if (valid) map.fitBounds(bounds, 50);
    }, [map]); // Only run once on mount/map ready ideally, or when points change significantly?

    // Search Logic
    useEffect(() => {
        if (!searchQuery || !autocompleteService) {
            setSearchResults([]);
            return;
        }
        const timer = setTimeout(() => {
            autocompleteService.getPlacePredictions({ input: searchQuery }, (predictions, status) => {
                if (status === google.maps.places.PlacesServiceStatus.OK && predictions) {
                    setSearchResults(predictions);
                } else {
                    setSearchResults([]);
                }
            });
        }, 300);
        return () => clearTimeout(timer);
    }, [searchQuery, autocompleteService]);

    const handleSelectPoint = (point: TripPoint) => {
        setSelectedPointId(point.id);
        setEditForm({ ...point });
        setIsDirty(false);
        if (map && point.lat && point.lng) {
            map.panTo({ lat: point.lat, lng: point.lng });
            map.setZoom(16);
        }
    };

    const handleAddPlace = (placeId: string) => {
        if (!placesService) return;
        placesService.getDetails({ placeId }, (place, status) => {
            if (status === google.maps.places.PlacesServiceStatus.OK && place && place.geometry?.location) {
                const newPoint: TripPoint = {
                    id: `point_${Date.now()}`,
                    name: place.name || "New Place",
                    description: "Newly added place.",
                    type: PointType.ACTIVITY,
                    day: 1,
                    lat: place.geometry.location.lat(),
                    lng: place.geometry.location.lng(),
                    address: place.formatted_address,
                    googleMapsUrl: place.url,
                    placeId: place.place_id,
                    verified: true,
                    // Try to get photo
                    imageUrl: place.photos?.[0]?.getUrl({ maxWidth: 800 }),
                    timestamp: 0
                };

                setPoints(prev => [...prev, newPoint]);
                handleSelectPoint(newPoint);
                setSearchQuery('');
                setSearchResults([]);
            }
        });
    };

    const handleMapClick = (e: google.maps.MapMouseEvent) => {
        // Deselect if clicking empty map
        if (e.domEvent.target && (e.domEvent.target as HTMLElement).closest('.gm-style-iw-c')) return; // Ignore info window
        // But we are not using info windows, we use sidebar.
        // Actually, let's keep selection unless clicking "X" or explicit close.
        // Optional: Right click to add arbitrary point?
    };

    const handleSaveEdit = () => {
        setPoints(prev => prev.map(p => p.id === selectedPointId ? { ...p, ...editForm } as TripPoint : p));
        setIsDirty(false);
    };

    const handleDeletePoint = () => {
        if (confirm("Delete this point?")) {
            setPoints(prev => prev.filter(p => p.id !== selectedPointId));
            setSelectedPointId(null);
        }
    };

    return (
        <div className="relative w-full h-[calc(100vh-80px)] flex">

            {/* LEFT SIDEBAR: Search & Editor */}
            <div className="w-96 bg-white border-r border-gray-200 flex flex-col z-20 shadow-xl">

                {/* Search Header */}
                <div className="p-4 border-b border-gray-100 z-30 bg-white">
                    <div className="relative group">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4 transition group-focus-within:text-black" />
                        <input
                            type="text"
                            placeholder="Add place (e.g. Starbucks)..."
                            className="w-full bg-gray-100 border-none rounded-xl pl-10 pr-4 py-3 text-sm font-bold outline-none focus:ring-2 focus:ring-black/5 transition-all"
                            value={searchQuery}
                            onChange={e => setSearchQuery(e.target.value)}
                            onFocus={() => setIsSearching(true)}
                        />
                        {/* Search Results Dropdown */}
                        {isSearching && searchResults.length > 0 && (
                            <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl shadow-2xl border border-gray-100 overflow-hidden max-h-80 overflow-y-auto">
                                {searchResults.map(result => (
                                    <button
                                        key={result.place_id}
                                        onClick={() => handleAddPlace(result.place_id)}
                                        className="w-full text-left p-3 hover:bg-gray-50 flex items-start gap-3 transition-colors border-b border-gray-50 last:border-0"
                                    >
                                        <MapPin size={16} className="mt-1 text-gray-400 shrink-0" />
                                        <div>
                                            <div className="font-bold text-sm text-gray-900">{result.structured_formatting.main_text}</div>
                                            <div className="text-xs text-gray-500">{result.structured_formatting.secondary_text}</div>
                                        </div>
                                    </button>
                                ))}
                                <div
                                    className="p-2 text-center text-xs font-bold text-gray-400 uppercase tracking-wider cursor-pointer hover:text-black"
                                    onClick={() => { setSearchResults([]); setIsSearching(false); }}
                                >
                                    Close Results
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Editor or List */}
                <div className="flex-1 overflow-y-auto bg-gray-50/50">
                    {selectedPointId ? (
                        <div className="p-6 space-y-6 animate-in slide-in-from-left-4 duration-300">
                            <div className="flex justify-between items-start">
                                <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest">Edit Point</h3>
                                <button onClick={() => setSelectedPointId(null)} className="p-1 hover:bg-gray-200 rounded-full transition"><X size={16} /></button>
                            </div>

                            <div className="space-y-4">
                                <div>
                                    <label className="text-[10px] font-bold uppercase text-gray-400 mb-1 block">Name</label>
                                    <input
                                        type="text"
                                        value={editForm.name || ""}
                                        onChange={e => { setEditForm(prev => ({ ...prev, name: e.target.value })); setIsDirty(true); }}
                                        className="w-full bg-white border border-gray-200 rounded-lg p-3 font-bold text-lg outline-none focus:border-black transition"
                                    />
                                </div>

                                <div>
                                    <label className="text-[10px] font-bold uppercase text-gray-400 mb-1 block">Type</label>
                                    <div className="flex gap-2 flex-wrap">
                                        {POINT_TYPES.map(type => (
                                            <button
                                                key={type}
                                                onClick={() => { setEditForm(prev => ({ ...prev, type: type as PointType })); setIsDirty(true); }}
                                                className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-2 border transition ${editForm.type === type ? 'bg-black text-white border-black' : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300'}`}
                                            >
                                                <span>{POINT_ICONS[type]}</span>
                                                {type}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <div>
                                    <label className="text-[10px] font-bold uppercase text-gray-400 mb-1 block">Description</label>
                                    <textarea
                                        value={editForm.description || ""}
                                        onChange={e => { setEditForm(prev => ({ ...prev, description: e.target.value })); setIsDirty(true); }}
                                        className="w-full bg-white border border-gray-200 rounded-lg p-3 text-sm h-32 resize-none outline-none focus:border-black transition"
                                        placeholder="Add a tip for this place..."
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="text-[10px] font-bold uppercase text-gray-400 mb-1 block">Day</label>
                                        <input
                                            type="number"
                                            min="1"
                                            value={editForm.day || 1}
                                            onChange={e => { setEditForm(prev => ({ ...prev, day: parseInt(e.target.value) })); setIsDirty(true); }}
                                            className="w-full bg-white border border-gray-200 rounded-lg p-3 font-bold text-sm outline-none focus:border-black transition"
                                        />
                                    </div>
                                    <div>
                                        <label className="text-[10px] font-bold uppercase text-gray-400 mb-1 block">Video Time (sec)</label>
                                        <input
                                            type="number"
                                            min="0"
                                            value={editForm.timestamp || 0}
                                            onChange={e => { setEditForm(prev => ({ ...prev, timestamp: parseInt(e.target.value) })); setIsDirty(true); }}
                                            className="w-full bg-white border border-gray-200 rounded-lg p-3 font-bold text-sm outline-none focus:border-black transition"
                                        />
                                    </div>
                                </div>

                                {editForm.imageUrl && (
                                    <div className="rounded-xl overflow-hidden h-32 relative group">
                                        <img src={editForm.imageUrl} alt="Preview" className="w-full h-full object-cover" />
                                        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition flex items-center justify-center">
                                            <span className="text-white text-xs font-bold">Google Maps Photo</span>
                                        </div>
                                    </div>
                                )}

                                <div className="pt-4 flex gap-3">
                                    <button
                                        onClick={handleSaveEdit}
                                        disabled={!isDirty}
                                        className="flex-1 bg-black text-white py-3 rounded-xl font-bold text-sm hover:scale-[1.02] active:scale-95 transition disabled:opacity-50 disabled:hover:scale-100 flex items-center justify-center gap-2"
                                    >
                                        <Save size={16} /> Save Changes
                                    </button>
                                    <button
                                        onClick={handleDeletePoint}
                                        className="p-3 bg-red-50 text-red-500 rounded-xl hover:bg-red-100 transition"
                                    >
                                        <Trash2 size={18} />
                                    </button>
                                </div>
                            </div>
                        </div>
                    ) : (
                        // List View / Empty State
                        <div className="p-4">
                            <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-4">Your Points ({points.length})</h3>
                            <div className="space-y-2">
                                {points.map((point) => (
                                    <div
                                        key={point.id}
                                        onClick={() => handleSelectPoint(point)}
                                        className="bg-white p-3 rounded-xl border border-gray-100 shadow-sm hover:shadow-md hover:border-black/10 cursor-pointer flex items-center gap-3 transition-all group"
                                    >
                                        <div
                                            className="w-8 h-8 rounded-full flex items-center justify-center text-lg shadow-sm shrink-0 font-bold text-white"
                                            style={{ backgroundColor: POINT_COLORS_HEX[point.type] || '#000' }}
                                        >
                                            {POINT_ICONS[point.type]}
                                        </div>
                                        <div className="min-w-0 flex-1">
                                            <h4 className="font-bold text-sm text-gray-900 truncate group-hover:text-black">{point.name}</h4>
                                            <p className="text-[10px] text-gray-500 truncate">{point.description}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer Action */}
                <div className="p-4 bg-white border-t border-gray-100">
                    <button
                        onClick={onSaveAndContinue}
                        disabled={isPublishing}
                        className="w-full bg-green-500 text-white py-4 rounded-2xl font-black shadow-lg shadow-green-200 hover:shadow-green-300 hover:-translate-y-1 transition-all flex items-center justify-center gap-2"
                    >
                        {isPublishing ? <Loader2 size={20} className="animate-spin" /> : <Check size={20} />}
                        PUBLISH BLUEPRINT
                    </button>
                </div>
            </div>

            {/* MAIN MAP */}
            <div className="flex-1 relative">
                <Map
                    mapId="bf51a910020fa2a6"
                    defaultCenter={DEFAULT_CENTER}
                    defaultZoom={12}
                    gestureHandling={'greedy'}
                    disableDefaultUI={true}
                    className="w-full h-full"
                    onClick={() => setSelectedPointId(null)}
                >
                    {points.map(point => {
                        if (!point.lat || !point.lng) return null; // Skip if no coordinates

                        const isSelected = selectedPointId === point.id;
                        return (
                            <AdvancedMarker
                                key={point.id}
                                position={{ lat: point.lat, lng: point.lng }}
                                onClick={(e) => { e.stop(); handleSelectPoint(point); }}
                                zIndex={isSelected ? 50 : 1}
                            >
                                <Pin
                                    background={isSelected ? '#000000' : (POINT_COLORS_HEX[point.type] || '#000000')}
                                    glyphColor={'#ffffff'}
                                    borderColor={'#ffffff'}
                                    scale={isSelected ? 1.4 : 1.1}
                                    glyphText={POINT_ICONS[point.type]}
                                />
                            </AdvancedMarker>
                        )
                    })}
                </Map>

                {/* Map Controls Overlay (Optional) */}
                <div className="absolute top-4 right-4 bg-white/90 backdrop-blur rounded-xl shadow-lg p-2 text-[10px] font-bold text-gray-500">
                    Use search on left to add points
                </div>
            </div>
        </div>
    );
};

export default MapVerifier;
