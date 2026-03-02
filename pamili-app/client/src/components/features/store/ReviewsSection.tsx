import { useState } from 'react';
import { Star, MessageSquare, User, Upload } from 'lucide-react';
import { useReviews } from '../../../hooks';

interface ReviewsSectionProps {
  storeId: string;
  storeName: string;
}

export default function ReviewsSection({ storeId, storeName: _storeName }: ReviewsSectionProps) {
  const { reviews, loading, submitReview } = useReviews(storeId);
  const [showForm, setShowForm] = useState(false);
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [text, setText] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const avgRating = reviews.length
    ? reviews.reduce((s, r) => s + r.rating, 0) / reviews.length
    : 0;

  const ratingDist = [5, 4, 3, 2, 1].map(stars => ({
    stars,
    count: reviews.filter(r => r.rating === stars).length,
    pct: reviews.length
      ? (reviews.filter(r => r.rating === stars).length / reviews.length) * 100
      : 0,
  }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (rating === 0) { setError('Please select a rating.'); return; }
    if (!text.trim()) { setError('Please write a review.'); return; }
    setSubmitting(true);
    const ok = await submitReview({ rating, text });
    setSubmitting(false);
    if (ok) {
      setShowForm(false);
      setRating(0);
      setText('');
    }
  };

  return (
    <div>

      {/* ── Reviews & Ratings ─────────────────────── */}
      <div
        style={{
          backgroundColor: '#fff',
          borderRadius: '16px',
          border: '1px solid #e5e7eb',
          padding: '24px',
          marginBottom: '16px',
        }}
      >
        {/* Header row */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
          <h2 style={{ fontWeight: 700, fontSize: '1rem', color: '#111827', margin: 0 }}>Reviews &amp; Ratings</h2>
          <button
            onClick={() => setShowForm(prev => !prev)}
            style={{
              display: 'flex', alignItems: 'center', gap: '7px',
              padding: '9px 18px',
              fontSize: '0.875rem', fontWeight: 600,
              color: '#fff', backgroundColor: '#8B1538',
              border: 'none', borderRadius: '10px', cursor: 'pointer',
            }}
          >
            <MessageSquare style={{ width: 15, height: 15 }} />
            Write a Review
          </button>
        </div>

        {/* Rating summary */}
        {reviews.length > 0 && (
          <div style={{ display: 'flex', gap: '40px', marginBottom: '28px', alignItems: 'center' }}>
            {/* Big number */}
            <div style={{ textAlign: 'center', flexShrink: 0 }}>
              <p style={{ fontSize: '3.5rem', fontWeight: 800, color: '#111827', lineHeight: 1, margin: '0 0 8px' }}>
                {avgRating.toFixed(1)}
              </p>
              <div style={{ display: 'flex', gap: '3px', justifyContent: 'center', marginBottom: '6px' }}>
                {[1, 2, 3, 4, 5].map(s => (
                  <Star
                    key={s}
                    style={{
                      width: 20, height: 20,
                      fill: s <= Math.round(avgRating) ? '#facc15' : '#e5e7eb',
                      color: s <= Math.round(avgRating) ? '#facc15' : '#e5e7eb',
                    }}
                  />
                ))}
              </div>
              <p style={{ fontSize: '0.8rem', color: '#9ca3af', margin: 0 }}>{reviews.length} reviews</p>
            </div>

            {/* Bar chart */}
            <div style={{ flex: 1 }}>
              {ratingDist.map(({ stars, count, pct }) => (
                <div key={stars} style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                  <span style={{ fontSize: '0.8rem', color: '#6b7280', width: '44px', flexShrink: 0 }}>
                    {stars} stars
                  </span>
                  <div style={{ flex: 1, height: '8px', backgroundColor: '#f3f4f6', borderRadius: '4px', overflow: 'hidden' }}>
                    <div
                      style={{
                        width: `${pct}%`,
                        height: '100%',
                        backgroundColor: '#facc15',
                        borderRadius: '4px',
                        transition: 'width 0.4s',
                      }}
                    />
                  </div>
                  <span style={{ fontSize: '0.8rem', color: '#9ca3af', width: '12px', textAlign: 'right', flexShrink: 0 }}>
                    {count}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Review cards */}
        {loading ? (
          <div>
            {[0, 1].map(i => (
              <div key={i} style={{ height: 80, backgroundColor: '#f3f4f6', borderRadius: 12, marginBottom: 12 }} />
            ))}
          </div>
        ) : reviews.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '32px 0', color: '#9ca3af' }}>
            <MessageSquare style={{ width: 40, height: 40, color: '#e5e7eb', margin: '0 auto 8px' }} />
            <p style={{ fontSize: '0.875rem' }}>No reviews yet. Be the first!</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {reviews.map(review => (
              <div
                key={review._id}
                style={{
                  border: '1px solid #e5e7eb',
                  borderRadius: '12px',
                  padding: '16px',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' }}>
                  {/* Left: avatar + name + date */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div
                      style={{
                        width: 38, height: 38,
                        borderRadius: '50%',
                        backgroundColor: '#f3f4f6',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        flexShrink: 0,
                      }}
                    >
                      <User style={{ width: 18, height: 18, color: '#9ca3af' }} />
                    </div>
                    <div>
                      <p style={{ fontWeight: 600, fontSize: '0.875rem', color: '#374151', margin: '0 0 2px' }}>
                        {review.userName}
                      </p>
                      <p style={{ fontSize: '0.78rem', color: '#9ca3af', margin: 0 }}>
                        {new Date(review.date).toLocaleDateString('en-US', {
                          month: 'long', day: 'numeric', year: 'numeric',
                        })}
                      </p>
                    </div>
                  </div>

                  {/* Right: star rating */}
                  <div style={{ display: 'flex', gap: '2px' }}>
                    {[1, 2, 3, 4, 5].map(s => (
                      <Star
                        key={s}
                        style={{
                          width: 15, height: 15,
                          fill: s <= review.rating ? '#facc15' : '#e5e7eb',
                          color: s <= review.rating ? '#facc15' : '#e5e7eb',
                        }}
                      />
                    ))}
                  </div>
                </div>

                <p style={{ fontSize: '0.875rem', color: '#4b5563', margin: 0, lineHeight: 1.6 }}>
                  {review.text}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── Write a Review form (separate card below) ── */}
      {showForm && (
        <div
          style={{
            backgroundColor: '#fff',
            borderRadius: '16px',
            border: '1px solid #e5e7eb',
            padding: '24px',
          }}
        >
          <h2 style={{ fontWeight: 700, fontSize: '1rem', color: '#111827', margin: '0 0 20px' }}>
            Share Your Experience
          </h2>

          <form onSubmit={handleSubmit}>
            {/* Star selector */}
            <div style={{ marginBottom: '18px' }}>
              <label style={{ fontSize: '0.875rem', fontWeight: 600, color: '#374151', display: 'block', marginBottom: '8px' }}>
                Your Rating
              </label>
              <div style={{ display: 'flex', gap: '6px' }}>
                {[1, 2, 3, 4, 5].map(s => (
                  <button
                    key={s}
                    type="button"
                    onMouseEnter={() => setHoverRating(s)}
                    onMouseLeave={() => setHoverRating(0)}
                    onClick={() => setRating(s)}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
                  >
                    <Star
                      style={{
                        width: 28, height: 28,
                        fill: s <= (hoverRating || rating) ? '#facc15' : 'transparent',
                        color: s <= (hoverRating || rating) ? '#facc15' : '#d1d5db',
                        transition: 'fill 0.1s, color 0.1s',
                      }}
                    />
                  </button>
                ))}
              </div>
            </div>

            {/* Review text */}
            <div style={{ marginBottom: '18px' }}>
              <label style={{ fontSize: '0.875rem', fontWeight: 600, color: '#374151', display: 'block', marginBottom: '8px' }}>
                Your Review
              </label>
              <textarea
                value={text}
                onChange={e => setText(e.target.value)}
                placeholder="Tell us about your experience at this store..."
                rows={4}
                style={{
                  width: '100%',
                  padding: '12px',
                  fontSize: '0.875rem',
                  border: '1.5px solid #e5e7eb',
                  borderRadius: '10px',
                  backgroundColor: '#f9fafb',
                  outline: 'none',
                  resize: 'none',
                  color: '#374151',
                  boxSizing: 'border-box',
                }}
              />
            </div>

            {/* Upload (visual only) */}
            <div style={{ marginBottom: '20px' }}>
              <label style={{ fontSize: '0.875rem', fontWeight: 600, color: '#374151', display: 'block', marginBottom: '8px' }}>
                Upload Images (optional)
              </label>
              <button
                type="button"
                style={{
                  display: 'flex', alignItems: 'center', gap: '6px',
                  padding: '8px 16px',
                  fontSize: '0.825rem', color: '#374151',
                  border: '1px solid #d1d5db', borderRadius: '8px',
                  backgroundColor: '#fff', cursor: 'pointer',
                }}
              >
                <Upload style={{ width: 14, height: 14 }} /> Upload
              </button>
            </div>

            {error && (
              <p style={{ fontSize: '0.8rem', color: '#dc2626', marginBottom: '12px' }}>{error}</p>
            )}

            {/* Action buttons */}
            <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
              <button
                type="submit"
                disabled={submitting}
                style={{
                  padding: '10px 24px',
                  fontSize: '0.875rem', fontWeight: 600,
                  color: '#fff', backgroundColor: submitting ? '#c084a0' : '#8B1538',
                  border: 'none', borderRadius: '8px', cursor: submitting ? 'not-allowed' : 'pointer',
                }}
              >
                {submitting ? 'Submitting...' : 'Submit'}
              </button>
              <button
                type="button"
                onClick={() => { setShowForm(false); setRating(0); setText(''); setError(''); }}
                style={{
                  padding: '10px 20px',
                  fontSize: '0.875rem', fontWeight: 500,
                  color: '#374151', backgroundColor: '#f3f4f6',
                  border: '1.5px solid #d1d5db', borderRadius: '8px', cursor: 'pointer',
                }}
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
