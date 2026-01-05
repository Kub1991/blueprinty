import React from 'react';
import { useVerifier } from '../hooks';
import { PointVerifierCard } from './Creator';
import { Check, X, Edit2, Loader2, Sparkles, Share2 } from 'lucide-react';

interface CreatorVerifierProps {
  blueprintId?: string | null;
  onPublish: () => void;
  onCancel: () => void;
}

const CreatorVerifier: React.FC<CreatorVerifierProps> = ({ blueprintId, onPublish, onCancel }) => {
  const {
    loading,
    points,
    currentIndex,
    verifiedPoints,
    isProcessingPoint,
    inputValue,
    isEditing,
    editName,
    editDesc,
    editDay,
    editTimestamp,
    setInputValue,
    handleExtraction,
    startEditing,
    saveEdit,
    setEditName,
    setEditDesc,
    setEditDay,
    setEditTimestamp,
    handleApprove,
    handleReject,
    finalizeAndPublish,
    currentPoint,
    isComplete,
  } = useVerifier(blueprintId);

  const [isFinishing, setIsFinishing] = React.useState(false);

  const handleFinalPublish = async () => {
    setIsFinishing(true);
    try {
      await finalizeAndPublish();
      onPublish();
    } catch (e) {
      console.error("Failed to publish", e);
      alert("Wystąpił błąd podczas publikacji.");
    } finally {
      setIsFinishing(false);
    }
  };

  // Initial Input State
  if (points.length === 0 && !loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[80vh] p-6 max-w-2xl mx-auto font-sans">
        <div className="w-full space-y-6">
          <div className="text-center space-y-2">
            <h2 className="text-3xl font-bold tracking-tight">Nowy Blueprint</h2>
            <p className="text-gray-500">
              Wklej opis filmu lub transkrypcję. AI zrobi resztę.
            </p>
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

  // Success / Share Screen
  if (isComplete) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[80vh] p-6 text-center space-y-6 animate-in fade-in duration-500 font-sans">
        {/* Social Media Graphic Mockup */}
        <div className="w-64 aspect-[9/16] bg-black rounded-3xl shadow-2xl flex flex-col items-center justify-between text-white relative overflow-hidden border border-gray-800">
          <div className="absolute top-0 left-0 w-full h-full opacity-60 bg-[url('https://picsum.photos/seed/travel/400/800')] bg-cover"></div>
          <div className="z-10 w-full p-6 pt-12 bg-gradient-to-b from-black/80 to-transparent">
            <h3 className="text-2xl font-black leading-tight">
              JAPONIA
              <br />W 7 DNI
            </h3>
          </div>
          <div className="z-10 w-full p-6 pb-12 bg-gradient-to-t from-black/90 to-transparent flex flex-col gap-2">
            <div className="bg-white text-black px-4 py-3 rounded-xl font-bold text-sm text-center shadow-lg">
              Mój Plan Podróży <br />
              już dostępny!
            </div>
            <p className="text-[10px] text-gray-300 uppercase tracking-widest mt-2">
              Link w BIO
            </p>
          </div>
        </div>

        <div>
          <h2 className="text-3xl font-bold mb-2">Gotowe!</h2>
          <p className="text-gray-500 max-w-md">
            Zweryfikowałeś {verifiedPoints.length} punktów. Twój plan jest gotowy do
            sprzedaży.
          </p>
        </div>

        <button
          onClick={handleFinalPublish}
          disabled={isFinishing}
          className="w-full max-w-md bg-black text-white py-4 rounded-xl font-bold shadow-xl hover:shadow-2xl hover:scale-[1.01] transition flex items-center justify-center gap-2 disabled:opacity-50"
        >
          {isFinishing ? (
            <Loader2 size={18} className="animate-spin" />
          ) : (
            <>
              <Share2 size={18} /> Kopiuj Link do Sklepu
            </>
          )}
        </button>
      </div>
    );
  }

  // Main Verification Card View
  if (!currentPoint) return null;

  return (
    <div className="flex flex-col h-[calc(100vh-80px)] max-w-md mx-auto relative font-sans">
      {/* Header */}
      <div className="text-center py-4">
        <h2 className="font-bold text-lg">Weryfikator AI</h2>
        <p className="text-xs text-gray-400 uppercase tracking-wider">
          Punkt {currentIndex + 1} z {points.length}
        </p>
      </div>

      {/* Card */}
      <div className="flex-1 flex flex-col p-4">
        <div className="text-[10px] text-gray-400 break-all mb-2 font-mono bg-gray-100 p-2 rounded">
          DEBUG POINT: {JSON.stringify(currentPoint)}
        </div>
        <PointVerifierCard
          point={currentPoint}
          isEditing={isEditing}
          editName={editName}
          editDesc={editDesc}
          editDay={editDay}
          editTimestamp={editTimestamp}
          onEditNameChange={setEditName}
          onEditDescChange={setEditDesc}
          onEditDayChange={setEditDay}
          onEditTimestampChange={setEditTimestamp}
          onSaveEdit={saveEdit}
          isProcessing={isProcessingPoint}
        />
      </div>

      {/* Actions (Tinder Style) */}
      <div className="p-6 pb-8 flex items-center justify-center gap-6">
        <button
          onClick={handleReject}
          disabled={isProcessingPoint || isEditing}
          className="w-14 h-14 rounded-full bg-white border border-gray-200 shadow-lg flex items-center justify-center text-gray-400 hover:text-red-500 hover:border-red-200 hover:bg-red-50 hover:scale-110 transition disabled:opacity-50"
          title="Odrzuć (Pomyłka AI)"
        >
          <X size={28} />
        </button>

        <button
          onClick={startEditing}
          disabled={isProcessingPoint || isEditing}
          className="w-12 h-12 rounded-full bg-gray-50 border border-gray-100 flex items-center justify-center text-gray-600 hover:bg-gray-200 transition disabled:opacity-50"
          title="Edytuj"
        >
          <Edit2 size={20} />
        </button>

        <button
          onClick={handleApprove}
          disabled={isProcessingPoint || isEditing}
          className="w-20 h-20 rounded-full bg-black shadow-2xl flex items-center justify-center text-white hover:scale-105 hover:bg-gray-900 transition disabled:opacity-50 border-4 border-white ring-1 ring-gray-100"
          title="Zatwierdź"
        >
          <Check size={40} />
        </button>
      </div>
    </div>
  );
};

export default CreatorVerifier;