import React from 'react';
import ReactDOM from 'react-dom/client';
import { ConvexProvider, ConvexReactClient } from 'convex/react';
import { APIProvider } from '@vis.gl/react-google-maps';
import App from './App';

// Initialize Convex client
// The CONVEX_URL will be set after running `npx convex dev`
const convexUrl = import.meta.env.VITE_CONVEX_URL;
const googleMapsApiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || "";

const convex = convexUrl ? new ConvexReactClient(convexUrl) : null;

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);

// Wrap with ConvexProvider if convex client is available
root.render(
  <React.StrictMode>
    <APIProvider apiKey={googleMapsApiKey}>
      {convex ? (
        <ConvexProvider client={convex}>
          <App />
        </ConvexProvider>
      ) : (
        <App />
      )}
    </APIProvider>
  </React.StrictMode>
);