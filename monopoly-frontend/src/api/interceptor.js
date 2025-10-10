import axios from 'axios';

const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

console.log('🌍 [Interceptor] API baseURL:', apiClient.defaults.baseURL);

// ✅ REQUEST INTERCEPTOR
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
    console.log('🚀 [Interceptor] Data:', config.data);
    
    return config;
  },
  (error) => {
    console.error('❌ [Interceptor] Request error:', error);
    return Promise.reject(error);
  }
);

// ✅ RESPONSE INTERCEPTOR
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

    // ✅ XỬ LÝ 401 - KHÔNG TỰ ĐỘNG REDIRECT
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      console.log('🔄 [Interceptor] Got 401, attempting token refresh...');

      try {
        const refreshToken = localStorage.getItem('refreshToken');
        
        if (!refreshToken) {
          console.error('❌ [Interceptor] No refresh token, cannot refresh');
          throw new Error('No refresh token');
        }

        // Gọi API refresh token
        const response = await axios.post(
          `${apiClient.defaults.baseURL}/api/auth/refresh`,
          { refreshToken }
        );

        const { accessToken } = response.data;
        
        // ✅ LƯU TOKEN MỚI
        localStorage.setItem('accessToken', accessToken);
        localStorage.setItem('token', accessToken); // Lưu cả 2 key để đảm bảo

        console.log('✅ [Interceptor] Token refreshed successfully');

        // Retry request với token mới
        originalRequest.headers.Authorization = `Bearer ${accessToken}`;
        return apiClient(originalRequest);
        
      } catch (refreshError) {
        console.error('❌ [Interceptor] Refresh token failed:', refreshError);
        
        // ✅ CHỈ XÓA TOKEN, KHÔNG REDIRECT TỰ ĐỘNG
        localStorage.removeItem('accessToken');
        localStorage.removeItem('token');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('user');
        
        console.log('🚪 [Interceptor] Tokens cleared, but NOT redirecting (let app handle it)');
        
        // ✅ THROW ERROR ĐỂ APP XỬ LÝ
        return Promise.reject(new Error('AUTHENTICATION_REQUIRED'));
      }
    }

    return Promise.reject(error);
  }
);

export default apiClient;
