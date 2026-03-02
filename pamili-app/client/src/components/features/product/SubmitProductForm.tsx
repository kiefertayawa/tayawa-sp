import { useState, useEffect } from 'react';
import { X, ImagePlus, CheckCircle } from 'lucide-react';
import { productService, storeService } from '../../../services/api';
import type { Store } from '../../../types';

interface SubmitProductFormProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function SubmitProductForm({ isOpen, onClose }: SubmitProductFormProps) {
  const [stores, setStores] = useState<Store[]>([]);
  const [form, setForm] = useState({ productName: '', storeId: '', price: '' });
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    storeService.getAll().then(res => setStores(res.data.data)).catch(() => { });
  }, []);

  if (!isOpen) return null;

  const handleImage = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => setImagePreview(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const formData = new FormData();
      formData.append('name', form.productName);
      formData.append('storeId', form.storeId);
      formData.append('price', form.price);
      if (imageFile) formData.append('image', imageFile);
      await productService.submit(formData);
      setSuccess(true);
      setTimeout(() => {
        onClose();
        setSuccess(false);
        setForm({ productName: '', storeId: '', price: '' });
        setImagePreview(null);
        setImageFile(null);
      }, 2000);
    } catch {
      // silent
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
          {success ? (
            <div style={{ padding: '64px 24px', textAlign: 'center' }}>
              <CheckCircle style={{ width: 64, height: 64, color: '#16a34a', margin: '0 auto 12px' }} />
              <p style={{ fontWeight: 600, color: '#15803d', fontSize: '1.125rem' }}>Submitted for review!</p>
              <p style={{ fontSize: '0.875rem', color: '#9ca3af', marginTop: '4px' }}>Thank you for helping the community.</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>
              {/* Header row */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', padding: '20px 24px 16px', flexShrink: 0 }}>
                <div>
                  <h2 style={{ fontWeight: 700, fontSize: '1.1rem', color: '#111827', margin: 0 }}>Submit Product &amp; Price</h2>
                  <p style={{ fontSize: '0.875rem', color: '#9ca3af', margin: '4px 0 0' }}>Help the community with price information</p>
                </div>
                <button
                  type="button"
                  onClick={onClose}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px', borderRadius: '6px', color: '#6b7280' }}
                >
                  <X style={{ width: 20, height: 20 }} />
                </button>
              </div>

              {/* Scrollable body */}
              <div style={{ flex: 1, overflowY: 'auto', padding: '0 24px 8px' }}>

                {/* Image upload */}
                <div
                  onClick={() => document.getElementById('prod-img')?.click()}
                  style={{
                    border: '2px dashed #e5e7eb',
                    borderRadius: '12px',
                    height: '160px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    marginBottom: '20px',
                    overflow: 'hidden',
                  }}
                >
                  {imagePreview ? (
                    <img src={imagePreview} alt="Preview" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                  ) : (
                    <div style={{ textAlign: 'center', color: '#9ca3af' }}>
                      <ImagePlus style={{ width: 40, height: 40, margin: '0 auto 8px', color: '#d1d5db' }} />
                      <p style={{ fontSize: '0.875rem', fontWeight: 500, marginBottom: '2px' }}>Click to upload product image</p>
                      <p style={{ fontSize: '0.75rem' }}>PNG, JPG up to 10MB</p>
                    </div>
                  )}
                  <input id="prod-img" type="file" accept="image/*" onChange={handleImage} style={{ display: 'none' }} />
                </div>

                {/* Product Name */}
                <div style={{ marginBottom: '16px' }}>
                  <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, color: '#374151', marginBottom: '6px' }}>
                    Product Name *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g., Lucky Me Pancit Canton"
                    value={form.productName}
                    onChange={e => setForm({ ...form, productName: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '10px 14px',
                      fontSize: '0.875rem',
                      border: '1px solid #e5e7eb',
                      borderRadius: '10px',
                      backgroundColor: '#f9fafb',
                      outline: 'none',
                      boxSizing: 'border-box',
                    }}
                  />
                </div>

                {/* Store */}
                <div style={{ marginBottom: '16px' }}>
                  <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, color: '#374151', marginBottom: '6px' }}>
                    Store *
                  </label>
                  <div style={{ position: 'relative' }}>
                    <select
                      required
                      value={form.storeId}
                      onChange={e => setForm({ ...form, storeId: e.target.value })}
                      style={{
                        width: '100%',
                        padding: '10px 14px',
                        fontSize: '0.875rem',
                        border: '1px solid #e5e7eb',
                        borderRadius: '10px',
                        backgroundColor: '#f9fafb',
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
                </div>

                {/* Price */}
                <div style={{ marginBottom: '16px' }}>
                  <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, color: '#374151', marginBottom: '6px' }}>
                    Price (₱) *
                  </label>
                  <input
                    type="number"
                    required
                    min="0"
                    step="0.01"
                    placeholder="0.00"
                    value={form.price}
                    onChange={e => setForm({ ...form, price: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '10px 14px',
                      fontSize: '0.875rem',
                      border: '1px solid #e5e7eb',
                      borderRadius: '10px',
                      backgroundColor: '#f9fafb',
                      outline: 'none',
                      boxSizing: 'border-box',
                    }}
                  />
                  <p style={{ fontSize: '0.75rem', color: '#9ca3af', marginTop: '4px' }}>Enter the exact price you saw at the store</p>
                </div>

                {/* Guidelines */}
                <div style={{ backgroundColor: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: '10px', padding: '14px', marginBottom: '8px' }}>
                  <p style={{ fontSize: '0.875rem', fontWeight: 600, color: '#1d4ed8', marginBottom: '8px' }}>Before submitting:</p>
                  {[
                    'Ensure the price is current and accurate',
                    'Upload a clear photo of the product',
                    'Your submission will be reviewed by administrators',
                    'Approved submissions help fellow students save money',
                  ].map(tip => (
                    <div key={tip} style={{ display: 'flex', gap: '8px', fontSize: '0.875rem', color: '#2563eb', marginBottom: '4px' }}>
                      <span>✓</span> {tip}
                    </div>
                  ))}
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
          )}
        </div>
      </div>
    </>
  );
}
