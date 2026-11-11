import React, { useState, useMemo, useRef } from 'react';
import { useCaptain } from '../context/CaptainContext';
import { soundEngine } from '../services/soundEngine';
import {
  ArrowLeft,
  Search,
  Plus,
  Minus,
  MessageSquare,
  Flame,
  Clock,
  X,
  Trash2,
  Camera,
  User,
  Edit3
} from 'lucide-react';

export default function MenuOrderView({ table, onBack }) {
  const {
    menuItems,
    fireKot,
    orderItems,
    dishImages,
    uploadDishImage,
    removeDishImage,
    getTableCustomer,
    setTableCustomer
  } = useCaptain();

  const [activeTab, setActiveTab] = useState('menu'); // 'menu' | 'active_kots'
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [cart, setCart] = useState([]);
  const [isCartSheetOpen, setIsCartSheetOpen] = useState(false);
  const [isFiring, setIsFiring] = useState(false);
  const [customizerItem, setCustomizerItem] = useState(null);
  const [customNote, setCustomNote] = useState('');

  // Customer Name and Phone Number state
  const existingCust = getTableCustomer(table.id);
  const [customerName, setCustomerName] = useState(table.customer_name || table.customerName || existingCust.name || '');
  const [customerPhone, setCustomerPhone] = useState(table.customer_phone || table.customerPhone || existingCust.phone || '');
  const [isCustModalOpen, setIsCustModalOpen] = useState(false);

  // Dish Image Upload State
  const fileInputRef = useRef(null);
  const [uploadTargetCode, setUploadTargetCode] = useState(null);
  const [previewDish, setPreviewDish] = useState(null);

  const isAcSection = (table.section || '').toUpperCase().includes('AC');

  // Categories sorted by category_order
  const categories = useMemo(() => {
    const catMap = new Map();
    menuItems.forEach(item => {
      if (!catMap.has(item.category)) {
        catMap.set(item.category, {
          name: item.category,
          order: item.category_order || 99,
          isKitchen: item.is_kitchen
        });
      }
    });
    return Array.from(catMap.values()).sort((a, b) => a.order - b.order);
  }, [menuItems]);

  const filteredMenu = useMemo(() => {
    let list = menuItems.filter(m => m.is_available);

    if (selectedCategory !== 'ALL') {
      list = list.filter(m => m.category === selectedCategory);
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter(m =>
        m.name.toLowerCase().includes(q) ||
        m.code.toString().toLowerCase().includes(q) ||
        m.category.toLowerCase().includes(q)
      );
    }

    return list.sort((a, b) => {
      if (a.category_order !== b.category_order) {
        return a.category_order - b.category_order;
      }
      return Number(a.code) - Number(b.code);
    });
  }, [menuItems, selectedCategory, searchQuery]);

  const addToCart = (dish) => {
    soundEngine.playTap();
    setCart(prev => {
      const existing = prev.find(i => i.code === dish.code && !i.customization);
      if (existing) {
        return prev.map(i =>
          i.code === dish.code && !i.customization ? { ...i, qty: i.qty + 1 } : i
        );
      }
      return [...prev, { ...dish, qty: 1, customization: '' }];
    });
  };

  const updateCartQty = (code, customization, delta) => {
    soundEngine.playTap();
    setCart(prev => {
      return prev
        .map(i => {
          if (i.code === code && i.customization === customization) {
            const newQty = i.qty + delta;
            return newQty > 0 ? { ...i, qty: newQty } : null;
          }
          return i;
        })
        .filter(Boolean);
    });
  };

  const openCustomizer = (dish) => {
    soundEngine.playTap();
    const existing = cart.find(i => i.code === dish.code);
    setCustomizerItem(dish);
    setCustomNote(existing?.customization || '');
  };

  const saveCustomization = () => {
    if (!customizerItem) return;
    soundEngine.playTap();
    setCart(prev => {
      const existingIdx = prev.findIndex(i => i.code === customizerItem.code);
      if (existingIdx >= 0) {
        const updated = [...prev];
        updated[existingIdx] = {
          ...updated[existingIdx],
          customization: customNote.trim()
        };
        return updated;
      } else {
        return [...prev, { ...customizerItem, qty: 1, customization: customNote.trim() }];
      }
    });
    setCustomizerItem(null);
    setCustomNote('');
  };

  const cartTotalQty = cart.reduce((sum, item) => sum + item.qty, 0);
  const cartTotalAmount = cart.reduce((sum, item) => {
    const rate = isAcSection ? (item.ac_rate || item.hall_rate) : (item.hall_rate || item.ac_rate);
    return sum + item.qty * rate;
  }, 0);

  const handleUpdateCustomer = (name, phone) => {
    setCustomerName(name);
    setCustomerPhone(phone);
    setTableCustomer(table.id, { name, phone });
  };

  const handleTriggerUpload = (dishCode) => {
    setUploadTargetCode(dishCode);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
      fileInputRef.current.click();
    }
  };

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (file && uploadTargetCode) {
      await uploadDishImage(uploadTargetCode, file);
      setPreviewDish(null);
    }
  };

  const handleFireKot = async () => {
    if (cart.length === 0 || isFiring) return;
    setIsFiring(true);

    try {
      await fireKot({
        tableId: table.id,
        section: table.section || 'GENERAL',
        cartItems: cart,
        customerName: customerName.trim(),
        customerPhone: customerPhone.trim()
      });
      setCart([]);
      setIsCartSheetOpen(false);
      setActiveTab('active_kots');
    } catch (err) {
      alert('Error firing KOT: ' + err.message);
    } finally {
      setIsFiring(false);
    }
  };

  const activeTableItems = orderItems.filter(i => i.table_id === table.id && !i.is_cancelled);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', position: 'relative', overflow: 'hidden' }}>
      {/* Hidden file input for dish image upload */}
      <input
        type="file"
        ref={fileInputRef}
        accept="image/*"
        onChange={handleFileChange}
        style={{ display: 'none' }}
      />

      {/* Mobile Top Bar */}
      <div style={{
        padding: '6px 10px',
        borderBottom: '1px solid var(--border-subtle)',
        background: 'var(--bg-header)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexShrink: 0,
        width: '100%',
        boxSizing: 'border-box',
        gap: '6px'
      }}>
        {/* Left: Back & Table Info & Customer Indicator */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', minWidth: 0 }}>
          <button
            onClick={onBack}
            className="btn btn-ghost"
            style={{ width: '32px', height: '32px', minHeight: '32px', padding: 0, borderRadius: '8px', flexShrink: 0 }}
          >
            <ArrowLeft size={16} />
          </button>
          <div style={{ minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
              <span style={{ fontSize: '14px', fontWeight: '900', color: 'var(--text-main)', whiteSpace: 'nowrap' }}>T-{table.id}</span>
              <span style={{
                fontSize: '9px',
                padding: '1px 5px',
                borderRadius: '4px',
                background: (table.section || '').toUpperCase().includes('FAMILY AC') ? 'rgba(168, 85, 247, 0.2)' : 'rgba(2, 132, 199, 0.2)',
                color: (table.section || '').toUpperCase().includes('FAMILY AC') ? '#c084fc' : '#38bdf8',
                fontWeight: '800',
                whiteSpace: 'nowrap'
              }}>
                {table.section || (isAcSection ? 'FAMILY AC' : 'GENERAL')}
              </span>
            </div>

            {/* Customer Name & Mobile Pill (Tap to Edit) */}
            <button
              type="button"
              onClick={() => setIsCustModalOpen(true)}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px',
                fontSize: '9.5px',
                fontWeight: '700',
                color: customerName ? '#10b981' : 'var(--text-dim)',
                background: customerName ? 'rgba(16, 185, 129, 0.12)' : 'var(--btn-ghost-bg)',
                border: '1px solid ' + (customerName ? 'rgba(16, 185, 129, 0.25)' : 'var(--border-subtle)'),
                borderRadius: '4px',
                padding: '1px 6px',
                cursor: 'pointer',
                marginTop: '1px',
                maxWidth: '180px',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap'
              }}
              title="Click to edit customer details"
            >
              <User size={10} />
              <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {customerName ? `${customerName}${customerPhone ? ` (${customerPhone})` : ''}` : '+ Customer'}
              </span>
              <Edit3 size={8} style={{ opacity: 0.7 }} />
            </button>
          </div>
        </div>

        {/* Right: Tab Pills */}
        <div style={{ display: 'flex', background: 'var(--btn-ghost-bg)', padding: '2px', borderRadius: '7px', border: '1px solid var(--border-subtle)', flexShrink: 0 }}>
          <button
            onClick={() => setActiveTab('menu')}
            style={{
              padding: '4px 8px',
              borderRadius: '5px',
              border: 'none',
              background: activeTab === 'menu' ? '#2563eb' : 'transparent',
              color: activeTab === 'menu' ? '#fff' : 'var(--text-muted)',
              fontWeight: '700',
              fontSize: '11px',
              cursor: 'pointer'
            }}
          >
            Menu
          </button>
          <button
            onClick={() => setActiveTab('active_kots')}
            style={{
              padding: '4px 8px',
              borderRadius: '5px',
              border: 'none',
              background: activeTab === 'active_kots' ? '#2563eb' : 'transparent',
              color: activeTab === 'active_kots' ? '#fff' : 'var(--text-muted)',
              fontWeight: '700',
              fontSize: '11px',
              cursor: 'pointer'
            }}
          >
            Orders ({activeTableItems.length})
          </button>
        </div>
      </div>

      {activeTab === 'menu' ? (
        <div style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>
          {/* Sticky Mobile Search Input */}
          <div style={{ padding: '8px 12px', background: 'var(--bg-surface)', borderBottom: '1px solid var(--border-subtle)', flexShrink: 0 }}>
            <div style={{ position: 'relative' }}>
              <Search size={15} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-dim)' }} />
              <input
                type="text"
                placeholder="Search dish name or code..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                style={{
                  width: '100%',
                  height: '38px',
                  borderRadius: '10px',
                  background: 'var(--btn-ghost-bg)',
                  border: '1px solid var(--border-bright)',
                  paddingLeft: '34px',
                  paddingRight: searchQuery ? '34px' : '12px',
                  color: 'var(--text-main)',
                  fontSize: '13px',
                  fontWeight: '500'
                }}
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  style={{
                    position: 'absolute',
                    right: '10px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'none',
                    border: 'none',
                    color: 'var(--text-muted)',
                    cursor: 'pointer'
                  }}
                >
                  <X size={15} />
                </button>
              )}
            </div>

            {/* Horizontal Swipeable Category Chips */}
            <div style={{
              display: 'flex',
              gap: '5px',
              overflowX: 'auto',
              paddingTop: '8px',
              scrollbarWidth: 'none',
              msOverflowStyle: 'none'
            }}>
              <button
                onClick={() => setSelectedCategory('ALL')}
                style={{
                  padding: '5px 10px',
                  borderRadius: '8px',
                  border: selectedCategory === 'ALL' ? '1.5px solid #3b82f6' : '1px solid var(--border-subtle)',
                  background: selectedCategory === 'ALL' ? 'rgba(59, 130, 246, 0.25)' : 'var(--btn-ghost-bg)',
                  color: selectedCategory === 'ALL' ? '#2563eb' : 'var(--text-muted)',
                  fontSize: '11px',
                  fontWeight: '700',
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                  flexShrink: 0
                }}
              >
                All ({menuItems.length})
              </button>

              {categories.map(cat => (
                <button
                  key={cat.name}
                  onClick={() => setSelectedCategory(cat.name)}
                  style={{
                    padding: '5px 10px',
                    borderRadius: '8px',
                    border: selectedCategory === cat.name ? '1.5px solid #3b82f6' : '1px solid var(--border-subtle)',
                    background: selectedCategory === cat.name ? 'rgba(59, 130, 246, 0.25)' : 'var(--btn-ghost-bg)',
                    color: selectedCategory === cat.name ? '#2563eb' : 'var(--text-muted)',
                    fontSize: '11px',
                    fontWeight: '700',
                    cursor: 'pointer',
                    whiteSpace: 'nowrap',
                    flexShrink: 0
                  }}
                >
                  <span>{cat.order}. {cat.name}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Dish List for Mobile Scroll */}
          <div style={{
            flex: 1,
            overflowY: 'auto',
            WebkitOverflowScrolling: 'touch',
            padding: '10px 12px 100px 12px',
            display: 'flex',
            flexDirection: 'column',
            gap: '8px'
          }}>
            {filteredMenu.map(dish => {
              const activePrice = isAcSection ? (dish.ac_rate || dish.hall_rate) : (dish.hall_rate || dish.ac_rate);
              const cartItem = cart.find(i => i.code === dish.code);
              const dishImg = dishImages[dish.code];

              return (
                <div
                  key={dish.code}
                  className="glass-panel"
                  style={{
                    padding: '10px 12px',
                    borderRadius: '12px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '10px',
                    border: cartItem ? '1.5px solid #3b82f6' : '1px solid var(--border-subtle)',
                    background: cartItem ? 'rgba(59, 130, 246, 0.08)' : 'var(--bg-card)'
                  }}
                >
                  {/* Left: Food Item Image Thumbnail or Upload Button (Stored Locally in IDB) */}
                  {dishImg ? (
                    <div
                      onClick={() => setPreviewDish(dish)}
                      style={{
                        width: '52px',
                        height: '52px',
                        borderRadius: '10px',
                        overflow: 'hidden',
                        position: 'relative',
                        cursor: 'pointer',
                        flexShrink: 0,
                        border: '1.5px solid var(--border-bright)',
                        boxShadow: '0 2px 6px rgba(0,0,0,0.12)'
                      }}
                      title="Tap to view or change dish photo"
                    >
                      <img
                        src={dishImg}
                        alt={dish.name}
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      />
                      <div style={{
                        position: 'absolute',
                        bottom: 0,
                        left: 0,
                        right: 0,
                        background: 'rgba(0, 0, 0, 0.55)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        padding: '1px 0'
                      }}>
                        <Camera size={9} color="#fff" />
                      </div>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => handleTriggerUpload(dish.code)}
                      style={{
                        width: '52px',
                        height: '52px',
                        borderRadius: '10px',
                        border: '1.5px dashed var(--border-bright)',
                        background: 'var(--btn-ghost-bg)',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '2px',
                        color: 'var(--text-dim)',
                        cursor: 'pointer',
                        flexShrink: 0,
                        padding: 0
                      }}
                      title="Upload photo for this dish (stored locally)"
                    >
                      <Camera size={15} />
                      <span style={{ fontSize: '8.5px', fontWeight: '800' }}>+ Photo</span>
                    </button>
                  )}

                  {/* Middle: Dish Code, Name, Price */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '2px' }}>
                      <span style={{ fontSize: '10px', fontFamily: 'var(--font-mono)', fontWeight: '700', color: 'var(--text-dim)', padding: '1px 5px', background: 'var(--btn-ghost-bg)', borderRadius: '4px' }}>
                        #{dish.code}
                      </span>
                      <span style={{ fontSize: '9px', fontWeight: '800', color: dish.is_kitchen ? '#f59e0b' : '#38bdf8' }}>
                        {dish.is_kitchen ? '🍳 KITCHEN' : '🥤 PANTRY'}
                      </span>
                    </div>

                    <div style={{ fontSize: '14px', fontWeight: '800', color: 'var(--text-main)', lineHeight: 1.25, whiteSpace: 'normal' }}>
                      {dish.name}
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '4px' }}>
                      <span style={{ fontSize: '15px', fontWeight: '900', color: '#10b981' }}>
                        ₹{activePrice}
                      </span>
                      <span style={{ fontSize: '10px', color: 'var(--text-dim)' }}>
                        {dish.category}
                      </span>
                    </div>

                    {cartItem?.customization && (
                      <div style={{ fontSize: '10px', color: '#fbbf24', marginTop: '3px', fontWeight: '700' }}>
                        ⚠️ {cartItem.customization}
                      </div>
                    )}
                  </div>

                  {/* Right: Quantity Stepper or Add Button */}
                  <div style={{ flexShrink: 0 }}>
                    {cartItem ? (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px', background: 'var(--btn-ghost-bg)', borderRadius: '10px', padding: '3px 4px' }}>
                        <button
                          onClick={() => updateCartQty(dish.code, cartItem.customization, -1)}
                          style={{ width: '32px', height: '32px', borderRadius: '7px', border: 'none', background: 'var(--border-subtle)', color: 'var(--text-main)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                        >
                          <Minus size={14} />
                        </button>
                        <span style={{ fontWeight: '900', minWidth: '22px', textAlign: 'center', fontSize: '15px', color: 'var(--text-main)' }}>
                          {cartItem.qty}
                        </span>
                        <button
                          onClick={() => updateCartQty(dish.code, cartItem.customization, 1)}
                          style={{ width: '32px', height: '32px', borderRadius: '7px', border: 'none', background: '#3b82f6', color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                        >
                          <Plus size={14} />
                        </button>
                        <button
                          onClick={() => openCustomizer(dish)}
                          style={{ width: '32px', height: '32px', borderRadius: '7px', border: 'none', background: cartItem.customization ? '#f59e0b' : 'var(--border-subtle)', color: cartItem.customization ? '#000' : 'var(--text-main)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                          title="Custom Prep Note"
                        >
                          <MessageSquare size={13} />
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => addToCart(dish)}
                        className="btn btn-primary"
                        style={{ height: '36px', minHeight: '36px', padding: '0 14px', borderRadius: '9px', fontSize: '12px' }}
                      >
                        <Plus size={14} />
                        <span>Add</span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        /* Active Fired KOTs on this table */
        <div style={{ flex: 1, overflowY: 'auto', WebkitOverflowScrolling: 'touch', padding: '14px 12px 80px 12px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
            <h3 style={{ fontSize: '15px', fontWeight: '800', color: 'var(--text-main)', margin: 0 }}>Active Orders (Table {table.id})</h3>
          </div>

          {activeTableItems.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px 16px', color: 'var(--text-muted)' }}>
              <Clock size={36} style={{ opacity: 0.3, marginBottom: '8px' }} />
              <p>No dishes fired yet. Switch to "Menu" to order.</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {activeTableItems.map(item => (
                <div
                  key={item.id}
                  className="glass-panel"
                  style={{
                    padding: '12px 14px',
                    borderRadius: '12px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    borderLeft: item.status === 'SERVED' ? '4px solid #059669' : item.status === 'READY' ? '4px solid #10b981' : item.status === 'PREPARING' ? '4px solid #3b82f6' : '4px solid #f59e0b',
                    background: 'var(--bg-card)'
                  }}
                >
                  <div>
                    <div style={{ fontWeight: '800', color: 'var(--text-main)', fontSize: '14px' }}>
                      {item.qty}x {item.item_name}
                    </div>
                    <div style={{ fontSize: '11px', color: 'var(--text-dim)' }}>
                      KOT #{item.kot_number} • ₹{item.amount}
                    </div>
                    {item.customization && (
                      <div style={{ fontSize: '10px', color: '#fbbf24', marginTop: '2px', fontWeight: '700' }}>
                        ⚠️ {item.customization}
                      </div>
                    )}
                  </div>

                  <span style={{
                    padding: '3px 8px',
                    borderRadius: '6px',
                    fontSize: '10px',
                    fontWeight: '800',
                    background: item.status === 'SERVED' ? '#059669' : item.status === 'READY' ? '#10b981' : item.status === 'PREPARING' ? '#3b82f6' : '#f59e0b',
                    color: '#fff'
                  }}>
                    {item.status}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Floating Mobile Sticky Cart Bar */}
      {cart.length > 0 && (
        <div
          onClick={() => setIsCartSheetOpen(true)}
          style={{
            position: 'absolute',
            bottom: '10px',
            left: '10px',
            right: '10px',
            background: 'linear-gradient(135deg, #1e293b, #0f172a)',
            borderRadius: '14px',
            padding: '8px 12px',
            border: '1.5px solid #3b82f6',
            boxShadow: '0 8px 30px rgba(0, 0, 0, 0.85)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            zIndex: 50,
            cursor: 'pointer',
            boxSizing: 'border-box'
          }}
        >
          <div>
            <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>
              {cartTotalQty} Item{cartTotalQty === 1 ? '' : 's'} Selected
            </div>
            <div style={{ fontSize: '16px', fontWeight: '900', color: '#34d399' }}>
              ₹{cartTotalAmount}
            </div>
          </div>

          <button
            onClick={(e) => {
              e.stopPropagation();
              handleFireKot();
            }}
            disabled={isFiring}
            className="btn btn-success"
            style={{ height: '36px', minHeight: '36px', padding: '0 14px', fontSize: '13px' }}
          >
            <Flame size={15} />
            <span>{isFiring ? 'Sending...' : 'Fire KOT'}</span>
          </button>
        </div>
      )}

      {/* Slide-Up Bottom Sheet for Cart Review */}
      {isCartSheetOpen && (
        <div className="modal-overlay" onClick={() => setIsCartSheetOpen(false)}>
          <div className="bottom-sheet" onClick={e => e.stopPropagation()}>
            <div className="sheet-handle" />

            <div style={{ padding: '14px 18px', borderBottom: '1px solid var(--border-subtle)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h3 style={{ fontSize: '16px', fontWeight: '900', color: 'var(--text-main)' }}>
                  Staged KOT (Table {table.id})
                </h3>
                <p style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Review items before firing to kitchen</p>
              </div>
              <button
                onClick={() => setIsCartSheetOpen(false)}
                style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'var(--btn-ghost-bg)', border: '1px solid var(--border-subtle)', color: 'var(--text-main)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              >
                <X size={16} />
              </button>
            </div>

            {/* Customer Details in Cart Review Sheet */}
            <div style={{
              margin: '12px 18px 0 18px',
              padding: '10px 12px',
              background: 'var(--btn-ghost-bg)',
              borderRadius: '10px',
              border: '1px solid var(--border-subtle)',
              display: 'flex',
              flexDirection: 'column',
              gap: '6px'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', fontWeight: '800', color: 'var(--text-muted)' }}>
                <User size={13} />
                <span>Customer Information (Optional)</span>
              </div>
              <div style={{ display: 'flex', gap: '8px' }}>
                <input
                  type="text"
                  placeholder="Customer Name"
                  value={customerName}
                  onChange={e => handleUpdateCustomer(e.target.value, customerPhone)}
                  style={{
                    flex: 1,
                    minWidth: 0,
                    height: '34px',
                    borderRadius: '8px',
                    background: 'var(--bg-card)',
                    border: '1px solid var(--border-bright)',
                    padding: '0 10px',
                    fontSize: '12px',
                    color: 'var(--text-main)',
                    boxSizing: 'border-box'
                  }}
                />
                <input
                  type="tel"
                  placeholder="Mobile No."
                  value={customerPhone}
                  onChange={e => handleUpdateCustomer(customerName, e.target.value)}
                  style={{
                    flex: 1,
                    minWidth: 0,
                    height: '34px',
                    borderRadius: '8px',
                    background: 'var(--bg-card)',
                    border: '1px solid var(--border-bright)',
                    padding: '0 10px',
                    fontSize: '12px',
                    color: 'var(--text-main)',
                    boxSizing: 'border-box'
                  }}
                />
              </div>
            </div>

            <div style={{ flex: 1, overflowY: 'auto', padding: '14px 18px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {cart.map(item => {
                const rate = isAcSection ? (item.ac_rate || item.hall_rate) : (item.hall_rate || item.ac_rate);
                return (
                  <div
                    key={item.code}
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: '10px 12px',
                      background: 'var(--btn-ghost-bg)',
                      border: '1px solid var(--border-subtle)',
                      borderRadius: '10px'
                    }}
                  >
                    <div>
                      <div style={{ fontWeight: '800', fontSize: '13px', color: 'var(--text-main)' }}>{item.name}</div>
                      <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                        ₹{rate} × {item.qty} = <strong style={{ color: '#10b981' }}>₹{rate * item.qty}</strong>
                      </div>
                      {item.customization && (
                        <div style={{ fontSize: '10px', color: '#fbbf24', marginTop: '2px', fontWeight: '700' }}>
                          ⚠️ {item.customization}
                        </div>
                      )}
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <button
                        onClick={() => updateCartQty(item.code, item.customization, -1)}
                        style={{ width: '28px', height: '28px', borderRadius: '6px', border: '1px solid var(--border-subtle)', background: 'var(--bg-card)', color: 'var(--text-main)' }}
                      >
                        -
                      </button>
                      <span style={{ fontWeight: '900', minWidth: '20px', textAlign: 'center', fontSize: '14px', color: 'var(--text-main)' }}>
                        {item.qty}
                      </span>
                      <button
                        onClick={() => updateCartQty(item.code, item.customization, 1)}
                        style={{ width: '28px', height: '28px', borderRadius: '6px', border: 'none', background: '#3b82f6', color: '#fff' }}
                      >
                        +
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            <div style={{ padding: '14px 18px', borderTop: '1px solid var(--border-subtle)', background: 'var(--bg-surface)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Total Amount</span>
                <span style={{ fontSize: '22px', fontWeight: '900', color: '#34d399' }}>₹{cartTotalAmount}</span>
              </div>

              <button
                onClick={handleFireKot}
                disabled={isFiring}
                className="btn btn-success"
                style={{ width: '100%', height: '48px', fontSize: '15px' }}
              >
                <Flame size={18} />
                <span>{isFiring ? 'Sending to Cook...' : `Fire KOT #${table.id}`}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Slide-Up Bottom Sheet for Customization Notes */}
      {customizerItem && (
        <div className="modal-overlay" onClick={() => setCustomizerItem(null)}>
          <div className="bottom-sheet" onClick={e => e.stopPropagation()}>
            <div className="sheet-handle" />

            <div style={{ padding: '14px 18px', borderBottom: '1px solid var(--border-subtle)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h3 style={{ fontSize: '15px', fontWeight: '900', color: 'var(--text-main)', margin: 0 }}>Custom Prep Note</h3>
                <p style={{ fontSize: '11px', color: 'var(--text-muted)', margin: '2px 0 0 0' }}>{customizerItem.name}</p>
              </div>
              <button
                onClick={() => setCustomizerItem(null)}
                style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'var(--btn-ghost-bg)', border: '1px solid var(--border-subtle)', color: 'var(--text-main)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              >
                <X size={16} />
              </button>
            </div>

            <div style={{ padding: '16px 18px' }}>
              <textarea
                rows={3}
                placeholder="e.g. Less Spicy, Extra Crispy, Jain..."
                value={customNote}
                onChange={e => setCustomNote(e.target.value)}
                style={{
                  width: '100%',
                  borderRadius: '10px',
                  background: 'var(--btn-ghost-bg)',
                  border: '1px solid var(--border-bright)',
                  color: 'var(--text-main)',
                  padding: '10px',
                  fontSize: '13px',
                  boxSizing: 'border-box'
                }}
              />

              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', margin: '12px 0 20px 0' }}>
                {['Less Spicy', 'Extra Spicy', 'Jain', 'No Onion', 'Extra Butter', 'Crispy'].map(tag => (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => setCustomNote(prev => prev ? `${prev}, ${tag}` : tag)}
                    style={{
                      fontSize: '11px',
                      padding: '5px 9px',
                      borderRadius: '7px',
                      background: 'var(--btn-ghost-bg)',
                      border: '1px solid var(--border-subtle)',
                      color: 'var(--text-muted)',
                      cursor: 'pointer'
                    }}
                  >
                    + {tag}
                  </button>
                ))}
              </div>

              <div style={{ display: 'flex', gap: '10px' }}>
                <button
                  onClick={() => setCustomizerItem(null)}
                  className="btn btn-ghost"
                  style={{ flex: 1, fontSize: '13px' }}
                >
                  Cancel
                </button>
                <button
                  onClick={saveCustomization}
                  className="btn btn-primary"
                  style={{ flex: 2, fontSize: '13px' }}
                >
                  Save Prep Note
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Customer Info Modal */}
      {isCustModalOpen && (
        <div className="modal-overlay" onClick={() => setIsCustModalOpen(false)}>
          <div className="glass-panel" onClick={e => e.stopPropagation()} style={{
            width: '90%',
            maxWidth: '360px',
            borderRadius: '16px',
            padding: '18px',
            background: 'var(--bg-surface)',
            border: '1px solid var(--border-subtle)',
            boxShadow: '0 20px 40px rgba(0,0,0,0.5)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'rgba(59, 130, 246, 0.15)', color: '#3b82f6', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <User size={16} />
                </div>
                <div>
                  <h4 style={{ fontSize: '15px', fontWeight: '900', color: 'var(--text-main)', margin: 0 }}>Customer Info</h4>
                  <p style={{ fontSize: '10.5px', color: 'var(--text-dim)', margin: 0 }}>Table {table.id}</p>
                </div>
              </div>
              <button
                onClick={() => setIsCustModalOpen(false)}
                style={{ background: 'none', border: 'none', color: 'var(--text-dim)', cursor: 'pointer', padding: '4px' }}
              >
                <X size={18} />
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '16px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '11px', fontWeight: '800', color: 'var(--text-muted)', marginBottom: '4px' }}>
                  Customer Name
                </label>
                <input
                  type="text"
                  placeholder="e.g. Rahul Sharma"
                  value={customerName}
                  onChange={e => handleUpdateCustomer(e.target.value, customerPhone)}
                  style={{
                    width: '100%',
                    height: '38px',
                    borderRadius: '9px',
                    background: 'var(--btn-ghost-bg)',
                    border: '1px solid var(--border-bright)',
                    padding: '0 12px',
                    color: 'var(--text-main)',
                    fontSize: '13px',
                    boxSizing: 'border-box'
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '11px', fontWeight: '800', color: 'var(--text-muted)', marginBottom: '4px' }}>
                  Mobile Number
                </label>
                <input
                  type="tel"
                  placeholder="e.g. 9876543210"
                  value={customerPhone}
                  onChange={e => handleUpdateCustomer(customerName, e.target.value)}
                  style={{
                    width: '100%',
                    height: '38px',
                    borderRadius: '9px',
                    background: 'var(--btn-ghost-bg)',
                    border: '1px solid var(--border-bright)',
                    padding: '0 12px',
                    color: 'var(--text-main)',
                    fontSize: '13px',
                    boxSizing: 'border-box'
                  }}
                />
              </div>
            </div>

            <button
              onClick={() => setIsCustModalOpen(false)}
              className="btn btn-primary"
              style={{ width: '100%', height: '40px', fontSize: '13px', fontWeight: '800' }}
            >
              Done
            </button>
          </div>
        </div>
      )}

      {/* Dish Photo Preview and Manage Modal */}
      {previewDish && (
        <div className="modal-overlay" onClick={() => setPreviewDish(null)}>
          <div className="glass-panel" onClick={e => e.stopPropagation()} style={{
            width: '90%',
            maxWidth: '340px',
            borderRadius: '16px',
            padding: '16px',
            background: 'var(--bg-surface)',
            border: '1px solid var(--border-subtle)',
            boxShadow: '0 20px 40px rgba(0,0,0,0.5)',
            display: 'flex',
            flexDirection: 'column',
            gap: '12px'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h4 style={{ fontSize: '15px', fontWeight: '900', color: 'var(--text-main)', margin: 0 }}>
                  {previewDish.name}
                </h4>
                <p style={{ fontSize: '10.5px', color: 'var(--text-dim)', margin: '2px 0 0 0' }}>
                  #{previewDish.code} • Stored Locally on Device
                </p>
              </div>
              <button
                onClick={() => setPreviewDish(null)}
                style={{ background: 'none', border: 'none', color: 'var(--text-dim)', cursor: 'pointer', padding: '4px' }}
              >
                <X size={18} />
              </button>
            </div>

            <div style={{
              width: '100%',
              height: '200px',
              borderRadius: '12px',
              overflow: 'hidden',
              background: '#000',
              border: '1px solid var(--border-subtle)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <img
                src={dishImages[previewDish.code]}
                alt={previewDish.name}
                style={{ width: '100%', height: '100%', objectFit: 'contain' }}
              />
            </div>

            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                onClick={() => handleTriggerUpload(previewDish.code)}
                className="btn btn-primary"
                style={{ flex: 1, height: '38px', fontSize: '12px', fontWeight: '800', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
              >
                <Camera size={14} />
                <span>Change Photo</span>
              </button>

              <button
                onClick={async () => {
                  await removeDishImage(previewDish.code);
                  setPreviewDish(null);
                }}
                className="btn btn-ghost"
                style={{ height: '38px', padding: '0 12px', color: '#ef4444', borderColor: 'rgba(239, 68, 68, 0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}
                title="Remove photo"
              >
                <Trash2 size={14} />
                <span style={{ fontSize: '12px', fontWeight: '800' }}>Remove</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
