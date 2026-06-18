/**
 * SUPABASE DATABASE SETUP (SQL)
 * ----------------------------
 * To enable cloud sync, run the following SQL in your Supabase SQL Editor:
 * 
 * -- 1. Create the data table
 * CREATE TABLE IF NOT EXISTS public.dps_data (
 *     owner_id UUID PRIMARY KEY,
 *     data JSONB NOT NULL DEFAULT '{}'::jsonb,
 *     updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
 * );
 * 
 * -- 2. Create the shares table
 * CREATE TABLE IF NOT EXISTS public.dps_shares (
 *     id TEXT PRIMARY KEY,
 *     owner_id UUID,
 *     owner_name TEXT,
 *     type TEXT,
 *     title TEXT,
 *     payload JSONB,
 *     created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
 * );
 * 
 * -- 3. Create the backups table
 * CREATE TABLE IF NOT EXISTS public.dps_backups (
 *     id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
 *     owner_id UUID NOT NULL,
 *     data JSONB NOT NULL,
 *     type TEXT DEFAULT 'Manual',
 *     timestamp TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
 * );
 * 
 * -- 4. Enable RLS
 * ALTER TABLE public.dps_data ENABLE ROW LEVEL SECURITY;
 * ALTER TABLE public.dps_shares ENABLE ROW LEVEL SECURITY;
 * ALTER TABLE public.dps_backups ENABLE ROW LEVEL SECURITY;
 * 
 * -- 5. RLS Policies
 * CREATE POLICY "Users manage their own data" ON public.dps_data FOR ALL USING (auth.uid() = owner_id);
 * CREATE POLICY "Anyone reads shares" ON public.dps_shares FOR SELECT USING (true);
 * CREATE POLICY "Users insert their shares" ON public.dps_shares FOR INSERT WITH CHECK (auth.uid() = owner_id);
 * CREATE POLICY "Users manage their own backups" ON public.dps_backups FOR ALL USING (auth.uid() = owner_id);
 * 
 * -- 6. Enable Realtime
 * ALTER PUBLICATION supabase_realtime ADD TABLE dps_data;
 */

import { createClient } from '@supabase/supabase-js';

// Global connection state
let lastSyncStatus = false;
let isConfigCheckInProgress = false;

// @ts-ignore
let supabaseUrlRaw = import.meta.env.VITE_SUPABASE_URL || import.meta.env.NEXT_PUBLIC_SUPABASE_URL || import.meta.env.SUPABASE_URL || '';
if (supabaseUrlRaw) {
  if (!supabaseUrlRaw.startsWith('http')) {
    supabaseUrlRaw = `https://${supabaseUrlRaw}`;
  }
  supabaseUrlRaw = supabaseUrlRaw.replace(/\/+$/, '');
}
const supabaseUrl = supabaseUrlRaw || undefined;
// @ts-ignore
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || import.meta.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || import.meta.env.SUPABASE_ANON_KEY;

const isConfigured = !!supabaseUrlRaw && !!supabaseAnonKey && !supabaseAnonKey.includes('dummy');

// Create a single supabase client for interacting with your database
// Default fallback is ONLY for initial landing page if no keys provided at all
export const supabase = createClient(
  supabaseUrl || 'https://kugvbcwrjzoxkabpjvcr.supabase.co', 
  supabaseAnonKey || 'dummy-key'
);

if (!isConfigured) {
  console.warn("Supabase is NOT fully configured. Sync features will be disabled. Ensure VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY are set in your environment variables/Vercel.");
}

export const getSupabaseProjectId = () => {
  if (!supabaseUrl || !isConfigured) return 'kugvbcwrjzoxkabpjvcr (Public Fallback)'; 
  try {
    return new URL(supabaseUrl).hostname.split('.')[0];
  } catch (e) { return 'kugvbcwrjzoxkabpjvcr (Public Fallback)'; }
};

export const getSupabaseAuthProvidersUrl = () => {
  const proj = getSupabaseProjectId();
  return `https://supabase.com/dashboard/project/${proj}/auth/providers`;
};

export const isSupabaseConfigured = () => isConfigured;

export const checkSupabaseConnection = async () => {
    if (!isConfigured || isConfigCheckInProgress) return lastSyncStatus;
    isConfigCheckInProgress = true;
    try {
        const { error } = await supabase.from('dps_data').select('updated_at', { count: 'exact', head: true }).limit(1);
        lastSyncStatus = !error;
        if (error) {
            console.warn("Supabase check failed:", error.message, error.hint || "");
            if (error.message.includes("does not exist")) {
                console.error("CRITICAL: 'dps_data' table missing! Please run the SQL setup script in the Supabase SQL Editor.");
            }
        }
        return lastSyncStatus;
    } catch (e: any) {
        console.error("Supabase connection exception:", e.message);
        lastSyncStatus = false;
        return false;
    } finally {
        isConfigCheckInProgress = false;
    }
};

