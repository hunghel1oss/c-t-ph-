/**
 * Local Storage Helper
 * Quản lý accessToken và refreshToken
 */

const STORAGE_KEYS = {
  ACCESS_TOKEN: 'monopoly_access_token',
  REFRESH_TOKEN: 'monopoly_refresh_token',
  USER: 'monopoly_user',
};

export const storage = {
  // Access Token
  getAccessToken() {
    return localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN);
  },
  
  setAccessToken(token) {
    localStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN, token);
  },
  
  removeAccessToken() {
    localStorage.removeItem(STORAGE_KEYS.ACCESS_TOKEN);
  },
  
  // Refresh Token
  getRefreshToken() {
    return localStorage.getItem(STORAGE_KEYS.REFRESH_TOKEN);
  },
  
  setRefreshToken(token) {
    localStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, token);
  },
  
  removeRefreshToken() {
    localStorage.removeItem(STORAGE_KEYS.REFRESH_TOKEN);
  },
  
  // User
  getUser() {
    const user = localStorage.getItem(STORAGE_KEYS.USER);
    return user ? JSON.parse(user) : null;
  },
  
  setUser(user) {
    localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(user));
  },
  
  removeUser() {
    localStorage.removeItem(STORAGE_KEYS.USER);
  },
  
  // Clear all
  clearAll() {
    this.removeAccessToken();
    this.removeRefreshToken();
    this.removeUser();
  },
};
