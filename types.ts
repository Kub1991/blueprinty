export enum PointType {
  FOOD = 'food',
  STAY = 'stay',
  ACTIVITY = 'activity',
  INSTA = 'insta',
  TIP = 'tip',
}

export interface GroundingSource {
  title: string;
  uri: string;
  sourceType: 'MAPS' | 'SEARCH' | 'WEB';
}

export interface TripPoint {
  id: string;
  name: string;
  type: PointType;
  description: string; // The "tip" from the creator
  day?: number; // Chronological ordering
  lat?: number;
  lng?: number;
  address?: string;
  rating?: number;
  website?: string;
  priceLevel?: string;
  affiliateLink?: string;
  verified: boolean;
  googleMapsUrl?: string;
  isGeneric?: boolean;
  imageUrl?: string;
  photoReference?: string; // Added for Google Photos reference
  placeId?: string; // Added for fetching photos via JS SDK
  timestamp?: number; // Start time in seconds for YouTube video
  groundingSources?: GroundingSource[]; // For displaying citations
}

export interface Blueprint {
  id: string;
  videoId?: string;
  youtubeVideoId?: string;
  title: string;
  creatorName: string;
  creatorAvatar: string;
  thumbnailUrl: string;
  price: number;
  currency: string;
  rating: number; // New field for average plan rating
  region?: 'Asia' | 'Europe' | 'North America' | 'South America' | 'Africa' | 'Oceania'; // For Globe Filtering
  tags: string[];
  points: TripPoint[];
  description: string;
  isPurchased: boolean;
}

export type ViewState =
  | 'LANDING'
  | 'CREATOR_DASHBOARD'
  | 'CREATOR_VERIFIER'
  | 'CREATOR_SUCCESS'
  | 'USER_DISCOVERY'
  | 'USER_PREVIEW'
  | 'USER_ACTIVE_TRIP';