export const logOut = async () => {
  if (!isConfigured) return;
  await supabase.auth.signOut();
};

export const subscribeToData = (userId: string, onUpdate: (data: any) => void, onError?: () => void) => {
  if (!isConfigured) {
    if (onError) onError();
    return () => {};
  }

  const subscription = supabase
    .channel(`dps_data_changes_${userId}`)
    .on('postgres_changes', { event: '*', schema: 'public', table: 'dps_data', filter: `owner_id=eq.${userId}` }, (payload) => {
        if (payload.new) onUpdate((payload.new as any).data);
    })
    .subscribe();

  fetchData(userId).then(data => {
    if (data) onUpdate(data);
    else if (onError) onError();
  }).catch(() => { if (onError) onError(); });

  return () => { supabase.removeChannel(subscription); };
};

export const fetchData = async (userId: string) => {
  if (!isConfigured) return null;
  try {
    const { data: record, error } = await supabase.from('dps_data').select('data').eq('owner_id', userId).single();
    if (error && error.code !== 'PGRST116') {
      console.error("Supabase Fetch Error:", error.message);
      return null;
    }
    lastSyncStatus = !error || error.code === 'PGRST116';
    return record?.data || null;
  } catch (error) { return null; }
};

export const saveData = async (userId: string, dataState: any) => {
  if (!isConfigured) return;
  
  try {
    const { error } = await supabase.from('dps_data').upsert({ 
      owner_id: userId, 
      data: dataState, 
      updated_at: new Date().toISOString() 
    }, { onConflict: 'owner_id' });
    
    if (error) {
      console.error("Supabase Save Error:", error.message);
    } else {
      console.log("Supabase Cloud Sync: Success ✅");
    }
    lastSyncStatus = !error;
  } catch (error) {
    console.error(error);
  }
};

export const uploadFile = async (userId: string, file: File): Promise<string | null> => {
  if (!isConfigured) return null;
  try {
    const fileExt = file.name.split('.').pop();
    const fileName = `${userId}/${Math.random().toString(36).substring(2)}_${Date.now()}.${fileExt}`;
    const { error } = await supabase.storage.from('attachments').upload(fileName, file);
    if (error) return null;
    return supabase.storage.from('attachments').getPublicUrl(fileName).data.publicUrl;
  } catch (err) { return null; }
};

export const deleteFile = async (path: string) => {
  if (!isConfigured) return;
  const filePath = path.split('/storage/v1/object/public/attachments/')[1];
  if (filePath) await supabase.storage.from('attachments').remove([filePath]);
};

export const saveTopic = async (...args: any[]) => {};
export const deleteStudent = async (...args: any[]) => {};
export const saveStudent = async (...args: any[]) => {};
export const deleteTopic = async (...args: any[]) => {};
export const saveTopicsBulk = async (...args: any[]) => {};
export const saveAttendance = async (...args: any[]) => {};
export const saveDailyNote = async (...args: any[]) => {};
export const saveHabitCompletionBulk = async (...args: any[]) => {};
export const saveHabitList = async (...args: any[]) => {};
export const deleteHabit = async (...args: any[]) => {};
export const saveHabitCompletion = async (...args: any[]) => {};
export const saveJournalEntry = async (...args: any[]) => {};
export const saveExpense = async (...args: any[]) => {};

export const getSharedNote = async (shareId: string) => {
  if (!isConfigured) return null;
  const { data, error } = await supabase.from('dps_shares').select('*').eq('id', shareId).single();
  return error ? null : data;
};

export const createSharedNote = async (userId: string, ownerName: string, type: string, title: string, payload: any) => {
  if (!isConfigured) throw new Error("Sync not configured");
  const id = Math.random().toString(36).substring(2, 12);
  const { error } = await supabase.from('dps_shares').insert({ id, owner_id: userId, owner_name: ownerName, type, title, payload, created_at: new Date().toISOString() });
  if (error) throw error;
  return id;
};

export const getCloudBackups = async (userId: string) => {
  if (!isConfigured) return [];
  try {
    const { data, error } = await supabase
      .from('dps_backups')
      .select('*')
      .eq('owner_id', userId)
      .order('timestamp', { ascending: false });
    
    if (error) return [];
    return data || [];
  } catch (err) {
    return [];
  }
};

export const createCloudBackup = async (userId: string, data: any) => {
  if (!isConfigured) return;
  try {
    const { error } = await supabase
      .from('dps_backups')
      .insert({
        owner_id: userId,
        data: data,
        type: 'Manual',
        timestamp: new Date().toISOString()
      });
    if (error) throw error;
  } catch (err) {
    console.error("Backup failed", err);
    throw err;
  }
};
export const getSyncStatus = () => lastSyncStatus;

