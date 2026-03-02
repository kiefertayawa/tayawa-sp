import { X, Plus, Minus, Trash2, ShoppingBag } from 'lucide-react';
import { useEffect } from 'react';
import { useCart } from '../../../context/CartContext';

interface ShoppingCartProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function ShoppingCart({ isOpen, onClose }: ShoppingCartProps) {
  const { items, updateQuantity, removeItem, clearCart, subtotal, totalItems } = useCart();

  useEffect(() => {
    document.body.style.overflow = isOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  if (!isOpen) return null;

  const byStore = items.reduce((acc, item) => {
    if (!acc[item.storeName]) acc[item.storeName] = [];
    acc[item.storeName].push(item);
    return acc;
  }, {} as Record<string, typeof items>);

  return (
    <>
      <div className="fixed inset-0 bg-black/30 z-40" onClick={onClose} />
      <div className="fixed top-0 right-0 h-full bg-white z-50 flex flex-col shadow-2xl" style={{ width: '460px' }}>
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <ShoppingBag className="w-5 h-5 text-gray-700" />
            <span className="font-semibold text-gray-800">Shopping Cart</span>
            {totalItems > 0 && (
              <span className="text-white text-xs font-bold rounded-full px-2 py-0.5" style={{ backgroundColor: '#8B1538' }}>{totalItems}</span>
            )}
          </div>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded-lg">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Items */}
        <div className="flex-1 overflow-y-auto px-4 py-4">
          {items.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <ShoppingBag className="w-14 h-14 text-gray-200 mb-3" />
              <p className="text-gray-500 font-medium">Your cart is empty</p>
              <p className="text-sm text-gray-400 mt-1">Add items to start planning your budget</p>
            </div>
          ) : (
            <div className="space-y-4">
              {Object.entries(byStore).map(([storeName, storeItems]) => {
                const storeSubtotal = storeItems.reduce((s, i) => s + i.price * i.quantity, 0);
                return (
                  <div key={storeName} className="border border-gray-100 rounded-xl overflow-hidden">
                    {/* Store name */}
                    <div className="px-4 py-3 bg-white">
                      <p className="font-semibold text-base" style={{ color: '#8B1538' }}>{storeName}</p>
                    </div>
                    {/* Items */}
                    <div className="divide-y divide-gray-100">
                      {storeItems.map(item => (
                        <div key={`${item.productId}-${item.storeId}`} className="flex gap-3 px-4 py-3 items-center">
                          <img src={item.image} alt={item.productName} className="w-16 h-16 object-cover rounded-lg flex-shrink-0" />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-800 truncate">{item.productName}</p>
                            <p className="text-xs text-gray-400 mb-2">₱{item.price.toFixed(2)} each</p>
                            {/* Quantity controls */}
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => updateQuantity(item.productId, item.storeId, item.quantity - 1)}
                                className="w-7 h-7 rounded-full border border-gray-200 flex items-center justify-center text-gray-500 hover:bg-gray-50"
                              >
                                <Minus className="w-3 h-3" />
                              </button>
                              <span className="text-sm font-medium w-5 text-center">{item.quantity}</span>
                              <button
                                onClick={() => updateQuantity(item.productId, item.storeId, item.quantity + 1)}
                                className="w-7 h-7 rounded-full border border-gray-200 flex items-center justify-center text-gray-500 hover:bg-gray-50"
                              >
                                <Plus className="w-3 h-3" />
                              </button>
                            </div>
                          </div>
                          {/* Price + delete */}
                          <div className="flex flex-col items-end justify-between gap-3 flex-shrink-0">
                            <button onClick={() => removeItem(item.productId, item.storeId)} className="p-1">
                              <Trash2 className="w-4 h-4" style={{ color: '#8B1538' }} />
                            </button>
                            <p className="text-sm font-semibold text-gray-800">₱{(item.price * item.quantity).toFixed(2)}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                    {/* Store subtotal */}
                    <div className="flex justify-between px-4 py-3 bg-white border-t border-gray-100 text-sm">
                      <span className="text-gray-500">Store Subtotal:</span>
                      <span className="font-semibold text-gray-800">₱{storeSubtotal.toFixed(2)}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-gray-100 px-5 py-4 bg-white">
          <div className="flex justify-between items-center mb-1">
            <span className="text-sm text-gray-600">Total Items:</span>
            <span className="text-sm font-semibold text-gray-800">{totalItems}</span>
          </div>
          <div className="flex justify-between items-center mb-4">
            <span className="text-sm font-semibold text-gray-700">Total Budget:</span>
            <span className="text-2xl font-bold" style={{ color: '#8B1538' }}>₱{subtotal.toFixed(2)}</span>
          </div>
          <button onClick={clearCart} className="w-full py-2.5 text-sm font-medium border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50 mb-3">
            Clear Cart
          </button>
          <p className="text-xs text-center text-gray-400">This is a budget planning tool. Visit stores to make actual purchases.</p>
        </div>
      </div>
    </>
  );
}
