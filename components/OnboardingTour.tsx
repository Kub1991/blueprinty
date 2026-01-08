import React, { useState, useEffect, useCallback, useRef } from 'react';
import { X, ChevronRight, MapPin } from 'lucide-react';

export interface TourStep {
  targetId?: string;
  title: string;
  content: string;
  position?: 'top' | 'bottom' | 'left' | 'right' | 'center';
}

interface OnboardingTourProps {
  steps: TourStep[];
  isOpen: boolean;
  onComplete: () => void;
}

const OnboardingTour: React.FC<OnboardingTourProps> = ({ steps, isOpen, onComplete }) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [targetRect, setTargetRect] = useState<DOMRect | null>(null);
  const [isPositioning, setIsPositioning] = useState(true);

  // Refs to calculate tooltip dimensions for collision detection
  const tooltipRef = useRef<HTMLDivElement>(null);

  const step = steps[currentStep];
  const isLastStep = currentStep === steps.length - 1;

  const updatePosition = useCallback(() => {
    if (!step.targetId) {
      setTargetRect(null);
      setIsPositioning(false);
      return;
    }

    const element = document.getElementById(step.targetId);
    if (element) {
      // Scroll into view if needed
      element.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'center' });

      // Wait a bit for scroll to finish or layout to settle
      setTimeout(() => {
        const rect = element.getBoundingClientRect();
        setTargetRect(rect);
        setIsPositioning(false);
      }, 400);
    } else {
      setTargetRect(null);
      setIsPositioning(false);
    }
  }, [step.targetId]);

  useEffect(() => {
    if (isOpen) {
      setIsPositioning(true);
      updatePosition();
      window.addEventListener('resize', updatePosition);
      window.addEventListener('scroll', updatePosition);

      return () => {
        window.removeEventListener('resize', updatePosition);
        window.removeEventListener('scroll', updatePosition);
      };
    }
  }, [isOpen, currentStep, updatePosition]);

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setIsPositioning(true);
      setTimeout(() => setCurrentStep((prev) => prev + 1), 200);
    } else {
      onComplete();
    }
  };

  const handlePrev = () => {
    if (currentStep > 0) {
      setIsPositioning(true);
      setTimeout(() => setCurrentStep((prev) => prev - 1), 200);
    }
  };

  if (!isOpen) return null;

  // --- SMART POSITIONING LOGIC ---
  const getTooltipPosition = (): { style: React.CSSProperties; transform: string } => {
    const baseStyle: React.CSSProperties = { position: 'fixed', zIndex: 70 };

    // Default / Fallback to Center
    if (!targetRect || step.position === 'center') {
      return {
        style: {
          ...baseStyle,
          top: '50%',
          left: '50%',
        },
        transform: 'translate(-50%, -50%)',
      };
    }

    const viewportW = window.innerWidth;
    const viewportH = window.innerHeight;
    const tooltipW = 320; // Approx width
    const tooltipH = 300; // Approx max height
    const gap = 16;
    const margin = 16; // Safe edge margin

    // 1. Horizontal Clamping (Prevent X overflow)
    let left = targetRect.left + targetRect.width / 2;
    // Clamp left so the tooltip (centered at 'left') doesn't go off screen
    // left - (tooltipW/2) >= margin  => left >= margin + tooltipW/2
    const minLeft = margin + tooltipW / 2;
    const maxLeft = viewportW - margin - tooltipW / 2;

    if (left < minLeft) left = minLeft;
    if (left > maxLeft) left = maxLeft;

    // 2. Vertical Auto-Flip (Prevent Y overflow)
    let finalPos = step.position;

    // Check space available
    const spaceTop = targetRect.top;
    const spaceBottom = viewportH - targetRect.bottom;

    if (finalPos === 'top' && spaceTop < tooltipH + gap) {
      // Not enough space on top, flip to bottom if more space there
      if (spaceBottom > spaceTop) finalPos = 'bottom';
    } else if (finalPos === 'bottom' && spaceBottom < tooltipH + gap) {
      // Not enough space on bottom, flip to top if more space there
      if (spaceTop > spaceBottom) finalPos = 'top';
    }

    let top = 0;
    let transform = '';

    if (finalPos === 'top') {
      top = targetRect.top - gap;
      transform = 'translate(-50%, -100%)';
    } else {
      // Bottom
      top = targetRect.bottom + gap;
      transform = 'translate(-50%, 0)';
    }

    // 3. Final Safety Clamp (if element is huge or off screen)
    // If calculated top puts it offscreen top
    if (finalPos === 'top' && top < margin + tooltipH) {
      // It might still be cut off if we just use 'top'.
      // But usually the flip logic handles this.
      // If still issue, we could force center, but let's stick to flip.
    }

    return {
      style: {
        ...baseStyle,
        top: top,
        left: left,
      },
      transform: transform,
    };
  };

  const { style, transform } = getTooltipPosition();

  const boxPadding = 6;

  return (
    <div className="fixed inset-0 z-[60] overflow-hidden font-sans">
      {/* Spotlight Backdrop */}
      <div
        className="absolute inset-0 transition-all duration-700 ease-out"
        style={{
          backgroundColor: targetRect ? 'transparent' : 'rgba(0,0,0,0.7)',
        }}
      >
        {targetRect && (
          <div
            className="absolute rounded-xl transition-all duration-500 ease-in-out border-2 border-white/40 shadow-[0_0_40px_rgba(255,255,255,0.2)]"
            style={{
              top: targetRect.top - boxPadding,
              left: targetRect.left - boxPadding,
              width: targetRect.width + boxPadding * 2,
              height: targetRect.height + boxPadding * 2,
              boxShadow: '0 0 0 9999px rgba(0, 0, 0, 0.8)',
              pointerEvents: 'none',
            }}
          />
        )}
      </div>

      {/* Tooltip Card */}
      <div
        ref={tooltipRef}
        className={`bg-white/95 backdrop-blur-xl rounded-2xl shadow-[0_20px_60px_rgba(0,0,0,0.5)] w-[320px] md:w-[360px] max-w-[calc(100vw-32px)] transition-all duration-500 border border-white/20 ${isPositioning ? 'opacity-0 scale-95' : 'opacity-100 scale-100'}`}
        style={style}
      >
        <div style={{ transform }} className="w-full transition-transform duration-500">
          {/* Progress Bar */}
          <div className="h-1.5 w-full bg-gray-100 rounded-t-2xl overflow-hidden">
            <div
              className="h-full bg-black transition-all duration-500 ease-out"
              style={{ width: `${((currentStep + 1) / steps.length) * 100}%` }}
            ></div>
          </div>

          <div className="p-6">
            <div className="flex justify-between items-start mb-4">
              <div className="flex items-center gap-2">
                <span className="flex items-center justify-center w-6 h-6 rounded-full bg-black text-white text-[10px] font-bold shadow-md">
                  {currentStep + 1}
                </span>
                <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                  z {steps.length}
                </span>
              </div>
              <button
                onClick={onComplete}
                className="text-gray-400 hover:text-black transition p-1 hover:bg-gray-100 rounded-full"
              >
                <X size={16} />
              </button>
            </div>

            <h3 className="text-xl font-bold mb-2 text-gray-900 leading-tight">{step.title}</h3>
            <p className="text-sm text-gray-600 leading-relaxed mb-6">{step.content}</p>

            <div className="flex items-center justify-between gap-4">
              <button
                onClick={handlePrev}
                disabled={currentStep === 0}
                className={`text-sm font-bold transition-colors ${currentStep === 0 ? 'text-gray-300 cursor-not-allowed' : 'text-gray-500 hover:text-black'}`}
              >
                Wstecz
              </button>

              <button
                onClick={handleNext}
                className={`flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-bold shadow-xl transition-all transform hover:scale-105 active:scale-95 ${
                  isLastStep
                    ? 'bg-black text-white hover:bg-gray-800 ring-4 ring-black/10'
                    : 'bg-black text-white hover:bg-gray-800'
                }`}
              >
                {isLastStep ? 'Rozpocznij Podróż' : 'Dalej'}
                {isLastStep ? <MapPin size={16} /> : <ChevronRight size={16} />}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OnboardingTour;
