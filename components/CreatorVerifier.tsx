import React, { useState } from 'react';
import { useVerifier } from '../hooks';
import MapVerifier from './Creator/MapVerifier';
import { Loader2, Sparkles, Map } from 'lucide-react';
import { POINT_ICONS, POINT_COLORS } from '../constants';

interface CreatorVerifierProps {
  blueprintId?: string | null;
  onPublish: () => void;
  onCancel: () => void;
  startInMapMode?: boolean;
}

const CreatorVerifier: React.FC<CreatorVerifierProps> = ({
  blueprintId,
  onPublish,
  onCancel,
  startInMapMode = false,
}) => {
  const {
    loading,
    points,
    setPoints, // Get the setter
    inputValue,
    setInputValue,
    handleExtraction,
    finalizeAndPublish,
  } = useVerifier(blueprintId);

  const [isFinishing, setIsFinishing] = React.useState(false);
  const [showMapEditor, setShowMapEditor] = useState(startInMapMode);

  const handleFinalPublish = async (verified: boolean = false) => {
    setIsFinishing(true);
    try {
      await finalizeAndPublish(verified);
      onPublish();
    } catch (e) {
      console.error('Failed to publish', e);
      alert('Wystąpił błąd podczas publikacji.');
    } finally {
      setIsFinishing(false);
    }
  };

  // Initial Input State
  if (!blueprintId && points.length === 0 && !loading) {
    // ... (Keep existing input state) ...
    return (
      <div className="flex flex-col items-center justify-center min-h-[80vh] p-6 max-w-2xl mx-auto font-sans">
        <div className="w-full space-y-6">
          <div className="text-center space-y-2">
            <h2 className="text-3xl font-bold tracking-tight">Nowy Blueprint</h2>
            <p className="text-gray-500">Wklej opis filmu lub transkrypcję. AI zrobi resztę.</p>
          </div>

          <textarea
            className="w-full h-48 p-4 rounded-xl border border-gray-200 focus:ring-2 focus:ring-black focus:outline-none resize-none bg-gray-50"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder="Opisz swoją podróż lub wklej transkrypcję..."
          />

          <button
            onClick={handleExtraction}
            className="w-full bg-black text-white py-4 rounded-xl font-bold text-lg flex items-center justify-center gap-2 hover:scale-[1.01] transition shadow-xl"
          >
            <Sparkles size={20} /> Generuj Blueprint
          </button>

          <button
            onClick={onCancel}
            className="w-full py-2 text-gray-400 hover:text-black transition"
          >
            Anuluj
          </button>
        </div>
      </div>
    );
  }

  // Loading State
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[80vh]">
        <Loader2 size={40} className="animate-spin mb-4 text-black" />
        <p className="text-gray-900 font-bold">AI analizuje Twój film...</p>
        <p className="text-gray-500 text-sm">Kategoryzacja punktów (Food, Stay, Insta)...</p>
      </div>
    );
  }

  // PREVIEW MODE (Grid of points)
  if (!showMapEditor) {
    return (
      <div className="max-w-4xl mx-auto p-6 min-h-screen font-sans pb-32">
        <div className="text-center mb-8 space-y-2">
          <h2 className="text-3xl font-black tracking-tight">
            AI znalazło {points.length} punktów
          </h2>
          <p className="text-gray-500">
            Oto lista atrakcji wyciągniętych z Twojego filmu. Co chcesz z nimi zrobić?
          </p>
        </div>

        {/* Points Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-12">
          {points.map((point) => (
            <div
              key={point.id}
              className="bg-white border border-gray-100 p-4 rounded-2xl flex items-center gap-4 shadow-sm hover:shadow-md transition"
            >
              <div
                className={`w-12 h-12 rounded-xl flex items-center justify-center text-xl shadow-sm border-2 border-white ${POINT_COLORS[point.type]}`}
              >
                {POINT_ICONS[point.type]}
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="font-bold text-gray-900 truncate">{point.name}</h4>
                <p className="text-xs text-gray-400 truncate">{point.description}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Actions Footer */}
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 p-6 flex flex-col md:flex-row items-center justify-center gap-4 z-50">
          <button
            onClick={() => setShowMapEditor(true)}
            className="w-full md:w-auto px-8 py-4 bg-gray-100 hover:bg-gray-200 text-gray-900 rounded-2xl font-bold text-sm transition flex items-center justify-center gap-2"
          >
            <Map size={18} />
            Edytuj na Mapie
          </button>

          <button
            onClick={() => handleFinalPublish(false)}
            disabled={isFinishing}
            className="w-full md:w-auto px-12 py-4 bg-gray-900 hover:bg-black text-white rounded-2xl font-bold text-sm shadow-xl transition disabled:opacity-50 flex items-center justify-center gap-2 group"
          >
            {isFinishing ? (
              <Loader2 size={18} className="animate-spin" />
            ) : (
              <>
                <Sparkles
                  size={18}
                  className="text-purple-400 group-hover:rotate-12 transition-transform"
                />
                Publikuj jako AI
              </>
            )}
          </button>
        </div>
      </div>
    );
  }

  // MAP VERIFIER (Editor View)
  return (
    <MapVerifier
      points={points}
      setPoints={setPoints}
      onSaveAndContinue={() => handleFinalPublish(true)}
      isPublishing={isFinishing}
    />
  );
};

export default CreatorVerifier;
