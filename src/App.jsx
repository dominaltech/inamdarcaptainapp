import React, { useState } from 'react';
import { CaptainProvider, useCaptain } from './context/CaptainContext';
import CaptainHeader from './components/CaptainHeader';
import TableGrid from './components/TableGrid';
import MenuOrderView from './components/MenuOrderView';
import FoodReadyBanner from './components/FoodReadyBanner';
import WaiterAuthModal from './components/WaiterAuthModal';
import {
  LayoutGrid,
  Bell,
  UserCheck,
  Check
} from 'lucide-react';

function CaptainAppMain() {
  const { currentWaiter, readyAlerts, markPickedUp, markAllPickedUp } = useCaptain();
  const [selectedTable, setSelectedTable] = useState(null);
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [activeBottomNav, setActiveBottomNav] = useState('tables'); // 'tables' | 'alerts'

  return (
    <div className="captain-app-container">
      {/* Top Mobile Header */}
      <CaptainHeader onOpenWaiterSwitch={() => setIsAuthOpen(true)} />

      {/* Main View Area */}
      <main style={{
        flex: 1,
        overflow: 'hidden',
        position: 'relative',
        width: '100%',
        display: 'flex',
        flexDirection: 'column'
      }}>
        {selectedTable ? (
          <MenuOrderView
            table={selectedTable}
            onBack={() => setSelectedTable(null)}
          />
        ) : activeBottomNav === 'alerts' ? (
          /* Ready Alerts View */
          <div style={{ padding: '14px', overflowY: 'auto', height: '100%', width: '100%', boxSizing: 'border-box' }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '14px'
            }}>
              <div>
                <h3 style={{ fontSize: '16px', fontWeight: '900', color: 'var(--text-main)', margin: 0 }}>
                  Kitchen Pickups
                </h3>
                <p style={{ fontSize: '11px', color: 'var(--text-dim)', margin: '2px 0 0 0' }}>
                  Dishes marked ready by kitchen for waiter pickup
                </p>
              </div>

              {readyAlerts.length > 1 && (
                <button
                  onClick={() => markAllPickedUp()}
                  style={{
                    fontSize: '11px',
                    fontWeight: '800',
                    padding: '5px 10px',
                    borderRadius: '8px',
                    background: 'rgba(16, 185, 129, 0.15)',
                    color: '#10b981',
                    border: '1px solid rgba(16, 185, 129, 0.3)',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px'
                  }}
                >
                  <Check size={12} strokeWidth={3} />
                  <span>Pick All ({readyAlerts.length})</span>
                </button>
              )}
            </div>

            {readyAlerts.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '50px 16px', color: 'var(--text-muted)' }}>
                <Bell size={36} style={{ opacity: 0.25, marginBottom: '8px' }} />
                <p style={{ fontSize: '13px', fontWeight: '700' }}>No pending pickups right now.</p>
                <p style={{ fontSize: '11px', marginTop: '4px', color: 'var(--text-dim)' }}>
                  When cooks mark dishes ready on KDS, alerts will appear here.
                </p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {readyAlerts.map(alert => (
                  <div
                    key={alert.id}
                    className="glass-panel"
                    style={{
                      padding: '12px 14px',
                      borderRadius: '12px',
                      borderLeft: '4px solid #10b981',
                      background: 'rgba(16, 185, 129, 0.08)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: '10px'
                    }}
                  >
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: '10px', fontWeight: '800', color: '#10b981', textTransform: 'uppercase' }}>
                        TABLE {alert.tableId} • {alert.time}
                      </div>
                      <div style={{
                        fontSize: '14.5px',
                        fontWeight: '900',
                        color: 'var(--text-main)',
                        marginTop: '2px',
                        wordBreak: 'break-word'
                      }}>
                        {alert.qty}x {alert.dish}
                      </div>
                    </div>

                    {/* Interactive Pickup Action Button */}
                    <button
                      onClick={() => markPickedUp(alert)}
                      style={{
                        fontSize: '11px',
                        fontWeight: '800',
                        padding: '7px 13px',
                        borderRadius: '8px',
                        background: '#10b981',
                        color: '#ffffff',
                        border: 'none',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '5px',
                        flexShrink: 0,
                        boxShadow: '0 2px 6px rgba(16, 185, 129, 0.4)',
                        transition: 'transform 0.1s ease, background-color 0.15s ease'
                      }}
                      onMouseDown={e => e.currentTarget.style.transform = 'scale(0.96)'}
                      onMouseUp={e => e.currentTarget.style.transform = 'scale(1)'}
                      onTouchStart={e => e.currentTarget.style.transform = 'scale(0.96)'}
                      onTouchEnd={e => e.currentTarget.style.transform = 'scale(1)'}
                      title="Tap to mark picked up and served"
                    >
                      <Check size={14} strokeWidth={3} />
                      <span>PICKUP</span>
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : (
          /* Table Floor Grid */
          <TableGrid onSelectTable={table => setSelectedTable(table)} />
        )}

        <FoodReadyBanner />
      </main>

      {/* Mobile Bottom Navigation Bar (Hidden when taking order on a specific table) */}
      {!selectedTable && (
        <nav className="mobile-nav-bar">
          <button
            onClick={() => setActiveBottomNav('tables')}
            className={`mobile-nav-item ${activeBottomNav === 'tables' ? 'active' : ''}`}
          >
            <div className="nav-icon-wrap">
              <LayoutGrid size={17} />
            </div>
            <span>Tables</span>
          </button>

          <button
            onClick={() => setActiveBottomNav('alerts')}
            className={`mobile-nav-item ${activeBottomNav === 'alerts' ? 'active' : ''}`}
          >
            <div className="nav-icon-wrap" style={{ position: 'relative' }}>
              <Bell size={17} />
              {readyAlerts.length > 0 && (
                <span style={{
                  position: 'absolute',
                  top: '-2px',
                  right: '-2px',
                  width: '13px',
                  height: '13px',
                  borderRadius: '50%',
                  background: '#10b981',
                  color: '#fff',
                  fontSize: '9px',
                  fontWeight: '900',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  {readyAlerts.length}
                </span>
              )}
            </div>
            <span>Pickups</span>
          </button>

          <button
            onClick={() => setIsAuthOpen(true)}
            className="mobile-nav-item"
          >
            <div className="nav-icon-wrap">
              <UserCheck size={17} />
            </div>
            <span>{currentWaiter?.name?.split(' ')[0] || 'Waiter'}</span>
          </button>
        </nav>
      )}

      {/* Waiter Switcher Modal */}
      <WaiterAuthModal
        isOpen={isAuthOpen}
        onClose={() => setIsAuthOpen(false)}
      />
    </div>
  );
}

export default function App() {
  return (
    <CaptainProvider>
      <CaptainAppMain />
    </CaptainProvider>
  );
}
