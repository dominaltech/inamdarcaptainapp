import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { supabase } from '../services/supabaseClient';
import { soundEngine } from '../services/soundEngine';
import { getAllDishImages, saveDishImage, deleteDishImage, compressImage } from '../services/dishImageStore';

const CaptainContext = createContext(null);

export function CaptainProvider({ children }) {
  const [tables, setTables] = useState([]);
  const [menuItems, setMenuItems] = useState([]);
  const [staff, setStaff] = useState([]);
  const [dailyKotCounter, setDailyKotCounter] = useState(1);
  const [kots, setKots] = useState([]);
  const [orderItems, setOrderItems] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [readyAlerts, setReadyAlerts] = useState([]);
  const [isMuted, setIsMuted] = useState(false);
  const [dishImages, setDishImages] = useState({});

  // PWA Install State & Handlers
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [isPwaInstalled, setIsPwaInstalled] = useState(false);
  const [showIosInstallGuide, setShowIosInstallGuide] = useState(false);

  useEffect(() => {
    // Detect if running in standalone mode (already installed)
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true;
    if (isStandalone) {
      setIsPwaInstalled(true);
    }

    const handleBeforeInstallPrompt = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    const handleAppInstalled = () => {
      setIsPwaInstalled(true);
      setDeferredPrompt(null);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const installPwa = useCallback(async () => {
    soundEngine.playTap();
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const choice = await deferredPrompt.userChoice;
      if (choice && choice.outcome === 'accepted') {
        setIsPwaInstalled(true);
      }
      setDeferredPrompt(null);
    } else {
      const isIos = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
      if (isIos) {
        setShowIosInstallGuide(true);
      } else {
        alert('To install Inamdar Captain: Tap browser menu (⋮) and select "Install app" or "Add to Home screen".');
      }
    }
  }, [deferredPrompt]);

  // Load local dish images from IndexedDB
  useEffect(() => {
    getAllDishImages().then(imgs => {
      if (imgs) setDishImages(imgs);
    });
  }, []);

  const uploadDishImage = useCallback(async (dishCode, file) => {
    try {
      soundEngine.playTap();
      const dataUrl = await compressImage(file);
      await saveDishImage(dishCode, dataUrl);
      setDishImages(prev => ({ ...prev, [String(dishCode)]: dataUrl }));
      return true;
    } catch (err) {
      console.error('Failed to upload image:', err);
      return false;
    }
  }, []);

  const removeDishImage = useCallback(async (dishCode) => {
    try {
      soundEngine.playTap();
      await deleteDishImage(dishCode);
      setDishImages(prev => {
        const next = { ...prev };
        delete next[String(dishCode)];
        return next;
      });
      return true;
    } catch (err) {
      console.error('Failed to remove image:', err);
      return false;
    }
  }, []);

  const getTableCustomer = useCallback((tableId) => {
    const t = tables.find(x => x.id === tableId);
    if (t?.customer_name || t?.customer_phone) {
      return { name: t.customer_name || '', phone: t.customer_phone || '' };
    }
    const saved = localStorage.getItem(`inamdar_cust_${tableId}`);
    if (saved) {
      try { return JSON.parse(saved); } catch { /* Ignore malformed JSON */ }
    }
    if (t?.active_waiter && t.active_waiter.includes(' • ')) {
      const parts = t.active_waiter.split(' • ')[1];
      if (parts) {
        const match = parts.match(/^(.*?)(?:\s*\((.*?)\))?$/);
        if (match) {
          return { name: match[1]?.trim() || '', phone: match[2]?.trim() || '' };
        }
      }
    }
    return { name: '', phone: '' };
  }, [tables]);

  const setTableCustomer = useCallback(async (tableId, { name = '', phone = '' }) => {
    const cleanName = (name || '').trim();
    const cleanPhone = (phone || '').trim();
    if (cleanName || cleanPhone) {
      localStorage.setItem(`inamdar_cust_${tableId}`, JSON.stringify({ name: cleanName, phone: cleanPhone }));
    } else {
      localStorage.removeItem(`inamdar_cust_${tableId}`);
    }

    // Persist customer details directly to tables table in Supabase
    try {
      await supabase
        .from('tables')
        .update({ customer_name: cleanName, customer_phone: cleanPhone })
        .eq('id', tableId);
    } catch (err) {
      console.error('Error saving customer info to Supabase tables:', err);
    }

    setTables(prev =>
      prev.map(t => (t.id === tableId ? { ...t, customer_name: cleanName, customer_phone: cleanPhone } : t))
    );
  }, []);

  // Theme State: 'dark' (night) or 'light' (day)
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem('inamdar_theme') || 'dark';
  });

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('inamdar_theme', theme);
  }, [theme]);

  const toggleTheme = useCallback(() => {
    soundEngine.playTap();
    setTheme(prev => (prev === 'dark' ? 'light' : 'dark'));
  }, []);

  // Active waiter
  const [currentWaiter, setCurrentWaiter] = useState(() => {
    const saved = localStorage.getItem('inamdar_captain_waiter');
    return saved ? JSON.parse(saved) : { id: '4', name: 'AMIT (Waiter)', role: 'WAITER', pin: '1111' };
  });

  const selectWaiter = useCallback((waiter) => {
    setCurrentWaiter(waiter);
    localStorage.setItem('inamdar_captain_waiter', JSON.stringify(waiter));
    soundEngine.playTap();
  }, []);

  const toggleMute = useCallback(() => {
    setIsMuted(prev => {
      const next = !prev;
      soundEngine.setMuted(next);
      return next;
    });
  }, []);

  // Fetch all initial data from Supabase
  const loadData = useCallback(async () => {
    try {
      setIsLoading(true);

      // 1. Tables (Dine-in only: GENERAL & FAMILY AC; Parcel and Home Delivery excluded)
      // Once a bill is gone in unsettled/billed, show table as vacant (AVAILABLE)
      const { data: tData } = await supabase.from('tables').select('*').order('id');
      if (tData) {
        const dineInTables = tData
          .filter(t => {
            const sec = (t.section || '').toUpperCase();
            return sec !== 'PARCEL' && sec !== 'HOME DELIVERY';
          })
          .map(t => {
            if (t.status === 'BILLED' || t.status === 'UNSETTLED') {
              supabase.from('tables').update({
                status: 'AVAILABLE',
                kot_nos: [],
                active_waiter: null,
                customer_name: '',
                customer_phone: ''
              }).eq('id', t.id).then();
              return { ...t, status: 'AVAILABLE', kot_nos: [], active_waiter: null, customer_name: '', customer_phone: '' };
            }
            return t;
          });
        setTables(dineInTables);
      }

      // 2. Menu Items sorted by category_order, then code
      const { data: mData } = await supabase.from('menu_items').select('*').eq('is_available', true).order('category_order').order('code');
      if (mData) setMenuItems(mData);

      // 3. Staff Users
      const { data: sData } = await supabase.from('staff_users').select('*').eq('is_active', true);
      if (sData) setStaff(sData);

      // 4. Counter
      const { data: cData } = await supabase.from('pos_counters').select('counter_val').eq('counter_key', 'daily_kot_counter').single();
      if (cData?.counter_val) setDailyKotCounter(cData.counter_val);

      // 5. Active KOTs & Order Items
      const { data: kData } = await supabase
        .from('kots')
        .select('*')
        .in('status', ['PENDING', 'PREPARING', 'READY'])
        .order('created_at', { ascending: false });
      if (kData) setKots(kData);

      // Order items for active tables (including SERVED items so running table total reflects all ordered dishes)
      const todayStart = new Date();
      todayStart.setHours(0, 0, 0, 0);

      const { data: oData } = await supabase
        .from('order_items')
        .select('*')
        .in('status', ['PENDING', 'PREPARING', 'READY', 'SERVED'])
        .gte('created_at', todayStart.toISOString())
        .order('created_at', { ascending: false });

      if (oData) {
        setOrderItems(oData);
        // Pre-populate readyAlerts for dishes already marked READY by kitchen
        const initialReady = oData
          .filter(i => i.status === 'READY' && !i.is_cancelled)
          .map(i => ({
            id: `ready-${i.id}`,
            itemId: i.id,
            dish: i.item_name,
            tableId: i.table_id,
            qty: i.qty,
            time: new Date(i.created_at || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          }));
        setReadyAlerts(initialReady);
      }
    } catch (err) {
      console.error('Error loading Supabase data:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Setup Real-time Subscriptions
  useEffect(() => {
    loadData();

    // Consolidated single Real-time Hub for minimal egress & zero redundant writes
    const liveHub = supabase
      .channel('captain_live_hub')
      // 1. Tables listener
      .on('postgres_changes', { event: '*', schema: 'public', table: 'tables' }, payload => {
        if (payload.eventType === 'INSERT') {
          const sec = (payload.new.section || '').toUpperCase();
          if (sec !== 'PARCEL' && sec !== 'HOME DELIVERY') {
            const tbl = { ...payload.new };
            if (tbl.status === 'BILLED' || tbl.status === 'UNSETTLED') {
              tbl.status = 'AVAILABLE';
              tbl.kot_nos = [];
              tbl.active_waiter = null;
              tbl.customer_name = '';
              tbl.customer_phone = '';
            }
            setTables(prev => [...prev.filter(t => t.id !== tbl.id), tbl]);
          }
        } else if (payload.eventType === 'UPDATE') {
          const sec = (payload.new.section || '').toUpperCase();
          if (sec !== 'PARCEL' && sec !== 'HOME DELIVERY') {
            const tbl = { ...payload.new };
            if (tbl.status === 'BILLED' || tbl.status === 'UNSETTLED') {
              tbl.status = 'AVAILABLE';
              tbl.kot_nos = [];
              tbl.active_waiter = null;
              tbl.customer_name = '';
              tbl.customer_phone = '';
            }
            setTables(prev => prev.map(t => (t.id === tbl.id ? tbl : t)));
          } else {
            const delId = payload.new?.id || payload.old?.id;
            setTables(prev => prev.filter(t => t.id !== delId));
          }
        } else if (payload.eventType === 'DELETE') {
          const delId = payload.old?.id || payload.new?.id;
          if (delId) {
            setTables(prev => prev.filter(t => t.id !== delId));
          }
        }
      })
      // 2. Bills listener: Instantly vacate table locally without triggering duplicate database updates
      .on('postgres_changes', { event: '*', schema: 'public', table: 'bills' }, payload => {
        const tableId = payload.new?.table_id || payload.old?.table_id;
        if (tableId) {
          localStorage.removeItem(`inamdar_cust_${tableId}`);
          setTables(prev =>
            prev.map(t => (t.id === tableId ? { ...t, status: 'AVAILABLE', kot_nos: [], active_waiter: null, customer_name: '', customer_phone: '' } : t))
          );
        }
      })
      // 3. KOTs listener
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'kots' }, payload => {
        setKots(prev => [payload.new, ...prev.filter(k => k.id !== payload.new.id)]);
      })
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'kots' }, payload => {
        setKots(prev => prev.map(k => (k.id === payload.new.id ? payload.new : k)));
      })
      .on('postgres_changes', { event: 'DELETE', schema: 'public', table: 'kots' }, payload => {
        const delId = payload.old?.id;
        if (delId) setKots(prev => prev.filter(k => k.id !== delId));
      })
      // 4. Order items listener for READY food alert
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'order_items' }, payload => {
        setOrderItems(prev => [payload.new, ...prev.filter(i => i.id !== payload.new.id)]);
      })
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'order_items' }, payload => {
        const updated = payload.new;
        setOrderItems(prev => prev.map(i => (i.id === updated.id ? updated : i)));

        // Food Ready Alert for Waiter Pickup
        if (updated.status === 'READY') {
          soundEngine.playFoodReadyChime();
          setReadyAlerts(prev => {
            if (prev.some(a => a.itemId === updated.id)) return prev;
            return [
              {
                id: `ready-${updated.id}-${Date.now()}`,
                itemId: updated.id,
                dish: updated.item_name,
                tableId: updated.table_id,
                qty: updated.qty,
                time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
              },
              ...prev,
            ];
          });
        } else if (updated.status === 'SERVED') {
          setReadyAlerts(prev => prev.filter(a => a.itemId !== updated.id));
        }
      })
      .on('postgres_changes', { event: 'DELETE', schema: 'public', table: 'order_items' }, payload => {
        const delId = payload.old?.id;
        if (delId) {
          setOrderItems(prev => prev.filter(i => i.id !== delId));
          setReadyAlerts(prev => prev.filter(a => a.itemId !== delId));
        }
      })
      // 5. Menu items listener for live menu and category reordering updates
      .on('postgres_changes', { event: '*', schema: 'public', table: 'menu_items' }, async () => {
        const { data: updatedMenu } = await supabase
          .from('menu_items')
          .select('*')
          .eq('is_available', true)
          .order('category_order')
          .order('code');
        if (updatedMenu) setMenuItems(updatedMenu);
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'menu_categories' }, async () => {
        const { data: updatedMenu } = await supabase
          .from('menu_items')
          .select('*')
          .eq('is_available', true)
          .order('category_order')
          .order('code');
        if (updatedMenu) setMenuItems(updatedMenu);
      })
      .subscribe();

    return () => {
      supabase.removeChannel(liveHub);
    };
  }, [loadData]);

  // Fire KOT to Kitchen (with Customer Name & Phone Number support)
  const fireKot = useCallback(async ({ tableId, cartItems, section, customerName = '', customerPhone = '' }) => {
    soundEngine.playTap();
    const currentTable = tables.find(t => t.id === tableId);
    const targetSection = section || currentTable?.section || 'GENERAL';

    const cleanCustName = (customerName || '').trim();
    const cleanCustPhone = (customerPhone || '').trim();

    // Store customer details locally for this table
    if (cleanCustName || cleanCustPhone) {
      localStorage.setItem(`inamdar_cust_${tableId}`, JSON.stringify({ name: cleanCustName, phone: cleanCustPhone }));
    }

    // Formatted waiter & customer display for KOT tickets & Kitchen
    const custInfo = cleanCustName ? ` • ${cleanCustName}${cleanCustPhone ? ` (${cleanCustPhone})` : ''}` : '';
    const waiterDisplay = `${currentWaiter.name}${custInfo}`;

    // Fast-path: Atomic fire_kot RPC (Single ACID network transaction)
    const isAc = targetSection.toUpperCase().includes('AC');
    const rpcItems = cartItems.map(item => {
      const itemRate = isAc ? (item.ac_rate || item.hall_rate) : (item.hall_rate || item.ac_rate);
      return {
        item_code: item.code,
        item_name: item.name,
        qty: item.qty,
        rate: itemRate,
        amount: item.qty * itemRate,
        category: item.category || 'GENERAL',
        department: item.is_kitchen ? 'KITCHEN' : 'PANTRY',
      };
    });

    try {
      const { data: rpcData, error: rpcErr } = await supabase.rpc('fire_kot', {
        p_table_id: String(tableId),
        p_section: targetSection,
        p_waiter_name: currentWaiter.name,
        p_customer_name: cleanCustName,
        p_customer_phone: cleanCustPhone,
        p_items: rpcItems,
      });

      if (!rpcErr && rpcData && rpcData.success) {
        setDailyKotCounter(rpcData.kot_number + 1);
        setTables(prev =>
          prev.map(t =>
            t.id === tableId
              ? {
                  ...t,
                  status: 'OCCUPIED',
                  active_waiter: waiterDisplay,
                  customer_name: cleanCustName,
                  customer_phone: cleanCustPhone,
                  kot_nos: [...(t.kot_nos || []), rpcData.kot_number],
                }
              : t
          )
        );
        return { success: true, kotNumber: rpcData.kot_number };
      }
    } catch (rpcEx) {
      console.warn('Captain fire_kot RPC fallback to multi-query:', rpcEx);
    }

    // 1. Fetch & Increment Counter (Fallback)
    const { data: counter } = await supabase
      .from('pos_counters')
      .select('counter_val')
      .eq('counter_key', 'daily_kot_counter')
      .single();

    const nextKotNum = counter?.counter_val || dailyKotCounter;

    await supabase
      .from('pos_counters')
      .update({ counter_val: nextKotNum + 1 })
      .eq('counter_key', 'daily_kot_counter');

    setDailyKotCounter(nextKotNum + 1);

    // 2. Insert KOT Header with dedicated customer_name and customer_phone columns
    const { data: newKot, error: kotErr } = await supabase
      .from('kots')
      .insert([
        {
          kot_number: nextKotNum,
          table_id: tableId,
          section: targetSection,
          waiter_name: waiterDisplay,
          customer_name: cleanCustName,
          customer_phone: cleanCustPhone,
          department: 'ALL',
          source: 'CAPTAIN_APP',
          status: 'PENDING',
        },
      ])
      .select()
      .single();

    if (kotErr) throw kotErr;

    // 3. Insert Line items (Split: Cook vs Pantry)
    const itemsToInsert = cartItems.map(item => {
      const itemRate = isAc ? (item.ac_rate || item.hall_rate) : (item.hall_rate || item.ac_rate);
      return {
        kot_id: newKot.id,
        kot_number: nextKotNum,
        table_id: tableId,
        item_code: item.code,
        item_name: item.name,
        qty: item.qty,
        rate: itemRate,
        amount: item.qty * itemRate,
        category: item.category,
        category_order: item.category_order,
        customization: item.customization || '',
        department: item.is_kitchen ? 'KITCHEN' : 'PANTRY',
        is_staged: false,
        status: 'PENDING',
      };
    });

    await supabase.from('order_items').insert(itemsToInsert);

    // 4. Update Table state with customer details
    const currentKotNos = currentTable?.kot_nos || [];
    const updatedKotNos = [...currentKotNos, nextKotNum];

    await supabase
      .from('tables')
      .update({
        status: 'OCCUPIED',
        active_waiter: waiterDisplay,
        customer_name: cleanCustName,
        customer_phone: cleanCustPhone,
        kot_nos: updatedKotNos,
        updated_at: new Date().toISOString(),
      })
      .eq('id', tableId);

    setTables(prev =>
      prev.map(t =>
        t.id === tableId
          ? {
              ...t,
              status: 'OCCUPIED',
              active_waiter: waiterDisplay,
              customer_name: cleanCustName,
              customer_phone: cleanCustPhone,
              kot_nos: updatedKotNos,
            }
          : t
      )
    );

    return { success: true, kotNumber: nextKotNum };
  }, [tables, dailyKotCounter, currentWaiter]);

  const updateTablePax = useCallback(async (tableId, pax) => {
    soundEngine.playTap();
    await supabase.from('tables').update({ pax }).eq('id', tableId);
    setTables(prev => prev.map(t => (t.id === tableId ? { ...t, pax } : t)));
  }, []);

  const setTableStatus = useCallback(async (tableId, status) => {
    soundEngine.playTap();
    const payload = { status };
    if (status === 'AVAILABLE') {
      payload.kot_nos = [];
      payload.active_waiter = null;
      payload.customer_name = '';
      payload.customer_phone = '';
      localStorage.removeItem(`inamdar_cust_${tableId}`);
    }
    await supabase.from('tables').update(payload).eq('id', tableId);
    setTables(prev => prev.map(t => (t.id === tableId ? { ...t, ...payload } : t)));
  }, []);

  const dismissReadyAlert = useCallback((id) => {
    setReadyAlerts(prev => prev.filter(a => a.id !== id));
  }, []);

  const clearAllAlerts = useCallback(() => {
    soundEngine.playTap();
    setReadyAlerts([]);
  }, []);

  // Mark single food alert as Picked Up / Served (Kept for background data sync)
  const markPickedUp = useCallback(async (alert) => {
    soundEngine.playTap();
    setReadyAlerts(prev => prev.filter(a => a.id !== alert.id && (alert.itemId ? a.itemId !== alert.itemId : true)));

    if (alert.itemId) {
      try {
        await supabase
          .from('order_items')
          .update({ status: 'SERVED' })
          .eq('id', alert.itemId);

        setOrderItems(prev =>
          prev.map(i => (i.id === alert.itemId ? { ...i, status: 'SERVED' } : i))
        );
      } catch (err) {
        console.error('Error marking item served:', err);
      }
    }
  }, []);

  // Mark all ready food alerts as Picked Up / Served
  const markAllPickedUp = useCallback(async () => {
    soundEngine.playTap();
    const currentAlerts = [...readyAlerts];
    setReadyAlerts([]);

    const itemIds = currentAlerts.map(a => a.itemId).filter(Boolean);
    if (itemIds.length > 0) {
      try {
        await supabase
          .from('order_items')
          .update({ status: 'SERVED' })
          .in('id', itemIds);

        setOrderItems(prev =>
          prev.map(i => (itemIds.includes(i.id) ? { ...i, status: 'SERVED' } : i))
        );
      } catch (err) {
        console.error('Error marking all items served:', err);
      }
    }
  }, [readyAlerts]);

  const value = {
    tables,
    menuItems,
    staff,
    currentWaiter,
    selectWaiter,
    isLoading,
    isMuted,
    toggleMute,
    fireKot,
    orderItems,
    kots,
    updateTablePax,
    setTableStatus,
    readyAlerts,
    dismissReadyAlert,
    clearAllAlerts,
    markPickedUp,
    markAllPickedUp,
    theme,
    toggleTheme,
    loadData,
    deferredPrompt,
    isPwaInstalled,
    installPwa,
    showIosInstallGuide,
    setShowIosInstallGuide,
    dishImages,
    uploadDishImage,
    removeDishImage,
    getTableCustomer,
    setTableCustomer
  };

  return <CaptainContext.Provider value={value}>{children}</CaptainContext.Provider>;
}

export function useCaptain() {
  const ctx = useContext(CaptainContext);
  if (!ctx) throw new Error('useCaptain must be used within CaptainProvider');
  return ctx;
}
