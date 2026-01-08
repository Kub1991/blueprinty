import { useState, useCallback } from 'react';
import { TripPoint } from '../types';

/**
 * Hook for managing active point selection in the trip view
 * Encapsulates point selection state and coordinates with drawer height
 */
export function useActivePoint(setSheetHeight?: (height: number) => void) {
    const [selectedPoint, setSelectedPointState] = useState<TripPoint | null>(null);

    /**
     * Select a point and optionally adjust drawer height
     */
    const selectPoint = useCallback((point: TripPoint) => {
        setSelectedPointState(point);
        // On mobile, when a point is selected, expand the drawer to show details
        if (setSheetHeight) {
            setSheetHeight(65);
        }
    }, [setSheetHeight]);

    /**
     * Clear point selection
     */
    const clearSelection = useCallback(() => {
        setSelectedPointState(null);
    }, []);

    return {
        selectedPoint,
        selectPoint,
        clearSelection,
    };
}
