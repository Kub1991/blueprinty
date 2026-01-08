import React from 'react';
import { Star } from 'lucide-react';

export interface Review {
  id: number;
  user: string;
  avatar: string;
  rating: number;
  date: string;
  text: string;
}

interface ReviewListProps {
  reviews: Review[];
  averageRating?: number;
}

const ReviewList: React.FC<ReviewListProps> = ({ reviews, averageRating = 4.9 }) => {
  return (
    <div className="space-y-8 pt-8 border-t border-gray-100">
      <div className="flex items-center justify-between">
        <h3 className="text-2xl font-bold text-gray-900">Opinie Podróżników</h3>
        <div className="flex items-center gap-2">
          <Star size={20} className="text-yellow-400 fill-yellow-400" />
          <span className="text-xl font-bold text-gray-900">{averageRating}</span>
          <span className="text-sm text-gray-400 font-medium">({reviews.length} opinii)</span>
        </div>
      </div>

      <div className="grid gap-6">
        {reviews.map((review) => (
          <div
            key={review.id}
            className="bg-gray-50 p-6 rounded-3xl border border-gray-100 flex gap-4 transition-all hover:bg-white hover:shadow-lg hover:border-gray-200 hover:-translate-y-1"
          >
            <img
              src={review.avatar}
              alt={review.user}
              className="w-12 h-12 rounded-full bg-white border border-gray-200"
            />
            <div className="flex-1">
              <div className="flex justify-between items-start mb-2">
                <div>
                  <h4 className="font-bold text-gray-900 text-sm">{review.user}</h4>
                  <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">
                    {review.date}
                  </span>
                </div>
                <div className="flex gap-0.5">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      size={12}
                      className={
                        i < review.rating
                          ? 'text-yellow-400 fill-yellow-400'
                          : 'text-gray-200 fill-gray-200'
                      }
                    />
                  ))}
                </div>
              </div>
              <p className="text-gray-600 text-sm leading-relaxed font-medium">"{review.text}"</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ReviewList;
