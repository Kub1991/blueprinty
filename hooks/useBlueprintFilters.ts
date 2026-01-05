import { useState, useMemo } from 'react';
import { useQuery } from "convex/react";
import { api } from "../convex/_generated/api";
import { Blueprint } from '../types';

export interface BlueprintFilters {
  searchQuery: string;
  minRating: number | null;
  selectedTag: string | null;
  selectedCreator: string | null;
  selectedRegion: string | null;
}

export interface UseBlueprintFiltersReturn {
  filters: BlueprintFilters;
  setSearchQuery: (query: string) => void;
  setMinRating: (rating: number | null) => void;
  setSelectedTag: (tag: string | null) => void;
  setSelectedCreator: (creator: string | null) => void;
  setSelectedRegion: (region: string | null) => void;
  resetFilters: () => void;
  hasActiveFilters: boolean;
  filteredBlueprints: Blueprint[];
  allTags: string[];
  uniqueCreators: { name: string; avatar: string }[];
}

export const useBlueprintFilters = (): UseBlueprintFiltersReturn => {
  const [searchQuery, setSearchQuery] = useState('');
  const [minRating, setMinRating] = useState<number | null>(null);
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [selectedCreator, setSelectedCreator] = useState<string | null>(null);
  const [selectedRegion, setSelectedRegion] = useState<string | null>(null);

  const convexBlueprints = useQuery(api.blueprints.list);

  const blueprints = useMemo(() => {
    if (!convexBlueprints) return [];
    return convexBlueprints.map(bp => ({
      ...bp,
      id: bp._id,
      youtubeVideoId: bp.youtubeVideoId,
      isPurchased: false,
      currency: "PLN"
    })) as unknown as Blueprint[];
  }, [convexBlueprints]);

  const filteredBlueprints = useMemo(() => {
    return blueprints.filter(bp => {
      const matchesSearch =
        bp.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        bp.creatorName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        bp.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchesRating = minRating ? bp.rating >= minRating : true;
      const matchesTag = selectedTag ? bp.tags.includes(selectedTag) : true;
      const matchesCreator = selectedCreator ? bp.creatorName === selectedCreator : true;
      const matchesRegion = selectedRegion ? bp.region === selectedRegion : true;

      return matchesSearch && matchesRating && matchesTag && matchesCreator && matchesRegion;
    }).sort((a, b) => b.rating - a.rating);
  }, [blueprints, searchQuery, minRating, selectedTag, selectedCreator, selectedRegion]);

  const allTags = useMemo(() => {
    return Array.from(new Set(blueprints.flatMap(bp => bp.tags)));
  }, [blueprints]);

  const uniqueCreators = useMemo(() => {
    const creators = new Map<string, string>();
    blueprints.forEach(bp => {
      if (!creators.has(bp.creatorName)) {
        creators.set(bp.creatorName, bp.creatorAvatar);
      }
    });
    return Array.from(creators.entries()).map(([name, avatar]) => ({ name, avatar }));
  }, [blueprints]);

  const resetFilters = () => {
    setMinRating(null);
    setSelectedTag(null);
    setSelectedCreator(null);
    setSelectedRegion(null);
    setSearchQuery('');
  };

  const hasActiveFilters = !!(minRating || selectedTag || selectedCreator || selectedRegion || searchQuery);

  return {
    filters: {
      searchQuery,
      minRating,
      selectedTag,
      selectedCreator,
      selectedRegion,
    },
    setSearchQuery,
    setMinRating,
    setSelectedTag,
    setSelectedCreator,
    setSelectedRegion,
    resetFilters,
    hasActiveFilters,
    filteredBlueprints,
    allTags,
    uniqueCreators,
  };
};
