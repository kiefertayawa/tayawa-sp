import { useState } from 'react';
import { Star, MessageSquare, User } from 'lucide-react';
import { useReviews } from '../../../hooks';

interface ReviewsSectionProps {
  storeId: string;
  storeName: string;
}

export default function ReviewsSection({ storeId, storeName }: ReviewsSectionProps) {
  const { reviews, loading, submitReview } = useReviews(storeId);
  const [showForm, setShowForm] = useState(false);
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [text, setText] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const avgRating = reviews.length ? (reviews.reduce((s,r) => s + r.rating, 0) / reviews.length) : 0;
  const ratingDist = [5,4,3,2,1].map(stars => ({
    stars,
    count: reviews.filter(r => r.rating === stars).length,
    pct: reviews.length ? (reviews.filter(r => r.rating === stars).length / reviews.length) * 100 : 0,
  }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (rating === 0) { setError('Please select a rating'); return; }
    if (!text.trim()) { setError('Please write a review'); return; }
    setSubmitting(true);
    const ok = await submitReview({ rating, text });
    setSubmitting(false);
    if (ok) { setShowForm(false); setRating(0); setText(''); }
  };

  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="font-semibold text-gray-800 text-base">Reviews & Ratings</h2>
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white rounded-lg"
          style={{backgroundColor:'#8B1538'}}
        >
          <MessageSquare className="w-4 h-4" />
          Write a Review
        </button>
      </div>

      {/* Rating Summary */}
      {reviews.length > 0 && (
        <div className="flex gap-8 mb-6">
          <div className="text-center flex-shrink-0">
            <p className="text-5xl font-bold text-gray-800">{avgRating.toFixed(1)}</p>
            <div className="flex gap-0.5 justify-center my-2">
              {[1,2,3,4,5].map(s => (
                <Star key={s} className={`w-5 h-5 ${s <= Math.round(avgRating) ? 'fill-yellow-400 text-yellow-400' : 'fill-gray-200 text-gray-200'}`} />
              ))}
            </div>
            <p className="text-sm text-gray-400">{reviews.length} reviews</p>
          </div>
          <div className="flex-1 space-y-2">
            {ratingDist.map(({ stars, count, pct }) => (
              <div key={stars} className="flex items-center gap-3">
                <span className="text-sm text-gray-500 w-12">{stars} stars</span>
                <div className="flex-1 bg-gray-100 rounded-full h-2">
                  <div className="h-2 rounded-full bg-yellow-400 transition-all" style={{width:`${pct}%`}} />
                </div>
                <span className="text-sm text-gray-400 w-4 text-right">{count}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Review Form */}
      {showForm && (
        <form onSubmit={handleSubmit} className="mb-6 p-4 border border-gray-100 rounded-xl bg-gray-50">
          <p className="font-medium text-sm text-gray-700 mb-3">Your Rating</p>
          <div className="flex gap-1 mb-3">
            {[1,2,3,4,5].map(s => (
              <button type="button" key={s} onMouseEnter={() => setHoverRating(s)} onMouseLeave={() => setHoverRating(0)} onClick={() => setRating(s)}>
                <Star className={`w-8 h-8 transition-colors ${s <= (hoverRating || rating) ? 'fill-yellow-400 text-yellow-400' : 'text-gray-200'}`} />
              </button>
            ))}
          </div>
          <textarea value={text} onChange={e => setText(e.target.value)} placeholder="Share your experience..." className="w-full p-3 text-sm border border-gray-200 rounded-xl resize-none focus:outline-none" rows={3} />
          {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
          <button type="submit" disabled={submitting} className="mt-3 px-5 py-2 text-white text-sm rounded-lg disabled:opacity-60" style={{backgroundColor:'#8B1538'}}>
            {submitting ? 'Submitting...' : 'Submit Review'}
          </button>
        </form>
      )}

      {/* Review List */}
      {loading ? (
        <div className="space-y-3">{[...Array(3)].map((_,i) => <div key={i} className="h-20 bg-gray-100 rounded-xl animate-pulse" />)}</div>
      ) : reviews.length === 0 ? (
        <div className="text-center py-8 text-gray-400">
          <MessageSquare className="w-10 h-10 mx-auto mb-2 text-gray-200" />
          <p className="text-sm">No reviews yet. Be the first!</p>
        </div>
      ) : (
        <div className="space-y-3">
          {reviews.map(review => (
            <div key={review._id} className="border border-gray-100 rounded-xl p-4">
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0">
                    <User className="w-4 h-4 text-gray-400" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-800">{review.userName}</p>
                    <p className="text-xs text-gray-400">{new Date(review.date).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</p>
                  </div>
                </div>
                <div className="flex gap-0.5">
                  {[1,2,3,4,5].map(s => <Star key={s} className={`w-4 h-4 ${s <= review.rating ? 'fill-yellow-400 text-yellow-400' : 'fill-gray-100 text-gray-100'}`} />)}
                </div>
              </div>
              <p className="text-sm text-gray-600 ml-11">{review.text}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
