import { useState, useEffect } from 'react';
import { Clock, PhilippinePeso, X } from 'lucide-react';
import { useStoreProducts } from '../../../hooks';
import { productService } from '../../../services/api';
import { toast } from 'sonner';

interface ProductsSectionProps {
    storeId: string;
}

export default function ProductsSection({ storeId }: ProductsSectionProps) {
    const { products, loading } = useStoreProducts(storeId);
    const [reportingProduct, setReportingProduct] = useState<{ id: string; name: string } | null>(null);
    const [reportReason, setReportReason] = useState('');
    const [isSubmittingReport, setIsSubmittingReport] = useState(false);

    useEffect(() => {
        if (reportingProduct) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'unset';
        }
        return () => {
            document.body.style.overflow = 'unset';
        };
    }, [reportingProduct]);

    const handleReport = async () => {
        if (!reportingProduct || !reportReason.trim()) return;

        setIsSubmittingReport(true);
        try {
            await productService.report(reportingProduct.id, {
                storeId,
                reason: reportReason.trim()
            });
            toast.success('Report submitted successfully!');
            setReportingProduct(null);
            setReportReason('');
        } catch (err) {
            toast.error('Failed to submit report. Please try again.');
        } finally {
            setIsSubmittingReport(false);
        }
    };

    return (
        <div style={{ backgroundColor: '#fff', borderRadius: '16px', border: '1px solid #e5e7eb', padding: '24px', marginBottom: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
                <h2 style={{ fontWeight: 600, color: '#111827', fontSize: '0.95rem', margin: 0, marginBottom: '10px' }}>Available Product ({products.length})</h2>
            </div>

            {loading ? (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: '16px' }}>
                    {[...Array(4)].map((_, i) => (
                        <div key={i} style={{ height: '220px', backgroundColor: '#f3f4f6', borderRadius: '12px', animation: 'pulse 1.5s infinite' }} />
                    ))}
                </div>
            ) : products.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '40px 0', border: '1px dashed #e5e7eb', borderRadius: '12px' }}>
                    <p style={{ color: '#9ca3af', fontSize: '0.9rem' }}>No products listed for this store yet.</p>
                </div>
            ) : (
                <div style={{
                    maxHeight: '480px',
                    overflowY: 'auto',
                    paddingRight: '4px'
                }}>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '20px' }}>
                        {products.map((product) => {
                            const storePrice = product.prices.find(p => p.storeId === storeId);
                            return (
                                <div
                                    key={product._id}
                                    style={{
                                        border: '1px solid #f0f0f0',
                                        borderRadius: '12px',
                                        overflow: 'hidden',
                                        position: 'relative',
                                        transition: 'transform 0.2s',
                                        backgroundColor: '#fff'
                                    }}
                                >
                                    {/* Image */}
                                    <div style={{ height: '120px', overflow: 'hidden', backgroundColor: '#f9fafb' }}>
                                        <img
                                            src={product.image}
                                            alt={product.name}
                                            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                        />
                                    </div>

                                    {/* Report Button (Float) */}
                                    <button
                                        onClick={() => setReportingProduct({ id: product._id, name: product.name })}
                                        style={{
                                            position: 'absolute',
                                            top: '8px',
                                            right: '8px',
                                            width: '22px',
                                            height: '22px',
                                            borderRadius: '50%',
                                            backgroundColor: '#dc2626',
                                            border: 'none',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            cursor: 'pointer',
                                            color: '#fff',
                                            boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                                        }}
                                        title="Report Product Issue"
                                    >
                                        <span style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            width: '100%',
                                            height: '100%',
                                            fontWeight: 900,
                                            fontSize: '12px',
                                            color: '#fff',
                                            lineHeight: 1,
                                            fontStyle: 'normal',
                                        }}>!</span>
                                    </button>

                                    {/* Content */}
                                    <div style={{ padding: '12px' }}>
                                        <h3 style={{ fontSize: '0.875rem', fontWeight: 600, color: '#111827', margin: '0 0 6px', lineHeight: 1.3 }}>
                                            {product.name}
                                        </h3>

                                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '6px' }}>
                                            <PhilippinePeso style={{ width: 14, height: 14, color: '#014421' }} />
                                            <span style={{ fontSize: '1rem', fontWeight: 700, color: '#014421' }}>
                                                {storePrice?.price.toFixed(2)}
                                            </span>
                                        </div>

                                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.75rem', color: '#9ca3af' }}>
                                            <Clock style={{ width: 12, height: 12 }} />
                                            <span>Updated: {storePrice?.lastUpdated ? new Date(storePrice.lastUpdated).toLocaleDateString() : 'N/A'}</span>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* Report Modal */}
            {reportingProduct && (
                <div style={{
                    position: 'fixed',
                    inset: 0,
                    backgroundColor: 'rgba(0, 0, 0, 0.4)',
                    backdropFilter: 'blur(4px)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    zIndex: 2000,
                    padding: '20px'
                }}>
                    <div style={{
                        backgroundColor: '#fff',
                        borderRadius: '16px',
                        width: '100%',
                        maxWidth: '400px',
                        padding: '24px',
                        boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)'
                    }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <div style={{
                                    width: '22px',
                                    height: '22px',
                                    borderRadius: '50%',
                                    backgroundColor: '#dc2626',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    flexShrink: 0,
                                }}>
                                    <span style={{ fontWeight: 900, fontSize: '13px', color: '#fff', lineHeight: 1 }}>!</span>
                                </div>
                                <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#111827', margin: 0 }}>Report Issue</h3>
                            </div>
                            <button
                                onClick={() => setReportingProduct(null)}
                                style={{
                                    background: '#f3f4f6',
                                    border: 'none',
                                    cursor: 'pointer',
                                    color: '#6b7280',
                                    width: '32px',
                                    height: '32px',
                                    borderRadius: '50%',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    transition: 'all 0.2s'
                                }}
                                onMouseEnter={e => e.currentTarget.style.backgroundColor = '#e5e7eb'}
                                onMouseLeave={e => e.currentTarget.style.backgroundColor = '#f3f4f6'}
                            >
                                <X style={{ width: 18, height: 18 }} />
                            </button>
                        </div>

                        <p style={{ fontSize: '0.875rem', color: '#6b7280', marginBottom: '16px' }}>
                            Reporting issue for <span style={{ fontWeight: 600, color: '#111827' }}>{reportingProduct.name}</span>. Please describe the problem (e.g. duplicate entry).
                        </p>

                        <textarea
                            value={reportReason}
                            onChange={(e) => setReportReason(e.target.value.slice(0, 200))}
                            placeholder="What's wrong with this product listing?"
                            style={{
                                width: '100%',
                                height: '100px',
                                padding: '12px',
                                borderRadius: '10px',
                                border: '1px solid #e5e7eb',
                                fontSize: '0.875rem',
                                resize: 'none',
                                marginBottom: '8px',
                                outline: 'none'
                            }}
                        />
                        <div style={{ textAlign: 'right', marginBottom: '16px' }}>
                            <span style={{ fontSize: '0.75rem', color: reportReason.length >= 200 ? '#dc2626' : '#9ca3af' }}>
                                {reportReason.length}/200
                            </span>
                        </div>

                        <div style={{ display: 'flex', gap: '12px' }}>
                            <button
                                onClick={() => setReportingProduct(null)}
                                style={{
                                    flex: 1,
                                    padding: '12px',
                                    borderRadius: '10px',
                                    border: '1px solid #e5e7eb',
                                    backgroundColor: '#fff',
                                    color: '#374151',
                                    fontWeight: 600,
                                    fontSize: '0.875rem',
                                    cursor: 'pointer'
                                }}
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleReport}
                                disabled={isSubmittingReport || !reportReason.trim()}
                                style={{
                                    flex: 1,
                                    padding: '12px',
                                    borderRadius: '10px',
                                    border: 'none',
                                    backgroundColor: '#dc2626',
                                    color: '#fff',
                                    fontWeight: 700,
                                    fontSize: '0.875rem',
                                    cursor: (isSubmittingReport || !reportReason.trim()) ? 'not-allowed' : 'pointer',
                                    opacity: (isSubmittingReport || !reportReason.trim()) ? 0.7 : 1
                                }}
                            >
                                {isSubmittingReport ? 'Submitting...' : 'Submit Report'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
