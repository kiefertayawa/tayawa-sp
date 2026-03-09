import { useState, useRef, useEffect } from 'react';
import { Star, MessageSquare, User, X, Trash2 } from 'lucide-react';
import { useReviews } from '../../../hooks';
import { toast } from 'sonner';

interface ReviewsSectionProps {
  storeId: string;
  storeName: string;
  helpText?: string;
}

export default function ReviewsSection({ storeId, storeName, helpText }: ReviewsSectionProps) {
  const { reviews, loading, submitReview } = useReviews(storeId);
  const [showForm, setShowForm] = useState(false);
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [text, setText] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const formatFileName = (name: string) => {
    if (name.length <= 20) return name;
    const extIndex = name.lastIndexOf('.');
    if (extIndex !== -1 && name.length - extIndex <= 5) {
      const ext = name.substring(extIndex);
      return name.substring(0, 15) + '...' + ext;
    }
    return name.substring(0, 17) + '...';
  };
  const formRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (showForm && formRef.current) {
      formRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [showForm]);

  // Image handling
  const [imageFiles, setImageFiles] = useState<File[]>([]);

  // Confirmation Modal for Cancel
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  // Modal for all reviews
  const [showAllModal, setShowAllModal] = useState(false);

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
    if (rating === 0) {
      toast.error('Rating is required.');
      return;
    }

    setSubmitting(true);
    const ok = await submitReview({ rating, text, images: imageFiles });
    setSubmitting(false);

    if (ok) {
      toast.success('Review successfully submitted!');
      setShowForm(false);
      resetForm();
    } else {
      toast.error('Failed to submit review. Try again.');
    }
  };

  const resetForm = () => {
    setRating(0);
    setText('');
    setImageFiles([]);
    setShowCancelConfirm(false);
  };

  const handleCancelClick = () => {
    if (rating > 0 || text.trim() || imageFiles.length > 0) {
      setShowCancelConfirm(true);
    } else {
      setShowForm(false);
    }
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    const filesArray = Array.from(e.target.files);
    if (imageFiles.length + filesArray.length > 3) {
      toast.error('Maximum 3 images allowed.');
      return;
    }
    setImageFiles(prev => [...prev, ...filesArray].slice(0, 3));
    e.target.value = ''; // reset input
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
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
          <h2 style={{ fontWeight: 700, fontSize: '1rem', color: '#111827', margin: 0 }}>Reviews &amp; Ratings</h2>
          {!showForm && (
            <button
              onClick={() => setShowForm(true)}
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
          )}
        </div>

        {helpText && (
          <p style={{ fontSize: '0.85rem', color: '#9ca3af', margin: '0 0 20px' }}>
            {helpText}
          </p>
        )}

        {reviews.length > 0 && (
          <div style={{ display: 'flex', gap: '40px', marginBottom: '28px', alignItems: 'center' }}>
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

        {loading ? (
          <div>
            {[0, 1].map(i => (
              <div key={i} style={{ height: 80, backgroundColor: '#f3f4f6', borderRadius: 12, marginBottom: 12 }} />
            ))}
          </div>
        ) : reviews.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '32px 0', color: '#9ca3af' }}>
            <MessageSquare style={{ width: 40, height: 40, color: '#e5e7eb', margin: '0 auto 8px' }} />
            <p style={{ fontSize: '0.875rem' }}>No approved reviews yet. Share your experience!</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {reviews.slice(0, 3).map(review => (
              <ReviewCard key={review._id} review={review} />
            ))}

            {reviews.length > 3 && (
              <button
                onClick={() => setShowAllModal(true)}
                style={{
                  background: 'none', border: 'none', color: '#8B1538',
                  fontSize: '0.875rem', fontWeight: 700, cursor: 'pointer',
                  padding: '8px 0', textAlign: 'left', width: 'fit-content',
                  textDecoration: 'underline', textUnderlineOffset: '4px'
                }}
              >
                See More Reviews ({reviews.length - 3} more)
              </button>
            )}
          </div>
        )}
      </div>

      {/* ── Write a Review Form (Modal-like card) ── */}
      {showForm && (
        <div
          ref={formRef}
          style={{
            backgroundColor: '#fff',
            borderRadius: '16px',
            border: '2px solid #8B1538',
            padding: '24px',
            marginBottom: '40px',
            boxShadow: '0 4px 20px rgba(139,21,56,0.08)',
            scrollMarginTop: '100px'
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <h2 style={{ fontWeight: 700, fontSize: '1.1rem', color: '#111827', margin: 0 }}>
              Write a Review for <span style={{ color: '#8B1538' }}>{storeName}</span>
            </h2>
            <button onClick={handleCancelClick} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9ca3af', padding: '4px', display: 'flex' }}>
              <X style={{ width: 28, height: 28 }} />
            </button>
          </div>

          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: '20px' }}>
              <label style={{ fontSize: '0.875rem', fontWeight: 600, color: '#374151', display: 'block', marginBottom: '10px' }}>Rating</label>
              <div style={{ display: 'flex', gap: '8px' }}>
                {[1, 2, 3, 4, 5].map(s => (
                  <button
                    key={s} type="button"
                    onMouseEnter={() => setHoverRating(s)}
                    onMouseLeave={() => setHoverRating(0)}
                    onClick={() => setRating(s)}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
                  >
                    <Star style={{ width: 32, height: 32, fill: s <= (hoverRating || rating) ? '#facc15' : 'transparent', color: s <= (hoverRating || rating) ? '#facc15' : '#d1d5db', transition: 'all 0.1s' }} />
                  </button>
                ))}
              </div>
            </div>

            <div style={{ marginBottom: '20px' }}>
              <label style={{ fontSize: '0.875rem', fontWeight: 600, color: '#374151', display: 'block', marginBottom: '8px' }}>
                Your Message <span style={{ fontWeight: 400, color: '#9ca3af', fontSize: '0.8rem' }}>(optional)</span>
              </label>
              <textarea
                value={text} onChange={e => setText(e.target.value)}
                placeholder="How was the store? Was it crowded? Are the prices accurate?"
                rows={4}
                maxLength={500}
                style={{ width: '100%', padding: '12px', fontSize: '0.875rem', border: '1.5px solid #e5e7eb', borderRadius: '10px', backgroundColor: '#f9fafb', outline: 'none', resize: 'none', color: '#374151', boxSizing: 'border-box' }}
              />
              <div style={{ textAlign: 'right', fontSize: '0.75rem', color: text.length >= 500 ? '#dc2626' : '#9ca3af', marginTop: '4px' }}>
                {text.length} / 500 characters
              </div>
            </div>

            <div style={{ marginBottom: '24px' }}>
              <label style={{ fontSize: '0.875rem', fontWeight: 600, color: '#374151', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                <span>Add Photos <span style={{ fontWeight: 400, color: '#9ca3af', fontSize: '0.8rem' }}>(optional)</span></span>
                <span style={{ fontWeight: 400, color: imageFiles.length >= 3 ? '#dc2626' : '#9ca3af', fontSize: '0.75rem' }}>
                  {imageFiles.length} / 3 photos
                </span>
              </label>
              <div style={{ display: 'flex', gap: '10px', marginBottom: '12px', alignItems: 'center' }}>
                <label style={{
                  cursor: imageFiles.length >= 3 ? 'not-allowed' : 'pointer',
                  padding: '10px 18px',
                  backgroundColor: imageFiles.length >= 3 ? '#f3f4f6' : '#fff',
                  border: '1.5px solid #e5e7eb',
                  borderRadius: '8px',
                  fontSize: '0.875rem',
                  fontWeight: 600,
                  color: imageFiles.length >= 3 ? '#9ca3af' : '#374151',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'all 0.2s',
                  boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
                }}>
                  <span style={{ fontFamily: 'inherit' }}>Choose Photos</span>
                  <input
                    type="file" multiple accept="image/*" onChange={handleImageSelect}
                    disabled={imageFiles.length >= 3}
                    style={{ display: 'none' }}
                  />
                </label>
                <div style={{ fontSize: '0.875rem', color: '#6b7280', flex: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {imageFiles.length > 0
                    ? imageFiles.map(f => formatFileName(f.name)).join(', ')
                    : 'No files chosen.'}
                </div>
              </div>
              {imageFiles.length > 0 && (
                <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                  {imageFiles.map((file, i) => (
                    <div key={i} style={{ position: 'relative' }}>
                      <img src={URL.createObjectURL(file)} alt="Draft" style={{ width: '110px', height: '110px', borderRadius: '10px', objectFit: 'cover', border: '1px solid #e5e7eb' }} />
                      <button
                        type="button" onClick={() => setImageFiles(prev => prev.filter((_, idx) => idx !== i))}
                        style={{ position: 'absolute', top: '-8px', right: '-8px', backgroundColor: '#dc2626', color: '#fff', border: 'none', borderRadius: '50%', width: '24px', height: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', boxShadow: '0 2px 5px rgba(0,0,0,0.2)', transition: 'transform 0.1s' }}
                      >
                        <X style={{ width: 14, height: 14 }} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <button
                type="submit" disabled={submitting}
                style={{
                  width: '140px', height: '46px', boxSizing: 'border-box',
                  fontSize: '0.9rem', fontWeight: 700, color: '#fff',
                  backgroundColor: '#8B1538', border: 'none', borderRadius: '10px',
                  cursor: submitting ? 'not-allowed' : 'pointer',
                  opacity: submitting ? 0.7 : 1,
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px'
                }}
              >
                {submitting ? (
                  <>
                    <div style={{
                      width: '16px', height: '16px',
                      border: '2px solid rgba(255,255,255,0.3)',
                      borderTopColor: '#fff', borderRadius: '50%',
                      animation: 'spin 1s linear infinite'
                    }} />
                    Submitting...
                  </>
                ) : 'Submit Review'}
              </button>
            </div>
          </form>
        </div >
      )
      }

      {/* ── Cancellation Confirmation Modal ── */}
      {
        showCancelConfirm && (
          <>
            <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(4px)', zIndex: 1000 }} />
            <div style={{ position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', backgroundColor: '#fff', borderRadius: '16px', padding: '28px', boxShadow: '0 20px 40px rgba(0,0,0,0.15)', zIndex: 1001, width: '100%', maxWidth: '360px', textAlign: 'center' }}>
              <div style={{ width: '56px', height: '56px', borderRadius: '50%', backgroundColor: '#fdf2f5', color: '#8B1538', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
                <Trash2 style={{ width: 28, height: 28 }} />
              </div>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#111827', margin: '0 0 8px' }}>Discard Review?</h3>
              <p style={{ fontSize: '0.9rem', color: '#6b7280', margin: '0 0 24px', lineHeight: 1.5 }}>You have unsaved changes. Are you sure you want to cancel your review?</p>
              <div style={{ display: 'flex', gap: '12px' }}>
                <button onClick={() => setShowCancelConfirm(false)} style={{ flex: 1, padding: '12px', fontSize: '0.875rem', fontWeight: 600, color: '#374151', backgroundColor: '#f3f4f6', border: 'none', borderRadius: '10px', cursor: 'pointer' }}>No, Continue</button>
                <button onClick={() => { setShowForm(false); resetForm(); }} style={{ flex: 1, padding: '12px', fontSize: '0.875rem', fontWeight: 600, color: '#fff', backgroundColor: '#8B1538', border: 'none', borderRadius: '10px', cursor: 'pointer' }}>Yes, Discard</button>
              </div>
            </div>
          </>
        )
      }

      {/* ── All Reviews Modal ── */}
      {
        showAllModal && (
          <>
            <div
              style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(4px)', zIndex: 1000 }}
              onClick={() => setShowAllModal(false)}
            />
            <div
              style={{
                position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
                backgroundColor: '#fff', borderRadius: '20px', padding: '0',
                boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)', zIndex: 1001,
                width: '90%', maxWidth: '600px', height: '80vh',
                display: 'flex', flexDirection: 'column', overflow: 'hidden'
              }}
            >
              {/* Modal Header */}
              <div style={{ padding: '24px', borderBottom: '1px solid #f3f4f6', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0 }}>
                <div>
                  <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#111827', margin: '0 0 4px' }}>All Reviews</h3>
                  <p style={{ fontSize: '0.875rem', color: '#6b7280', margin: 0 }}>Showing {reviews.length} community ratings for {storeName}</p>
                </div>
                <button
                  onClick={() => setShowAllModal(false)}
                  style={{ background: '#f3f4f6', border: 'none', borderRadius: '50%', width: '36px', height: '36px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#6b7280' }}
                >
                  <X style={{ width: 20, height: 20 }} />
                </button>
              </div>

              {/* Scrollable Reviews List */}
              <div style={{ flex: 1, overflowY: 'auto', padding: '24px', backgroundColor: '#f9fafb' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  {reviews.map(review => (
                    <ReviewCard key={review._id} review={review} />
                  ))}
                </div>
              </div>

            </div>
          </>
        )
      }
    </div >
  );
}

// ── Shared Component for Review Card ───────────────────────
function ReviewCard({ review }: { review: any }) {
  return (
    <div
      style={{
        border: '1px solid #e5e7eb',
        borderRadius: '12px',
        padding: '16px',
        backgroundColor: '#fff'
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{ width: 38, height: 38, borderRadius: '50%', backgroundColor: '#f3f4f6', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <User style={{ width: 18, height: 18, color: '#9ca3af' }} />
          </div>
          <div>
            <p style={{ fontWeight: 600, fontSize: '0.875rem', color: '#374151', margin: '0 0 2px' }}>Anonymous User</p>
            <p style={{ fontSize: '0.78rem', color: '#9ca3af', margin: 0 }}>
              {(() => {
                const d = new Date(review.date);
                if (isNaN(d.getTime())) return review.date;
                return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
              })()}
            </p>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '2px' }}>
          {[1, 2, 3, 4, 5].map(s => (
            <Star key={s} style={{ width: 15, height: 15, fill: s <= review.rating ? '#facc15' : '#e5e7eb', color: s <= review.rating ? '#facc15' : '#e5e7eb' }} />
          ))}
        </div>
      </div>
      <p style={{ fontSize: '0.875rem', color: '#4b5563', margin: '0 0 12px', lineHeight: 1.6, wordBreak: 'break-all' }}>{review.text}</p>

      {review.images && review.images.length > 0 && (
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          {review.images.map((img: any, i: number) => {
            const url = typeof img === 'string' ? img : img.url;
            return (
              <img
                key={i} src={url} alt="Review"
                style={{ width: '80px', height: '80px', objectFit: 'cover', borderRadius: '8px', border: '1px solid #e5e7eb' }}
                onError={(e) => (e.currentTarget.src = 'https://placehold.co/400x400?text=No+Image+Available')}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}
