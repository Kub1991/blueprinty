import React, { useState, useRef, RefObject } from 'react';

export interface UseDrawerGesturesReturn {
  sheetHeight: number;
  setSheetHeight: (height: number) => void;
  sheetRef: RefObject<HTMLDivElement>;
  handleTouchStart: (e: React.TouchEvent) => void;
  handleTouchMove: (e: React.TouchEvent) => void;
  handleTouchEnd: () => void;
}

export const useDrawerGestures = (initialHeight: number = 45): UseDrawerGesturesReturn => {
  const [sheetHeight, setSheetHeight] = useState(initialHeight);
  const isDragging = useRef(false);
  const startY = useRef(0);
  const startHeight = useRef(0);
  const sheetRef = useRef<HTMLDivElement>(null);

  const handleTouchStart = (e: React.TouchEvent) => {
    isDragging.current = true;
    startY.current = e.touches[0].clientY;
    startHeight.current = sheetHeight;
    if (sheetRef.current) {
      sheetRef.current.style.transition = 'none';
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging.current) return;
    const currentY = e.touches[0].clientY;
    const deltaY = startY.current - currentY;
    const viewportHeight = window.innerHeight;
    const deltaPercentage = (deltaY / viewportHeight) * 100;

    let newHeight = startHeight.current + deltaPercentage;
    if (newHeight < 15) newHeight = 15;
    if (newHeight > 92) newHeight = 92;

    setSheetHeight(newHeight);
  };

  const handleTouchEnd = () => {
    isDragging.current = false;
    if (sheetRef.current) {
      sheetRef.current.style.transition = 'height 0.4s cubic-bezier(0.2, 0.8, 0.2, 1)';
    }

    // Snap logic
    if (sheetHeight > 60) {
      setSheetHeight(92);
    } else if (sheetHeight > 30) {
      setSheetHeight(45);
    } else {
      setSheetHeight(15);
    }
  };

  return {
    sheetHeight,
    setSheetHeight,
    sheetRef: sheetRef as RefObject<HTMLDivElement>,
    handleTouchStart,
    handleTouchMove,
    handleTouchEnd,
  };
};
