import React from 'react';
import { TripPoint } from '../../types';
import { POINT_COLORS, POINT_ICONS } from '../../constants';
import { Check, X, Edit2, Loader2, Save } from 'lucide-react';

interface PointVerifierCardProps {
    point: TripPoint;
    // Edit state
    isEditing: boolean;
    editName: string;
    editDesc: string;
    editDay: number;
    editTimestamp: number;
    onEditNameChange: (name: string) => void;
    onEditDescChange: (desc: string) => void;
    onEditDayChange: (day: number) => void;
    onEditTimestampChange: (timestamp: number) => void;
    onSaveEdit: () => void;
    // Processing state
    isProcessing: boolean;
}

const PointVerifierCard: React.FC<PointVerifierCardProps> = ({
    point,
    isEditing,
    editName,
    editDesc,
    editDay,
    editTimestamp,
    onEditNameChange,
    onEditDescChange,
    onEditDayChange,
    onEditTimestampChange,
    onSaveEdit,
    isProcessing,
}) => {
    return (
        <div className="flex-1 bg-white rounded-3xl shadow-2xl border border-gray-100 overflow-hidden relative flex flex-col">
            {/* Map/Image Area (Top) */}
            <div className="h-[45%] bg-slate-100 relative group overflow-hidden">
                {point.imageUrl ? (
                    <>
                        <img
                            src={point.imageUrl}
                            alt={point.name}
                            className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                        />
                        <div className="absolute inset-0 bg-black/10 group-hover:bg-black/0 transition-colors" />
                    </>
                ) : (
                    <div className="absolute inset-0 bg-[url('https://assets.website-files.com/5e832e12eb7ca02ee9064d42/5f79bb4152a657273398322e_Map%20Styling.png')] bg-cover opacity-50 grayscale mix-blend-multiply"></div>
                )}

                <div className="absolute inset-0 flex items-center justify-center">
                    <div
                        className={`w-16 h-16 rounded-full flex items-center justify-center text-3xl shadow-xl border-4 border-white ${POINT_COLORS[point.type]
                            }`}
                    >
                        {POINT_ICONS[point.type]}
                    </div>
                </div>

                {/* Tag */}
                <div className="absolute top-4 left-4">
                    <span className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-[10px] font-bold shadow-sm uppercase tracking-wider bg-white text-black border border-gray-200">
                        {point.type}
                    </span>
                </div>
            </div>

            {/* Content (Bottom) */}
            <div className="h-[55%] p-6 flex flex-col relative">
                {isEditing ? (
                    <div className="flex-1 flex flex-col gap-3">
                        <input
                            type="text"
                            value={editName}
                            onChange={(e) => onEditNameChange(e.target.value)}
                            className="text-xl font-bold border-b border-gray-300 focus:border-black outline-none py-1"
                            placeholder="Nazwa miejsca"
                        />
                        <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-gray-400 uppercase">Dzień:</span>
                            <input
                                type="number"
                                min="1"
                                max="30"
                                value={editDay}
                                onChange={(e) => onEditDayChange(parseInt(e.target.value))}
                                className="w-16 border border-gray-300 rounded px-2 py-1 text-sm font-bold"
                            />
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-gray-400 uppercase">Sekunda filmu:</span>
                            <input
                                type="number"
                                min="0"
                                value={editTimestamp}
                                onChange={(e) => onEditTimestampChange(parseInt(e.target.value) || 0)}
                                className="w-20 border border-gray-300 rounded px-2 py-1 text-sm font-bold"
                            />
                        </div>
                        <textarea
                            value={editDesc}
                            onChange={(e) => onEditDescChange(e.target.value)}
                            className="flex-1 resize-none border border-gray-300 rounded-lg p-3 text-sm focus:ring-1 focus:ring-black outline-none"
                            placeholder="Twój tip..."
                        />
                        <button
                            onClick={onSaveEdit}
                            className="bg-black text-white py-2 rounded-lg text-sm font-bold flex items-center justify-center gap-2"
                        >
                            <Save size={14} /> Zapisz zmiany
                        </button>
                    </div>
                ) : (
                    <>
                        <div className="mb-1">
                            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                                Dzień {point.day || 1} {point.timestamp !== undefined && ` • ${(() => {
                                    const totalSeconds = point.timestamp > 10000 ? Math.floor(point.timestamp / 1000) : Math.floor(point.timestamp);
                                    const minutes = Math.floor(totalSeconds / 60);
                                    const seconds = totalSeconds % 60;
                                    if (minutes >= 60) {
                                        const h = Math.floor(minutes / 60);
                                        const m = minutes % 60;
                                        return `${h}:${m.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
                                    }
                                    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
                                })()}`}
                            </span>
                            <h3 className="text-2xl font-bold leading-tight">{point.name}</h3>
                        </div>

                        <div className="flex-1 overflow-y-auto my-2 pr-2">
                            <p className="text-gray-600 text-sm italic border-l-2 border-brand-yellow pl-3 py-1">
                                "{point.description}"
                            </p>
                        </div>

                        {/* Affiliate Checkbox */}
                        <div className="mt-auto pt-4 border-t border-gray-100">
                            <label className="flex items-center gap-3 text-sm font-medium text-gray-700 cursor-pointer select-none group">
                                <div className="relative flex items-center">
                                    <input type="checkbox" className="peer sr-only" defaultChecked />
                                    <div className="w-5 h-5 border-2 border-gray-300 rounded bg-white peer-checked:bg-blue-600 peer-checked:border-blue-600 transition"></div>
                                    <Check
                                        size={12}
                                        className="absolute text-white left-0.5 opacity-0 peer-checked:opacity-100"
                                    />
                                </div>
                                <span className="group-hover:text-black">Auto-linki (Booking.com)</span>
                            </label>
                        </div>
                    </>
                )}
            </div>

            {/* Processing Overlay */}
            {isProcessing && (
                <div className="absolute inset-0 bg-white/95 backdrop-blur-sm flex items-center justify-center z-20">
                    <div className="text-center space-y-4 p-8">
                        <Loader2 size={32} className="animate-spin mx-auto text-black" />
                        <div>
                            <p className="font-bold text-lg text-gray-900">Google Maps Grounding</p>
                            <p className="text-sm text-gray-500 mt-1">
                                Szukam adresu, ocen i strony www...
                            </p>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default PointVerifierCard;
