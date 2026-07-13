// models/User.js - Keep this for backward compatibility during migration
const { UserModel } = require('./supabaseClient');

// This acts as a wrapper to maintain compatibility with existing code
class User {
  static async findOne(query) {
    if (query.email) {
      return await UserModel.findByEmail(query.email);
    }
    if (query.loginId) {
      return await UserModel.findByLoginId(query.loginId);
    }
    if (query._id) {
      return await UserModel.findById(query._id);
    }
    return null;
  }
  
  static async findById(id) {
    return await UserModel.findById(id);
  }
  
  static async find(query = {}) {
    const page = query.page || 1;
    const limit = query.limit || 10;
    const search = query.search || '';
    return await UserModel.findAll(page, limit, search);
  }
  
  static async create(userData) {
    return await UserModel.create(userData);
  }
  
  static async findByIdAndUpdate(id, updates) {
    return await UserModel.update(id, updates);
  }
  
  static async findByIdAndDelete(id) {
    return await UserModel.delete(id);
  }
  
  // Instance methods for compatibility
  async comparePassword(password) {
    // This would need the actual user object
    return await UserModel.comparePassword(password, this.passwordHash);
  }
}

module.exports = User;