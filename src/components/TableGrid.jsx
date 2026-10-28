import React, { useState } from 'react';
import { useCaptain } from '../context/CaptainContext';
import {
  Plus,
  Grid3X3,
  LayoutGrid,
  X,
  ChevronRight
} from 'lucide-react';

export default function TableGrid({ onSelectTable }) {
  const { tables, kots, orderItems, updateTablePax } = useCaptain();
  const [selectedSection, setSelectedSection] = useState('ALL');
  const [columnsMode, setColumnsMode] = useState(3); // 3 (Compact) or 2 (Comfortable)
  const [paxSheetTable, setPaxSheetTable] = useState(null);

  // Dine-in sections only (Parcel & Home Delivery removed from Captain App)
  const sections = ['ALL', 'AC', 'FAMILY AC'];

  const filteredTables = selectedSection === 'ALL'
    ? tables
    : tables.filter(t => (t.section || '').toUpperCase() === selectedSection);

  const availableCount = tables.filter(t => t.status === 'AVAILABLE').length;
  const occupiedCount = tables.filter(t => t.status === 'OCCUPIED').length;
  const billedCount = tables.filter(t => t.status === 'BILLED').length;

  const handleTableTap = (table) => {
    if (table.status === 'AVAILABLE') {
      setPaxSheetTable(table);
    } else {
      onSelectTable(table);
    }
  };

  const handleConfirmPax = (pax) => {
    if (paxSheetTable) {
      updateTablePax(paxSheetTable.id, pax);
      const updated = { ...paxSheetTable, pax };
      setPaxSheetTable(null);
      onSelectTable(updated);
    }
  };

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      height: '100%',
      width: '100%',
      overflow: 'hidden',
      boxSizing: 'border-box'
    }}>
      {/* Top Section Summary & Floor Counters */}
      <div style={{
        padding: '8px 10px',
        borderBottom: '1px solid var(--border-subtle)',
        background: 'var(--bg-surface)',
        display: 'flex',
        flexDirection: 'column',
        gap: '6px',
        width: '100%',
        boxSizing: 'border-box'
      }}>
        {/* Floor Status Pill Counters + Column Switcher */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          fontSize: '11px',
          width: '100%'
        }}>
          {/* Status Counter Pills */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '5px', overflowX: 'auto' }}>
            <span style={{
              padding: '2px 6px',
              borderRadius: '5px',
              background: 'rgba(16, 185, 129, 0.15)',
              color: '#10b981',
              border: '1px solid rgba(16, 185, 129, 0.25)',
              fontWeight: '800',
              fontSize: '10px',
              whiteSpace: 'nowrap'
            }}>
              ● {availableCount} Vacant
            </span>
            <span style={{
              padding: '2px 6px',
              borderRadius: '5px',
              background: 'rgba(239, 68, 68, 0.15)',
              color: '#ef4444',
              border: '1px solid rgba(239, 68, 68, 0.25)',
              fontWeight: '800',
              fontSize: '10px',
              whiteSpace: 'nowrap'
            }}>
              ● {occupiedCount} Busy
            </span>
            <span style={{
              padding: '2px 6px',
              borderRadius: '5px',
              background: 'rgba(245, 158, 11, 0.15)',
              color: '#f59e0b',
              border: '1px solid rgba(245, 158, 11, 0.25)',
              fontWeight: '800',
              fontSize: '10px',
              whiteSpace: 'nowrap'
            }}>
              ● {billedCount} Billed
            </span>
          </div>

          {/* Grid Layout Toggle: 3-Col vs 2-Col */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            background: 'var(--btn-ghost-bg)',
            borderRadius: '6px',
            padding: '2px',
            border: '1px solid var(--border-subtle)',
            flexShrink: 0
          }}>
            <button
              onClick={() => setColumnsMode(3)}
              style={{
                background: columnsMode === 3 ? '#2563eb' : 'transparent',
                color: columnsMode === 3 ? '#fff' : 'var(--text-dim)',
                border: 'none',
                borderRadius: '4px',
                padding: '2px 5px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '2px',
                fontSize: '10px',
                fontWeight: '800'
              }}
              title="3 Columns (Small Compact)"
            >
              <Grid3X3 size={11} />
              <span>3</span>
            </button>
            <button
              onClick={() => setColumnsMode(2)}
              style={{
                background: columnsMode === 2 ? '#2563eb' : 'transparent',
                color: columnsMode === 2 ? '#fff' : 'var(--text-dim)',
                border: 'none',
                borderRadius: '4px',
                padding: '2px 5px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '2px',
                fontSize: '10px',
                fontWeight: '800'
              }}
              title="2 Columns (Comfortable)"
            >
              <LayoutGrid size={11} />
              <span>2</span>
            </button>
          </div>
        </div>

        {/* Section Tabs (Smooth Swipeable Chips) */}
        <div style={{
          display: 'flex',
          gap: '5px',
          overflowX: 'auto',
          paddingBottom: '2px',
          scrollbarWidth: 'none',
          msOverflowStyle: 'none',
          width: '100%'
        }}>
          {sections.map(sec => {
            const count = sec === 'ALL'
              ? tables.length
              : tables.filter(t => (t.section || '').toUpperCase() === sec).length;
            const isActive = selectedSection === sec;

            return (
              <button
                key={sec}
                onClick={() => setSelectedSection(sec)}
                style={{
                  padding: '4px 9px',
                  borderRadius: '8px',
                  border: isActive ? '1.5px solid #3b82f6' : '1px solid var(--border-subtle)',
                  background: isActive ? 'rgba(59, 130, 246, 0.25)' : 'var(--btn-ghost-bg)',
                  color: isActive ? '#2563eb' : 'var(--text-muted)',
                  fontWeight: '700',
                  fontSize: '11px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  whiteSpace: 'nowrap',
                  flexShrink: 0
                }}
              >
                <span>{sec}</span>
                <span style={{
                  fontSize: '9px',
                  background: isActive ? '#2563eb' : 'var(--border-bright)',
                  color: isActive ? '#fff' : 'var(--text-main)',
                  padding: '0 4px',
                  borderRadius: '999px'
                }}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Responsive Compact Mobile Table Cards Grid */}
      <div style={{
        flex: 1,
        overflowY: 'auto',
        WebkitOverflowScrolling: 'touch',
        padding: '8px 10px 85px 10px',
        display: 'grid',
        gridTemplateColumns: `repeat(${columnsMode}, 1fr)`,
        gap: '8px',
        alignContent: 'start',
        width: '100%',
        boxSizing: 'border-box'
      }}>
        {filteredTables.map(table => {
          const isAvailable = table.status === 'AVAILABLE';
          const isOccupied = table.status === 'OCCUPIED';
          const isBilled = table.status === 'BILLED';

          const activeTableItems = orderItems.filter(i => i.table_id === table.id && !i.is_cancelled);
          const runningAmount = activeTableItems.reduce((sum, item) => sum + (Number(item.amount) || 0), 0);

          let borderColor = 'var(--border-subtle)';
          let dotColor = '#10b981';
          let statusText = 'Vacant';

          if (isOccupied) {
            borderColor = 'rgba(239, 68, 68, 0.45)';
            dotColor = '#ef4444';
            statusText = 'Busy';
          } else if (isBilled) {
            borderColor = 'rgba(245, 158, 11, 0.45)';
            dotColor = '#f59e0b';
            statusText = 'Billed';
          }

          return (
            <div
              key={table.id}
              onClick={() => handleTableTap(table)}
              className="glass-panel interactive-card"
              style={{
                padding: columnsMode === 3 ? '6px 8px' : '10px 12px',
                borderRadius: '10px',
                border: `1.5px solid ${borderColor}`,
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                height: columnsMode === 3 ? '76px' : '96px',
                boxSizing: 'border-box',
                background: isOccupied
                  ? 'linear-gradient(135deg, rgba(239, 68, 68, 0.14), var(--bg-card))'
                  : isBilled
                  ? 'linear-gradient(135deg, rgba(245, 158, 11, 0.14), var(--bg-card))'
                  : 'var(--bg-card)'
              }}
            >
              {/* Row 1: Table ID & Status Dot / Label */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: '2px' }}>
                    <span style={{ fontSize: '9px', fontWeight: '700', color: 'var(--text-dim)' }}>T</span>
                    <span style={{
                      fontSize: columnsMode === 3 ? '16px' : '18px',
                      fontWeight: '900',
                      color: 'var(--text-main)',
                      lineHeight: 1
                    }}>
                      {table.id}
                    </span>
                  </div>

                  {/* Status Indicator */}
                  <span style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '3px',
                    fontSize: '9px',
                    fontWeight: '800',
                    color: dotColor
                  }}>
                    <span style={{ width: '5px', height: '5px', borderRadius: '50%', background: dotColor }} />
                    {columnsMode === 2 && <span>{statusText}</span>}
                  </span>
                </div>

                {/* Section Tag */}
                <div style={{
                  fontSize: '8px',
                  fontWeight: '800',
                  color: (table.section || '').includes('AC') ? '#3b82f6' : '#8b5cf6',
                  textTransform: 'uppercase',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                  marginTop: '1px'
                }}>
                  {table.section}
                </div>
              </div>

              {/* Row 2: Bottom Status Details / Action */}
              <div style={{ fontSize: '10px', marginTop: 'auto' }}>
                {isAvailable ? (
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '2px',
                    color: '#10b981',
                    fontWeight: '800',
                    fontSize: columnsMode === 3 ? '10px' : '11px'
                  }}>
                    <Plus size={11} />
                    <span>Take Order</span>
                  </div>
                ) : (
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <strong style={{ color: '#10b981', fontSize: columnsMode === 3 ? '11px' : '13px', fontWeight: '900' }}>
                        ₹{runningAmount}
                      </strong>
                      <span style={{ fontSize: '9px', color: 'var(--text-dim)' }}>
                        {table.pax || 2}p
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Quick Mobile Pax Selector Bottom Sheet */}
      {paxSheetTable && (
        <div className="modal-overlay" onClick={() => setPaxSheetTable(null)}>
          <div className="bottom-sheet" onClick={e => e.stopPropagation()}>
            <div className="sheet-handle" />

            <div style={{
              padding: '12px 16px',
              borderBottom: '1px solid var(--border-subtle)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <div>
                <h3 style={{ fontSize: '16px', fontWeight: '900', color: 'var(--text-main)' }}>
                  Table {paxSheetTable.id} ({paxSheetTable.section})
                </h3>
                <p style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Select number of guests (PAX)</p>
              </div>
              <button
                onClick={() => setPaxSheetTable(null)}
                style={{
                  width: '28px',
                  height: '28px',
                  borderRadius: '50%',
                  background: 'var(--btn-ghost-bg)',
                  border: 'none',
                  color: 'var(--text-main)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer'
                }}
              >
                <X size={15} />
              </button>
            </div>

            <div style={{ padding: '16px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '8px', marginBottom: '16px' }}>
                {[1, 2, 3, 4, 5, 6, 7, 8, 10, 12].map(num => (
                  <button
                    key={num}
                    onClick={() => handleConfirmPax(num)}
                    className="btn btn-ghost"
                    style={{
                      height: '46px',
                      borderRadius: '10px',
                      fontSize: '16px',
                      fontWeight: '800',
                      color: num === (paxSheetTable.pax || 2) ? '#2563eb' : 'var(--text-main)',
                      border: num === (paxSheetTable.pax || 2) ? '2px solid #3b82f6' : '1px solid var(--border-subtle)',
                      background: num === (paxSheetTable.pax || 2) ? 'rgba(59, 130, 246, 0.15)' : 'var(--btn-ghost-bg)'
                    }}
                  >
                    {num}
                  </button>
                ))}
              </div>

              <button
                onClick={() => handleConfirmPax(paxSheetTable.pax || 2)}
                className="btn btn-primary"
                style={{ width: '100%', height: '44px', fontSize: '14px' }}
              >
                <span>Continue with {paxSheetTable.pax || 2} Pax</span>
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
