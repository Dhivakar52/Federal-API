// models/supabaseClient.js - COMPLETE VERSION

const { createClient } = require('@supabase/supabase-js');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials!');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

class UserModel {
  
  // Create new user
  static async create(userData) {
    const { name, email, loginId, password, role = 'user', designation = null } = userData;
    
    try {
      const salt = await bcrypt.genSalt(10);
      const passwordHash = await bcrypt.hash(password, salt);
      
      const { data, error } = await supabase
        .from('users')
        .insert({
          name: name.trim(),
          email: email.toLowerCase().trim(),
          login_id: loginId.trim(),
          password_hash: passwordHash,
          role: role || 'user',
          designation: designation || null
        })
        .select()
        .single();
      
      if (error) throw error;
      return data;
    } catch (error) {
      console.error('❌ Create error:', error);
      throw error;
    }
  }
  
  // Find user by email
  static async findByEmail(email) {
    try {
      console.log('  [DB] Finding by email:', email);
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('email', email.toLowerCase().trim())
        .maybeSingle();
      
      if (error) {
        console.error('  [DB] Error:', error.message);
        return null;
      }
      console.log('  [DB] Found:', data ? '✅ Yes' : '❌ No');
      return data;
    } catch (error) {
      console.error('❌ FindByEmail error:', error);
      return null;
    }
  }
  
  // Find user by loginId
  static async findByLoginId(loginId) {
    try {
      console.log('  [DB] Finding by login_id:', loginId);
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('login_id', loginId.toLowerCase().trim())
        .maybeSingle();
      
      if (error) {
        console.error('  [DB] Error:', error.message);
        return null;
      }
      console.log('  [DB] Found:', data ? '✅ Yes' : '❌ No');
      return data;
    } catch (error) {
      console.error('❌ FindByLoginId error:', error);
      return null;
    }
  }
  
  // Find user by ID
  static async findById(id) {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', id)
        .maybeSingle();
      
      if (error) {
        console.error('  [DB] Error:', error.message);
        return null;
      }
      return data;
    } catch (error) {
      console.error('❌ FindById error:', error);
      return null;
    }
  }
  
  // Update user
  static async update(id, updates) {
    try {
      if (updates.password) {
        const salt = await bcrypt.genSalt(10);
        updates.password_hash = await bcrypt.hash(updates.password, salt);
        delete updates.password;
      }
      
      if (updates.loginId) {
        updates.login_id = updates.loginId;
        delete updates.loginId;
      }
      
      const { data, error } = await supabase
        .from('users')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    } catch (error) {
      console.error('❌ Update error:', error);
      throw error;
    }
  }
  
  // ✅ Update last login - ADD THIS
  static async updateLastLogin(id) {
    try {
      const { data, error } = await supabase
        .from('users')
        .update({ last_login: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    } catch (error) {
      console.error('❌ updateLastLogin error:', error);
      throw error;
    }
  }
  
  // ✅ Update last logout - ADD THIS
  static async updateLastLogout(id) {
    try {
      const { data, error } = await supabase
        .from('users')
        .update({ last_logout: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    } catch (error) {
      console.error('❌ updateLastLogout error:', error);
      throw error;
    }
  }
  
  // Compare password
  static async comparePassword(plainPassword, hashedPassword) {
    if (!plainPassword || !hashedPassword) {
      console.error('❌ comparePassword: Missing arguments');
      return false;
    }
    try {
      return await bcrypt.compare(plainPassword, hashedPassword);
    } catch (error) {
      console.error('❌ comparePassword error:', error);
      return false;
    }
  }
  
  // Delete user
  static async delete(id) {
    try {
      const { error } = await supabase
        .from('users')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      return true;
    } catch (error) {
      console.error('❌ Delete error:', error);
      throw error;
    }
  }
  
  // Get all users with pagination
  static async findAll(page = 1, limit = 10, search = '') {
    try {
      let query = supabase
        .from('users')
        .select('*', { count: 'exact' });
      
      if (search) {
        query = query.or(`name.ilike.%${search}%,email.ilike.%${search}%,login_id.ilike.%${search}%`);
      }
      
      const start = (page - 1) * limit;
      const end = start + limit - 1;
      
      const { data, error, count } = await query
        .range(start, end)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      
      return {
        data,
        pagination: {
          page,
          limit,
          total: count,
          totalPages: Math.ceil(count / limit)
        }
      };
    } catch (error) {
      console.error('❌ findAll error:', error);
      throw error;
    }
  }
}

module.exports = { supabase, UserModel };