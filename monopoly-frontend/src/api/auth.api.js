import apiClient from './interceptor';
import { API_ENDPOINTS } from '../config/constants';

export const authAPI = {
  /**
   * Đăng nhập
   */
  login: async (credentials) => {
    console.log('📡 [authAPI] Login called');
    console.log('📡 [authAPI] Credentials:', { email: credentials.email });
    
    try {
      const response = await apiClient.post(API_ENDPOINTS.AUTH.LOGIN, credentials);
      
      console.log('✅ [authAPI] Login success:', response.data);
      
      // ✅ LƯU TOKEN VÀO LOCALSTORAGE
      if (response.data.success && response.data.token) {
        const token = response.data.token;
        const user = response.data.user;
        
        console.log('💾 [authAPI] Saving token to localStorage...');
        console.log('💾 [authAPI] Token (first 20 chars):', token.substring(0, 20) + '...');
        console.log('💾 [authAPI] User:', user);
        
        // ✅ LƯU CẢ 2 KEY ĐỂ ĐẢM BẢO
        localStorage.setItem('accessToken', token);
        localStorage.setItem('token', token);
        localStorage.setItem('user', JSON.stringify(user));
        
        // ✅ KIỂM TRA LẠI
        const savedToken = localStorage.getItem('accessToken');
        console.log('✅ [authAPI] Token saved successfully:', !!savedToken);
        console.log('✅ [authAPI] Saved token (first 20 chars):', savedToken?.substring(0, 20) + '...');
      }
      
      return response.data;
    } catch (error) {
      console.error('❌ [authAPI] Login error:', error);
      console.error('❌ [authAPI] Error response:', error.response?.data);
      throw error;
    }
  },

  /**
   * Đăng ký
   */
  register: async (userData) => {
    console.log('📡 [authAPI] Register called');
    
    try {
      const response = await apiClient.post(API_ENDPOINTS.AUTH.REGISTER, userData);
      
      console.log('✅ [authAPI] Register success:', response.data);
      
      // ✅ LƯU TOKEN SAU KHI ĐĂNG KÝ
      if (response.data.success && response.data.token) {
        const token = response.data.token;
        const user = response.data.user;
        
        localStorage.setItem('accessToken', token);
        localStorage.setItem('token', token);
        localStorage.setItem('user', JSON.stringify(user));
        
        console.log('✅ [authAPI] Token saved after register');
      }
      
      return response.data;
    } catch (error) {
      console.error('❌ [authAPI] Register error:', error);
      throw error;
    }
  },

  /**
   * Đăng xuất
   */
  logout: async () => {
    console.log('📡 [authAPI] Logout called');
    
    try {
      await apiClient.post(API_ENDPOINTS.AUTH.LOGOUT);
      
      // ✅ XÓA TẤT CẢ TOKEN
      localStorage.removeItem('accessToken');
      localStorage.removeItem('token');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('user');
      localStorage.removeItem('currentRoom');
      
      console.log('✅ [authAPI] Logout success, tokens cleared');
      
      return { success: true };
    } catch (error) {
      console.error('❌ [authAPI] Logout error:', error);
      
      // ✅ VẪN XÓA TOKEN DÙ API LỖI
      localStorage.removeItem('accessToken');
      localStorage.removeItem('token');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('user');
      
      throw error;
    }
  },

  /**
   * Refresh token
   */
  refreshToken: async () => {
    console.log('📡 [authAPI] Refresh token called');
    
    try {
      const refreshToken = localStorage.getItem('refreshToken');
      
      if (!refreshToken) {
        throw new Error('No refresh token');
      }
      
      const response = await apiClient.post(API_ENDPOINTS.AUTH.REFRESH, {
        refreshToken,
      });
      
      // ✅ LƯU TOKEN MỚI
      if (response.data.accessToken) {
        localStorage.setItem('accessToken', response.data.accessToken);
        localStorage.setItem('token', response.data.accessToken);
        
        console.log('✅ [authAPI] Token refreshed successfully');
      }
      
      return response.data;
    } catch (error) {
      console.error('❌ [authAPI] Refresh token error:', error);
      throw error;
    }
  },
};
