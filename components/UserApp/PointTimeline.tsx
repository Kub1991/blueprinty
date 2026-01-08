import React from 'react';
import { TripPoint } from '../../types';
import { POINT_COLORS, POINT_ICONS } from '../../constants';
import { Star, ChevronRight } from 'lucide-react';

interface PointTimelineProps {
  points: TripPoint[];
  onSelectPoint: (point: TripPoint) => void;
  selectedPointId?: string;
}

const PointTimeline: React.FC<PointTimelineProps> = ({
  points,
  onSelectPoint,
  selectedPointId: _selectedPointId,
}) => {
  // Group points by day
  const groupedPoints = points.reduce(
    (acc, point) => {
      const day = (point.day || 1).toString();
      if (!acc[day]) acc[day] = [];
      acc[day].push(point);
      return acc;
    },
    {} as Record<string, TripPoint[]>
  );

  const groupedEntries = Object.entries(groupedPoints) as [string, TripPoint[]][];

  if (groupedEntries.length === 0) {
    return (
      <div className="text-center py-12 text-gray-400">
        <p className="font-medium">Brak punktów do wyświetlenia.</p>
      </div>
    );
  }

  return (
    <>
      {groupedEntries.map(([day, dayPoints]) => (
        <div key={day} className="mb-10 last:mb-0">
          {/* Day Header */}
          <div className="flex items-center gap-4 mb-6 sticky top-0 bg-white/95 backdrop-blur py-3 z-10 border-b border-gray-100 md:top-[-2px]">
            <div className="w-12 h-12 rounded-2xl bg-black text-white flex flex-col items-center justify-center font-bold shadow-lg">
              <span className="text-[10px] opacity-60 uppercase">Dzień</span>
              <span className="text-xl leading-none">{day}</span>
            </div>
            <div>
              <h4 className="text-lg font-bold text-gray-900">Eksploracja</h4>
              <p className="text-xs text-gray-500 font-medium">
                {dayPoints.length} przystanków • 8km trasy
              </p>
            </div>
          </div>

          {/* Timeline */}
          <div className="relative pl-6 space-y-8 border-l-2 border-dashed border-gray-200 ml-6">
            {dayPoints.map((point) => (
              <div
                key={point.id}
                onClick={() => onSelectPoint(point)}
                className="relative group cursor-pointer"
              >
                {/* Connector Dot */}
                <div
                  className={`absolute -left-[31px] top-1/2 -translate-y-1/2 w-4 h-4 rounded-full border-[3px] border-white shadow-md z-10 transition-transform group-hover:scale-125 ${
                    POINT_COLORS[point.type]
                  }`}
                ></div>

                <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-[0_4px_20px_rgba(0,0,0,0.03)] flex items-center gap-4 transition-all duration-300 group-hover:shadow-[0_8px_30px_rgba(0,0,0,0.08)] group-hover:-translate-y-1 group-active:scale-[0.98] group-hover:border-black/5">
                  <div
                    className={`w-12 h-12 rounded-xl flex items-center justify-center text-xl bg-gray-50 text-gray-500 group-hover:bg-black group-hover:text-white transition-colors duration-300`}
                  >
                    {POINT_ICONS[point.type]}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-center mb-0.5">
                      <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                        {point.type}
                      </span>
                      {point.isGeneric ? (
                        <span className="text-[10px] font-bold bg-blue-50 text-blue-700 px-1.5 rounded flex items-center gap-0.5">
                          ✨ AI Insight
                        </span>
                      ) : (
                        point.rating && (
                          <span className="text-[10px] font-bold bg-yellow-50 text-yellow-700 px-1.5 rounded flex items-center gap-0.5">
                            <Star size={8} fill="currentColor" />
                            {point.rating}
                          </span>
                        )
                      )}
                    </div>
                    <h4 className="font-bold text-gray-900 truncate">{point.name}</h4>
                    <p className="text-xs text-gray-500 mt-1 truncate">{point.description}</p>
                  </div>
                  <div className="text-gray-300 group-hover:text-black transition-colors">
                    <ChevronRight size={20} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </>
  );
};

export default PointTimeline;
