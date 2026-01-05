/// <reference types="@types/google.maps" />
import React, { useEffect } from 'react';
import { Map, AdvancedMarker, Pin, useMap } from '@vis.gl/react-google-maps';
import { TripPoint } from '../../types';
import { POINT_COLORS_HEX, POINT_ICONS } from '../../constants';

interface MapViewProps {
    points: TripPoint[];
    selectedPoint: TripPoint | null;
    onSelectPoint: (point: TripPoint) => void;
    onClearSelection: () => void;
}

const MapContent = ({ points, selectedPoint, onSelectPoint }: MapViewProps) => {
    const map = useMap();

    useEffect(() => {
        if (!map || !selectedPoint || selectedPoint.lat === undefined || selectedPoint.lng === undefined) return;
        map.panTo({ lat: selectedPoint.lat, lng: selectedPoint.lng });
    }, [map, selectedPoint]);

    useEffect(() => {
        if (!map || points.length === 0) return;

        const bounds = new google.maps.LatLngBounds();
        let hasValidPoints = false;

        points.forEach(p => {
            if (p.lat !== undefined && p.lng !== undefined) {
                bounds.extend({ lat: p.lat, lng: p.lng });
                hasValidPoints = true;
            }
        });

        if (hasValidPoints) {
            map.fitBounds(bounds, 50);
        }
    }, [map, points]);

    return (
        <>
            {points.map((point) => {
                if (point.lat === undefined || point.lng === undefined) return null;

                const isSelected = selectedPoint?.id === point.id;
                const glyphColor = isSelected ? '#ffffff' : '#000000';
                const background = isSelected ? '#000000' : (POINT_COLORS_HEX[point.type] || '#ffffff');

                return (
                    <AdvancedMarker
                        key={point.id}
                        position={{ lat: point.lat, lng: point.lng }}
                        onClick={() => onSelectPoint(point)}
                        zIndex={isSelected ? 100 : 1}
                    >
                        <Pin
                            background={background}
                            glyphColor={glyphColor}
                            borderColor={'#ffffff'}
                            scale={isSelected ? 1.4 : 1.1}
                            glyphText={POINT_ICONS[point.type]}
                        />
                    </AdvancedMarker>
                );
            })}
        </>
    );
};

const MapView: React.FC<MapViewProps> = (props) => {
    return (
        <div className="flex-1 relative h-full bg-[#f8f9fa]">
            <Map
                mapId="bf51a910020fa2a6" // Sample Map ID for Advanced Markers
                defaultCenter={{ lat: 0, lng: 0 }}
                defaultZoom={3}
                gestureHandling={'greedy'}
                disableDefaultUI={true}
                className="w-full h-full"
                onClick={props.onClearSelection}
            >
                <MapContent {...props} />
            </Map>
        </div>
    );
};

export default MapView;
