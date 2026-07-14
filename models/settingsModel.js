// models/settingsModel.js
const { supabase } = require('./supabaseClient');

class SettingsModel {
  
  // ✅ Get setting by key
  static async get(key) {
    try {
      const { data, error } = await supabase
        .from('settings')
        .select('value')
        .eq('key', key)
        .maybeSingle();
      
      if (error) throw error;
      return data?.value || null;
    } catch (error) {
      console.error(`❌ Error getting setting ${key}:`, error);
      return null;
    }
  }
  
  // ✅ Set/Update setting
  static async set(key, value, description = null) {
    try {
      const { data, error } = await supabase
        .from('settings')
        .upsert({ 
          key, 
          value, 
          description,
          updated_at: new Date().toISOString() 
        })
        .select()
        .single();
      
      if (error) throw error;
      return data;
    } catch (error) {
      console.error(`❌ Error setting ${key}:`, error);
      throw error;
    }
  }
  
  // ✅ Get all settings
  static async getAll() {
    try {
      const { data, error } = await supabase
        .from('settings')
        .select('*')
        .order('key');
      
      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('❌ Error getting all settings:', error);
      return [];
    }
  }
  
  // ✅ Delete setting
  static async delete(key) {
    try {
      const { error } = await supabase
        .from('settings')
        .delete()
        .eq('key', key);
      
      if (error) throw error;
      return true;
    } catch (error) {
      console.error(`❌ Error deleting ${key}:`, error);
      return false;
    }
  }
}

module.exports = { SettingsModel };