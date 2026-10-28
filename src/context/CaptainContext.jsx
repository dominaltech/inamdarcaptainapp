import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '../services/supabaseClient';
import { soundEngine } from '../services/soundEngine';

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

      // 1. Tables
      const { data: tData } = await supabase.from('tables').select('*').order('id');
      if (tData) setTables(tData);

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
      const { data: kData } = await supabase.from('kots').select('*').in('status', ['PENDING', 'PREPARING', 'READY']).order('created_at', { ascending: false });
      if (kData) setKots(kData);

      const { data: oData } = await supabase.from('order_items').select('*').in('status', ['PENDING', 'PREPARING', 'READY']).order('created_at', { ascending: false });
      if (oData) setOrderItems(oData);
    } catch (err) {
      console.error('Error loading Supabase data:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Setup Real-time Subscriptions
  useEffect(() => {
    loadData();

    // Table channel
    const tablesChannel = supabase
      .channel('captain_tables_live')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'tables' }, payload => {
        if (payload.eventType === 'INSERT') {
          setTables(prev => [...prev.filter(t => t.id !== payload.new.id), payload.new]);
        } else if (payload.eventType === 'UPDATE') {
          setTables(prev => prev.map(t => (t.id === payload.new.id ? payload.new : t)));
        } else if (payload.eventType === 'DELETE') {
          setTables(prev => prev.filter(t => t.id !== payload.old.id));
        }
      })
      .subscribe();

    // Order items channel for READY food alert
    const itemsChannel = supabase
      .channel('captain_items_live')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'order_items' }, payload => {
        setOrderItems(prev => [payload.new, ...prev.filter(i => i.id !== payload.new.id)]);
      })
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'order_items' }, payload => {
        const updated = payload.new;
        setOrderItems(prev => prev.map(i => (i.id === updated.id ? updated : i)));

        // Food Ready Alert for Waiter Pickup
        if (updated.status === 'READY') {
          soundEngine.playFoodReadyChime();
          setReadyAlerts(prev => [
            {
              id: `${updated.id}-${Date.now()}`,
              itemId: updated.id,
              dish: updated.item_name,
              tableId: updated.table_id,
              qty: updated.qty,
              time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            },
            ...prev,
          ]);
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(tablesChannel);
      supabase.removeChannel(itemsChannel);
    };
  }, [loadData]);

  // Fire KOT to Kitchen
  const fireKot = useCallback(async ({ tableId, cartItems, section }) => {
    soundEngine.playTap();
    const currentTable = tables.find(t => t.id === tableId);
    const targetSection = section || currentTable?.section || 'AC';

    // 1. Fetch & Increment Counter
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

    // 2. Insert KOT Header
    const { data: newKot, error: kotErr } = await supabase
      .from('kots')
      .insert([
        {
          kot_number: nextKotNum,
          table_id: tableId,
          section: targetSection,
          waiter_name: currentWaiter.name,
          department: 'ALL',
          source: 'CAPTAIN_APP',
          status: 'PENDING',
        },
      ])
      .select()
      .single();

    if (kotErr) throw kotErr;

    // 3. Insert Line items (Split: Cook vs Pantry)
    const isAc = targetSection.toUpperCase().includes('AC');
    const itemsToInsert = cartItems.map(item => ({
      kot_id: newKot.id,
      kot_number: nextKotNum,
      table_id: tableId,
      item_code: item.code,
      item_name: item.name,
      qty: item.qty,
      rate: isAc ? item.ac_rate : item.hall_rate,
      amount: item.qty * (isAc ? item.ac_rate : item.hall_rate),
      category: item.category,
      category_order: item.category_order,
      customization: item.customization || '',
      department: item.is_kitchen ? 'KITCHEN' : 'PANTRY',
      is_staged: false,
      status: 'PENDING',
    }));

    await supabase.from('order_items').insert(itemsToInsert);

    // 4. Update Table state
    const currentKotNos = currentTable?.kot_nos || [];
    const updatedKotNos = [...currentKotNos, nextKotNum];

    await supabase
      .from('tables')
      .update({
        status: 'OCCUPIED',
        active_waiter: currentWaiter.name,
        kot_nos: updatedKotNos,
        updated_at: new Date().toISOString(),
      })
      .eq('id', tableId);

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
    if (status === 'AVAILABLE') payload.kot_nos = [];
    await supabase.from('tables').update(payload).eq('id', tableId);
    setTables(prev => prev.map(t => (t.id === tableId ? { ...t, status } : t)));
  }, []);

  const dismissReadyAlert = useCallback((id) => {
    setReadyAlerts(prev => prev.filter(a => a.id !== id));
  }, []);

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
    theme,
    toggleTheme,
    loadData
  };

  return <CaptainContext.Provider value={value}>{children}</CaptainContext.Provider>;
}

export function useCaptain() {
  const ctx = useContext(CaptainContext);
  if (!ctx) throw new Error('useCaptain must be used within CaptainProvider');
  return ctx;
}
