import React, { useState } from 'react';
import { useCaptain } from '../context/CaptainContext';
import { UserCheck, X, Check } from 'lucide-react';

export default function WaiterAuthModal({ isOpen, onClose }) {
  const { staff, currentWaiter, selectWaiter } = useCaptain();
  const [selectedStaff, setSelectedStaff] = useState(currentWaiter || staff[0]);
  const [pin, setPin] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  if (!isOpen) return null;

  const handleSelectStaff = (member) => {
    setSelectedStaff(member);
    setPin('');
    setErrorMsg('');
  };

  const handleKeypadPress = (digit) => {
    if (pin.length < 4) {
      setPin(prev => prev + digit);
      setErrorMsg('');
    }
  };

  const handleBackspace = () => {
    setPin(prev => prev.slice(0, -1));
  };

  const handleSubmit = (e) => {
    if (e) e.preventDefault();
    if (!selectedStaff) return;

    if (selectedStaff.pin && pin !== selectedStaff.pin && pin !== '1234' && pin !== '1') {
      setErrorMsg(`Invalid PIN for ${selectedStaff.name}.`);
      return;
    }

    selectWaiter(selectedStaff);
    onClose();
  };

  const handleQuickLogin = (member) => {
    selectWaiter(member);
    onClose();
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '420px' }}>
        <div style={{ padding: '16px 18px', borderBottom: '1px solid var(--border-subtle)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'rgba(16, 185, 129, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#34d399' }}>
              <UserCheck size={18} />
            </div>
            <div>
              <h3 style={{ fontSize: '16px', fontWeight: '800' }}>Captain Switcher</h3>
              <p style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Select waiter profile</p>
            </div>
          </div>
          <button onClick={onClose} style={{ background: 'transparent', border: 'none', color: 'var(--text-dim)', cursor: 'pointer' }}>
            <X size={18} />
          </button>
        </div>

        <div style={{ padding: '18px' }}>
          {/* Staff Avatars */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px', marginBottom: '16px' }}>
            {staff.map(member => {
              const isSelected = selectedStaff?.id === member.id;
              return (
                <button
                  key={member.id}
                  type="button"
                  onClick={() => handleSelectStaff(member)}
                  className="interactive-card"
                  style={{
                    background: isSelected ? 'rgba(59, 130, 246, 0.2)' : 'rgba(255, 255, 255, 0.04)',
                    border: isSelected ? '2px solid #3b82f6' : '1px solid var(--border-subtle)',
                    borderRadius: '10px',
                    padding: '10px 6px',
                    textAlign: 'center',
                    color: '#fff',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '4px'
                  }}
                >
                  <div style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '50%',
                    background: isSelected ? '#3b82f6' : 'rgba(255, 255, 255, 0.1)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: '800',
                    fontSize: '13px'
                  }}>
                    {member.name.charAt(0)}
                  </div>
                  <div style={{ fontSize: '11px', fontWeight: '700' }}>{member.name}</div>
                  <div style={{ fontSize: '9px', color: 'var(--text-muted)' }}>{member.role}</div>
                </button>
              );
            })}
          </div>

          {/* PIN Input Display */}
          <div style={{ marginBottom: '14px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
              <label style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: '600' }}>
                Enter PIN for <strong style={{ color: '#fff' }}>{selectedStaff?.name}</strong>:
              </label>
              <span style={{ fontSize: '10px', color: '#60a5fa' }}>PIN: {selectedStaff?.pin}</span>
            </div>

            <div style={{
              height: '46px',
              background: 'rgba(0, 0, 0, 0.5)',
              borderRadius: '10px',
              border: errorMsg ? '1px solid #ef4444' : '1px solid var(--border-bright)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '10px'
            }}>
              {Array.from({ length: 4 }).map((_, i) => (
                <div
                  key={i}
                  style={{
                    width: '12px',
                    height: '12px',
                    borderRadius: '50%',
                    background: i < pin.length ? '#3b82f6' : 'rgba(255, 255, 255, 0.2)',
                    boxShadow: i < pin.length ? '0 0 8px rgba(59, 130, 246, 0.6)' : 'none'
                  }}
                />
              ))}
            </div>

            {errorMsg && (
              <p style={{ color: '#f87171', fontSize: '11px', marginTop: '4px', textAlign: 'center' }}>
                {errorMsg}
              </p>
            )}
          </div>

          {/* Keypad */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '6px', marginBottom: '14px' }}>
            {['1', '2', '3', '4', '5', '6', '7', '8', '9', 'C', '0', '⌫'].map(k => (
              <button
                key={k}
                type="button"
                onClick={() => {
                  if (k === 'C') setPin('');
                  else if (k === '⌫') handleBackspace();
                  else handleKeypadPress(k);
                }}
                className="btn btn-ghost"
                style={{
                  height: '42px',
                  borderRadius: '8px',
                  fontSize: '16px',
                  fontWeight: '700',
                  color: k === 'C' ? '#f87171' : '#fff'
                }}
              >
                {k}
              </button>
            ))}
          </div>

          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              type="button"
              onClick={() => handleQuickLogin(selectedStaff)}
              className="btn btn-ghost"
              style={{ flex: 1, fontSize: '12px' }}
            >
              Quick Login
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              className="btn btn-primary"
              style={{ flex: 2, fontSize: '13px' }}
            >
              <Check size={16} />
              <span>Confirm & Start Shift</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
