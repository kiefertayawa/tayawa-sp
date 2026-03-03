import { useState, useEffect } from 'react';
import { X, Link as LinkIcon } from 'lucide-react';
import { toast } from 'sonner';
import { productService, storeService } from '../../../services/api';
import type { Store } from '../../../types';

interface SubmitProductFormProps {
  isOpen: boolean;
  onClose: () => void;
}

const DEFAULT_IMAGE = 'https://placehold.co/400x400?text=No+Image+Available';

export default function SubmitProductForm({ isOpen, onClose }: SubmitProductFormProps) {
  const [stores, setStores] = useState<Store[]>([]);
  const [form, setForm] = useState({ productName: '', storeId: '', price: '', imageUrl: '' });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (isOpen) {
      setError(null);
      setFieldErrors({});
      storeService.getAll()
        .then(res => setStores(res.data.data))
        .catch(() => {
          setError('Could not load stores. Is the backend running?');
        });
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleNameChange = (val: string) => {
    // Only allow alphanumeric, spaces, and common symbols (-, ., &, ', ())
    const sanitized = val.replace(/[^a-zA-Z0-9\s\-\.\&\'\(\)]/g, '');
    setForm({ ...form, productName: sanitized });
    if (sanitized.trim()) setFieldErrors(prev => ({ ...prev, productName: false }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const newFieldErrors: Record<string, boolean> = {};

    if (!form.productName.trim()) newFieldErrors.productName = true;
    if (!form.storeId) newFieldErrors.storeId = true;
    if (!form.price) newFieldErrors.price = true;
    if (!form.imageUrl.trim()) newFieldErrors.imageUrl = true;

    if (Object.keys(newFieldErrors).length > 0) {
      setFieldErrors(newFieldErrors);
      return;
    }

    const priceNum = parseFloat(form.price);
    if (isNaN(priceNum) || priceNum <= 0) {
      setError('Please enter a valid price greater than 0.');
      return;
    }

    if (form.productName.trim().length < 3) {
      setError('Product name must be at least 3 characters long.');
      return;
    }

    setSubmitting(true);
    try {
      await productService.submit({
        name: form.productName.trim(),
        storeId: form.storeId,
        price: priceNum,
        image: form.imageUrl.trim() || DEFAULT_IMAGE,
      });
      const now = new Date();
      const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      const dateStr = now.toLocaleDateString();

      toast.success('Product submitted for review!', {});

      onClose();
      setForm({ productName: '', storeId: '', price: '', imageUrl: '' });
    } catch (err: any) {
      const msg = err?.response?.data?.error || 'Submission failed. Please check if the backend is running.';
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{
          position: 'fixed',
          inset: 0,
          backgroundColor: 'rgba(0,0,0,0.45)',
          zIndex: 200,
        }}
      />

      {/* Dialog */}
      <div
        style={{
          position: 'fixed',
          inset: 0,
          zIndex: 201,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '16px',
          pointerEvents: 'none',
        }}
      >
        <div
          style={{
            backgroundColor: '#fff',
            borderRadius: '16px',
            boxShadow: '0 25px 50px rgba(0,0,0,0.15)',
            width: '100%',
            maxWidth: '540px',
            maxHeight: '90vh',
            display: 'flex',
            flexDirection: 'column',
            pointerEvents: 'auto',
          }}
        >
          <form onSubmit={handleSubmit} noValidate style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>
            {/* Header row */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', padding: '20px 24px 16px', flexShrink: 0 }}>
              <div>
                <h2 style={{ fontWeight: 700, fontSize: '1.1rem', color: '#111827', margin: 0 }}>Submit Product &amp; Price</h2>
                <p style={{ fontSize: '0.875rem', color: '#9ca3af', margin: '4px 0 0' }}>Help the community by adding new product info</p>
              </div>
              <button
                type="button"
                onClick={onClose}
                style={{ background: '#f3f4f6', border: 'none', borderRadius: '50%', width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#6b7280' }}
              >
                <X style={{ width: 18, height: 18 }} />
              </button>
            </div>

            {error && (
              <div style={{ margin: '0 24px 12px', padding: '10px 14px', backgroundColor: '#fee2e2', border: '1px solid #fca5a5', borderRadius: '10px', color: '#b91c1c', fontSize: '0.875rem' }}>
                {error}
              </div>
            )}

            {/* Scrollable body */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '0 24px 8px' }}>

              {/* Image Link */}
              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, color: '#374151', marginBottom: '6px' }}>
                  Product Image Link (URL) <span style={{ color: '#8B1538' }}>*</span>
                </label>
                <div style={{ position: 'relative' }}>
                  <LinkIcon
                    style={{
                      position: 'absolute',
                      left: '12px',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      width: 16,
                      height: 16,
                      color: '#9ca3af',
                    }}
                  />
                  <input
                    type="url"
                    required
                    placeholder="https://example.com/image.jpg"
                    value={form.imageUrl}
                    onChange={e => {
                      setForm({ ...form, imageUrl: e.target.value });
                      if (e.target.value.trim()) setFieldErrors(prev => ({ ...prev, imageUrl: false }));
                    }}
                    style={{
                      width: '100%',
                      padding: '10px 14px 10px 38px',
                      fontSize: '0.875rem',
                      border: `1px solid ${fieldErrors.imageUrl ? '#dc2626' : '#e5e7eb'}`,
                      borderRadius: '10px',
                      backgroundColor: fieldErrors.imageUrl ? '#fef2f2' : '#f9fafb',
                      outline: 'none',
                      boxSizing: 'border-box',
                    }}
                  />
                </div>
                {fieldErrors.imageUrl && (
                  <p style={{ color: '#dc2626', fontSize: '0.75rem', marginTop: '4px', fontWeight: 500 }}>This field is required!</p>
                )}
                <div style={{ marginTop: '12px', borderRadius: '12px', border: '1px solid #e5e7eb', overflow: 'hidden', height: '140px', backgroundColor: '#f3f4f6', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <img
                    key={form.imageUrl}
                    src={form.imageUrl.trim() || DEFAULT_IMAGE}
                    alt="Preview"
                    style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }}
                    onError={(e) => (e.currentTarget.src = 'https://placehold.co/400x400?text=Invalid+Image+Link')}
                  />
                </div>
              </div>

              {/* Product Name */}
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, color: '#374151', marginBottom: '6px' }}>
                  Product Name <span style={{ color: '#8B1538' }}>*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g., Lucky Me Pancit Canton"
                  value={form.productName}
                  onChange={e => handleNameChange(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    fontSize: '0.875rem',
                    border: `1px solid ${fieldErrors.productName ? '#dc2626' : '#e5e7eb'}`,
                    borderRadius: '10px',
                    backgroundColor: fieldErrors.productName ? '#fef2f2' : '#f9fafb',
                    outline: 'none',
                    boxSizing: 'border-box',
                  }}
                />
                {fieldErrors.productName && (
                  <p style={{ color: '#dc2626', fontSize: '0.75rem', marginTop: '4px', fontWeight: 500 }}>This field is required!</p>
                )}
              </div>

              {/* Store */}
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, color: '#374151', marginBottom: '6px' }}>
                  Store <span style={{ color: '#8B1538' }}>*</span>
                </label>
                <div style={{ position: 'relative' }}>
                  <select
                    required
                    value={form.storeId}
                    onChange={e => {
                      setForm({ ...form, storeId: e.target.value });
                      if (e.target.value) setFieldErrors(prev => ({ ...prev, storeId: false }));
                    }}
                    style={{
                      width: '100%',
                      padding: '10px 14px',
                      fontSize: '0.875rem',
                      border: `1px solid ${fieldErrors.storeId ? '#dc2626' : '#e5e7eb'}`,
                      borderRadius: '10px',
                      backgroundColor: fieldErrors.storeId ? '#fef2f2' : '#f9fafb',
                      outline: 'none',
                      appearance: 'none',
                      color: form.storeId ? '#374151' : '#9ca3af',
                      boxSizing: 'border-box',
                    }}
                  >
                    <option value="">Select a store</option>
                    {stores.map(s => <option key={s._id} value={s._id}>{s.name}</option>)}
                  </select>
                  <svg
                    style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', width: 16, height: 16, color: '#9ca3af', pointerEvents: 'none' }}
                    fill="none" stroke="currentColor" viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
                {fieldErrors.storeId && (
                  <p style={{ color: '#dc2626', fontSize: '0.75rem', marginTop: '4px', fontWeight: 500 }}>This field is required!</p>
                )}
              </div>

              {/* Price */}
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, color: '#374151', marginBottom: '6px' }}>
                  Price (₱) <span style={{ color: '#8B1538' }}>*</span>
                </label>
                <input
                  type="number"
                  required
                  min="0"
                  step="0.01"
                  placeholder="0.00"
                  value={form.price}
                  onChange={e => {
                    setForm({ ...form, price: e.target.value });
                    if (e.target.value) setFieldErrors(prev => ({ ...prev, price: false }));
                  }}
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    fontSize: '0.875rem',
                    border: `1px solid ${fieldErrors.price ? '#dc2626' : '#e5e7eb'}`,
                    borderRadius: '10px',
                    backgroundColor: fieldErrors.price ? '#fef2f2' : '#f9fafb',
                    outline: 'none',
                    boxSizing: 'border-box',
                  }}
                />
                {fieldErrors.price && (
                  <p style={{ color: '#dc2626', fontSize: '0.75rem', marginTop: '4px', fontWeight: 500 }}>This field is required!</p>
                )}
                <p style={{ fontSize: '0.75rem', color: '#9ca3af', marginTop: '4px' }}>Enter the exact price you saw at the store</p>
              </div>

              {/* Guidelines */}
              <div style={{ backgroundColor: '#fdf2f5', border: '1px solid #fce7f3', borderRadius: '10px', padding: '16px', marginBottom: '8px' }}>
                <p style={{
                  fontSize: '0.875rem', fontWeight: 600, color: '#8B1538', marginBottom: '8px', marginTop: '4px'
                }}>Before submitting:</p>
                {
                  [
                    'Ensure the price is current and accurate.',
                    'Using a direct image link helps fellow users see the product.',
                    'Your submission will be reviewed by administrators.',
                  ].map(tip => (
                    <div key={tip} style={{ display: 'flex', gap: '8px', fontSize: '0.875rem', color: '#9d174d', marginBottom: '4px' }}>
                      <span>•</span> {tip}
                    </div>
                  ))
                }
              </div>
            </div>

            {/* Sticky footer — inside the form so submit works */}
            <div style={{ display: 'flex', gap: '12px', padding: '16px 24px', borderTop: '1px solid #f3f4f6', flexShrink: 0 }}>
              <button
                type="button"
                onClick={onClose}
                style={{
                  flex: 1,
                  padding: '12px',
                  fontSize: '0.875rem',
                  fontWeight: 500,
                  color: '#374151',
                  backgroundColor: '#fff',
                  border: '1px solid #e5e7eb',
                  borderRadius: '10px',
                  cursor: 'pointer',
                }}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                style={{
                  flex: 1,
                  padding: '12px',
                  fontSize: '0.875rem',
                  fontWeight: 600,
                  color: '#fff',
                  backgroundColor: submitting ? '#c084a0' : '#8B1538',
                  border: 'none',
                  borderRadius: '10px',
                  cursor: submitting ? 'not-allowed' : 'pointer',
                }}
              >
                {submitting ? 'Submitting...' : 'Submit'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
}
