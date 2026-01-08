import React, { useState, useEffect } from 'react';
import { TripPoint } from '../types';
import { useQuery, useMutation, useAction } from 'convex/react';
import { api } from '../convex/_generated/api';
import { Id } from '../convex/_generated/dataModel';

// Helpers to create unique IDs (client side is fine for temporary IDs)
const generateId = () => Math.random().toString(36).substr(2, 9);

interface ExtractedPoint {
  name: string;
  description: string;
  type: string;
  day?: number;
}

interface EnrichedData {
  lat?: number;
  lng?: number;
  address?: string;
  googleMapsUrl?: string;
  photoReference?: string;
  placeId?: string;
}

interface BlueprintPoint {
  name: string;
  description: string;
  type: string;
  day?: number;
  timestamp?: number;
}

export interface UseVerifierReturn {
  // State
  loading: boolean;
  points: TripPoint[];
  setPoints: React.Dispatch<React.SetStateAction<TripPoint[]>>;
  currentIndex: number;
  verifiedPoints: TripPoint[];
  isProcessingPoint: boolean;
  inputValue: string;
  // Edit state
  isEditing: boolean;
  editName: string;
  editDesc: string;
  editDay: number;
  editTimestamp: number;
  // Actions
  setInputValue: (value: string) => void;
  handleExtraction: () => Promise<void>;
  startEditing: () => void;
  saveEdit: () => void;
  setEditName: (name: string) => void;
  setEditDesc: (desc: string) => void;
  setEditDay: (day: number) => void;
  setEditTimestamp: (timestamp: number) => void;
  handleApprove: () => Promise<void>;
  handleReject: () => void;
  finalizeAndPublish: (verified?: boolean) => Promise<void>;
  // Computed
  currentPoint: TripPoint | null;
  isComplete: boolean;
}

const DEFAULT_INPUT = `W tym odcinku zwiedzaliśmy Kioto. Zaczęliśmy o 6 rano w Fushimi Inari Taisha żeby uniknąć tłumów - góra jest pusta! Potem poszliśmy na najlepsze lody matcha do pobliskiej kawiarni Cafe Arbosh. Na obiad wpadliśmy do Kichi Kichi Omurice, to miejsce z latającym ryżem. Spaliśmy w kapsułowym hotelu The Millenials, mega futurystyczny klimat.`;

export const useVerifier = (blueprintId?: string | null): UseVerifierReturn => {
  const [loading, setLoading] = useState(false);
  const [points, setPoints] = useState<TripPoint[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [verifiedPoints, setVerifiedPoints] = useState<TripPoint[]>([]);
  const [isProcessingPoint, setIsProcessingPoint] = useState(false);
  const [inputValue, setInputValue] = useState(DEFAULT_INPUT);

  // Edit Mode State
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState('');
  const [editDesc, setEditDesc] = useState('');
  const [editDay, setEditDay] = useState(1);
  const [editTimestamp, setEditTimestamp] = useState(0);

  // Load live data if blueprintId is provided
  const blueprintData = useQuery(
    api.blueprints.get,
    blueprintId ? { blueprintId: blueprintId as Id<'blueprints'> } : 'skip'
  );

  const extractPointsAction = useAction(api.actions.prompt.extractFromText);
  const enrichPointAction = useAction(api.actions.prompt.enrichPoint);

  useEffect(() => {
    if (blueprintData && blueprintData.points) {
      const mappedPoints = (blueprintData.points as BlueprintPoint[]).map((p) => ({
        ...p,
        verified: false, // Initial state for verifier
        type: (p.type || 'activity').toLowerCase(), // Align with PointType enum
        timestamp: p.timestamp,
      }));
      setPoints(mappedPoints as TripPoint[]);
      setInputValue('Plan załadowany z przetwarzania YouTube AI');
    }
  }, [blueprintData]);

  const handleExtraction = async () => {
    setLoading(true);
    try {
      const extracted = await extractPointsAction({ text: inputValue });
      const pointsWithIds = extracted.map((p: ExtractedPoint) => ({
        ...p,
        id: generateId(),
        day: p.day || 1,
      }));
      setPoints(pointsWithIds as TripPoint[]);
    } catch (e) {
      console.error('Extraction failed', e);
      alert('Błąd podczas analizy tekstu. Spróbuj ponownie.');
    } finally {
      setLoading(false);
    }
  };

  const startEditing = () => {
    const p = points[currentIndex];
    if (!p) return;
    setEditName(p.name);
    setEditDesc(p.description);
    setEditDay(p.day || 1);
    setEditTimestamp(p.timestamp || 0);
    setIsEditing(true);
  };

  const saveEdit = () => {
    const updatedPoints = [...points];
    updatedPoints[currentIndex] = {
      ...updatedPoints[currentIndex],
      name: editName,
      description: editDesc,
      day: editDay,
      timestamp: editTimestamp,
    };
    setPoints(updatedPoints);
    setIsEditing(false);
  };

  const moveToNext = () => {
    if (currentIndex < points.length) {
      setCurrentIndex((prev) => prev + 1);
    }
  };

  const handleApprove = async () => {
    if (!points[currentIndex]) return;

    setIsProcessingPoint(true);
    try {
      const point = points[currentIndex];
      const enrichedData = (await enrichPointAction({
        name: point.name,
        description: point.description,
      })) as EnrichedData;

      const enriched: TripPoint = {
        ...point,
        ...enrichedData,
        verified: true,
        timestamp: point.timestamp, // Preserve timestamp
      };

      setVerifiedPoints([...verifiedPoints, enriched]);
    } catch (e) {
      console.error('Enrichment failed', e);
      // Fallback: move with current data but marked as verified
      setVerifiedPoints([...verifiedPoints, { ...points[currentIndex], verified: true }]);
    } finally {
      setIsProcessingPoint(false);
      moveToNext();
    }
  };

  const handleReject = () => {
    moveToNext();
  };

  const updateBlueprint = useMutation(api.blueprints.update);
  const publishBlueprint = useMutation(api.blueprints.publish);

  const finalizeAndPublish = async (verified: boolean = true) => {
    if (!blueprintId) return;

    // 1. Save all points (Map Verifier edits 'points' directly)
    // If we used the Card flow, 'verifiedPoints' would be populated.
    // If we use Map flow, 'points' is the source of truth.
    // We prefer 'points' if map flow is active.
    const pointsToSave = points.length > 0 ? points : verifiedPoints;

    // Clean points to match schema (remove extra fields like 'verified')
    const cleanedPoints = pointsToSave.map((p) => ({
      id: p.id,
      name: p.name,
      description: p.description,
      type: p.type,
      day: p.day,
      timestamp: p.timestamp,
      lat: p.lat,
      lng: p.lng,
      address: p.address,
      googleMapsUrl: p.googleMapsUrl,
      imageUrl: p.imageUrl,
      photoReference: p.photoReference,
      placeId: p.placeId,
      isGeneric: p.isGeneric,
    }));

    await updateBlueprint({
      blueprintId: blueprintId as Id<'blueprints'>,
      updates: {
        points: cleanedPoints,
      },
    });

    // 2. Set status to published
    await publishBlueprint({
      blueprintId: blueprintId as Id<'blueprints'>,
      verified: verified,
    });
  };

  const currentPoint = points[currentIndex] || null;
  const isComplete = points.length > 0 && currentIndex >= points.length;

  return {
    loading,
    points,
    setPoints, // Exported setter
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
  };
};
