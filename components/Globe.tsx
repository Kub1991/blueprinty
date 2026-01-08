import React, { useEffect, useRef } from 'react';
import createGlobe from 'cobe';

interface Marker {
  location: [number, number];
  size: number;
}

interface GlobeProps {
  markers: Marker[];
  focusOn?: [number, number]; // [lat, lng] to rotate to
}

const Globe: React.FC<GlobeProps> = ({ markers, focusOn }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const pointerInteracting = useRef<number | null>(null);
  const pointerInteractionMovement = useRef(0);

  // Physics state for rotation (replacing react-spring)
  const phiRef = useRef(0); // Current rotation
  const targetPhiRef = useRef(0); // Target rotation
  const velocityRef = useRef(0); // Velocity

  useEffect(() => {
    if (focusOn) {
      // Convert lat/lng to phi (rotation)
      // Phi = 0 is roughly Greenwich.
      const [_lat, lng] = focusOn;
      const phi = lng * (Math.PI / 180);
      targetPhiRef.current = phi;
    }
  }, [focusOn]);

  useEffect(() => {
    let width = 0;
    const onResize = () => canvasRef.current && (width = canvasRef.current.offsetWidth);
    window.addEventListener('resize', onResize);
    onResize();

    if (!canvasRef.current) return;

    const globe = createGlobe(canvasRef.current, {
      devicePixelRatio: 2,
      width: width * 2,
      height: width * 2,
      phi: 0,
      theta: 0.3,
      dark: 0,
      diffuse: 1.2,
      mapSamples: 16000,
      mapBrightness: 6,
      baseColor: [0.1, 0.3, 0.6], // Blue Ocean
      markerColor: [1, 0.8, 0], // Gold/Yellow Pins
      glowColor: [0.8, 0.9, 1], // Light atmosphere
      opacity: 0.8,
      markers: markers,
      onRender: (state) => {
        // This is called on every animation frame

        // 1. Calculate Target
        // If not focusing and not dragging, auto-rotate
        if (!focusOn && !pointerInteracting.current) {
          targetPhiRef.current += 0.005;
        }

        // 2. Spring Physics (Current -> Target)
        // F = -k * x - c * v
        const k = 0.1; // Stiffness
        const d = 0.9; // Damping

        const dist = targetPhiRef.current - phiRef.current;
        const acc = dist * k;
        velocityRef.current += acc;
        velocityRef.current *= d;

        phiRef.current += velocityRef.current;

        // 3. Apply to state with user interaction
        state.phi = phiRef.current + pointerInteractionMovement.current;
      },
    });

    setTimeout(() => (canvasRef.current!.style.opacity = '1'));
    return () => {
      globe.destroy();
      window.removeEventListener('resize', onResize);
    };
  }, [markers, focusOn]); // Recreate only if markers or focus change.

  return (
    <div className="w-full h-full flex items-center justify-center relative overflow-hidden bg-gradient-to-b from-blue-50 to-white">
      <div style={{ width: '100%', maxWidth: 600, aspectRatio: 1 }} className="relative">
        <canvas
          ref={canvasRef}
          style={{
            width: '100%',
            height: '100%',
            contain: 'layout paint size',
            opacity: 0,
            transition: 'opacity 1s ease',
          }}
          onPointerDown={(e) => {
            pointerInteracting.current = e.clientX - pointerInteractionMovement.current;
            canvasRef.current!.style.cursor = 'grabbing';
          }}
          onPointerUp={() => {
            pointerInteracting.current = null;
            canvasRef.current!.style.cursor = 'grab';
          }}
          onPointerOut={() => {
            pointerInteracting.current = null;
            canvasRef.current!.style.cursor = 'grab';
          }}
          onMouseMove={(e) => {
            if (pointerInteracting.current !== null) {
              const delta = e.clientX - pointerInteracting.current;
              pointerInteractionMovement.current = delta * 0.005;
            }
          }}
          onTouchMove={(e) => {
            if (pointerInteracting.current !== null && e.touches[0]) {
              const delta = e.touches[0].clientX - pointerInteracting.current;
              pointerInteractionMovement.current = delta * 0.005;
            }
          }}
        />
      </div>

      {/* Atmosphere Glow Effect */}
      <div className="absolute inset-0 pointer-events-none bg-radial-gradient from-transparent to-white opacity-20"></div>
    </div>
  );
};

export default Globe;
