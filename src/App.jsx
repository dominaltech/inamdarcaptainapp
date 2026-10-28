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
  Check,
  Download,
  Smartphone,
  X
} from 'lucide-react';

function CaptainAppMain() {
  const {
    currentWaiter,
    readyAlerts,
    markPickedUp,
    markAllPickedUp,
    isPwaInstalled,
    installPwa,
    showIosInstallGuide,
    setShowIosInstallGuide
  } = useCaptain();
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

            {/* PWA Mobile App Install Card in Pickups Tab */}
            <div
              className="glass-panel"
              style={{
                marginBottom: '14px',
                padding: '12px 14px',
                borderRadius: '12px',
                background: 'linear-gradient(135deg, rgba(37, 99, 235, 0.12), rgba(59, 130, 246, 0.05))',
                border: '1.5px solid rgba(59, 130, 246, 0.35)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '12px'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0 }}>
                <div style={{
                  width: '38px',
                  height: '38px',
                  borderRadius: '10px',
                  background: 'linear-gradient(135deg, #2563eb, #1d4ed8)',
                  color: '#fff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                  boxShadow: '0 4px 10px rgba(37, 99, 235, 0.35)'
                }}>
                  <Smartphone size={20} />
                </div>
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontSize: '13px', fontWeight: '900', color: 'var(--text-main)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    Install Captain App
                  </div>
                  <div style={{ fontSize: '10.5px', color: 'var(--text-muted)', marginTop: '1px' }}>
                    {isPwaInstalled ? 'Installed on this device' : 'Add to mobile home screen for fast fullscreen ordering'}
                  </div>
                </div>
              </div>

              {isPwaInstalled ? (
                <span style={{
                  fontSize: '11px',
                  fontWeight: '800',
                  color: '#10b981',
                  background: 'rgba(16, 185, 129, 0.15)',
                  padding: '5px 10px',
                  borderRadius: '8px',
                  border: '1px solid rgba(16, 185, 129, 0.3)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  flexShrink: 0
                }}>
                  <Check size={13} strokeWidth={3} />
                  <span>Installed</span>
                </span>
              ) : (
                <button
                  onClick={installPwa}
                  className="btn btn-primary"
                  style={{
                    height: '34px',
                    minHeight: '34px',
                    padding: '0 12px',
                    fontSize: '11px',
                    fontWeight: '800',
                    borderRadius: '8px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '5px',
                    flexShrink: 0,
                    boxShadow: '0 4px 12px rgba(37, 99, 235, 0.4)'
                  }}
                  title="Install Inamdar Captain as Mobile App"
                >
                  <Download size={14} strokeWidth={2.5} />
                  <span>Install</span>
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

      {/* iOS Install Instruction Modal */}
      {showIosInstallGuide && (
        <div className="modal-overlay" onClick={() => setShowIosInstallGuide(false)}>
          <div className="bottom-sheet" onClick={e => e.stopPropagation()} style={{ padding: '20px' }}>
            <div className="sheet-handle" />
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
              <h3 style={{ fontSize: '16px', fontWeight: '900', color: 'var(--text-main)', margin: 0 }}>
                Install on iPhone / iPad
              </h3>
              <button
                onClick={() => setShowIosInstallGuide(false)}
                style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
              >
                <X size={18} />
              </button>
            </div>
            <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '14px' }}>
              Follow these simple steps in Safari to add Inamdar Captain to your home screen:
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '13px', color: 'var(--text-main)', marginBottom: '20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={{ width: '24px', height: '24px', borderRadius: '50%', background: '#2563eb', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', fontWeight: '800', flexShrink: 0 }}>1</span>
                <span>Tap the <strong>Share</strong> button (📤) at the bottom of Safari.</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={{ width: '24px', height: '24px', borderRadius: '50%', background: '#2563eb', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', fontWeight: '800', flexShrink: 0 }}>2</span>
                <span>Scroll down and tap <strong>"Add to Home Screen"</strong> (➕).</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={{ width: '24px', height: '24px', borderRadius: '50%', background: '#2563eb', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', fontWeight: '800', flexShrink: 0 }}>3</span>
                <span>Tap <strong>"Add"</strong> in the top-right corner to finish.</span>
              </div>
            </div>
            <button
              onClick={() => setShowIosInstallGuide(false)}
              className="btn btn-primary"
              style={{ width: '100%', height: '42px', fontSize: '14px' }}
            >
              Done
            </button>
          </div>
        </div>
      )}
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
