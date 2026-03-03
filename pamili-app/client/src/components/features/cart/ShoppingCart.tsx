import { useEffect, useState } from 'react';
import { X, Plus, Minus, Trash2, ShoppingBag, Check } from 'lucide-react';
import { useCart } from '../../../context/CartContext';

interface ShoppingCartProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function ShoppingCart({ isOpen, onClose }: ShoppingCartProps) {
  const {
    items,
    updateQuantity,
    removeItem,
    toggleItemSelection,
    toggleStoreSelection,
    toggleAllSelection,
    clearCart,
    subtotal,
    totalItems
  } = useCart();

  // ── Slide animation state ────────────────────────────────────────────────
  // `mounted`  — whether the DOM node exists
  // `closing`  — true during the slide-OUT phase before unmounting
  const [mounted, setMounted] = useState(false);
  const [closing, setClosing] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setMounted(true);   // mount it — CSS @keyframes cartSlideIn fires automatically
      setClosing(false);
    } else if (mounted) {
      setClosing(true);   // trigger slide-OUT keyframe
      const timer = setTimeout(() => {
        setMounted(false);
        setClosing(false);
      }, 320);
      return () => clearTimeout(timer);
    }
  }, [isOpen]); // eslint-disable-line

  if (!mounted) return null;

  const byStore = items.reduce((acc, item) => {
    if (!acc[item.storeName]) acc[item.storeName] = [];
    acc[item.storeName].push(item);
    return acc;
  }, {} as Record<string, typeof items>);

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{
          position: 'fixed',
          inset: 0,
          backgroundColor: 'rgba(0,0,0,0.30)',
          zIndex: 200,
        }}
      />

      {/* Sliding panel */}
      <div
        style={{
          position: 'fixed',
          top: 0,
          right: 0,
          height: '100%',
          width: '460px',
          backgroundColor: '#ffffff',
          zIndex: 201,
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '-4px 0 24px rgba(0,0,0,0.12)',
          // Keyframe animation: slideIn on mount, slideOut when closing
          animation: closing
            ? 'cartSlideOut 0.3s cubic-bezier(0.4, 0, 0.2, 1) forwards'
            : 'cartSlideIn 0.32s cubic-bezier(0.4, 0, 0.2, 1) forwards',
        }}
      >
        {/* Panel header */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '16px 20px',
            borderBottom: '1px solid #f3f4f6',
            flexShrink: 0,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <ShoppingBag style={{ width: 20, height: 20, color: '#374151' }} />
            <span style={{ fontWeight: 600, color: '#111827', fontSize: '1rem' }}>Shopping List</span>
            {totalItems > 0 && (
              <span
                style={{
                  backgroundColor: '#8B1538',
                  color: '#fff',
                  fontSize: '0.7rem',
                  fontWeight: 700,
                  borderRadius: '9999px',
                  padding: '2px 8px',
                }}
              >
                {totalItems}
              </span>
            )}
          </div>
          <button
            onClick={onClose}
            style={{ background: '#f3f4f6', border: 'none', cursor: 'pointer', padding: '6px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'background-color 0.2s' }}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#e5e7eb'}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#f3f4f6'}
          >
            <X style={{ width: 18, height: 18, color: '#6b7280' }} />
          </button>
        </div>

        {/* Global Select All Toggle */}
        {items.length > 0 && (
          <div
            style={{
              padding: '12px 20px',
              backgroundColor: '#f9fafb',
              borderBottom: '1px solid #f3f4f6',
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              cursor: 'pointer'
            }}
            onClick={() => {
              const allSelected = items.every(i => i.selected !== false);
              toggleAllSelection(!allSelected);
            }}
          >
            <div
              style={{
                width: '20px',
                height: '20px',
                borderRadius: '50%',
                border: `2px solid ${items.every(i => i.selected !== false) ? '#8B1538' : '#d1d5db'}`,
                backgroundColor: items.every(i => i.selected !== false) ? '#8B1538' : 'transparent',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'all 0.2s',
                flexShrink: 0
              }}
            >
              {items.every(i => i.selected !== false) && <Check style={{ width: 12, height: 12, color: '#fff' }} />}
            </div>
            <span style={{ fontSize: '0.875rem', fontWeight: 600, color: '#374151' }}>Select All Items</span>
            <span style={{ fontSize: '0.75rem', color: '#9ca3af', marginLeft: 'auto' }}>
              {items.filter(i => i.selected !== false).length} of {items.length} selected
            </span>
          </div>
        )}

        {/* Scrollable items */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '16px' }}>
          {items.length === 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', textAlign: 'center' }}>
              <ShoppingBag style={{ width: 56, height: 56, color: '#e5e7eb', marginBottom: '12px' }} />
              <p style={{ color: '#6b7280', fontWeight: 500 }}>Your list is empty!</p>
              <p style={{ fontSize: '0.875rem', color: '#9ca3af', marginTop: '4px' }}>Add items to start planning your budget.</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {Object.entries(byStore).map(([storeName, storeItems]) => {
                const storeSubtotal = storeItems.reduce((s, i) => s + i.price * i.quantity, 0);
                return (
                  <div
                    key={storeName}
                    style={{ border: '1px solid #f3f4f6', borderRadius: '12px', overflow: 'hidden' }}
                  >
                    <div
                      style={{
                        padding: '12px 16px',
                        backgroundColor: '#fff',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '12px',
                        cursor: 'pointer'
                      }}
                      onClick={() => {
                        const allSelected = storeItems.every(i => i.selected !== false);
                        const storeId = storeItems[0]?.storeId;
                        if (storeId) toggleStoreSelection(storeId, !allSelected);
                      }}
                    >
                      <div
                        style={{
                          width: '20px',
                          height: '20px',
                          borderRadius: '50%',
                          border: `2px solid ${storeItems.every(i => i.selected !== false) ? '#8B1538' : '#d1d5db'}`,
                          backgroundColor: storeItems.every(i => i.selected !== false) ? '#8B1538' : 'transparent',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          transition: 'all 0.2s',
                          flexShrink: 0
                        }}
                      >
                        {storeItems.every(i => i.selected !== false) && <Check style={{ width: 12, height: 12, color: '#fff' }} />}
                      </div>
                      <p style={{ fontWeight: 600, fontSize: '0.95rem', color: '#8B1538', margin: 0 }}>{storeName}</p>
                    </div>

                    {storeItems.map(item => (
                      <div
                        key={`${item.productId}-${item.storeId}`}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '12px',
                          padding: '12px 16px',
                          borderTop: '1px solid #f9fafb',
                        }}
                      >
                        <div
                          onClick={() => toggleItemSelection(item.productId, item.storeId)}
                          style={{
                            width: '20px',
                            height: '20px',
                            borderRadius: '50%',
                            border: `2px solid ${item.selected !== false ? '#8B1538' : '#d1d5db'}`,
                            backgroundColor: item.selected !== false ? '#8B1538' : 'transparent',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            cursor: 'pointer',
                            transition: 'all 0.2s',
                            flexShrink: 0
                          }}
                        >
                          {item.selected !== false && <Check style={{ width: 12, height: 12, color: '#fff' }} />}
                        </div>
                        <img
                          src={item.image?.trim() || 'https://placehold.co/400x400?text=No+Image+Available'}
                          alt={item.productName}
                          style={{ width: 64, height: 64, objectFit: 'cover', borderRadius: '8px', flexShrink: 0, opacity: item.selected === false ? 0.6 : 1 }}
                          onError={(e) => (e.currentTarget.src = 'https://placehold.co/400x400?text=No+Image+Available')}
                        />
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <p style={{ fontSize: '0.875rem', fontWeight: 500, color: '#111827', marginBottom: '2px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {item.productName}
                          </p>
                          <p style={{ fontSize: '0.75rem', color: '#9ca3af', marginBottom: '8px' }}>₱{item.price.toFixed(2)} each</p>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <button
                              onClick={() => updateQuantity(item.productId, item.storeId, item.quantity - 1)}
                              style={{ width: 28, height: 28, borderRadius: '50%', border: '1px solid #e5e7eb', background: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#6b7280' }}
                            >
                              <Minus style={{ width: 12, height: 12 }} />
                            </button>
                            <span style={{ fontSize: '0.875rem', fontWeight: 500, width: '20px', textAlign: 'center' }}>{item.quantity}</span>
                            <button
                              onClick={() => updateQuantity(item.productId, item.storeId, item.quantity + 1)}
                              style={{ width: 28, height: 28, borderRadius: '50%', border: '1px solid #e5e7eb', background: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#6b7280' }}
                            >
                              <Plus style={{ width: 12, height: 12 }} />
                            </button>
                          </div>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '8px', flexShrink: 0 }}>
                          <button
                            onClick={() => removeItem(item.productId, item.storeId)}
                            style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '2px' }}
                          >
                            <Trash2 style={{ width: 16, height: 16, color: '#8B1538' }} />
                          </button>
                          <p style={{
                            fontSize: '0.875rem',
                            fontWeight: 600,
                            color: item.selected === false ? '#9ca3af' : '#111827',
                            textDecoration: item.selected === false ? 'line-through' : 'none'
                          }}>
                            ₱{(item.price * item.quantity).toFixed(2)}
                          </p>
                        </div>
                      </div>
                    ))}

                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        padding: '10px 16px',
                        borderTop: '1px solid #f3f4f6',
                        fontSize: '0.875rem',
                      }}
                    >
                      <span style={{ color: '#6b7280' }}>Store Subtotal:</span>
                      <span style={{ fontWeight: 600, color: '#111827' }}>₱{storeSubtotal.toFixed(2)}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div
          style={{
            borderTop: '1px solid #f3f4f6',
            padding: '16px 20px',
            backgroundColor: '#fff',
            flexShrink: 0,
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px', fontSize: '0.875rem' }}>
            <span style={{ color: '#6b7280' }}>Total Items:</span>
            <span style={{ fontWeight: 600, color: '#111827' }}>{totalItems}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <span style={{ fontSize: '0.875rem', fontWeight: 600, color: '#374151' }}>Total Price:</span>
            <span style={{ fontSize: '1.5rem', fontWeight: 700, color: '#8B1538' }}>₱{subtotal.toFixed(2)}</span>
          </div>
          <button
            onClick={clearCart}
            style={{
              width: '100%',
              padding: '10px',
              fontSize: '0.875rem',
              fontWeight: 500,
              color: '#374151',
              backgroundColor: '#fff',
              border: '1px solid #e5e7eb',
              borderRadius: '8px',
              cursor: 'pointer',
              marginBottom: '10px',
            }}
          >
            Clear List
          </button>
          <p style={{ fontSize: '0.75rem', textAlign: 'center', color: '#9ca3af' }}>
            This is a budget planning tool. Visit stores to make actual purchases.
          </p>
        </div>
      </div>
    </>
  );
}
