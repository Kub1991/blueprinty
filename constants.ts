
import { PointType } from './types';

export const POINT_COLORS = {
  [PointType.FOOD]: 'bg-yellow-400 text-black border-yellow-500',
  [PointType.STAY]: 'bg-purple-500 text-white border-purple-600',
  [PointType.ACTIVITY]: 'bg-green-500 text-white border-green-600',
  [PointType.INSTA]: 'bg-pink-500 text-white border-pink-600',
  [PointType.TIP]: 'bg-blue-500 text-white border-blue-600',
};

export const POINT_COLORS_HEX = {
  [PointType.FOOD]: '#FACC15',
  [PointType.STAY]: '#A855F7',
  [PointType.ACTIVITY]: '#22C55E',
  [PointType.INSTA]: '#EC4899',
  [PointType.TIP]: '#3B82F6',
};

export const POINT_ICONS = {
  [PointType.FOOD]: '🍜',
  [PointType.STAY]: '🛏️',
  [PointType.ACTIVITY]: '🎡',
  [PointType.INSTA]: '📸',
  [PointType.TIP]: '💡',
};
export const POINT_TYPES = [
  PointType.FOOD,
  PointType.STAY,
  PointType.ACTIVITY,
  PointType.INSTA,
  PointType.TIP,
];
