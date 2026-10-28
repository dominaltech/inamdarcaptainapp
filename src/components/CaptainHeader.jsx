import React from 'react';
import { useCaptain } from '../context/CaptainContext';
import {
  Smartphone,
  UserCheck,
  ChevronDown,
  Volume2,
  VolumeX,
  RefreshCw,
  Sun,
  Moon
} from 'lucide-react';

export default function CaptainHeader({ onOpenWaiterSwitch }) {
  const { currentWaiter, isMuted, toggleMute, isLoading, loadData, theme, toggleTheme } = useCaptain();

  // First name or short name for waiter
  const waiterShortName = (currentWaiter?.name || 'Waiter').split(' ')[0];
  const isLight = theme === 'light';

  return (
    <header style={{
      height: '52px',
      minHeight: '52px',
      padding: '0 12px',
      background: 'var(--bg-header)',
      borderBottom: '1px solid var(--border-subtle)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      position: 'sticky',
      top: 0,
      zIndex: 100,
      width: '100%',
      boxSizing: 'border-box',
      transition: 'background-color 0.2s ease'
    }}>
      {/* Left: App Title & Status */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0 }}>
        <div style={{
          width: '30px',
          height: '30px',
          borderRadius: '8px',
          background: 'linear-gradient(135deg, #2563eb, #1d4ed8)',
          color: '#fff',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0
        }}>
          <Smartphone size={16} />
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', minWidth: 0 }}>
          <span style={{
            fontSize: '15px',
            fontWeight: '900',
            color: 'var(--text-main)',
            letterSpacing: '0.3px',
            whiteSpace: 'nowrap'
          }}>
            CAPTAIN
          </span>
          <span style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '3px',
            fontSize: '9px',
            padding: '1px 5px',
            borderRadius: '4px',
            background: 'rgba(16, 185, 129, 0.18)',
            color: '#10b981',
            fontWeight: '800'
          }}>
            <span style={{ width: '5px', height: '5px', borderRadius: '50%', background: '#10b981' }} />
            LIVE
          </span>
        </div>
      </div>

      {/* Right Controls: Day/Night Mode Switch, Refresh, Sound, Waiter Profile */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}>
        {/* Day Mode / Night Mode Small Switch Button */}
        <button
          onClick={toggleTheme}
          className="btn btn-ghost"
          style={{
            width: '30px',
            height: '30px',
            minHeight: '30px',
            padding: 0,
            borderRadius: '8px',
            border: isLight ? '1px solid #cbd5e1' : '1px solid var(--border-subtle)',
            background: isLight ? '#f8fafc' : 'rgba(255, 255, 255, 0.06)'
          }}
          title={isLight ? 'Switch to Night Mode' : 'Switch to Day Mode'}
        >
          {isLight ? (
            <Moon size={14} style={{ color: '#2563eb' }} />
          ) : (
            <Sun size={14} style={{ color: '#f59e0b' }} />
          )}
        </button>

        <button
          onClick={loadData}
          className="btn btn-ghost"
          style={{ width: '30px', height: '30px', minHeight: '30px', padding: 0, borderRadius: '8px' }}
          title="Refresh Tables"
        >
          <RefreshCw size={13} className={isLoading ? 'spin' : ''} style={{ color: 'var(--text-muted)' }} />
        </button>

        <button
          onClick={toggleMute}
          className="btn btn-ghost"
          style={{ width: '30px', height: '30px', minHeight: '30px', padding: 0, borderRadius: '8px' }}
          title={isMuted ? 'Unmute Food Ready Chime' : 'Mute Sound'}
        >
          {isMuted ? <VolumeX size={14} style={{ color: '#f87171' }} /> : <Volume2 size={14} style={{ color: '#3b82f6' }} />}
        </button>

        <button
          onClick={onOpenWaiterSwitch}
          className="btn btn-ghost"
          style={{
            padding: '0 8px',
            height: '30px',
            minHeight: '30px',
            borderRadius: '8px',
            fontSize: '11px',
            border: '1px solid rgba(16, 185, 129, 0.35)',
            background: 'rgba(16, 185, 129, 0.1)',
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            maxWidth: '105px'
          }}
        >
          <UserCheck size={13} style={{ color: '#10b981', flexShrink: 0 }} />
          <span style={{
            fontWeight: '700',
            color: 'var(--text-main)',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap'
          }}>
            {waiterShortName}
          </span>
          <ChevronDown size={11} style={{ color: 'var(--text-dim)', flexShrink: 0 }} />
        </button>
      </div>
    </header>
  );
}
