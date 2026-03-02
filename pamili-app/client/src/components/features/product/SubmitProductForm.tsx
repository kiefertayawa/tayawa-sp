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
    storeService.getAll().then(res => setStores(res.data.data)).catch(() => {});
  }, []);

  useEffect(() => {
    document.body.style.overflow = isOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

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
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <div className="fixed inset-0 bg-black/40 z-40" onClick={onClose} />
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-2xl w-full overflow-hidden" style={{maxWidth:'680px'}}>
          {/* Header */}
          <div className="flex items-start justify-between px-6 pt-6 pb-4 border-b border-gray-100">
            <div>
              <h2 className="text-lg font-bold text-gray-800">Submit Product & Price</h2>
              <p className="text-sm text-gray-400 mt-0.5">Help the community with price information</p>
            </div>
            <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded-lg ml-4">
              <X className="w-5 h-5 text-gray-400" />
            </button>
          </div>

          {success ? (
            <div className="p-12 text-center">
              <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-3" />
              <p className="font-semibold text-green-600 text-lg">Submitted for review!</p>
              <p className="text-sm text-gray-400 mt-1">Thank you for helping the community.</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="p-6 space-y-5">
              {/* Image Upload */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Product Image *</label>
                <div
                  className="border-2 border-dashed border-gray-200 rounded-xl flex flex-col items-center justify-center cursor-pointer hover:border-gray-300 transition-colors"
                  style={{height:'160px'}}
                  onClick={() => document.getElementById('prod-img')?.click()}
                >
                  {imagePreview ? (
                    <img src={imagePreview} alt="Preview" className="h-full w-full object-contain rounded-xl" />
                  ) : (
                    <div className="text-center text-gray-400">
                      <ImagePlus className="w-10 h-10 mx-auto mb-2 text-gray-300" />
                      <p className="text-sm font-medium">Click to upload product image</p>
                      <p className="text-xs mt-0.5">PNG, JPG up to 10MB</p>
                    </div>
                  )}
                  <input id="prod-img" type="file" accept="image/*" onChange={handleImage} className="hidden" />
                </div>
              </div>

              {/* Product Name */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Product Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g., Lucky Me Pancit Canton"
                  value={form.productName}
                  onChange={e => setForm({...form, productName: e.target.value})}
                  className="w-full px-4 py-2.5 text-sm border border-gray-200 rounded-xl bg-gray-50 focus:outline-none focus:border-gray-300"
                />
              </div>

              {/* Store */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Store *</label>
                <div className="relative">
                  <select
                    required
                    value={form.storeId}
                    onChange={e => setForm({...form, storeId: e.target.value})}
                    className="w-full px-4 py-2.5 text-sm border border-gray-200 rounded-xl bg-gray-50 focus:outline-none appearance-none"
                  >
                    <option value="">Select a store</option>
                    {stores.map(s => <option key={s._id} value={s._id}>{s.name}</option>)}
                  </select>
                  <div className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2">
                    <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                  </div>
                </div>
              </div>

              {/* Price */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Price (₱) *</label>
                <input
                  type="number"
                  required
                  min="0"
                  step="0.01"
                  placeholder="0.00"
                  value={form.price}
                  onChange={e => setForm({...form, price: e.target.value})}
                  className="w-full px-4 py-2.5 text-sm border border-gray-200 rounded-xl bg-gray-50 focus:outline-none"
                />
                <p className="text-xs text-gray-400 mt-1">Enter the exact price you saw at the store</p>
              </div>

              {/* Guidelines */}
              <div className="rounded-xl p-4" style={{backgroundColor:'#eff6ff', border:'1px solid #bfdbfe'}}>
                <p className="text-sm font-semibold mb-2" style={{color:'#1d4ed8'}}>Before submitting:</p>
                {[
                  'Ensure the price is current and accurate',
                  'Upload a clear photo of the product',
                  'Your submission will be reviewed by administrators',
                  'Approved submissions help fellow students save money',
                ].map(tip => (
                  <div key={tip} className="flex items-start gap-2 text-sm mb-1" style={{color:'#2563eb'}}>
                    <span>✓</span> {tip}
                  </div>
                ))}
              </div>

              {/* Buttons */}
              <div className="flex gap-3 pt-1">
                <button type="button" onClick={onClose} className="flex-1 py-3 text-sm font-medium border border-gray-200 rounded-xl text-gray-600 hover:bg-gray-50">
                  Cancel
                </button>
                <button type="submit" disabled={submitting} className="flex-1 py-3 text-sm font-semibold text-white rounded-xl disabled:opacity-60" style={{backgroundColor:'#8B1538'}}>
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
