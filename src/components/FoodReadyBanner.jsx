import React from 'react';
import { useCaptain } from '../context/CaptainContext';
import { Bell, Check } from 'lucide-react';

export default function FoodReadyBanner() {
  const { readyAlerts, markPickedUp } = useCaptain();

  if (!readyAlerts || readyAlerts.length === 0) return null;

  return (
    <div style={{
      position: 'fixed',
      top: '72px',
      right: '16px',
      zIndex: 999,
      display: 'flex',
      flexDirection: 'column',
      gap: '8px',
      maxWidth: '360px',
      width: 'calc(100% - 32px)'
    }}>
      {readyAlerts.map(alert => (
        <div
          key={alert.id}
          className="glass-panel"
          style={{
            background: 'linear-gradient(135deg, rgba(6, 78, 59, 0.95), rgba(15, 23, 42, 0.98))',
            border: '1.5px solid #10b981',
            borderRadius: '12px',
            padding: '12px 14px',
            boxShadow: '0 8px 24px rgba(0, 0, 0, 0.7)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '10px'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{
              width: '32px',
              height: '32px',
              borderRadius: '50%',
              background: '#10b981',
              color: '#fff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <Bell size={16} />
            </div>
            <div>
              <div style={{ fontSize: '11px', fontWeight: '800', color: '#6ee7b7', textTransform: 'uppercase' }}>
                Food Ready! (Table {alert.tableId})
              </div>
              <div style={{ fontSize: '13px', fontWeight: '700', color: '#fff' }}>
                {alert.qty}x {alert.dish}
              </div>
            </div>
          </div>

          <button
            onClick={() => markPickedUp(alert)}
            title="Mark Picked Up / Served"
            style={{
              background: '#10b981',
              border: 'none',
              borderRadius: '7px',
              padding: '6px 10px',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              color: '#fff',
              fontSize: '11px',
              fontWeight: '800',
              cursor: 'pointer',
              flexShrink: 0
            }}
          >
            <Check size={14} strokeWidth={3} />
            <span>PICKUP</span>
          </button>
        </div>
      ))}
    </div>
  );
}
