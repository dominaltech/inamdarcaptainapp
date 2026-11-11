import React, { useState } from 'react';
import { CaptainProvider, useCaptain } from './context/CaptainContext';
import CaptainHeader from './components/CaptainHeader';
import TableGrid from './components/TableGrid';
import MenuOrderView from './components/MenuOrderView';
import FoodReadyBanner from './components/FoodReadyBanner';
import WaiterAuthModal from './components/WaiterAuthModal';
import { X } from 'lucide-react';

function CaptainAppMain() {
  const {
    showIosInstallGuide,
    setShowIosInstallGuide
  } = useCaptain();
  const [selectedTable, setSelectedTable] = useState(null);
  const [isAuthOpen, setIsAuthOpen] = useState(false);

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
        ) : (
          /* Table Floor Grid - Full Screen Ordering */
          <TableGrid onSelectTable={table => setSelectedTable(table)} />
        )}

        {/* Realtime Floating Notification Banner when Dishes are Ready */}
        <FoodReadyBanner />
      </main>

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
