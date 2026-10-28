import React, { useState, useMemo } from 'react';
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
  Receipt,
  X,
  ChevronRight,
  ShoppingBag,
  Trash2
} from 'lucide-react';

export default function MenuOrderView({ table, onBack }) {
  const {
    menuItems,
    fireKot,
    orderItems,
    updateTablePax,
    setTableStatus
  } = useCaptain();

  const [activeTab, setActiveTab] = useState('menu'); // 'menu' | 'active_kots'
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [cart, setCart] = useState([]);
  const [isCartSheetOpen, setIsCartSheetOpen] = useState(false);
  const [isFiring, setIsFiring] = useState(false);
  const [customizerItem, setCustomizerItem] = useState(null);
  const [customNote, setCustomNote] = useState('');

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
    const rate = isAcSection ? item.ac_rate : item.hall_rate;
    return sum + item.qty * rate;
  }, 0);

  const handleFireKot = async () => {
    if (cart.length === 0 || isFiring) return;
    setIsFiring(true);

    try {
      await fireKot({
        tableId: table.id,
        section: table.section,
        cartItems: cart
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
      {/* Mobile Top Bar */}
      <div style={{
        padding: '6px 10px',
        borderBottom: '1px solid var(--border-subtle)',
        background: 'rgba(15, 22, 38, 0.98)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexShrink: 0,
        width: '100%',
        boxSizing: 'border-box',
        gap: '6px'
      }}>
        {/* Left: Back & Table Info */}
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
              <span style={{ fontSize: '15px', fontWeight: '900', color: '#fff', whiteSpace: 'nowrap' }}>T-{table.id}</span>
              <span style={{ fontSize: '9px', padding: '1px 5px', borderRadius: '4px', background: isAcSection ? 'rgba(59, 130, 246, 0.2)' : 'rgba(168, 85, 247, 0.2)', color: isAcSection ? '#60a5fa' : '#c084fc', fontWeight: '800', whiteSpace: 'nowrap' }}>
                {isAcSection ? 'AC' : 'Hall'}
              </span>
            </div>
            <div style={{ fontSize: '9px', color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {table.section}
            </div>
          </div>
        </div>

        {/* Right: Tab Pills */}
        <div style={{ display: 'flex', background: 'rgba(0, 0, 0, 0.5)', padding: '2px', borderRadius: '7px', border: '1px solid var(--border-subtle)', flexShrink: 0 }}>
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
              const activePrice = isAcSection ? dish.ac_rate : dish.hall_rate;
              const cartItem = cart.find(i => i.code === dish.code);

              return (
                <div
                  key={dish.code}
                  className="glass-panel"
                  style={{
                    padding: '12px 14px',
                    borderRadius: '12px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '12px',
                    border: cartItem ? '1.5px solid #3b82f6' : '1px solid var(--border-subtle)',
                    background: cartItem ? 'rgba(59, 130, 246, 0.08)' : 'var(--bg-card)'
                  }}
                >
                  {/* Left: Dish Code, Name, Price */}
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
            <h3 style={{ fontSize: '15px', fontWeight: '800' }}>Active Orders (Table {table.id})</h3>
            <button
              onClick={() => setTableStatus(table.id, 'BILLED')}
              className="btn btn-warning"
              style={{ minHeight: '34px', height: '34px', fontSize: '11px', padding: '0 10px' }}
            >
              <Receipt size={14} />
              <span>Request Bill</span>
            </button>
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
                    borderLeft: item.status === 'READY' ? '4px solid #10b981' : item.status === 'PREPARING' ? '4px solid #3b82f6' : '4px solid #f59e0b'
                  }}
                >
                  <div>
                    <div style={{ fontWeight: '800', color: '#fff', fontSize: '14px' }}>
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
                    background: item.status === 'READY' ? '#10b981' : item.status === 'PREPARING' ? '#3b82f6' : '#f59e0b',
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
                <h3 style={{ fontSize: '16px', fontWeight: '900', color: '#fff' }}>
                  Staged KOT (Table {table.id})
                </h3>
                <p style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Review items before firing to kitchen</p>
              </div>
              <button
                onClick={() => setIsCartSheetOpen(false)}
                style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'rgba(255, 255, 255, 0.1)', border: 'none', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              >
                <X size={16} />
              </button>
            </div>

            <div style={{ flex: 1, overflowY: 'auto', padding: '14px 18px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {cart.map(item => {
                const rate = isAcSection ? item.ac_rate : item.hall_rate;
                return (
                  <div
                    key={item.code}
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: '10px 12px',
                      background: 'rgba(255, 255, 255, 0.04)',
                      borderRadius: '10px'
                    }}
                  >
                    <div>
                      <div style={{ fontWeight: '800', fontSize: '13px', color: '#fff' }}>{item.name}</div>
                      <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                        ₹{rate} × {item.qty} = <strong style={{ color: '#34d399' }}>₹{rate * item.qty}</strong>
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
                        style={{ width: '28px', height: '28px', borderRadius: '6px', border: 'none', background: 'rgba(255, 255, 255, 0.12)', color: '#fff' }}
                      >
                        -
                      </button>
                      <span style={{ fontWeight: '900', minWidth: '20px', textAlign: 'center', fontSize: '14px' }}>
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

            <div style={{ padding: '14px 18px', borderTop: '1px solid var(--border-subtle)', background: 'rgba(0, 0, 0, 0.4)' }}>
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
                <h3 style={{ fontSize: '15px', fontWeight: '900' }}>Custom Prep Note</h3>
                <p style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{customizerItem.name}</p>
              </div>
              <button
                onClick={() => setCustomizerItem(null)}
                style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'rgba(255, 255, 255, 0.1)', border: 'none', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
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
                  background: 'rgba(0, 0, 0, 0.5)',
                  border: '1px solid var(--border-bright)',
                  color: '#fff',
                  padding: '10px',
                  fontSize: '13px'
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
                      background: 'rgba(255, 255, 255, 0.08)',
                      color: 'var(--text-muted)',
                      border: 'none',
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
    </div>
  );
}
