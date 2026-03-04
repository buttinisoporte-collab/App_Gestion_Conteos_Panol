import { getSupabase } from '../lib/supabase';
import { SettingsData } from '../types';

const SETTINGS_TABLE = 'app_settings';

export const settingsService = {
  async getSettings(): Promise<SettingsData | null> {
    try {
      const supabase = getSupabase();
      if (!supabase) return null;

      const { data, error } = await supabase
        .from(SETTINGS_TABLE)
        .select('*');

      if (error) throw error;

      if (!data || data.length === 0) return null;

      // Convert array of {key, value} to SettingsData object
      const settings: any = {};
      data.forEach((item: { key: string; value: any }) => {
        settings[item.key] = item.value;
      });

      return settings as SettingsData;
    } catch (error) {
      console.error('Error fetching settings from Supabase:', error);
      return null;
    }
  },

  async updateSetting(key: string, value: any): Promise<boolean> {
    try {
      const supabase = getSupabase();
      if (!supabase) return false;

      const { error } = await supabase
        .from(SETTINGS_TABLE)
        .upsert({ key, value }, { onConflict: 'key' });

      if (error) throw error;
      return true;
    } catch (error) {
      console.error(`Error updating setting ${key} in Supabase:`, error);
      return false;
    }
  },

  async updateAllSettings(settings: SettingsData): Promise<boolean> {
    try {
      const supabase = getSupabase();
      if (!supabase) return false;

      const updates = Object.entries(settings).map(([key, value]) => ({
        key,
        value,
      }));

      const { error } = await supabase
        .from(SETTINGS_TABLE)
        .upsert(updates, { onConflict: 'key' });

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error updating all settings in Supabase:', error);
      return false;
    }
  }
};
