import { useState, useEffect } from 'react';
import { TripPoint } from '../types';
import { extractPointsFromText, enrichPointWithMaps } from '../services/geminiService';
import { useQuery, useMutation } from 'convex/react';
import { api } from '../convex/_generated/api';
import { Id } from '../convex/_generated/dataModel';

export interface UseVerifierReturn {
    // State
    loading: boolean;
    points: TripPoint[];
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
    finalizeAndPublish: () => Promise<void>;
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
    const blueprintData = useQuery(api.blueprints.get, blueprintId ? { blueprintId: blueprintId as Id<"blueprints"> } : "skip");

    useEffect(() => {
        if (blueprintData && blueprintData.points) {
            const mappedPoints = (blueprintData.points as any[]).map(p => ({
                ...p,
                verified: false, // Initial state for verifier
                type: p.type.toUpperCase(), // Align with PointType enum
                timestamp: p.timestamp
            }));
            setPoints(mappedPoints as TripPoint[]);
            setInputValue("Plan załadowany z przetwarzania YouTube AI");
        }
    }, [blueprintData]);

    const handleExtraction = async () => {
        setLoading(true);
        const extracted = await extractPointsFromText(inputValue);
        const pointsWithDays = extracted.map((p) => ({ ...p, day: 1 }));
        setPoints(pointsWithDays);
        setLoading(false);
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
        const point = points[currentIndex];
        const enriched = await enrichPointWithMaps(point);

        // Preserve timestamp if it exists
        if (point.timestamp !== undefined) {
            enriched.timestamp = point.timestamp;
        }

        setVerifiedPoints([...verifiedPoints, enriched]);
        setIsProcessingPoint(false);

        moveToNext();
    };

    const handleReject = () => {
        moveToNext();
    };

    const updateBlueprint = useMutation(api.blueprints.update);
    const publishBlueprint = useMutation(api.blueprints.publish);

    const finalizeAndPublish = async () => {
        if (!blueprintId) return;

        // 1. Save all verified points to the blueprint
        await updateBlueprint({
            blueprintId: blueprintId as Id<"blueprints">,
            updates: {
                points: verifiedPoints
            }
        });

        // 2. Set status to published
        await publishBlueprint({ blueprintId: blueprintId as Id<"blueprints"> });
    };

    const currentPoint = points[currentIndex] || null;
    const isComplete = points.length > 0 && currentIndex >= points.length;

    return {
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
    };
};
