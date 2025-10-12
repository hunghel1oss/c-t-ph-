import axios from 'axios';
import toast from 'react-hot-toast';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

const apiClient = axios.create({
  baseURL: API_URL,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  },
});

console.log('🌍 [Interceptor] API baseURL:', apiClient.defaults.baseURL);

// ========================================
// REQUEST INTERCEPTOR
// ========================================
apiClient.interceptors.request.use(
  (config) => {
    // ✅ ĐỌC TOKEN TỪ NHIỀU KEY (ưu tiên accessToken)
    const token = localStorage.getItem('accessToken') || 
                  localStorage.getItem('token') ||
                  localStorage.getItem('authToken');
    
    console.log('🚀 [Interceptor] Request starting...');
    console.log('🚀 [Interceptor] Method:', config.method?.toUpperCase());
    console.log('🚀 [Interceptor] URL:', config.url);
    console.log('🚀 [Interceptor] Full URL:', `${config.baseURL}${config.url}`);
    console.log('🚀 [Interceptor] Token exists:', !!token);
    
    if (token) {
      // ✅ LOG TOKEN ĐỂ DEBUG (chỉ 20 ký tự đầu)
      console.log('🔑 [Interceptor] Token (first 20 chars):', token.substring(0, 20) + '...');
      config.headers.Authorization = `Bearer ${token}`;
    } else {
      console.warn('⚠️ [Interceptor] No token found!');
      console.warn('⚠️ [Interceptor] localStorage keys:', Object.keys(localStorage));
    }
    
    console.log('🚀 [Interceptor] Headers:', config.headers);
    
    // ✅ CHỈ LOG DATA NẾU KHÔNG PHẢI FILE UPLOAD
    if (config.data && !(config.data instanceof FormData)) {
      console.log('🚀 [Interceptor] Data:', config.data);
    }
    
    return config;
  },
  (error) => {
    console.error('❌ [Interceptor] Request error:', error);
    return Promise.reject(error);
  }
);

// ========================================
// RESPONSE INTERCEPTOR
// ========================================
apiClient.interceptors.response.use(
  (response) => {
    console.log('✅ [Interceptor] Response received');
    console.log('✅ [Interceptor] URL:', response.config.url);
    console.log('✅ [Interceptor] Status:', response.status);
    console.log('✅ [Interceptor] Data:', response.data);
    
    return response;
  },
  async (error) => {
    const originalRequest = error.config;

    console.error('❌ [Interceptor] Response error');
    console.error('❌ [Interceptor] URL:', error.config?.url);
    console.error('❌ [Interceptor] Status:', error.response?.status);
    console.error('❌ [Interceptor] Message:', error.response?.data?.message || error.message);
    console.error('❌ [Interceptor] Full response:', error.response?.data);

    // ========================================
    // XỬ LÝ 401 - UNAUTHORIZED (TOKEN HẾT HẠN)
    // ========================================
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      console.log('🔄 [Interceptor] Got 401, attempting token refresh...');

      try {
        const refreshToken = localStorage.getItem('refreshToken');
        
        if (!refreshToken) {
          console.error('❌ [Interceptor] No refresh token, cannot refresh');
          throw new Error('No refresh token');
        }

        // ✅ GỌI API REFRESH TOKEN
        const response = await axios.post(
          `${apiClient.defaults.baseURL}/api/auth/refresh`,
          { refreshToken },
          {
            headers: {
              'Content-Type': 'application/json'
            }
          }
        );

        const { accessToken, token: newToken } = response.data;
        const finalToken = accessToken || newToken;
        
        if (!finalToken) {
          throw new Error('No token in refresh response');
        }

        // ✅ LƯU TOKEN MỚI
        localStorage.setItem('accessToken', finalToken);
        localStorage.setItem('token', finalToken); // Lưu cả 2 key để đảm bảo

        console.log('✅ [Interceptor] Token refreshed successfully');

        // ✅ RETRY REQUEST VỚI TOKEN MỚI
        originalRequest.headers.Authorization = `Bearer ${finalToken}`;
        return apiClient(originalRequest);
        
      } catch (refreshError) {
        console.error('❌ [Interceptor] Refresh token failed:', refreshError);
        
        // ✅ XÓA TOKEN VÀ REDIRECT VỀ LOGIN
        localStorage.removeItem('accessToken');
        localStorage.removeItem('token');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('user');
        
        toast.error('Phiên đăng nhập hết hạn, vui lòng đăng nhập lại');
        
        // ✅ REDIRECT VỀ LOGIN
        setTimeout(() => {
          window.location.href = '/login';
        }, 1000);
        
        return Promise.reject(new Error('AUTHENTICATION_REQUIRED'));
      }
    }

    // ========================================
    // XỬ LÝ CÁC LỖI KHÁC
    // ========================================
    
    // ✅ 404 - NOT FOUND
    if (error.response?.status === 404) {
      const message = error.response?.data?.message || 'Không tìm thấy tài nguyên';
      toast.error(message);
    }

    // ✅ 400 - BAD REQUEST
    if (error.response?.status === 400) {
      const message = error.response?.data?.message || 'Yêu cầu không hợp lệ';
      toast.error(message);
    }

    // ✅ 403 - FORBIDDEN
    if (error.response?.status === 403) {
      const message = error.response?.data?.message || 'Bạn không có quyền truy cập';
      toast.error(message);
    }

    // ✅ 500 - SERVER ERROR
    if (error.response?.status === 500) {
      toast.error('Lỗi server, vui lòng thử lại sau');
    }

    // ✅ NETWORK ERROR
    if (error.message === 'Network Error') {
      toast.error('Lỗi kết nối mạng, vui lòng kiểm tra internet');
    }

    // ✅ TIMEOUT
    if (error.code === 'ECONNABORTED') {
      toast.error('Yêu cầu quá lâu, vui lòng thử lại');
    }

    return Promise.reject(error);
  }
);

export default apiClient;
