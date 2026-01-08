import React, { useState } from 'react';
import { ViewState } from './types';
import CreatorDashboard from './components/CreatorDashboard';
import CreatorVerifier from './components/CreatorVerifier';
import UserApp from './components/UserApp';
import { LayoutDashboard, Compass } from 'lucide-react';

const App: React.FC = () => {
  const [view, setView] = useState<ViewState>('LANDING');
  const [selectedBlueprintId, setSelectedBlueprintId] = useState<string | null>(null);
  const [verifyingInMapMode, setVerifyingInMapMode] = useState(false);

  const renderContent = () => {
    switch (view) {
      case 'CREATOR_DASHBOARD':
        return (
          <CreatorDashboard
            onVerifyClick={(id, startInMap) => {
              setSelectedBlueprintId(id || null);
              setVerifyingInMapMode(!!startInMap);
              setView('CREATOR_VERIFIER');
            }}
          />
        );
      case 'CREATOR_VERIFIER':
        return (
          <CreatorVerifier
            blueprintId={selectedBlueprintId}
            startInMapMode={verifyingInMapMode}
            onPublish={() => {
              setSelectedBlueprintId(null);
              setView('CREATOR_DASHBOARD');
            }}
            onCancel={() => {
              setSelectedBlueprintId(null);
              setView('CREATOR_DASHBOARD');
            }}
          />
        );
      case 'USER_DISCOVERY':
      case 'USER_PREVIEW':
      case 'USER_ACTIVE_TRIP':
        return <UserApp onBackToHome={() => setView('LANDING')} />;
      case 'LANDING':
      default:
        return (
          <div className="min-h-screen flex flex-col items-center justify-center p-8 text-center max-w-lg mx-auto">
            <h1 className="text-4xl font-extrabold mb-2 tracking-tight">Blueprinty.</h1>
            <p className="text-gray-500 mb-12">Travel video to interactive map in seconds.</p>

            <div className="w-full space-y-4">
              <button
                onClick={() => setView('USER_DISCOVERY')}
                className="w-full bg-black text-white p-4 rounded-xl font-bold flex items-center justify-center gap-3 shadow-lg hover:translate-y-[-2px] transition"
              >
                <Compass className="w-6 h-6" />
                I'm a Traveler
              </button>

              <button
                onClick={() => setView('CREATOR_DASHBOARD')}
                className="w-full bg-white border border-gray-200 text-black p-4 rounded-xl font-bold flex items-center justify-center gap-3 hover:bg-gray-50 transition"
              >
                <LayoutDashboard className="w-6 h-6" />
                I'm a Creator
              </button>
            </div>

            <p className="mt-8 text-xs text-gray-400">
              Demo Version 1.0 • Built with Gemini 2.5 Flash
            </p>
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen bg-white">
      {renderContent()}

      {/* Navigation (Only visible in active app modes, hidden in verifier/active trip for immersion if needed) */}
      {view === 'CREATOR_DASHBOARD' && (
        <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 flex justify-around p-4 z-50">
          <button
            onClick={() => setView('LANDING')}
            className="text-xs font-bold text-gray-400 hover:text-black"
          >
            Exit Demo
          </button>
        </nav>
      )}
    </div>
  );
};

export default App;
